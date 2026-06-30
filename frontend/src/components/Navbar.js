import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useIsMobile from "../hooks/useIsMobile";
import mi27Logo from "../assets/mi27-logo.jpeg";
import {
  ASSOCIATE_ACADEMY_BOOKING_CLOSE_AT,
  ASSOCIATE_ACADEMY_EARLY_PRICE,
  ASSOCIATE_ACADEMY_PRICE_CHANGE_AT,
  ASSOCIATE_ACADEMY_REGULAR_PRICE
} from "../utils/eventPricing";

const getCountdownParts = () => {
  const now = Date.now();
  const priceChangeMs = ASSOCIATE_ACADEMY_PRICE_CHANGE_AT.getTime();
  const bookingCloseMs = ASSOCIATE_ACADEMY_BOOKING_CLOSE_AT.getTime();
  const targetMs = now < priceChangeMs ? priceChangeMs : bookingCloseMs;
  const remainingMs = Math.max(0, targetMs - now);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    bookingClosed: now >= bookingCloseMs,
    priceChanged: now >= priceChangeMs
  };
};

const formatTwoDigits = (value) => String(value).padStart(2, "0");

function Navbar() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isAdmin = Boolean(sessionStorage.getItem("adminToken"));
  const [countdown, setCountdown] = useState(getCountdownParts);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownParts());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
    <header style={styles.header}>
      <div style={{ ...styles.nav, ...(isMobile ? styles.navMobile : {}) }}>
        <h2 style={{ ...styles.logo, ...(isMobile ? styles.logoMobile : {}) }}>
          <img src={mi27Logo} alt="MI27 Organization" style={styles.logoImage} />
          <span>MI Portal</span>
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
      <div style={{ ...styles.countdownBar, ...(isMobile ? styles.countdownBarMobile : {}) }}>
        {!countdown.bookingClosed ? (
          <>
            <div style={styles.countdownGroup} aria-label="Time left for Associate Academy early ticket price">
              <span style={styles.timeBox}>{formatTwoDigits(countdown.days)}</span>
              <span style={styles.timeUnit}>D</span>
              <span style={styles.timeDivider}>:</span>
              <span style={styles.timeBox}>{formatTwoDigits(countdown.hours)}</span>
              <span style={styles.timeUnit}>H</span>
              <span style={styles.timeDivider}>:</span>
              <span style={styles.timeBox}>{formatTwoDigits(countdown.minutes)}</span>
              <span style={styles.timeUnit}>M</span>
              <span style={styles.timeDivider}>:</span>
              <span style={styles.timeBox}>{formatTwoDigits(countdown.seconds)}</span>
              <span style={styles.timeUnit}>S</span>
            </div>
            <strong style={styles.countdownText}>
              {countdown.priceChanged
                ? `Time left for Associate Academy booking at Rs.${ASSOCIATE_ACADEMY_REGULAR_PRICE}`
                : `Time left for Associate Academy Rs.${ASSOCIATE_ACADEMY_EARLY_PRICE} ticket`}
            </strong>
          </>
        ) : (
          <strong style={styles.countdownText}>
            Associate Academy booking is closed
          </strong>
        )}
      </div>
    </header>
  );
}

const styles = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    boxShadow: "0 14px 34px rgba(29, 44, 38, 0.22)"
  },
  nav: {
    minHeight: "64px",
    background: "linear-gradient(135deg, rgba(23, 53, 31, 0.98), rgba(45, 90, 67, 0.96))",
    backdropFilter: "blur(18px)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    padding: "0 30px",
    boxSizing: "border-box",
    borderBottom: "4px solid #C9A441"
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
  logoImage: {
    width: "46px",
    height: "30px",
    objectFit: "contain",
    background: "#fff",
    borderRadius: "6px",
    padding: "3px",
    boxSizing: "border-box"
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
  },
  countdownBar: {
    minHeight: "54px",
    background: "#505050",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 28px",
    boxSizing: "border-box",
    borderBottom: "1px solid rgba(255,255,255,0.12)"
  },
  countdownBarMobile: {
    alignItems: "flex-start",
    flexDirection: "column",
    gap: "8px",
    padding: "10px 16px"
  },
  countdownGroup: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    flexWrap: "wrap"
  },
  timeBox: {
    minWidth: "34px",
    height: "36px",
    border: "2px solid rgba(255,255,255,0.86)",
    borderRadius: "6px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "22px",
    fontWeight: "900",
    lineHeight: 1,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)"
  },
  timeUnit: {
    fontSize: "22px",
    fontWeight: "900",
    lineHeight: 1
  },
  timeDivider: {
    fontSize: "22px",
    fontWeight: "900",
    lineHeight: 1,
    opacity: 0.95
  },
  countdownText: {
    fontSize: "17px",
    lineHeight: 1.2,
    overflowWrap: "anywhere"
  }
};

export default Navbar;
