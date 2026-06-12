import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import api from "../services/api";
import useIsMobile from "../hooks/useIsMobile";

function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const res = await api.get("/orders/my");
        const paidTickets = res.data.map((order) => ({
          id: order._id,
          title: order.eventId.title,
          date: order.eventId.date,
          location: order.eventId.location,
          quantity: order.quantity,
          total: order.amount,
          paymentId: order.payment_id,
          whatsappNumber: order.whatsapp_number,
          status: order.status,
          adminNote: order.admin_note,
          orderId: order._id,
          bookedAt: order.booked_at,
          verifiedAt: order.verified_at
        }));
        setTickets(paidTickets);
        localStorage.setItem("myTickets", JSON.stringify(paidTickets));
      } catch (err) {
        const localTickets = JSON.parse(localStorage.getItem("myTickets")) || [];
        setTickets(localTickets);
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, []);

  return (
    <>
      <Navbar />
      <main style={{ ...styles.page, ...(isMobile ? styles.pageMobile : {}) }}>
        <section style={styles.hero}>
          <span style={styles.badge}>Ticket Wallet</span>
          <h2 style={styles.heading}>My Tickets</h2>
          <p style={styles.subText}>Track confirmations, payment status, and order details in one place.</p>
        </section>

        {loading && <LoadingSpinner fullHeight />}
        {!loading && tickets.length === 0 && <p>No tickets booked yet.</p>}

        {tickets.map((t) => (
          <div key={t.id} style={styles.card}>
            {t.status === "CONFIRMED" && (
              <div style={styles.successBox}>
                <h3 style={styles.successTitle}>Congratulations!</h3>
                <p style={styles.successText}>Your order was placed successfully.</p>
              </div>
            )}
            <h3 style={styles.cardTitle}>{t.title}</h3>
            <p style={styles.orderId}>Order ID: {t.orderId}</p>
            <p>{t.date}</p>
            <p>{t.location}</p>
            <p>Quantity: {t.quantity}</p>
            <p>Status: <b>{formatStatus(t.status)}</b></p>
            <p>
              <b>Rs. {t.total}</b>
            </p>
            {t.whatsappNumber && <p>WhatsApp Number: {t.whatsappNumber}</p>}
            {t.bookedAt && <p>Booked At: {new Date(t.bookedAt).toLocaleString()}</p>}
            {t.verifiedAt && <p>Verified At: {new Date(t.verifiedAt).toLocaleString()}</p>}
            {t.adminNote && <p>Admin note: {t.adminNote}</p>}
          </div>
        ))}
      </main>
    </>
  );
}

const formatStatus = (status) => {
  if (status === "PENDING_VERIFICATION") return "Confirmation in progress";
  if (status === "CONFIRMED") return "Confirmed";
  if (status === "REJECTED") return "Payment rejected";
  return status || "Pending";
};

const styles = {
  page: {
    padding: "30px",
    boxSizing: "border-box",
    background:
      "radial-gradient(circle at 8% 0%, rgba(201,164,65,0.22), transparent 24rem), radial-gradient(circle at 88% 10%, rgba(0,99,65,0.12), transparent 25rem), linear-gradient(135deg, #F8FAF7 0%, #EEF2F5 48%, #FFFFFF 100%)",
    minHeight: "calc(100vh - 64px)",
    overflowX: "hidden"
  },
  pageMobile: {
    padding: "18px 16px"
  },
  card: {
    width: "min(920px, 100%)",
    border: "1px solid #DCEFD4",
    borderTop: "6px solid #7AC143",
    padding: "24px",
    margin: "0 auto 18px",
    background: "rgba(255,255,255,0.92)",
    borderRadius: "24px",
    overflowWrap: "anywhere",
    boxShadow: "0 20px 54px rgba(31, 45, 38, 0.1)"
  },
  hero: {
    width: "min(920px, 100%)",
    margin: "0 auto 24px",
    padding: "34px",
    color: "#fff",
    borderRadius: "28px",
    background: "linear-gradient(135deg, #17351F 0%, #2D5A43 58%, #C9A441 100%)",
    border: "1px solid rgba(255,255,255,0.28)",
    borderLeft: "12px solid #C9A441",
    boxShadow: "0 28px 70px rgba(29, 44, 38, 0.22)"
  },
  badge: {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.16)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.32)",
    fontSize: "12px",
    fontWeight: "900",
    letterSpacing: "0.06em",
    textTransform: "uppercase"
  },
  heading: {
    margin: "14px 0 8px",
    fontSize: "38px",
    letterSpacing: "-0.04em"
  },
  subText: {
    margin: 0,
    color: "rgba(255,255,255,0.84)"
  },
  cardTitle: {
    margin: "0 0 8px",
    color: "#17351F",
    fontSize: "24px",
    letterSpacing: "-0.02em"
  },
  orderId: {
    color: "#64735F",
    fontSize: "13px"
  },
  successBox: {
    background: "#EAF7E2",
    border: "1px solid #BFE4A8",
    borderRadius: "18px",
    padding: "14px",
    marginBottom: "14px"
  },
  successTitle: {
    color: "#287A12",
    margin: "0 0 6px"
  },
  successText: {
    color: "#31551F",
    fontWeight: "700",
    margin: 0
  }
};

export default MyTickets;
