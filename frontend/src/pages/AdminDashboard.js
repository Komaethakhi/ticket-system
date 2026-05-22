import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const navigate = useNavigate();

  const loadSummary = async () => {
    try {
      setError("");
      setLoading(true);
      const res = await api.get("/admin/summary");
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminUsername");
    navigate("/admin/login", { replace: true });
  };

  const handleExport = async () => {
    try {
      setDownloading(true);
      const res = await api.get("/admin/orders/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `ticket-orders-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download Excel sheet");
    } finally {
      setDownloading(false);
    }
  };

  const totals = data?.totals || {};
  const coachSummary = data?.coachSummary || [];
  const orders = data?.orders || [];

  return (
    <main className="admin-dashboard-page">
      <header className="admin-dashboard-header">
        <div>
          <span className="admin-dashboard-badge">Admin</span>
          <h1>Ticket Sales Dashboard</h1>
          <p>Live confirmed ticket orders from the database.</p>
        </div>
        <div className="admin-dashboard-actions">
          <button onClick={loadSummary} className="admin-secondary-button">Refresh</button>
          <button onClick={handleExport} className="admin-primary-button" disabled={downloading}>
            {downloading ? "Preparing..." : "Download Excel"}
          </button>
          <button onClick={handleLogout} className="admin-logout-button">Logout</button>
        </div>
      </header>

      {error && <p className="admin-dashboard-error">{error}</p>}
      {loading && <p className="admin-dashboard-loading">Loading dashboard...</p>}

      {!loading && data && (
        <>
          <section className="admin-metrics-grid">
            <article>
              <span>Total Tickets Sold</span>
              <strong>{totals.totalTicketsSold || 0}</strong>
            </article>
            <article>
              <span>Total Revenue</span>
              <strong>Rs. {totals.totalRevenue || 0}</strong>
            </article>
            <article>
              <span>Paid Orders</span>
              <strong>{totals.totalOrders || 0}</strong>
            </article>
            <article>
              <span>Unique IDs</span>
              <strong>{totals.uniqueCoaches || 0}</strong>
            </article>
          </section>

          <section className="admin-section">
            <div className="admin-section-title">
              <h2>Coach-wise Tickets</h2>
              <p>Each Herbalife ID and how many tickets they purchased.</p>
            </div>
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Herbalife ID</th>
                    <th>Orders</th>
                    <th>Tickets</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {coachSummary.map((coach) => (
                    <tr key={coach.coachId}>
                      <td>{coach.coachId}</td>
                      <td>{coach.orderCount}</td>
                      <td>{coach.totalTickets}</td>
                      <td>Rs. {coach.totalAmount}</td>
                    </tr>
                  ))}
                  {coachSummary.length === 0 && (
                    <tr>
                      <td colSpan="4">No confirmed orders yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-section">
            <div className="admin-section-title">
              <h2>Order Details</h2>
              <p>Every confirmed ticket order that will be included in the Excel download.</p>
            </div>
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Herbalife ID</th>
                    <th>Training</th>
                    <th>Date</th>
                    <th>Qty</th>
                    <th>Amount</th>
                    <th>Payment ID</th>
                    <th>Booked At</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.orderId}>
                      <td>{order.coachId}</td>
                      <td>{order.eventTitle}</td>
                      <td>{order.eventDate}</td>
                      <td>{order.quantity}</td>
                      <td>Rs. {order.amount}</td>
                      <td>{order.paymentId || "-"}</td>
                      <td>{order.bookedAt ? new Date(order.bookedAt).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan="7">No confirmed orders yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default AdminDashboard;
