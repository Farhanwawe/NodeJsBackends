const dbUtils = require("../database/dbUtils");
let sequelizeObjects = require("../database/sequelize");
const { Op } = require("sequelize");
const logger = require("./logger");
async function collectRewardlist(playerID) {
  try {
    const userLevelProgress = await sequelizeObjects.LevelChallenges.findOne({
      where: { userId: playerID },
    });
    const currentLevel = userLevelProgress ? userLevelProgress.level : 0;
    const lastClaimed = userLevelProgress ? userLevelProgress.lastClaimedlevel : 0;

    let claimedLevels = [];
    let totalRewards = 0;
    let premiumreward = 0;
    let premiumspin = 0;
    let spinCount = 0;

    // Batch-fetch rewards for levels between lastClaimed+1 and currentLevel-1.
    const rewards = await sequelizeObjects.RewardChallenges.findAll({
      where: {
        level: {
          [Op.gt]: lastClaimed,
          [Op.lt]: currentLevel,
        },
      },
    });

    // Build a map for quick lookup by level.
    const rewardsMap = {};
    rewards.forEach((reward) => {
      rewardsMap[reward.level] = reward;
    });

    // Loop over levels in the original range.
    for (let level = lastClaimed + 1; level < currentLevel; level++) {
      const reward = rewardsMap[level];
      if (reward) {
        if (reward.tag === "chips") {
          totalRewards += parseInt(reward.normalRewardint, 10);
          premiumreward += parseInt(reward.subscribedRewardint, 10);
        } else if (reward.tag === "spin") {
          spinCount += parseInt(reward.normalRewardint, 10);
          premiumspin += parseInt(reward.subscribedRewardint, 10);
        }
        claimedLevels.push(level);
      }
    }

    logger.log(
      `User ${playerID} will claim rewards for levels: ${claimedLevels.join(
        ", "
      )}, Total reward: ${totalRewards}, Spin Count: ${spinCount}`
    );

/*     players[connectionId].connection.sendText(
      JSON.stringify({
        key: "CollectRewardList",
        RewardCollected: totalRewards,
        VIPRewardCollected: premiumreward,
        VIPSpinCollected: premiumspin,
        SpinCount: spinCount,
      })
    ); */

    return{
      RewardCollected: totalRewards,
      VIPRewardCollected: premiumreward,
      VIPSpinCollected: premiumspin,
      SpinCount: spinCount,
    };
  } catch (err) {
    logger.log(err);
  }
}
async function collectReward(playerID) {
  try {

    // Fetch user level progress.
    const userLevelProgress = await sequelizeObjects.LevelChallenges.findOne({
      where: { userId: playerID },
    });
    if (!userLevelProgress) {
      throw new Error("User not found");
    }

    let currentLevel = userLevelProgress.level || 0;
    let lastClaimed = userLevelProgress.lastClaimedlevel || 0;

    if (currentLevel <= lastClaimed) {
      throw new Error("No rewards to collect. Already claimed for the current level.");
    }

    let totalRewards = 0;
    let spinCount = 0;
    let claimedLevels = [];

    // Pre-fetch the in-app purchase info and batch-fetch rewards concurrently.
    const [purchaseInfo, rewards] = await Promise.all([
      sequelizeObjects.InAppPurchase.findOne({
        where: {
          userId: playerID,
          productID: "com.wawepokerface.wawepokerface.royalpass",
        },
      }),
      sequelizeObjects.RewardChallenges.findAll({
        where: {
          level: {
            [Op.gt]: lastClaimed,
            [Op.lt]: currentLevel,
          },
        },
      }),
    ]);

    // Build a rewards lookup map keyed by level.
    const rewardsMap = {};
    rewards.forEach((reward) => {
      rewardsMap[reward.level] = reward;
    });

    // Process each level in the range.
    for (let level = lastClaimed + 1; level < currentLevel; level++) {
      const reward = rewardsMap[level];
      if (reward) {
        if (purchaseInfo) {
          if (reward.tag === "chips") {
            totalRewards += parseInt(reward.subscribedRewardint, 10);
          } else if (reward.tag === "spin") {
            spinCount += parseInt(reward.subscribedRewardint, 10);
          }
        } else {
          if (reward.tag === "chips") {
            totalRewards += parseInt(reward.normalRewardint, 10);
          } else if (reward.tag === "spin") {
            spinCount += parseInt(reward.normalRewardint, 10);
          }
        }
        claimedLevels.push(level);
      }
    }

    logger.log(
      `User ${playerID} will claim rewards for levels: ${claimedLevels.join(
        ", "
      )}, Total reward: ${totalRewards}, Spin Count: ${spinCount}`
    );

    // Update user chips if rewards are collected.
    if (totalRewards > 0) {
      const user = await sequelizeObjects.User.findOne({ where: { id: playerID } });
      let userMoney = parseInt(user.money, 10);
      userMoney += totalRewards;
      await sequelizeObjects.User.update({ money: userMoney }, { where: { id: playerID } });
    }

    // Update spin count in user game stats if spin rewards were collected.
    if (spinCount > 0) {
      let userGameStats = await sequelizeObjects.UserGameStats.findOne({
        where: { PlayerId: playerID },
      });
      if (userGameStats) {
        userGameStats.SpinnerInfo = parseInt(userGameStats.SpinnerInfo, 10) + spinCount;
        await userGameStats.save();
      }
    }

    // Update level progress by setting lastClaimedAt and lastClaimedlevel.
    currentLevel = currentLevel - 1;
    await sequelizeObjects.LevelChallenges.update(
      {
        lastClaimedAt: new Date(),
        lastClaimedlevel: currentLevel,
      },
      { where: { userId: playerID } }
    );

    // Send reward data back to the client.
/*     players[connectionId].connection.sendText(
      JSON.stringify({
        key: "collectReward",
        "Reward Collected": totalRewards,
        "Spin Count": spinCount,
      })
    ); */

    // If the last claimed level reaches/exceeds 15, reset level progress.
    if (userLevelProgress.lastClaimedlevel >= 15) {
      await sequelizeObjects.LevelChallenges.update(
        {
          points: 0,
          level: 1,
          lastClaimedlevel: null,
          lastAssignedAt: new Date(),
        },
        { where: { id: playerID } }
      );
    }

    logger.log(
      `User ${playerID} has successfully claimed rewards for levels ${claimedLevels.join(
        ", "
      )}, Total reward: ${totalRewards}, Spin Count: ${spinCount}`
    );
    return {
      RewardCollected: totalRewards,
      SpinCount: spinCount,
    }
  } catch (err) {
    logger.log(err);
  }
}
async function getRewardList(playerID) {
  try {

    // Pre-calculate the cutoff time (24 hours ago).
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Get assigned challenges in the last 24 hours.
    const assignedChallenges = await sequelizeObjects.UserChallenge.findAll({
      where: {
        userId: playerID,
        assignedAt: { [Op.gt]: last24Hours },
      },
    });
    
    if (assignedChallenges) {
      // Run these queries concurrently.
      const [userLevelProgress, reward, inAppPurchase] = await Promise.all([
        sequelizeObjects.LevelChallenges.findOne({ where: { userId: playerID } }),
        sequelizeObjects.RewardChallenges.findAll({ order: [["id", "ASC"]] }),
        sequelizeObjects.InAppPurchase.findOne({
          where: {
            userId: playerID,
            productID: "com.wawepokerface.wawepokerface.royalpass",
          },
        }),
      ]);
      
      let currentLevel = userLevelProgress ? userLevelProgress.level : 0;
      let lastClaimed = userLevelProgress ? userLevelProgress.lastClaimedlevel : 0;
      let purchase = !!inAppPurchase;
      
/*       players[connectionId].connection.sendText(
        JSON.stringify({
          key: "RewardList",
          data: reward,
          currentLevel: currentLevel,
          lastClaimed: lastClaimed,
          ispurchased: purchase,
        })
      ); */
      return {
        data: reward,
        currentLevel: currentLevel,
        lastClaimed: lastClaimed,
        ispurchased: purchase
      }
    }
  } catch (error) {
    logger.log(error);
  }
}
async function collectPoints(playerID, challengeId) {
      try {
        // Get the challenge points
        const challenge = await sequelizeObjects.DailyChallenges.findOne({
          where: { id: challengeId },
        });
        if (!challenge) {
          throw new Error("Challenge not found");
        }
        const challengePoints = challenge.points;
        // Fetch user's level and points
        let userLevelProgress = await sequelizeObjects.LevelChallenges.findOne({
          where: { userId: playerID },
        });
        if (!userLevelProgress) {
          userLevelProgress = await sequelizeObjects.LevelChallenges.create({
            userId: playerID,
            points: 0,
            level: 1,
            lastClaimedAt: null,
            lastAssignedAt: new Date(),
          });
        }

        // Initialize level points requirements
        let currentLevel = userLevelProgress.level;
        let currentPoints = userLevelProgress.points;
        let totalPoints = currentPoints + challengePoints;
        let nextLevelRequirement = 0;
        logger.log(
          `Starting with Level: ${currentLevel}, Points: ${totalPoints}`
        );

        while (true) {
          const levelRequirements =
            await sequelizeObjects.RewardChallenges.findOne({
              where: { level: currentLevel },
            });

          if (!levelRequirements) {
            logger.log(
              `Max level reached or level data missing for Level: ${currentLevel}`
            );
            break;
          }
          nextLevelRequirement = levelRequirements.points;
          logger.log(
            `Level ${currentLevel} requires ${nextLevelRequirement}  points, Total points: ${totalPoints}`
          );

          if (totalPoints < nextLevelRequirement) {
            break;
          }

          totalPoints -= nextLevelRequirement;
          currentLevel++;

          logger.log(
            `Leveled up to: ${currentLevel}, Remaining points: ${totalPoints}`
          );
          if (currentLevel > 15) {
            currentLevel = 16;
            totalPoints = nextLevelRequirement;
          }
          if (currentLevel > 15 && userLevelProgress.lastClaimedlevel === 15) {
            logger.log(`Reached max level: ${currentLevel}`);
            break;
          }
        }

        logger.log(
          `Final Level: ${currentLevel}, Points: ${totalPoints}, Next Level Requirement: ${nextLevelRequirement}`
        );

        await sequelizeObjects.LevelChallenges.update(
          {
            points: totalPoints,
            level: currentLevel,
          },
          { where: { userId: playerID } }
        );
        await sequelizeObjects.UserChallenge.update(
          { isCollected: true },
          { where: { userId: playerID, challengeId: challengeId } }
        );
/*         players[connectionId].connection.sendText(
          JSON.stringify({
            key: "collectPoints",
            Points: totalPoints,
            level: currentLevel,
            nextLevelPoints: nextLevelRequirement,
          })
        ); */

        logger.log(
          `User ${playerID} has completed the challenge. Current level: ${currentLevel}, Points: ${totalPoints}`
        );
        return {
          Points: totalPoints,
          level: currentLevel,
          nextLevelPoints: nextLevelRequirement
        }
      } catch (error) {
        logger.log("Error updating challenge progress:", error);
      }
}
async function addDailyChallenges(playerID) {
  try {

      const user = await sequelizeObjects.User.findOne({
        where: { id: playerID },
      });
      const userLevel = parseInt(user.Level);
      const difficulties = ["Easy"];
      if (userLevel >= 10) difficulties.push("Normal");
      if (userLevel >= 20) difficulties.push("Hard");

      // Get already assigned challenges
      const assignedChallenges = await getAssignedChallenges(playerID);
      const { levelProgress, rewardPoint } = await manageLevelProgress(
        playerID
      );
      let { challengesToDisplay, remainingTime, remainingTimeReward } =
        assignedChallenges.length > 0
          ? await handleAssignedChallenges(assignedChallenges)
          : await assignNewChallenges(playerID, difficulties);

      const detailedChallenges = await fetchChallengeDetails(
        challengesToDisplay
      );
      const points = await fetchProgress(challengesToDisplay, playerID);


      // Convert remaining times to seconds
      remainingTime /= 1000;
      remainingTimeReward /= 1000;
      let purchase = false;
      let Reward = await sequelizeObjects.InAppPurchase.findOne({
        where: {
          userId: playerID,
          productID: "com.wawepokerface.wawepokerface.royalpass",
        },
      });
      if (Reward) {
        purchase = true;
      }

      // Send data back to the client
      const dataToSend = {
        key: "getDailyChallenges",
        data: detailedChallenges,
        progress: points,
        remainingTime,
        rewardRemainTime: remainingTimeReward,
        ispurchased: purchase,
        level: levelProgress.level,
        nextLevelPoints: rewardPoint ? rewardPoint.points : 0,
        points: levelProgress.points,
      };

      /* players[connectionId].connection.sendText(JSON.stringify(dataToSend)); */
      
      
      return{
       dataToSend: dataToSend 
      }
    } catch (error) {
      logger.log(`Error managing daily challenges: ${error}`);
    }
  // Set up the interval to reset challenges every 24 hours
  setInterval(() => resetAllDailyChallenges(), 24 * 60 * 60 * 1000);
}

