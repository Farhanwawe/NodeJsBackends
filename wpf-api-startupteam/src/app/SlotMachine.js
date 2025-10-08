let pokerSolver = require("pokersolver").Hand;
let poker = require("./poker");
let deck = poker.visualize(poker.randomize(poker.newSet()));
let decksize = deck.length;
let deckCard = 0;
const utils = require("./utils");
let middleCards = [];
let sequelizeObjects = require("../database/sequelize");

async function isFreeSpinAvailable(userId) {

      try {
        const lastSlotResult = await sequelizeObjects.SlotResult.findOne({
          where: { userId },
          order: [["createdAt", "DESC"]],
        });

        const now = new Date();

        if (
          !lastSlotResult ||
          now - new Date(lastSlotResult.createdAt) >= 24 * 60 * 60 * 1000
        ) {
/*           players[connectionId].connection.sendText(
            JSON.stringify({
              key: "SlotMachineStatus",
              Message: true,
              initialbet: 0,
            })
          ); */
          return { message: true, initialbet: 0 };
        } else {
/*           players[connectionId].connection.sendText(
            JSON.stringify({
              key: "SlotMachineStatus",
              Message: false,
              initialbet: 80000,
            })
          ); */
          return { message: false, initialbet: 80000 };
        }
  } catch (error) {
    logger.log(error);
  }
}
async function spinAvalability(userId) {
  try {
      try {
        const lastSlotResult = await sequelizeObjects.SlotResult.findOne({
          where: { userId },
          order: [["createdAt", "DESC"]],
        });

        const now = new Date();

        if (
          !lastSlotResult ||
          now - new Date(lastSlotResult.createdAt) >= 24 * 60 * 60 * 1000
        ) {
          return { message: true, initialbet: 0 };
        } else {
          return { message: false, initialbet: 80000 };
        }
      } catch (error) {
        logger.log(error);
        return false;
      }
  } catch (error) {
    logger.log(error);
  }
}
async function playSlotMachine(userId, initialbet,players) {
  try {
    
        let user = await sequelizeObjects.User.findOne({
          where: { id: userId },
        });
        if (user) {
          let userMoney = parseInt(user.money);
          if (initialbet === 0) {
            const lastSlotResult = await sequelizeObjects.SlotResult.findOne({
              where: { userId: userId },
              order: [["lastClaimed", "DESC"]],
            });

            const now = new Date();

            if (
              !lastSlotResult ||
              now - new Date(lastSlotResult.lastClaimed) >= 24 * 60 * 60 * 1000
            ) {
              deck = poker.visualize(poker.randomize(poker.newSet()));
              decksize = deck.length;
              deckCard = 0;

              for (let i = 0; i < 5; i++) {
                middleCards[i] = getNextDeckCard();
              }
              middleCards = [...new Set(middleCards)];

              let hand = pokerSolver.solve(
                utils.asciiToStringCardsArray(middleCards)
              );
              let handName = hand.name;
              let rewardMultiplier = getRewardMultiplier(
                handName,
                hand.cards,
                initialbet
              );

              userMoney = userMoney + parseInt(rewardMultiplier);
              players.playersAllMoney = parseInt(players.playersAllMoney) + parseInt(rewardMultiplier);
              user.money = userMoney;
              await user.save();
              let freeSpin = await spinAvalability(
                userId
              );
              saveSlotResult(userId, handName, rewardMultiplier, now);
/*               players[connectionId].connection.sendText(
                JSON.stringify({
                  key: "SlotMachine",
                  handName: handName,
                  rewardMultiplier: rewardMultiplier,
                  cards: hand.cards,
                  freeSpin: freeSpin,
                })
              ); */
              return{
                handName: handName,
                rewardMultiplier: rewardMultiplier,
                cards: hand.cards,
                freeSpin: freeSpin
              }
            } else {
/*               players[connectionId].connection.sendText(
                JSON.stringify({
                  key: "SlotMachine",
                  Message: "Free spin is not available",
                })
              ); */
              return false;
            }
          } else {
            if (userMoney >= initialbet) {
              userMoney = userMoney - initialbet;
              user.money = userMoney;
              await user.save();
              deck = poker.visualize(poker.randomize(poker.newSet()));
              decksize = deck.length;
              deckCard = 0;

              for (let i = 0; i < 5; i++) {
                middleCards[i] = getNextDeckCard();
              }
              middleCards = [...new Set(middleCards)];

              let hand = pokerSolver.solve(
                utils.asciiToStringCardsArray(middleCards)
              );
              let handName = hand.name;
              let rewardMultiplier = getRewardMultiplier(
                handName,
                hand.cards,
                initialbet
              );

              userMoney = userMoney + parseInt(rewardMultiplier);
             players.playersAllMoney = parseInt(players.playersAllMoney) + parseInt(rewardMultiplier);
              user.money = userMoney;
              await user.save();
              const now = new Date();
              let freeSpin = await spinAvalability(
                userId
              );
              saveSlotResult(userId, handName, rewardMultiplier, now);
/*               players[connectionId].connection.sendText(
                JSON.stringify({
                  key: "SlotMachine",
                  handName: handName,
                  rewardMultiplier: rewardMultiplier,
                  cards: hand.cards,
                  freeSpin: freeSpin,
                })
              ); */
              return{
                handName: handName,
                rewardMultiplier: rewardMultiplier,
                cards: hand.cards,
                freeSpin: freeSpin
              }
            } else {
/*               players[connectionId].connection.sendText(
                JSON.stringify({
                  key: "SlotMachine",
                  error: "You do not have enough money in your wallet",
                })
              ); */
              return false;
            }
          }
        }
      } catch (error) {
        logger.log(error);
      }
}

