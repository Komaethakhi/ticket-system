const normalizeWhatsAppRecipient = (number) => {
  const digits = String(number || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return digits.startsWith("91") ? digits : `91${digits}`;
};

const getOrderWhatsAppNumber = (order) =>
  order?.whatsapp_number || order?.userId?.mobileNumber || "";

const getPublicAppUrl = () =>
  String(process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || "https://ticket-system-vpr6.onrender.com")
    .replace(/\/+$/, "");

const getOrderConfirmationImageUrl = () =>
  process.env.WHATSAPP_CONFIRMATION_IMAGE_URL ||
  `${getPublicAppUrl()}/markhughes-congratulations.jpeg`;

const getOrderConfirmationTemplateName = () =>
  process.env.WHATSAPP_CONFIRMATION_TEMPLATE_NAME || "order_confirmation_with_image";

const getWhatsAppTemplateLanguage = () =>
  process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US";

const buildOrderConfirmationMessage = (order) =>
  [
    `Hi, ${order.userId?.coachName || order.userId?.coachId || "Coach"}!`,
    "",
    `Your ${order.eventId?.title || "Training"} Order Confirmation`,
    "",
    `Herbalife ID: ${order.userId?.coachId || "Unknown"}`,
    "",
    `Date: ${order.eventId?.date || ""}`,
    "",
    `Location: ${order.eventId?.location || ""}`,
    "",
    `Order ID: ${order._id}`,
    "",
    `Tickets: ${order.quantity}`,
    "",
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

const sendImageWhatsAppMessage = async ({ recipientNumber, imageUrl, caption }) => {
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
      type: "image",
      image: {
        link: imageUrl,
        caption
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp image message failed: ${errorText}`);
  }

  return { sent: true, type: "image" };
};

const buildTemplateTextParameter = (value) => ({
  type: "text",
  text: String(value || "-")
});

const buildOrderConfirmationTemplateComponents = (order) => [
  {
    type: "header",
    parameters: [
      {
        type: "image",
        image: {
          link: getOrderConfirmationImageUrl()
        }
      }
    ]
  },
  {
    type: "body",
    parameters: [
      buildTemplateTextParameter(order.userId?.coachName || order.userId?.coachId || "Coach"),
      buildTemplateTextParameter(order.eventId?.title || "Training"),
      buildTemplateTextParameter(order.userId?.coachId || "Unknown"),
      buildTemplateTextParameter(order.eventId?.date || ""),
      buildTemplateTextParameter(order.eventId?.location || ""),
      buildTemplateTextParameter(order._id),
      buildTemplateTextParameter(order.quantity),
      buildTemplateTextParameter(order.amount),
      buildTemplateTextParameter("CONFIRMED")
    ]
  }
];

const sendTemplateWhatsAppMessage = async ({ recipientNumber, templateName, languageCode, components }) => {
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
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        components
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp template message failed: ${errorText}`);
  }

  return { sent: true, type: "template" };
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

const sendOrderWhatsAppConfirmation = async (order) => {
  const recipientNumber = getOrderWhatsAppNumber(order);
  const confirmationMessage = buildOrderConfirmationMessage(order);
  let imageFailure;
  let templateFailure;

  try {
    const imageDelivery = await sendImageWhatsAppMessage({
      recipientNumber,
      imageUrl: getOrderConfirmationImageUrl(),
      caption: confirmationMessage
    });

    if (imageDelivery.sent) {
      return imageDelivery;
    }

    imageFailure = imageDelivery;
  } catch (imageErr) {
    console.error("WhatsApp confirmation image error:", imageErr);
    imageFailure = { sent: false, reason: "WHATSAPP_IMAGE_SEND_FAILED", error: imageErr.message };
  }

  try {
    const templateDelivery = await sendTemplateWhatsAppMessage({
      recipientNumber,
      templateName: getOrderConfirmationTemplateName(),
      languageCode: getWhatsAppTemplateLanguage(),
      components: buildOrderConfirmationTemplateComponents(order)
    });

    if (templateDelivery.sent) {
      return {
        ...templateDelivery,
        imageFailure
      };
    }

    templateFailure = templateDelivery;
  } catch (templateErr) {
    console.error("WhatsApp confirmation template error:", templateErr);
    templateFailure = { sent: false, reason: "WHATSAPP_TEMPLATE_SEND_FAILED", error: templateErr.message };
  }

  const textDelivery = await sendTextWhatsAppMessage({
    recipientNumber,
    body: confirmationMessage
  });

  return {
    ...textDelivery,
    fallback: true,
    imageFailure,
    templateFailure
  };
};

module.exports = {
  buildAdminPaymentSubmittedMessage,
  buildOrderConfirmationMessage,
  buildOrderWhatsAppLink,
  getOrderWhatsAppNumber,
  normalizeWhatsAppRecipient,
  sendAdminPaymentSubmittedNotification,
  sendOrderWhatsAppConfirmation
};
