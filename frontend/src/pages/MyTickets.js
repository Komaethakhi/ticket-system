import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

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
          paymentId: order.payment_id
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
      <div style={{ padding: "30px" }}>
        <h2>My Tickets</h2>

        {loading && <p>Loading tickets...</p>}
        {!loading && tickets.length === 0 && <p>No tickets booked yet.</p>}

        {tickets.map((t) => (
          <div key={t.id} style={styles.card}>
            <h3>{t.title}</h3>
            <p>{t.date}</p>
            <p>{t.location}</p>
            <p>Quantity: {t.quantity}</p>
            <p>
              <b>Rs. {t.total}</b>
            </p>
            {t.paymentId && <p>Payment ID: {t.paymentId}</p>}
          </div>
        ))}
      </div>
    </>
  );
}

const styles = {
  card: {
    border: "1px solid #ccc",
    padding: "15px",
    marginBottom: "15px"
  }
};

export default MyTickets;
