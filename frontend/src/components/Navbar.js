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
    background: "linear-gradient(135deg, rgba(18, 72, 38, 0.96), rgba(70, 154, 58, 0.95))",
    backdropFilter: "blur(18px)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    padding: "0 30px",
    boxSizing: "border-box",
    borderBottom: "1px solid rgba(255,255,255,0.16)",
    boxShadow: "0 14px 34px rgba(16, 55, 26, 0.22)"
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
    letterSpacing: "-0.02em"
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
    background: "rgba(255,255,255,0.94)",
    color: "#1E6B34",
    border: "1px solid rgba(255,255,255,0.5)",
    padding: "8px 16px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: "800",
    boxShadow: "0 8px 18px rgba(8, 38, 17, 0.12)"
  },
  logout: {
    background: "rgba(16, 24, 40, 0.28)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.28)",
    padding: "8px 16px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: "800"
  }
};

export default Navbar;
