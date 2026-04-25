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
  const baseUrl = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").trim();
  return `${baseUrl.replace(/\/$/, "")}/track`;
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
  const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 587;

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER?.trim() || undefined,
    pass: (process.env.SMTP_PASS?.trim() || "").replace(/\s+/g, ""),
    from: process.env.SMTP_FROM_NAME?.trim() ? `${process.env.SMTP_FROM_NAME.trim()} <${from}>` : from,
    replyTo: process.env.SMTP_REPLY_TO?.trim() || undefined,
    appUrl: getTrackUrl(),
  };
};

const buildSubject = (event: BookingNotificationEvent, booking: Booking) =>
  `${eventSubjects[event]}: ${booking.referenceId}`;

const buildMimeMessage = (input: BookingNotificationInput, config: SmtpConfig) => {
  const boundary = `booking_${randomUUID().replace(/-/g, "")}`;
  const textBody = buildPlainText(input).replace(/\n/g, "\r\n");
  const htmlBody = buildHtml(input).replace(/\n/g, "\r\n");

  return [
    `From: ${config.from}`,
    `To: ${input.booking.customer.email || input.booking.customer.normalizedEmail}`,
    `Subject: ${buildSubject(input.event, input.booking)}`,
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
    socket.on("error", reject);
  });

const sendSmtpCommand = async (socket: net.Socket | tls.TLSSocket, command: string) => {
  socket.write(`${command}\r\n`);
  return readSmtpResponse(socket);
};

const connectSmtp = async (config: SmtpConfig) => {
  console.log(`[Notification] Resolving IPv4 for ${config.host}...`);
  const resolvedIp = await new Promise<string>((resolve, reject) => {
    dns.lookup(config.host, { family: 4 }, (err, address) => {
      if (err) reject(err); else resolve(address);
    });
  });

  return new Promise<net.Socket | tls.TLSSocket>((resolve, reject) => {
    console.log(`[Notification] TCP Connect to ${resolvedIp}:${config.port}...`);
    const socket = net.connect({ host: resolvedIp, port: config.port, timeout: 15000 });

    socket.once("connect", () => {
      console.log("[Notification] TCP connected.");
      resolve(socket);
    });
    socket.once("error", reject);
    socket.once("timeout", () => { socket.destroy(); reject(new Error("TCP Timeout")); });
  });
};

export async function sendBookingNotification(input: BookingNotificationInput): Promise<BookingNotificationResult> {
  const config = getSmtpConfig();
  if (!config) return { event: input.event, status: "skipped", reason: "Config missing" };

  let socket: any = null;
  try {
    socket = await connectSmtp(config);
    
    // 1. GREETING
    let res = await readSmtpResponse(socket);
    if (res.code !== 220) throw new Error(`Greeting failed: ${res.message}`);

    // 2. EHLO
    res = await sendSmtpCommand(socket, `EHLO ${getEhloName(config.appUrl)}`);
    if (res.code !== 250) throw new Error(`EHLO failed: ${res.message}`);

    // 3. STARTTLS (if not secure port 465)
    if (!config.secure && config.port !== 465) {
      console.log("[Notification] Sending STARTTLS...");
      res = await sendSmtpCommand(socket, "STARTTLS");
      if (res.code !== 220) throw new Error(`STARTTLS failed: ${res.message}`);

      socket = tls.connect({
        socket,
        servername: config.host,
        rejectUnauthorized: false
      });
      console.log("[Notification] TLS Upgrade complete.");
      
      // EHLO again after TLS
      res = await sendSmtpCommand(socket, `EHLO ${getEhloName(config.appUrl)}`);
    } else if (config.secure) {
        // Upgrade immediately for 465
        socket = tls.connect({ socket, servername: config.host, rejectUnauthorized: false });
    }

    // 4. AUTH
    if (config.user && config.pass) {
      console.log("[Notification] AUTH LOGIN...");
      res = await sendSmtpCommand(socket, "AUTH LOGIN");
      res = await sendSmtpCommand(socket, Buffer.from(config.user).toString("base64"));
      res = await sendSmtpCommand(socket, Buffer.from(config.pass).toString("base64"));
      if (res.code !== 235) throw new Error(`AUTH failed: ${res.message}`);
    }

    // 5. MAIL FROM / RCPT TO
    await sendSmtpCommand(socket, `MAIL FROM:<${config.from.match(/<([^>]+)>/)?.[1] ?? config.from}>`);
    await sendSmtpCommand(socket, `RCPT TO:<${input.booking.customer.email || input.booking.customer.normalizedEmail}>`);
    
    // 6. DATA
    res = await sendSmtpCommand(socket, "DATA");
    if (res.code !== 354) throw new Error(`DATA failed: ${res.message}`);

    const rawMessage = buildMimeMessage(input, config).replace(/\r?\n\./g, "\r\n..");
    socket.write(`${rawMessage}\r\n.\r\n`);
    res = await readSmtpResponse(socket);
    if (res.code !== 250) throw new Error(`Send failed: ${res.message}`);

    await sendSmtpCommand(socket, "QUIT");
    console.log("[Notification] SUCCESS! Email sent.");
    return { event: input.event, status: "sent", messageId: res.message };

  } catch (error: any) {
    console.error("[Notification] SMTP Fatal Error:", error.message);
    return { event: input.event, status: "failed", reason: error.message };
  } finally {
    if (socket) socket.end();
  }
}

const buildPlainText = (input: BookingNotificationInput) => {
  const finance = resolveBookingFinance(input.booking);
  const getScheduleLines = (b: Booking) => Object.entries(b.reservation.dailySchedule ?? b.dailySchedule ?? {}).map(([d, s]) => `${formatBookingDate(d)} - ${slotLabels[s] || s}`);
  
  return [
    `Hi ${input.booking.customer.name},`,
    "",
    eventSubjects[input.event],
    `Ref: ${input.booking.referenceId}`,
    `Total: ${formatMoney(finance.netAmount)}`,
    "",
    `Schedule:\n${getScheduleLines(input.booking).join("\n")}`,
    "",
    `Track: ${getTrackUrl()}`
  ].join("\n");
};

const buildHtml = (input: BookingNotificationInput) => {
  const finance = resolveBookingFinance(input.booking);
  const getScheduleHtml = (b: Booking) => Object.entries(b.reservation.dailySchedule ?? b.dailySchedule ?? {}).map(([d, s]) => `<li>${formatBookingDate(d)}: ${slotLabels[s] || s}</li>`).join("");

  return `
    <div style="font-family:sans-serif;">
      <h2>${eventMessages[input.event]}</h2>
      <p><strong>Ref:</strong> ${input.booking.referenceId}</p>
      <ul>${getScheduleHtml(input.booking)}</ul>
      <p><strong>Total:</strong> ${formatMoney(finance.netAmount)}</p>
      <a href="${getTrackUrl()}">Track Booking</a>
    </div>
  `;
};
