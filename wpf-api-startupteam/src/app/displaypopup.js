const dbUtils = require("../database/dbUtils");
let sequelizeObjects = require("../database/sequelize");
const { Op } = require("sequelize");
const logger = require("./logger");

async function getPopuplist(platform) {
  try {
    let popupList;

    if (platform === 'Android') {
      popupList = await sequelizeObjects.Popups.findAll({
        where: { isVisible: true, Android: true },
      });
    } else if (platform === 'IPhonePlayer') {
      popupList = await sequelizeObjects.Popups.findAll({
        where: { isVisible: true, IPhonePlayer: true },
      });
    } else {
      popupList = await sequelizeObjects.Popups.findAll({
        where: { isVisible: true },
      });
    }
    return {popupList};
  } catch (error) {
    logger.log(error);
  }
}
async function displayPopup(PlayerID) {
  try {
    // Fetch user and initial counters
    const existingUser = await sequelizeObjects.User.findByPk(PlayerID);
    let lastIndex = existingUser.lastDisplayedPopupIndex || 0;
    let counter = existingUser.PopupCount || 0;

    // Fetch all uncollected popup displays with their popup details
    if (counter <= 0) {
      await sequelizeObjects.User.update({ PopupCount: 5 }, { where: { id: PlayerID } });
      return;
    }
    const popupDisplay = await sequelizeObjects.PopupDisplay.findAll({
      where: {
        userId: PlayerID,
        isCollected: false,
        dontAccountcollected: false,
      },
      include: [
        {
          model: sequelizeObjects.Popups,
          attributes: ["name", "Priorty"],
        },
      ],
      order: [
        ["popup", "Priorty", "ASC"],
        ["updatedAt", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    if (!popupDisplay.length) {
      logger.log("No uncollected popups available to display.");
      return;
    }

    let nextPopup = popupDisplay[lastIndex];

    // If index is out of range, reset and adjust for special conditions
    if (!nextPopup) {
      lastIndex = 0;
      nextPopup = popupDisplay[0];
      if (existingUser.number && nextPopup.popup.name === "verifynumber") {
        lastIndex = 1;
        nextPopup = popupDisplay[1];
      }
    } else {
      // Skip specific popups based on user data
      if (existingUser.number && nextPopup.popup.name === "verifynumber") {
        lastIndex++;
        nextPopup = popupDisplay[lastIndex];
      }
      if (existingUser.email && nextPopup.popup.name === "verifygoogle") {
        lastIndex++;
        nextPopup = popupDisplay[lastIndex];
      }
      if (existingUser.facebookid && nextPopup.popup.name === "verifyFacebook") {
        lastIndex++;
        nextPopup = popupDisplay[lastIndex];
      }
    }
    // Increment and wrap-around the index
    lastIndex = (lastIndex + 1) % popupDisplay.length;
    counter--;

    // Consolidate user updates into a single call
    await sequelizeObjects.User.update(
      { lastDisplayedPopupIndex: lastIndex, PopupCount: counter },
      { where: { id: PlayerID } }
    );
    logger.log(`data: {
        popupId:${ nextPopup.popupId},
        name: ${nextPopup.popup.name},
        isCollected: ${nextPopup.isCollected},
        DontHaveAccountstatus: ${nextPopup.dontAccountcollected},
        counter: ${counter},
      }`)
    return {
      key: "DisplayPopup",
      data: {
        popupId: nextPopup.popupId,
        name: nextPopup.popup.name,
        isCollected: nextPopup.isCollected,
        DontHaveAccountstatus: nextPopup.dontAccountcollected,
        counter: counter,
      },
    };
  } catch (error) {
    logger.log(error);
  }
}



async function collectPopup(popupId,userId,dataType,players) {

      try {
        const popupDisplay = await sequelizeObjects.PopupDisplay.findOne({
          where: {
            popupId: popupId,
            userId: userId,
            isCollected: false,
          },
        });

        if (popupDisplay) {
          popupDisplay.isCollected = true;
          let user = await sequelizeObjects.User.findByPk(userId);
          let popup = await sequelizeObjects.Popups.findByPk(popupId);
          let Reward = 0;
          user.lastDisplayedPopupIndex = 0;
          Reward = parseInt(user.money) + parseInt(popup.Rewards);
          players.playersAllMoney = Reward;
          await popupDisplay.save();
          await user.update({ money: Reward });
          if (
            dataType === "insta" ||
            dataType === "facebook" ||
            dataType === "rateUs" ||
            dataType === "twitter"
          ) {
            dbUtils
              .UpadteUserData(sequelizeObjects, userId, dataType, 2)
              .then((result) => {
                if (players.connection !== null) {
                  responseArray.key = "LinkResponseData";
                  responseArray.data = JSON.stringify(result);
                  players.connection.sendText(
                    JSON.stringify(responseArray)
                  );
                  cleanResponseArray();
                }
              })
              .catch(() => {});
          }
          return {
            key: "CollectPopup",
            data: {
              popupId: popupId,
              name: popup.name,
              isCollected: popupDisplay.isCollected,
            },
          };
        }
      } catch (error) {
        logger.log(error);
      }
    }
  

async function dontAcoountPopup(popupId, userId,players) {
  try {
        const popupDisplay = await sequelizeObjects.PopupDisplay.findOne({
          where: {
            popupId: popupId,
            userId: userId,
            isCollected: false,
            dontAccountcollected: false,
          },
        });

        if (popupDisplay) {
          popupDisplay.dontAccountcollected = true;
          let user = await sequelizeObjects.User.findOne({
            where: { id: userId },
          });
          let popup = await sequelizeObjects.Popups.findOne({
            where: { id: popupId },
          });
          user.lastDisplayedPopupIndex = 0;

          user.money = parseInt(user.money) + parseInt(popup.DontReward);
          players.playersAllMoney = user.money;
          await popupDisplay.save();
          await user.save();
          return {
            key: "DontAccountPopup",
            data: {
              popupId: popupId,
              name: popup.name,
              DontHaveAccountstatus: popupDisplay.dontAccountcollected,
            },
          };
        }
      } catch (error) {
        logger.log(error);
      }
    
}

async function popupInfo(popupId, userId) {
  try {
    
        const popupDisplay = await sequelizeObjects.PopupDisplay.findOne({
          where: {
            popupId: popupId,
            userId: userId,
            isCollected: false,
          },
          include: [{ model: sequelizeObjects.Popups, attributes: ["name"] }],
          order: [["createdAt", "ASC"]],
        });

        if (popupDisplay) {
          return{
            key: "staticPopup",
            data: {
              popupId: popupDisplay.popupId,
              name: popupDisplay.popup.name,
              isCollected: popupDisplay.isCollected,
              DontHaveAccountstatus: popupDisplay.dontAccountcollected,
            }
        }
      }
      } catch (error) {
        logger.log(error);
      }
    }
async function assignPopups(PlayerID,platform){
  try{
      


    // Build filter for visible popups based on platform
    const popupFilter = { isVisible: true };
    if (platform === "Android") popupFilter.Android = true;
    if (platform === "IPhonePlayer") popupFilter.IPhonePlayer = true;

    // Parallel fetching: visible popups and existing PopupDisplay records for visible popups
    const [visiblePopups, existingPopupDisplays] = await Promise.all([
      sequelizeObjects.Popups.findAll({
        where: popupFilter,
        attributes: ["id", "name", "Priorty"],
        order: [["Priorty", "ASC"]],
      }),
      sequelizeObjects.PopupDisplay.findAll({
        where: { userId: PlayerID },
        attributes: ["popupId"],
      }),
    ]);

    const visiblePopupIds = visiblePopups.map(p => p.id);
    // Filter only those PopupDisplay records that match visible popups
    const existingPopupIds = new Set(
      existingPopupDisplays
        .filter(pd => visiblePopupIds.includes(pd.popupId))
        .map(pd => pd.popupId)
    );

    // Create missing PopupDisplay entries concurrently
    const creationPromises = visiblePopups
      .filter(p => !existingPopupIds.has(p.id))
      .map(p =>
        sequelizeObjects.PopupDisplay.create({
          popupId: p.id,
          userId: PlayerID,
          isCollected: false,
          dontAccountcollected: false,
        })
      );
    let newPopupsAdded = false;
    if (creationPromises.length) {
      await Promise.all(creationPromises);
      newPopupsAdded = true;
    }

    // Concurrently fetch invisible and platform-ineligible popups
    const invisiblePromise = sequelizeObjects.Popups.findAll({
      where: { isVisible: false },
      attributes: ["id"],
    });
    const platformIneligiblePromise =
      (platform === "Android" || platform === "IPhonePlayer")
        ? sequelizeObjects.Popups.findAll({
            where: Object.assign(
              { isVisible: true },
              platform === "Android"
                ? { Android: { [Op.not]: true } }
                : { IPhonePlayer: { [Op.not]: true } }
            ),
            attributes: ["id"],
          })
        : Promise.resolve([]);
    const [invisiblePopups, platformIneligiblePopups] = await Promise.all([
      invisiblePromise,
      platformIneligiblePromise,
    ]);

    // Combine the IDs to remove from PopupDisplay
    const combinedIds = [
      ...new Set([
        ...invisiblePopups.map(p => p.id),
        ...platformIneligiblePopups.map(p => p.id),
      ]),
    ];
    if (combinedIds.length > 0) {
      await sequelizeObjects.PopupDisplay.destroy({
        where: { userId: PlayerID, popupId: combinedIds },
      });
    }

  }catch(error){
    logger.log(error);
  }
}
async function displaylistPopup(PlayerID) {
  try {
    const existingUser = await sequelizeObjects.User.findByPk(PlayerID);
    let lastIndex = existingUser.lastDisplayedPopupIndex || 0;
    let counter = existingUser.PopupCount || 0;
    if (counter <= 0) {
      await sequelizeObjects.User.update(
        { PopupCount: 5 },
        { where: { id: PlayerID } }
      );
      return;
    }
    const popupDisplays = await sequelizeObjects.PopupDisplay.findAll({
      where: {
        userId: PlayerID,
        isCollected: false,
        dontAccountcollected: false,
      },
      include: [
        {
          model: sequelizeObjects.Popups,
          attributes: ["name", "Priorty"],
        },
      ],
      order: [
        ["popup", "Priorty", "ASC"],
        ["updatedAt", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    if (!popupDisplays.length) {
      logger.log("No uncollected popups available to display.");
      return;
    }

    const popupsToDisplay = [];
    let displayedCount = 0;
    const totalPopups = popupDisplays.length;

    let cycleCount = 0;
    while (displayedCount < counter && cycleCount < totalPopups) {
      if (lastIndex >= totalPopups) {
        lastIndex = 0;
      }
      const currentPopup = popupDisplays[lastIndex];

      let skip = false;
      if (existingUser.number && currentPopup.popup.name === "verifynumber") {
        skip = true;
      }
      if (existingUser.email && currentPopup.popup.name === "verifygoogle") {
        skip = true;
      }
      if (existingUser.facebookid && currentPopup.popup.name === "verifyFacebook") {
        skip = true;
      }
      lastIndex = (lastIndex + 1) % totalPopups;
      cycleCount++;
      if (skip) {
        continue;
      }

      popupsToDisplay.push({
        popupId: currentPopup.popupId,
        name: currentPopup.popup.name,
        isCollected: currentPopup.isCollected,
        DontHaveAccountstatus: currentPopup.dontAccountcollected,
      });
      displayedCount++;
    }
    await sequelizeObjects.User.update(
      { lastDisplayedPopupIndex: lastIndex, PopupCount: 5 },
      { where: { id: PlayerID } }
    );

    logger.log(`Displaying ${popupsToDisplay.length} popups for PlayerID ${PlayerID}`);
    return {
      key: "displaylistPopup",
      data: popupsToDisplay,
    };
  } catch (error) {
    logger.log(error);
  }
}

module.exports = {
  collectPopup,
  dontAcoountPopup,
  displaylistPopup,
  popupInfo,
  displayPopup,
  assignPopups,
  getPopuplist
};