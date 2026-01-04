import { sendClinicEmail } from "../../lib/email";

export default async function handler(req, res) {
  try {
    const to = process.env.CLINIC_TEST_EMAIL;
    if (!to) return res.status(500).json({ error: "Missing CLINIC_TEST_EMAIL" });

    const result = await sendClinicEmail({
      to,
      subject: "Test fra Enkeltbooking",
      text: "Dette er en testmail for å sjekke Resend-oppsett.",
    });

    return res.status(200).json({ ok: true, result });
  } catch (err) {
    console.error("TEST EMAIL ERROR:", err);
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
}