import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

function TrainingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [training, setTraining] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

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
    if (quantity < 100) setQuantity(quantity + 1);
  };

  const decreaseQty = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const saveTicketLocally = (order) => {
    const ticket = {
      id: order._id,
      title: order.eventId.title,
      date: order.eventId.date,
      location: order.eventId.location,
      price: order.eventId.ticket_price,
      quantity: order.quantity,
      total: order.amount,
      paymentId: order.payment_id
    };
    const existingTickets = JSON.parse(localStorage.getItem("myTickets")) || [];
    localStorage.setItem("myTickets", JSON.stringify([ticket, ...existingTickets]));
  };

  const handleBook = async () => {
    try {
      const coachId = sessionStorage.getItem("coachId");

      if (!coachId) {
        navigate("/login", { replace: true });
        return;
      }

      if (!window.Razorpay) {
        alert("Payment gateway is still loading. Try again in a few seconds.");
        return;
      }

      setPaying(true);
      const orderRes = await api.post("/orders/create", {
        eventId: training._id,
        quantity
      });

      const { key, orderId, razorpayOrder } = orderRes.data;

      const options = {
        key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Herbalife Training Portal",
        description: training.title,
        order_id: razorpayOrder.id,
        prefill: {
          name: coachId
        },
        theme: {
          color: "#7AC143"
        },
        handler: async (response) => {
          try {
            const verifyRes = await api.post("/orders/success", {
              orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            saveTicketLocally(verifyRes.data.order);
            alert("Payment successful. Ticket booked.");
            navigate("/my-tickets");
          } catch (err) {
            alert(err.response?.data?.message || "Payment verification failed");
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => setPaying(false)
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setPaying(false);
      alert(err.response?.data?.message || "Payment failed");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.page}>
          <div style={styles.shell}>
            <p style={styles.muted}>Loading training...</p>
          </div>
        </div>
      </>
    );
  }

  if (!training) {
    return (
      <>
        <Navbar />
        <div style={styles.page}>
          <div style={styles.shell}>
            <h2 style={styles.title}>Training not found</h2>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main style={styles.page}>
        <div style={styles.shell}>
          <button style={styles.backButton} onClick={() => navigate("/")}>
            Back
          </button>

          <section style={styles.hero}>
            <div style={styles.heroContent}>
              <span style={styles.badge}>Leadership Training</span>
              <h1 style={styles.title}>{training.title}</h1>
              <p style={styles.description}>{training.description}</p>

              <div style={styles.metaGrid}>
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
          </section>

          <section style={styles.bookingLayout}>
            <div style={styles.detailsPanel}>
              <h2 style={styles.sectionTitle}>Training Details</h2>
              <p style={styles.bodyText}>
                Secure your seat for this session and complete the payment to confirm your ticket.
              </p>
              <div style={styles.infoRow}>
                <span>Ticket price</span>
                <strong>Rs. {training.ticket_price}</strong>
              </div>
              <div style={styles.infoRow}>
                <span>Booking status</span>
                <strong>Payment required</strong>
              </div>
            </div>

            <aside style={styles.checkoutPanel}>
              <div style={styles.priceBlock}>
                <span style={styles.metaLabel}>Price per ticket</span>
                <strong style={styles.bigPrice}>Rs. {training.ticket_price}</strong>
              </div>

              <div style={styles.divider} />

              <div style={styles.quantityHeader}>
                <span style={styles.quantityLabel}>Tickets</span>
                <div style={styles.qtyBox}>
                  <button onClick={decreaseQty} style={styles.qtyBtn}>-</button>
                  <span style={styles.qty}>{quantity}</span>
                  <button onClick={increaseQty} style={styles.qtyBtn}>+</button>
                </div>
              </div>

              <div style={styles.totalRow}>
                <span>Total</span>
                <strong>Rs. {training.ticket_price * quantity}</strong>
              </div>

              <button disabled={paying} style={styles.bookBtn} onClick={handleBook}>
                {paying ? "Opening Payment..." : "Pay & Book Training"}
              </button>
            </aside>
          </section>
        </div>
      </main>
    </>
  );
}

const styles = {
  page: {
    minHeight: "calc(100vh - 64px)",
    background: "#F4F7F3",
    padding: "32px"
  },
  shell: {
    maxWidth: "1120px",
    margin: "0 auto"
  },
  backButton: {
    border: "1px solid #D5DED0",
    background: "#fff",
    color: "#31551F",
    borderRadius: "6px",
    padding: "9px 14px",
    cursor: "pointer",
    fontWeight: "700",
    marginBottom: "18px"
  },
  hero: {
    background: "linear-gradient(135deg, #194A2A 0%, #6DBF3F 100%)",
    borderRadius: "8px",
    color: "#fff",
    overflow: "hidden",
    boxShadow: "0 14px 34px rgba(35, 83, 34, 0.18)"
  },
  heroContent: {
    padding: "38px",
    maxWidth: "760px"
  },
  badge: {
    display: "inline-block",
    background: "rgba(255,255,255,0.16)",
    border: "1px solid rgba(255,255,255,0.32)",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "13px",
    fontWeight: "700"
  },
  title: {
    fontSize: "34px",
    lineHeight: 1.15,
    margin: "18px 0 10px"
  },
  description: {
    fontSize: "16px",
    lineHeight: 1.6,
    margin: 0,
    color: "rgba(255,255,255,0.88)"
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginTop: "28px"
  },
  metaItem: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.22)",
    borderRadius: "8px",
    padding: "14px"
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
    gridTemplateColumns: "1fr 360px",
    gap: "22px",
    marginTop: "24px"
  },
  detailsPanel: {
    background: "#fff",
    border: "1px solid #DFE7DA",
    borderRadius: "8px",
    padding: "26px"
  },
  sectionTitle: {
    margin: "0 0 10px",
    fontSize: "22px",
    color: "#1F2A1B"
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
  checkoutPanel: {
    background: "#fff",
    border: "1px solid #DFE7DA",
    borderRadius: "8px",
    padding: "24px",
    boxShadow: "0 12px 26px rgba(31, 58, 26, 0.12)",
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
    background: "#7AC143",
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
    borderRadius: "8px",
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
    fontWeight: "800"
  },
  muted: {
    color: "#5E6A59"
  }
};

export default TrainingDetails;
