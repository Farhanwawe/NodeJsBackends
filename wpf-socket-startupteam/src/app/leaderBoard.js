let sequelizeObjects = require("../database/sequelize");
const logger = require("./logger");
async function LeaderBoard(playerID) {
  try {
        const rewards = [
          "20M",
          "10M",
          "4.8M",
          "2M",
          "1M",
          "800K",
          "600K",
          "400K",
          "320K",
          "100K",
        ];
        let activeEvent = await sequelizeObjects.LeaderboardEvent.findOne({
          where: { isActive: true },
        });

        if (!activeEvent) {
          return { message: false, eventId: null };
        }

        const startTime = new Date(activeEvent.startTime);
        const endTime = new Date(activeEvent.endTime);
        const currentTime = new Date();
        let event = await sequelizeObjects.Event.findOne({
          where: { id: activeEvent.eventId },
        });
        const totalTime = (endTime - startTime) / 1000; // in seconds
        const remainingTime = (endTime - currentTime) / 1000;

        // Find the leaderboard entry for the user for the current active event
        let user = await sequelizeObjects.LeaderBoard.findOne({
          where: { userId: playerID, LBID: activeEvent.id },
        });

        if (!user) {
          return {
            message: false,
            eventId: activeEvent.eventId,
            eventName: event.name,
            totalTime,
            remainingTime,
            rewards: rewards[0],
          };
        } else {
          // Retrieve leaderboard data for the current active event
          const Objects = await sequelizeObjects.LeaderBoard.findAll({
            where: { LBID: activeEvent.id },
            order: [
              ["objectsCollected", "DESC"], // Primary sorting by objectsCollected
              ["updatedAt", "ASC"], // Secondary sorting by timestamp (earlier updates first)
              ["userId", "ASC"], // Tertiary sorting by userId for consistency
            ],
            attributes: [
              "playerName",
              "objectsCollected",
              "userId",
              "reward",
              "updatedAt",
            ],
          });

          // Get the top 10 users
          const top10Users = Objects.slice(0, 10);
          for (let i = 0; i < top10Users.length; i++) {
            await sequelizeObjects.LeaderBoard.update(
              { reward: rewards[i] },
              { where: { userId: top10Users[i].userId, LBID: activeEvent.id } }
            );
          }

          const nonTop10Users = Objects.slice(10);
          for (let user of nonTop10Users) {
            await sequelizeObjects.LeaderBoard.update(
              { reward: null },
              { where: { userId: user.userId, LBID: activeEvent.id } }
            );
          }

          const updatedObjects = await sequelizeObjects.LeaderBoard.findAll({
            where: { LBID: activeEvent.id },
            order: [
              ["objectsCollected", "DESC"],
              ["updatedAt", "ASC"],
              ["userId", "ASC"],
            ],
            include: [
              {
                model: sequelizeObjects.User,
                attributes: ["profileImageLink"],
              },
            ],
            attributes: ["playerName", "objectsCollected", "userId", "reward"],
          });

          const leaderboardData = updatedObjects.map((object, index) => ({
            number: index + 1,
            name: object.playerName,
            objectsCollected: object.objectsCollected,
            reward: object.reward,
            userId: object.userId,
            profileImageLink: object.user.profileImageLink,
          }));

          const userIndex = leaderboardData.findIndex(
            (leaderboardEntry) =>
              leaderboardEntry.userId === playerID.toString()
          );
          const userRank =
            userIndex !== -1 ? leaderboardData[userIndex].number : null;
          const username =
            userIndex !== -1 ? leaderboardData[userIndex].name : null;
          const userobjects =
            userIndex !== -1
              ? leaderboardData[userIndex].objectsCollected
              : null;
          const profileLink =
            userIndex !== -1
              ? leaderboardData[userIndex].profileImageLink
              : null;

          return {
            message: true,
            leaderboardData,
            userRank,
            username,
            userobjects,
            totalTime,
            remainingTime,
            eventId: activeEvent.eventId,
            eventName: event.name,
            profileLink,
          };
        }
      
  } catch (err) {
    logger.log(err);
  }
}

