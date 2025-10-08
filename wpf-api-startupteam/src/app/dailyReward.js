const { WeeklyBonus, DailyBonusList, User, UserGameStats } = require('../database/sequelize');
const { Op } = require('sequelize');
const logger = require('./logger');
function getHoursDifference(date1, date2) {
  return Math.floor(Math.abs(date2 - date1) / (1000 * 60 * 60));
}

function calculateRemainingTime(lastClaimed, now) {
  return lastClaimed ? Math.max(0, 24 * 60 * 60 - (now - lastClaimed) / 1000) : 24 * 60 * 60;
}

async function getUserStatus(userId) {
  let bonus = await WeeklyBonus.findOne({ where: { userId: userId } });
  const now = new Date();

  
  if (!bonus) {
    bonus = await WeeklyBonus.create({
      userId,
      day: 1,
      lastClaimed: null,
      rewardProgress: 1,
      timerActive: false,
      week: 1,
      month: 1,
      lastClaimedDay:0
    });
    const reward = await DailyBonusList.findOne({ where: { day: bonus.rewardProgress } });
    let dayToClaim = bonus.day;
    let remainingTime = calculateRemainingTime(bonus.lastClaimed, now);
    return { message: true,dayToClaim:dayToClaim,day:bonus.day,lastClaimedDay:bonus.lastClaimedDay, bonus, reward, remainingTime };
  }

  const hoursSinceLastClaim =  getHoursDifference(new Date(bonus.lastClaimed), now);

  // Reset values if more than 48 hours have passed
  let newDay = bonus.day;
  let rewardProgress = bonus.rewardProgress;
  let newWeek = bonus.week;
  let lastClaimed = bonus.lastClaimedDay;
  let month = bonus.month;
  let dayToClaim = bonus.day;
  const reward = await DailyBonusList.findOne({ where: { day: bonus.rewardProgress+1 > 28?1:bonus.rewardProgress+1 } });
  logger.log(hoursSinceLastClaim);
  let remainingTime = calculateRemainingTime(bonus.lastClaimed, now);
  if (hoursSinceLastClaim >= 48) {
    newDay = 1;
    rewardProgress = 1;
    newWeek = 1;
    month = 1;
    lastClaimed = 0;
    await bonus.update({ day: newDay, rewardProgress, week: newWeek, month: month, timerActive: false, lastClaimedDay: lastClaimed });
    return { message: true,dayToClaim:newDay,day:bonus.day,lastClaimedDay:bonus.lastClaimedDay, bonus, reward, remainingTime };
  }

  if (!bonus.lastClaimed) {
    return { message: true,dayToClaim:dayToClaim,day:bonus.day,lastClaimedDay:bonus.lastClaimedDay, bonus, reward, remainingTime };
  }

  if (hoursSinceLastClaim >= 24) {
    return { message: true,dayToClaim:dayToClaim===7?1:dayToClaim+1, day:bonus.day===7?1:bonus.day,lastClaimedDay:bonus.lastClaimedDay===7?0:bonus.lastClaimedDay, bonus, reward, remainingTime };
  } else {
    return { message: false,dayToClaim:dayToClaim, day:bonus.day,lastClaimedDay:bonus.lastClaimedDay,bonus, reward, remainingTime };
  }
}

async function claimDailyReward(userId) {
  const now = new Date();
  let bonus = await WeeklyBonus.findOne({ where: { userId } });

  if (!bonus) return { message: false, error: "Bonus record not found" };

  const hoursSinceLastClaim = getHoursDifference(new Date(bonus.lastClaimed), now);
  if (hoursSinceLastClaim < 24) return { message: false, bonus, remainingTime: calculateRemainingTime(bonus.lastClaimed, now) };

  let { day, rewardProgress, week, month, lastClaimedDay } = bonus;
  
  if (hoursSinceLastClaim >= 48) {
    day = rewardProgress = week = month = lastClaimedDay = 1;
  } else {
    day = (day % 7) + 1;
    rewardProgress = rewardProgress > 28 ? 1 : rewardProgress + 1;
    lastClaimedDay = day;
    if (day === 1) week++;
  }

  const reward = await DailyBonusList.findOne({ where: { day: rewardProgress } });
  if (!reward) return { message: false, error: "Reward not found" };

  await User.increment({ money: reward.reward__chips }, { where: { id: userId } });

  if (reward.reward__spinners > 0) {
    await UserGameStats.increment(
      { SpinnerInfo: reward.reward__spinners },
      { where: { PlayerId: userId } }
    );
  }

  await bonus.update({ day, lastClaimed: now, rewardProgress, timerActive: true, week, lastClaimedDay });

  return { day, message: true, lastClaimedDay, bonus, reward, remainingTime: calculateRemainingTime(now, now) };
}

module.exports = {
  getUserStatus,
  claimDailyReward
};
