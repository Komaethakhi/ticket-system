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
    background: "#F4F7F3",
    padding: "32px 38px",
    boxSizing: "border-box",
    overflowX: "hidden"
  },
  pageMobile: {
    padding: "18px 16px"
  },
  hero: {
    maxWidth: "1120px",
    margin: "0 auto",
    background: "linear-gradient(135deg, #194A2A 0%, #6DBF3F 100%)",
    color: "#fff",
    borderRadius: "8px",
    padding: "34px",
    display: "flex",
    justifyContent: "space-between",
    gap: "24px",
    flexWrap: "wrap",
    boxShadow: "0 14px 34px rgba(35, 83, 34, 0.18)"
  },
  heroMobile: {
    padding: "24px",
    alignItems: "stretch"
  },
  badge: {
    display: "inline-block",
    background: "rgba(255,255,255,0.16)",
    border: "1px solid rgba(255,255,255,0.32)",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "13px",
    fontWeight: "700"
  },
  heroTitle: {
    margin: "16px 0 8px",
    fontSize: "34px",
    lineHeight: 1.15
  },
  heroTitleMobile: {
    fontSize: "28px"
  },
  heroText: {
    margin: 0,
    color: "rgba(255,255,255,0.88)",
    fontSize: "16px"
  },
  summaryBox: {
    minWidth: "170px",
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.24)",
    borderRadius: "8px",
    padding: "18px",
    alignSelf: "stretch",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
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
    fontSize: "38px",
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
    color: "#1F2A1B",
    fontSize: "24px"
  },
  subText: {
    margin: "6px 0 0",
    color: "#5E6A59"
  },
  emptyBox: {
    maxWidth: "1120px",
    margin: "0 auto",
    background: "#fff",
    border: "1px solid #DFE7DA",
    borderRadius: "8px",
    padding: "26px"
  },
  grid: {
    maxWidth: "1120px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "22px"
  },
  gridMobile: {
    gridTemplateColumns: "1fr",
    gap: "16px"
  },
  card: {
    background: "#fff",
    padding: "22px",
    borderRadius: "8px",
    border: "1px solid #DFE7DA",
    boxShadow: "0 10px 24px rgba(31, 58, 26, 0.09)"
  },
  cardImage: {
    width: "100%",
    aspectRatio: "4 / 5",
    objectFit: "cover",
    objectPosition: "center top",
    borderRadius: "8px",
    display: "block",
    marginBottom: "18px",
    border: "1px solid #DFE7DA"
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px"
  },
  cardBadge: {
    background: "#EAF5E4",
    color: "#3C7D20",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "13px",
    fontWeight: "800"
  },
  price: {
    color: "#2F8F15",
    fontSize: "20px"
  },
  title: {
    margin: "0 0 9px",
    color: "#1F2A1B",
    fontSize: "23px",
    lineHeight: 1.25
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
    background: "#F4F7F3",
    borderRadius: "8px",
    padding: "12px"
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
    padding: "13px",
    background: "#7AC143",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "15px"
  }
};

export default Home;
