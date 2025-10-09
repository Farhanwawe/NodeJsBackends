const express = require('express');
const dotEnv = require('dotenv');
const rateLimit = require('express-rate-limit');
const logger = require('./src/app/logger');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const authRoute = require('./API/Routes/routes');
const adminRoutes = require('./src/vipAdmin/admin');
const referralRoutes = require('./API/Routes/referralRoutes');

dotEnv.config();

const app = express();
app.set('trust proxy', true);

app.use(cookieParser());
app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
  headers: true,
  keyGenerator: (req) => req.ip,
});

const ipLogger = (req, res, next) => {
  const clientIp = req.headers['x-forwarded-for'] || req.ip;
  logger.log(`Client IP: ${clientIp}`);
  next();
};

app.use('/.well-known', express.static(path.join(__dirname, '.well-known')));
app.use('/Assets', express.static(path.join(__dirname, 'Assets')));

app.use(ipLogger);
app.use('/auth', apiLimiter, authRoute);
app.use('/admin', adminRoutes);
app.use('/deeplink', referralRoutes);

app.get('/test-dl', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((err, req, res, next) => {
  logger.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.log(`Socket Server running on port ${PORT}`);
});
