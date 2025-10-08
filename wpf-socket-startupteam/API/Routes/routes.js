const express = require('express');
const verifyToken = require('../../middleswares/auth');
const {phoneLogin,googleLogin,facebookLogin,buildCodeStatus,getUserStatus,logoutUser,usernameupdate,phoneverify,phoneingameverify,serverStatus,verifyPhone,googleLoginVerify,facebookLoginVerify,getImageLink,versionStatus,getAssets,getPingSettings,updatePingSettings, verifyReferral, verifyFriendInvite} = require('../Controller/controller');

const router = express.Router();

router.post('/phoneLogin',phoneLogin);
router.post('/googleLogin',googleLogin);
router.post('/facebookLogin',facebookLogin);
router.post('/getUserStatus',getUserStatus);
router.post('/logoutUser',logoutUser);
router.post('/usernameUpdate',usernameupdate);
router.post('/phoneverify',phoneverify);
router.post('/phoneingameverify',phoneingameverify);
router.post('/serverstatus',serverStatus);
router.post('/verifyPhone',verifyPhone);
router.post('/googleLoginVerify',googleLoginVerify);
router.post('/facebookLoginVerify',facebookLoginVerify);
router.post('/getImageLink',getImageLink);
router.post('/versionStatus',versionStatus);
router.post('/buildCodeStatus',verifyToken,buildCodeStatus);
router.post('/getAssets',getAssets);
router.get("/ping-settings", getPingSettings);
router.post("/ping-settings",verifyToken, updatePingSettings);
router.get("/verify-referral", verifyReferral);
router.get("/verify-friend", verifyFriendInvite);


module.exports = router