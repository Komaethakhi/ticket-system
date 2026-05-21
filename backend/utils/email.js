const nodemailer = require("nodemailer");

const sendOrderMail = async (userEmail, order, event) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: "Event Registration Confirmation",
    html: `
      <h2>Event Registration Successful</h2>
      <p>Your registration has been confirmed. Below are the details:</p>

      <h3>Event Details</h3>
      <p><b>Event Name:</b> ${event.event_name}</p>
      <p><b>Date:</b> ${event.event_date.toDateString()}</p>
      <p><b>Venue:</b> ${event.venue || "Will be announced"}</p>

      <h3>Order Details</h3>
      <p><b>Order ID:</b> ${order._id}</p>
      <p><b>Amount Paid:</b> ₹${order.amount}</p>
      <p><b>Status:</b> ${order.status}</p>
      <p><b>Booked On:</b> ${order.booked_at.toDateString()}</p>

      <br/>
      <p>Please carry this email for event entry verification.</p>
      <p><b>— Organization Team</b></p>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendOrderMail;
