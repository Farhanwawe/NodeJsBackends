
const { User } = require('../database/sequelize');
const {SlotMachineReward} =require('../database/sequelize')

const rewardMultipliers=[
      { "level": 1, "rewardMultiplier": 1.0 },
      { "level": 2, "rewardMultiplier": 1.2 },
      { "level": 3, "rewardMultiplier": 1.4 },
      { "level": 4, "rewardMultiplier": 1.6 },
      { "level": 5, "rewardMultiplier": 1.8 },
      { "level": 6, "rewardMultiplier": 2.0 },
      { "level": 7, "rewardMultiplier": 2.2 },
      { "level": 8, "rewardMultiplier": 2.4 },
      { "level": 9, "rewardMultiplier": 2.6 },
      { "level": 10, "rewardMultiplier": 2.8 },
      { "level": 11, "rewardMultiplier": 3.0 },
      { "level": 12, "rewardMultiplier": 3.2 },
      { "level": 13, "rewardMultiplier": 3.4 },
      { "level": 14, "rewardMultiplier": 3.6 },
      { "level": 15, "rewardMultiplier": 3.8 },
      { "level": 16, "rewardMultiplier": 4.0 }
    ]
  
async function addRewardsToDB() {
    try {
        await SlotMachineReward.sync({ force: true });
        for (const reward of rewardMultipliers) {
            await SlotMachineReward .create(reward);
          }
      console.log('Rewards added to the database successfully.');
    } catch (error) {
      console.error('Error adding rewards to the database:', error);
    }
  }
  
  // Sync the model and add the rewards to the database
  exports.addRewardsToDB = addRewardsToDB; ;