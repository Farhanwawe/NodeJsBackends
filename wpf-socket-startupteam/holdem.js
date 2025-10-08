"use strict";
// Imports
const dotEnv = require("dotenv");
dotEnv.config();
const { Op } = require("sequelize");
const webSocket = require("nodejs-websocket");
const initDb = require("./src/database/pgUtils");
const config = require("./config");
const utils = require("./src/app/utils");
const logger = require("./src/app/logger");
const leaderboard = require("./src/app/leaderBoard");
const osUtils = require("os-utils"); 
const events = require("events");
let statusCheckInterval = null;  
const serverUtils = require("./src/utils");
const autoPlay = require("./src/app/autoPlay");
const dbUtils = require("./src/database/dbUtils");
const bonus = require("./src/app/dailyReward");
const faceTimeManager = require("./src/app/FaceTimeManager");
const dailychallenges = require("./src/app/challenges");
const popups = require("./src/app/displaypopup.js");
const slotMachine = require("./src/app/SlotMachine");
const Events = require("./src/app/eventManager");
const NotificationService = require("./src/services/notificationService");
const TICK_INTERVAL_MS = 5000;
const room = require("./src/app/room"); // Empty object of room
const player = require("./src/app/player"); // Empty object of player
const fs = require("fs");
const path = require("path");
const baseURL =
  "https://wawe-poker-api-handeling-fabddf98b575.herokuapp.com/Assets/ProfileImages/";
const imagesFolder = path.join(__dirname, "Assets/ProfileImages");
let pong = null;
let server = null; // webSocket.createServer is created here
let sequelizeObjects = null; // Server can host games without database
let notificationService = null; // Notification service instance
let rooms = []; // All rooms are stored here
let players = []; // All players are stored here
let CONNECTION_ID = 0;
let responseArray = { key: "", code: 200, data: [] };
let stDin = process.openStdin(); 
let eventEmitter = new events.EventEmitter();
let typeOfAmountValues;
let allGifts;
let lastDisconnectTimeoutId = {};
const userSession = require('./src/models/userSession'); 
let admin = require('firebase-admin');
const serviceAccount = require('./Assets/FirebaseAsset/wawepokerface-5f284-firebase-adminsdk-mttxg-fc81034905.json');
admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });




// Graceful shutdown handling
process.on('SIGINT', () => {
  logger.log('🛑 Server shutting down gracefully...');
  if (notificationService) {
    notificationService.cleanup();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.log('🛑 Server shutting down gracefully...');
  if (notificationService) {
    notificationService.cleanup();
  }
  process.exit(0);
});

// ---------------------------------------------------
/* Migration function */
async function runMigrations() {
  try {
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      const migration = spawn('node', ['migration.js', 'run'], {
        stdio: 'inherit',
        shell: true
      });
      
      migration.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Migration failed with code ${code}`));
        }
      });
      
      migration.on('error', (err) => {
        reject(err);
      });
    });
  } catch (err) {
    logger.log("Migration error: " + err);
    throw err;
  }
}

// ---------------------------------------------------
/* Starting point */

initDb.initDatabase().then(() => {
  sequelizeObjects = require("./src/database/sequelize"); // This creates tables if not exists and returns table models

  // Run migrations automatically
  runMigrations().then(() => {
    logger.log("✅ Migrations completed successfully");
  }).catch((err) => {
    logger.log("❌ Migration error: " + err);
  });

  // Initialize notification service
  notificationService = new NotificationService(sequelizeObjects, admin, logger);

  // Set notification service in event manager
  Events.setNotificationService(notificationService);

  // Restore and process any pending notifications from database on boot
  notificationService.processNotifications().then(async () => {
    // Start engagement notification system
    await notificationService.startEngagementNotifications();
    // Start event notification monitoring
    notificationService.startEventNotificationMonitoring();
    // Start inactive user monitoring
    await notificationService.startInactiveUserMonitoring();
    // Start scheduled notification monitoring (database polling)
    notificationService.startScheduledNotificationMonitoring();
    startGames();
  }).catch(async (err) => {
    try { logger.log(`processNotifications startup error: ${err && err.message ? err.message : err}`); } catch (e) { }
    // Start engagement notification system even if processNotifications fails
    await notificationService.startEngagementNotifications();
    // Start event notification monitoring
    notificationService.startEventNotificationMonitoring();
    // Start inactive user monitoring
    await notificationService.startInactiveUserMonitoring();
    // Note: scheduled notification monitoring already started above
    startGames();
  });
});

function startGames() {
  try {
    dbUtils.BonusAmountsPromise(sequelizeObjects).then((values) => {
      typeOfAmountValues = values.result;
      //logger.log(typeOfAmountValues.InstaFollowAmount);
      //logger.log(typeOfAmountValues.FacebookFollowAmount);
      //logger.log(typeOfAmountValues.RateUsAmount);
      //logger.log(typeOfAmountValues.TwitterFollowAmount);
    });

    dbUtils.AllGiftsPromise(sequelizeObjects).then((values) => {
      allGifts = values.result;
    });
    initConsoleListener().then(() => {
      startWebSocket().then(() => {
        initServerStatusCheckInterval().then(() => {
          //logger.log("Games fully initialized", logger.LOG_CYAN);
          //dbUtils.AddFriendInfoPromise(sequelizeObjects,24,22);
        });
      });
    });
    //admin = require('firebase-admin');
    //const serviceAccount = require('./Assets/FirebaseAsset/wawepokerface-5f284-firebase-adminsdk-mttxg-fc81034905.json');

    

    //  });
  } catch (err) {
    logger.log(err);
  }
}
/**
 * Fetch all used connection IDs in one query.
 * @returns {Promise<Set<number>>} - A set of all currently used connection IDs.
 */
async function getUsedConnectionIds() {
  const users = await sequelizeObjects.User.findAll({
    attributes: ['conn']
  });
  // Log raw user objects if needed

  // Convert each connection ID to a number to ensure proper comparison
  return new Set(users.map(user => Number(user.conn)));
}

/**
 * Retrieves a unique connection ID that is not already in use and
 * ensures that 0 is never assigned.
 *
 * @param {number} initialId - The starting connection ID.
 * @returns {Promise<number>} - A promise that resolves to a unique connection ID.
 */
async function getUniqueConnectionId(initialId) {
  const usedIds = await getUsedConnectionIds();
  // Log the connection IDs for debugging (they'll be numbers now)

  let connectionId = initialId;
  // Ensure we skip 0 and any IDs that are already in use
  while (connectionId === 0 || usedIds.has(connectionId)) {
    connectionId++;
  }
  return connectionId;
}
// ---------------------------------------------------
function startWebSocket() {
  try {
    return new Promise(function (resolve, reject) {
      server = webSocket
        .createServer(serverUtils.GetCertOptions(), function (conn) {
          try {

            const urlParams = new URLSearchParams(conn.path.split("?")[1]); // Extract query params from the connection path
            const DBID = urlParams.get("DBID"); // Fetch the 'DBID' value from the query params
            const connID = urlParams.get("connId");
            const reconnect = urlParams.get("reconnect") || "False";
            const version = urlParams.get("version") || "1";
            //console.log("WebSocket connect with version:", version);
            console.log("in start websocket function now")
            if (reconnect === "True" && players[connID]) {
              //clearTimeout(lastDisconnectTimeoutId[connID]);
              //logger.log(`+${players[connID].connectionId}+${players[connID].socketKey}+${players[connID].disconnected}+${players[connID].lastDisconnectTimeoutId}`);
              //lastDisconnectTimeoutId[connID] = null;
              //logger.log("Reconnecting player: " + players[connID].playerId);
              players[connID].connection = conn;
              conn.connectionId = players[connID].connectionId;
              conn.key = players[connID].socketKey;
              //logger.log("Reconnected player: " + conn.key);

            }
            setupNewConnection(conn, DBID, connID, reconnect, version);
            setupConnectionEvents(conn);
            //setupTickInterval(/* reconnect === "True" && players[connID]?.connection ?players[connID].connection: */conn);
            /* setupPingPongInterval(conn); */
          } catch (connError) {
            logger.log("Error during connection setup: " + connError);
            conn.close(); // Close the connection if something goes wrong during setup
          }
        })
        .listen(config.server.PORT).on('error', (err) => {
          logger.log("Server error: " + err);
          reject(err);
        });
          
      resolve();
    });
  } catch (err) {
    logger.log("Error in startWebSocket: " + err);
  }
}
// Start web socketsfunction startWebSocket() {

async function setupNewConnection(conn, DBID, connID, reconnectFlag, version) {
  console.log("in setupNewConnection function now");

  try {
    conn.isAlive = true;
    logger.log(`DBID: ${DBID}, connID: ${connID}, reconnect: ${reconnectFlag},version: ${version}`);

    // Validate DBID parameter
    if (!DBID || DBID === 'null' || DBID === 'undefined') {
      logger.log(`Invalid DBID parameter: ${DBID}`);
      conn.close();
      return;
    }

    const parsedDBID = parseInt(DBID);
    if (isNaN(parsedDBID)) {
      logger.log(`DBID is not a valid number: ${DBID}`);
      conn.close();
      return;
    }

    let user = await sequelizeObjects.User.findOne({ where: { id: parsedDBID } });
    if (!user) {
      logger.log(`No user found with ID: ${DBID}`);
      return;
    }

    // RECONNECT FLOW
    if (reconnectFlag === "True" && parseInt(connID) !== 0) {
      if (players[connID]?.connection) {
        // Attach new socket temporarily for reconnection attempt
        players[connID].connection = conn;
        players[connID].version = version;
        console.log("Reconnect player with version:" + players[connID].version)
        conn.connectionId = players[connID].connectionId;
        conn.key = players[connID].socketKey;

        const reconnected = await onReconnect(connID, conn.key);
        if (reconnected) {
          return; // reconnection successful
        }
      }

      // Reconnection failed or player not found — reject reconnection
      logger.log(`Reconnection failed or session expired for connID: ${connID}`);
      conn.sendText(JSON.stringify({
        key: "ReconnectFailed",
        reason: "Session expired or invalid",
      }));
      conn.close();
      return;
    }

    // NEW CONNECTION FLOW
    if (players[connID]?.connection) {
      logger.log(`Connection ID ${connID} already exists. Deleting stale instance.`);
      delete players[connID];
    }

    const uniqueConnectionId = await getUniqueConnectionId(CONNECTION_ID);
    await user.update({ conn: uniqueConnectionId });
    conn.connectionId = uniqueConnectionId;
    CONNECTION_ID = uniqueConnectionId + 1;

    conn.playerDatabaseId = DBID;
    conn.selectedRoomId = -1;

    const playerInstance = new player.Player(conn, conn.key, conn.connectionId, 10000, false);
    playerInstance.version = version;
    players[conn.connectionId] = playerInstance;

    console.log("new player instance connected with version:" + players[conn.connectionId].version)

    playerInstance.connection.sendText(JSON.stringify({
      key: "connectionId",
      socketKey: conn.key,
      connectionId: conn.connectionId,
      DBID: DBID,
      //might need to add version here later
    }));

    GiftsDetails(conn.connectionId);
    Events.scheduleEvents(); // DISABLED - No events will be scheduled

    logger.log("♣ New connection with connectionId " + conn.connectionId);

    // Invalidate old sessions
    await sequelizeObjects.UserSession.update(
      {
        status: "force_expired",
        session_end: new Date(),
      },
      {
        where: {
          userId: DBID,
          status: "active",
          connectionId: { [Op.ne]: conn.connectionId },
        },
      }
    );

    // Create new session
    const newSession = await sequelizeObjects.UserSession.create({
      userId: DBID,
      connectionId: conn.connectionId,
      socketKey: conn.key,
      session_start: new Date(),
      status: "active",
    });

    playerInstance.sessionId = newSession.id;
    playerInstance.sessionStartTime = Date.now();

  } catch (err) {
    logger.log("Error in setupNewConnection: " + err);
    throw err;
  }
}


  function setupTickInterval(conn) {
    conn.tickInterval = setInterval(() => {
      // Ensure the connection is still alive and open before sending tick updates
      if (conn.isAlive && conn.readyState === conn.OPEN) {
        const tickData = {
          key: "tick",
          timestamp: Date.now(),
          connectionId: conn.connectionId,
        };
        conn.sendText(JSON.stringify(tickData));
      }
    }, TICK_INTERVAL_MS);
  }

  function setupConnectionEvents(conn) {
    try {
      conn.isAlive = true;
  
      const resetPingTimeout = () => {
        if (conn.pingTimeout) clearTimeout(conn.pingTimeout);
  
        conn.pingTimeout = setTimeout(() => {
          logger.log(`Client ${conn.connectionId} missed ping timeout. Treating as disconnected.`);
          handleClientDisconnected(conn);
  
          // Clear any previously scheduled forced disconnect
          if (lastDisconnectTimeoutId[conn.connectionId]) {
            clearTimeout(lastDisconnectTimeoutId[conn.connectionId]);
          }
  
          lastDisconnectTimeoutId[conn.connectionId] = setTimeout(() => {
            handleConnectionNormalClose(conn);
            logger.log(`Connection ID ${conn.connectionId} has been forcefully closed after delay.`);
          }, 43000); // 43s delay after missed ping
  
        }, 7000); // 7s ping grace window
      };
  
      resetPingTimeout();
  
      conn.on("text", (inputStr) => {
        try {
          if (!inputStr || conn.readyState !== conn.OPEN) return;
  
          let message;
          try {
            message = JSON.parse(inputStr);
          } catch {
            logger.log("Received malformed message, ignoring.");
            return;
          }
  
          if (message.key === "ping") {
            const { pingId, clientSentTime } = message;
            conn.isAlive = true;
  
            // Reply with pong
            conn.sendText(JSON.stringify({
              key: "pong_check",
              pingId,
              clientSentTime
            }));
  
            resetPingTimeout();
  
            // Cancel any pending forced disconnects due to earlier drop
            if (lastDisconnectTimeoutId[conn.connectionId]) {
              clearTimeout(lastDisconnectTimeoutId[conn.connectionId]);
              lastDisconnectTimeoutId[conn.connectionId] = null;
            }
  
          } else if (message.key === "logout") {
            conn.close();
          } else {
            messageHandler(message);
          }
  
        } catch (err) {
          logger.log("Error processing incoming message: " + err);
        }
      });
  
      conn.on("close", (code, reason) => {
        try {
          clearTimeout(conn.pingTimeout);
  
          const delay = 35000;
  
          if (code === 1006) {
            logger.log(`Abnormal closure detected for Connection ID ${conn.connectionId}. Initiating delayed graceful shutdown.`);
          }
  
          if (lastDisconnectTimeoutId[conn.connectionId]) {
            clearTimeout(lastDisconnectTimeoutId[conn.connectionId]);
          }
  
          lastDisconnectTimeoutId[conn.connectionId] = setTimeout(() => {
            handleConnectionNormalClose(conn);
            logger.log(`Connection ID ${conn.connectionId} has been gracefully closed after delay.`);
          }, delay);
  
        } catch (err) {
          logger.log("Error handling connection close: " + err);
        }
      });
  
      conn.on("error", (errObj) => {
        logger.log("Connection error: " + errObj);
      });
  
    } catch (err) {
      logger.log("Error in setupConnectionEvents: " + err);
    }
  }
  
  
  
  async function handleConnectionNormalClose(conn) {
    try {
      if (!conn || !conn.connectionId || !players[conn.connectionId]) {
        logger.log(`Invalid or missing connectionId during cleanup: ${conn ? conn.connectionId : 'undefined'}`);
        return;
      }
      const player = players[conn.connectionId];
      clearInterval(conn.pingInterval);
      clearInterval(conn.tickInterval);
      clearTimeout(lastDisconnectTimeoutId[conn.connectionId]);
      lastDisconnectTimeoutId[conn.connectionId] = null;
      
      const sessionEndTime = Date.now();
      const inGameTime = sessionEndTime - (player.sessionStartTime || sessionEndTime);
      const inGameTimeFormatted = formatDuration(inGameTime);
      
      logger.log(
        `Player Database Id ${player.playerDatabaseId} Connection Id ${conn.connectionId} - In-game time: ${inGameTimeFormatted}`,
        logger.LOG_RED
      );
      
      const dbSession = await sequelizeObjects.UserSession.findOne({
        where: {
          userId: player.playerDatabaseId,
          connectionId: conn.connectionId,
          status: {
            [Op.or]: ["active", "disconnected"],
          },
        },
        order: [["createdAt", "DESC"]],
      });
      
    console.log("Before expiring the session" + JSON.stringify(dbSession.toJSON()));
        dbSession.status = "expired";
        dbSession.session_end = Date.now();
        await dbSession.save();
    console.log("After expiring the session" + JSON.stringify(dbSession.toJSON()));

      
      // Log player session data
      playerGameLogs(
        conn.connectionId,
        conn.key,
        player.playerDatabaseId,
        inGameTime,
        inGameTimeFormatted,
        player.sessionStartTime,
        sessionEndTime
      );
      if (player.selectedRoomId !== -1) {
        let selectedRoomId = player.selectedRoomId;
        if (player.totalBet > 0) {
          rooms[selectedRoomId].totalPot += player.totalBet;
        }
         rooms[selectedRoomId].sendStatusUpdate();
        onPlayerLeaveRoom(conn.connectionId, conn.key, selectedRoomId);
      }
  
      // Update User's PopupCount
      let user = await sequelizeObjects.User.findOne({
        where: { id: player.playerDatabaseId },
      });
      if (user) {
        await user.update({ PopupCount: 5 });
      }
  
      logger.log(`Tick updates stopped for connection ID: ${conn.connectionId}`);
  
      //dict[player.playerDatabaseId] = null;
      logger.log(
        `Database Id ${player.playerDatabaseId} Connection Id ${dict[player.playerDatabaseId]}`,
        logger.LOG_RED
      );
  
      // Cleanup intervals and timers
      playerConnectionSetNull(conn.connectionId);
      
      // Final cleanup
      delete players[conn.connectionId];
      logger.log(`Player instance with connectionId ${conn.connectionId} successfully removed.`);
    } catch (err) {
      logger.log(`Error in handleConnectionNormalClose: ${err.message}`);
    } finally {
      // Guarantee cleanup, even if something failed
      if (conn && conn.connectionId && players[conn.connectionId]) {
        clearInterval(conn.pingInterval);
        clearInterval(conn.tickInterval);
        clearTimeout(conn.lastDisconnectTime);
        delete players[conn.connectionId];
        logger.log(`Final cleanup executed for connectionId: ${conn.connectionId}`);
      }
    }
  }

  async function handleClientDisconnected(conn) {
    try {
      console.log("In handleClientDisconnected function now");
  
      const player = players[conn.connectionId];
      if (!player) {
        console.log(`No player found for connectionId: ${conn.connectionId}`);
        return;
      }
  
      const dbSession = await sequelizeObjects.UserSession.findOne({
        where: {
          userId: player.playerDatabaseId,
          connectionId: conn.connectionId,
          status: "active",
        },
        order: [["createdAt", "DESC"]],
      });
  
      if (!dbSession) {
        console.log(`No active session found for userId: ${player.playerDatabaseId}, connectionId: ${conn.connectionId}`);
        return;
      }
  
      console.log("Before marking the session as disconnected: " + JSON.stringify(dbSession.toJSON()));
  
      dbSession.status = "disconnected";
      dbSession.session_end = Date.now();
      await dbSession.save();
  
      console.log("After marking the session as disconnected: " + JSON.stringify(dbSession.toJSON()));
      
    } catch (err) {
      console.error("Error in handleClientDisconnected:", err);
    }
  }
  

  async function onReconnect(connectionId, socketKey) {
    console.log("in onReconnect function now");
  
    try {
      const player = players[connectionId];
      if (!player || !player.connection) {
        throw new Error(`Invalid connectionId: ${connectionId}`);
      }
  
      const pSelectedRoomId = player.selectedRoomId;
  
      const dbSession = await sequelizeObjects.UserSession.findOne({
        where: {
          userId: player.playerDatabaseId,
          connectionId: connectionId,
          status: "disconnected",
        },
        order: [["createdAt", "DESC"]],
      });
  
      if (!dbSession) {
        logger.log(`No disconnected session found for player ${connectionId}, resuming the session`);
        
        player.disconnected = false;
        clearTimeout(lastDisconnectTimeoutId[connectionId]);
        lastDisconnectTimeoutId[connectionId] = null;
      
        if (pSelectedRoomId !== -1 && rooms[pSelectedRoomId]) {
          rooms[pSelectedRoomId].playerFold(sequelizeObjects, connectionId, socketKey, true);
          rooms[pSelectedRoomId].sendStatusUpdate();
      
          const currentStage = await rooms[pSelectedRoomId].currentPosition();
          if (currentStage) {
            player.connection.sendText(
              JSON.stringify({
                key: "CurrentStage",
                data: currentStage,
              })
            );
          }
        }
      
        player.connection.sendText(
          JSON.stringify({
            key: "Reconnected",
            socketKey: socketKey,
            data: connectionId,
          })
        );
      
        cleanResponseArray();
        return true;
      }
      
      console.log("Session found during reconnection:", dbSession.toJSON());
  
      const sessionEndTime = new Date(dbSession.session_end).getTime();
      const now = Date.now();
  
      if (isNaN(sessionEndTime)) {
        logger.error(`Invalid session_end timestamp: ${dbSession.session_end}`);
        return false;
      }
  
      const elapsed = now - sessionEndTime;
      console.log(`UTC now: ${new Date(now).toISOString()}, session_end: ${dbSession.session_end}, elapsed ms: ${elapsed}`);
  
      if (elapsed <= 30_000) {
        clearTimeout(lastDisconnectTimeoutId[connectionId]);
        lastDisconnectTimeoutId[connectionId] = null;
        logger.log(`Cleared disconnect timeout for connection ID ${connectionId}`);
  
        player.disconnected = false;
  
        clearInterval(player.connection.tickInterval);
        clearInterval(player.connection.pingInterval);
  
        logger.log(`Reconnecting player ${connectionId} within timeout`);
  
        dbSession.status = "active";
        dbSession.session_end = null;
        await dbSession.save();
  
        logger.log(`Player ${connectionId} successfully reconnected.`);
      } else {
        clearTimeout(lastDisconnectTimeoutId[connectionId]);
        lastDisconnectTimeoutId[connectionId] = null;
        logger.log(`Reconnection timeout expired for player ${connectionId}`);
  
        player.disconnected = false;
  
        clearInterval(player.connection.tickInterval);
        clearInterval(player.connection.pingInterval);
  
        dbSession.status = "expired";
        dbSession.session_end = new Date();
        await dbSession.save();
  
        const newSession = await sequelizeObjects.UserSession.create({
          userId: player.playerDatabaseId,
          connectionId: connectionId,
          socketKey: socketKey,
          session_start: new Date(),
          status: "active",
        });
  
        logger.log(`New session created for player ${connectionId}: ${newSession.id}`);
        player.sessionId = newSession.id;
        player.sessionStartTime = Date.now();
      }
  
      // Room logic
      if (pSelectedRoomId !== -1 && rooms[pSelectedRoomId]) {
        rooms[pSelectedRoomId].playerFold(sequelizeObjects, connectionId, socketKey, true);
        rooms[pSelectedRoomId].sendStatusUpdate();
  
        const currentStage = await rooms[pSelectedRoomId].currentPosition();
        if (currentStage) {
          player.connection.sendText(
            JSON.stringify({
              key: "CurrentStage",
              data: currentStage,
            })
          );
        }
      }
  
      // Final reconnection success
      player.connection.sendText(
        JSON.stringify({
          key: "Reconnected",
          socketKey: socketKey,
          data: connectionId,
        })
      );
  
      cleanResponseArray();
      return true;
  
    } catch (err) {
      logger.error("Error in onReconnect:", err);
      return false;
    }
  }
  

function formatDuration(durationInMilliseconds) {
  try {
    const totalSeconds = Math.floor(durationInMilliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let formattedDuration = "";
    if (hours > 0) {
      formattedDuration += `${hours}h `;
    }
    if (minutes > 0 || hours > 0) {
      formattedDuration += `${minutes}m `;
    }
    formattedDuration += `${seconds}s`;

    return formattedDuration;
  } catch (err) {
    logger.log("Error in formatDuration: " + err);
  }
}

function playerGameLogs(
  connectionId,
  socketKey,
  playerDatabaseId,
  inGameTime,
  inGameTimeFormatted,
  sessionStartTime,
  sessionEndTime
) {
      try {
        dbUtils.handleUserLogpromise(
          sequelizeObjects,
          playerDatabaseId,
          inGameTime,
          inGameTimeFormatted,
          sessionStartTime,
          sessionEndTime
        );
      } catch (err) {
        logger.log("Error in playerGameLogs: " + err);
      }
}

  function GiftsDetails(connectionId) {
    try {
      if (!players[connectionId]) {
        throw new Error(`Player not found for connectionId: ${connectionId}`);
      }
      if (!players[connectionId].connection) {
        throw new Error(`Player's connection is missing for connectionId: ${connectionId}`);
      }
  
      dbUtils.GetAllGiftsPromise(sequelizeObjects).then((result) => {
        // Sending the data to the player's connection
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "AllGiftDeatils",
            data: result,
          })
        );
        cleanResponseArray();
      }).catch(dbError => {
        // Handle potential errors from the database call
        logger.log("Database Error in GiftsDetails: " + dbError);
      });
    } catch (err) {
      
      logger.log("Error in GiftsDetails: " + err.message);
    }
  }
  

