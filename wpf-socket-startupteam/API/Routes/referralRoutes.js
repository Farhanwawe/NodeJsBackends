const express = require('express');
const router = express.Router();
const referralController = require('../Controller/referralController');
const rateLimit = require('express-rate-limit'); // For rate limiting

// Rate limiting configuration for referral generation
const generateCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 5 requests per windowMs
  message: 'Too many referral codes generated from this IP, please try again later'
});

// Rate limiting for referral clicks
const clickLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit each IP to 100 clicks per hour
  message: 'Too many referral clicks from this IP'
});

// for ref
router.post('/generate', 
 // generateCodeLimiter, // Apply rate limiting
  referralController.generateCode
);

router.get('/', 
  // clickLimiter, // Apply rate limiting
   referralController.handleRedirect
 );


/////

//for friend invite
router.post('/friend/generate', 
  // generateCodeLimiter, // Apply rate limiting
   referralController.generateCodeForFriend
 );

// Public routes
router.get('/invite', 
 // clickLimiter, // Apply rate limiting
  referralController.handleRedirectForFriend
);

// Additional referral routes you might want to add
// router.get('/stats', 
//   referralController.getReferralStats
// );

// router.get('/rewards', 
//   referralController.getUserRewards
// );

module.exports = router;