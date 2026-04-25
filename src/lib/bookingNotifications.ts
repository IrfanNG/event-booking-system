import { format } from "date-fns";
import net from "node:net";
import tls from "node:tls";
import dns from "node:dns";
import { randomUUID } from "node:crypto";
import { formatMoney, resolveBookingFinance } from "@/lib/finance";
import { getBookingStatus, normalizeDate } from "@/lib/bookingNormalization";
import type { Booking, BookingSlot, NormalizableDate } from "@/lib/booking";

export type BookingNotificationEvent = "created" | "approved" | "rejected" | "cancelled" | "rescheduled";

export type BookingNotificationResult = {
  event: BookingNotificationEvent;
  status: "sent" | "skipped" | "failed";
  messageId?: string;
  reason?: string;
};

type BookingNotificationInput = {
  event: BookingNotificationEvent;
  booking: Booking;
  previousBooking?: Booking;
  replacementBooking?: Booking;
  reason?: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
  replyTo?: string;
  appUrl: string;
};

type SmtpResponse = {
  code: number;
  message: string;
};

const slotLabels: Record<BookingSlot, string> = {
  full: "Full Day",
  morning: "Morning",
  evening: "Evening",
};

const eventMessages: Record<BookingNotificationEvent, string> = {
  created: "Your booking request has been received and is now pending review.",
  approved: "Your booking has been approved.",
  rejected: "Your booking has been rejected.",
  cancelled: "Your booking has been cancelled.",
  rescheduled: "Your booking has been rescheduled.",
};

const eventSubjects: Record<BookingNotificationEvent, string> = {
  created: "Booking received",
  approved: "Booking approved",
  rejected: "Booking rejected",
  cancelled: "Booking cancelled",
  rescheduled: "Booking rescheduled",
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatBookingDate = (value: unknown) => {
  const date = normalizeDate(value as NormalizableDate);
  return date ? format(date, "PPP") : "TBD";
};

const getTrackUrl = () => {
  // If we are on Vercel, prioritize the Vercel URL directly to avoid localhost issues
  if (process.env.VERCEL_URL) {
    const finalUrl = `https://${process.env.VERCEL_URL}/track`;
    console.log(`[Notification] Production Detected. Using Vercel URL: ${finalUrl}`);
    return finalUrl;
  }

  // Fallback chain for other environments (Local/Custom)
  const baseUrl = (
    process.env.APP_URL || 
    process.env.NEXT_PUBLIC_SITE_URL || 
    "http://localhost:3000"
  ).trim();
  
  const finalUrl = `${baseUrl.replace(/\/$/, "")}/track`;
  console.log(`[Notification] Non-Vercel environment. Using: ${finalUrl}`);
  return finalUrl;
};

const getEhloName = (appUrl: string) => {
  try {
    return new URL(appUrl).hostname || "localhost";
  } catch {
    return "localhost";
  }
};

const getSmtpConfig = (): SmtpConfig | null => {
  const host = process.env.SMTP_HOST?.trim();
  const from = process.env.SMTP_FROM_EMAIL?.trim();

  if (!host || !from) return null;

  const parsedPort = Number.parseInt(process.env.SMTP_PORT ?? "", 10);
  const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 465;

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    user: process.env.SMTP_USER?.trim() || undefined,
    pass: (process.env.SMTP_PASS?.trim() || "").replace(/\s+/g, ""),
    from: process.env.SMTP_FROM_NAME?.trim() ? `${process.env.SMTP_FROM_NAME.trim()} <${from}>` : from,
    replyTo: process.env.SMTP_REPLY_TO?.trim() || undefined,
    appUrl: getTrackUrl(),
  };
};

