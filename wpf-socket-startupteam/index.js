const express = require('express');
const dotEnv = require('dotenv');
const rateLimit = require('express-rate-limit');
const logger = require('./src/app/logger');
const cors = require('cors');
const path = require('path');
const fs = require('fs');  // Make sure to require fs
const authRoute = require('./API/Routes/routes');
const adminRoutes = require('./src/vipAdmin/admin');
const referralRoutes = require('./API/Routes/referralRoutes');
const cookieParser = require('cookie-parser');

dotEnv.config();

const app = express();
app.use(cookieParser());
app.set('trust proxy', true);

// CORS Middleware
app.use(cors());

// Express JSON Parser
app.use(express.json());

// Rate Limiter Middleware
const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
  headers: true,
  keyGenerator: (req) => req.ip,
});
app.use('/auth', apiLimiter);

// Log IP
app.use((req, res, next) => {
  const clientIp = req.headers['x-forwarded-for'] || req.ip;
  logger.log(`Resolved Client IP: ${clientIp}`);
  next();
});

// ✅ Serve assetlinks.json at /.well-known/
app.use('/.well-known', express.static(path.join(__dirname, '.well-known')));

// Custom route for deeplink functionality
// app.get('/deeplink', (req, res) => {
//   // Path to the deeplink.json file
//   const filePath = path.join(__dirname, 'deeplink.json');

//   // Read the JSON file
//   fs.readFile(filePath, 'utf8', (err, data) => {
//     if (err) {
//       console.error('Error reading JSON file:', err);
//       return res.status(500).json({ error: 'Failed to read JSON file' });
//     }

//     // Parse the JSON file content
//     let jsonData;
//     try {
//       jsonData = JSON.parse(data);
//     } catch (e) {
//       console.error('Error parsing JSON:', e);
//       return res.status(500).json({ error: 'Invalid JSON format' });
//     }

//     // Send the JSON result back to the user
//     res.json(jsonData);
//   });
// });

// Routes
app.use('/auth', authRoute);
app.use('/Assets', express.static(path.join(__dirname, 'Assets')));
app.use('/admin', adminRoutes);
app.use('/deeplink', referralRoutes);

app.get('/test-dl', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  logger.log(`Server is running on port ${PORT}`);
});
