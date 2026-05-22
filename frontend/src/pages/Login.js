import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

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

    if (!/^[a-zA-Z0-9]{10}$/.test(coachId)) {
      setError("Enter a valid 10 character Herbalife ID");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/login", { coachId });

      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("coachId");
      localStorage.removeItem("coachLoggedIn");

      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("userId", res.data.userId);
      sessionStorage.setItem("coachId", res.data.coachId);
      sessionStorage.setItem("coachLoggedIn", "true");

      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Enter 10 character Herbalife ID"
            value={coachId}
            onChange={handleCoachIdChange}
            style={styles.input}
            maxLength={10}
            autoComplete="username"
          />

          {error && <p style={styles.error}>{error}</p>}

          <button disabled={loading} style={styles.button}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f5f5"
  },
  card: {
    width: "350px",
    padding: "30px",
    borderRadius: "8px",
    background: "#fff",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)"
  },
  title: {
    textAlign: "center",
    marginTop: 0
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    marginTop: "15px"
  },
  input: {
    padding: "10px",
    fontSize: "15px",
    borderRadius: "4px",
    border: "1px solid #ccc"
  },
  button: {
    padding: "10px",
    background: "#7AC143",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontWeight: "600"
  },
  error: {
    color: "#c62828",
    fontSize: "14px",
    margin: 0
  }
};

export default Login;
