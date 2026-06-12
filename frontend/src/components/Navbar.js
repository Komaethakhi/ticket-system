import { useNavigate } from "react-router-dom";
import useIsMobile from "../hooks/useIsMobile";

function Navbar() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isAdmin = Boolean(sessionStorage.getItem("adminToken"));

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("coachId");
    sessionStorage.removeItem("coachLoggedIn");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminUsername");
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("coachId");
    localStorage.removeItem("coachLoggedIn");
    navigate("/login", { replace: true });
  };

  return (
    <div style={{ ...styles.nav, ...(isMobile ? styles.navMobile : {}) }}>
      <h2 style={{ ...styles.logo, ...(isMobile ? styles.logoMobile : {}) }}>
        Herbalife Training Portal
      </h2>

      <div style={{ ...styles.actions, ...(isMobile ? styles.actionsMobile : {}) }}>
        <button onClick={() => navigate("/")} style={styles.navButton}>
          Events
        </button>
        {isAdmin && (
          <button onClick={() => navigate("/admin")} style={styles.navButton}>
            Dashboard
          </button>
        )}
        <button onClick={handleLogout} style={styles.logout}>
          Logout
        </button>
      </div>
    </div>
  );
}

const styles = {
  nav: {
    minHeight: "64px",
    position: "sticky",
    top: 0,
    zIndex: 20,
    background: "linear-gradient(135deg, rgba(0, 99, 65, 0.98), rgba(0, 133, 84, 0.96))",
    backdropFilter: "blur(18px)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    padding: "0 30px",
    boxSizing: "border-box",
    borderBottom: "4px solid #7AC143",
    boxShadow: "0 14px 34px rgba(0, 69, 44, 0.24)"
  },
  navMobile: {
    alignItems: "stretch",
    flexDirection: "column",
    padding: "12px 16px"
  },
  logo: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "900",
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
    display: "inline-flex",
    alignItems: "center",
    gap: "10px"
  },
  logoMobile: {
    fontSize: "16px",
    maxWidth: "210px"
  },
  actions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "10px",
    flexWrap: "wrap"
  },
  actionsMobile: {
    justifyContent: "flex-start",
    gap: "8px"
  },
  navButton: {
    background: "rgba(255,255,255,0.96)",
    color: "#006341",
    border: "1px solid rgba(255,255,255,0.55)",
    padding: "8px 16px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: "800",
    boxShadow: "0 8px 18px rgba(0, 99, 65, 0.08)"
  },
  logout: {
    background: "linear-gradient(135deg, #006341, #008554)",
    color: "#fff",
    border: "1px solid #006341",
    padding: "8px 16px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: "800",
    boxShadow: "0 12px 24px rgba(0, 99, 65, 0.18)"
  }
};

export default Navbar;
