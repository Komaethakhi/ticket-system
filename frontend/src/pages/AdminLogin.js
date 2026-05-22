import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./AdminLogin.css";

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const res = await api.post("/admin/login", { username, password });

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("userId");
      sessionStorage.removeItem("coachId");
      sessionStorage.removeItem("coachLoggedIn");
      sessionStorage.setItem("adminToken", res.data.token);
      sessionStorage.setItem("adminUsername", res.data.username);

      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <span className="admin-login-badge">Admin Console</span>
        <h1>Ticket Sales Dashboard</h1>
        <p>Sign in to view sold tickets, coach-wise purchase counts, and export orders.</p>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <label htmlFor="adminUsername">Username</label>
          <input
            id="adminUsername"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter admin username"
            autoComplete="username"
          />

          <label htmlFor="adminPassword">Password</label>
          <input
            id="adminPassword"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            autoComplete="current-password"
          />

          {error && <p className="admin-login-error">{error}</p>}

          <button disabled={loading}>
            {loading ? "Signing in..." : "Login as Admin"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default AdminLogin;
