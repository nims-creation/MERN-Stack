import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  const { token } = req.headers;
  if (!token) {
    return res.json({ success: false, message: "Not Authorized Login Again" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add userId to both req.body and req so it can be accessed in controllers
    req.userId = decoded.id;
    req.body.userId = decoded.id;
    
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    if (error.name === 'TokenExpiredError') {
      return res.json({ 
        success: false, 
        message: "Session expired. Please login again" 
      });
    }
    res.json({ success: false, message: "Authentication failed" });
  }
};

export default authMiddleware;