// Input command message handler
async function messageHandler(input) {
 try {
  const connID = input?.connectionId;
  const version = players[input.connectionId]?.version || "1";
  if (
    !connID ||
    !players[connID] ||
    !players[connID].connection
  ) {
    // Use try-catch inside logging if you're ultra-safe, but normally this is enough:
    try {
      logger.log("input: " + JSON.stringify(input));
    } catch (logErr) {
      logger.log("input: [unserializable input]");
    }

    if (!players[connID]) {
      logger.log(`players[${connID}]: undefined or null`);
    } else {
      try {
        logger.log(`players[${connID}]: ` + JSON.stringify(players[connID]));
        logger.log(`players[${connID}].connection: ` + JSON.stringify(players[connID].connection));
      } catch (logErr) {
        logger.log(`players[${connID}]: [log failed due to circular reference or bad data]`);
      }
    }

    throw new Error(`Invalid connectionId: ${connID}`);
  }
    try {
      //logger.log("Key "+input.key+"   Connection ID "+input.connectionId);
      if (input.key === null || input.key === "") return;
      //logger.log("Key " + input.key + "   Connection ID " + input.connectionId);
      switch (input.key) {
            case "disconnect":
      logger.log("Disconnect from message handler...");
      
      const existingPlayer = players[input.connectionId].connection;
        const dbSession = await sequelizeObjects.UserSession.findOne({
          where: {
            userId: existingPlayer.playerDatabaseId,
            connectionId: input.connectionId,
            status: "active",
          },
          order: [["createdAt", "DESC"]],
        });
        //console.log("session found during reconnection" + session)
          console.log("Before closing the session" + JSON.stringify(dbSession.toJSON()));

        if (existingPlayer && dbSession) {
            //clearInterval(existingPlayer.connection.tickInterval);
           // clearInterval(existingPlayer.connection.pingInterval);
           dbSession.status = "expired";
           dbSession.session_end = Date.now();
              await dbSession.save();
            console.log("After closing the session" + JSON.stringify(dbSession.toJSON()));
            }
      players[input.connectionId].connection = null;
      break;
    case "Reconnect":
        if (version === "2") {
          //new version event here
          console.log("This version is not available yet")
        } else {
          onReconnect(input.connectionId, input.socketKey, input.LastSocketKey);
        }
        break;
    case "selectRoomUnity":
      JoinOrcreateRoom(input.connectionId, input.socketKey, input.roomId);
      break;
    case "SelectAllinorFold":
      JoinOrcreateAllInFoldRoom(input.connectionId, input.socketKey, input.PlayerID);
      break;
    case "selectQuickPlay":
      JoinOrcreateQuickplayRoom(input.connectionId, input.socketKey, input.PlayerID);
      break;
    case "getRoomParams":
      getRoomParameters(input.connectionId, input.socketKey, input.roomId);
      break;
    case "setFold":
      if (isValidInput(input, true)) {
        rooms[input.roomId].playerFold(sequelizeObjects, input.connectionId, input.socketKey, true);
        rooms[input.roomId].sendStatusUpdate();
        //logger.log("Folded player: " + players[input.connectionId].playerName);
        const response = await rooms[input.roomId].challenge(players[input.connectionId].playerDatabaseId, "Fold Hands");
        //logger.log(JSON.stringify(response));
        if (response) {
          players[input.connectionId].connection.sendText(JSON.stringify({ key: "challengeStatus", data: response }));
        }
      }
      break;
    case "setCheck":
      if (isValidInput(input, true)) {
        rooms[input.roomId].playerCheck(input.connectionId, input.socketKey);
        rooms[input.roomId].sendStatusUpdate();
      }
      break;
    case "setRaise":
      if (isValidInput(input, true)) {
        rooms[input.roomId].playerRaise(input.connectionId, input.socketKey, input.amount);
        rooms[input.roomId].sendStatusUpdate();
        const response = await rooms[input.roomId].challenge(players[input.connectionId].playerDatabaseId, "Raise Bets");
        //logger.log(JSON.stringify(response));
        if (response) {
          players[input.connectionId].connection.sendText(JSON.stringify({ key: "challengeStatus", data: response }));
        }
      }
      break;
      case "loggedInUserParamsUnity":
        setLoggedInUserParametersUNITY(input.connectionId, input.socketKey, input.userid, input.udid, input.platform);
        break;
      case "serverCommand":
        serverCommand(input.connectionId, input.socketKey, input.lineOne, input.lineTwo, input.lineThree, input.password);
        break;
      case "getSelectedPlayerChartData":
        getSelectedPlayerChartData(input.connectionId, input.socketKey, input.playerId);
        break;
      case "myplayerinfo":
        getMyPlayerInfo(input.connectionId, input.socketKey, input.playerId);
        break;
      case "LeaveRoom":
        logger.log("leave room called");
        logger.log(input.connectionId + " " + input.socketKey + " " + input.roomId);
        onPlayerLeaveRoom(input.connectionId, input.socketKey, input.roomId);
        break;
      case "SpinWheelAmountAdd":
        onSpinWheelAmountAdd(input.connectionId, input.socketKey, input.amount);
        break;
      case "OpenProfile":
        onOpenProfile(input.connectionId, input.socketKey, input.otherPlayerConnectionID);
        break;
      case "AddFriendRequest":
        onAddFriend(input.connectionId, input.socketKey, input.otherPlayerConnectionID, input.roomId);
        break;
      case "AcceptFriendRequest":
        onAcceptFriendRequest(input.connectionId, input.socketKey, input.otherPlayerId, input.sourceType);
        break;
      case "DeclineFriendRequest":
        onDeclineFriendRequest(input.connectionId, input.socketKey, input.otherPlayerId, input.sourceType);
        break;
      case "RemoveFriend":
        onRemoveFriend(input.connectionId, input.socketKey, input.otherPlayerDatabaseId);
        break;
      case "GetFriendList":
        OnGetFriend(input.connectionId, input.socketKey);
        break;
      case "CreateCustomRoomUnity":
        //logger.log(JSON.stringify(input.roomType));
        CreatePrivateRoom(input.connectionId, input.socketKey, input.RoomType);
        break;
      case "JoinRoom":
        console.log("join room called")
        OnPlayerJoinRoom(input.connectionId, input.socketKey, input.TableId);
        break;
      case "OnlineStatus":
        try {
          const targetUserId = input.userid;
          const requesterConnection = players[input.connectionId];
      
          if (!requesterConnection || !requesterConnection.connection) {
            console.warn(`[OnlineStatus] Invalid requester connectionId: ${input.connectionId}`);
            break;
          }
      
          console.log(`[OnlineStatus] Checking status for userId: ${targetUserId}`);
      
          const user = await sequelizeObjects.User.findOne({
            where: { id: targetUserId },
          });
      
          if (!user) {
            console.warn(`[OnlineStatus] User not found in DB: ${targetUserId}`);
            break;
          }
      
          let otherPlayerRoomId = -1;
          let holdemType = -1;
          let tableType = "Private";
          let online = false;
          let lastActiveTime = null;
      
          const activeSession = await sequelizeObjects.UserSession.findOne({
            where: {
              userId: targetUserId,
              status: "active",
            },
            order: [["createdAt", "DESC"]],
          });
      
          if (activeSession) {
            console.log(`[OnlineStatus] Found active session for userId ${targetUserId}:`, activeSession.dataValues);
      
            const activeConnId = activeSession.connectionId;
            const player = players[activeConnId];
      
            if (player) {
              online = true;
              console.log(`[OnlineStatus] Player ${targetUserId} is online with connId: ${activeConnId}`);
      
              if (player.selectedRoomId !== -1 && rooms[player.selectedRoomId]) {
                otherPlayerRoomId = player.selectedRoomId;
                const room = rooms[otherPlayerRoomId];
                holdemType = room.holdemType || -1;
                tableType = room.tableType || "Private";
      
                console.log(`[OnlineStatus] Player ${targetUserId} is at table ${otherPlayerRoomId} (${tableType}, ${holdemType})`);
              } else {
                console.log(`[OnlineStatus] Player ${targetUserId} is online but not at a table.`);
              }
            } else {
              console.warn(`[OnlineStatus] Active session connectionId ${activeConnId} not found in memory.`);
            }
          } else {
            console.log(`[OnlineStatus] No active session found for userId ${targetUserId}`);
      
            const lastSession = await sequelizeObjects.UserSession.findOne({
              where: { userId: targetUserId },
              order: [["session_end", "DESC"]],
            });
      
            if (lastSession && lastSession.session_end) {
              const diff = Math.abs(new Date() - new Date(lastSession.session_end));
              const minutes = Math.floor(diff / (1000 * 60));
              const hours = Math.floor(minutes / 60);
              const days = Math.floor(hours / 24);
      
              if (days > 0) lastActiveTime = `${days} day${days > 1 ? "s" : ""} ago`;
              else if (hours > 0) lastActiveTime = `${hours} hour${hours > 1 ? "s" : ""} ago`;
              else lastActiveTime = `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
      
              console.log(`[OnlineStatus] Last seen for userId ${targetUserId}: ${lastActiveTime}`);
            } else {
              lastActiveTime = "Unknown";
              console.log(`[OnlineStatus] No last session_end found for userId ${targetUserId}`);
            }
          }
      
          const payload = {
            key: "OnlineStatus",
            user: targetUserId,
            online,
            table: otherPlayerRoomId,
            tableType,
            profileImageLink: user.profileImageLink,
            ProfileImageIndex: user.ProfileImageIndex,
            holdemType,
            ...(online ? {} : { lastActive: lastActiveTime }),
          };
      
          console.log(`[OnlineStatus] Sending response to connId ${input.connectionId}:`, payload);
      
          requesterConnection.connection.sendText(JSON.stringify(payload));
        } catch (err) {
          console.error(`[OnlineStatus] Error processing status for userId ${input?.userid || "?"}:`, err);
        }
        break;
        case "SendMessageToOtherUser":
          OnSendMessageToOtherPlayer(input.connectionId, dict[input.OtherPlayerDBID], input.otherPlayerKey, input.data);
          break;
        case "ScheduleNotificationToUser":
          logger.log(
            `ScheduleNotificationToUser called: delayMs=${input.delayMs}, title=${input.title || ''}, body=${input.body || ''}, userId=${input.userId || 'n/a'}, notificationType=${input.notificationType || 'me'}`
          );
          if (notificationService) {
            notificationService.sendNotificationAfterDelay(input.delayMs, input.title, input.body, input.userId, input.notificationType);
          } else {
            logger.log('NotificationService not ready, skipping notification scheduling');
          }
          break;

        case "InviteFriend":
          onInviteFriend(input.connectionId, input.socketKey, input.otherPlayerConnectionID, input.roomId);
          break;
        case "LinkResponseDone":
          LinkResponseDone(input.connectionId, input.socketKey, input.PlayerID, input.dataType);
          break;
        case "LinkClicked":
          LinkClicked(input.connectionId, input.socketKey, input.PlayerID, input.dataType);
          break;
        case "FreeSpinner":
          OnFreeSpin(input.connectionId, input.socketKey, input.PlayerID);
          break;
        case "PurchaseSpinner":
          OnPurchaseSpin(input.connectionId, input.socketKey, input.PlayerID);
          break;
        case "GetSpinnerStatus":
          OnGetSpinnerStatus(input.connectionId, input.socketKey, input.PlayerID);
          break;
        case "AmountAdd":
          OnAmountAdd(input.connectionId, input.socketKey, input.typeOfFreeAmount);
          break;
        case "giftsend":
          SendGift(input.connectionId, input.socketKey, input.otherplayerId, input.giftId);
          break;
        case "giftsendtoall":
          SendGiftToAll(input.connectionId, input.giftId);
          break;
        case "SayHi":
          SayHi(input.connectionId, input.otherPlayerID);
          break;
        case "UpdateAmount":
          UpdateAmount(input.connectionId);
          break;
        case "contactSupport":
          handleQueries(input.connectionId, input.socketKey, input.PlayerID, input.name, input.Email, input.phone, input.message);
          break;
        case "SendReport":
          handleReports(input.connectionId, input.socketKey, input.PlayerID, input.toReportplayerId, input.Reportfilter, input.email, input.message);
          break;
        case "DailyRewards":
          dailyRewards(input.connectionId, input.socketKey, input.PlayerID);
          break;
        case "DailyRewardsStatus":
          VerifydailyRewards(input.connectionId, input.socketKey, input.PlayerID);
          break;
        case "In_App_Purchase":
          onInAppPurchase(input.connectionId, input.socketKey, input.PlayerID, input.productId, input.productprice);
          break;
        case "Reward_Facetime_reward":
          rewardFacetime(input.connectionId, input.socketKey, input.PlayerID);
          break;
        case "FACE_DETECTED":
          let claim = await sequelizeObjects.FaceTimeClaims.count({
            where: {
              userId: input.PlayerID,
              claimedAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
          });
          if (claim >= 3) {
            players[input.connectionId].connection.sendText(JSON.stringify({ key: "No Further Rewards" }));
            break;
          } else {
            faceTimeManager.faceDetected(input.connectionId, input.socketKey, input.PlayerID);
            faceTimeManager.calculateReward();
            players[input.connectionId].connection.sendText(JSON.stringify({ key: "FaceDetected" }));
            break;
          }
        case "FACE_LOST":
          faceTimeManager.faceLost(input.connectionId, input.socketKey, input.PlayerID);
          players[input.connectionId].connection.sendText(JSON.stringify({ key: "FaceLost" }));
          break;
          case "COMPLETE_SUBSESSION":
            let reward = await sequelizeObjects.FaceTimeClaims.count({
              where: {
                userId: input.PlayerID,
                claimedAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
              }
            });
            if (reward >= 3) {
              players[input.connectionId].connection.sendText(JSON.stringify({ key: "No Further Rewards" }));
            } else {
              faceTimeManager.completeSubSession(input.connectionId, input.socketKey, input.PlayerID);
              players[input.connectionId].connection.sendText(JSON.stringify({ key: "completeSubsession" }));
            }
            break;
          case "LeaderBoard":
            LeaderBoard(input.connectionId, input.socketKey, input.playerID)
              .then(result => {
                players[input.connectionId].connection.sendText(JSON.stringify({ key: "LeaderBoard", data: result }));
              })
              .catch(err => logger.log(err));
            break;
          case "slot_machine_status":
            isFreeSpinAvailable(input.connectionId, input.socketKey, input.PlayerID);
            break;
          case "SlotMachine":
            playSlotMachine(input.connectionId, input.socketKey, input.PlayerID, input.amount);
            break;
          case "AddDailyChallenges":
            addDailyChallenges(input.connectionId, input.socketKey, input.PlayerID);
            break;
          case "GetDailyChallenges":
            getDailyChallenges(input.connectionId, input.socketKey, input.PlayerID);
            break;
          case "collectPoints":
            collectPoints(input.connectionId, input.socketKey, input.PlayerID, input.challengeId);
            break;
          case "RewardList":
            getRewardList(input.connectionId, input.socketKey, input.PlayerID);
            break;
          case "collectReward":
            collectReward(input.connectionId, input.socketKey, input.PlayerID);
            break;
          case "collectRewardList":
            collectRewardlist(input.connectionId, input.socketKey, input.PlayerID);
            break;
          case "BetTheFlop":
            console.log("BetTheFlop is called in holdem")
            rooms[input.roomId].betFlop(input.connectionId, input.socketKey, input.PlayerID, input.betType, input.amount);
            break;
          case "BetFlop":
            console.log("BetFlop is called in holdem")
            rooms[input.roomId].updateBet(input.connectionId, input.socketKey, input.PlayerID, input.betType, input.amount);
            break;
             case "BetFlopMatch":
            console.log("BetFlopMatch is called in holdem")
            //rooms[input.roomId].recordClientBet(input.PlayerID, input.betType, input.amount);
            break;
          case "betAmountStatus":
            rooms[input.roomId].betAmountStatus()
              .then(result => {
                players[input.connectionId].connection.sendText(JSON.stringify({ key: "betAmountStatus", data: result }));
              console.log("sent value is :" + result)
              })
              .catch(err => logger.log(err));
            break;
          case "getPopup":
            getPopuplist(input.connectionId);
            break;
          case "setPopup":
            displayPopup(input.connectionId, input.socketKey, input.PlayerID);
            break;
        case "ListPopup":
          displaylistPopup(input.connectionId, input.socketKey, input.PlayerID);
          break;
          case "collectPopup":
            collectPopup(input.connectionId, input.socketKey, input.popupId, input.PlayerID, input.dataType);
            break;
          case "DontHaveAccount":
            dontAcoountPopup(input.connectionId, input.socketKey, input.popupId, input.PlayerID);
            break;
          case "PopUpInfo":
            popupInfo(input.connectionId, input.socketKey, input.popupId, input.PlayerID);
            break;
          case "CollectWelcomeBonus":
            collectWelcomeBonus(input.connectionId, input.socketKey, input.PlayerID);
            break;
          case "CollectReferralBonus":
            collectReferralBonus(input.connectionId, input.socketKey, input.PlayerID);
            break;
            case "CollectReferrerStatsAndCredit":
            collectReferrerStatsAndCredit(input.connectionId, input.socketKey, input.PlayerID);
            break;
          case "ban_user":
            handleUserBan(input.connectionId, input.PlayerID);
            break;
          case "InAppPurchaseDisplay":
            inAppPurchasedisplay(input.connectionId, input.socketKey, input.PlayerID);
            break;
          case "getPopupEvent":
            getPopupEvent(input.connectionId, input.socketKey, input.PlayerID);
            break;
          case "collectLeaderBoardReward":
            collectLeaderBoardReward(input.connectionId, input.socketKey, input.PlayerID);
            break;
          case "DisplaySpinner":
            displayDynamicRewardList(input.connectionId, input.socketKey, input.PlayerID);
            break;
          case "DisplayVipSpinner":
            displayVIPDynamicRewardList(input.connectionId, input.socketKey, input.PlayerID);
            break;
          case "collectSpinner":
            collectSpinner(input.connectionId, input.socketKey, input.PlayerID, input.Amount);
            break;
          case "setAvatarIndex":
            setAvatarIndex(input.connectionId, input.socketKey, input.PlayerID, input.avatarIndex, input.username, input.name, input.countrycode);
            break;
            case "getAvatarIndex":
      getAvatarIndex(input.connectionId, input.socketKey, input.PlayerID);
      break;
    case "TableStatus":
      tableStatus(input.connectionId, input.socketKey, input.PlayerID);
      break;
    case "GameStatus":
      gameState(input.connectionId, input.socketKey, input.PlayerID, input.Status);
      break;
    case "settingState":
      setSettingState(input.connectionId, input.socketKey, input.PlayerID, input.music, input.sound, input.vibration, input.autoRebuy);
      break;
    case "getSettingState":
      getSettingState(input.connectionId, input.socketKey, input.PlayerID);
      break;
    case "getPlayerProfile":
      getPlayerProfile(input.connectionId, input.socketKey, input.playerId);
      break;
    case "freeInAppPurchase":
      claimFreeProduct(input.connectionId, input.socketKey, input.PlayerID, input.productId);
      break;
    case "VIPMembership":
      VIPMembership(input.connectionId, input.socketKey, input.PlayerID);
      break;
    case "setcontactsList":
      setContactsList(input.connectionId, input.socketKey, input.PlayerID, input.contactsList);
      break;
    case "AddFriend":
      onAddFriendlocal(input.connectionId, input.socketKey, input.PlayerID, input.OtherPlayerID);
      break;
    case "showCards":
      rooms[input.roomId].showCards(input.connectionId, input.socketKey, input.PlayerID);
      break;
    case "destroyvideo":
      rooms[input.roomId].destroyVideo(input.connectionId);
      break;
    case "onvideo":
      rooms[input.roomId].onVideo(input.connectionId);
      break;
    case "rewardAd":
      rewardAd(input.connectionId, input.socketKey, input.PlayerID, input.xp);
      break;
      }
    } catch (err) {
      logger.log(err);
    }
  } catch (err) {
    logger.log(err);
  }
}



// DB dispatcher removed (reverted to in-memory scheduling)
async function collectRewardlist(connectionId, socketKey, playerID) {
  try {
    // Validate connection.
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    // Validate input.
    if (!isValidInput({ connectionId, socketKey })) {
      throw new Error(`Invalid input for connectionId: ${connectionId}`);
    }

    const claim = await dailychallenges.collectRewardlist(playerID);
    if (claim) {
      players[connectionId].connection.sendText(
        JSON.stringify({
          key: "CollectRewardList",
          RewardCollected: claim.RewardCollected,
          VIPRewardCollected: claim.VIPRewardCollected,
          VIPSpinCollected: claim.VIPSpinCollected,
          SpinCount: claim.SpinCount,
        })
      );
    }
  } catch (err) {
    logger.log(err);
  }
}
async function collectReward(connectionId, socketKey, playerID) {
  try {
    // Validate connection and input.
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (!isValidInput({ connectionId, socketKey })) {
      throw new Error(`Invalid input for connectionId: ${connectionId}`);
    }
    const claim = await dailychallenges.collectReward(playerID);
    if (claim) {
      players[connectionId].connection.sendText(
        JSON.stringify({
          key: "collectReward",
          "Reward Collected": claim.RewardCollected,
          "Spin Count": claim.SpinCount,
        })
      );
    }
    
  } catch (err) {
    logger.log(err);
  }
}
async function getRewardList(connectionId, socketKey, playerID) {
  try {
    // Validate connection.
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    // Validate input.
    if (!isValidInput({ connectionId, socketKey })) {
      throw new Error(`Invalid input for connectionId: ${connectionId}`);
    }
    const claim = await dailychallenges.getRewardList(playerID);
    if (claim) {
      players[connectionId].connection.sendText(
        JSON.stringify({
          key: "RewardList",
          data: claim.data,
          currentLevel: claim.currentLevel,
          lastClaimed: claim.lastClaimed,
          ispurchased: claim.ispurchased,
        })
      );
    }

  } catch (error) {
    logger.log(error);
  }
}
async function collectPoints(connectionId, socketKey, playerID, challengeId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      let claim = await dailychallenges.collectPoints(playerID, challengeId);
      if (claim) {
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "collectPoints",
            Points: claim.Points,
            level: claim.level,
            nextLevelPoints: claim.nextLevelPoints,
          })
        );
      }
    }
  } catch (error) {
    logger.log(error);
  }
}
async function addDailyChallenges(connectionId, socketKey, playerID) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (!isValidInput({ connectionId, socketKey })) {
      logger.log("Invalid input for addDailyChallenges.");
      return;
    }
      let claim = await dailychallenges.addDailyChallenges(playerID);
    if (claim) {
        players[connectionId].connection.sendText(JSON.stringify(claim.dataToSend));
      }
    
      cleanResponseArray();

  } catch (error) {
    logger.log(error);
  }
}
async function getDailyChallenges(connectionId, socketKey, playerID) {
  if (isValidInput({ connectionId, socketKey })) {
    try {
      const claim = await dailychallenges.getDailyChallenges(playerID);
      if (claim) {
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "DailyChallenges",
            data: claim.result,
          })
        );
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "getDailyChallenges",
            data: claim.challenge,
          })
        );
      }

      cleanResponseArray();
    } catch (error) {
      // Handle any potential errors
      logger.log(`Error getting daily challenges: ${error}`);
    }
  }
}
/* async function getUserStatus(connectionId, socketKey, playerID) {
  if (isValidInput({ connectionId, socketKey })) {
    let user = await sequelizeObjects.User.findOne({ where: { id: playerID } });
    players[connectionId].connection.sendText(
      JSON.stringify({
        key: "User Status",
        data: `Name:${user.name} Email:${user.email} Money:${user.money}`,
      })
    );
    cleanResponseArray();
  }
} */
async function PlayerLevelDetails(connectionId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }

    try {
      // Calculate the current level and XP milestones
      const VIP_MULTIPLIER = 0.1;
      let currentLevel = calculateLevel(players[connectionId].xp);
      let nextLevelXP = calculateXPToNextLevel(currentLevel);
      let prevLevelXP = calculateXPToNextLevel(currentLevel - 1);

      let user = await sequelizeObjects.User.findOne({
        where: { id: players[connectionId].playerDatabaseId },
      });

      // Check if the user's level increased
      if (user.Level < currentLevel) {
        // Calculate XP gained in the current level
        let xpGainedInLevel = nextLevelXP - prevLevelXP;

        // Calculate VIP points based on multiplier
        let vipPointsAwarded = Math.floor(xpGainedInLevel * VIP_MULTIPLIER); // Floor to avoid decimals

        user.vipPoints = (user.vipPoints || 0) + vipPointsAwarded;
        user.Level = currentLevel;

        // Update VIP Membership based on VIP Points
        let currentVipMembership = await sequelizeObjects.VipMembership.findOne(
          {
            where: { RequiredPoints: { [Op.lte]: user.vipPoints } },
            order: [["RequiredPoints", "DESC"]],
          }
        );

        //logger.log("Current VIP Level:" + currentVipMembership);

        // Fetch the next level VIP membership
        let nextVipMembership = await sequelizeObjects.VipMembership.findOne({
          where: { level: currentVipMembership.level + 1 },
        });

        //logger.log("Next VIP Level:" + nextVipMembership);

        if (
          nextVipMembership &&
          user.vipPoints >= nextVipMembership.RequiredPoints
        ) {
          // User qualifies for the next level
          user.vipLevel = nextVipMembership.level;
          user.membersince = new Date();
          players[connectionId].nextcardReached = true;
        } else if (
          currentVipMembership &&
          user.vipLevel < currentVipMembership.level
        ) {
          // User qualifies for the current highest eligible level
          user.vipLevel = currentVipMembership.level;
          user.membersince = new Date();
          players[connectionId].nextcardReached = true;
        } else {
          // User remains on the same level
          players[connectionId].nextcardReached = false;
        }

        await user.save();

        // Notify the user about their new level and VIP status
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "LevelDetails",
            currentXP: players[connectionId].xp,
            currentLevel: currentLevel,
            nextLevelXP: nextLevelXP,
            prevLevelXP: prevLevelXP,
            vipPointsAwarded: vipPointsAwarded,
            totalVIPPoints: user.vipPoints,
            vipLevel: user.vipLevel,
          })
        );
        VIPMembership(
          connectionId,
          players[connectionId].socketKey,
          players[connectionId].playerDatabaseId,
          players[connectionId].nextcardReached
        );
      } else {
        // Notify user without VIP update if no level-up occurred
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "LevelDetails",
            currentXP: players[connectionId].xp,
            currentLevel: currentLevel,
            nextLevelXP: nextLevelXP,
            prevLevelXP: prevLevelXP,
            totalVIPPoints: user.vipPoints,
            vipLevel: user.vipLevel,
          })
        );
        VIPMembership(
          connectionId,
          players[connectionId].socketKey,
          players[connectionId].playerDatabaseId,
          players[connectionId].nextcardReached
        );
      }
    } catch (err) {
      logger.log(err);
    }
  } catch (error) {
    logger.log(error);
  }
}

function SendGift(connectionId, socketKey, otherPlayerID, giftID) {
  // deduct amount here
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      if (players[connectionId].playerMoney > allGifts[giftID].GiftPrice) {
        players[connectionId].playerMoney =
          +players[connectionId].playerMoney - +allGifts[giftID].GiftPrice;
        rooms[players[connectionId].selectedRoomId].sendGift(
          connectionId,
          otherPlayerID,
          giftID
        );
      } else if (
        players[connectionId].playersAllMoney > allGifts[giftID].GiftPrice
      ) {
        players[connectionId].playersAllMoney =
          +players[connectionId].playersAllMoney - +allGifts[giftID].GiftPrice;
        rooms[players[connectionId].selectedRoomId].sendGift(
          connectionId,
          otherPlayerID,
          giftID
        );
      }
    } catch (err) {
      logger.log(err);
    }
  } catch (error) {
    logger.log(error);
  }
}

function SayHi(connectionId, otherPlayerID) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      //logger.log(otherPlayerID, logger.LOG_RED);
      if (otherPlayerID != null) {
        players[otherPlayerID].connection.sendText(
          JSON.stringify({
            key: "SayHi",
            sendBy: players[connectionId].playerName,
          })
        );
      }
      //rooms[players[connectionId].selectedRoomId].sendGift(connectionId,otherPlayerID);
    } catch (err) {
      logger.log(err);
    }
  } catch (error) {
    logger.log(error);
  }
}

function SendGiftToAll(connectionId, giftID) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      let giftAmount =
        rooms[players[connectionId].selectedRoomId].players.length *
        allGifts[giftID].GiftPrice;
      if (players[connectionId].playerMoney > giftAmount) {
        players[connectionId].playerMoney =
          +players[connectionId].playerMoney - +giftAmount;
        rooms[players[connectionId].selectedRoomId].sendGiftToAll(
          connectionId,
          giftID
        );
      } else if (players[connectionId].playersAllMoney > giftAmount) {
        players[connectionId].playersAllMoney =
          +players[connectionId].playersAllMoney - +giftAmount;
        rooms[players[connectionId].selectedRoomId].sendGiftToAll(
          connectionId,
          giftID
        );
      }
      //rooms[players[connectionId].selectedRoomId].sendGiftToAll(connectionId,giftID);
    } catch (err) {
      logger.log(err);
    }
  } catch (error) {
    logger.log(error);
  }
}

function OnFreeSpin(connectionId, socketKey, playerID) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      if (!players[connectionId] || !players[connectionId].connection) {
        throw new Error(`Invalid connectionId: ${connectionId}`);
      }
      dbUtils.SpinGetPromise(sequelizeObjects, playerID).then((result) => {
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "FreeSpinner",
            socketKey: socketKey,
            data: result,
          })
        );
        cleanResponseArray();
      });
    } catch (err) {
      logger.log(err);
    }
  } catch (error) {
    logger.log(error);
  }
}

function UpdateAmount(connectionId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      players[connectionId].connection.sendText(
        JSON.stringify({
          key: "PlayerAmountUpdate",
          data: {
            Amount: players[connectionId].playersAllMoney,
          },
        })
      );
    } catch (err) {
      logger.log(err);
    }
  } catch (error) {
    logger.log(error);
  }
}
//86400
function OnPurchaseSpin(connectionId, socketKey, playerID) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      dbUtils
        .SpinGetPurchasePromise(sequelizeObjects, playerID)
        .then((result) => {
          players[connectionId].connection.sendText(
            JSON.stringify({
              key: "PurchaseSpinner",
              socketKey: socketKey,
              data: result,
            })
          );
          cleanResponseArray();
        });
    } catch (err) {
      logger.log(err);
    }
  } catch (error) {
    logger.log(error);
  }
}

async function OnGetSpinnerStatus(connectionId, socketKey, playerID) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      if (!players[connectionId] || !players[connectionId].connection) {
        throw new Error(`Invalid connectionId: ${connectionId}`);
      }

      dbUtils
        .GetSpinnerStatusPromise(sequelizeObjects, playerID)
        .then((result) => {
          try {
            if (players[connectionId] && players[connectionId].connection) {
              players[connectionId].connection.sendText(
                JSON.stringify({
                  key: "GetSpinnerStatus",
                  socketKey: socketKey,
                  data: result,
                })
              );
            } else {
              throw new Error(
                `Connection lost or invalid during response send for connectionId: ${connectionId}`
              );
            }
          } catch (sendError) {
            logger.log(`Error sending response: ${sendError.message}`);
          }
          cleanResponseArray();
        })
        .catch((dbError) => {
          logger.log(`Database error: ${dbError.message}`);
        });

      await VerifydailyRewards(connectionId, socketKey, playerID);
      getDailyBonusList(connectionId, socketKey, playerID);
    } catch (err) {
      logger.log(`General error in OnGetSpinnerStatus: ${err.message}`);
    }
  } catch (err) {
    logger.log(err);
  }
}

async function OnPlayerJoinRoom(connectionId, socketKey, TableId) {
  try {
    console.log("OnPlayerJoinRoom table id is:" + TableId)
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      //logger.log("OnPlayerJoinRoom " + TableId);
      let user = await sequelizeObjects.User.findOne({
        where: { id: players[connectionId].playerDatabaseId },
      });

      for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].roomId === TableId) {
          // rooms[i].players.length
          let table = await sequelizeObjects.Tables.findOne({
            where: {
              tableId: rooms[i].holdemType,
              type: rooms[i].tableType,
              display: true,
            },
          });
          if (rooms[i].players.length < 5) {
            //logger.log("Have seat available to join");
            // logger.log(
            //   `playersAllMoney ${players[connectionId].playersAllMoney} table.minimumAmount ${table.minimumAmount} user.Level ${user.Level} table.level ${table.level}` +
            //     `typeof players[connectionId].playersAllMoney ` +
            //     typeof players[connectionId].playersAllMoney +
            //     `typeof table.minimumAmount ` +
            //     typeof table.minimumAmount
            // );
            if (
              parseInt(players[connectionId].playersAllMoney) >
                parseInt(table.minimumAmount) &&
              parseInt(user.Level) >= parseInt(table.level)
            ) {
              //logger.log("Player Has Amount greater than minimum amount");
              if (players[connectionId].selectedRoomId != -1) {
                //logger.log("Player is already on another table");
                let spectatorsTemp = [];
                players[connectionId].playersAllMoney =
                  +players[connectionId].playersAllMoney +
                  +players[connectionId].playerMoney;
                rooms[players[connectionId].selectedRoomId].playerFold(
                  sequelizeObjects,
                  connectionId,
                  socketKey,
                  false
                );
                rooms[players[connectionId].selectedRoomId].sendStatusUpdate();
                await rooms[players[connectionId].selectedRoomId].LeaveRoom(
                  connectionId,
                  players[connectionId]
                );
                onPlayerSelectRoom(connectionId, socketKey, TableId);
                getRoomParameters(connectionId, socketKey, TableId);
              } else {
                onPlayerSelectRoom(connectionId, socketKey, TableId);
                getRoomParameters(connectionId, socketKey, TableId);
                //logger.log("Player is in the lobby");
              }
            } else {
              if (parseInt(players[connectionId].playersAllMoney) < parseInt(table.minimumAmount)) {
                // logger.log(
                //   `Player amount is ${players[connectionId].playersAllMoney} and minimum amount is ${table.minimumAmount}`
                // );
                // logger.log(
                //   "Player dont have Amount greater than minimum amount"
                // );
                if (players[connectionId].selectedRoomId != -1) {
                  players[connectionId].playersAllMoney =
                    +players[connectionId].playersAllMoney +
                    +players[connectionId].playerMoney;
                  rooms[players[connectionId].selectedRoomId].playerFold(
                    sequelizeObjects,
                    connectionId,
                    socketKey,
                    false
                  );
                  rooms[
                    players[connectionId].selectedRoomId
                  ].sendStatusUpdate();
                  rooms[players[connectionId].selectedRoomId].LeaveRoom(
                    connectionId,
                    players[connectionId]
                  );
                }
                players[connectionId].connection.sendText(
                  JSON.stringify({
                    key: "CanNotJoin",
                    Message:
                      "You Donot Have Sufficient Amount To Join The Game",
                  })
                );
              } else if (parseInt(user.Level) < parseInt(table.level)) {
                // logger.log(
                //   `Player level is ${user.Level} and minimum amount is ${table.level}`
                // );
                // logger.log(
                //   "Player dont have level greater than minimum amount"
                // );
                if (players[connectionId].selectedRoomId != -1) {
                  players[connectionId].playersAllMoney =
                    +players[connectionId].playersAllMoney +
                    +players[connectionId].playerMoney;
                  rooms[players[connectionId].selectedRoomId].playerFold(
                    sequelizeObjects,
                    connectionId,
                    socketKey,
                    false
                  );
                  rooms[
                    players[connectionId].selectedRoomId
                  ].sendStatusUpdate();
                  rooms[players[connectionId].selectedRoomId].LeaveRoom(
                    connectionId,
                    players[connectionId]
                  );
                }
                players[connectionId].connection.sendText(
                  JSON.stringify({
                    key: "CanNotJoin",
                    Message: "You Donot Have Sufficient Level To Join The Game",
                  })
                );
              }
            }
          } else {
            players[connectionId].connection.sendText(
              JSON.stringify({
                key: "TableFull",
              })
            );
          }
        }
      }
    } catch (err) {
      logger.log(err);
    }
  } catch (err) {
    logger.log(err);
  }
}

function OnSendMessageToOtherPlayer(
  senderId,
  recieverId,
  recieverKey,
  recieverMessage
) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      //logger.log("OnSendMessageToOtherPlayer");
      const recipientConn = players[recieverId].connection;
      // Send the friend request to the recipient
      recipientConn.sendText(
        JSON.stringify({
          connectionId: senderId,
          key: recieverKey,
          senderId: senderId,
          data: recieverMessage,
        })
      );
      players[senderId].connection.sendText(
        JSON.stringify({
          key: "messageSent",
          sendto: recieverId,
          details: "",
        })
      );
    } catch (err) {
      logger.log(err);
    }
  } catch (error) {
    logger.log(error);
  }
}

async function onOpenProfile(connectionId, socketKey, OtherPlayerID) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }

    logger.log(`players ${connectionId} and ${OtherPlayerID}`);

    if (players[OtherPlayerID].isBot) {
      let friend = await sequelizeObjects.Friends.findAll({
        limit: 1,
        where: [
          { idMyPlayer: players[connectionId].playerDatabaseId },
          { idOtherPlayer: players[OtherPlayerID].playerDatabaseId }
        ]
      });

      let bestCardsRaw = players[OtherPlayerID].BestCards;
      if (!bestCardsRaw) {
        logger.log(`BestCards missing for player ${OtherPlayerID}, using default.`);
        bestCardsRaw = `[{"value":"A","suit":"s","rank":13,"wildValue":"A"},{"value":"K","suit":"s","rank":12,"wildValue":"K"},{"value":"Q","suit":"d","rank":11,"wildValue":"Q"},{"value":"J","suit":"d","rank":10,"wildValue":"J"},{"value":"T","suit":"s","rank":9,"wildValue":"T"}]`;
      }

      let parsedCards = [];
      try {
        parsedCards = JSON.parse(bestCardsRaw);
      } catch (e) {
        logger.log(`Failed to parse BestCards for ${OtherPlayerID}: ${bestCardsRaw}`);
        bestCardsRaw = `[{"value":"A","suit":"s","rank":13,"wildValue":"A"},{"value":"K","suit":"s","rank":12,"wildValue":"K"},{"value":"Q","suit":"d","rank":11,"wildValue":"Q"},{"value":"J","suit":"d","rank":10,"wildValue":"J"},{"value":"T","suit":"s","rank":9,"wildValue":"T"}]`;
        parsedCards = JSON.parse(bestCardsRaw);
      }

      let result = {
        result: true,
        OwnerID: players[connectionId].playerDatabaseId,
        FStatus: friend[0] ? friend[0].FriendStatus : "",
        UserInfo: {
          id: players[OtherPlayerID].playerDatabaseId,
          name: players[OtherPlayerID].playerName,
          win_count: players[OtherPlayerID].playerWinCount,
          lose_count: players[OtherPlayerID].playerLoseCount,
          BiggestHand: players[OtherPlayerID].biggestHand,
          BiggestWalletEver: players[OtherPlayerID].biggestWallet,
          pre_flop: players[OtherPlayerID].preflop,
          flop: players[OtherPlayerID].flop,
          turn: players[OtherPlayerID].turn,
          river: players[OtherPlayerID].river,
          BestCards: bestCardsRaw,
          money: players[OtherPlayerID].playerMoney,
          Level: players[OtherPlayerID].Level,
          profileImageLink: players[OtherPlayerID].profileImageLink
        },
        userCards: parsedCards
      };

      players[connectionId].connection.sendText(
        JSON.stringify({
          key: "OpenProfile",
          socketKey: socketKey,
          data: result,
        })
      );

    } else {
      dbUtils
        .ReturnPlayerInfoPromise(
          sequelizeObjects,
          players[connectionId].playerDatabaseId,
          players[OtherPlayerID].playerDatabaseId
        )
        .then((result) => {
          players[connectionId].connection.sendText(
            JSON.stringify({
              key: "OpenProfile",
              socketKey: socketKey,
              data: result,
            })
          );
          cleanResponseArray();
        });
    }

  } catch (error) {
    logger.log(error);
  }
}


async function OnGetFriend(connectionId, socketKey) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      let userrequested = await sequelizeObjects.Friends.findAll({
        where: {
          idMyPlayer: players[connectionId].playerDatabaseId,
          FriendStatus: "Request",
        },
      });
      dbUtils
        .ReturnFriendListRequest(
          sequelizeObjects,
          players[connectionId].playerDatabaseId
        )
        .then((Requests) => {
          dbUtils
            .ReturnFriendListAccepted(
              sequelizeObjects,
              players[connectionId].playerDatabaseId
            )
            .then((Friends) => {
              for (let i = 0; i < Requests.returnValues.length; i++) {
                if (
                  Requests.returnValues[i].idOtherPlayer ==
                  players[connectionId].playerDatabaseId
                ) {
                  logger.log([Requests.returnValues[i].idMyPlayer]);
                  if (dict[Requests.returnValues[i].idMyPlayer] != null) {
                    Requests.returnValues[i].OnlineStatus = true;
                  } else {
                    Requests.returnValues[i].OnlineStatus = false;
                  }
                } else {
                  logger.log([Requests.returnValues[i].idOtherPlayer]);
                  if (dict[Requests.returnValues[i].idOtherPlayer] != null) {
                    Requests.returnValues[i].OnlineStatus = true;
                  } else {
                    Requests.returnValues[i].OnlineStatus = false;
                  }
                }
              }
              for (let i = 0; i < Friends.returnValues.length; i++) {
                if (
                  Friends.returnValues[i].idOtherPlayer ==
                  players[connectionId].playerDatabaseId
                ) {
                  logger.log([Friends.returnValues[i].idMyPlayer]);
                  if (dict[Friends.returnValues[i].idMyPlayer] != null) {
                    Friends.returnValues[i].OnlineStatus = true;
                  } else {
                    Friends.returnValues[i].OnlineStatus = false;
                  }
                } else {
                  logger.log([Friends.returnValues[i].idOtherPlayer]);
                  if (dict[Friends.returnValues[i].idOtherPlayer] != null) {
                    Friends.returnValues[i].OnlineStatus = true;
                  } else {
                    Friends.returnValues[i].OnlineStatus = false;
                  }
                }
              }
           
              //let friendsList = {friends : Friends, requests : Requests};
              if (players[connectionId].connection != null) {
                players[connectionId].connection.sendText(
                  JSON.stringify({
                    key: "FriendList",
                    socketKey: socketKey,
                    //"data": friendsList,
                    friends: Friends,
                    requests: Requests,
                    userrequested: userrequested,
                  })
                );
              }
              cleanResponseArray();
            });
          cleanResponseArray();
        });
    } catch (err) {
      logger.log(err);
    }
  } catch (error) {
    logger.log(error);
  }
}

function OnGetFriendList(connectionId, socketKey, listType) {
  logger.log("OnGetFriendList Called");
  if (listType == "Request") {
    dbUtils
      .ReturnFriendListRequest(
        sequelizeObjects,
        players[connectionId].playerDatabaseId
      )
      .then((result) => {
        //logger.log("" + JSON.stringify(result));
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "FriendRequestList",
            Type: listType,
            socketKey: socketKey,
            data: result,
          })
        );
        cleanResponseArray();
      });
  } else if (listType == "Friends") {
    dbUtils
      .ReturnFriendListAccepted(
        sequelizeObjects,
        players[connectionId].playerDatabaseId
      )
      .then((result) => {
        //logger.log("" + JSON.stringify(result));
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "FriendList",
            Type: listType,
            socketKey: socketKey,
            data: result,
          })
        );
        cleanResponseArray();
      });
  }
}
async function onAddFriendlocal(connectionId, socketKey, playerID, OtherPlayerID) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      let player1 = await sequelizeObjects.User.findOne({
        where: { id: playerID },
      });
      let player2 = await sequelizeObjects.User.findOne({
        where: { id: OtherPlayerID },
      });

      if (!player1 || !player2) {
        throw new Error("Invalid player data");
      } else {
        let request = await sequelizeObjects.Friends.findOne({
          where: {
            [Op.or]: [
              { idMyPlayer: player1.id, idOtherPlayer: player2.id },
              { idMyPlayer: player2.id, idOtherPlayer: player1.id },
            ],
          },
        });
        if (request) {
          if (request.FriendStatus == "Request") {
              // Send the friend request to the recipient
              const result = {
                result: true,
                requestSend: request.idMyPlayer,
              };

              players[connectionId].connection.sendText(
                JSON.stringify({
                  key: "RequestSent",
                  socketKey: socketKey,
                  data: result,
                })
              );
            if (players[player2.conn]) {
                players[player2.conn].connection.sendText(
                  JSON.stringify({
                    key: "FriendRequest",
                    data: {
                    senderId: connectionId,
                    playerName: request.NameMyPlayer,
                  },
                })
                );
              }
          } else if (request.FriendStatus == "Decline") {
            await request.update({
              idMyPlayer: player1.id,
              idOtherPlayer: player2.id,
              FriendStatus: "Request",
              NameMyPlayer: player1.name,
              NameOtherPlayer: player2.name,
              OnlineStatus: false,
            });
              const result = {
                result: true,
                requestSend: request.idMyPlayer,
              };

              // Send the response back to the sender
              players[connectionId].connection.sendText(
                JSON.stringify({
                  key: "RequestSent",
                  socketKey: socketKey,
                  data: result,
                })
              );
            if (players[player2.conn]) {
                players[player2.conn].connection.sendText(
                  JSON.stringify({
                    key: "FriendRequest",
                    data: {
                    senderId: connectionId,
                    playerName: request.NameMyPlayer,
                  },
                })
                );
              }
          } else if (request.FriendStatus == "Removed") {
            await request.update({
              idMyPlayer: player1.id,
              idOtherPlayer: player2.id,
              FriendStatus: "Request",
              NameMyPlayer: player1.name,
              NameOtherPlayer: player2.name,
              OnlineStatus: false,
            });
              const result = {
                result: true,
                requestSend: request.idMyPlayer,
              };
              // Send the response back to the sender
              players[connectionId].connection.sendText(
                JSON.stringify({
                  key: "RequestSent",
                  socketKey: socketKey,
                  data: result,
                })
              );
            if (players[player2.conn]) {
                players[player2.conn].connection.sendText(
                  JSON.stringify({
                    key: "FriendRequest",
                    data: {
                    senderId: connectionId,
                    playerName: request.NameMyPlayer,
                  },
                })
                );
              }
          }
        } else {
          let friend = await sequelizeObjects.Friends.create({
            idMyPlayer: player1.id,
            idOtherPlayer: player2.id,
            FriendStatus: "Request",
            NameMyPlayer: player1.name,
            NameOtherPlayer: player2.name,
            OnlineStatus: false,
          });
            const result = {
              result: true,
              requestSend: friend.idMyPlayer,
            };

            // Send the response back to the sender
            players[connectionId].connection.sendText(
              JSON.stringify({
                key: "RequestSent",
                socketKey: socketKey,
                data: result,
              })
            );
          if (players[player2.conn]) {
              players[player2.conn].connection.sendText(
                JSON.stringify({
                  key: "FriendRequest",
                  data: {
                  senderId: connectionId,
                  playerName: player1.name,
                },
              })
              );
            }
        }
      }
    } catch (err) {
      logger.log("Error in onAddFriend: " + err);
    }
  } catch (error) {
    logger.log(error);
  }
}
async function onAddFriend(connectionId, socketKey, OtherPlayerID, roomId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      logger.log(
        "onAddFriend: " +
          connectionId +
          " " +
          socketKey +
          " " +
          OtherPlayerID +
          " " +
          roomId
      );
      if (players[OtherPlayerID].isBot) {
        OtherPlayerID = players[OtherPlayerID].playerId
        await sequelizeObjects.Friends.create({
          idMyPlayer: players[connectionId].playerDatabaseId,
          idOtherPlayer: players[OtherPlayerID].playerDatabaseId,
          FriendStatus: "Request",
          NameMyPlayer: players[connectionId].playerName,
          NameOtherPlayer: players[OtherPlayerID].playerName,
          OnlineStatus: false,
        })
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "RequestSent",
            socketKey: socketKey,
            data: {
              result: true,
              requestSend: OtherPlayerID,
            }
          })
        );
      }
      if (!players[connectionId] || !players[OtherPlayerID]) {
        throw new Error("Invalid player data");
      }
      let player1 = await sequelizeObjects.User.findOne({
        where: { id: players[connectionId].playerDatabaseId },
      });
      let player2 = await sequelizeObjects.User.findOne({
        where: { id: players[OtherPlayerID].playerDatabaseId },
      });

      if (!player1 || !player2) {
        throw new Error("Invalid player data");
      } else {
        let request = await sequelizeObjects.Friends.findOne({
          where: {
            [Op.or]: [
              { idMyPlayer: player1.id, idOtherPlayer: player2.id },
              { idMyPlayer: player2.id, idOtherPlayer: player1.id },
            ],
          },
        });
        if (request) {
          if (request.FriendStatus == "Request") {
            const recipientConn = players[OtherPlayerID]?.connection;
            if (recipientConn) {
              // Send the friend request to the recipient
              recipientConn.sendText(
                JSON.stringify({
                  key: "FriendRequest",
                  data: {
                    senderId: connectionId,
                    playerName: request.NameMyPlayer,
                  },
                })
              );
              const result = {
                result: true,
                requestSend: request.idMyPlayer,
              };

              // Send the response back to the sender
              players[connectionId].connection.sendText(
                JSON.stringify({
                  key: "RequestSent",
                  socketKey: socketKey,
                  data: result,
                })
              );
            } else {
              logger.log("Recipient connection not found");
            }
          } else if (request.FriendStatus == "Decline") {
            await request.update({
              idMyPlayer: player1.id,
              idOtherPlayer: player2.id,
              FriendStatus: "Request",
              NameMyPlayer: player1.name,
              NameOtherPlayer: player2.name,
              OnlineStatus: false,
            });
            const recipientConn = players[OtherPlayerID]?.connection;
            if (recipientConn) {
              // Send the friend request to the recipient
              recipientConn.sendText(
                JSON.stringify({
                  key: "FriendRequest",
                  data: {
                    senderId: connectionId,
                    playerName: request.NameMyPlayer,
                  },
                })
              );
              const result = {
                result: true,
                requestSend: request.idMyPlayer,
              };

              // Send the response back to the sender
              players[connectionId].connection.sendText(
                JSON.stringify({
                  key: "RequestSent",
                  socketKey: socketKey,
                  data: result,
                })
              );
            } else {
              logger.log("Recipient connection not found");
            }
          } else if (request.FriendStatus == "Removed") {
            await request.update({
              idMyPlayer: player1.id,
              idOtherPlayer: player2.id,
              FriendStatus: "Request",
              NameMyPlayer: player1.name,
              NameOtherPlayer: player2.name,
              OnlineStatus: false,
            });
            const recipientConn = players[OtherPlayerID]?.connection;
            if (recipientConn) {
              // Send the friend request to the recipient
              recipientConn.sendText(
                JSON.stringify({
                  key: "FriendRequest",
                  data: {
                    senderId: connectionId,
                    playerName: request.NameMyPlayer,
                  },
                })
              );
              const result = {
                result: true,
                requestSend: request.idMyPlayer,
              };

              // Send the response back to the sender
              players[connectionId].connection.sendText(
                JSON.stringify({
                  key: "RequestSent",
                  socketKey: socketKey,
                  data: result,
                })
              );
            } else {
              logger.log("Recipient connection not found");
            }
          }
        } else {
          let friend = await sequelizeObjects.Friends.create({
            idMyPlayer: player1.id,
            idOtherPlayer: player2.id,
            FriendStatus: "Request",
            NameMyPlayer: player1.name,
            NameOtherPlayer: player2.name,
            OnlineStatus: false,
          });
          const recipientConn = players[OtherPlayerID]?.connection;
          if (recipientConn) {
            // Send the friend request to the recipient
            recipientConn.sendText(
              JSON.stringify({
                key: "FriendRequest",
                data: {
                  senderId: connectionId,
                  playerName: friend.NameMyPlayer,
                },
              })
            );
            const result = {
              result: true,
              requestSend: friend.idMyPlayer,
            };

            // Send the response back to the sender
            players[connectionId].connection.sendText(
              JSON.stringify({
                key: "RequestSent",
                socketKey: socketKey,
                data: result,
              })
            );
          } else {
            logger.log("Recipient connection not found");
          }
        }
      }
    } catch (err) {
      logger.log("Error in onAddFriend: " + err);
    }
  } catch (error) {
    logger.log(error);
  }
}

function onInviteFriend(connectionId, socketKey, OtherPlayerID, roomId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      if (dict[OtherPlayerID] != null) {
        OtherPlayerID = dict[OtherPlayerID];
        const recipientConn = players[OtherPlayerID].connection;
        let roomType = "";
        if (rooms[roomId].tableOwner == -1) {
          roomType = "public";
        } else {
          roomType = "private";
        }
        // Send the friend request to the recipient
        recipientConn.sendText(
          JSON.stringify({
            key: "FriendInvitaion",
            data: {
              senderId: connectionId,
              roomId: roomId,
              roomType: roomType,
              holdemType: rooms[roomId].holdemType,
              typeName: rooms[roomId].tableStakes,
              playerName: players[connectionId].playerName,
            },
          })
        );
      } else {
        // Handle case when recipient does not exist
      }
      players[connectionId].connection.sendText(
        JSON.stringify({
          key: "InviteSent",
          socketKey: socketKey,
          data: "",
        })
      );
    } catch (err) {
      logger.log(err);
    }
  } catch (error) {
    logger.log(error);
  }
}

let dict = {};

 function onAcceptFriendRequest(
  connectionId,
  socketKey,
  OtherPlayerID,
  sourceType
) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      logger.log(
        "onAcceptFriendRequest: " +
          connectionId +
          " " +
          socketKey +
          " " +
          OtherPlayerID +
          " " +
          sourceType
      );
      if (!players[connectionId])
        throw new Error("Invalid connection player data");

      const handleResult = async (result) => {
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "AcceptedFR",
            socketKey: socketKey,
            data: result,
          })
        );
        if (sourceType === "DB") {
          let connection = await sequelizeObjects.User.findOne({
            where: {
              id: OtherPlayerID
            }
          })
          if (connection) {
            if (players[connection.conn]) {
              logger.log(`Connection is alive ${connection.conn}`);
              players[connection.conn].connection.sendText(
                JSON.stringify({
                  key: "RequestAccepted",
                  socketKey: socketKey,
                  data: result,
                })
              );
            }
          }
        }
        if (players[OtherPlayerID]) {
          players[OtherPlayerID].connection.sendText(
            JSON.stringify({
              key: "RequestAccepted",
              socketKey: socketKey,
              data: result,
            })
          );
        } else {
          logger.log("OtherPlayer connection not found");
        }
      };

      if (sourceType === "DB") {
        dbUtils
          .ReturnPlayerRequestAccept(
            sequelizeObjects,
            players[connectionId].playerDatabaseId,
            OtherPlayerID,
            "Accept"
          )
          .then(handleResult)
          .catch((err) => logger.log(err));
      } else {
        if (!players[OtherPlayerID])
          throw new Error("Invalid other player data");
        dbUtils
          .ReturnPlayerRequestAccept(
            sequelizeObjects,
            players[connectionId].playerDatabaseId,
            players[OtherPlayerID].playerDatabaseId,
            "Accept"
          )
          .then(handleResult)
          .catch((err) => logger.log(err));
      }
    } catch (err) {
      logger.log("Error in onAcceptFriendRequest: " + err);
    }
  } catch (error) {
    logger.log(error);
  }
}

 function onDeclineFriendRequest(
  connectionId,
  socketKey,
  OtherPlayerID,
  sourceType
) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      logger.log(
        "onDeclineFriendRequest: " +
          connectionId +
          " " +
          socketKey +
          " " +
          OtherPlayerID +
          " " +
          sourceType
      );
      if (!players[connectionId])
        throw new Error("Invalid connection player data");

      const handleResult = async (result) => {
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "DeclinedFR",
            socketKey: socketKey,
            data: result,
          })
        );
        if (sourceType === "DB") {
          let connection = await sequelizeObjects.User.findOne({
            where: {
              id: OtherPlayerID
            }
          })
          if (connection) {
            if (players[connection.conn]) {
              logger.log(`Connection is alive ${connection.conn}`);
              players[connection.conn].connection.sendText(
                JSON.stringify({
                  key: "DeclinedFR",
                  socketKey: socketKey,
                  data: result
                })
              );
            }
          }
        } else {
          if (players[OtherPlayerID]) {
            players[OtherPlayerID].connection.sendText(
              JSON.stringify({
                key: "DeclinedFR",
                socketKey: socketKey,
                data: result,
              })
            );
          }
        }
      };

      if (sourceType === "DB") {
        dbUtils
          .ReturnPlayerRequestAccept(
            sequelizeObjects,
            players[connectionId].playerDatabaseId,
            OtherPlayerID,
            "Decline"
          )
          .then(handleResult)
          .catch((err) => logger.log(err));
      } else {
        if (!players[OtherPlayerID])
          throw new Error("Invalid other player data");
        dbUtils
          .ReturnPlayerRequestAccept(
            sequelizeObjects,
            players[connectionId].playerDatabaseId,
            players[OtherPlayerID].playerDatabaseId,
            "Decline"
          )
          .then(handleResult)
          .catch((err) => logger.log(err));
      }
    } catch (err) {
      logger.log("Error in onDeclineFriendRequest: " + err);
    }
  } catch (error) {
    logger.log(error);
  }
}
async function onRemoveFriend(connectionId, socketKey, OtherPlayerID) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      logger.log(
        "onRemoveFriend: " +
          connectionId +
          " " +
          socketKey +
          " " +
          OtherPlayerID
      );
      logger.log(players[connectionId].playerDatabaseId);
      let player = sequelizeObjects.Friends.findOne({
        where: {
          [Op.or]: [
            {
              idMyPlayer: players[connectionId].playerDatabaseId,
              idOtherPlayer: OtherPlayerID,
            },
            {
              idMyPlayer: OtherPlayerID,
              idOtherPlayer: players[connectionId].playerDatabaseId,
            },
          ],
        },
      });
      if (player) {
        await sequelizeObjects.Friends.update(
          { FriendStatus: "Removed" },
          {
            where: {
              [Op.or]: [
                {
                  idMyPlayer: players[connectionId].playerDatabaseId,
                  idOtherPlayer: OtherPlayerID,
                },
                {
                  idMyPlayer: OtherPlayerID,
                  idOtherPlayer: players[connectionId].playerDatabaseId,
                },
              ],
            },
          }
        );
        
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "RemovedFriend",
            socketKey: socketKey,
            data: "",
          })
        );

        let connection = await sequelizeObjects.User.findOne({
          where: {
            id: OtherPlayerID
          }
        });
        
        if (connection) {
          if (players[connection.conn]) {
            players[connection.conn].connection.sendText(
              JSON.stringify({
                key: "RemovedFriend",
                socketKey: socketKey,
                data: "",
              })
            );
          }
        }
      }
    } catch (err) {
      logger.log("Error in onRemoveFriend: " + err);
    }
  } catch (error) {
    logger.log(error);
  }
}


function onSpinWheelAmountAdd(connectionId, socketKey, amount) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      let money = +players[connectionId].playersAllMoney + +amount;
      players[connectionId].playersAllMoney = money;
      dbUtils
        .UpdatePlayerMoneyPromise(
          sequelizeObjects,
          players[connectionId].playerDatabaseId,
          money
        )
        .then((results) => {
          responseArray.key = "AmountAdded";
          responseArray.code = 200;
          if (results.result) {
            results.user.udid = "";
          }
          responseArray.data = results;
          if (players[connectionId].connection !== null) {
            players[connectionId].connection.sendText(
              JSON.stringify(responseArray)
            );
          }
          cleanResponseArray();
          PlayerLevelDetails(connectionId);
        });
    } catch (err) {
      logger.log(err);
    }
  } catch (error) {
    logger.log(error);
  }
}

function OnAmountAdd(connectionId, socketKey, typeOfFreeAmount) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      let amount = 0;
      switch (typeOfFreeAmount) {
        case "InstaFollowAmount":
          amount = typeOfAmountValues.InstaFollowAmount;
          break;
        case "FacebookFollowAmount":
          amount = typeOfAmountValues.FacebookFollowAmount;
          break;
        case "TwitterFollowAmount":
          amount = typeOfAmountValues.TwitterFollowAmount;
          break;
        case "RateUsAmount":
          amount = typeOfAmountValues.RateUsAmount;
          break;
        case "WelcomeBonus":
          amount = typeOfAmountValues.WelcomeBonus;
          break;
      }
      let money =
        Number(players[connectionId].playersAllMoney) + Number(amount);
      players[connectionId].playersAllMoney = money;
      dbUtils
        .UpdatePlayerMoneyPromise(
          sequelizeObjects,
          players[connectionId].playerDatabaseId,
          money
        )
        .then((data) => {
          responseArray.key = "AmountUpdated";
          responseArray.code = 200;
          if (data.result) {
            data.user.udid = "";
          }
          responseArray.data = data.user.money.toString();
          if (players[connectionId].connection !== null) {
            players[connectionId].connection.sendText(
              JSON.stringify(responseArray)
            );
          }
          cleanResponseArray();
        });
    } catch (err) {
      logger.log(err);
    }
  } catch (error) {
    logger.log(error);
  }
}

function OnAmountAddDontHaveAccount(connectionId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      let amount = 50000;
      let money =
        Number(players[connectionId].playersAllMoney) + Number(amount);
      players[connectionId].playersAllMoney = money;
      dbUtils
        .UpdatePlayerMoneyPromise(
          sequelizeObjects,
          players[connectionId].playerDatabaseId,
          money
        )
        .then((data) => {
          responseArray.key = "AmountUpdated";
          responseArray.code = 200;
          if (data.result) {
            data.user.udid = "";
          }
          responseArray.data = data.user.money.toString();
          if (players[connectionId].connection !== null) {
            players[connectionId].connection.sendText(
              JSON.stringify(responseArray)
            );
          }
          cleanResponseArray();
        });
    } catch (err) {
      logger.log(err);
    }
  } catch (error) {
    logger.log(error);
  }
}

function onRequestRooms(
  playerName,
  connectionId,
  socketKey,
  roomId,
  roomSortParam
) {
  // logger.log(
  //   "Get room req; " +
  //     playerName +
  //     " " +
  //     connectionId +
  //     " " +
  //     socketKey +
  //     " " +
  //     roomId +
  //     " " +
  //     roomSortParam,
  //   logger.LOG_UNDERSCORE
  // );
  if (Number(roomId) === -1) {
    if (players[connectionId].socketKey === socketKey) {
      // New player
      if (players[connectionId].connection != null) {
        if (!players[connectionId].isLoggedInPlayer()) {
          players[connectionId].playerName =
            playerName !== "undefined" ? playerName : "Anon";
        }
      }
      responseArray.key = "getRooms";
      responseArray.data = [];
      if (roomSortParam == null) {
        roomSortParam = "all";
      }
      for (let i = 0; i < rooms.length; i++) {
        if (
          rooms[i].players.length + rooms[i].playersToAppend.length <
          config.games.holdEm.holdEmGames[rooms[i].holdemType].max_seats
        ) {
          switch (roomSortParam) {
            case "all":
              responseArray.data.push(rooms[i].getRoomInfo());
              break;
            case " ":
              if (rooms[i].holdemType === 0) {
                responseArray.data.push(rooms[i].getRoomInfo());
              }
              break;
            case "mediumBets":
              if (rooms[i].holdemType === 1) {
                responseArray.data.push(rooms[i].getRoomInfo());
              }
              break;
            case "highBets":
              if (rooms[i].holdemType === 2) {
                responseArray.data.push(rooms[i].getRoomInfo());
              }
              break;
          }
        }
      }
      //logger.log("Sending... " + JSON.stringify(responseArray));
      players[connectionId].connection.sendText(JSON.stringify(responseArray));
      cleanResponseArray();
    } else {
      logger.log("Socket key no match!", logger.LOG_UNDERSCORE);
    }
  }
}
// Player selected room to play in
function onPlayerSelectRoom(connectionId, socketKey, roomId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey, roomId }, true)) {
      try {
        let JoinRoom = true;

        if (
          rooms[roomId].players.length + rooms[roomId].playersToAppend.length <
          rooms[roomId].maxSeats
        ) {
          if (
            players[connectionId].playersAllMoney > rooms[roomId].maximumAmount
          ) {
            players[connectionId].playerMoney = rooms[roomId].maximumAmount;
            players[connectionId].playersAllMoney =
              +players[connectionId].playersAllMoney -
              +players[connectionId].playerMoney;
          } else if (
            players[connectionId].playersAllMoney < rooms[roomId].minimumAmount
          ) {
            JoinRoom = false;
            // send player message to add coins in wallet
          } else {
            players[connectionId].playerMoney =
              players[connectionId].playersAllMoney;
            players[connectionId].playersAllMoney = 0;
          }
          //players[connectionId].playerMoney = 200000;
          if (JoinRoom) {
            players[connectionId].connection.selectedRoomId = roomId; // Also set room id into connection object
            players[connectionId].selectedRoomId = roomId;
            players[connectionId].connectionId = connectionId;
            //players[connectionId].playersAllMoney = players[connectionId].playersAllMoney - players[connectionId].playerMoney;
            rooms[roomId].playersToAppend.push(players[connectionId]);
            console.log("player joined the room " + roomId)
            let response = { key: "", data: {} };
            response.key = "RoomSelected";
            response.data.roomId = roomId;
            players[connectionId].connection.sendText(JSON.stringify(response));
            // logger.log(
            //   players[connectionId].playerName + " selected room " + roomId
            // );
            const playersInRoom = rooms[roomId].players.length;
            //logger.log("Players in room: " + playersInRoom);
            const botPlayers = rooms[roomId].players.filter(player => player.isBot);
            if (playersInRoom < 1 && botPlayers.length === 0 && rooms[roomId].tableType === "public") {
              //logger.log( "Players in room: " + playersInRoom+ " and bots: " + botPlayers.length);
              serverCommand(connectionId, socketKey, "addBots", roomId, 1, process.env.SERVER_CMD_PASSWORD);
              //console.log("Added a bot in the room")
              serverCommand(connectionId, socketKey, "addBots", roomId, 1, process.env.SERVER_CMD_PASSWORD);
              //console.log("Added another bot in the room with delay")
            }
            rooms[roomId].triggerNewGame();
            try {
              rooms[roomId].betAmountStatus().then((result) => {
                players[connectionId].connection.sendText(
                  JSON.stringify({
                    key: "betAmountStatus",
                    data: result,
                  })
                );
                console.log("sent value is :" + result)

              });
            } catch (err) {
              logger.log(err);
            }
          }
        }
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}
function onPlayerAllInSelectRoom(connectionId, socketKey, roomId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey, roomId }, true)) {
      try {
        let JoinRoom = true;
        if (
          rooms[roomId].players.length + rooms[roomId].playersToAppend.length <
          rooms[roomId].maxSeats
        ) {
          if (
            players[connectionId].playersAllMoney > rooms[roomId].maximumAmount
          ) {
            players[connectionId].playerMoney = rooms[roomId].maximumAmount;
            players[connectionId].playersAllMoney =
              +players[connectionId].playersAllMoney -
              +players[connectionId].playerMoney;
          } else if (
            players[connectionId].playersAllMoney < rooms[roomId].minimumAmount
          ) {
            JoinRoom = false;
            // send player message to add coins in wallet
          } else {
            players[connectionId].playerMoney =
              players[connectionId].playersAllMoney;
            players[connectionId].playersAllMoney = 0;
          }
          //players[connectionId].playerMoney = 200000;
          if (JoinRoom) {
            players[connectionId].connection.selectedRoomId = roomId; // Also set room id into connection object
            players[connectionId].selectedRoomId = roomId;
            players[connectionId].connectionId = connectionId;
            //players[connectionId].playersAllMoney = players[connectionId].playersAllMoney - players[connectionId].playerMoney;
            rooms[roomId].playersToAppend.push(players[connectionId]);
            let response = { key: "", data: {} };
            response.key = "RoomSelected";
            response.data.roomId = roomId;
            players[connectionId].connection.sendText(JSON.stringify(response));
            // logger.log(
            //   players[connectionId].playerName + " selected room " + roomId
            // );
            const playersInRoom = rooms[roomId].players.length;
            //logger.log("Players in room: " + playersInRoom);
            const botPlayers = rooms[roomId].players.filter(player => player.isBot);
            if (playersInRoom < 1 && botPlayers.length === 0) {
              //logger.log( "Players in room: " + playersInRoom+ " and bots: " + botPlayers.length);
              serverCommand(connectionId, socketKey, "addBots", roomId, 1, process.env.SERVER_CMD_PASSWORD);
              console.log("Added a bot in the room")
              serverCommand(connectionId, socketKey, "addBots", roomId, 1, process.env.SERVER_CMD_PASSWORD);
              console.log("Added another bot in the room with delay")
            }
            rooms[roomId].triggerNewGame();
            try {
              rooms[roomId].betAmountStatus().then((result) => {
                players[connectionId].connection.sendText(
                  JSON.stringify({
                    key: "betAmountStatus",
                    data: result,
                  })
                );
                //console.log("sent value is :"+result)

              });
            } catch (err) {
              logger.log(err);
            }
          }
        }
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}

// Player leave room to go back to main menu
function onPlayerLeaveRoom(connectionId, socketKey, roomId) {
  try {
    logger.log(typeof players[connectionId].playersAllMoney + " " + typeof players[connectionId].playerMoney);
        let spectatorsTemp = [];
    players[connectionId].playersAllMoney = parseInt(players[connectionId].playersAllMoney) + parseInt(players[connectionId].playerMoney);
        players[connectionId].playerMoney = 0;
        if (
          players[connectionId].playersAllMoney >
          players[connectionId].biggestWallet
        ) {
          players[connectionId].biggestWallet =
            players[connectionId].playersAllMoney;
        }
        dbUtils
          .UpdatePlayerMoneyPromise(
            sequelizeObjects,
            players[connectionId].playerDatabaseId,
            players[connectionId].playersAllMoney
          )
      .then(() => { });
        rooms[roomId].playerFold(
          sequelizeObjects,
          connectionId,
          socketKey,
          true
        );
        rooms[roomId].LeaveRoom(connectionId, socketKey, players[connectionId]);
        rooms[roomId].sendStatusUpdate();
        const playerInRoom = rooms[roomId].players.filter(player => !player.isBot);
        const playerAppendInRoom = rooms[roomId].playersToAppend.filter(player => !player.isBot);
        const botPlayers = rooms[roomId].players.filter(player => player.isBot);
        //logger.log("Players in room: " + playerInRoom + " and bots: " + botPlayers);
    if (playerInRoom < 1 && playerAppendInRoom.length === 0 && botPlayers.length !== 0) {
          //logger.log("Removing bots from room: " + roomId + " and bots: " + botPlayers);
      serverCommand(connectionId, socketKey, "removeBots", roomId, 1, process.env.SERVER_CMD_PASSWORD);
        }
    if (players[connectionId]?.connection) {
          players[connectionId].connection.sendText(
            JSON.stringify({ key: "RoomLeft", data: { roomId: roomId } })
          );
        }
        //new changes
        // const playersInRoom = rooms[roomId].players.length;
        //     //logger.log("Players in room: " + playersInRoom);
        //     const botPlayers = rooms[roomId].players.filter(player => player.isBot);
        //     if (playersInRoom < 1 && botPlayers.length === 0 && rooms[roomId].tableType === "public") {
        //       //logger.log( "Players in room: " + playersInRoom+ " and bots: " + botPlayers.length);
        //       serverCommand(connectionId, socketKey, "addBots", roomId, 2,process.env.SERVER_CMD_PASSWORD);
        //     }  

       const nonBotPlayers = rooms[roomId].players.filter(player => !player.isBot);
       const botPlayers1 = rooms[roomId].players.filter(player => player.isBot);

      if (
          nonBotPlayers.length === 1 &&  // Exactly 1 human
          botPlayers1.length === 0 &&     // No bots currently
          rooms[roomId].tableType === "public"
         ) {
          // Add bots to keep the game going
        serverCommand(
          connectionId,
          socketKey,
          "addBots",
          roomId,
          2,
          process.env.SERVER_CMD_PASSWORD
        );
      }


  } catch (error) {
    logger.log(error);
  }
}
exports.onPlayerLeaveRoom = onPlayerLeaveRoom;
// Player select's room and gets room parameters with this function
function getRoomParameters(connectionId, socketKey, roomId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      if (isValidInput({ connectionId, socketKey, roomId }, true)) {
        console.log("room id is: " + roomId)
        const roomParams = rooms[roomId].getRoomParams();
        console.log("Room parameters being sent to client:", roomParams);
      
        players[connectionId].connection.sendText(
          JSON.stringify(roomParams)
        );
      }      
    } catch (err) {
      logger.log(err);
    }
  } catch (error) {
    logger.log(error);
  }
}
function initConsoleListener() {
  // noinspection JSUnusedLocalSymbols

  try {
    return new Promise(function (resolve, reject) {
      stDin.addListener("data", function (inputObj) {
        let i = 0;
        switch (inputObj.toString().trim()) {
          case "help":
            //logger.log("-- Available commands --");
            //logger.log("addBot   (adds bot to room 0)");
            //logger.log("addBots   (adds four more bots to room 0)");
            //logger.log("fillWithBots    (Fill all rooms with bots)");
            break;
          case "addBot":
            onAppendBot(0);
            break;
          case "addBots":
            onAppendBot(0);
            onAppendBot(0);
            onAppendBot(0);
            onAppendBot(0);
            break;
          case "fillWithBots":
            for (i = 0; i < 6; i++) {
              onAppendBot(0);
              onAppendBot(1);
              onAppendBot(2);
            }
            break;
          case "testXP":
            for (i = 0; i < players.length; i++) {
              eventEmitter.emit(
                "onXPGained",
                players[i].playerId,
                20,
                "testing xp function!"
              );
            }
            break;
        }
      });
      resolve();
    });
  } catch (err) {
    logger.log(err);
  }
}

// Sets player null and tries removing it from room
function playerConnectionSetNull(player_id) {
  try {
    if (players[player_id] != null) {
      dict[players[player_id].playerDatabaseId] = null;
      const pSelectedRoomId = players[player_id].selectedRoomId;
      if (pSelectedRoomId !== -1) {
        players[player_id].connection = null;
        rooms[pSelectedRoomId].triggerNewGame();
      } else {
        players[player_id].connection = null;
      }
    }
  } catch (err) {
    logger.log(err);
  }
}

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Create starting rooms
 * @returns {Promise}
 */
function createStartingRooms() {
  // noinspection JSUnusedLocalSymbols
  return new Promise(function (resolve, reject) {
    for (let i = 0; i < config.common.startingRooms; i++) {
      createRoom();
    }
    resolve();
  });
}

async function JoinOrcreateRoom(connectionId, socketKey, selection) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      let noRoomFound = true;
      let table = await sequelizeObjects.Tables.findOne({
        where: { tableId: selection, type: "public", display: true },
      });
      for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].holdemType == selection) {
          if (
            rooms[i].players.length + rooms[i].playersToAppend.length <
              table.max_seats &&
            rooms[i].tableType == "public"
          ) {
            // let response = {key: '', data: {}};
            // response.key = "RoomSelected";
            // response.data.roomId = rooms[i].roomId;
            if (players[connectionId].connection != null) {
              //players[connectionId].connection.sendText(JSON.stringify(response));
              onPlayerSelectRoom(connectionId, socketKey, rooms[i].roomId);
              getRoomParameters(connectionId, socketKey, rooms[i].roomId);
            }
            noRoomFound = false;
            break;
          }
        }
      }
      if (noRoomFound) {
        let newRoomId = rooms.length;
        const tabledata = await sequelizeObjects.Tables.findOne({
          where: { tableId: selection, type: "public" },
          attributes: ["minBet", "max_seats", "minPlayers", "turnCountdown", "minimumAmount", "maximumAmount", "typeName", "afterRoundCountdown"],
          raw: true
        })
        rooms.push(
          new room.Room(
            Number(selection),
            newRoomId,
            eventEmitter,
            sequelizeObjects,
            "public",
            -1,
            tabledata
          )
        );
        JoinOrcreateRoom(connectionId, socketKey, selection);
      }
    } catch (err) {
      logger.log(err);
    }
  } catch (error) {
    logger.log(error);
  }
}

async function CreatePrivateRoom(connectionId, socketKey, selection) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      let noRoomFound = true;
      for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].holdemType == selection) {
          if (
            rooms[i].players.length + rooms[i].playersToAppend.length <
            rooms[i].maxSeats &&
            rooms[i].tableType == "private" &&
            rooms[i].tableOwner == connectionId
          ) {
            // let response = {key: '', data: {}};
            // response.key = "RoomSelected";
            // response.data.roomId = rooms[i].roomId
            // players[connectionId].connection.sendText(JSON.stringify(response));
            onPlayerSelectRoom(connectionId, socketKey, rooms[i].roomId);
            getRoomParameters(connectionId, socketKey, rooms[i].roomId);
            noRoomFound = false;
            break;
          }
        }
      }
      if (noRoomFound) {
        let newRoomId = rooms.length;
        const tabledata = await sequelizeObjects.Tables.findOne({
          where: { tableId: selection, type: "private" },
          attributes: ["minBet", "max_seats", "minPlayers", "turnCountdown", "minimumAmount", "maximumAmount", "typeName", "afterRoundCountdown"],
          raw: true
        })
        rooms.push(
          new room.Room(
            Number(selection),
            newRoomId,
            eventEmitter,
            sequelizeObjects,
            "private",
            connectionId,
            tabledata
          )
        );
        CreatePrivateRoom(connectionId, socketKey, selection);
      }
    } catch (err) {
      logger.log(err);
    }
  } catch (error) {
    logger.log(error);
  }
}
async function JoinOrcreateAllInFoldRoom(connectionId, socketKey, playerID) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }

    // Fetch player data
    const player = await sequelizeObjects.User.findOne({
      where: { id: playerID },
      attributes: ["money", "Level"],
      raw: true,
    });

    if (!player) throw new Error(`Player not found: ${playerID}`);

    const playerMoney = parseInt(player.money);
    const playerLevel = player.Level;

    // Fetch all tables at once instead of iterating with queries
    const tables = await sequelizeObjects.Tables.findAll({
      where: { type: "allinorfold" },
      attributes: ["tableId", "minimumAmount", "maximumAmount", "level"],
      order: [["tableId", "ASC"]],
      raw: true,
    });

    if (!tables.length) {
      players[connectionId].connection.sendText(JSON.stringify({ key: "NoRoomFound" }));
      return;
    }

    // Find an eligible table in-memory instead of making queries in a loop
    let eligibleTableIndex = -1;
    for (const table of tables) {
      if (
        (playerMoney >= table.minimumAmount && playerMoney <= table.maximumAmount && playerLevel >= table.level) ||
        (playerMoney > table.maximumAmount && playerLevel >= table.level)
      ) {
        eligibleTableIndex = table.tableId;
      }
    }

    // If player's money is above the max of the last table, assign the last table
    const lastTable = tables[tables.length - 1];
    if (eligibleTableIndex === -1 && playerMoney > lastTable.maximumAmount && playerLevel >= lastTable.level) {
      eligibleTableIndex = lastTable.tableId;
    }

    if (eligibleTableIndex === -1) {
      players[connectionId].connection.sendText(JSON.stringify({ key: "NoRoomFound" }));
      return;
    }

    logger.log("eligibleTableIndex: " + eligibleTableIndex);

    // Check for an existing room
    let foundRoom = rooms.find(
      (room) => room.holdemType === eligibleTableIndex && room.tableType === "allinorfold"
    );

    if (foundRoom && foundRoom.players.length + foundRoom.playersToAppend.length < foundRoom.maxSeats) {
      onPlayerAllInSelectRoom(connectionId, socketKey, foundRoom.roomId);
      getRoomParameters(connectionId, socketKey, foundRoom.roomId);
    } else {
      // Create a new room if no suitable room found
      let newRoomId = rooms.length;
      const tabledata = await sequelizeObjects.Tables.findOne({
        where: { tableId: eligibleTableIndex, type: "allinorfold" },
        attributes: ["minBet", "max_seats", "minPlayers", "turnCountdown", "minimumAmount", "maximumAmount", "typeName", "afterRoundCountdown"],
        raw: true
      })
      rooms.push(
        new room.Room(
          Number(eligibleTableIndex),
          newRoomId,
          eventEmitter,
          sequelizeObjects,
          "allinorfold",
          -2,
          tabledata
        )
      );
      onPlayerAllInSelectRoom(connectionId, socketKey, newRoomId);
      getRoomParameters(connectionId, socketKey, newRoomId);
    }
  } catch (error) {
    logger.log(error);
  }
}
async function JoinOrcreateQuickplayRoom(connectionId, socketKey, playerID) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }

    // Fetch player data
    const player = await sequelizeObjects.User.findOne({
      where: { id: playerID },
      attributes: ["money", "Level"],
      raw: true,
    });

    if (!player) throw new Error(`Player not found: ${playerID}`);

    const playerMoney = parseInt(player.money);
    const playerLevel = player.Level;

    // Fetch all tables at once instead of iterating with queries
    const tables = await sequelizeObjects.Tables.findAll({
      where: { type: "public" },
      attributes: ["tableId", "minimumAmount", "maximumAmount", "level"],
      order: [["tableId", "ASC"]],
      raw: true,
    });

    if (!tables.length) {
      players[connectionId].connection.sendText(JSON.stringify({ key: "NoRoomFound" }));
      return;
    }

    // Find an eligible table in-memory instead of making queries in a loop
    let eligibleTableIndex = -1;
    for (const table of tables) {
      if (
        (playerMoney >= table.minimumAmount && playerMoney <= table.maximumAmount && playerLevel >= table.level) ||
        (playerMoney > table.maximumAmount && playerLevel >= table.level)
      ) {
        eligibleTableIndex = table.tableId;
      }
    }

    // If player's money is above the max of the last table, assign the last table
    const lastTable = tables[tables.length - 1];
    if (eligibleTableIndex === -1 && playerMoney > lastTable.maximumAmount && playerLevel >= lastTable.level) {
      eligibleTableIndex = lastTable.tableId;
    }

    if (eligibleTableIndex === -1) {
      players[connectionId].connection.sendText(JSON.stringify({ key: "NoRoomFound" }));
      return;
    }

    logger.log("eligibleTableIndex: " + eligibleTableIndex);

    // Check for an existing room
    let foundRoom = rooms.find(
      (room) => room.holdemType === eligibleTableIndex && room.tableType === "public"
    );

    if (foundRoom && foundRoom.players.length + foundRoom.playersToAppend.length < foundRoom.maxSeats) {
      onPlayerSelectRoom(connectionId, socketKey, foundRoom.roomId);
      getRoomParameters(connectionId, socketKey, foundRoom.roomId);
    } else {
      // Create a new room if no suitable room found
      const tabledata = await sequelizeObjects.Tables.findOne({
        where: { tableId: eligibleTableIndex, type: "public" },
        attributes: ["minBet", "max_seats", "minPlayers", "turnCountdown", "minimumAmount", "maximumAmount", "typeName", "afterRoundCountdown"],
        raw: true
      })
      let newRoomId = rooms.length;
      rooms.push(
        new room.Room(
          Number(eligibleTableIndex),
          newRoomId,
          eventEmitter,
          sequelizeObjects,
          "public",
          -1,
          tabledata
        )
      );
      onPlayerSelectRoom(connectionId, socketKey, newRoomId);
      getRoomParameters(connectionId, socketKey, newRoomId);
    }
  } catch (error) {
    logger.log(error);
  }
}

/**
 * Create new room
 * responsible for setting room settings
 * and for injecting bots
 */
function createRoom() {
  try {
    let newRoomId = rooms.length;
    let betTypeCount = { lowBets: 0, mediumBets: 0, highBets: 0 };
    for (let i = 0; i < rooms.length; i++) {
      switch (rooms[i].holdemType) {
        case 0:
          betTypeCount.lowBets = betTypeCount.lowBets + 1;
          break;
        case 1:
          betTypeCount.mediumBets = betTypeCount.mediumBets + 1;
          break;
        case 2:
          betTypeCount.highBets = betTypeCount.highBets + 1;
          break;
      }
    }
    let roomType = Object.keys(betTypeCount).sort(function (a, b) {
      return betTypeCount[a] - betTypeCount[b];
    });
    let type = 0;
    switch (roomType[0]) {
      case "lowBets":
        type = 0;
        break;
      case "mediumBets":
        type = 1;
        break;
      case "highBets":
        type = 2;
        break;
    }
    rooms.push(
      new room.Room(Number(type), newRoomId, eventEmitter, sequelizeObjects)
    );
    logger.log("CREATE ROOM WITH TYPE: " + type + " AND ID: " + newRoomId);

    // Append bots according to common config
    let b = 0;
    if (newRoomId === 0) {
      for (b = 0; b < config.common.roomZeroBotCount; b++) {
        onAppendBot(newRoomId);
      }
    }
    if (newRoomId === 1) {
      for (b = 0; b < config.common.roomOneBotCount; b++) {
        onAppendBot(newRoomId);
      }
    }
    if (newRoomId === 2) {
      for (b = 0; b < config.common.roomTwoBotCount; b++) {
        onAppendBot(newRoomId);
      }
    }
    if (newRoomId >= 3) {
      for (b = 0; b < config.common.roomOthersBotCount; b++) {
        onAppendBot(newRoomId);
      }
    }
  } catch (err) {
    logger.log(err);
  }
}

// Check rooms states
function checkRooms() {
  logger.log("-- Checking rooms --");
  let boolCreateRoom = true;
  for (let i = 0; i < rooms.length; i++) {
    if (rooms[i].players.length + rooms[i].playersToAppend <= 4) {
      boolCreateRoom = false;
    }
  }
  if (boolCreateRoom) {
    logger.log("--- Created new room ---");
    createRoom();
  }
}

// Append new bot on selected room
async function onAppendBot(roomId) {
  if (!rooms[roomId]) {
    return;
  }
  let connection = Math.floor(Math.random() * 1000);
  connection = await getUniqueConnectionId(connection);
  if (Number(rooms[roomId].playersToAppend.length + rooms[roomId].players.length) < Number(rooms[roomId].maxSeats)) {
    players[connection] = new player.Player(
      -1,
      null,
      connection,
      config.games.holdEm.bot.startMoney,
      true
    );

    if (players[connection]) {
      if (config.games.holdEm.bot.giveRealNames) {
        const currentBotNames = rooms[roomId].players
          .filter((player) => player.isBot)
          .map((playerObj) => playerObj.playerName);

        players[connection].playerName = utils.getRandomBotName(currentBotNames);
        players[connection].profileImageLink = await getRandomImageLink();
        players[connection].playerDatabaseId = Math.floor(Math.random() * 1000);
        players[connection].isBot = true;
        players[connection].playerWinCount = Math.floor(Math.random() * 1000);
        players[connection].playerLoseCount = Math.floor(Math.random() * 1000);
        players[connection].biggestHand = Math.floor(Math.random() * 1000000);
        players[connection].biggestWallet = players[connection].playerMoney;
        players[connection].preflop = Math.floor(Math.random() * 1000);
        players[connection].flop = Math.floor(Math.random() * 1000);
        players[connection].turn = Math.floor(Math.random() * 1000);
        players[connection].river = Math.floor(Math.random() * 1000);
        players[connection].Level = Math.floor(Math.random() * 20) + 1;
        players[connection].BestCards = "[{\"value\":\"A\",\"suit\":\"s\",\"rank\":13,\"wildValue\":\"A\"},{\"value\":\"K\",\"suit\":\"s\",\"rank\":12,\"wildValue\":\"K\"},{\"value\":\"Q\",\"suit\":\"d\",\"rank\":11,\"wildValue\":\"Q\"},{\"value\":\"J\",\"suit\":\"d\",\"rank\":10,\"wildValue\":\"J\"},{\"value\":\"T\",\"suit\":\"s\",\"rank\":9,\"wildValue\":\"T\"}]";
      } else {
        players[connection].playerName = "Bot" + Math.floor(Math.random() * 1000);
      }
      if (parseInt(players[connection].playersAllMoney) > parseInt(rooms[roomId].maximumAmount)) {
        players[connection].playerMoney = rooms[roomId].maximumAmount;
        players[connection].playersAllMoney = parseInt(players[connection].playersAllMoney) - parseInt(players[connection].playerMoney);
      }
      rooms[roomId].playersToAppend.push(players[connection]);
      rooms[roomId].triggerNewGame();
      connection += 1;
    } else {
      logger.log("Player object creation failed for connectionId:", connection);
    }
  } else {
    logger.log("Too many players on room " + roomId + " so cannot append more bots from command.");
    delete rooms[roomId];
  }
}


// Event fired from room when new bot is needed
eventEmitter.on("needNewBot", function (roomId) {
  //logger.log("Appending new bot into room: " + roomId, logger.LOG_CYAN);
  onAppendBot(roomId);
});

function initServerStatusCheckInterval() {
  try {
    // noinspection JSUnusedLocalSymbols
    return new Promise(function (resolve, reject) {
      statusCheckInterval = setInterval(function () {
        logger.log("Running server status check script", logger.LOG_CYAN);
      }, 30 * 1000); // Every minute
      resolve();
    });
  } catch (err) {
    logger.log(err);
  }
}
function removeBots(roomId) {
  if (!rooms[roomId]) {
    logger.log(`Room ${roomId} does not exist.`);
    return;
  }

  // Filter out bot players
  const botPlayers = rooms[roomId].players.filter(player => player.isBot);

  if (botPlayers.length === 0) {
    //logger.log(`No bots found in room ${roomId}.`);
    return;
  }

  // Remove bot players from the room and players object
  botPlayers.forEach(bot => {
    delete players[bot.connectionId]; // Remove bot from global players list
  });

  // Keep only non-bot players in the room
  rooms[roomId].players = rooms[roomId].players.filter(player => !player.isBot);

  //logger.log(`Removed ${botPlayers.length} bots from room ${roomId}.`);

  // If needed, trigger an update in the game state
  rooms[roomId].triggerNewGame();
}
function removeOneBot(roomId) {
  if (!rooms[roomId]) {
    logger.log(`Room ${roomId} does not exist.`);
    return;
  }

  // Find the first bot in the room
  const botIndex = rooms[roomId].players.findIndex(player => player.isBot);

  if (botIndex === -1) {
    //logger.log(`No bots found in room ${roomId}.`);
    return;
  }

  // Remove the bot from the global players list
  const bot = rooms[roomId].players[botIndex];
  delete players[bot.connectionId];
  delete rooms[roomId].players[bot.connectionId];
  // Remove the bot from the room's player list
  rooms[roomId].players.splice(botIndex, 1);

  //logger.log(`Removed one bot from room ${roomId}.`);

  // If needed, trigger an update in the game state
  rooms[roomId].triggerNewGame();
}
// Server commands
function serverCommand(connectionId, socketKey, line1, line2, line3, password) {
  try {
    if (password === process.env.SERVER_CMD_PASSWORD) {
      let boolResult = true;
      switch (line1) {
        case "addBots":
          for (let i = 0; i < Number(line3); i++) {
            onAppendBot(line2);
          }
          break;
        case "removeBots":
          removeBots(line2);
          break;
        case "removeOneBots":
          removeOneBot(line2);
        default:
          boolResult = false;
          break;
      }
      serverCommandResult(connectionId, socketKey, boolResult, line1);
    }
  } catch (err) {
    logger.log(err);
  }
}
exports.serverCommand = serverCommand;

// Send command back as response of successful run
function serverCommandResult(connectionId, socketKey, boolResult, line1) {
  try {
    if (isValidInput({ connectionId, socketKey })) {
      responseArray.key = "serverCommandResult";
      responseArray.data = { boolResult: boolResult, command: line1 };
      players[connectionId].connection.sendText(JSON.stringify(responseArray));
      cleanResponseArray();
    }
  } catch (err) {
    logger.log(err);
  }
}

function LinkClicked(connectionId, socketKey, id, dataType) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        dbUtils
          .UpadteUserData(sequelizeObjects, id, dataType, 1)
          .then((result) => {
            if (players[connectionId].connection !== null) {
              responseArray.key = "LinkClickedData";
              responseArray.data = result;
              players[connectionId].connection.sendText(
                JSON.stringify(responseArray)
              );
              cleanResponseArray();
            }
          })
          .catch(() => { });
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (err) {
    logger.log(err);
  }
}
async function LeaderBoard(connectionId, socketKey, playerID) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      const claim = await leaderboard.LeaderBoard(playerID);
      if (claim) {
        return claim;
      }

  }
 } catch (err) {
    logger.log(err);
  }
}

function LinkResponseDone(connectionId, socketKey, id, dataType) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        dbUtils
          .UpadteUserData(sequelizeObjects, id, dataType, 2)
          .then((result) => {
            if (players[connectionId].connection !== null) {
              responseArray.key = "LinkResponseData";
              responseArray.data = JSON.stringify(result);
              players[connectionId].connection.sendText(
                JSON.stringify(responseArray)
              );
              cleanResponseArray();
            }
          })
          .catch(() => { });
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (err) {
    logger.log(err);
  }
}

function LinkResponseDotHaveAccount(connectionId, socketKey, id, dataType) {
  if (isValidInput({ connectionId, socketKey })) {
    try {
      dbUtils
        .UpadteUserData(sequelizeObjects, id, dataType, 5)
        .then((result) => {
          if (players[connectionId].connection !== null) {
            responseArray.key = "LinkResponseDotHaveAccount";
            responseArray.data = JSON.stringify(result);
            players[connectionId].connection.sendText(
              JSON.stringify(responseArray)
            );
            cleanResponseArray();
            OnAmountAddDontHaveAccount(connectionId);
          }
        })
        .catch(() => { });
    } catch (err) {
      logger.log(err);
    }
  }
}

async function setLoggedInUserParametersUNITY(
  connectionId,
  socketKey,
  userid,
  udid,
  platform
) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        const user = await sequelizeObjects.User.findOne({
          where: { id: userid },
        });
        if (user) {
          const banStatus = await checkBanStatus(user);
          if (banStatus && banStatus.banned) {
            const formattedDuration = banStatus.duration
              ? new Date(banStatus.duration).toLocaleString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : null;

            const message = banStatus.permanent
              ? "You are permanently banned from the game."
              : `You are banned from the game until ${formattedDuration}.`;

            if (notificationService) {
              notificationService.sendBanNotification(connectionId, message, players);
            }
            return;
          } else if (banStatus.warning) {
            if (notificationService) {
              notificationService.sendWarningNotification(connectionId, banStatus.message, players);
            }
          }
        }

        // Fetch and set player parameters
        const result = await dbUtils.GetLoggedInUserParametersPromiseUnity(
          sequelizeObjects,
          parseInt(userid),
          udid
        );

        if (!result) {
          logger.log(
            "Failed to retrieve user parameters for setLoggedInUserParametersUNITY."
          );
          return;
        }

        // Initialize or update the player's session
        players[connectionId].playerDatabaseId = result.id;
        players[connectionId].playerName = result.name;
        players[connectionId].playerMoney = 0;
        players[connectionId].playersAllMoney = result.money;
        players[connectionId].playerWinCount = result.win_count;
        players[connectionId].playerLoseCount = result.lose_count;
        players[connectionId].biggestHand = result.biggestHand;
        players[connectionId].biggestWallet = result.BiggestWalletEver;
        players[connectionId].profileImageLink = result.profileImageLink;
        players[connectionId].xp = result.xp;
        players[connectionId].platform = platform;
        players[connectionId].Level = result.Level;
        if (platform === 'Android') user.update({ platform: "Android" });
        if (platform === 'IPhonePlayer') user.update({ platform: "IPhonePlayer" });
        // logger.log(
        //   `player biggest hand is ${players[connectionId].biggestHand}`
        // );
        // Map player's ID to their connection ID
        dict[result.id] = connectionId;

        // Prepare and send response
        responseArray.key = "loggedInUserParamsResultUnity";
        responseArray.data = { result: true, moneyLeft: result.money };
        players[connectionId].connection.sendText(
          JSON.stringify(responseArray)
        );
        getImageLinks(connectionId, socketKey, parseInt(userid));
        popups.assignPopups(players[connectionId].playerDatabaseId, players[connectionId].platform)
        cleanResponseArray();
      } catch (err) {
        logger.log(`Error in setLoggedInUserParametersUNITY: ${err.message}`);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}

eventEmitter.on(
  "onXPGained",
  function (connectionId, xpGainedAmount, xpMessage) {
    try {
      if (!players[connectionId] || !players[connectionId].connection) {
        throw new Error(`Invalid connectionId: ${connectionId}`);
      }
      try {
        if (
          players[connectionId].connection !== null &&
          players[connectionId].isLoggedInPlayer()
        ) {
          responseArray.key = "onXPGained";
          responseArray.code = 200;
          responseArray.data = {
            xpGainedAmount: xpGainedAmount,
            xpMessage: xpMessage,
          };
          players[connectionId].connection.sendText(
            JSON.stringify(responseArray)
          );
          cleanResponseArray();
          players[connectionId].xp =
            parseInt(players[connectionId].xp) + parseInt(xpGainedAmount);
          PlayerLevelDetails(connectionId);
        }
      } catch (err) {
        logger.log(err);
      }
    } catch (error) {
      logger.log(error);
    }
  }
);

// Get playerinfo
async function getMyPlayerInfo(connectionId, socketKey, playerId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        const results = await dbUtils.GetPlayerInfoPromise(sequelizeObjects, playerId);
        if (players[connectionId].connection !== null) {
          // logger.log(
          //   results.user.BiggestWalletEver + "   " + results.user.money
          // );
          if (
            parseInt(results.user.BiggestWalletEver) <
            parseInt(results.user.money)
          ) {
            await dbUtils.UpdatePlayerMoneyPromise(
              sequelizeObjects,
              players[connectionId].playerDatabaseId,
              parseInt(results.user.money)
            );
            // Call the function again after updating the money
            await getMyPlayerInfo(connectionId, socketKey, playerId);
          } else {
            responseArray.key = "returnPlayerInfo";
            responseArray.code = 200;
            results.user.udid = "";
            responseArray.data = results;
            players[connectionId].connection.sendText(
              JSON.stringify(responseArray)
            );
            if (!results.user.welcomeBonus) {
              const welcomeBonus = await sequelizeObjects.BonusValues.findOne();
              players[connectionId].connection.sendText(
                JSON.stringify({ key: "welcomeBonus", data: welcomeBonus.WelcomeBonus })
              );
            }
            cleanResponseArray();
          }
          await PlayerLevelDetails(connectionId);
          await LeaderBoardReward(connectionId, socketKey, playerId);
          await RewardVIPUser(connectionId, socketKey, playerId);
        }
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}

async function LeaderBoardReward(connectionId, socketKey, playerId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
     const claim = await leaderboard.LeaderBoardReward(playerId);
      if (claim) {
      players[connectionId].connection.sendText(
        JSON.stringify({
          key: "LeaderBoardReward",
          Name: claim.Name,
          Rank: claim.Rank,
          isCollected: claim.isCollected,
          reward: claim.reward,
          EventName: claim.EventName,
          EventId: claim.EventId,
        })
      );
     }
    }
  } catch (error) {
    logger.log(error);
  }
}
async function RewardVIPUser(connectionId, socketKey, playerId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        let user = await sequelizeObjects.RewardVIPUser.findOne({
          where: { userId: playerId, isCollected: false },
        });
        if (user) {
          let rewardUser = await sequelizeObjects.User.findOne({
            where: { id: playerId },
          });
          if (rewardUser) {
            if (parseInt(user.Chips) > 0) {
              rewardUser.money =
                parseInt(rewardUser.money) + parseInt(user.Chips);
              players[connectionId].playersAllMoney = rewardUser.money;
              await rewardUser.save();
              user.isCollected = true;
              user.save();
            }
            if (parseInt(user.Spinner) > 0) {
              let userGameStats = await sequelizeObjects.UserGameStats.findOne({
                where: { PlayerId: playerId },
              });
              if (userGameStats) {
                userGameStats.SpinnerInfo =
                  parseInt(userGameStats.SpinnerInfo) + parseInt(user.Spinner);
                await userGameStats.save();
                user.isCollected = true;
                user.save();
              }
            }
            players[connectionId].connection.sendText(
              JSON.stringify({
                key: "RewardVIPUser",
                isCollected: user.isCollected,
                chips: user.Chips,
                spinner: user.Spinner,
                Image: user.Image,
              })
            );
          }
        } else {
          return;
        }
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}
async function collectLeaderBoardReward(connectionId, socketKey, playerId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      const claim = await leaderboard.collectLeaderBoardReward(playerId)
      if (claim) {
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "collectLeaderBoardReward",
            isCollected: claim.isCollected,
            reward: claim.reward,
          })
        )
      }
    }
  } catch (error) {
    logger.log(error);
  }
}

// Special function for development
function getSelectedPlayerChartData(connectionId, socketKey, playerId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        dbUtils
          .GetPlayerChartDataPromise(sequelizeObjects, playerId)
          .then((results) => {
            if (players[connectionId].connection !== null) {
              responseArray.key = "getPlayerChartDataResult";
              responseArray.code = 200;
              responseArray.data = results.ranks;
              players[connectionId].connection.sendText(
                JSON.stringify(responseArray)
              );
              cleanResponseArray();
            }
          })
          .catch(() => { });
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}

// ---------------------------------------------------------------------------------------------------------------------

/**
 * @param {object} input
 * @param {number|null} input.connectionId
 * @param input.socketKey
 * @param {number} [input.roomId]
 * @param {boolean} [validateRoomId]
 * @return {boolean}
 */
function isValidInput({ connectionId, socketKey, roomId }, validateRoomId) {
    try {
      if (players[connectionId].connection === null) {
        return false;
      }
      if (players[connectionId].socketKey !== socketKey) {
        return false;
      }
      if (validateRoomId && !rooms[roomId]) {
        return false;
      }
      return true;
    } catch (err) {
      logger.log(err);
    }
}

function cleanResponseArray() {
  responseArray = { key: "", code: 200, data: [] };
}
// ---------------------------------------------------------------------------------------------------------------------

function UpdatePlayerbiggestHandPromise(userId, money) {
  try {
    dbUtils.UpdatePlayerbiggestHandPromise(sequelizeObjects, userId, money);
  } catch (err) {
    logger.log(err);
  }
}
exports.UpdatePlayerbiggestHandPromise = UpdatePlayerbiggestHandPromise;

// Function to calculate the level based on the given XP
function calculateLevel(xp) {
  const a = 0.1; // Leveling curve constant
  const b = 1; // Leveling curve constant
  return Math.floor(a * Math.sqrt(xp) + b);
}

// Function to calculate the XP required to reach the next level
function calculateXPToNextLevel(currentLevel) {
  const a = 0.1; // Leveling curve constant
  const b = 1; // Leveling curve constant
  return Math.pow((currentLevel + 1 - b) / a, 2);
}
function handleQueries(
  connectionId,
  socketKey,
  userId,
  fullname,
  email,
  phone,
  message
) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        dbUtils
          .handleQueriesPromise(
            sequelizeObjects,
            userId,
            fullname,
            email,
            phone,
            message
          )
          .then((results) => {
            if (players[connectionId].connection !== null) {
              responseArray.key = "Query Sent";
              responseArray.code = 200;
              responseArray.data = results;
              players[connectionId].connection.sendText(
                JSON.stringify(responseArray)
              );
              cleanResponseArray();
            }
          });
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}
exports.handleQueries = handleQueries;

function handleReports(
  connectionId,
  socketKey,
  playerId,
  toReportplayerId,
  Reportfilter,
  email,
  message
) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        dbUtils
          .handleReportpromise(
            sequelizeObjects,
            playerId,
            toReportplayerId,
            Reportfilter,
            email,
            message
          )
          .then((results) => {
            if (players[connectionId].connection !== null) {
              responseArray.key = "Report Sent";
              responseArray.code = 200;
              responseArray.data = results;
              players[connectionId].connection.sendText(
                JSON.stringify(responseArray)
              );
              cleanResponseArray();
            }
          });
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}
async function dailyRewards(connectionId, socketKey, playerId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        const claim = await bonus.claimDailyReward(playerId);
        //logger.log(claim.reward.reward__chips);
        players[connectionId].playersAllMoney =
          parseInt(players[connectionId].playersAllMoney) +
          parseInt(claim.reward.reward__chips);
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "DailyRewardClaimed",
            data: claim,
          })
        );
        VerifydailyRewards(connectionId, socketKey, playerId);
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}

async function VerifydailyRewards(connectionId, socketKey, playerId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        const reward = await bonus.getUserStatus(playerId);
        players[connectionId].connection.sendText(
          JSON.stringify({ key: "DailyRewardStatus", data: reward })
        );
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}
async function getDailyBonusList(connectionId, socketKey, playerId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }

    if (isValidInput({ connectionId, socketKey })) {
      try {
        // Fetch player's reward progress
        const playerProgress = await bonus.getUserStatus(playerId);
        const dayLimit = 7;
        const totalDays = 28; // Total number of days before resetting
        const rewardProgress = playerProgress.bonus.rewardProgress || 0; // Default to 0 if no progress

        // Ensure the reward progress resets after 28 days
        const effectiveProgress = rewardProgress % totalDays;

        // Calculate the starting index for the rewards
        const rewardStartIndex =
          Math.floor(effectiveProgress / dayLimit) * dayLimit;

        // Fetch only the next set of 7 rewards starting from rewardStartIndex
        const reward = await sequelizeObjects.DailyBonusList.findAll({
          limit: dayLimit,
          offset: rewardStartIndex,
          order: [["day", "ASC"]],
        });

        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "DailyBonusList",
            data: reward,
          })
        );
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}

async function onInAppPurchase(
  connectionId,
  socketKey,
  playerId,
  productId,
  productprice
) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        let spinCount = 0;
        let Reward = 0;
        let vipPoints = 0;
        let product = await sequelizeObjects.InAppProducts.findOne({
          where: { product_ID: productId },
        });

        if (product) {
          // Handle the purchase
          await dbUtils.handleInAppPurchasePromise(
            sequelizeObjects,
            playerId,
            productId,
            productprice
          );

          let User = await sequelizeObjects.User.findOne({
            where: { id: playerId },
          });
          const vipLevel = await sequelizeObjects.VipMembership.findOne({
            where: { level: User.vipLevel },
          });
          if (User) {
            /*    const multiplier = calculateInAppMultiplier(parseInt(User.Level)); */
            Reward =
              parseInt(product.chips) * (1 + vipLevel.purchaseBonus / 100);
            /*  * multiplier */ if (Reward > 0) {
              let UserMoney = parseInt(User.money) + Reward;
              players[connectionId].playersAllMoney = UserMoney;
              await User.update({ money: UserMoney });
            }

            spinCount += parseInt(product.spinner);
            if (spinCount > 0) {
              let userGameStats = await sequelizeObjects.UserGameStats.findOne({
                where: { PlayerId: playerId },
              });
              if (userGameStats) {
                userGameStats.SpinnerInfo =
                  parseInt(userGameStats.SpinnerInfo) + spinCount;
                await userGameStats.save();
              }
            }
            vipPoints = Math.round(productprice * 100);
            if (vipPoints > 0) {
              User.vipPoints = parseInt(User.vipPoints) + vipPoints;
              // Update VIP Membership based on VIP Points
              let currentVipMembership =
                await sequelizeObjects.VipMembership.findOne({
                  where: { RequiredPoints: { [Op.lte]: User.vipPoints } },
                  order: [["RequiredPoints", "DESC"]],
                });

              //logger.log("Current VIP Level:" + currentVipMembership);

              // Fetch the next level VIP membership
              let nextVipMembership =
                await sequelizeObjects.VipMembership.findOne({
                  where: { level: currentVipMembership.level + 1 },
                });

              //logger.log("Next VIP Level:" + nextVipMembership);

              if (
                nextVipMembership &&
                User.vipPoints >= nextVipMembership.RequiredPoints
              ) {
                // User qualifies for the next level
                User.vipLevel = nextVipMembership.level;
                User.membersince = new Date();
                players[connectionId].nextcardReached = true;
              } else if (
                currentVipMembership &&
                User.vipLevel < currentVipMembership.level
              ) {
                // User qualifies for the current highest eligible level
                User.vipLevel = currentVipMembership.level;
                User.membersince = new Date();
                players[connectionId].nextcardReached = true;
              } else {
                // User remains on the same level
                players[connectionId].nextcardReached = false;
              }
              await User.save();
            }
          }

          // Check if the user is eligible for a free product
          if (product.relatedFreeProductId) {
            let freeProduct = await sequelizeObjects.InAppProducts.findOne({
              where: { id: product.relatedFreeProductId },
            });
            if (freeProduct) {
              // Send a message that this product is now available for the user to claim
              players[connectionId].connection.sendText(
                JSON.stringify({
                  key: "InAppPurchaseFreeProductAvailable",
                  productName: freeProduct.productname,
                })
              );
            }
          }

          let Room = players[connectionId].selectedRoomId;
          if (Room !== -1) {
            OnPlayerJoinRoom(connectionId, socketKey, Room);
          }

          players[connectionId].connection.sendText(
            JSON.stringify({
              key: "InAppPurchase",
              productName: product.productname,
              chips: Reward,
              spinCount: spinCount,
            })
          );
        }
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}
async function claimFreeProduct(
  connectionId,
  socketKey,
  playerId,
  freeProductId
) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        let spinCount = 0;
        let Reward = 0;
        let freeProduct = await sequelizeObjects.InAppProducts.findOne({
          where: { product_ID: freeProductId },
        });
        if (freeProduct) {
          let parentProduct = await sequelizeObjects.InAppProducts.findOne({
            where: { id: freeProduct.relatedFreeProductId },
          });
          let purchasedProduct = await sequelizeObjects.InAppPurchase.findOne({
            where: { userId: playerId, productID: parentProduct.product_ID },
            order: [["createdAt", "DESC"]],
          });

          if (purchasedProduct && !purchasedProduct.hasClaimedFreeProduct) {
            // Mark the free product as claimed
            purchasedProduct.hasClaimedFreeProduct = true;
            await purchasedProduct.save();

            // Reward the free product to the user
            let User = await sequelizeObjects.User.findOne({
              where: { id: playerId },
            });
            if (User) {
              const multiplier = calculateInAppMultiplier(parseInt(User.Level));
              Reward = parseInt(freeProduct.chips) * multiplier;

              if (Reward > 0) {
                let UserMoney = parseInt(User.money) + Reward;
                players[connectionId].playersAllMoney = UserMoney;
                await User.update({ money: UserMoney });
              }

              spinCount += parseInt(freeProduct.spinner);
              if (spinCount > 0) {
                let userGameStats =
                  await sequelizeObjects.UserGameStats.findOne({
                    where: { PlayerId: playerId },
                  });
                if (userGameStats) {
                  userGameStats.SpinnerInfo =
                    parseInt(userGameStats.SpinnerInfo) + spinCount;
                  await userGameStats.save();
                }
              }
            }

            players[connectionId].connection.sendText(
              JSON.stringify({
                key: "InAppPurchase",
                productName: freeProduct.productname,
                chips: Reward,
                spinCount: spinCount,
              })
            );
          } else {
            players[connectionId].connection.sendText(
              JSON.stringify({
                key: "InAppPurchaseError",
                message: "You cannot claim this free product yet.",
              })
            );
          }
        }
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}
async function checkBanStatus(user) {
  try {
    if (user.DropUser) {
      const now = new Date();
      if (user.banDuration && now > user.banDuration) {
        user.DropUser = false;
        user.banDuration = null;
        await user.save();
      } else if (user.VipStatus) {
        return {
          warning: true,
          message: "Warning: You may be banned next time.",
        };
      } else {
        return {
          banned: true,
          permanent: !user.banDuration,
          duration: user.banDuration,
        };
      }
    }
    return false;
  } catch (err) {
    logger.log(err);
  }
}

async function isFreeSpinAvailable(connectionId, socketKey, userId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
          let claim = await slotMachine.isFreeSpinAvailable(userId)
        if (claim.initialbet > 0) {
            players[connectionId].connection.sendText(
              JSON.stringify({
                key: "SlotMachineStatus",
                Message: claim.message,
                initialbet: claim.initialbet,
              })
            );
        } else {
            players[connectionId].connection.sendText(
              JSON.stringify({
                key: "SlotMachineStatus",
                Message: claim.message,
                initialbet: claim.initialbet,
              })
            );
          }
      } catch (err) {
        logger.log(err);
      }
  }
  } catch (error) {
    logger.log(error);
  }
}

async function playSlotMachine(connectionId, socketKey, userId, initialbet) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        let claim = await slotMachine.playSlotMachine(userId, initialbet, players[connectionId])
        if (!claim) {
          players[connectionId].connection.sendText(
            JSON.stringify({
              key: "SlotMachine",
              Message: "Free spin is not available",
            })
          );
        } else {
          players[connectionId].connection.sendText(
            JSON.stringify({
              key: "SlotMachine",
              handName: claim.handName,
              rewardMultiplier: claim.rewardMultiplier,
              cards: claim.cards,
              freeSpin: claim.freeSpin,
            })
          );
        }
      } catch (error) {
        logger.log(error);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}

async function getPopuplist(connectionId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }

    const platform = players[connectionId].platform;
    const claim = await popups.getPopuplist(platform);
    if (claim) {
      players[connectionId].connection.sendText(
        JSON.stringify({
          key: "PopupList",
          data: claim.popupList,
        })
      );
    }
    
  } catch (error) {
    logger.log(error);
  }
}
async function displaylistPopup(connectionId, socketKey, PlayerID) {
  try {
    const player = players[connectionId];
    if (!player?.connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (!isValidInput({ connectionId, socketKey })) return;
    const claim = await popups.displaylistPopup(PlayerID);
    if (claim) {
      player.connection.sendText(JSON.stringify(claim));
      //logger.log(JSON.stringify(claim));
    }
  } catch (error) {
    logger.log(error);
  }
}
async function displayPopup(connectionId, socketKey, PlayerID) {
  try {
    const player = players[connectionId];
    if (!player?.connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (!isValidInput({ connectionId, socketKey })) return;
    const claim = await popups.displayPopup(PlayerID);
    if (claim) {
      player.connection.sendText(JSON.stringify(claim));
    }
  } catch (error) {
    logger.log(error);
  }
}
async function collectPopup(connectionId, socketKey, popupId, userId, dataType) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      const claim = await popups.collectPopup(popupId, userId, dataType, players[connectionId])
      if (claim) {
        players[connectionId].connection.sendText(
          JSON.stringify(claim)
        )
      }
    }
  } catch (error) {
    logger.log(error);
  }
}

async function dontAcoountPopup(connectionId, socketKey, popupId, userId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      const claim = await popups.dontAcoountPopup(popupId, userId, players[connectionId]);
      if (claim) {
        players[connectionId].connection.sendText(
          JSON.stringify(claim)
        )
      }
    }
  } catch (error) {
    logger.log(error);
  }
}

async function popupInfo(connectionId, socketKey, popupId, userId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      const claims = await popups.popupInfo(popupId, userId)
      if (claims) {
        players[connectionId].connection.sendText(JSON.stringify(claims))
      }
    }
  } catch (error) {
    logger.log(error);
  }
}

async function collectWelcomeBonus(connectionId, socketKey, userId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        const welcomeBonus = await sequelizeObjects.BonusValues.findOne();
        const Reward = parseInt(welcomeBonus.WelcomeBonus);
        const user = await sequelizeObjects.User.findOne({
          where: { id: userId },
        });
        if (user) {
          if (!user.welcomeBonus) {
            user.welcomeBonus = true;
            user.money = parseInt(user.money) + parseInt(Reward);
            players[connectionId].playersAllMoney = user.money;
            await user.save();
            players[connectionId].connection.sendText(
              JSON.stringify({
                key: "AmountUpdated",
                Bonus: Reward,
              })
            );
          } else {
            players[connectionId].connection.sendText(
              JSON.stringify({
                key: "AmountUpdated",
                Bonus: 0,
              })
            );
          }
        }
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}

async function collectReferralBonus(connectionId, socketKey, userId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      console.log(`[collectReferralReward] Invalid connectionId: ${connectionId}`);
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }

    //console.log(`[collectReferralReward] Valid connection for userId: ${userId}`);

    if (isValidInput({ connectionId, socketKey })) {
      //console.log(`[collectReferralReward] Input validated for connectionId: ${connectionId}, socketKey: ${socketKey}`);

      try {
        const rewardRecord = await sequelizeObjects.ReferralReward.findOne({
          where: {
            refereeId: userId,
            refereeRewardStatus: "pending",
          },
        });

        console.log(`[collectReferralReward] ReferralReward record:`, rewardRecord ? rewardRecord.dataValues : null);

        const user = await sequelizeObjects.User.findByPk(userId);
        if (!user) {
          console.log(`[collectReferralReward] User not found with ID: ${userId}`);
          throw new Error(`User not found: ${userId}`);
        }

        if (rewardRecord) {
          const rewardAmount = parseInt(rewardRecord.refereeReward || 0);
          console.log(`[collectReferralReward] Crediting user ${userId} with reward: ${rewardAmount}`);

          user.money = parseInt(user.money) + rewardAmount;
          players[connectionId].playersAllMoney = user.money;
          rewardRecord.refereeRewardStatus = "credited";

          await Promise.all([user.save(), rewardRecord.save()]);
          console.log("ref reward amount is:" + rewardAmount)

          players[connectionId].connection.sendText(
            JSON.stringify({
              key: "AmountUpdated",
              data: user.money,
            })
          );

          console.log(`[collectReferralReward] Reward credited and message sent to connection ${connectionId}`);
        } else {
          console.log(`[collectReferralReward] No referral reward for user ${userId}`);
          // players[connectionId].connection.sendText(
          //   JSON.stringify({
          //     key: "AmountUpdated",
          //     Data: 0,
          //   })
          // );
        }
      } catch (err) {
        console.error(`[collectReferralReward] Internal try-catch error:`, err);
      }
    } else {
      console.log(`[collectReferralReward] Invalid input for connectionId: ${connectionId}`);
    }
  } catch (error) {
    console.error(`[collectReferralReward] Outer catch error:`, error);
  }
}

async function collectReferrerStatsAndCredit(connectionId, socketKey, userId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      console.log(`[collectReferrerStats] ❌ Invalid connectionId: ${connectionId}`);
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }

    if (isValidInput({ connectionId, socketKey })) {
      try {
        // Step 1: Find all pending rewards for referrer
        const pendingRewards = await sequelizeObjects.ReferralReward.findAll({
          where: {
            referrerId: userId,
            referrerRewardStatus: "pending",
          },
        });

        const rewardCount = pendingRewards.length;
        const totalRewardAmount = pendingRewards.reduce((sum, reward) => {
          return sum + parseInt(reward.referrerReward || 0);
        }, 0);

        console.log(`[collectReferrerStats] ✅ Found ${rewardCount} pending rewards. Total amount: ${totalRewardAmount}`);

        if (rewardCount === 0) {
          // players[connectionId].connection.sendText(
          //   JSON.stringify({
          //     key: "ReferrerRewardStats",
          //     data: {
          //       pendingCount: 0,
          //       totalPendingAmount: 0,
          //       message: "No pending rewards to credit.",
          //     },
          //   })
          // );
          return;
        }

        // Step 2: Fetch user and update money
        const user = await sequelizeObjects.User.findByPk(userId);
        if (!user) {
          console.log(`[collectReferrerStats] ❌ User not found: ${userId}`);
          throw new Error(`User not found: ${userId}`);
        }

        console.log(`[collectReferrerStats] 💰 Before update - user money: ${user.money}`);
        user.money = parseInt(user.money || 0) + totalRewardAmount;
        players[connectionId].playersAllMoney = user.money;

        console.log(`[collectReferrerStats] 💰 After update - user money: ${user.money}`);

        // Step 3: Update reward statuses
        for (const reward of pendingRewards) {
          reward.referrerRewardStatus = "credited";
        }

        // Step 4: Save all changes
        await Promise.all([
          user.save(),
          ...pendingRewards.map((reward) => reward.save()),
        ]);

        console.log(`[collectReferrerStats] ✅ All rewards marked as credited.`);

        // Step 5: Notify client
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "ReferrerRewardStats",
            data: {
              pendingCount: rewardCount,
              totalPendingAmount: totalRewardAmount,
              message: "Rewards credited successfully.",
            },
          })
        );
        

        console.log(`[collectReferrerStats] 🚀 Stats sent to client for userId ${userId}`);
      } catch (err) {
        console.error(`[collectReferrerStats] ❌ Internal error during reward processing:`, err);
      }
    } else {
      console.log(`[collectReferrerStats] ❌ Invalid input for connectionId: ${connectionId}`);
    }
  } catch (error) {
    console.error(`[collectReferrerStats] ❌ Outer catch error:`, error);
  }
}


async function handleUserBan(connectionId, userID) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      const user = await sequelizeObjects.User.findOne({
        where: { id: userID },
      });
      if (user) {
        const banStatus = await checkBanStatus(user);
        if (banStatus) {
          if (banStatus.banned) {
            const message = banStatus.permanent
              ? "You are permanently banned from the game."
              : `You are banned from the game until ${banStatus.duration}.`;

            if (notificationService) {
              notificationService.sendBanNotification(connectionId, message, players);
            }
            return;
          } else if (banStatus.warning) {
            if (notificationService) {
              notificationService.sendWarningNotification(connectionId, banStatus.message, players);
            }
          }
        }
      }
    } catch (err) {
      logger.log(err);
    }
  } catch (error) {
    logger.log(error);
  }
}

async function inAppPurchasedisplay(connectionId, socketKey, userId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        const products = await sequelizeObjects.InAppProducts.findAll({
          attributes: [
            "id",
            "productname",
            "product_ID",
            "lastPrice",
            "lastChips",
            "productPrice",
            "chips",
            "spinner",
          ],
          raw: true,
        });

        let user = await sequelizeObjects.User.findOne({
          where: { id: userId },
        });
        const dynamicrewards = await getDynamicInAppRewardList(
          products,
          user.vipLevel ? user.vipLevel : 0
        );
        // Check if the user has any free product claims
        let purchasedProducts = await sequelizeObjects.InAppPurchase.findAll({
          where: { userId: userId },
          order: [["createdAt", "DESC"]],
        });
        for (let product of dynamicrewards) {
          let purchased = purchasedProducts.find(
            (p) => p.productID === product.product_ID
          );
          if (purchased) {
            let freeProduct = await sequelizeObjects.InAppProducts.findOne({
              where: { relatedFreeProductId: product.id },
            });
            if (freeProduct && !purchased.hasClaimedFreeProduct) {
              product.freeProduct = freeProduct.product_ID;
              product.isFree = true; // Add free product info to response
            }
          }
        }

        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "InAppPurchasedisplay",
            products: dynamicrewards,
          })
        );
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}

async function getPopupEvent(connectionId, socketKey, userId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        const popups = await sequelizeObjects.PopupEvent.findAll();
        const currentTime = new Date();

        const popupEventsWithRemainingTime = popups.map((popup) => {
          const lastAssignedAt = popup.endTime;
          const timePassed = currentTime - lastAssignedAt;
          let remainingTime = 48 * 60 * 60 * 1000 - timePassed;
          remainingTime = remainingTime / 1000; // Convert to seconds
          return {
            popup: popup.name,
            remainingTime: remainingTime > 0 ? remainingTime : 48 * 60 * 60,
            isVisible: popup.isActive, // Ensure no negative remaining time
          };
        });

        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "PopupEvents",
            events: popupEventsWithRemainingTime,
          })
        );
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}


// async function getPopupEvent(connectionId, socketKey, userId) {
//   try {
//     if (!players[connectionId] || !players[connectionId].connection) {
//       throw new Error(`Invalid connectionId: ${connectionId}`);
//     }
//     if (isValidInput({ connectionId, socketKey })) {
//       try {
//         // Send null/empty events - no popup events will be shown
//         players[connectionId].connection.sendText(
//           JSON.stringify({
//             key: "PopupEvents",
//             events: [], // Empty array - no events
//           })
//         );
//       } catch (err) {
//         logger.log(err);
//       }
//     }
//   } catch (error) {
//     logger.log(error);
//   }
// }


async function displayDynamicRewardList(connectionId, socketKey, userId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        //   previous values for spinner(16)
        //   const baseRewardList = [
        //   15000, 150000, 22000, 350000, 280000, 100000, 10000, 120000, 90000,
        //   80000, 70000, 25000, 50000, 40000, 30000, 20000,
        // ];
        const baseRewardList = [
          250000, 269000, 465000, 450000, 353000, 438000, 3110000, 523000, 248000,
          607000
        ];

        // Get the dynamic list based on the player's level
        let playerLevel = await sequelizeObjects.User.findOne({
          where: { id: userId },
        });
        const dynamicRewardList = getDynamicRewardList(
          baseRewardList,
          playerLevel.Level
        );

        // Display the dynamic reward list

        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "DynamicSpinnerList",
            List: dynamicRewardList,
          })
        ); // Optionally return the list if needed
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}

// Function to calculate dynamic reward list based on player level
function getDynamicRewardList(baseList, level) {
  const multiplier = calculateMultiplier(level);
  return baseList.map((reward) => reward * multiplier);
}
async function getDynamicInAppRewardList(baseList, Level) {
  /* const multiplier = calculateInAppMultiplier(level); */
  let vipReward = await sequelizeObjects.VipMembership.findOne({
    where: { level: Level },
  });
  let multiplier = 1 + vipReward.purchaseBonus / 100;
  return baseList.map((product) => {
    return {
      ...product,
      chips: Math.floor(product.chips * multiplier),
    };
  });
}
function calculateInAppMultiplier(level) {
  // Example: for every 10 levels, multiply rewards by 1.5x
  return 1 + Math.floor(level / 10) * 0.5;
}
// Function to calculate multiplier based on level
function calculateMultiplier(level) {
  // Example: for every 10 levels, multiply rewards by 1.5x
  return 1 + Math.floor(level / 10) * 1.5;
}

async function displayVIPDynamicRewardList(connectionId, socketKey, userId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        //previously added spinner rewards list
        const baseRewardList = [
          2500000, 4000000, 7500000, 2900000, 8500000, 2200000, 5000000, 735000,
          7000000, 3400000, 4500000, 1500000, 12000000, 17000000, 3900000,
          3850000,
        ];
      

        // Get the dynamic list based on the player's level
        let playerLevel = await sequelizeObjects.User.findOne({
          where: { id: userId },
        });
        const dynamicRewardList = getDynamicRewardList(
          baseRewardList,
          playerLevel.Level
        );

        // Display the dynamic reward list

        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "DynamicVIPSpinnerList",
            List: dynamicRewardList,
          })
        ); // Optionally return the list if needed
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}

async function collectSpinner(connectionId, socketKey, userId, amount) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        const user = await sequelizeObjects.User.findOne({
          where: { id: userId },
        });
        if (user) {
          let userMoney = parseInt(user.money);
          userMoney = userMoney + amount;
          user.update({ money: userMoney });
          players[connectionId].connection.sendText(
            JSON.stringify({
              key: "SpinnerCollected",
              userId: userId,
              amount: amount,
            })
          );
        }
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}
async function setAvatarIndex(
  connectionId,
  socketKey,
  userId,
  index,
  username,
  name,
  countrycode
) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }

    if (isValidInput({ connectionId, socketKey })) {
      try {
        logger.log(`username:${username}` + typeof username, logger.LOG_YELLOW);
        const user = await sequelizeObjects.User.findOne({
          where: { id: userId },
        });
              
        let existingUsername = null;
        if (username) {
          existingUsername = await sequelizeObjects.User.findOne({
            where: { username: username, id: { [Op.ne]: userId } },
          });
        }
        if (!user) {
          throw new Error(`User not found with ID: ${userId}`);
        }

        if (existingUsername && existingUsername.id !== userId) {
          // Generate 5 username suggestions
          const suggestions = Array.from(
            { length: 5 },
            () => `${username}${Math.floor(Math.random() * 10000)}`
          );

          players[connectionId].connection.sendText(
            JSON.stringify({
              key: "UsernameExists",
              suggestions,
            })
          );
          return;
        }
        
        // Update only fields with different values
        const updatedFields = {};

        if (user.username.toString() !== username.toString()) {
          updatedFields.username = username;
          user.usernameCounter = parseInt(user.usernameCounter) - 1;
          updatedFields.usernameCounter = user.usernameCounter;
        }
        if (user.name !== name) updatedFields.name = name;
        if (user.profileImageLink !== index) updatedFields.profileImageLink = index;
        if (user.countrycode !== countrycode) updatedFields.countrycode = countrycode;
        

        if (Object.keys(updatedFields).length > 0) {
          await user.update(updatedFields);
        }

        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "AvatarIndexSet",
            userId,
            index,
            username,
            name,
            countrycode
          })
        );
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}
async function getAvatarIndex(connectionId, socketKey, userId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        const user = await sequelizeObjects.User.findOne({
          where: { id: userId },
        });
        if (user) {
          players[connectionId].connection.sendText(
            JSON.stringify({
              key: "AvatarIndexGet",
              userId: userId,
              index: user.profileImageLink,
              username: user.username,
              name: user.name,
              countrycode: user.countrycode
            })
          );
        }
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}

async function getImageLinks(connectionId, socketKey, userId) {
  try {
    // Validate connection
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }

    if (isValidInput({ connectionId, socketKey })) {
      try {
        // Fetch user data from the database
        let user = await sequelizeObjects.User.findOne({
          where: { id: userId },
        });

        if (!user) {
          throw new Error(`User not found for userId: ${userId}`);
        }

        // Read all image files from the directory
        const files = fs.readdirSync(imagesFolder);

        // Filter image files
        const imageFiles = files.filter((file) =>
          [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(
            path.extname(file).toLowerCase()
          )
        );

        // Create an array of URLs for each image
        const imageLinks = imageFiles.map((file) => `${baseURL}${file}`);

        // Send data via WebSocket
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "ImageLinks",
            userId: userId,
            links: imageLinks,
            googleProfile: user.googleProfileImageLink || "null",
            facebookProfile: user.facebookProfileImageLink || "null",
          })
        );
      } catch (error) {
        logger.log(
          "Error reading image files or fetching user data: " + error.message
        );
        return [];
      }
    }
  } catch (error) {
    logger.log("General Error: " + error.message);
  }
}

async function getRandomImageLink() {
  try {
    // Read all image files from the directory
    const files = fs.readdirSync(imagesFolder);

    // Filter image files
    const imageFiles = files.filter((file) =>
      [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(
        path.extname(file).toLowerCase()
      )
    );

    if (imageFiles.length === 0) {
      throw new Error("No images found in the directory.");
    }

    // Return a single random image link
    const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
    return `${baseURL}${randomImage}`;
  } catch (error) {
    console.error("Error fetching random image link:", error.message);
    return null;
  }
}

async function tableStatus(connectionId, socketKey, playerId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }

    if (isValidInput({ connectionId, socketKey })) {
      let Room = players[connectionId].selectedRoomId;
      if (Room !== -1) {
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "tablestatus",
            inRoom: true,
          })
        );
      } else {
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "tablestatus",
            inRoom: false,
          })
        );
      }
    }
  } catch (err) {
    logger.log(err);
  }
}

async function gameState(connectionId, socketKey, playerId, gamestate) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        logger.log(`User is in ${gamestate} state`);
        if (gamestate == "mainmenu") {
          startPong(connectionId);
        } else {
          stopPong(connectionId);
        }
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (err) {
    logger.log(err);
  }
}

function startPong(connectionId) {
  try {
    const player = players[connectionId];
    if (!player || !player.connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }

    const conn = player.connection;

    // Prevent multiple ping intervals for the same connection
    if (conn.pingInterval) {
      return;
    }

    conn.pingInterval = setInterval(() => {
      try {
        // Re-check if player and connection still exist
        const currentPlayer = players[connectionId];
        if (!currentPlayer || !currentPlayer.connection) {
          clearInterval(conn.pingInterval);
          return;
        }

        const currentConn = currentPlayer.connection;

        if (!currentConn.isAlive) {
          logger.log(`Connection ID ${connectionId} is unresponsive, closing.`);
          
          try {
            if (currentConn.readyState === currentConn.OPEN) {
              currentConn.sendText(JSON.stringify({ key: "quitgame" }));
            }
          } catch (sendErr) {
            logger.log(`Send error: ${sendErr.message}`);
          }

          clearInterval(currentConn.pingInterval);

          try {
            currentConn.close();
          } catch (closeErr) {
            logger.log(`Close error: ${closeErr.message}`);
          }

          // Clean up player reference
          delete players[connectionId];

          return;
        }

        // Mark as not alive, will be reset to true on pong
        currentConn.isAlive = false;

        if (currentConn.readyState === currentConn.OPEN) {
          currentConn.sendText(JSON.stringify({ key: "pong" }));
        }
      } catch (err) {
        logger.log(`Ping interval error for ${connectionId}: ${err.message}`);
      }
    }, 45000);
  } catch (err) {
    logger.log(`startPong error: ${err.message}`);
  }
}

function stopPong(connectionId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    try {
      if (players[connectionId].connection.pingInterval) {
        clearInterval(players[connectionId].connection.pingInterval);
        players[connectionId].connection.isAlive = true;
        pong = null;
        logger.log("Pong Stopped");
      }
    } catch (err) {
      logger.log(err);
    }
  } catch (err) {
    logger.log(err);
  }
}

async function setSettingState(
  connectionId,
  socketKey,
  userId,
  music,
  sound,
  vibration,
  autoRebuy
) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        const setting = await sequelizeObjects.UserSetting.findOne({
          where: { userId: userId },
        });
        if (setting) {
          setting.music = music;
          setting.sound = sound;
          setting.vibration = vibration;
          setting.autoRebuy = autoRebuy;
          await setting.save();
          getSettingState(connectionId, socketKey, userId);
        } else {
          await sequelizeObjects.UserSetting.create({
            userId: userId,
            music: music,
            sound: sound,
            vibration: vibration,
            autoRebuy: autoRebuy,
          });
          getSettingState(connectionId, socketKey, userId);
        }
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (err) {
    logger.log(err);
  }
}

async function getSettingState(connectionId, socketKey, userId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        const setting = await sequelizeObjects.UserSetting.findOne({
          where: { userId: userId },
        });
        if (setting) {
          players[connectionId].connection.sendText(
            JSON.stringify({
              key: "SettingState",
              userId: userId,
              music: setting.music,
              sound: setting.sound,
              vibration: setting.vibration,
              autoRebuy: setting.autoRebuy,
            })
          );
        } else {
          await sequelizeObjects.UserSetting.create({
            userId: userId,
            music: true,
            sound: true,
            vibration: true,
            autoRebuy: true,
          });
          getSettingState(connectionId, socketKey, userId);
        }
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (err) {
    logger.log(err);
  }
}
function updatefactimereward(connectionId, socketKey, amount) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        players[connectionId].playersAllMoney =
          parseInt(players[connectionId].playersAllMoney) + parseInt(amount);
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (err) {
    logger.log(err);
  }
}

exports.updatefactimereward = updatefactimereward;

async function rewardFacetime(connectionId, socketKey, userId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }

    if (isValidInput({ connectionId, socketKey })) {
      try {
        let facetimeReward = await faceTimeManager.calculateReward();
        let totaltime = faceTimeManager.calculateTotalTime();
        totaltime = totaltime / 1000;

        // Initialize subsession count to 0
        let subsession = 0;
        let factime = false;
        let claim = await sequelizeObjects.FaceTimeClaims.count({
          where: {
            userId: userId,
            claimedAt: {
              [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within the last 24 hours
            },
          },
        });
        if (claim >= 3) {
          factime = false
        } else {
          factime = true
        }
        // Fetch the session
        let session = await sequelizeObjects.FaceTimeSession.findOne({
          where: {
            userId: userId,
            isCompleted: null,
            createdAt: { [Op.gte]: new Date(new Date() - 24 * 60 * 60 * 1000) },
          },
          order: [["createdAt", "DESC"]],
        });

        if (session) {
          // If session exists, calculate the subsession count
          subsession = await sequelizeObjects.FaceTimeSubSession.count({
            where: { sessionId: session.sessionId, isCompleted: true },
          });
        } else {
          logger.log(`No active session found for userId: ${userId}`);
        }

        // Send the response
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "Reward_Facetime_reward",
            data: facetimeReward,
            totaltime: totaltime,
            subsession: subsession,
            facetime: factime
          })
        );
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (err) {
    logger.log(err);
  }
}

async function getPlayerProfile(connectionId, socketKey, playerId) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        dbUtils
          .GetPlayerInfoPromise(sequelizeObjects, playerId)
          .then((results) => {
            if (players[connectionId].connection !== null) {
              // logger.log(
              //   results.user.BiggestWalletEver + "   " + results.user.money
              // );
              if (
                parseInt(results.user.BiggestWalletEver) <
                parseInt(results.user.money)
              ) {
                dbUtils
                  .UpdatePlayerMoneyPromise(
                    sequelizeObjects,
                    players[connectionId].playerDatabaseId,
                    parseInt(results.user.money)
                  )
                  .then((data) => {
                    getPlayerProfile(connectionId, socketKey, playerId);
                  });
              } else {
                responseArray.key = "getPlayerProfile";
                responseArray.code = 200;
                results.user.udid = "";
                responseArray.data = results;
                players[connectionId].connection.sendText(
                  JSON.stringify(responseArray)
                );
                cleanResponseArray();
              }
              PlayerLevelDetails(connectionId);
            }
          })
          .catch(() => { });
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}
async function VIPMembership(
  connectionId,
  socketKey,
  playerId,
  nextcardReached1
) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        const Vip = await sequelizeObjects.VipMembership.findAll({
          attributes: ["Name", "RequiredPoints", "level", "purchaseBonus"],
        });
        if (Vip.length > 0) {
          const User = await sequelizeObjects.User.findOne({
            where: { id: playerId },
          });
          const usercard = await sequelizeObjects.VipMembership.findOne({
            where: { level: User.vipLevel },
          });
          const nexttoreach = await sequelizeObjects.VipMembership.findOne({
            where: { level: User.vipLevel + 1 },
          });
          const nexttoreachRequiredPoints = nexttoreach
            ? nexttoreach.RequiredPoints
            : usercard.RequiredPoints;
          const nexttoreachName = nexttoreach ? nexttoreach.Name : usercard.Name;
          const nexttoreachBonus = nexttoreach ? nexttoreach.purchaseBonus : usercard.purchaseBonus; 
          let levelraised = false;
          if (nextcardReached1) {
            levelraised = true;
            players[connectionId].nextcardReached = false;
          }
          if (usercard) {
            players[connectionId].connection.sendText(
              JSON.stringify({
                key: "VIPMembership",
                data: Vip,
                usercard: usercard.Name,
                level: User.vipLevel,
                VipPoints: User.vipPoints,
                currentBonus: usercard.purchaseBonus,
                username: User.name,
                membersince: User.membersince,
                nexttoreach: nexttoreachRequiredPoints,
                nexttoreachName: nexttoreachName,
                nexttoreachbonus: nexttoreachBonus,
                levelraised: levelraised,
              })
            );
          }
        }
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}
async function setContactsList(connectionId, socketKey, playerId, contacts) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
      try {
        const users = await sequelizeObjects.User.findAll({
          attributes: ["id", "name", "number", "profileImageLink"],
        });

        //logger.log(JSON.stringify(contacts));
        let matchedContacts = [];
        let unmatchedContacts = [];
        let alreadySentRequests = [];

        for (const [contactName, contactDetails] of Object.entries(contacts)) {
          let isMatched = false;
          let matchedUser = null;

          for (let i = 0; i < users.length; i++) {
            if (
              contactDetails.numbers &&
              contactDetails.numbers.includes(users[i].number)
            ) {
              isMatched = true;
              matchedUser = users[i];
              break;
            }
          }

          if (isMatched && matchedUser) {
            const existingFriend = await sequelizeObjects.Friends.findOne({
              where: {
                idMyPlayer: playerId,
                idOtherPlayer: matchedUser.id,
                FriendStatus: "Request",
              },
            });

            if (existingFriend) {
              alreadySentRequests.push({
                contactName: contactName,
                contactDetails: contactDetails,
                UserInformation: matchedUser,
              });
            } else {
              matchedContacts.push({
                contactName: contactName,
                contactDetails: contactDetails,
                UserInformation: matchedUser,
              });
            }
          } else {
            unmatchedContacts.push({
              contactName: contactName,
              contactDetails: contactDetails,
            });
          }
        }
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "setContactsList",
            matchedContacts: matchedContacts,
            alreadySentRequests: alreadySentRequests,
            unmatchedContacts: unmatchedContacts,
          })
        );
      } catch (err) {
        logger.log(err);
      }
    }
  } catch (error) {
    logger.log(error);
  }
}

async function rewardAd(connectionId, socketKey, playerId, xp) {
  try {
    if (!players[connectionId] || !players[connectionId].connection) {
      throw new Error(`Invalid connectionId: ${connectionId}`);
    }
    if (isValidInput({ connectionId, socketKey })) {
        const user = await sequelizeObjects.User.findOne({
          where: { id: playerId },
        })
        user.xp = parseInt(user.xp) + parseInt(xp);
        players[connectionId].xp = user.xp;
        await user.save();
        players[connectionId].connection.sendText(
        JSON.stringify({
          key: "rewardAd",
            xp: user.xp
           })
        );
    }
  } catch (error) {
    logger.log(error);
  }

}

function SendDelayedMessageFunction() {
  setTimeout(() => {
    const message = {
      notification: {
        title: 'Welcome to Wawe Poker Face',
        body: 'Now you have enabled notifications from WAWE Poker Face! \nYou will receive updates and important information about the game.'
      },
      token: 'dbmbt_dMQPOfEj1AByRO4z:APA91bFBDYIFlPMWhC_1KoNeRHmi4xN3qM16MMNksM6womCPPL0GNTmUpxe4FW1EHVDY7n2VE1zk97oCob2wznwO25PhjVXkAfrI5yE3aBD-XNEKcRsZre0'
    };
    admin.messaging().send(message)
      .then((response) => {
        console.log('Successfully sent message:', response);
        
      })
      .catch((error) => {
        console.error('Error sending message:', error);
        
      });
  }, 5000); // 5 seconds
};