import { useContext, useEffect, useState } from "react";
import "./Login.css";
import { toast } from "react-toastify";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate, Link } from "react-router-dom";
import TwoFactorVerify from "../TwoFactor/TwoFactorVerify";
import PropTypes from "prop-types";

const Login = ({ url }) => {
  const navigate = useNavigate();
  const { admin, setAdmin, token, setToken } = useContext(StoreContext);
  
  // Form state with validation errors
  const [data, setData] = useState({
    email: "",
    password: "",
  });
  
  // Form validation errors state
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  
  // UI state management
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [inputFocus, setInputFocus] = useState(null);
  
  // 2FA state
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Handle input changes with validation
  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    
    setData((prevData) => ({ ...prevData, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Validate form inputs
  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: "", password: "" };
    
    // Email validation
    if (!data.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      newErrors.email = "Email is invalid";
      isValid = false;
    }
    
    // Password validation
    if (!data.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (data.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  // Handle login submission
  const onLogin = async (event) => {
    event.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.post(url + "/api/user/login", data);
      
      if (response.data.success) {
        // Check if 2FA is required
        if (response.data.requiresTwoFactor) {
          // Store user ID and role for 2FA verification
          setUserId(response.data.userId);
          setUserRole(response.data.role);
          setRequiresTwoFactor(true);
          
          // Store remember me preference for after 2FA
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          } else {
            localStorage.removeItem('rememberMe');
          }
        } else {
          // Regular login without 2FA
          if (response.data.role === "admin") {
            handleSuccessfulLogin(response.data.token);
          } else {
            toast.error("You are not authorized as an admin");
          }
        }
      } else {
        toast.error(response.data.message || "Login failed");
      }
    } catch (error) {
      // Handle different error scenarios
      if (error.response) {
        // Server responded with an error status
        toast.error(error.response.data.message || "Server error");
      } else if (error.request) {
        // Request made but no response received
        toast.error("Network error. Please check your connection.");
      } else {
        // Other errors
        toast.error("Login failed. Please try again.");
      }
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle successful login after credentials and optional 2FA
  const handleSuccessfulLogin = (token) => {
    setToken(token);
    setAdmin(true);
    
    // Store auth data in localStorage if remember me is checked
    if (rememberMe || localStorage.getItem('rememberMe') === 'true') {
      localStorage.setItem("token", token);
      localStorage.setItem("admin", true);
    } else {
      // Use sessionStorage if not remembering
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("admin", true);
    }
    
    toast.success("Login Successful");
    navigate("/add");
  };

  // Check if user is already logged in
  useEffect(() => {
    // Don't redirect if we're in the middle of 2FA verification
    if (requiresTwoFactor) {
      return;
    }
    
    // Check both localStorage and sessionStorage
    const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    const isAdmin = localStorage.getItem("admin") === "true" || sessionStorage.getItem("admin") === "true";
    
    if (isAdmin && storedToken) {
      setToken(storedToken);
      setAdmin(true);
      navigate("/add");
    }
  }, [navigate, setAdmin, setToken, admin, token, requiresTwoFactor]);

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Handle input focus for animation effects
  const handleFocus = (field) => {
    setInputFocus(field);
  };
  
  const handleBlur = () => {
    setInputFocus(null);
  };
  
  // If 2FA verification is required, show 2FA component
  if (requiresTwoFactor) {
    return (
      <TwoFactorVerify 
        url={url} 
        userId={userId} 
        role={userRole} 
        onSuccess={handleSuccessfulLogin} 
      />
    );
  }

  return (
    <div className="login-popup">
      <form onSubmit={onLogin} className="login-popup-container">
        <div className="login-popup-title">
          <h2>Admin Login</h2>
        </div>
        
        <div className="login-popup-inputs">
          {/* Email input with animation and validation */}
          <div className={`input-group ${inputFocus === 'email' ? 'focused' : ''}`}>
            <input
              name="email"
              onChange={onChangeHandler}
              value={data.email}
              type="email"
              placeholder="Email Address"
              className={errors.email ? "input-error" : ""}
              disabled={isLoading}
              onFocus={() => handleFocus('email')}
              onBlur={handleBlur}
              autoComplete="email"
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>
          
          {/* Password input with visibility toggle and animation */}
          <div className={`input-group ${inputFocus === 'password' ? 'focused' : ''}`}>
            <div className="password-input-container">
              <input
                name="password"
                onChange={onChangeHandler}
                value={data.password}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className={errors.password ? "input-error" : ""}
                disabled={isLoading}
                onFocus={() => handleFocus('password')}
                onBlur={handleBlur}
                autoComplete="current-password"
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                tabIndex="-1"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>
          
          {/* Remember me and forgot password row with enhanced styling */}
          <div className="login-options">
            <div className="remember-me">
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                disabled={isLoading}
              />
              <label htmlFor="remember-me">Remember me</label>
            </div>
            
            <div className="forgot-password">
              <Link to="/forgot-password" className="form-link">
                Forgot password?
              </Link>
            </div>
          </div>
        </div>
        
        {/* Submit button with loading state and enhanced animation */}
        <button 
          type="submit" 
          disabled={isLoading} 
          className={isLoading ? "button-loading" : ""}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

// Add PropTypes validation at the bottom of the file
Login.propTypes = {
  url: PropTypes.string.isRequired
};

export default Login;
