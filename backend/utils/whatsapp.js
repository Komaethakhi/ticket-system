const normalizeWhatsAppRecipient = (number) => {
  const digits = String(number || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return digits.startsWith("91") ? digits : `91${digits}`;
};

const getOrderWhatsAppNumber = (order) =>
  order?.whatsapp_number || order?.userId?.mobileNumber || "";

const buildOrderConfirmationMessage = (order) =>
  [
    "Order confirmed.",
    `Order ID: ${order._id}`,
    `Herbalife ID: ${order.userId?.coachId || "Unknown"}`,
    `Training: ${order.eventId?.title || "Unknown event"}`,
    `Date: ${order.eventId?.date || ""}`,
    `Location: ${order.eventId?.location || ""}`,
    `Tickets: ${order.quantity}`,
    `Amount: Rs. ${order.amount}`,
    "Status: CONFIRMED"
  ].join("\n");

const buildAdminPaymentSubmittedMessage = (order) =>
  [
    "Payment screenshot submitted. Verify and approve in admin dashboard.",
    `Order ID: ${order._id}`,
    `Herbalife ID: ${order.userId?.coachId || "Unknown"}`,
    `Training: ${order.eventId?.title || "Unknown event"}`,
    `Tickets: ${order.quantity}`,
    `Amount: Rs. ${order.amount}`,
    "Status: PAYMENT_SUBMITTED"
  ].join("\n");

const sendTextWhatsAppMessage = async ({ recipientNumber, body }) => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = normalizeWhatsAppRecipient(recipientNumber);

  if (!recipient) {
    return { sent: false, reason: "NO_WHATSAPP_NUMBER" };
  }

  if (!token || !phoneNumberId) {
    return { sent: false, reason: "WHATSAPP_API_NOT_CONFIGURED" };
  }

  if (typeof fetch !== "function") {
    return { sent: false, reason: "FETCH_NOT_AVAILABLE" };
  }

  const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: recipient,
      type: "text",
      text: {
        preview_url: false,
        body
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp message failed: ${errorText}`);
  }

  return { sent: true };
};

const sendAdminPaymentSubmittedNotification = async (order) => {
  const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER || process.env.PAYMENT_UPI_NUMBER;

  return sendTextWhatsAppMessage({
    recipientNumber: adminNumber,
    body: buildAdminPaymentSubmittedMessage(order)
  });
};

const buildOrderWhatsAppLink = (order) => {
  const recipient = normalizeWhatsAppRecipient(getOrderWhatsAppNumber(order));

  if (!recipient) {
    return "";
  }

  return `https://wa.me/${recipient}?text=${encodeURIComponent(buildOrderConfirmationMessage(order))}`;
};

const sendOrderWhatsAppConfirmation = async (order) =>
  sendTextWhatsAppMessage({
    recipientNumber: getOrderWhatsAppNumber(order),
    body: buildOrderConfirmationMessage(order)
  });

module.exports = {
  buildAdminPaymentSubmittedMessage,
  buildOrderConfirmationMessage,
  buildOrderWhatsAppLink,
  getOrderWhatsAppNumber,
  normalizeWhatsAppRecipient,
  sendAdminPaymentSubmittedNotification,
  sendOrderWhatsAppConfirmation
};
