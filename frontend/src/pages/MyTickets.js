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
          transactionId: order.transaction_id,
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
        <h2>My Tickets</h2>

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
            <h3>{t.title}</h3>
            <p>Order ID: {t.orderId}</p>
            <p>{t.date}</p>
            <p>{t.location}</p>
            <p>Quantity: {t.quantity}</p>
            <p>Status: <b>{formatStatus(t.status)}</b></p>
            <p>
              <b>Rs. {t.total}</b>
            </p>
            {t.transactionId && <p>Transaction ID: {t.transactionId}</p>}
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
  if (status === "PENDING_VERIFICATION") return "Pending admin verification";
  if (status === "CONFIRMED") return "Confirmed";
  if (status === "REJECTED") return "Payment rejected";
  return status || "Pending";
};

const styles = {
  page: {
    padding: "30px",
    boxSizing: "border-box",
    background: "#F4F7F3",
    minHeight: "calc(100vh - 64px)",
    overflowX: "hidden"
  },
  pageMobile: {
    padding: "18px 16px"
  },
  card: {
    border: "1px solid #ccc",
    padding: "15px",
    marginBottom: "15px",
    background: "#fff",
    borderRadius: "8px",
    overflowWrap: "anywhere"
  },
  successBox: {
    background: "#EAF7E2",
    border: "1px solid #BFE4A8",
    borderRadius: "8px",
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
