import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { StoreContext } from '../../context/StoreContext';
import './TwoFactor.css';

const TwoFactorSetup = ({ url }) => {
  const { token } = useContext(StoreContext);
  
  const [loading, setLoading] = useState(false);
  const [setupStage, setSetupStage] = useState('initial'); // initial, qrCode, verify, success
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [networkError, setNetworkError] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);

  useEffect(() => {
    // Check if backup codes text file is ready for download
    if (setupStage === 'success' && backupCodes.length > 0) {
      setDownloadReady(true);
    }
  }, [setupStage, backupCodes]);

  const handleRetry = () => {
    setNetworkError(false);
    setError('');
  };

  const setupTwoFactor = async () => {
    setLoading(true);
    setError('');
    setNetworkError(false);
    
    try {
      const response = await axios.post(
        `${url}/api/2fa/setup`, 
        {}, 
        {
          headers: { token }
        }
      );
      
      if (response.data.success) {
        setQrCode(response.data.qrCode);
        setSecret(response.data.secret);
        setBackupCodes(response.data.backupCodes);
        setSetupStage('qrCode');
      } else {
        setError(response.data.message || 'Failed to setup two-factor authentication');
        toast.error(response.data.message || 'Failed to setup two-factor authentication');
      }
    } catch (error) {
      console.error('2FA setup error:', error);
      
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

  const verifyAndEnable = async () => {
    setLoading(true);
    setError('');
    setNetworkError(false);
    
    if (!verificationCode) {
      setError('Please enter the verification code');
      setLoading(false);
      return;
    }
    
    try {
      const response = await axios.post(
        `${url}/api/2fa/enable`, 
        { token: verificationCode }, 
        {
          headers: { token }
        }
      );
      
      if (response.data.success) {
        setSetupStage('success');
        toast.success('Two-factor authentication enabled successfully!');
      } else {
        setError(response.data.message || 'Failed to verify code');
        toast.error(response.data.message || 'Failed to verify code');
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

  const downloadBackupCodes = () => {
    const element = document.createElement('a');
    const backupCodesText = `FOOD DELIVERY ADMIN - TWO-FACTOR AUTHENTICATION BACKUP CODES\n\n` +
      `Keep these backup codes in a safe place. Each code can only be used once.\n\n` +
      backupCodes.join('\n') + 
      `\n\nGenerated on: ${new Date().toLocaleString()}`;
    
    const file = new Blob([backupCodesText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'food-delivery-2fa-backup-codes.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const renderInitialSetup = () => (
    <div className="twofactor-setup-initial">
      <h2>Set Up Two-Factor Authentication</h2>
      <p>
        Two-factor authentication adds an extra layer of security to your account. 
        Once enabled, you'll need to enter a verification code from your authenticator app 
        in addition to your password when logging in.
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
        <>
          <div className="setup-steps">
            <h3>How it works:</h3>
            <ol>
              <li>Set up an authenticator app on your mobile device (Google Authenticator, Authy, etc.)</li>
              <li>Scan the QR code with your authenticator app</li>
              <li>Enter the verification code displayed in your app</li>
              <li>Save your backup codes in case you lose access to your device</li>
            </ol>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            className="setup-button" 
            onClick={setupTwoFactor} 
            disabled={loading}
          >
            {loading ? 'Setting up...' : 'Set Up Two-Factor Authentication'}
          </button>
        </>
      )}
    </div>
  );

  const renderQrCodeStage = () => (
    <div className="twofactor-setup-qrcode">
      <h2>Scan this QR Code</h2>
      <p>
        Use your authenticator app to scan this QR code or manually enter the secret key below.
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
        <>
          <div className="qrcode-container">
            <img src={qrCode} alt="QR Code for 2FA" />
          </div>
          
          <div className="secret-key">
            <p>If you can't scan the QR code, enter this code manually:</p>
            <code>{secret}</code>
          </div>
          
          <div className="verification-input">
            <label htmlFor="verification-code">Enter the 6-digit verification code from your app:</label>
            <input
              id="verification-code"
              type="text"
              value={verificationCode}
              onChange={(e) => {
                setVerificationCode(e.target.value.replace(/\D/g, '').substring(0, 6));
                if (error) setError('');
              }}
              placeholder="123456"
              maxLength={6}
              pattern="[0-9]*"
              inputMode="numeric"
              autoComplete="one-time-code"
            />
            {error && <div className="error-message">{error}</div>}
          </div>
          
          <div className="verification-actions">
            <button 
              className="back-button" 
              onClick={() => setSetupStage('initial')}
              disabled={loading}
            >
              Back
            </button>
            <button 
              className="verify-button" 
              onClick={verifyAndEnable} 
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify and Enable'}
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderSuccessStage = () => (
    <div className="twofactor-setup-success">
      <h2>Two-Factor Authentication Enabled!</h2>
      <p>
        You have successfully enabled two-factor authentication. 
        From now on, you will need to enter a verification code from your authenticator app 
        when logging in.
      </p>
      
      <div className="backup-codes">
        <h3>Your Backup Codes</h3>
        <p>
          Save these backup codes in a secure location. If you lose access to your authenticator app, 
          you can use one of these codes to log in. Each code can only be used once.
        </p>
        
        <ul className="backup-codes-list">
          {backupCodes.map((code, index) => (
            <li key={index}>{code}</li>
          ))}
        </ul>
        
        <button 
          className="download-button" 
          onClick={downloadBackupCodes}
          disabled={!downloadReady}
        >
          Download Backup Codes
        </button>
      </div>
      
      <div className="setup-complete">
        <p>
          <strong>Important:</strong> If you lose access to your authenticator app and your backup codes, 
          you may be locked out of your account permanently.
        </p>
      </div>
    </div>
  );

  // Render appropriate stage
  const renderStage = () => {
    switch (setupStage) {
      case 'qrCode':
        return renderQrCodeStage();
      case 'success':
        return renderSuccessStage();
      case 'initial':
      default:
        return renderInitialSetup();
    }
  };

  return (
    <div className="twofactor-setup-container">
      {renderStage()}
    </div>
  );
};

export default TwoFactorSetup; 