This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Admin setup route

`/admin/setup` is disabled by default and must be explicitly opted in. To enable it in controlled environments only, set both:

```bash
NEXT_PUBLIC_ENABLE_ADMIN_SETUP=true
NEXT_PUBLIC_ADMIN_SETUP_ACK=I_UNDERSTAND
```

Security defaults:
- The setup page is never a public admin route.
- No default admin credentials are created or used by setup.
- Seeding requires an already authenticated admin session.

The setup action seeds the canonical venue and booking fixtures used by the admin, tracking, and finance views.

Leave these variables unset in production.

## Booking email notifications

The app can send booking lifecycle emails for create, approve, reject, cancel, and reschedule events when SMTP settings are provided:

```bash
SMTP_HOST=
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=ESPACE Bookings
SMTP_REPLY_TO=
APP_URL=http://localhost:3000
```

- `SMTP_HOST` and `SMTP_FROM_EMAIL` are required.
- For Gmail, set `SMTP_USER` to your full Gmail address and `SMTP_PASS` to your Google App Password.
- `SMTP_FROM_EMAIL` should usually match the authenticated mailbox for Gmail/Workspace sending.
- Use `APP_URL` or `NEXT_PUBLIC_SITE_URL` so booking links inside emails point to the right site.
- Booking create sends an immediate customer email after the booking is saved.
- Admin approve/reject now uses a server-side status route so the notification is sent together with the status change.
- Booking creation now includes a hidden honeypot field and a short repeat-submission cooldown for the same email + phone combination.
- The default repeat-submission cooldown is 60 seconds; set `BOOKING_COOLDOWN_SECONDS` to override it.
- If a booking is rejected with HTTP 429, wait a bit and try again with the same contact details.
