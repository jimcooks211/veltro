import express from "express";
import crypto from "crypto";

const router = express.Router();

// POST /api/webhook/mailersend
router.post("/mailersend", express.raw({ type: "application/json" }), (req, res) => {
  try {
    const signature = req.headers["x-mailersend-signature"];
    const secret = process.env.MAILERSEND_SIGNING_SECRET;

    if (!secret) {
      console.error("[Webhook] Missing MAILERSEND_SIGNING_SECRET in .env");
      return res.status(500).json({ error: "Server misconfigured" });
    }

    // Verify signature using raw body
    const rawBody = req.body;
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(rawBody);
    const digest = hmac.digest("hex");

    if (digest !== signature) {
      console.warn("[Webhook] Invalid signature — possible spoofed request");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const event = JSON.parse(rawBody.toString());
    const eventType = event?.type;
    const recipientEmail = event?.data?.email?.recipient?.email ?? "unknown";

    console.log(`[Webhook] Event received: ${eventType} → ${recipientEmail}`);

    switch (eventType) {
      case "activity.delivered":
        console.log(`[Webhook] ✅ Delivered to: ${recipientEmail}`);
        // TODO: update DB delivery status if needed
        break;

      case "activity.soft_bounced":
        console.log(`[Webhook] ⚠️ Soft bounce for: ${recipientEmail}`);
        // TODO: flag address in DB or retry logic
        break;

      case "sender_identity.verified":
        console.log("[Webhook] 🔐 Sender identity verified:", event?.data);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${eventType}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("[Webhook] Error processing event:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;