async function getAssignedChallenges(playerID) {
  return await sequelizeObjects.UserChallenge.findAll({
    where: {
      userId: playerID,
      isCollected: false,
      assignedAt: { [Op.gt]: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    order: [["priority", "DESC"]], // Priority 1 first, then sort by assignment time
  });
}

async function handleAssignedChallenges(assignedChallenges) {
  const lastAssignedAt = assignedChallenges[0].assignedAt;
  const timePassed = Date.now() - lastAssignedAt;
  const levelProgress = await sequelizeObjects.LevelChallenges.findOne({ where: { userId: assignedChallenges[0].userId } });
  let remainingTimeReward;
  if (!levelProgress) {
    // New user: full 48 hours reward timer.
    remainingTimeReward = 48 * 60 * 60 * 1000;
  } else {
    // Existing user: calculate elapsed time since last reward claim.
    const timeSinceLastClaim = Date.now() - new Date(levelProgress.lastAssignedAt);
    remainingTimeReward = 48 * 60 * 60 * 1000 - timeSinceLastClaim;
    // If the remaining time is negative, don't reset it here.
    if (remainingTimeReward < 0) remainingTimeReward = 0;
  }
  return {
    challengesToDisplay: assignedChallenges,
    remainingTime: 24 * 60 * 60 * 1000 - timePassed,
    remainingTimeReward: remainingTimeReward,
  };
}

async function assignNewChallenges(playerID, difficulties) {
  const challenges = await sequelizeObjects.DailyChallenges.findAll({
    where: { complexity: { [Op.in]: difficulties } },
  });

  // Shuffle the challenges array to ensure randomness
  const shuffledChallenges = challenges.sort(() => Math.random() - 0.5);

  // Ensure no repetition by slicing the shuffled array
  const selectedChallenges = shuffledChallenges.slice(0, 6);

  // Create user challenges with priorities
  const challengesToDisplay = await Promise.all(
    selectedChallenges.map((challenge, index) =>
      sequelizeObjects.UserChallenge.create({
        userId: playerID,
        challengeId: challenge.id,
        isCompleted: false,
        progress: 0,
        isCollected: false,
        assignedAt: new Date(),
        priority: index < 3 ? 1 : 0,
      })
    )
  );
  const levelProgress = await sequelizeObjects.LevelChallenges.findOne({ where: { userId: playerID }});
  let remainingTimeReward;
  if (!levelProgress) {
    // New user: full 48 hours reward timer.
    remainingTimeReward = 48 * 60 * 60 * 1000;
  } else {
    // Existing user: calculate elapsed time since last reward claim.
    const timeSinceLastClaim = Date.now() - new Date(levelProgress.lastAssignedAt);
    remainingTimeReward = 48 * 60 * 60 * 1000 - timeSinceLastClaim;
    // If the remaining time is negative, don't reset it here.
    if (remainingTimeReward < 0) remainingTimeReward = 0;
  }
  return {
    challengesToDisplay,
    remainingTime: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    remainingTimeReward: remainingTimeReward, // 48 hours in milliseconds
  };
}

async function fetchChallengeDetails(challenges) {
  return await Promise.all(
    challenges.map(async (challenge) =>
      sequelizeObjects.DailyChallenges.findOne({
        where: { id: challenge.challengeId },
      })
    )
  );
}

async function fetchProgress(challenges, playerID) {
  return await Promise.all(
    challenges.map(
      async (challenge) =>
        (
          await sequelizeObjects.UserChallenge.findOne({
            where: {
              userId: playerID,
              challengeId: challenge.challengeId,
              assignedAt: {
                [Op.gt]: new Date(Date.now() - 24 * 60 * 60 * 1000),
              },
            },
          })
        ).progress
    )
  );
}

async function manageLevelProgress(playerID) {
  let levelProgress = await sequelizeObjects.LevelChallenges.findOne({
    where: { userId: playerID },
  });
  const currentTime = new Date();
  if (
    !levelProgress ||
    (levelProgress.lastAssignedAt && currentTime - new Date(levelProgress.lastAssignedAt) >= 48 * 60 * 60 * 1000)
  ) {
    levelProgress = await resetLevelProgress(levelProgress, playerID);
  }

  const rewardPoint = await sequelizeObjects.RewardChallenges.findOne({
    where: { level: levelProgress.level },
  });

  return { levelProgress, rewardPoint };
}

async function resetLevelProgress(levelProgress, playerID) {
  if (!levelProgress) {
    return await sequelizeObjects.LevelChallenges.create({
      userId: playerID,
      points: 0,
      lastClaimedlevel: 0,
      level: 1,
      lastClaimedAt: new Date(),
      lastAssignedAt: new Date(),
    });
  }

  levelProgress.points = 0;
  levelProgress.level = 1;
  levelProgress.lastClaimedAt = new Date();
  levelProgress.lastClaimedlevel = 0;
  levelProgress.lastAssignedAt = new Date();
  await levelProgress.save();
  return levelProgress;
}

async function resetAllDailyChallenges() {
  const users = await sequelizeObjects.User.findAll();
  await Promise.all(
    users.map((user) =>
      addDailyChallenges(
        players[user.conn]?.connectionId,
        players[user.conn]?.socketKey,
        user.id
      )
    )
  );
}

async function getDailyChallenges( playerID) {

    try {
      const result = await dbUtils.GetDailyChallenges(
        sequelizeObjects,
        playerID
      );

/*       players[connectionId].connection.sendText(
        JSON.stringify({
          key: "DailyChallenges",
          data: result,
        })
      ); */

      const challenge = [];
      for (let i = 0; i < result.UserChallenges.length; i++) {
        const challenges = await sequelizeObjects.DailyChallenges.findOne({
          where: { id: result.UserChallenges[i].challengeId },
        });
        challenge.push(challenges);
      }
/*       players[connectionId].connection.sendText(
        JSON.stringify({
          key: "getDailyChallenges",
          data: challenge,
        })
      ); */

      
      return{
        result: result,
        challenge: challenge
      }
    } catch (error) {
      // Handle any potential errors
      logger.log(`Error getting daily challenges: ${error}`);
    }
  }
  module.exports = {
    getDailyChallenges,
    addDailyChallenges,
    collectPoints,
    getRewardList,
    collectReward,
    collectRewardlist
  };