import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import mi27Logo from "../assets/mi27-organization.jpeg";
import "./Login.css";

function Login() {
  const [coachId, setCoachId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCoachIdChange = (e) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10);
    setCoachId(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^[a-zA-Z0-9]{8,10}$/.test(coachId)) {
      setError("Enter a valid 8 to 10 character Herbalife ID");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/login", { coachId });

      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("coachId");
      localStorage.removeItem("coachLoggedIn");
      sessionStorage.removeItem("adminToken");
      sessionStorage.removeItem("adminUsername");

      sessionStorage.setItem("userId", res.data.userId);
      sessionStorage.setItem("coachId", res.data.coachId);
      sessionStorage.setItem("role", res.data.role || "coach");

      if (res.data.role === "admin") {
        sessionStorage.setItem("token", res.data.token);
        sessionStorage.setItem("coachLoggedIn", "true");
        sessionStorage.setItem("adminToken", res.data.token);
        sessionStorage.setItem("adminUsername", res.data.coachId);
        navigate("/admin", { replace: true });
        return;
      }

      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("coachLoggedIn", "true");
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const isCoachIdReady = /^[A-Z0-9]{8,10}$/.test(coachId);

  return (
    <div className="login-page">
      <main className="login-shell">
        <section className="login-brand-panel">
          <div className="login-brand-row">
            <div className="login-brand-mark">MI</div>
            <p className="login-kicker">Herbalife Training Desk</p>
          </div>
          <img className="login-brand-image" src={mi27Logo} alt="" aria-hidden="true" />
          <h1 className="login-heading">TICKETS, BOOKINGS, AND PASSES IN ONE CALM PLACE.</h1>
          <div className="login-stats-grid">
            <div className="login-stat">
              <span className="login-stat-value">24/7</span>
              <span className="login-stat-label">Access</span>
            </div>
            <div className="login-stat">
              <span className="login-stat-value">QR</span>
              <span className="login-stat-label">Tickets</span>
            </div>
          </div>
        </section>

        <section className="login-card" aria-label="Coach login">
          <div className="login-card-header">
            <span className="login-badge">Coach Portal</span>
            <h2 className="login-title">Welcome back</h2>
            <p className="login-subtitle">Sign in with your 8 to 10 character Herbalife ID.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <label className="login-label" htmlFor="coachId">
              Herbalife ID
            </label>
            <input
              id="coachId"
              type="text"
              placeholder="Enter your Herbalife ID"
              value={coachId}
              onChange={handleCoachIdChange}
              className={[
                "login-input",
                error ? "login-input-error" : "",
                isCoachIdReady ? "login-input-ready" : ""
              ].join(" ")}
              maxLength={10}
              autoComplete="username"
              autoFocus
            />

            <div className="login-helper-row">
              <span>{coachId.length}/8-10 characters</span>
              <span className={isCoachIdReady ? "login-status-ready" : "login-status"}>
                {isCoachIdReady ? "Ready" : "Enter your ID"}
              </span>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button disabled={loading} className="login-button">
              {loading ? "Checking ID..." : "Login"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default Login;
