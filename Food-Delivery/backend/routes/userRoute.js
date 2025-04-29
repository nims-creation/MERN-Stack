import express from "express";
import { loginUser, registerUser, requestPasswordReset, resetPassword, completeLogin } from "../controllers/userController.js";
import { loginLimiter } from "../middleware/rateLimiter.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
// Apply login rate limiter to prevent brute force attacks
userRouter.post("/login", loginLimiter, loginUser);
// Password reset routes
userRouter.post("/forgot-password", requestPasswordReset);
userRouter.post("/reset-password", resetPassword);
// Complete login after 2FA verification
userRouter.post("/complete-login", completeLogin);

export default userRouter;
