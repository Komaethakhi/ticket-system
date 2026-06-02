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
    background: "#7AC143", // Herbalife green
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    padding: "0 30px",
    boxSizing: "border-box"
  },
  navMobile: {
    alignItems: "stretch",
    flexDirection: "column",
    padding: "12px 16px"
  },
  logo: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "600",
    lineHeight: 1.2
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
    background: "#fff",
    color: "#5FA92D",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600"
  },
  logout: {
    background: "rgba(16, 24, 40, 0.22)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.28)",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600"
  }
};

export default Navbar;
