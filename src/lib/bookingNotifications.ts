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

const getScheduleLines = (booking: Booking) => {
  const entries = Object.entries(booking.reservation.dailySchedule ?? booking.dailySchedule ?? {}).sort(([left], [right]) =>
    left.localeCompare(right)
  );

  if (entries.length === 0) {
    return [formatBookingDate(booking.date)];
  }

  return entries.map(([day, slot]) => `${formatBookingDate(day)} - ${slotLabels[slot] ?? slot}`);
};

const describeSchedule = (booking: Booking) => getScheduleLines(booking).join("\n");

const renderScheduleList = (booking: Booking) =>
  getScheduleLines(booking)
    .map((line) => `<li style="margin-bottom:8px;">${escapeHtml(line)}</li>`)
    .join("");

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

  if (!host || !from) {
    return null;
  }

  const parsedPort = Number.parseInt(process.env.SMTP_PORT ?? "", 10);
  const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 587;

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    user: process.env.SMTP_USER?.trim() || undefined,
    pass: (process.env.SMTP_PASS?.trim() || "").replace(/\s+/g, ""), // Institutional fix: strip spaces from App Password
    from: process.env.SMTP_FROM_NAME?.trim() ? `${process.env.SMTP_FROM_NAME.trim()} <${from}>` : from,
    replyTo: process.env.SMTP_REPLY_TO?.trim() || undefined,
    appUrl: getTrackUrl(),
  };
};

const buildSubject = (event: BookingNotificationEvent, booking: Booking) =>
  `${eventSubjects[event]}: ${booking.referenceId}`;

const buildMimeMessage = (input: BookingNotificationInput, config: SmtpConfig, resolvedHost: string) => {
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
  ]
    .filter((line) => line !== null)
    .join("\r\n");
};

const readSmtpResponse = (socket: net.Socket | tls.TLSSocket) =>
  new Promise<SmtpResponse>((resolve, reject) => {
    let buffer = "";

    const handleData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      if (lines.length === 0) {
        return;
      }

      const lastLine = lines[lines.length - 1];
      const match = lastLine.match(/^(\d{3})([ -])(.*)$/);
      if (!match || match[2] === "-") {
        return;
      }

      socket.off("data", handleData);
      socket.off("error", reject);
      const code = Number.parseInt(match[1], 10);
      resolve({
        code,
        message: lines.join("\n"),
      });
    };

    socket.on("data", handleData);
    socket.on("error", reject);
  });

const sendSmtpCommand = async (socket: net.Socket | tls.TLSSocket, command: string) => {
  socket.write(`${command}\r\n`);
  return readSmtpResponse(socket);
};

const connectSmtp = (config: SmtpConfig, resolvedIp: string) =>
  new Promise<net.Socket | tls.TLSSocket>((resolve, reject) => {
    console.log(`[Notification] Connecting to ${config.host} via ${resolvedIp}:${config.port} (Secure: ${config.secure})`);
    
    const options: any = {
      host: resolvedIp,
      port: config.port,
      timeout: 15000,
    };

    const socket = config.secure
      ? tls.connect({
          ...options,
          servername: config.host, // Crucial for SNI and cert verification
          rejectUnauthorized: false,
        })
      : net.connect(options);

    socket.once("secureConnect", () => {
      console.log("[Notification] TLS Connection established.");
      resolve(socket as tls.TLSSocket);
    });
    
    socket.once("connect", () => {
      if (!config.secure) {
        console.log("[Notification] TCP Connection established.");
        resolve(socket);
      }
    });

    socket.once("timeout", () => {
      socket.destroy();
      reject(new Error("SMTP Connection Timeout (15s)"));
    });

    socket.once("error", (err) => {
      console.error("[Notification] Socket Error:", err);
      reject(err);
    });
  });

