import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export default async function handler(req, res) {
  // CORS - tillat Webflow-siden din å kalle API-et
  res.setHeader("Access-Control-Allow-Origin", "https://www.enkeltbooking.no");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight (nettleseren sender OPTIONS først)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const { stripeAccountId, clinicName, bookingRef } = req.body || {};

    if (!stripeAccountId || !stripeAccountId.startsWith("acct_")) {
      return res
        .status(400)
        .json({ error: "Missing/invalid stripeAccountId (acct_...)" });
    }

    const baseUrl =
      process.env.PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    // depositum i øre. Default = 50000 (500 kr)
    const amount = Number(process.env.DEPOSIT_AMOUNT_ORE || 50000);

    const successUrl = `${baseUrl}/takk?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/avbrutt`;

    const safeClinicName = clinicName ? String(clinicName) : "";
    const safeBookingRef = bookingRef ? String(bookingRef) : "";

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,

        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "nok",
              unit_amount: amount,
              product_data: {
                name: `Depositum${safeClinicName ? " – " + safeClinicName : ""}`,
                description: safeBookingRef ? `Booking: ${safeBookingRef}` : undefined,
              },
            },
          },
        ],

        // VIKTIG: dette er det webhooken din leser
        metadata: {
          stripeAccountId,
          clinicName: safeClinicName,
          bookingRef: safeBookingRef,
        },
      },
      {
        // direct charge til riktig connected account
        stripeAccount: stripeAccountId,
      }
    );

    return res.status(200).json({ url: session.url, id: session.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Stripe error" });
  }
}