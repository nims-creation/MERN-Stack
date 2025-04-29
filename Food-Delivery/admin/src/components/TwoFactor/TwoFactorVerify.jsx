import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './TwoFactor.css';

const TwoFactorVerify = ({ url, userId, role, onSuccess }) => {
  const navigate = useNavigate();
  
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [networkError, setNetworkError] = useState(false);

  const handleCodeChange = (e) => {
    // Only allow digits and limit to 6 characters
    setVerificationCode(e.target.value.replace(/\D/g, '').substring(0, 6));
    if (error) setError('');
    if (networkError) setNetworkError(false);
  };

  const handleBackupCodeChange = (e) => {
    // Allow alphanumeric and dashes for backup codes
    setBackupCode(e.target.value.toUpperCase());
    if (error) setError('');
    if (networkError) setNetworkError(false);
  };

  const handleRetry = () => {
    setNetworkError(false);
    setError('');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setNetworkError(false);
    
    // Validate input
    if (useBackupCode) {
      if (!backupCode) {
        setError('Please enter a backup code');
        return;
      }
    } else {
      if (!verificationCode || verificationCode.length !== 6) {
        setError('Please enter a valid 6-digit verification code');
        return;
      }
    }
    
    setLoading(true);
    
    try {
      // First verify the 2FA code
      const verifyResponse = await axios.post(`${url}/api/2fa/verify`, {
        userId,
        token: useBackupCode ? null : verificationCode,
        backupCode: useBackupCode ? backupCode : null
      });
      
      if (!verifyResponse.data.success) {
        setError(verifyResponse.data.message || 'Invalid verification code');
        setLoading(false);
        return;
      }
      
      // If 2FA verification successful, complete the login
      const completeLoginResponse = await axios.post(`${url}/api/user/complete-login`, {
        userId,
        twoFactorVerified: true
      });
      
      if (completeLoginResponse.data.success) {
        const { token, role } = completeLoginResponse.data;
        
        // Store the session
        if (window.localStorage.getItem('rememberMe') === 'true') {
          localStorage.setItem('token', token);
          localStorage.setItem('admin', true);
        } else {
          sessionStorage.setItem('token', token);
          sessionStorage.setItem('admin', true);
        }
        
        toast.success('Login successful!');
        
        // Call the success callback or navigate
        if (typeof onSuccess === 'function') {
          onSuccess(token, role);
        } else {
          navigate('/add');
        }
      } else {
        setError('Failed to complete login');
        toast.error('Failed to complete login');
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      
      // Handle different types of errors
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(error.response.data.message || 'Server error occurred');
        toast.error(error.response.data.message || 'Server error occurred');
      } else if (error.request) {
        // The request was made but no response was received
        setNetworkError(true);
        toast.error('Network error. Please check your connection and try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('An unexpected error occurred. Please try again.');
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="twofactor-verify-container">
      <h2>Two-Factor Authentication</h2>
      <p>
        Please enter the verification code from your authenticator app
        to complete the login process.
      </p>
      
      {networkError ? (
        <div className="network-error">
          <div className="error-icon">⚠️</div>
          <p>Network error. Unable to connect to the server.</p>
          <p>Please check your internet connection and try again.</p>
          <button 
            className="retry-button" 
            onClick={handleRetry}
          >
            Try Again
          </button>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="twofactor-verify-form">
          {!useBackupCode ? (
            // Verification code input
            <div className="verification-code-input">
              <label htmlFor="verification-code">Enter 6-digit verification code:</label>
              <input
                id="verification-code"
                type="text"
                value={verificationCode}
                onChange={handleCodeChange}
                placeholder="123456"
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
                autoComplete="one-time-code"
                disabled={loading}
                autoFocus
              />
            </div>
          ) : (
            // Backup code input
            <div className="backup-code-input">
              <label htmlFor="backup-code">Enter backup code:</label>
              <input
                id="backup-code"
                type="text"
                value={backupCode}
                onChange={handleBackupCodeChange}
                placeholder="XXXX-XXXX-XXXX"
                disabled={loading}
                autoFocus
              />
            </div>
          )}
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="twofactor-actions">
            <button 
              type="submit" 
              className="verify-button" 
              disabled={loading || (!useBackupCode && verificationCode.length !== 6) || (useBackupCode && !backupCode)}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            
            <button
              type="button"
              className="switch-method-button"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setError('');
              }}
              disabled={loading}
            >
              {useBackupCode ? 'Use verification code' : 'Use backup code'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TwoFactorVerify; 