const sendBookingNotification = async (input: BookingNotificationInput): Promise<BookingNotificationResult> => {
  const config = getSmtpConfig();

  if (!config) {
    console.warn("[Notification] SMTP config missing. Skipping email.");
    return {
      event: input.event,
      status: "skipped",
      reason: "SMTP configuration is missing.",
    };
  }

  try {
    console.log(`[Notification] Looking up IPv4 for ${config.host}...`);
    const resolvedIp = await new Promise<string>((resolve, reject) => {
      dns.lookup(config.host, { family: 4 }, (err, address) => {
        if (err) reject(err);
        else resolve(address);
      });
    });

    console.log(`[Notification] Resolved IP: ${resolvedIp}. Attempting send...`);
    const result = await sendSmtpEmail(config, input, resolvedIp);
    console.log(`[Notification] Email sent successfully. MessageID: ${result.messageId}`);

    return {
      event: input.event,
      status: result.status,
      messageId: result.messageId,
    };
  } catch (error: any) {
    console.error("[Notification] SMTP Fatal Error:", error);
    return {
      event: input.event,
      status: "failed",
      reason: error instanceof Error ? error.message : "Unknown notification error.",
    };
  }
};

const sendSmtpEmail = async (config: SmtpConfig, input: BookingNotificationInput, resolvedIp: string) => {
  const socket = await connectSmtp(config, resolvedIp);

  try {
    const greeting = await readSmtpResponse(socket);
    console.log("[Notification] Greeting received:", greeting.code);
    if (greeting.code !== 220) {
      throw new Error(`SMTP greeting failed: ${greeting.message}`);
    }

    const ehlo = await sendSmtpCommand(socket, `EHLO ${getEhloName(config.appUrl)}`);
    if (ehlo.code !== 250) {
      throw new Error(`SMTP EHLO failed: ${ehlo.message}`);
    }

    if (config.user && config.pass) {
      console.log("[Notification] Attempting Auth Login...");
      const auth = await sendSmtpCommand(socket, "AUTH LOGIN");
      if (auth.code !== 334) {
        throw new Error(`SMTP AUTH failed: ${auth.message}`);
      }

      const userResponse = await sendSmtpCommand(socket, Buffer.from(config.user).toString("base64"));
      if (userResponse.code !== 334) {
        throw new Error(`SMTP AUTH username rejected: ${userResponse.message}`);
      }

      const passResponse = await sendSmtpCommand(socket, Buffer.from(config.pass).toString("base64"));
      if (passResponse.code !== 235) {
        throw new Error(`SMTP AUTH password rejected: ${passResponse.message}`);
      }
      console.log("[Notification] Auth Success.");
    }

    const mailFrom = await sendSmtpCommand(socket, `MAIL FROM:<${config.from.match(/<([^>]+)>/)?.[1] ?? config.from}>`);
    if (mailFrom.code !== 250) {
      throw new Error(`SMTP MAIL FROM failed: ${mailFrom.message}`);
    }

    const rcptTo = await sendSmtpCommand(socket, `RCPT TO:<${input.booking.customer.email || input.booking.customer.normalizedEmail}>`);
    if (rcptTo.code !== 250 && rcptTo.code !== 251) {
      throw new Error(`SMTP RCPT TO failed: ${rcptTo.message}`);
    }

    const data = await sendSmtpCommand(socket, "DATA");
    if (data.code !== 354) {
      throw new Error(`SMTP DATA failed: ${data.message}`);
    }

    const rawMessage = buildMimeMessage(input, config, resolvedIp).replace(/\r?\n\./g, "\r\n..");
    const body = `${rawMessage}\r\n.\r\n`;
    socket.write(body);
    const sent = await readSmtpResponse(socket);
    if (sent.code !== 250) {
      throw new Error(`SMTP send failed: ${sent.message}`);
    }

    await sendSmtpCommand(socket, "QUIT");

    return {
      status: "sent" as const,
      messageId: sent.message,
    };
  } finally {
    socket.end();
  }
};

