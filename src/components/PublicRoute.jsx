import { Navigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

const PublicRoute = ({ children }) => {
  const isAuth = useAuthStore((state) => state.isAuth);

  // If the user is ALREADY logged in, don't let them see the login page.
  // Bounce them straight to the main app dashboard/home.
  if (isAuth) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PublicRoute;