const buildMimeMessage = (input: BookingNotificationInput, config: SmtpConfig) => {
  const boundary = `booking_${randomUUID().replace(/-/g, "")}`;
  const textBody = buildPlainText(input).replace(/\n/g, "\r\n");
  const htmlBody = buildHtml(input).replace(/\n/g, "\r\n");

  return [
    `From: ${config.from}`,
    `To: ${input.booking.customer.email || input.booking.customer.normalizedEmail}`,
    `Subject: ${eventSubjects[input.event]}: ${input.booking.referenceId}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    config.replyTo ? `Reply-To: ${config.replyTo}` : null,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    textBody,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    htmlBody,
    "",
    `--${boundary}--`,
    "",
  ].filter(Boolean).join("\r\n");
};

const readSmtpResponse = (socket: net.Socket | tls.TLSSocket) =>
  new Promise<SmtpResponse>((resolve, reject) => {
    let buffer = "";
    const handleData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      if (lines.length === 0) return;
      const lastLine = lines[lines.length - 1];
      const match = lastLine.match(/^(\d{3})([ -])(.*)$/);
      if (!match || match[2] === "-") return;
      socket.off("data", handleData);
      socket.off("error", reject);
      resolve({ code: Number.parseInt(match[1], 10), message: lines.join("\n") });
    };
    socket.on("data", handleData);
    socket.on("error", (err) => {
        socket.off("data", handleData);
        reject(err);
    });
  });

const sendSmtpCommand = async (socket: net.Socket | tls.TLSSocket, command: string) => {
  socket.write(`${command}\r\n`);
  return readSmtpResponse(socket);
};

const resolveIpv4 = async (hostname: string): Promise<string> => {
    try {
        console.log(`[Notification] Looking up IPv4 for ${hostname}...`);
        const addresses = await new Promise<string[]>((resolve, reject) => {
            dns.resolve4(hostname, (err, addr) => {
                if (err) reject(err); else resolve(addr);
            });
        });
        if (addresses.length > 0) return addresses[0];
        throw new Error("No A records found");
    } catch (e) {
        console.warn(`[Notification] dns.resolve4 failed, trying dns.lookup: ${hostname}`);
        return new Promise<string>((resolve, reject) => {
            dns.lookup(hostname, { family: 4 }, (err, address) => {
                if (err) reject(err); else if (!address) reject(new Error("Lookup returned empty")); else resolve(address);
            });
        });
    }
};

const attemptSmtpTransaction = async (config: SmtpConfig, input: BookingNotificationInput, port: number, secure: boolean) => {
    const resolvedIp = await resolveIpv4(config.host);
    console.log(`[Notification] Connecting to ${config.host} (${resolvedIp}:${port}, Secure: ${secure})...`);
    
    let socket: any = null;
    try {
        const options = { host: resolvedIp, port, timeout: 20000, servername: config.host, rejectUnauthorized: false };
        
        socket = await new Promise((resolve, reject) => {
            const s = (secure || port === 465) 
                ? tls.connect(options, () => resolve(s))
                : net.connect(options, () => resolve(s));
            s.once("error", reject);
            s.once("timeout", () => { s.destroy(); reject(new Error("Timeout")); });
        });

        console.log(`[Notification] ${secure ? 'TLS' : 'TCP'} connected.`);
        
        let res = await readSmtpResponse(socket);
        if (res.code !== 220) throw new Error(`Greeting failed: ${res.message}`);

        await sendSmtpCommand(socket, `EHLO ${getEhloName(config.appUrl)}`);

        if (port === 587 && !secure) {
            console.log("[Notification] Upgrading to STARTTLS...");
            res = await sendSmtpCommand(socket, "STARTTLS");
            if (res.code !== 220) throw new Error(`STARTTLS failed: ${res.message}`);
            socket = tls.connect({ socket, servername: config.host, rejectUnauthorized: false });
            await sendSmtpCommand(socket, `EHLO ${getEhloName(config.appUrl)}`);
        }

        if (config.user && config.pass) {
            console.log("[Notification] Authenticating...");
            await sendSmtpCommand(socket, "AUTH LOGIN");
            await sendSmtpCommand(socket, Buffer.from(config.user).toString("base64"));
            res = await sendSmtpCommand(socket, Buffer.from(config.pass).toString("base64"));
            if (res.code !== 235) throw new Error(`AUTH failed: ${res.message}`);
        }

        await sendSmtpCommand(socket, `MAIL FROM:<${config.from.match(/<([^>]+)>/)?.[1] ?? config.from}>`);
        await sendSmtpCommand(socket, `RCPT TO:<${input.booking.customer.email || input.booking.customer.normalizedEmail}>`);
        
        res = await sendSmtpCommand(socket, "DATA");
        if (res.code !== 354) throw new Error(`DATA failed: ${res.message}`);

        socket.write(`${buildMimeMessage(input, config)}\r\n.\r\n`);
        res = await readSmtpResponse(socket);
        if (res.code !== 250) throw new Error(`Send failed: ${res.message}`);

        await sendSmtpCommand(socket, "QUIT");
        return { success: true, messageId: res.message };
    } finally {
        if (socket) socket.end();
    }
};

export async function sendBookingNotification(input: BookingNotificationInput): Promise<BookingNotificationResult> {
  const config = getSmtpConfig();
  if (!config) return { event: input.event, status: "skipped", reason: "Config missing" };

  try {
    // Attempt 1: Default config (Usually 465)
    try {
        const result = await attemptSmtpTransaction(config, input, config.port, config.secure);
        console.log("[Notification] SUCCESS! Email sent.");
        return { event: input.event, status: "sent", messageId: result.messageId };
    } catch (err: any) {
        console.warn(`[Notification] First attempt (Port ${config.port}) failed: ${err.message}. Trying fallback...`);
        
        // Attempt 2: Fallback (Try 587 if 465 failed, or vice versa)
        const fallbackPort = config.port === 465 ? 587 : 465;
        const fallbackSecure = fallbackPort === 465;
        const result = await attemptSmtpTransaction(config, input, fallbackPort, fallbackSecure);
        
        console.log(`[Notification] SUCCESS! Email sent on fallback Port ${fallbackPort}.`);
        return { event: input.event, status: "sent", messageId: result.messageId };
    }
  } catch (error: any) {
    console.error("[Notification] ALL SMTP ATTEMPTS FAILED:", error.message);
    return { event: input.event, status: "failed", reason: error.message };
  }
}

const buildPlainText = (input: BookingNotificationInput) => {
  const finance = resolveBookingFinance(input.booking);
  const scheduleLines = Object.entries(input.booking.reservation.dailySchedule ?? input.booking.dailySchedule ?? {})
    .map(([d, s]) => `${formatBookingDate(d)} - ${slotLabels[s as BookingSlot] || s}`);
  
  return [
    `Hi ${input.booking.customer.name},`,
    "",
    eventMessages[input.event],
    `Ref: ${input.booking.referenceId}`,
    `Venue: ${input.booking.venueName}`,
    `Schedule:\n${scheduleLines.join("\n")}`,
    `Total: ${formatMoney(finance.netAmount)}`,
    "",
    `Track: ${getTrackUrl()}`
  ].join("\n");
};

const buildHtml = (input: BookingNotificationInput) => {
  const finance = resolveBookingFinance(input.booking);
  const scheduleHtml = Object.entries(input.booking.reservation.dailySchedule ?? input.booking.dailySchedule ?? {})
    .map(([d, s]) => `<li>${formatBookingDate(d)}: ${slotLabels[s as BookingSlot] || s}</li>`).join("");

  return `
    <div style="font-family:sans-serif; color:#111827; max-width:600px; margin:0 auto; padding:20px; border:1px solid #eee;">
      <h2 style="color:#000; border-bottom:2px solid #eee; padding-bottom:10px;">${eventSubjects[input.event]}</h2>
      <p>Hi ${escapeHtml(input.booking.customer.name)},</p>
      <p>${eventMessages[input.event]}</p>
      <div style="background:#f9fafb; padding:20px; border-radius:8px; margin:20px 0;">
        <p><strong>Ref:</strong> ${input.booking.referenceId}</p>
        <p><strong>Venue:</strong> ${input.booking.venueName}</p>
        <p><strong>Schedule:</strong></p>
        <ul>${scheduleHtml}</ul>
        <p style="font-size:18px;"><strong>Total:</strong> ${formatMoney(finance.netAmount)}</p>
      </div>
      <p style="text-align:center; margin-top:30px;">
        <a href="${getTrackUrl()}" style="background:#000; color:#fff; padding:12px 24px; text-decoration:none; font-weight:bold; border-radius:4px;">Manage Your Booking</a>
      </p>
    </div>
  `;
};