function getNextDeckCard() {
  try {
    if (deckCard >= decksize) {
      throw new Error("Deck is empty");
    }
    let nextCard = deck[deckCard];
    deckCard = deckCard + 1;
    return nextCard;
  } catch (error) {
    logger.log(error);
  }
}

function getRewardMultiplier(handName, cards, initialbet) {
  try {
    if (initialbet === 0) {
      let basereward = 10000;

      if (handName === "High Card") {
        const highCardRanks = {
          A: 13,
          K: 12,
          Q: 11,
          J: 10,
        };

        const highCards = cards.filter((card) => highCardRanks[card.value]);

        if (highCards.length === 0) {
          return 0;
        }
        const highestCard = highCards.reduce((prev, current) =>
          highCardRanks[prev.value] > highCardRanks[current.value]
            ? prev
            : current
        );

        switch (highestCard.value) {
          case "A":
            return 1 * basereward;
          case "K":
            return 0.5 * basereward;
          case "Q":
            return 0.3 * basereward;
          case "J":
            return 0.15 * basereward;
          default:
            return 0;
        }
      }

      switch (handName) {
        case "Royal Flush":
          return 100 * basereward;
        case "Straight Flush":
          return 50 * basereward;
        case "Four of a Kind":
          return 25 * basereward;
        case "Full House":
          return 15 * basereward;
        case "Flush":
          return 10 * basereward;
        case "Straight":
          return 5 * basereward;
        case "Three of a Kind":
          return 3 * basereward;
        case "Two Pair":
          return 2 * basereward;
        case "Pair":
          return 1.5 * basereward;
        default:
          return 0;
      }
    } else {
      if (handName === "High Card") {
        const highCardRanks = {
          A: 13,
          K: 12,
          Q: 11,
          J: 10,
        };

        const highCards = cards.filter((card) => highCardRanks[card.value]);

        if (highCards.length === 0) {
          return 0;
        }
        const highestCard = highCards.reduce((prev, current) =>
          highCardRanks[prev.value] > highCardRanks[current.value]
            ? prev
            : current
        );

        switch (highestCard.value) {
          case "A":
            return 1 * initialbet;
          case "K":
            return 0.5 * initialbet;
          case "Q":
            return 0.3 * initialbet;
          case "J":
            return 0.15 * initialbet;
          default:
            return 0;
        }
      }

      switch (handName) {
        case "Royal Flush":
          return 100 * initialbet;
        case "Straight Flush":
          return 50 * initialbet;
        case "Four of a Kind":
          return 25 * initialbet;
        case "Full House":
          return 15 * initialbet;
        case "Flush":
          return 10 * initialbet;
        case "Straight":
          return 5 * initialbet;
        case "Three of a Kind":
          return 3 * initialbet;
        case "Two Pair":
          return 2 * initialbet;
        case "Pair":
          return 1.5 * initialbet;
        default:
          return 0;
      }
    }
  } catch (error) {
    logger.log(error);
  }
}

async function saveSlotResult(userId, handName, rewardMultiplier, now) {
  try {
    await sequelizeObjects.SlotResult.create({
      userId: userId,
      handName: handName,
      reward: rewardMultiplier,
      lastClaimed: now,
    });
  } catch (error) {
    logger.log("Error saving slot result:" + error);
  }
}

module.exports = {
  isFreeSpinAvailable,
  playSlotMachine
};