// Player states
Player.PLAYER_STATE_NON = 0;
Player.PLAYER_STATE_FOLD = 1;
Player.PLAYER_STATE_CHECK = 2;
Player.PLAYER_STATE_RAISE = 3;

const logger = require('./logger');
// Constructor
function Player(conn, socketKey, connection_id, player_money, isBot, version) {
  this.isBot = isBot;
  this.connection = conn; // Connection object to player
  this.socketKey = socketKey;
  this.playerId = connection_id; // Connection id
  this.playerDatabaseId = -1; // Use this to detect logged in player
  this.selectedRoomId = -1;
  this.playerName = null;
  this.profileImageLink=null;
  this.playerMoney = player_money;
  this.playersAllMoney = player_money;
  this.playerWinCount = 0;
  this.disconnected = false;
  this.cleanupTimeout = null;
  this.lastDisconnectTime=null;
  this.playerLoseCount = 0;
  this.playerCards = [];
  this.playerState = Player.PLAYER_STATE_NON;
  this.totalBet = 0;
  this.isDealer = false;
  this.isPlayerTurn = false;
  this.playerTimeLeft = 0;
  this.isFold = false;
  this.isCheck = false;
  this.isAllIn = false;
  this.roundPlayed = false;
  this.handValue = 0;
  this.handName = '';
  this.BestCards = "";
  this.bestHandValue = 0;
  this.bestHandName = '';
  this.cardsInvolvedOnEvaluation = [];
  this.biggestHand = 0;
  this.biggestWallet =0;
  this.xp =0;
  this.nextcardReached = false;
  this.platform = null;
  this.preflop = 0;
  this.flop = 0;
  this.turn = 0;
  this.river = 0;
  this.Level = 0;
  this.version = version || "1";
  this.session = {
    id: null,
    status: "inactive", // active / disconnected / force_expired
    startTime: null,
    endTime: null,
  };
}

exports.Player = Player;

Player.prototype.resetParams = function () {
  this.playerCards = [];
  this.totalBet = 0;
  this.isPlayerTurn = false;
  this.playerTimeLeft = 0;
  this.isFold = false;
  this.isAllIn = false;
  this.handValue = 0;
  this.handName = '';
  this.cardsInvolvedOnEvaluation = [];
  this.isDealer = false;
};


Player.prototype.checkFunds = function (roomMinBet) {
  if (this.playerMoney < roomMinBet) {
    this.setStateFold();
  }
};


Player.prototype.isLoggedInPlayer = function () {
  // noinspection RedundantIfStatementJS
  if (this.playerDatabaseId === -1) {
    return false;
  } else {
    return true;
  }
};


// noinspection JSUnusedGlobalSymbols
Player.prototype.setPlayerMoney = function (amount) {
  this.playerMoney = amount;
};


// Class method
// noinspection JSUnusedGlobalSymbols
Player.prototype.setStateNon = function () {
  this.playerState = Player.PLAYER_STATE_NON;
};

Player.prototype.setStateFold = function () {
  this.playerState = Player.PLAYER_STATE_FOLD;
  this.isFold = true;
  this.playerTimeLeft = 0;
  this.isPlayerTurn = false;
  this.roundPlayed = true;
};

Player.prototype.setStateCheck = function () {
  this.playerState = Player.PLAYER_STATE_CHECK;
  this.playerTimeLeft = 0;
  this.isPlayerTurn = false;
  this.roundPlayed = true;
};

Player.prototype.setStateRaise = function () {
  this.playerState = Player.PLAYER_STATE_RAISE;
  this.playerTimeLeft = 0;
  this.isPlayerTurn = false;
  this.roundPlayed = true;
};
