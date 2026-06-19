import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import api from "../services/api";
import useIsMobile from "../hooks/useIsMobile";
import "./EventDetails.css";

const getEventImage = (title) => {
  const eventImages = {
    "WELLNESS SEMINAR": "/events/wellness-seminar.png?v=1",
    "ASSOCIATE ACADEMY": "/events/associate-academy.png?v=1",
    "SUPERVISOR WORKSHOP": "/events/supervisor-workshop.png?v=1"
  };

  return eventImages[String(title || "").toUpperCase()] || "";
};

function TrainingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [training, setTraining] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadTraining = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        setTraining(res.data);
      } catch (err) {
        try {
          const res = await api.get("/events");
          const fallbackIndex = Number(id) - 1;
          const fallbackTraining = Number.isInteger(fallbackIndex)
            ? res.data[fallbackIndex]
            : null;

          setTraining(fallbackTraining || null);
        } catch (fallbackErr) {
          console.error(fallbackErr);
          setTraining(null);
        }
      } finally {
        setLoading(false);
      }
    };

    loadTraining();
  }, [id]);

  const increaseQty = () => {
    if (quantity < 100) {
      setQuantity(quantity + 1);
      setPaymentOrder(null);
      setPaymentMessage("");
    }
  };

  const decreaseQty = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
      setPaymentOrder(null);
      setPaymentMessage("");
    }
  };

  const handleBook = async () => {
    try {
      const coachId = sessionStorage.getItem("coachId");

      if (!coachId) {
        navigate("/login", { replace: true });
        return;
      }

      setPaying(true);
      setPaymentMessage("");
      const orderRes = await api.post("/orders/create", {
        eventId: training._id,
        quantity
      });

      setPaymentOrder(orderRes.data);
    } catch (err) {
      alert(err.response?.data?.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();

    if (!paymentOrder?.orderId) {
      setPaymentMessage("Create an order before submitting payment details.");
      return;
    }

    try {
      setPaying(true);
      setPaymentMessage("");
      const res = await api.post("/orders/submit-payment", {
        orderId: paymentOrder.orderId
      });
      if (res.data?.whatsapp?.link) {
        window.open(res.data.whatsapp.link, "_blank", "noopener,noreferrer");
      }
      setPaymentMessage("Payment confirmed. Your ticket is booked.");
      setPaymentOrder(null);
      navigate("/my-tickets");
    } catch (err) {
      setPaymentMessage(err.response?.data?.message || "Payment submission failed");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ ...styles.page, ...(isMobile ? styles.pageMobile : {}) }}>
          <div style={styles.shell}>
            <LoadingSpinner fullHeight />
          </div>
        </div>
      </>
    );
  }

  if (!training) {
    return (
      <>
        <Navbar />
        <div style={{ ...styles.page, ...(isMobile ? styles.pageMobile : {}) }}>
          <div style={styles.shell}>
            <h2 style={styles.title}>Event not found</h2>
          </div>
        </div>
      </>
    );
  }

  const eventImage = getEventImage(training.title);

  return (
    <>
      <Navbar />
      <main style={{ ...styles.page, ...(isMobile ? styles.pageMobile : {}) }}>
        <div style={styles.shell}>
          <button className="details-back-button" style={styles.backButton} onClick={() => navigate("/")}>
            Back
          </button>

          <section
            style={{
              ...styles.hero,
              ...(eventImage ? styles.heroWithImage : {}),
              ...(eventImage && isMobile ? styles.heroWithImageMobile : {})
            }}
          >
            <div style={{ ...styles.heroContent, ...(isMobile ? styles.heroContentMobile : {}) }}>
              <span style={styles.badge}>Event Booking</span>
              <h1 style={{ ...styles.title, ...(isMobile ? styles.titleMobile : {}) }}>
                {training.title}
              </h1>
              <p style={styles.description}>{training.description}</p>

              <div style={{ ...styles.metaGrid, ...(isMobile ? styles.metaGridMobile : {}) }}>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Date</span>
                  <strong style={styles.metaValue}>{training.date}</strong>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Location</span>
                  <strong style={styles.metaValue}>{training.location}</strong>
                </div>
              </div>
            </div>
            {eventImage && (
              <div style={styles.heroImageWrap}>
                <img
                  src={eventImage}
                  alt={`${training.title} poster`}
                  style={styles.heroImage}
                />
              </div>
            )}
          </section>

          <section style={{ ...styles.bookingLayout, ...(isMobile ? styles.bookingLayoutMobile : {}) }}>
            <div style={styles.detailsPanel}>
              <h2 style={styles.sectionTitle}>Event Details</h2>
              <p style={styles.bodyText}>
                Secure your seat for this session and complete the payment to confirm your ticket.
              </p>
              <div style={{ ...styles.infoRow, ...(isMobile ? styles.infoRowMobile : {}) }}>
                <span>Ticket price</span>
                <strong>Rs. {training.ticket_price}</strong>
              </div>
              <div style={{ ...styles.infoRow, ...(isMobile ? styles.infoRowMobile : {}) }}>
                <span>Booking status</span>
                <strong>Auto confirmed after payment</strong>
              </div>
            </div>

            <aside style={styles.checkoutPanel}>
              <div style={styles.priceBlock}>
                <span style={styles.metaLabel}>Price per ticket</span>
                <strong style={styles.bigPrice}>Rs. {training.ticket_price}</strong>
              </div>

              <div style={styles.divider} />

              <div style={{ ...styles.quantityHeader, ...(isMobile ? styles.quantityHeaderMobile : {}) }}>
                <span style={styles.quantityLabel}>Tickets</span>
                <div style={styles.qtyBox}>
                  <button className="details-qty-button" onClick={decreaseQty} style={styles.qtyBtn}>-</button>
                  <span style={styles.qty}>{quantity}</span>
                  <button className="details-qty-button" onClick={increaseQty} style={styles.qtyBtn}>+</button>
                </div>
              </div>

              <div style={styles.totalRow}>
                <span>Total</span>
                <strong>Rs. {training.ticket_price * quantity}</strong>
              </div>

              <button className="details-book-button" disabled={paying} style={styles.bookBtn} onClick={handleBook}>
                {paying ? "Preparing QR..." : "Show Payment QR"}
              </button>
            </aside>
          </section>

          {paymentOrder && (
            <section style={{ ...styles.paymentPanel, ...(isMobile ? styles.paymentPanelMobile : {}) }}>
              <div>
                <h2 style={styles.sectionTitle}>Pay Using UPI QR</h2>
                <p style={styles.bodyText}>
                  Scan the QR code and pay the exact amount. After payment, confirm below to book
                  your ticket instantly.
                </p>
                <div style={{ ...styles.infoRow, ...(isMobile ? styles.infoRowMobile : {}) }}>
                  <span>Payee</span>
                  <strong>{paymentOrder.payment.payeeName}</strong>
                </div>
                <div style={{ ...styles.infoRow, ...(isMobile ? styles.infoRowMobile : {}) }}>
                  <span>Tickets</span>
                  <strong>{paymentOrder.event.ticket_price} x {paymentOrder.quantity}</strong>
                </div>
                <div style={{ ...styles.infoRow, ...(isMobile ? styles.infoRowMobile : {}) }}>
                  <span>Total amount to pay</span>
                  <strong>Rs. {paymentOrder.amount}</strong>
                </div>
              </div>

              <div style={styles.qrPanel}>
                <img
                  src={paymentOrder.payment.qrCode}
                  alt="UPI payment QR code"
                  style={styles.qrImage}
                />
                <a href={paymentOrder.payment.upiLink} style={styles.upiLink}>
                  Open UPI App
                </a>
              </div>

              <form onSubmit={handleSubmitPayment} style={styles.transactionForm}>
                {paymentMessage && <p style={styles.paymentMessage}>{paymentMessage}</p>}
                <button className="details-book-button" disabled={paying} style={styles.bookBtn}>
                  {paying ? "Confirming..." : "Payment Done - Confirm Order"}
                </button>
              </form>
            </section>
          )}
        </div>
      </main>
    </>
  );
}

