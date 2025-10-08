const { Console } = require('console');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(403).json({ message: 'Token not provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        
        if (err) {
            console.error('Error verifying token:', err);
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.adminId = decoded.id;
        next();
    });
};

module.exports = verifyToken;