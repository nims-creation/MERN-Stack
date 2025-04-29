import userModel from "../models/userModel.js";
import PasswordReset from "../models/passwordResetModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import crypto from "crypto";
import nodemailer from "nodemailer";

// login user with 2FA support
const loginUser = async (req, res) => {
  const { email, password, token } = req.body;
  try {
    // First stage of login - validate credentials
    if (!email || !password) {
      return res.json({ success: false, message: "Email and password are required" });
    }
    
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }
    
    // Check if 2FA is enabled for this user
    if (user.twoFactorEnabled) {
      // If 2FA token is not provided, return a flag to prompt for 2FA
      if (!token) {
        return res.json({
          success: true,
          requiresTwoFactor: true,
          userId: user._id,
          role: user.role,
          message: "2FA verification required"
        });
      }
      
      // If token is provided, it means the user is attempting to complete the 2FA step
      // This should be handled by the 2FA verification endpoint
      return res.json({ 
        success: false,
        message: "Please use the 2FA verification endpoint to complete authentication" 
      });
    }
    
    // If 2FA is not enabled, complete the login process
    const role = user.role;
    const newToken = createToken(user._id);
    res.json({ success: true, token: newToken, role });
  } catch (error) {
    console.error("Login error:", error);
    res.json({ success: false, message: "Error during login" });
  }
};

// Complete login after 2FA verification
const completeLogin = async (req, res) => {
  try {
    const { userId, twoFactorVerified } = req.body;
    
    if (!userId || !twoFactorVerified) {
      return res.json({ 
        success: false, 
        message: "Invalid request" 
      });
    }
    
    // Find the user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    // Generate token and complete login
    const token = createToken(user._id);
    const role = user.role;
    
    res.json({
      success: true,
      token,
      role
    });
    
  } catch (error) {
    console.error("Complete login error:", error);
    res.json({ 
      success: false, 
      message: "Error completing login" 
    });
  }
};

// Create token with expiration
const createToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET,
    { expiresIn: '24h' } // Token expires after 24 hours
  );
};

// register user
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // checking user is already exist
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }

    // validating email format and strong password
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter valid email" });
    }
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }
    
    // Additional password strength validation
    if (!/\d/.test(password)) {
      return res.json({
        success: false,
        message: "Password must contain at least one number"
      });
    }
    
    if (!/[A-Z]/.test(password)) {
      return res.json({
        success: false,
        message: "Password must contain at least one uppercase letter"
      });
    }

    // hashing user password
    const salt = await bcrypt.genSalt(12); // Increased from default for better security
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    const user = await newUser.save();
    const role = user.role;
    const token = createToken(user._id);
    res.json({ success: true, token, role});
  } catch (error) {
    console.error("Registration error:", error);
    res.json({ success: false, message: "Error during registration" });
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !validator.isEmail(email)) {
      return res.json({ success: false, message: "Please provide a valid email address" });
    }
    
    const user = await userModel.findOne({ email });
    
    if (!user) {
      // Don't reveal that the user doesn't exist for security reasons
      return res.json({ success: true, message: "If your email is registered, you will receive a password reset link" });
    }
    
    // Delete any existing reset tokens for this user
    await PasswordReset.deleteMany({ userId: user._id });
    
    // Create a random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token before saving it
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Save the new reset token
    await new PasswordReset({
      userId: user._id,
      token: hashedToken,
      createdAt: Date.now()
    }).save();
    
    // Create reset URL 
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    // Send email with reset link
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@fooddelivery.com",
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <h1>You requested a password reset</h1>
        <p>Please click on the following link to reset your password:</p>
        <a href="${resetUrl}" clicktracking="off">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({ 
      success: true, 
      message: "If your email is registered, you will receive a password reset link" 
    });
    
  } catch (error) {
    console.error("Password reset request error:", error);
    res.json({ 
      success: false, 
      message: "An error occurred. Please try again later." 
    });
  }
};

// Reset password with token
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.json({ 
        success: false, 
        message: "Please provide both token and new password" 
      });
    }
    
    // Password strength validation
    if (newPassword.length < 8) {
      return res.json({
        success: false,
        message: "Password must be at least 8 characters long"
      });
    }
    
    if (!/\d/.test(newPassword)) {
      return res.json({
        success: false,
        message: "Password must contain at least one number"
      });
    }
    
    if (!/[A-Z]/.test(newPassword)) {
      return res.json({
        success: false,
        message: "Password must contain at least one uppercase letter"
      });
    }
    
    // Hash the provided token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find the valid password reset token
    const passwordReset = await PasswordReset.findOne({ 
      token: hashedToken
    });
    
    if (!passwordReset) {
      return res.json({ 
        success: false, 
        message: "Invalid or expired token"
      });
    }
    
    // Find the user
    const user = await userModel.findById(passwordReset.userId);
    
    if (!user) {
      return res.json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    // Update the password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    await user.save();
    
    // Delete the used reset token
    await PasswordReset.deleteMany({ userId: user._id });
    
    res.json({ 
      success: true, 
      message: "Password reset successful. You can now login with your new password."
    });
    
  } catch (error) {
    console.error("Password reset error:", error);
    res.json({ 
      success: false, 
      message: "An error occurred. Please try again later." 
    });
  }
};

export { loginUser, registerUser, requestPasswordReset, resetPassword, completeLogin };
