const jwt = require('jsonwebtoken');
const User =require("../model/userSchema");

async function verifyToken(req, res, next) {

  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  // Expecting: "Bearer <token>"
  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(400).json({ error: 'Invalid authorization format. Use Bearer <token>' });
  }

  const token = parts[1];
  // console.log(token)

  try {
    const decoded = jwt.verify(token, process.env.JWT_Secret);

    // decoded = { id: "...", email: "...", iat: ..., exp: ... }

    // ✅ get full user details from DB using id in token
    console.log(decoded)
    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // attach to request so routes can use it
    req.user = user; 
    next();
  } catch (error) {
    return res.status(401).json({ error});
  }
}

module.exports = verifyToken;
