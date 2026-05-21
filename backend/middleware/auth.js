const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "ticket-system-dev-secret";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { authMiddleware, JWT_SECRET };
