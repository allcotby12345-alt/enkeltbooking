// pages/api/webhook.js
import Stripe from "stripe";
import { sendClinicEmail } from "../../lib/email";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function readBuffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method Not Allowed");
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).send("Missing STRIPE_WEBHOOK_SECRET in .env.local");
  }

  let event;
  try {
    const buf = await readBuffer(req);
    const signature = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(buf, signature, webhookSecret);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    console.log("✅ checkout.session.completed");
    console.log("session.id:", session.id);
    console.log("payment_status:", session.payment_status);
    console.log("metadata:", session.metadata);

    const to = process.env.CLINIC_TEST_EMAIL;
    if (!to) {
      console.log("⚠️ Mangler CLINIC_TEST_EMAIL i .env.local – sender ikke mail.");
      return res.status(200).json({ received: true });
    }

    await sendClinicEmail({
      to,
      subject: "Enkeltbooking: Betaling mottatt",
      text:
        `Betaling mottatt (checkout.session.completed)\n\n` +
        `Session: ${session.id}\n` +
        `Payment status: ${session.payment_status}\n` +
        `Metadata: ${JSON.stringify(session.metadata || {}, null, 2)}\n`,
    });

    console.log("📧 Mail sendt til:", to);
  } else {
    console.log("ℹ️ Event:", event.type);
  }

  return res.status(200).json({ received: true });
}