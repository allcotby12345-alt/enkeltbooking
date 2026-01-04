import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const account = await stripe.accounts.create({
      type: "express",
      country: "NO",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    const link = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "http://localhost:3000",
      return_url: "http://localhost:3000",
      type: "account_onboarding",
    });

    return res.status(200).json({
      accountId: account.id,
      onboardingUrl: link.url,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Stripe error", message: e?.message });
  }
}
