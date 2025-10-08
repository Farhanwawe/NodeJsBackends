require('dotenv').config();

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  //console.log("Token = "+token)
  if (!token || token !== process.env.API_SECRET_TOKEN) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
  }

  next(); 
};

module.exports = verifyToken;
