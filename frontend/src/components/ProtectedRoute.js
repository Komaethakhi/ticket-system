import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem("token");

  if (!token) {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("coachId");
    localStorage.removeItem("coachLoggedIn");

    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
