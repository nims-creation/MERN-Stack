import { useContext } from "react";
import PropTypes from "prop-types";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import { Route, Routes, Navigate } from "react-router-dom";
import Add from "./pages/Add/Add";
import List from "./pages/List/List";
import Orders from "./pages/Orders/Orders";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./components/Login/Login";
import ForgotPassword from "./components/Login/ForgotPassword";
import ResetPassword from "./components/Login/ResetPassword";
import TwoFactorSetup from "./components/TwoFactor/TwoFactorSetup";
import { StoreContext } from "./context/StoreContext";

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { admin, token } = useContext(StoreContext);
  
  if (!admin || !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

// Auth layout without sidebar and navbar
const AuthLayout = ({ children }) => {
  return (
    <div className="auth-layout">
      {children}
    </div>
  );
};

AuthLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

const App = () => {
  const url = "https://food-delivery-backend-5b6g.onrender.com";
  const { admin } = useContext(StoreContext);
  
  return (
    <div>
      <ToastContainer />
      
      {/* Only show navbar and sidebar if user is logged in */}
      {admin && (
        <>
          <Navbar />
          <hr />
        </>
      )}
      
      <div className={admin ? "app-content" : ""}>
        {admin && <Sidebar />}
        
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={
            <AuthLayout>
              <Login url={url} />
            </AuthLayout>
          } />
          <Route path="/forgot-password" element={
            <AuthLayout>
              <ForgotPassword url={url} />
            </AuthLayout>
          } />
          <Route path="/reset-password/:token" element={
            <AuthLayout>
              <ResetPassword url={url} />
            </AuthLayout>
          } />
          
          {/* Protected routes */}
          <Route path="/add" element={
            <ProtectedRoute>
              <Add url={url} />
            </ProtectedRoute>
          } />
          <Route path="/list" element={
            <ProtectedRoute>
              <List url={url} />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute>
              <Orders url={url} />
            </ProtectedRoute>
          } />
          <Route path="/setup-2fa" element={
            <ProtectedRoute>
              <TwoFactorSetup url={url} />
            </ProtectedRoute>
          } />
          
          {/* Default route */}
          <Route path="/" element={<Navigate to={admin ? "/add" : "/login"} />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
