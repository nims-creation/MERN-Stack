import React, { useContext } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const { token, admin, setAdmin, setToken } = useContext(StoreContext);
  
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("admin");
    setToken("");
    setAdmin(false);
    toast.success("Logout Successfully");
    navigate("/");
  };
  
  return (
    <div className="navbar">
      <img className="logo" src={assets.logo} alt="" />
      
      <div className="navbar-actions">
        {token && admin && (
          <Link to="/setup-2fa" className="security-link">
            <i className="security-icon">🔒</i>
            <span>Setup 2FA</span>
          </Link>
        )}
        
        {token && admin ? (
          <p className="login-condition" onClick={logout}>Logout</p>
        ) : (
          <p className="login-condition" onClick={() => navigate("/")}>Login</p>
        )}
      </div>
      
      <img className="profile" src={assets.profile_image} alt="" />
    </div>
  );
};

export default Navbar;
