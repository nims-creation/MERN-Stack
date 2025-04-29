import express from "express";
import { setup2FA, enable2FA, verify2FA, disable2FA } from "../controllers/twoFactorController.js";
import authMiddleware from "../middleware/auth.js";

const twoFactorRouter = express.Router();

// Routes that require authentication
twoFactorRouter.post("/setup", authMiddleware, setup2FA);
twoFactorRouter.post("/enable", authMiddleware, enable2FA);
twoFactorRouter.post("/disable", authMiddleware, disable2FA);

// Public route - used during login
twoFactorRouter.post("/verify", verify2FA);

export default twoFactorRouter; 