import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import TwoFactor from '../models/twoFactorModel.js';
import userModel from '../models/userModel.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// Generate 2FA secret and QR code
export const setup2FA = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    
    // Check if 2FA is already setup
    const existingSetup = await TwoFactor.findOne({ userId });
    
    if (existingSetup && existingSetup.enabled) {
      return res.json({
        success: false,
        message: "Two-factor authentication is already enabled"
      });
    }
    
    // Find user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }
    
    // Generate secret
    const secret = authenticator.generateSecret();
    
    // Generate QR code
    const serviceName = 'FoodDeliveryAdmin';
    const otpAuthUrl = authenticator.keyuri(user.email, serviceName, secret);
    
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(otpAuthUrl);
    
    // Generate backup codes
    const backupCodes = generateBackupCodes(8); // Generate 8 backup codes
    const hashedBackupCodes = await hashBackupCodes(backupCodes);
    
    // Save or update 2FA data
    if (existingSetup) {
      existingSetup.secret = secret;
      existingSetup.backupCodes = hashedBackupCodes;
      await existingSetup.save();
    } else {
      await new TwoFactor({
        userId,
        secret,
        backupCodes: hashedBackupCodes
      }).save();
    }
    
    return res.json({
      success: true,
      qrCode: qrCodeDataURL,
      secret,
      backupCodes // Send plain backup codes to the user - they need to save these
    });
    
  } catch (error) {
    console.error('2FA setup error:', error);
    return res.json({
      success: false,
      message: "Error setting up two-factor authentication"
    });
  }
};

// Verify and enable 2FA
export const enable2FA = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const { token } = req.body;
    
    if (!token) {
      return res.json({
        success: false,
        message: "Token is required"
      });
    }
    
    // Retrieve 2FA data
    const twoFactorData = await TwoFactor.findOne({ userId });
    if (!twoFactorData) {
      return res.json({
        success: false,
        message: "Two-factor authentication not set up yet"
      });
    }
    
    // Verify token
    const isValid = authenticator.verify({
      token,
      secret: twoFactorData.secret
    });
    
    if (!isValid) {
      return res.json({
        success: false,
        message: "Invalid verification code"
      });
    }
    
    // Enable 2FA
    twoFactorData.enabled = true;
    await twoFactorData.save();
    
    // Update user model
    await userModel.findByIdAndUpdate(userId, { twoFactorEnabled: true });
    
    return res.json({
      success: true,
      message: "Two-factor authentication enabled successfully"
    });
    
  } catch (error) {
    console.error('2FA enable error:', error);
    return res.json({
      success: false,
      message: "Error enabling two-factor authentication"
    });
  }
};

// Verify 2FA token during login
export const verify2FA = async (req, res) => {
  try {
    const { userId, token, backupCode } = req.body;
    
    // Retrieve 2FA data
    const twoFactorData = await TwoFactor.findOne({ userId });
    if (!twoFactorData || !twoFactorData.enabled) {
      return res.json({
        success: false,
        message: "Two-factor authentication not enabled"
      });
    }
    
    let isValid = false;
    let usedBackupCodeIndex = -1;
    
    // Check if using token or backup code
    if (token) {
      // Verify TOTP token
      isValid = authenticator.verify({
        token,
        secret: twoFactorData.secret
      });
      
      if (!isValid) {
        return res.json({
          success: false,
          message: "Invalid verification code"
        });
      }
    } else if (backupCode) {
      // Verify backup code - find which one matches
      for (let i = 0; i < twoFactorData.backupCodes.length; i++) {
        const hashedCode = twoFactorData.backupCodes[i];
        if (await bcrypt.compare(backupCode, hashedCode)) {
          isValid = true;
          usedBackupCodeIndex = i;
          break;
        }
      }
      
      if (!isValid) {
        return res.json({
          success: false,
          message: "Invalid backup code"
        });
      }
      
      // Remove used backup code if valid
      if (usedBackupCodeIndex >= 0) {
        twoFactorData.backupCodes.splice(usedBackupCodeIndex, 1);
        await twoFactorData.save();
      }
    } else {
      return res.json({
        success: false,
        message: "Verification code or backup code is required"
      });
    }
    
    return res.json({
      success: true,
      message: "Two-factor authentication verified"
    });
    
  } catch (error) {
    console.error('2FA verification error:', error);
    return res.json({
      success: false,
      message: "Error verifying two-factor authentication"
    });
  }
};

// Disable 2FA
export const disable2FA = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.json({
        success: false,
        message: "Both current password and verification code are required"
      });
    }
    
    // Verify password
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }
    
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.json({
        success: false,
        message: "Incorrect password"
      });
    }
    
    // Retrieve 2FA data
    const twoFactorData = await TwoFactor.findOne({ userId });
    if (!twoFactorData || !twoFactorData.enabled) {
      return res.json({
        success: false,
        message: "Two-factor authentication not enabled"
      });
    }
    
    // Verify token
    const isValid = authenticator.verify({
      token,
      secret: twoFactorData.secret
    });
    
    if (!isValid) {
      return res.json({
        success: false,
        message: "Invalid verification code"
      });
    }
    
    // Disable 2FA
    await TwoFactor.findOneAndDelete({ userId });
    
    // Update user model
    await userModel.findByIdAndUpdate(userId, { twoFactorEnabled: false });
    
    return res.json({
      success: true,
      message: "Two-factor authentication disabled successfully"
    });
    
  } catch (error) {
    console.error('2FA disable error:', error);
    return res.json({
      success: false,
      message: "Error disabling two-factor authentication"
    });
  }
};

// Helper functions
function generateBackupCodes(count) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Generate a random 10-character backup code (digits and uppercase letters)
    const code = crypto.randomBytes(5).toString('hex').toUpperCase();
    // Format as XXXX-XXXX-XXXX for readability
    const formattedCode = `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
    codes.push(formattedCode);
  }
  return codes;
}

async function hashBackupCodes(codes) {
  const hashedCodes = [];
  for (const code of codes) {
    const salt = await bcrypt.genSalt(10);
    const hashedCode = await bcrypt.hash(code, salt);
    hashedCodes.push(hashedCode);
  }
  return hashedCodes;
} 