async function LeaderBoardReward(playerId) {
    try {

          const rewards = [
            "20M",
            "10M",
            "4.8M",
            "2M",
            "1M",
            "800K",
            "600K",
            "400K",
            "320K",
            "100K",
          ];
          let activeEvent = await sequelizeObjects.LeaderboardEvent.findOne({
            where: { isActive: true },
          });
          if (activeEvent) {
            let user = await sequelizeObjects.LeaderBoard.findOne({
              where: { userId: playerId, LBID: activeEvent.id - 1 },
            });
            if (user) {
              const Objects = await sequelizeObjects.LeaderBoard.findAll({
                where: { LBID: activeEvent.id - 1 },
                order: [
                  ["objectsCollected", "DESC"],
                  ["updatedAt", "ASC"],
                  ["userId", "ASC"],
                ],
                attributes: [
                  "playerName",
                  "objectsCollected",
                  "userId",
                  "reward",
                  "isCollected",
                ],
              });
              const top10Users = Objects.slice(0, 10);
              for (let i = 0; i < top10Users.length; i++) {
                await sequelizeObjects.LeaderBoard.update(
                  { reward: rewards[i] },
                  {
                    where: {
                      userId: top10Users[i].userId,
                      LBID: activeEvent.id - 1,
                    },
                  }
                );
              }
              const nonTop10Users = Objects.slice(10);
              for (let user of nonTop10Users) {
                await sequelizeObjects.LeaderBoard.update(
                  { reward: null },
                  { where: { userId: user.userId, LBID: activeEvent.id - 1 } }
                );
              }
              const reward = await sequelizeObjects.LeaderBoard.findAll({
                where: { LBID: activeEvent.id - 1 },
                order: [
                  ["objectsCollected", "DESC"],
                  ["updatedAt", "ASC"],
                  ["userId", "ASC"],
                ],
                attributes: [
                  "playerName",
                  "objectsCollected",
                  "userId",
                  "reward",
                  "isCollected",
                ],
              });
              // Get the top 10 users
              const topRewardUsers = reward.slice(0, 10);
              let events = await sequelizeObjects.LeaderboardEvent.findOne({
                where: { id: activeEvent.id - 1 },
              });
              if (events) {
                events = await sequelizeObjects.Event.findOne({
                  where: { id: events.eventId },
                });
                if (events) {
                  for (let i = 0; i < topRewardUsers.length; i++) {
                    if (topRewardUsers[i].userId == playerId) {
                      /* players[connectionId].connection.sendText(
                        JSON.stringify({
                          key: "LeaderBoardReward",
                          Name: topRewardUsers[i].playerName,
                          Rank: i + 1,
                          isCollected: topRewardUsers[i].isCollected,
                          reward: topRewardUsers[i].reward,
                          EventName: events.name,
                          EventId: events.id,
                        })
                      ); */
                      return{
                        Name: topRewardUsers[i].playerName,
                        Rank: i + 1,
                        isCollected: topRewardUsers[i].isCollected,
                        reward: topRewardUsers[i].reward,
                        EventName: events.name,
                        EventId: events.id,
                      }
                    }
                  }
                }
              }
            } else {
              return;
            }
          } else {
            return;
          }
    } catch (error) {
      logger.log(error);
    }
  }
  async function collectLeaderBoardReward(playerId) {
    try {

          let activeEvent = await sequelizeObjects.LeaderboardEvent.findOne({
            where: { isActive: true },
          });
          if (activeEvent) {
            let topUser = await sequelizeObjects.LeaderBoard.findOne({
              where: {
                userId: playerId,
                LBID: activeEvent.id - 1,
                isCollected: false,
              },
            });
            let user = await sequelizeObjects.User.findOne({
              where: { id: playerId },
            });
            if (topUser && user) {
              let Reward = await rewardLeaderboard(topUser.reward);
              if (Reward) {
                user.money = parseInt(user.money) + Reward;
                topUser.isCollected = true;
                user.save();
                topUser.save();
                return{
                  isCollected: topUser.isCollected,
                  reward: Reward
                }
              }
            } else {
              return;
            }
          }
    } catch (error) {
      logger.log(error);
    }
  }
  function rewardLeaderboard(reward) {
    try {
      switch (reward) {
        case "20M":
          return 20000000;
          break;
        case "10M":
          return 10000000;
          break;
        case "4.8M":
          return 4800000;
          break;
        case "2M":
          return 2000000;
          break;
        case "1M":
          return 1000000;
          break;
        case "800K":
          return 800000;
          break;
        case "600K":
          return 600000;
          break;
        case "400K":
          return 400000;
          break;
        case "320K":
          return 320000;
          break;
        case "100K":
          return 100000;
          break;
      }
    } catch (err) {
      logger.log(err);
    }
  }
  module.exports = {
    LeaderBoardReward,
    LeaderBoard,
    collectLeaderBoardReward
  };