const styles = {
  page: {
    minHeight: "calc(100vh - 64px)",
    background:
      "radial-gradient(circle at 8% 0%, rgba(201,164,65,0.22), transparent 24rem), radial-gradient(circle at 88% 10%, rgba(0,99,65,0.12), transparent 25rem), linear-gradient(135deg, #F8FAF7 0%, #EEF2F5 48%, #FFFFFF 100%)",
    padding: "38px",
    boxSizing: "border-box",
    overflowX: "hidden"
  },
  pageMobile: {
    padding: "18px 16px"
  },
  shell: {
    maxWidth: "1120px",
    margin: "0 auto"
  },
  backButton: {
    border: "1px solid rgba(213, 222, 208, 0.95)",
    background: "rgba(255,255,255,0.9)",
    color: "#006341",
    borderRadius: "999px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: "700",
    marginBottom: "18px",
    boxShadow: "0 10px 24px rgba(31, 58, 26, 0.08)"
  },
  hero: {
    background: "linear-gradient(135deg, #17351F 0%, #2D5A43 58%, #C9A441 100%)",
    borderRadius: "30px",
    color: "#fff",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.28)",
    borderLeft: "12px solid #C9A441",
    boxShadow: "0 30px 80px rgba(29, 44, 38, 0.24), inset 0 1px 0 rgba(255,255,255,0.18)"
  },
  heroWithImage: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 380px)",
    alignItems: "stretch"
  },
  heroWithImageMobile: {
    gridTemplateColumns: "1fr"
  },
  heroContent: {
    padding: "44px",
    maxWidth: "760px"
  },
  heroContentMobile: {
    padding: "24px"
  },
  heroImageWrap: {
    minHeight: "400px",
    background: "#0E3F1F",
    borderLeft: "1px solid rgba(255,255,255,0.16)"
  },
  heroImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center top",
    display: "block",
    filter: "saturate(1.05) contrast(1.02)"
  },
  badge: {
    display: "inline-block",
    background: "rgba(255,255,255,0.16)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.32)",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "13px",
    fontWeight: "900",
    letterSpacing: "0.04em",
    textTransform: "uppercase"
  },
  title: {
    fontSize: "44px",
    lineHeight: 1.05,
    letterSpacing: "-0.04em",
    margin: "18px 0 10px"
  },
  titleMobile: {
    fontSize: "32px"
  },
  description: {
    fontSize: "16px",
    lineHeight: 1.6,
    margin: 0,
    color: "rgba(255,255,255,0.9)"
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginTop: "28px"
  },
  metaGridMobile: {
    gridTemplateColumns: "1fr"
  },
  metaItem: {
    background: "rgba(255,255,255,0.16)",
    border: "1px solid rgba(255,255,255,0.24)",
    borderRadius: "18px",
    padding: "16px",
    boxShadow: "0 14px 30px rgba(0, 99, 65, 0.18)"
  },
  metaLabel: {
    display: "block",
    color: "#6F7D68",
    fontSize: "13px",
    fontWeight: "700",
    marginBottom: "6px"
  },
  metaValue: {
    display: "block",
    color: "#fff",
    fontSize: "17px"
  },
  bookingLayout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "22px",
    marginTop: "24px"
  },
  bookingLayoutMobile: {
    gridTemplateColumns: "1fr",
    gap: "16px"
  },
  detailsPanel: {
    background: "#FFFFFF",
    border: "1px solid #DCEFD4",
    borderTop: "6px solid #7AC143",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 18px 44px rgba(31, 45, 38, 0.1)"
  },
  sectionTitle: {
    margin: "0 0 10px",
    fontSize: "22px",
    color: "#17351F",
    letterSpacing: "-0.02em"
  },
  bodyText: {
    color: "#5E6A59",
    lineHeight: 1.6,
    margin: "0 0 22px"
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    borderTop: "1px solid #E6EDE1",
    padding: "16px 0",
    color: "#34402F"
  },
  infoRowMobile: {
    alignItems: "flex-start",
    flexDirection: "column",
    gap: "6px",
    overflowWrap: "anywhere"
  },
  checkoutPanel: {
    background: "#FFFFFF",
    border: "1px solid #DCEFD4",
    borderTop: "6px solid #7AC143",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 24px 60px rgba(31, 45, 38, 0.1)",
    alignSelf: "start"
  },
  priceBlock: {
    marginBottom: "18px"
  },
  bigPrice: {
    display: "block",
    color: "#1F2A1B",
    fontSize: "30px"
  },
  divider: {
    height: "1px",
    background: "#E6EDE1",
    margin: "18px 0"
  },
  quantityHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "20px"
  },
  quantityHeaderMobile: {
    alignItems: "stretch",
    flexDirection: "column"
  },
  quantityLabel: {
    color: "#34402F",
    fontWeight: "700"
  },
  qtyBox: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #D5DED0",
    borderRadius: "8px",
    overflow: "hidden",
    height: "42px"
  },
  qtyBtn: {
    width: 42,
    height: 42,
    fontSize: 20,
    background: "linear-gradient(135deg, #006341, #008554)",
    color: "#fff",
    border: "none",
    cursor: "pointer"
  },
  qty: {
    fontSize: 18,
    minWidth: 46,
    textAlign: "center",
    fontWeight: "700"
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#F4F7F3",
    borderRadius: "16px",
    padding: "16px",
    color: "#1F2A1B",
    fontSize: "18px",
    marginBottom: "18px"
  },
  bookBtn: {
    width: "100%",
    padding: "14px 18px",
    background: "#7AC143",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: 16,
    fontWeight: "800",
    boxShadow: "0 16px 32px rgba(0, 99, 65, 0.24)"
  },
  paymentPanel: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "22px",
    marginTop: "24px",
    background: "#FFFFFF",
    border: "1px solid #DCEFD4",
    borderTop: "6px solid #7AC143",
    borderRadius: "24px",
    padding: "26px",
    boxShadow: "0 24px 60px rgba(31, 45, 38, 0.1)"
  },
  paymentPanelMobile: {
    gridTemplateColumns: "1fr",
    padding: "20px"
  },
  qrPanel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px"
  },
  qrImage: {
    width: "220px",
    maxWidth: "100%",
    border: "1px solid #DFE7DA",
    borderRadius: "8px"
  },
  upiLink: {
    color: "#2F8F15",
    fontWeight: "800",
    textDecoration: "none"
  },
  transactionForm: {
    gridColumn: "1 / -1",
    display: "grid",
    gap: "10px"
  },
  inputLabel: {
    color: "#34402F",
    fontWeight: "800"
  },
  transactionInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #D5DED0",
    borderRadius: "8px",
    fontSize: "16px"
  },
  paymentMessage: {
    margin: 0,
    color: "#2F8F15",
    fontWeight: "700"
  },
  muted: {
    color: "#5E6A59"
  }
};

export default TrainingDetails;
