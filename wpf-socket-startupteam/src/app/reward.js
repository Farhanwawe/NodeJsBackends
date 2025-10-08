const express = require('express');
const router = express.Router();
const{claimDailyReward,getUserStatus} = require('./dailyReward');
router.use(express.json());
router.post('/claimreward',async(req,res)=>{
    const userId = req.body.userId;
    try{
        const result=await claimDailyReward(userId);
        res.status(200).json(result);
    }catch(err){
        console.error(err);
        res.status(500).json({error: 'An error occured while claiming the reward.'});
    }
});
router.post('/getStatus',async(req,res)=>{
    const userId = req.body.userId;
    try{
        const result=await getUserStatus(userId);
        res.status(200).json(result);
    }catch(err){
        console.error(err);
        res.status(500).json({error: 'An error occured while claiming the reward.'});
    }
})

module.exports=router