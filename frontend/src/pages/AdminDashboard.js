import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import api from "../services/api";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [coachRows, setCoachRows] = useState([
    { coachId: "", coachName: "", mobileNumber: "" }
  ]);
  const [addingCoachIds, setAddingCoachIds] = useState(false);
  const [coachIdMessage, setCoachIdMessage] = useState("");
  const [coachIdResult, setCoachIdResult] = useState(null);
  const [contactDrafts, setContactDrafts] = useState({});
  const [nameDrafts, setNameDrafts] = useState({});
  const [savingContactId, setSavingContactId] = useState("");
  const [confirmingOrderId, setConfirmingOrderId] = useState("");
  const navigate = useNavigate();

  const loadSummary = async ({ showLoader = true } = {}) => {
    try {
      setError("");
      if (showLoader) {
        setLoading(true);
      }
      const res = await api.get("/admin/summary");
      setData(res.data);
      setContactDrafts(
        (res.data.coachContacts || []).reduce((drafts, coach) => ({
          ...drafts,
          [coach.id]: coach.mobileNumber || ""
        }), {})
      );
      setNameDrafts(
        (res.data.coachContacts || []).reduce((drafts, coach) => ({
          ...drafts,
          [coach.id]: coach.coachName || ""
        }), {})
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin dashboard");
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const canBookTickets = Boolean(sessionStorage.getItem("token"));
  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("coachId");
    sessionStorage.removeItem("coachLoggedIn");
    sessionStorage.removeItem("role");
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

  const handleAddCoachIds = async (e) => {
    e.preventDefault();
    setCoachIdMessage("");
    setCoachIdResult(null);
    setError("");

    const coachIds = coachRows
      .map((row) => ({
        coachId: row.coachId.trim().toUpperCase(),
        coachName: row.coachName.trim(),
        mobileNumber: row.mobileNumber.trim()
      }))
      .filter((row) => row.coachId || row.coachName || row.mobileNumber);

    try {
      setAddingCoachIds(true);
      const res = await api.post("/admin/coach-ids", { coachIds });
      const { added = [], skipped = [], invalid = [], updated = [] } = res.data;
      setCoachIdMessage(
        `Added ${added.length} ID(s). Updated ${updated.length}. Skipped ${skipped.length}. Invalid ${invalid.length}.`
      );
      setCoachIdResult(res.data);
      setCoachRows([{ coachId: "", coachName: "", mobileNumber: "" }]);
      await loadSummary();
    } catch (err) {
      if (err.response?.data) {
        const { added = [], skipped = [], invalid = [], updated = [] } = err.response.data;
        setCoachIdResult(err.response.data);
        setCoachIdMessage(
          `Added ${added.length} ID(s). Updated ${updated.length}. Skipped ${skipped.length}. Invalid ${invalid.length}.`
        );
      }
      setError(err.response?.data?.message || "Failed to add coach IDs");
    } finally {
      setAddingCoachIds(false);
    }
  };

  const handleCoachRowChange = (index, field, value) => {
    setCoachRows((currentRows) =>
      currentRows.map((row, rowIndex) => {
        if (rowIndex !== index) {
          return row;
        }

        const nextValueByField = {
          coachId: value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10),
          coachName: value.replace(/[^\w\s.'-]/g, "").slice(0, 60),
          mobileNumber: value.replace(/\D/g, "").slice(0, 10)
        };

        return {
          ...row,
          [field]: nextValueByField[field] ?? value
        };
      })
    );
  };

  const handleAddCoachRow = () => {
    setCoachRows((currentRows) => [
      ...currentRows,
      { coachId: "", coachName: "", mobileNumber: "" }
    ]);
  };

  const handleRemoveCoachRow = (index) => {
    setCoachRows((currentRows) => {
      if (currentRows.length === 1) {
        return [{ coachId: "", coachName: "", mobileNumber: "" }];
      }

      return currentRows.filter((_, rowIndex) => rowIndex !== index);
    });
  };

  const handleContactChange = (coachId, value) => {
    setContactDrafts((currentDrafts) => ({
      ...currentDrafts,
      [coachId]: value.replace(/\D/g, "").slice(0, 10)
    }));
  };

  const handleNameChange = (coachId, value) => {
    setNameDrafts((currentDrafts) => ({
      ...currentDrafts,
      [coachId]: value.replace(/[^\w\s.'-]/g, "").slice(0, 60)
    }));
  };

  const handleConfirmPayment = async (order) => {
    const ok = window.confirm(
      `Confirm payment for ${order.coachId} - Rs. ${order.amount}? Message will be sent only after this approval.`
    );

    if (!ok) {
      return;
    }

    try {
      setConfirmingOrderId(order.orderId);
      setError("");
      await api.post(`/admin/orders/${order.orderId}/confirm-payment`);
      await loadSummary({ showLoader: false });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to confirm payment");
    } finally {
      setConfirmingOrderId("");
    }
  };
  const handleSaveContact = async (coach) => {
    try {
      setSavingContactId(coach.id);
      setError("");
      const res = await api.put(`/admin/coaches/${coach.id}/contact`, {
        coachName: nameDrafts[coach.id] || "",
        mobileNumber: contactDrafts[coach.id] || ""
      });
      setData((currentData) => {
        if (!currentData) {
          return currentData;
        }

        const coachContacts = (currentData.coachContacts || []).map((contact) =>
          contact.id === coach.id ? res.data.coach : contact
        );

        return {
          ...currentData,
          coachContacts,
          totals: {
            ...currentData.totals,
            coachContacts: coachContacts.filter((contact) => contact.mobileNumber).length,
            missingCoachContacts: coachContacts.filter((contact) => !contact.mobileNumber).length
          }
        };
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update mobile number");
    } finally {
      setSavingContactId("");
    }
  };

  const renderIdList = (label, ids) => {
    if (!ids || ids.length === 0) {
      return null;
    }

    return (
      <div className="admin-coach-result-group">
        <strong>{label}</strong>
        <div className="admin-coach-result-list">
          {ids.map((id, index) => (
            <span key={`${label}-${id}-${index}`}>{id}</span>
          ))}
        </div>
      </div>
    );
  };

  const totals = data?.totals || {};
  const coachSummary = data?.coachSummary || [];
  const coachContacts = data?.coachContacts || [];
  const pendingPaymentOrders = data?.pendingPaymentOrders || [];
  const orders = data?.orders || [];

  return (
    <main className="admin-dashboard-page">
      <header className="admin-dashboard-header">
        <div>
          <span className="admin-dashboard-badge">Admin</span>
          <h1>Ticket Sales Dashboard</h1>
          <p>Verify submitted payments before ticket confirmations are sent.</p>
        </div>
        <div className="admin-dashboard-actions">
          {canBookTickets && (
            <button onClick={() => navigate("/")} className="admin-primary-button">
              Book Tickets
            </button>
          )}
          <button onClick={() => loadSummary()} className="admin-secondary-button">Refresh</button>
          <button onClick={handleExport} className="admin-primary-button" disabled={downloading}>
            {downloading ? "Preparing..." : "Download Excel"}
          </button>
          <button onClick={handleLogout} className="admin-logout-button">Logout</button>
        </div>
      </header>

      {error && <p className="admin-dashboard-error">{error}</p>}
      {loading && <LoadingSpinner fullHeight />}

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
              <span>Pending Verification</span>
              <strong>{totals.pendingPayments || 0}</strong>
            </article>
            <article>
              <span>Unique IDs</span>
              <strong>{totals.uniqueCoaches || 0}</strong>
            </article>
            <article>
              <span>Registered IDs</span>
              <strong>{totals.registeredCoachIds || 0}</strong>
            </article>
            <article>
              <span>Contacts Saved</span>
              <strong>{totals.coachContacts || 0}</strong>
            </article>
          </section>

          <section className="admin-section">
            <div className="admin-section-title">
              <div>
                <h2>Pending Payment Verification</h2>
                <p>Confirm only after checking the payment in your UPI/bank account.</p>
              </div>
            </div>
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Herbalife ID</th>
                    <th>Training</th>
                    <th>Qty</th>
                    <th>Amount</th>
                    <th>UPI Ref</th>
                    <th>Submitted At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPaymentOrders.map((order) => (
                    <tr key={order.orderId}>
                      <td>{order.coachId}</td>
                      <td>{order.eventTitle}</td>
                      <td>{order.quantity}</td>
                      <td>Rs. {order.amount}</td>
                      <td>{order.transactionId || order.paymentId || "-"}</td>
                      <td>{order.submittedAt ? new Date(order.submittedAt).toLocaleString() : "-"}</td>
                      <td>
                        <button
                          className="admin-save-button"
                          disabled={confirmingOrderId === order.orderId}
                          onClick={() => handleConfirmPayment(order)}
                        >
                          {confirmingOrderId === order.orderId ? "Confirming..." : "Confirm Payment"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pendingPaymentOrders.length === 0 && (
                    <tr>
                      <td colSpan="7">No payments waiting for verification.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          <section className="admin-section">
            <div className="admin-section-title">
              <div>
                <h2>Add Coach IDs & WhatsApp Numbers</h2>
                <p>Enter each Herbalife ID with its WhatsApp mobile number.</p>
              </div>
            </div>
            <form className="admin-coach-form" onSubmit={handleAddCoachIds}>
              <div className="admin-coach-entry-table">
                <div className="admin-coach-entry-header">
                  <span>Herbalife ID</span>
                  <span>Coach Name</span>
                  <span>WhatsApp Mobile Number</span>
                  <span>Action</span>
                </div>
                {coachRows.map((row, index) => (
                  <div className="admin-coach-entry-row" key={`coach-row-${index}`}>
                    <input
                      value={row.coachId}
                      onChange={(e) => handleCoachRowChange(index, "coachId", e.target.value)}
                      placeholder="W1C4642850"
                    />
                    <input
                      value={row.coachName}
                      onChange={(e) => handleCoachRowChange(index, "coachName", e.target.value)}
                      placeholder="Coach name"
                    />
                    <input
                      value={row.mobileNumber}
                      onChange={(e) => handleCoachRowChange(index, "mobileNumber", e.target.value)}
                      placeholder="9876543210"
                    />
                    <button
                      type="button"
                      className="admin-row-remove-button"
                      onClick={() => handleRemoveCoachRow(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="admin-coach-form-actions">
                {coachIdMessage && <p>{coachIdMessage}</p>}
                <div className="admin-coach-form-buttons">
                  <button
                    type="button"
                    className="admin-add-row-button"
                    onClick={handleAddCoachRow}
                  >
                    Add Row
                  </button>
                  <button disabled={addingCoachIds}>
                    {addingCoachIds ? "Adding..." : "Add Coach Contacts"}
                  </button>
                </div>
              </div>
              {coachIdResult && (
                <div className="admin-coach-result">
                  {renderIdList("Added", coachIdResult.added)}
                  {renderIdList("Mobile updated", coachIdResult.updated)}
                  {renderIdList("Already exists", coachIdResult.existing)}
                  {renderIdList("Duplicate in paste", coachIdResult.duplicate)}
                  {renderIdList("Invalid", coachIdResult.invalid)}
                </div>
              )}
            </form>
          </section>

          <section className="admin-section">
            <div className="admin-section-title">
              <div>
                <h2>Coach Contacts & Greetings</h2>
                <p>Save mobile numbers for registered IDs and send the greeting message on WhatsApp.</p>
              </div>
            </div>
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Herbalife ID</th>
                    <th>Coach Name</th>
                    <th>Mobile Number</th>
                    <th>Greeting</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {coachContacts.map((coach) => (
                    <tr key={coach.id}>
                      <td>{coach.coachId}</td>
                      <td>
                        <input
                          className="admin-contact-input"
                          value={nameDrafts[coach.id] || ""}
                          onChange={(e) => handleNameChange(coach.id, e.target.value)}
                          placeholder="Enter coach name"
                        />
                      </td>
                      <td>
                        <input
                          className="admin-contact-input"
                          value={contactDrafts[coach.id] || ""}
                          onChange={(e) => handleContactChange(coach.id, e.target.value)}
                          placeholder="Enter mobile number"
                        />
                      </td>
                      <td>
                        {coach.greetingLink ? (
                          <a
                            href={coach.greetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="admin-whatsapp-link"
                          >
                            Send Greeting
                          </a>
                        ) : "Add mobile number"}
                      </td>
                      <td>
                        <button
                          className="admin-save-button"
                          disabled={savingContactId === coach.id}
                          onClick={() => handleSaveContact(coach)}
                        >
                          {savingContactId === coach.id ? "Saving..." : "Save"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {coachContacts.length === 0 && (
                    <tr>
                      <td colSpan="5">No coach IDs registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
              <p>Every admin-confirmed ticket order that will be included in the Excel download.</p>
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
                    <th>WhatsApp</th>
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
                      <td>
                        {order.whatsappLink ? (
                          <a
                            href={order.whatsappLink}
                            target="_blank"
                            rel="noreferrer"
                            className="admin-whatsapp-link"
                          >
                            Send Message
                          </a>
                        ) : "-"}
                      </td>
                      <td>{order.bookedAt ? new Date(order.bookedAt).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan="8">No confirmed orders yet.</td>
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