const buildPlainText = (input: BookingNotificationInput) => {
  const finance = resolveBookingFinance(input.booking);
  const lines = [
    `Hi ${input.booking.customer.name},`,
    "",
    eventMessages[input.event],
    "",
    `Reference: ${input.booking.referenceId}`,
    `Venue: ${input.booking.venueName}`,
    `Status: ${getBookingStatus(input.booking)}`,
    `Guests: ${input.booking.guests}`,
    `Schedule:\n${describeSchedule(input.booking)}`,
    `Total: ${formatMoney(finance.netAmount, finance.currency)}`,
  ];

  if (input.reason) {
    lines.push(`Reason: ${input.reason}`);
  }

  if (input.previousBooking) {
    lines.push("");
    lines.push(`Previous booking: ${input.previousBooking.referenceId}`);
    lines.push(`Previous schedule:\n${describeSchedule(input.previousBooking)}`);
  }

  if (input.replacementBooking) {
    const replacementFinance = resolveBookingFinance(input.replacementBooking);
    lines.push("");
    lines.push(`Replacement booking: ${input.replacementBooking.referenceId}`);
    lines.push(`Replacement schedule:\n${describeSchedule(input.replacementBooking)}`);
    lines.push(`Replacement total: ${formatMoney(replacementFinance.netAmount, replacementFinance.currency)}`);
  }

  lines.push("");
  lines.push(`Track your booking: ${getTrackUrl()}`);
  lines.push("");
  lines.push("Thank you.");

  return lines.join("\n");
};

const buildHtml = (input: BookingNotificationInput) => {
  const finance = resolveBookingFinance(input.booking);
  const replacementFinance = input.replacementBooking ? resolveBookingFinance(input.replacementBooking) : null;

  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <p>Hi ${escapeHtml(input.booking.customer.name)},</p>
      <p>${escapeHtml(eventMessages[input.event])}</p>

      <div style="border:1px solid #e5e7eb; padding:16px; margin:24px 0; border-radius:8px;">
        <p><strong>Reference:</strong> ${escapeHtml(input.booking.referenceId)}</p>
        <p><strong>Venue:</strong> ${escapeHtml(input.booking.venueName)}</p>
        <p><strong>Status:</strong> ${escapeHtml(getBookingStatus(input.booking))}</p>
        <p><strong>Guests:</strong> ${input.booking.guests}</p>
        <p><strong>Schedule:</strong></p>
        <ul style="padding-left:20px; margin-top:8px;">
          ${renderScheduleList(input.booking)}
        </ul>
        <p><strong>Total:</strong> ${escapeHtml(formatMoney(finance.netAmount, finance.currency))}</p>
        ${input.reason ? `<p><strong>Reason:</strong> ${escapeHtml(input.reason)}</p>` : ""}
      </div>

      ${
        input.previousBooking
          ? `
        <div style="border:1px solid #e5e7eb; padding:16px; margin:24px 0; border-radius:8px;">
          <p><strong>Previous booking:</strong> ${escapeHtml(input.previousBooking.referenceId)}</p>
          <p><strong>Previous schedule:</strong></p>
          <ul style="padding-left:20px; margin-top:8px;">
            ${renderScheduleList(input.previousBooking)}
          </ul>
        </div>
      `
          : ""
      }

      ${
        input.replacementBooking && replacementFinance
          ? `
        <div style="border:1px solid #e5e7eb; padding:16px; margin:24px 0; border-radius:8px;">
          <p><strong>Replacement booking:</strong> ${escapeHtml(input.replacementBooking.referenceId)}</p>
          <p><strong>Replacement schedule:</strong></p>
          <ul style="padding-left:20px; margin-top:8px;">
            ${renderScheduleList(input.replacementBooking)}
          </ul>
          <p><strong>Replacement total:</strong> ${escapeHtml(formatMoney(replacementFinance.netAmount, replacementFinance.currency))}</p>
        </div>
      `
          : ""
      }

      <p><a href="${escapeHtml(getTrackUrl())}" style="color:#111827; text-decoration:underline;">Track your booking</a></p>
      <p>Thank you.</p>
    </div>
  `;
};

export { sendBookingNotification };
