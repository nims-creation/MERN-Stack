import React, { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Login.css";

const ForgotPassword = ({ url }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  // Form validation
  const validateForm = () => {
    setError("");
    
    if (!email) {
      setError("Email is required");
      return false;
    }
    
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.post(url + "/api/user/forgot-password", { email });
      
      if (response.data.success) {
        setEmailSent(true);
        toast.success("Password reset instructions sent to your email");
      } else {
        toast.error(response.data.message || "Failed to send reset email");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again later.");
      console.error("Forgot password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show success message after email is sent
  if (emailSent) {
    return (
      <div className="login-popup">
        <div className="login-popup-container">
          <div className="login-popup-title">
            <h2>Email Sent</h2>
          </div>
          <div className="forgot-password-success">
            <p>
              If an account exists with the email <strong>{email}</strong>,
              you will receive password reset instructions shortly.
            </p>
            <p>
              Please check your email and follow the instructions to reset your password.
            </p>
          </div>
          <Link to="/login" className="back-to-login-btn">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-popup">
      <form onSubmit={handleSubmit} className="login-popup-container">
        <div className="login-popup-title">
          <h2>Forgot Password</h2>
        </div>
        
        <div className="forgot-password-instructions">
          <p>
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>
        
        <div className="login-popup-inputs">
          <div className="input-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className={error ? "input-error" : ""}
              disabled={isLoading}
            />
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
        
        <button type="submit" disabled={isLoading} className={isLoading ? "button-loading" : ""}>
          {isLoading ? "Sending..." : "Send Reset Link"}
        </button>
        
        <div className="form-footer">
          <Link to="/login" className="form-link">
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword; 