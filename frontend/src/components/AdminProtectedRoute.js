import { Navigate } from "react-router-dom";

function AdminProtectedRoute({ children }) {
  const token = sessionStorage.getItem("adminToken");

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default AdminProtectedRoute;
