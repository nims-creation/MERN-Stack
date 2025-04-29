import React, { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { Link, useParams, useNavigate } from "react-router-dom";
import "./Login.css";

const ResetPassword = ({ url }) => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Form validation
  const validateForm = () => {
    let isValid = true;
    const newErrors = { password: "", confirmPassword: "" };
    
    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number";
      isValid = false;
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one uppercase letter";
      isValid = false;
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.post(url + "/api/user/reset-password", {
        token,
        newPassword: formData.password
      });
      
      if (response.data.success) {
        setResetSuccess(true);
        toast.success("Password reset successful!");
      } else {
        toast.error(response.data.message || "Failed to reset password");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error("Reset password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect to login after successful reset
  if (resetSuccess) {
    return (
      <div className="login-popup">
        <div className="login-popup-container">
          <div className="login-popup-title">
            <h2>Password Reset Successful</h2>
          </div>
          <div className="reset-password-success">
            <p>Your password has been reset successfully.</p>
            <p>You can now log in with your new password.</p>
          </div>
          <Link to="/login" className="back-to-login-btn">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-popup">
      <form onSubmit={handleSubmit} className="login-popup-container">
        <div className="login-popup-title">
          <h2>Reset Password</h2>
        </div>
        
        <div className="reset-password-instructions">
          <p>Please enter your new password.</p>
        </div>
        
        <div className="login-popup-inputs">
          {/* New Password input */}
          <div className="input-group">
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="New password"
                className={errors.password ? "input-error" : ""}
                disabled={isLoading}
              />
              <button 
                type="button"
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>
          
          {/* Confirm Password input */}
          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              className={errors.confirmPassword ? "input-error" : ""}
              disabled={isLoading}
            />
            {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
          </div>
        </div>
        
        <button type="submit" disabled={isLoading} className={isLoading ? "button-loading" : ""}>
          {isLoading ? "Resetting..." : "Reset Password"}
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

export default ResetPassword; 