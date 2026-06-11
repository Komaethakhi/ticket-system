import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import api from "../services/api";
import useIsMobile from "../hooks/useIsMobile";

const getEventImage = (title) => {
  if (String(title || "").toUpperCase() === "WELLNESS SEMINAR") {
    return "/events/wellness-seminar.jpeg?v=2";
  }

  return "";
};

function Home() {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadTrainings = async () => {
      try {
        const res = await api.get("/events");
        setTrainings(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTrainings();
  }, []);

  return (
    <>
      <Navbar />

      <main style={{ ...styles.page, ...(isMobile ? styles.pageMobile : {}) }}>
        <section style={{ ...styles.hero, ...(isMobile ? styles.heroMobile : {}) }}>
          <div>
            <span style={styles.badge}>Event Portal</span>
            <h1 style={{ ...styles.heroTitle, ...(isMobile ? styles.heroTitleMobile : {}) }}>
              Available Events
            </h1>
            <p style={styles.heroText}>
              Choose your session, reserve seats, and complete payment securely.
            </p>
          </div>
          <div style={{ ...styles.summaryBox, ...(isMobile ? styles.summaryBoxMobile : {}) }}>
            <span style={styles.summaryLabel}>Active sessions</span>
            <strong style={styles.summaryValue}>{trainings.length}</strong>
          </div>
        </section>

        <section style={{ ...styles.toolbar, ...(isMobile ? styles.toolbarMobile : {}) }}>
          <div>
            <h2 style={styles.heading}>Upcoming Sessions</h2>
            <p style={styles.subText}>Select an event to view details and book tickets.</p>
          </div>
        </section>

        {loading && <LoadingSpinner fullHeight />}

        {!loading && trainings.length === 0 && (
          <div style={styles.emptyBox}>
            <h3>No events available</h3>
            <p>Please check again later.</p>
          </div>
        )}

        <div style={{ ...styles.grid, ...(isMobile ? styles.gridMobile : {}) }}>
          {trainings.map((t) => {
            const eventImage = getEventImage(t.title);

            return (
              <article key={t._id} style={styles.card}>
                {eventImage && (
                  <img
                    src={eventImage}
                    alt={`${t.title} poster`}
                    style={styles.cardImage}
                  />
                )}
                <div style={styles.cardTop}>
                  <span style={styles.cardBadge}>Open</span>
                  <strong style={styles.price}>Rs. {t.ticket_price}</strong>
                </div>

                <h3 style={{ ...styles.title, ...(isMobile ? styles.titleMobile : {}) }}>
                  {t.title}
                </h3>
                <p style={styles.desc}>{t.description}</p>

                <div style={{ ...styles.metaList, ...(isMobile ? styles.metaListMobile : {}) }}>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Date</span>
                    <strong>{t.date}</strong>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Location</span>
                    <strong>{t.location}</strong>
                  </div>
                </div>

                <Link to={`/training/${t._id}`} style={styles.link}>
                  <button style={styles.button}>
                    View Event
                  </button>
                </Link>
              </article>
            );
          })}
        </div>
      </main>
    </>
  );
}

const styles = {
  page: {
    minHeight: "calc(100vh - 64px)",
    background:
      "radial-gradient(circle at 10% 0%, rgba(122, 193, 67, 0.22), transparent 28rem), radial-gradient(circle at 90% 10%, rgba(25, 74, 42, 0.12), transparent 24rem), #F5F9F1",
    padding: "38px",
    boxSizing: "border-box",
    overflowX: "hidden"
  },
  pageMobile: {
    padding: "18px 16px"
  },
  hero: {
    maxWidth: "1120px",
    margin: "0 auto",
    position: "relative",
    background:
      "linear-gradient(135deg, rgba(14, 63, 31, 0.98) 0%, rgba(48, 137, 58, 0.96) 50%, rgba(122, 193, 67, 0.94) 100%)",
    color: "#fff",
    borderRadius: "28px",
    padding: "42px",
    display: "flex",
    justifyContent: "space-between",
    gap: "24px",
    flexWrap: "wrap",
    border: "1px solid rgba(255,255,255,0.24)",
    boxShadow: "0 30px 80px rgba(21, 76, 34, 0.28), inset 0 1px 0 rgba(255,255,255,0.2)"
  },
  heroMobile: {
    padding: "28px",
    alignItems: "stretch"
  },
  badge: {
    display: "inline-block",
    background: "rgba(255,255,255,0.18)",
    border: "1px solid rgba(255,255,255,0.32)",
    borderRadius: "999px",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: "900",
    letterSpacing: "0.04em",
    textTransform: "uppercase"
  },
  heroTitle: {
    margin: "16px 0 8px",
    fontSize: "44px",
    lineHeight: 1.05,
    letterSpacing: "-0.04em"
  },
  heroTitleMobile: {
    fontSize: "32px"
  },
  heroText: {
    margin: 0,
    color: "rgba(255,255,255,0.88)",
    fontSize: "17px",
    maxWidth: "560px"
  },
  summaryBox: {
    minWidth: "170px",
    background: "rgba(255,255,255,0.16)",
    border: "1px solid rgba(255,255,255,0.24)",
    borderRadius: "22px",
    padding: "22px",
    alignSelf: "stretch",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22)"
  },
  summaryBoxMobile: {
    width: "100%",
    minWidth: 0,
    padding: "16px"
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.82)",
    fontSize: "13px",
    fontWeight: "700"
  },
  summaryValue: {
    fontSize: "44px",
    marginTop: "6px"
  },
  toolbar: {
    maxWidth: "1120px",
    margin: "28px auto 18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: "18px"
  },
  toolbarMobile: {
    margin: "24px auto 16px"
  },
  heading: {
    margin: 0,
    color: "#142414",
    fontSize: "28px",
    letterSpacing: "-0.03em"
  },
  subText: {
    margin: "6px 0 0",
    color: "#5E6A59"
  },
  emptyBox: {
    maxWidth: "1120px",
    margin: "0 auto",
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(223, 231, 218, 0.9)",
    borderRadius: "22px",
    padding: "28px",
    boxShadow: "0 18px 40px rgba(31, 58, 26, 0.08)"
  },
  grid: {
    maxWidth: "1120px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "26px"
  },
  gridMobile: {
    gridTemplateColumns: "1fr",
    gap: "16px"
  },
  card: {
    background: "rgba(255,255,255,0.88)",
    padding: "18px",
    borderRadius: "26px",
    border: "1px solid rgba(223, 231, 218, 0.92)",
    boxShadow: "0 24px 60px rgba(31, 58, 26, 0.12)",
    backdropFilter: "blur(14px)"
  },
  cardImage: {
    width: "100%",
    aspectRatio: "4 / 5",
    objectFit: "cover",
    objectPosition: "center top",
    borderRadius: "20px",
    display: "block",
    marginBottom: "18px",
    border: "1px solid rgba(223, 231, 218, 0.9)",
    boxShadow: "0 18px 38px rgba(12, 46, 20, 0.12)"
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px"
  },
  cardBadge: {
    background: "linear-gradient(135deg, #EAF8E3, #F7FDEB)",
    color: "#287A12",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "13px",
    fontWeight: "900",
    border: "1px solid #D6EDC6"
  },
  price: {
    color: "#207B22",
    fontSize: "22px"
  },
  title: {
    margin: "0 0 9px",
    color: "#142414",
    fontSize: "25px",
    lineHeight: 1.18,
    letterSpacing: "-0.03em"
  },
  titleMobile: {
    fontSize: "21px"
  },
  desc: {
    color: "#5E6A59",
    fontSize: "15px",
    lineHeight: 1.5,
    minHeight: "46px",
    margin: 0
  },
  metaList: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    margin: "22px 0"
  },
  metaListMobile: {
    gridTemplateColumns: "1fr"
  },
  metaItem: {
    background: "linear-gradient(135deg, #F7FAF4, #EEF7E8)",
    border: "1px solid #E4EEDF",
    borderRadius: "16px",
    padding: "14px"
  },
  metaLabel: {
    display: "block",
    color: "#6F7D68",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "5px"
  },
  link: {
    textDecoration: "none"
  },
  button: {
    width: "100%",
    padding: "15px",
    background: "linear-gradient(135deg, #7AC143, #218C3B)",
    color: "#fff",
    border: "none",
    borderRadius: "16px",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "15px",
    boxShadow: "0 16px 32px rgba(47, 143, 70, 0.28)"
  }
};

export default Home;
