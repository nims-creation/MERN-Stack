import rateLimit from 'express-rate-limit';

// Basic rate limiter - limits all API requests
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { success: false, message: 'Too many requests, please try again later.' }
});

// Stricter rate limiter for login attempts to prevent brute force attacks
export const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // start blocking after 5 requests
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again after an hour.' },
  // Can be customized to also log failed attempts
  handler: (req, res, next, options) => {
    console.log(`Rate limit exceeded for IP: ${req.ip} on login endpoint`);
    res.status(429).json(options.message);
  },
  // Only count failed login attempts
  skipSuccessfulRequests: true
}); 