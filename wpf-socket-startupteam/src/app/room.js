/**
 * Core logic for Texas Hold'em room game
 * this file may be renamed in future when other game types are implemented
 */

const config = require('../../config');
const dbUtils = require('../database/dbUtils');
const utils = require('./utils');
const logger = require('./logger');
let poker = require('./poker');
let player = require('./player');
let evaluator = require('./evaluator');
let bot = require('./bot');
let pokerSolver = require('pokersolver').Hand;
const Sequelize = require('sequelize');
let gameSpeedFactor =1;
const holdem = require('../../holdem');
const { Op} = require('sequelize');
const { parse } = require('path');




// Socket states
const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;

// Player action names for last action update
const PLAYER_ACTION_CHECK = 'CHECK';
const PLAYER_ACTION_CALL = 'CALL';
const PLAYER_ACTION_RAISE = 'RAISE';
const PLAYER_ACTION_FOLD = 'FOLD';

// Game stages
Room.HOLDEM_STAGE_ONE_HOLE_CARDS = 0;
Room.HOLDEM_STAGE_TWO_PRE_FLOP = 1;
Room.HOLDEM_STAGE_THREE_THE_FLOP = 2;
Room.HOLDEM_STAGE_FOUR_POST_FLOP = 3;
Room.HOLDEM_STAGE_FIVE_THE_TURN = 4;
Room.HOLDEM_STAGE_SIX_THE_POST_TURN = 5;
Room.HOLDEM_STAGE_SEVEN_THE_RIVER = 6;
Room.HOLDEM_STAGE_EIGHT_THE_SHOW_DOWN = 7;
Room.HOLDEM_STAGE_NINE_SEND_ALL_PLAYERS_CARDS = 8;
Room.HOLDEM_STAGE_TEN_RESULTS = 9;

const handRanking = {
'high card': 1,
'pair': 2,
'two pair': 3,
'three of a kind': 4,
'straight': 5,
'flush': 6,
'full house': 7,
'four of a kind': 8,
'straight flush': 9,
'royal flush': 10
};

// Map card ranks to values (Aces high)
const cardRankings = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  'T': 10, // Assuming 'T' represents 10
  'J': 11,
  'Q': 12,
  'K': 13,
  'A': 14
};
// Constructor
function Room(holdemType, number, eventEmitter, sequelizeObjects,table_Type,table_Owner,tableData) {
  this.holdemType = holdemType; // Number
  this.roomId = number;
  this.tableOwner = table_Owner;
  this.eventEmitter = eventEmitter;
  this.sequelizeObjects = sequelizeObjects;
  this.roomMinBet = tableData.minBet;
  this.roomName = 'Room ' + number;
  this.maxSeats = tableData.max_seats;
  this.minPlayers = tableData.minPlayers;
  this.turnTimeOut = tableData.turnCountdown * 1000 * gameSpeedFactor;
  this.minimumAmount = parseInt(tableData.minimumAmount);
  this.maximumAmount = parseInt(tableData.maximumAmount);
  this.tableStakes = tableData.typeName;
  this.currentStage = Room.HOLDEM_STAGE_ONE_HOLE_CARDS;
  this.holeCardsGiven = false;
  this.afterRoundCountdown = tableData.afterRoundCountdown;
  this.totalPot = 0;
  this.bots = [];
  this.players = []; // Players in this room playing
  this.playersToAppend = []; // Players waiting to get into game
  this.playersTemp = []; // Move old players here before next turn and from here back to players FIRST before playersToAppend
  this.spectators = []; // Spectators
  this.spectatorsTemp = []; // For cleaning out null connections
  this.deck = null;
  this.deckCard = 0;
  this.deckSize = 52; // Stock 52
  this.deckCardsBurned = 0; // How many cards are burned
  this.middleCards = [];
  this.gameStarted = false;
  this.turnTimeOutObj = null; // Active players timeout
  this.turnIntervalObj = null;
  this.updateJsonTemp = null;
  this.current_player_turn = 0;
  this.currentTurnText = '';
  this.currentHighestBet = 0;
  this.isCallSituation = false;
  this.isResultsCall = false; // True means update on client visual side
  this.roundWinnerPlayerIds = [];
  this.roundWinnerPlayerCards = [];
  this.currentStatusText = 'Waiting players...';
  this.lastUserAction = {playerId: -1, actionText: null, betAmount: 0}; // Animated last user action text
  this.dealerPlayerArrayIndex = -1;
  this.smallBlindPlayerArrayIndex = -1;
  this.smallBlindGiven = false;
  this.bigBlindGiven = false;
  this.bigBlindPlayerHadTurn = false; // Allow big blind player to make decision also
  this.stackCall = 0;
  this.lastWinnerPlayers = []; // Give's double xp if same
  this.collectingPot = false;
  this.roomLeft=[];
  this.tableType=table_Type;
  this.tableOwner=table_Owner;
  this.currentEvent = null;
  this.lastwinnerplayerID=null  // To store the current event
  this.eventObjectsCollected = [];
  if(this.tableType==="public" || this.tableType==="allinorfold"){
    this.initializeEvent();
  }
  this.betscalled = false;
  this.activeBets=[];
  this.betTheFlop =[]
  this.increment = [];
  this.surpassobjectcount=[];
  this.totalObjects = []
  this.potCollected = 0;
  this.roundTotalBet = {};
  this.autofold=[];
  this.showPlayerCards = {};
  this.giftsend=[];
  this.activeBets = {}; // Format: { playerId: { betType: amount, ... }, ... }
  this.clientReportedBets = {};   // Client-sent bets for verification
  this.betsVerified = false;
  this.betMultipliers = {
    '2 Red': 2,
    '2 Black': 2,
    'Pair': 4.8,
    'Flush': 15.5,
    'Straight': 23
  };
  this.clearBetsLocks = new Map();
  
}

exports.Room = Room;


// Run before each new round
Room.prototype.resetRoomParams = function () {
  this.currentStage = Room.HOLDEM_STAGE_ONE_HOLE_CARDS;
  this.holeCardsGiven = false;
  this.totalPot = 0;
  this.middleCards = [];
  this.currentHighestBet = 0;
  this.updateJsonTemp = null;
  this.current_player_turn = 0;
  this.isResultsCall = false;
  this.roundWinnerPlayerIds = [];
  this.roundWinnerPlayerCards = [];
  this.lastUserAction = {playerId: -1, actionText: null, betAmount: 0};
  this.smallBlindGiven = false;
  this.bigBlindGiven = false;
  this.bigBlindPlayerHadTurn = false;
  this.collectingPot = false;
  this.deckCardsBurned = 0;
  this.betTheFlop = [];
  this.betscalled = false;
  this.surpassobjectcount=[];
  this.roundTotalBet = {};
  this.potCollected = 0;
  this.showPlayerCards = {};

  //bets verificaiton at the end of theflop
  this.clientReportedBets = {};
  this.betsVerified = false;

};

Room.prototype.initializeEvent = async function () {
  try{
  const currentEvent = await this.sequelizeObjects.LeaderboardEvent.findOne({ where: { isActive: true } });
  if (currentEvent) {
    this.currentEvent = currentEvent;
    let name = await this.sequelizeObjects.Event.findOne({ where: { id: currentEvent.eventId } });
    //logger.log(`Event ${name.name} initialized in room: ${this.roomName}`);
  }
}catch(err){
  logger.log(err);
}
};
// Class method
Room.prototype.getRoomInfo = function () {
  return {
    roomId: this.roomId,
    roomType: this.tableType,
    roomName: this.roomName,
    roomMinBet: this.roomMinBet,
    playerCount: (this.players.length + this.playersToAppend.length + this.bots.length),
    maxSeats: this.maxSeats
  };
};


Room.prototype.triggerNewGame = function () {
  this.appendPlayers();
};


Room.prototype.appendPlayers = function () {
  let _this = this;
  this.cleanSpectators();
  if (!this.gameStarted) {
    this.playersTemp = [];
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i] !== null) {
        if (this.players[i].connection !== null && this.players[i].playerMoney > this.roomMinBet) { // Added room minimum bet here other than > 0, otherwise causes crash
          this.playersTemp.push(this.players[i]);
        } else {
          if (!this.players[i].isBot) {
            if(this.players[i].connection !== null && this.players[i].playersAllMoney >= this.maximumAmount ){
              this.players[i].playerMoney = this.maximumAmount;
              //logger.log("Added Amount "+this.players[i].playerMoney,logger.LOG_RED);
              this.players[i].playersAllMoney = this.players[i].playersAllMoney - this.maximumAmount;
              this.playersTemp.push(this.players[i]);
            } else if(this.players[i].playersAllMoney > this.minimumAmount ){
              this.players[i].playerMoney = +this.players[i].playersAllMoney;
              this.players[i].playersAllMoney = 0;
              //logger.log("Added Amount "+this.players[i].playerMoney,logger.LOG_RED);
              this.playersTemp.push(this.players[i]);
            }else{
              let abc = {key: '', data: {}};;
              abc.key = "LeaveTableNow";
              abc.data = {};
              if(this.players[i].connection){
              this.players[i].connection.sendText(JSON.stringify(abc));
              }
              this.playersToAppend.push(this.players[i]);
              this.sendStatusUpdate();
              //this.LeaveRoom (this.players[i].connectionId,this.players[i])
              // this.sendClientMessage(this.players[i], 'Not enough money to join the game. You are now spectator.');
              // this.spectators.push(this.players[i]);
            }
          }else{
            if(this.players[i].playersAllMoney >= this.maximumAmount ){
              this.players[i].playerMoney = this.maximumAmount;
              //logger.log("Added Amount "+this.players[i].playerMoney,logger.LOG_RED);
              this.players[i].playersAllMoney = this.players[i].playersAllMoney - this.maximumAmount;
              this.playersTemp.push(this.players[i]);
            } else if(this.players[i].playersAllMoney > this.minimumAmount ){
              this.players[i].playerMoney = +this.players[i].playersAllMoney;
              this.players[i].playersAllMoney = 0;
              //logger.log("Added Amount "+this.players[i].playerMoney,logger.LOG_RED);
              this.playersTemp.push(this.players[i]);
            }
          }
        }
      }
    }
    this.players = [];
    for (let p = 0; p < this.playersTemp.length; p++) {
      if (this.playersTemp[p] !== null) {
        if (this.playersTemp[p].connection !== null) {
          this.players.push(this.playersTemp[p]);
        }
      }
    }
    this.playersTemp = [];
    if (this.playersToAppend.length > 0) {
      for (let i = 0; i < this.playersToAppend.length; i++) {
        if (this.playersToAppend[i].connection !== null && this.playersToAppend[i].playerMoney > this.roomMinBet) {
          this.players.push(this.playersToAppend[i]);
        } else {
          if (!this.playersToAppend[i].isBot) {
            this.sendClientMessage(this.playersToAppend[i], 'Not enough money to join the game. You are now spectator.');
           // this.spectators.push(this.playersToAppend[i]);
          }
        }
      }
      this.playersToAppend = [];
      if (this.players.length >= this.minPlayers) {
        setTimeout(function () {
          _this.startGame();
        }, config.common.startGameTimeOut * gameSpeedFactor);
      } else {
        //logger.log('* Room ' + this.roomName + ' has not enough players');
      }
    } else {
      if (this.players.length >= this.minPlayers) {
        //logger.log('No players to append... starting game');
        this.startGame();
        setTimeout(function () {
          _this.startGame();
        }, config.common.startGameTimeOut* gameSpeedFactor);
      } else {
        this.currentStatusText = this.minPlayers + ' players needed to start a new game...';
      }
    }
  } else {
    //logger.log('* Cant append more players since round is running for room: ' + this.roomName);
  }
};
Room.prototype.startGame = async function () {
  try{
  if (!this.gameStarted) {
    let playersTemp1=[];
    for (let i = 0; i < this.players.length; i++) { // Take good spectators to temp array
      let PlayerfindIndex=-1;
      if (this.players[i] !== null) {
        //logger.log("this.roomLeft.length "+this.roomLeft.length);
        for(let q=0;q<this.roomLeft.length;q++){
          //logger.log(" this.players[i].playerId "+JSON.stringify( this.players[i].playerId ) +"  this.roomLeft[q].playerId  "+ this.roomLeft[q].playerId);
          if (this.players[i].playerId === this.roomLeft[q].playerId) {
            PlayerfindIndex = q;
          }
        }
        if(PlayerfindIndex === -1){
          playersTemp1.push(this.players[i]);
        } else{
          let abc = {key: '', data: {}};;
              abc.key = "GetPlayerInfoNow";
              abc.data = {};
              this.players[i].connection.sendText(JSON.stringify(abc));
          this.players[i].selectedRoomId = -1;
        }
      }
    }
    this.roomLeft=[];
  
    //logger.log("playersTemp1 = "+playersTemp1.length);
    this.players = [];
    for (let p = 0; p < playersTemp1.length; p++) {
      if (playersTemp1[p].connection !== null) {
            this.players.push(playersTemp1[p]);
      }
    }
    playersTemp1=[];
    this.gameStarted = true;
    let player = this.players.filter(player => !player.isBot);
    if(player.length >= 2){
      holdem.serverCommand(this.players[0].connectionId,this.players[0].socketKey, "removeOneBots",this.roomId,1,process.env.SERVER_CMD_PASSWORD);
    }
    //logger.log('Game started for room: ' + this.roomName);
    this.resetRoomParams();
    this.resetPlayerParameters(); // Reset players (resets dealer param too)
    this.setNextDealerPlayer(); // Get next dealer player
    this.getNextSmallBlindPlayer(); // Get small blind player
    let response = this.getRoomParams();
    for (let i = 0; i < this.players.length; i++) {
      this.players[i].isFold = false;
      this.players[i].isCheck = false;
      this.players[i].betClearedThisHand = false;
      console.log("starting new round and setting player's isCheck to "+this.players[i].isCheck)
      this.sendWebSocketData(i, response);
    }
    for (let w = 0; w < this.playersToAppend.length; w++) {
      this.sendWaitingPlayerWebSocketData(w, response);
    }
    for (let s = 0; s < this.spectators.length; s++) {
      this.sendSpectatorWebSocketData(s, response);
    }
    
    
    for (const player of this.players) {
      if (typeof this.roundTotalBet[player.playerId] === 'undefined') {
        this.roundTotalBet[player.playerId] = 0; // Initialize for each player
      }
      if (typeof this.autofold[player.playerId] === 'undefined') {
        this.autofold[player.playerId] = 0; // Initialize for each player
      }
      if (typeof this.betTheFlop[player.playerId] === 'undefined') {
        this.betTheFlop[player.playerId] = 0; // Initialize for each player
      }
      if (typeof this.surpassobjectcount[player.playerId] === 'undefined') {
        this.surpassobjectcount[player.playerId] = false; // Initialize for each player
      }
      if (typeof this.increment[player.playerId] === 'undefined') {
        this.increment[player.playerId] = 5; // Initialize for each player
      }
      if (typeof this.totalObjects[player.playerId] === 'undefined') {
        this.totalObjects[player.playerId] = this.calculateObjectBarLimit(player.playerId); // Initialize for each player
      }
      if (typeof this.showPlayerCards[player.playerId] === 'undefined') {
        this.showPlayerCards[player.playerId] = false; // Initialize for each player
      }
      if (typeof this.giftsend[player.playerId] === 'undefined') {
        this.giftsend[player.playerId] = -1; // Initialize for each player
      }
    }

    if (this.currentEvent) {
      for (const player of this.players) {  // Use for...of instead of forEach
        if (typeof this.eventObjectsCollected[player.playerId] === 'undefined') {
          this.eventObjectsCollected[player.playerId] = 0;
        }

        this.totalObjects[player.playerId] = this.calculateObjectBarLimit(player.playerId);
        let reward = await this.rewardPlayer(this.totalObjects[player.playerId]); // Now you can use await
        if(player.connection){
          if(!player.isBot){
          player.connection.sendText(JSON.stringify({
          key: "BonusOnWinningHand",
          Objects: this.eventObjectsCollected[player.playerId],
          totalObjects: this.totalObjects[player.playerId],
          reward: reward
        }));
      }
      }}
    }
   
    this.newGame();
  }
}catch(err){
  logger.log(err);
  this.startGame();
}
};


// ------------------------------------------------------------------------

// New deck here
Room.prototype.newGame = function () {
  try{
  const _this = this;
  // Always shuffle new deck
  this.deck = poker.visualize(poker.randomize(poker.newSet()));
  this.deckSize = this.deck.length;
  this.deckCard = 0;
  this.sendStatusUpdate();
  setTimeout(function () {
    _this.staging();
  }, 1000* gameSpeedFactor)
}catch(err){
  logger.log(err);
}
};

Room.prototype.checkLeavePlayers=function(){
  try{
  let playersTemp1=[];
  
  for (let i = 0; i < this.players.length; i++) { // Take good spectators to temp array
    let PlayerfindIndex=-1;
    if (this.players[i] !== null) {
      //logger.log("this.roomLeft.length "+this.roomLeft.length);
      for(let q=0;q<this.roomLeft.length;q++){
        //logger.log(" this.players[i].playerId "+JSON.stringify( this.players[i].playerId ) +"  this.roomLeft[q].playerId  "+ this.roomLeft[q].playerId);
        if (this.players[i].playerId === this.roomLeft[q].playerId) {
          PlayerfindIndex = q;
        }
      }
      if(PlayerfindIndex === -1){
        playersTemp1.push(this.players[i]);
      } else{
        let abc = {key: '', data: {}};;
            abc.key = "GetPlayerInfoNow";
            abc.data = {};
            this.players[i].connection.sendText(JSON.stringify(abc));
        this.players[i].selectedRoomId = -1;
      }
    }
    
  }
  this.roomLeft=[];

  //logger.log("playersTemp1 = "+playersTemp1.length);
  this.players = [];
  for (let p = 0; p < playersTemp1.length; p++) {
    if (playersTemp1[p].connection !== null) {
          this.players.push(playersTemp1[p]);
    }
  }
  playersTemp1=[];
}catch(err){
  logger.log(err);
}
}

Room.prototype.staging = function () {
  try{
  let playersTemp1=[];
  
  for (let i = 0; i < this.players.length; i++) { // Take good spectators to temp array
    let PlayerfindIndex=-1;
    if (this.players[i] !== null) {
      //logger.log("this.roomLeft.length "+this.roomLeft.length);
      for(let q=0;q<this.roomLeft.length;q++){
        //logger.log(" this.players[i].playerId "+JSON.stringify( this.players[i].playerId ) +"  this.roomLeft[q].playerId  "+ this.roomLeft[q].playerId);
        if (this.players[i].playerId === this.roomLeft[q].playerId) {
          PlayerfindIndex = q;
        }
      }
      if(PlayerfindIndex === -1){
        playersTemp1.push(this.players[i]);
      } else{
        let abc = {key: '', data: {}};;
            abc.key = "GetPlayerInfoNow";
            abc.data = {};
            this.players[i].connection.sendText(JSON.stringify(abc));
        this.players[i].selectedRoomId = -1;
      }
    }
  }
  this.roomLeft=[];

  //logger.log("playersTemp1 = "+playersTemp1.length);
  this.players = [];
  for (let p = 0; p < playersTemp1.length; p++) {
    if (playersTemp1[p].connection !== null) {
          this.players.push(playersTemp1[p]);
    }
  }
  playersTemp1=[];

  switch (this.currentStage) {
    
    case Room.HOLDEM_STAGE_ONE_HOLE_CARDS: // Give cards
      this.currentStatusText = 'Hole cards';
      this.currentTurnText = '';
      this.burnCard(); // Burn one card before dealing cards
      this.holeCards();
      break;
    case Room.HOLDEM_STAGE_TWO_PRE_FLOP: // First betting round
      this.currentStatusText = 'Pre flop & small blind & big blind';
      
      this.isCallSituation = false; // Room related reset
      this.resetPlayerStates();
      this.resetRoundParameters();
      this.current_player_turn = this.smallBlindPlayerArrayIndex; // Round starting player is always small blind player
      this.currentTurnText = '';
      this.currentHighestBet = 0; 
      this.bettingRound(this.smallBlindPlayerArrayIndex); // this.bettingRound(this.current_player_turn);
      break;
    case Room.HOLDEM_STAGE_THREE_THE_FLOP: // Show three middle cards
      this.currentStatusText = 'The flop';
      this.currentTurnText = '';
      this.burnCard(); // Burn one card before dealing cards
      this.theFlop();
      break;
    case Room.HOLDEM_STAGE_FOUR_POST_FLOP: // Second betting round
      this.currentStatusText = 'Post flop';
      this.currentTurnText = '';
      this.isCallSituation = false; // Room related reset
      this.resetPlayerStates();
      this.resetRoundParameters();
      this.current_player_turn = this.smallBlindPlayerArrayIndex; // Round starting player is always small blind player
      this.currentHighestBet = 0;
      this.bettingRound(this.current_player_turn); // this.bettingRound(this.current_player_turn);
      break;
    case Room.HOLDEM_STAGE_FIVE_THE_TURN: // Show fourth card
      this.currentStatusText = 'The turn';
      this.currentTurnText = '';
      this.burnCard(); // Burn one card before dealing cards
      this.theTurn();
      break;
    case Room.HOLDEM_STAGE_SIX_THE_POST_TURN: // Third betting round
      this.currentStatusText = 'Post turn';
      this.currentTurnText = '';
      this.isCallSituation = false; // Room related reset
      this.resetPlayerStates();
      this.resetRoundParameters();
      this.current_player_turn = this.smallBlindPlayerArrayIndex; // Round starting player is always small blind player
      this.currentHighestBet = 0;
      this.bettingRound(this.current_player_turn); // this.bettingRound(this.current_player_turn);
      break;
    case Room.HOLDEM_STAGE_SEVEN_THE_RIVER: // Show fifth card
      this.currentStatusText = 'The river';
      this.currentTurnText = '';
      this.burnCard(); // Burn one card before dealing cards
      this.theRiver();
      break;
    case Room.HOLDEM_STAGE_EIGHT_THE_SHOW_DOWN: // Fourth and final betting round
      this.currentStatusText = 'The show down';
      this.currentTurnText = '';
      this.isCallSituation = false; // Room related reset
      this.resetPlayerStates();
      this.resetRoundParameters();
      this.current_player_turn = this.smallBlindPlayerArrayIndex; // Round starting player is always small blind player
      this.currentHighestBet = 0;
      this.bettingRound(this.current_player_turn); // this.bettingRound(this.current_player_turn);
      break;
    case Room.HOLDEM_STAGE_NINE_SEND_ALL_PLAYERS_CARDS: // Send all players cards here before results to all players and spectators
      //logger.log(this.roomName + ' sending cards to all room clients...');
      this.sendAllPlayersCards(); // Avoiding cheating with this
      break;
    case Room.HOLDEM_STAGE_TEN_RESULTS: // Results
      //logger.log('-------- Results : ' + this.roomName + ' --------');
      this.roundResultsEnd();
      break;
    default:
      return;
  }

  this.sendStatusUpdate();
}catch(e){
  logger.log(e);
  this.staging();
}
};

// ---------------------------------------------------------------------------------------------------------------------

// Give players two cards
Room.prototype.holeCards = async function () {
  try{
  this.currentStage = Room.HOLDEM_STAGE_TWO_PRE_FLOP; // Increment
  const _this = this;
  for (let i = 0; i < this.players.length; i++) {
    this.players[i].playerCards[0] = this.getNextDeckCard();
    this.players[i].playerCards[1] = this.getNextDeckCard();
  }
  let response = {key: '', data: {}};
  response.key = 'holeCards';
  for (let i = 0; i < this.players.length; i++) {
    response.data.players = [];
    for (let p = 0; p < this.players.length; p++) {
      let playerData = {};
      playerData.playerId = this.players[p].playerId;
      playerData.playerName = this.players[p].playerName;
      this.players[p].playerId === this.players[i].playerId ? playerData.cards = this.players[p].playerCards : playerData.cards = [];
      response.data.players.push(playerData);
    }
    this.sendWebSocketData(i, response);
  }
  response.data.players = [];
  for (let i = 0; i < this.players.length; i++) {
    let playerData = {};
    playerData.playerId = this.players[i].playerId;
    playerData.cards = []; 
    response.data.players.push(playerData);
  }
  for (let i = 0; i < this.spectators.length; i++) {
    this.sendSpectatorWebSocketData(i, response);
  }
  this.holeCardsGiven = true;
  for (let i = 0; i < this.players.length; i++) {
    let cardsToEvaluate = [];

    
    cardsToEvaluate.push(this.players[i].playerCards[0]);
    cardsToEvaluate.push(this.players[i].playerCards[1]);

   
    let currentHandData = this.evaluateHand(cardsToEvaluate);
    let currentHandScore = currentHandData.score;
    let currentHandName = currentHandData.handName;

    
    let card1Value = cardRankings[cardsToEvaluate[0][0]] || 0; 
    let card2Value = cardRankings[cardsToEvaluate[1][0]] || 0; 

    
    let lowestCardValue = Math.min(card1Value, card2Value);
    let highestCardValue = Math.max(card1Value, card2Value);

   
    let lowestCardScore = lowestCardValue * 100; 
    
    let probabilityMultiplier = highestCardValue >= 10 ? 10 : 6;

   
    let highestCardScore = (currentHandScore * probabilityMultiplier) + highestCardValue * 100;

    
    if (card1Value === card2Value) {
      highestCardScore *= 2;
    }

    let probability = await this.calculateCardScores(cardsToEvaluate, currentHandScore, currentHandName, i);
    if(this.players[i].connection){
      if(!this.players[i].isBot){
      this.players[i].connection.sendText(JSON.stringify({
        key: "probability",
        data: probability
      }))
    }
  }

  }
  setTimeout(function () {
    _this.staging();
  }, 1000* gameSpeedFactor);
}catch(e){
  logger.log(e);
  this.staging();
}
};

// ---------------------------------------------------------------------------------------------------------------------

// Show three middle cards
Room.prototype.theFlop = async function () {
  try{
  this.currentStage = Room.HOLDEM_STAGE_FOUR_POST_FLOP; // Increment
  const _this = this;
  this.middleCards[0] = this.getNextDeckCard();
  this.middleCards[1] = this.getNextDeckCard();
  this.middleCards[2] = this.getNextDeckCard();
  
  let response = {key: '', data: {}};
  response.key = 'theFlop';
  response.data.middleCards = this.middleCards;
  for (let p = 0; p < this.players.length; p++) {
    this.sendWebSocketData(p, response);
  }
  for (let w = 0; w < this.playersToAppend.length; w++) {
    this.sendWaitingPlayerWebSocketData(w, response);
  }
  for (let s = 0; s < this.spectators.length; s++) {
    this.sendSpectatorWebSocketData(s, response);
  }
  for(let i = 0; i < this.players.length; i++){
    const response = await this.challenge(this.players[i].playerDatabaseId,'See Flops');
    if(response){
      this.players[i].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }
  } 
  for(let i = 0; i < this.players.length; i++){
    const response = await this.challenge(this.players[i].playerDatabaseId,'Flop Bets');
    if(response){
      this.players[i].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }
  } 
  //bet flop
  // After dealing 3 cards (Flop)
if (this.middleCards.length === 3 && Object.keys(this.activeBets).length > 0) {
  await this.processAllBets(); // Resolves: Pair, 2 Red, 2 Black , Flush and Straight
  this.betscalled = false;
}
  if(this.betscalled){
    this.callRed();
    this.callBlack();
    this.callStraight();
    this.callFlush();
    this.callPair();
  }
  for (let i = 0; i < this.players.length; i++) {
    let cardsToEvaluate = [];

    // Flop: 3 community cards + 2 player cards
    let hand = pokerSolver.solve(
      utils.asciiToStringCardsArray([
        this.middleCards[0],
        this.middleCards[1],
        this.middleCards[2],
        this.players[i].playerCards[0],
        this.players[i].playerCards[1]
      ])
    );
    
    cardsToEvaluate.push(...this.middleCards.slice(0, 3), ...this.players[i].playerCards);
    let value = evaluator.evalHand(cardsToEvaluate);
    let handName = hand.name;

    // Evaluate scores
   let probability = await this.calculateCardScores(cardsToEvaluate, value.value, handName, i);
   if(this.players[i].connection){
    if(!this.players[i].isBot){
    this.players[i].connection.sendText(JSON.stringify({
      key: "probability",
      data: probability
    }))
  }
}
  }

  setTimeout(function () {
    _this.staging();
  }, 1000* gameSpeedFactor);
}catch(e){
  logger.log(e);
  this.staging();
}
};

// ---------------------------------------------------------------------------------------------------------------------

// Show fourth card
Room.prototype.theTurn = async function () {
  try{
  this.currentStage = Room.HOLDEM_STAGE_SIX_THE_POST_TURN; // Increment
  const _this = this;
  this.middleCards[3] = this.getNextDeckCard();
  let response = {key: '', data: {}};
  response.key = 'theTurn';
  response.data.middleCards = this.middleCards;
  for (let p = 0; p < this.players.length; p++) {
    this.sendWebSocketData(p, response);
  }
  for (let w = 0; w < this.playersToAppend.length; w++) {
    this.sendWaitingPlayerWebSocketData(w, response);
  }
  for (let s = 0; s < this.spectators.length; s++) {
    this.sendSpectatorWebSocketData(s, response);
  }
  for (let i = 0; i < this.players.length; i++) {
    let cardsToEvaluate = [];

    // Turn: 4 community cards + 2 player cards
    let hand = pokerSolver.solve(
      utils.asciiToStringCardsArray([
        this.middleCards[0],
        this.middleCards[1],
        this.middleCards[2],
        this.middleCards[3],
        this.players[i].playerCards[0],
        this.players[i].playerCards[1]
      ])
    );
    
    cardsToEvaluate.push(...this.middleCards.slice(0, 4), ...this.players[i].playerCards);
    let value = evaluator.evalHand(cardsToEvaluate);
    let handName = hand.name;

    // Evaluate scores
    let probability = await this.calculateCardScores(cardsToEvaluate, value.value, handName, i);
    if(this.players[i].connection){
      if(!this.players[i].isBot){
      this.players[i].connection.sendText(JSON.stringify({
        key: "probability",
        data: probability
      }))
    }
  }
}
  setTimeout(function () {
    _this.staging();
  }, 1000* gameSpeedFactor);
}catch(e){
  logger.log(e);
  this.staging();
}
};

// ---------------------------------------------------------------------------------------------------------------------

// Show fifth card
Room.prototype.theRiver = async function () {
  try{
  this.currentStage = Room.HOLDEM_STAGE_EIGHT_THE_SHOW_DOWN; // Increment
  const _this = this;
  this.middleCards[4] = this.getNextDeckCard();
  let response = {key: '', data: {}};
  response.key = 'theRiver';
  response.data.middleCards = this.middleCards;
  for (let p = 0; p < this.players.length; p++) {
    this.sendWebSocketData(p, response);
  }
  for (let w = 0; w < this.playersToAppend.length; w++) {
    this.sendWaitingPlayerWebSocketData(w, response);
  }
  for (let s = 0; s < this.spectators.length; s++) {
    this.sendSpectatorWebSocketData(s, response);
  }
  for(let i = 0; i < this.players.length; i++){
    const response = await this.challenge(this.players[i].playerDatabaseId,'River Reach');
    if(response){
      this.players[i].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }
  } 
  for(let i = 0; i < this.players.length; i++){
    const response = await this.challenge(this.players[i].playerDatabaseId,'Different Rooms');
    if(response){
      this.players[i].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }
  } 
  for (let i = 0; i < this.players.length; i++) {
    let cardsToEvaluate = [];

    // River: 5 community cards + 2 player cards
    let hand = pokerSolver.solve(
      utils.asciiToStringCardsArray([
        this.middleCards[0],
        this.middleCards[1],
        this.middleCards[2],
        this.middleCards[3],
        this.middleCards[4],
        this.players[i].playerCards[0],
        this.players[i].playerCards[1]
      ])
    );
    
    cardsToEvaluate.push(...this.middleCards, ...this.players[i].playerCards);
    let value = evaluator.evalHand(cardsToEvaluate);
    let handName = hand.name;

    // Evaluate scores
    let probability = await this.calculateCardScores(cardsToEvaluate, value.value, handName, i);
    if(this.players[i].connection){
      if(!this.players[i].isBot){
      this.players[i].connection.sendText(JSON.stringify({
        key: "probability",
        data: probability
      }))
    }
  }
  }
  //bet processing for Flush, Straight
  // if (Object.keys(this.activeBets).length > 0) {
  //   await this.processAllBets();
  // }
  setTimeout(function () {
    _this.staging();
  }, 1000* gameSpeedFactor);
}catch(e){
  logger.log(e);
  this.staging();
}
};

// ---------------------------------------------------------------------------------------------------------------------

// Send all player cards to all clients before round results call
Room.prototype.sendAllPlayersCards = function () {
  try{
  this.currentStage = Room.HOLDEM_STAGE_TEN_RESULTS; // Increment
  const _this = this;
  let response = {key: '', data: {}};
  response.key = 'allPlayersCards';
  response.data.players = [];
  
  for (let i = 0; i < this.players.length; i++) {
    let playerData = {};
    playerData.playerId = this.players[i].playerId;
    playerData.cards = this.players[i].playerCards;
    playerData.showCards = this.showPlayerCards[this.players[i].playerId];
    response.data.players.push(playerData);
  }
  for (let p = 0; p < this.players.length; p++) {
    this.sendWebSocketData(p, response);
  }
  for (let a = 0; a < this.playersToAppend.length; a++) {
    this.sendWaitingPlayerWebSocketData(a, response);
  }
  for (let s = 0; s < this.spectators.length; s++) {
    this.sendSpectatorWebSocketData(s, response);
  }
  setTimeout(function () {
    _this.staging();
  }, 1000* gameSpeedFactor);
}catch(e){
  logger.log(e);
  this.staging();
}
};

// ---------------------------------------------------------------------------------------------------------------------
function parseCardString(cardString) {
  // Split the input string by the comma delimiter
  const cards = cardString.split(',');

  // Initialize an empty array to store the individual cards
  const cardArray = [];

  // Iterate through each card in the input string
  for (const card of cards) {
    // Trim any leading/trailing whitespace
    const trimmedCard = card.trim();

    // Extract the rank and suit from the trimmed card string
    // const rank = trimmedCard.slice(0, -1);
    // const suit = trimmedCard.slice(-1);

    // Add the card object to the array
    //cardArray.push({ rank, suit });
    cardArray.push({ trimmedCard });
    
  }

  return cardArray;
}
Room.prototype.calculateCardScores = function(cardsToEvaluate, currentHandScore, handName, playerIndex) {
  
  let card1Value = cardRankings[cardsToEvaluate[cardsToEvaluate.length - 2][0]] || 0;
  let card2Value = cardRankings[cardsToEvaluate[cardsToEvaluate.length - 1][0]] || 0;

 
  let lowestCardValue = Math.min(card1Value, card2Value);
  let highestCardValue = Math.max(card1Value, card2Value);

 
  let baseProbability;
  if (cardsToEvaluate.length === 2) {
    if (card1Value === card2Value) {
      baseProbability = (card1Value === 14) ? 85 : (card1Value / 14) * 85; // AA (14) gets 85%, lower pairs scale down
    } else {
      baseProbability = ((lowestCardValue + highestCardValue) / (14 + 14)) * 50; // Scale for non-pair hands
    }
  } else if (cardsToEvaluate.length >= 5) {
    
    let handRankMultiplier = getHandRankMultiplier(handName);
    baseProbability = Math.min(((currentHandScore / 20000) * handRankMultiplier * 100), 85); // Normalize further
  }

  
  let lowestCardScore = lowestCardValue * 100;
  let probabilityMultiplier = highestCardValue >= 10 ? 10 : 6;
  let highestCardScore = (currentHandScore * probabilityMultiplier) + highestCardValue * 100;

  
  if (card1Value === card2Value) {
    highestCardScore *= 1.5; 
  }

 
  let adjustedScore = Math.min(baseProbability, 85); 

  // Log for analysis

  return {
    player: playerIndex + 1,
    Hand: handName,
    Cards: cardsToEvaluate,
    CurrentHandScore: currentHandScore,
    LowestCardScore: lowestCardScore,
    HighestCardScore: highestCardScore,
    Probability: adjustedScore.toFixed(2) 
  };
};

function getHandRankMultiplier(handName) {
  switch (handName.toLowerCase()) {
    case 'high card': return 0.4;    
    case 'pair': return 0.6;
    case 'two pair': return 0.7;
    case 'three of a kind': return 0.8;
    case 'straight': return 0.9;     
    case 'flush': return 1.0;          
    case 'full house': return 1.2;
    case 'four of a kind': return 1.4;
    case 'straight flush': return 1.5; 
    case 'royal flush': return 1.7;   
    default: return 0.5; 
  }
}
Room.prototype.evaluateHand = function(allCards) {
  try {
    console.log('Evaluating cards:', allCards);
    const hand = pokerSolver.solve(utils.asciiToStringCardsArray(allCards));
    const handName = hand.name;
    // Get the base score based on hand ranking
    const baseScore = handRanking[handName] || 0;

    // Extract the ranks of the cards involved in the best hand
    const cardRanks = hand.cards.map(card => {
      // Handle 10 represented as 'T' or '10'
      const rank = card[0] === '1' ? '10' : card[0];
      return rank;
    });

    // Convert card ranks into their numeric values
    const rankValues = cardRanks.map(rank => cardRankings[rank] || 0);
    // Sort the rank values in descending order
    rankValues.sort((a, b) => b - a);

    // Compute the detailed score
    let detailedScore = baseScore * Math.pow(15, 5); // Base score weight
    for (let i = 0; i < rankValues.length; i++) {
      detailedScore += rankValues[i] * Math.pow(15, (4 - i));
    }

    return {
      score: detailedScore,
      handName: handName,
      rankValues: rankValues
    };
  } catch (err) {
    console.error(err);
  }
};
// Calculate winner and transfer money
Room.prototype.roundResultsEnd = async function () {
  try{
  const _this = this;
  logger.log('--------ROUND RESULT-----------');
  
  let winnerPlayers = [];  // Array to store the indexes of the winner(s)
  let winnerNames = [];    // Array to store the names of the winner(s)
  let currentHighestRank = 0;
  let l = this.players.length;

  // Step 1: Evaluate each player's hand
  for (let i = 0; i < l; i++) {
    if (!this.players[i].isFold) {
      // Use poker solver to evaluate player's hand with community cards
      let hand = pokerSolver.solve(utils.asciiToStringCardsArray([
        this.middleCards[0], this.middleCards[1], this.middleCards[2], this.middleCards[3], this.middleCards[4],
        this.players[i].playerCards[0], this.players[i].playerCards[1]
      ]));
      this.players[i].cardsInvolvedOnEvaluation = hand.cards;

      // Use Hand ranks to get value and hand name
      let evaluated = this.evaluatePlayerCards(i);
      this.players[i].handValue = evaluated.value;
      this.players[i].handName = evaluated.handName;

      // Log results
      //logger.log(`${this.players[i].playerName} has ${this.players[i].handName} with value: ${this.players[i].handValue}, cards involved: ${hand.cards}`, logger.LOG_GREEN);

      // Determine the winner(s)
      if (this.players[i].handValue > currentHighestRank) {
        currentHighestRank = this.players[i].handValue;
        winnerPlayers = []; // Reset the winners list
        winnerPlayers.push(i);
      } else if (this.players[i].handValue === currentHighestRank) {
        winnerPlayers.push(i);
      }
    }
  }

  // Step 2: Deduct 10% of the pot as a fee
   // 10% goes to the house/account

  // Step 3: Refund over-bet amounts to players who bet more than the winner's bet
  let winnerIndex = winnerPlayers[0]; // Get the index of the first winner
let winnerBet = this.roundTotalBet[winnerIndex];
//logger.log(`roundtotalbet is ${this.roundTotalBet[winnerIndex]} + ${this.players[winnerIndex].playerName}`);
  //logger.log(`Minimum bet: ${winnerBet}`);
  for (let i = 0; i < this.players.length; i++) {
    if (this.roundTotalBet[i] > winnerBet) {
      //logger.log(`${this.players[i].playerName} over-bet: ${this.roundTotalBet[i] - winnerBet}`);
      let refundAmount = this.roundTotalBet[i] - winnerBet ;
      /* refundAmount = refundAmount - Math.floor(refundAmount/100) * 10; */
      this.players[i].playerMoney += refundAmount
      this.totalPot -= refundAmount;  // Subtract refunded amount from total pot
      //logger.log(`${this.players[i].playerName} is refunded ${refundAmount} due to over-bet`);
    }
  };
  this.totalPot = this.totalPot - (this.totalPot / 100) * 10;
  // Step 4: Recalculate the total pot and distribute it among the winners
  let sharedPot = Math.floor(this.totalPot / winnerPlayers.length);

  for (let i = 0; i < winnerPlayers.length; i++) {
    let winner = this.players[winnerPlayers[i]];
    winnerNames.push(winner.playerName + (winnerPlayers.length > 1 ? '' : ''));

    // Update the winner's best hand if applicable
    if (winner.handValue > winner.bestHandValue) {
      winner.bestHandValue = winner.handValue;
      winner.bestHandName = winner.handName;
      winner.BestCards = winner.cards;

      dbUtils.PlayerCardsUpdate(this.sequelizeObjects, winner.playerDatabaseId,
        JSON.stringify(winner.cardsInvolvedOnEvaluation), winner.bestHandValue, winner.bestHandName).then((result) => {
          // Log the updated hand information
      });
    }

    // Log the shared pot amount
    //logger.log(`shared pot: ${sharedPot}`);

    if (!this.winnerLogs) {
      this.winnerLogs = [];
    }
    
    // Push the new winner data into the winnerLogs array
    const winnerLogEntry = {
      WinnerName: winner.playerName,
      Pot: sharedPot,
      Hand: winner.handName,
      Cards: winner.cardsInvolvedOnEvaluation,
    };
    
    // Maintain a limit of 10 entries in the winnerLogs array
    if (this.winnerLogs.length >= 10) {
      this.winnerLogs.shift(); // Remove the oldest entry
    }
    this.winnerLogs.push(winnerLogEntry);
    
    // Send the updated winnerLogs array to all players
    for (let i = 0; i < this.players.length; i++) {
      if(!this.players[i].isBot){
      this.players[i].connection.sendText(JSON.stringify({
        key: 'WinnerLog',
        WinnerLogs: [...this.winnerLogs].reverse(),
      }));
    }
    }
    //logger.log(`${winner.playerName} Wins ${sharedPot} with ${winner.handName}, cards involved: ${winner.cardsInvolvedOnEvaluation}`);
    // Update the biggest hand if necessary
    //logger.log(`biggest hand value: ${winner.biggestHand}`);
    if (parseInt(winner.biggestHand) < sharedPot) {
      //logger.log(`Biggest hand update: ${winner.biggestHand} -> ${sharedPot} for player ${winner.playerDatabaseId}`);
      winner.biggestHand = sharedPot;
      //logger.log(`biggest hand value: ${parseInt(winner.biggestHand)}`);
      holdem.UpdatePlayerbiggestHandPromise(winner.playerDatabaseId, sharedPot);
    }

    // Add the winning amount to the player's balance
    winner.playerMoney += sharedPot;
    this.potCollected = sharedPot;
    this.roundWinnerPlayerIds.push(winner.playerId);
    this.roundWinnerPlayerCards.push(utils.stringToAsciiCardsArray(winner.cardsInvolvedOnEvaluation));
    
  }

  // Log the round results
  //logger.log(`Room = ${this.roomName}, winner(s) are: ${winnerNames.join(', ')}`);
  this.currentStatusText = `${winnerNames.join(', ')} won with ${this.players[winnerPlayers[0]].handName}`;

  // Update player statistics and finalize round
  this.updateLoggedInPlayerDatabaseStatistics(winnerPlayers, this.lastWinnerPlayers);
  this.retrieveWinners();
  this.lastWinnerPlayers = winnerPlayers;
  this.totalPot = 0; // Reset the pot for the next round
  this.isResultsCall = true;
  const winner = this.players[winnerPlayers[0]];

  if (this.currentEvent && winner && !winner.isBot) {
    const stakeMultiplier = this.getStakeMultiplier(); 
    const collectedObjects = stakeMultiplier; 

    this.eventObjectsCollected[winner.playerId] += collectedObjects;

    this.totalObjects[winner.playerId] = this.calculateObjectBarLimit(winner.playerId); 
    let reward = await this.rewardPlayer(this.totalObjects[winner.playerId]);
    if (this.eventObjectsCollected[winner.playerId] >= this.totalObjects[winner.playerId]) {
      this.surpassobjectcount[winner.playerId]=true;
      this.totalObjects[winner.playerId] = this.calculateObjectBarLimit(winner.playerId);
      winner.playerMoney += parseInt(reward);
      this.eventObjectsCollected[winner.playerId] = 0; 
      
    }
    this.updateLeaderboard(winner.playerId,winner.playerDatabaseId, collectedObjects,winner.playerName,winnerPlayers[0],reward);
  }
  
  if(this.lastwinnerplayerID === winner.playerId&&!winner.isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,'Consecutive Wins');
    if(response){
      this.players[winnerPlayers[0]].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }
  }
  if(winner.isAllIn&&!winner.isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,'Earn Chips');
    if(response){
      this.players[winnerPlayers[0]].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }
  }

  if(this.lastwinnerplayerID === winner.playerId && !winner.isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,'All-In Plays');
    if(response){
      this.players[winnerPlayers[0]].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }
  }
  for(let i = 0; i < this.players.length; i++){
    if(!this.players[i].isBot){
    const response = await this.challenge(this.players[i].playerDatabaseId,'Play Hands');
    if(response){
      this.players[i].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }}
  } 
  for(let i = 0; i < this.players.length; i++){
    if(!this.players[i].isBot){
    const response = await this.challenge(this.players[i].playerDatabaseId,'Bet Chips');
    if(response){
      this.players[i].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }}
  }
  for(let i = 0; i < this.players.length; i++){
   if(!this.players[i].isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,'Win Hands');
    if(response){
      this.players[i].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }}
  }

  if(this.players[winnerPlayers[0]].handName === 'one pair'){
    if(!this.players[winnerPlayers[0]].isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,'Pair Wins');
    if(response){
      this.players[winnerPlayers[0]].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }}
  } 
  if(this.players[winnerPlayers[0]].handName === 'one pair'){
    if(!this.players[winnerPlayers[0]].isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,'Pair Wear');
    if(response){
      this.players[winnerPlayers[0]].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }}
  } 
  if(this.players[winnerPlayers[0]].handName === 'royal flush'){
    if(!this.players[winnerPlayers[0]].isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,'Royal Loyal');
    if(response){
      this.players[winnerPlayers[0]].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }}
  }
  if(this.players[winnerPlayers[0]].handName === 'three of a kind'){
    if(!this.players[winnerPlayers[0]].isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,'Three Kind');
    if(response){
      this.players[winnerPlayers[0]].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }}
  } 
  if(this.players[winnerPlayers[0]].handName === 'three of a kind'){
    if(!this.players[winnerPlayers[0]].isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,"Two's Three");
    if(response){
      this.players[winnerPlayers[0]].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }}
  } 
  if(this.players[winnerPlayers[0]].handName === 'four of a kind'){
    if(!this.players[winnerPlayers[0]].isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,"Four Kinds");
    if(response){
      this.players[winnerPlayers[0]].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }}
  }
  if(this.players[winnerPlayers[0]].handName === 'straight'){
    if(!this.players[winnerPlayers[0]].isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,'Straight Win');
    if(response){
      this.players[winnerPlayers[0]].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }}
  } 
  if(this.players[winnerPlayers[0]].handName === 'straight'){
    if(!this.players[winnerPlayers[0]].isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,'Straight Chips');
    if(response){
      this.players[winnerPlayers[0]].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }}
  } 
  if(this.players[winnerPlayers[0]].handName === 'straight'){
    if(!this.players[winnerPlayers[0]].isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,'Straight Wins');
    if(response){
      this.players[winnerPlayers[0]].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }}
  } 
  if(this.players[winnerPlayers[0]].handName === 'high card'){
    if(!this.players[winnerPlayers[0]].isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,'High Card');
    if(response){
      this.players[winnerPlayers[0]].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }}
  } 
  if(this.players[winnerPlayers[0]].handName === 'high card'){
    if(!this.players[winnerPlayers[0]].isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,'Three Hands');
    if(response){
      this.players[winnerPlayers[0]].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }}
  } 
  if(this.players[winnerPlayers[0]].handName === 'flush'){
    if(!this.players[winnerPlayers[0]].isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,'Flush Win');
    if(response){
      this.players[winnerPlayers[0]].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }}
  } 
  if(this.players[winnerPlayers[0]].handName === 'flush'){
    if(!this.players[winnerPlayers[0]].isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,'Flush Wins');
    if(response){
      this.players[winnerPlayers[0]].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }}
  }

  if(this.players[winnerPlayers[0]].handName === 'full house'){
    if(!this.players[winnerPlayers[0]].isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,'Full House');
    if(response){
      this.players[winnerPlayers[0]].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }}
  } 
  if(this.players[winnerPlayers[0]].handName === 'full house'){
    if(!this.players[winnerPlayers[0]].isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,'Final Table');
    if(response){
      this.players[winnerPlayers[0]].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }}
  } 
  if(this.players[winnerPlayers[0]].handName === 'full house'){
    if(!this.players[winnerPlayers[0]].isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,'Full Win');
    if(response){
      this.players[winnerPlayers[0]].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }}
  }
  if(this.players[winnerPlayers[0]].handName === 'two pairs'){
    if(!this.players[winnerPlayers[0]].isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,'Two Pairs');
    if(response){
      this.players[winnerPlayers[0]].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }}
  } 
  if(this.players[winnerPlayers[0]].handName === 'two pairs'){
    if(!this.players[winnerPlayers[0]].isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,'Pair Bets');
    if(response){
      this.players[winnerPlayers[0]].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }}
  } 
  if(this.players[winnerPlayers[0]].handName === 'high card'||this.players[winnerPlayers[0]].handName === 'royal flush'||this.players[winnerPlayers[0]].handName === 'straight flush'||this.players[winnerPlayers[0]].handName === 'flush'||this.players[winnerPlayers[0]].handName === 'straight'){
    if(!this.players[winnerPlayers[0]].isBot){
    const response = await this.challenge(this.players[winnerPlayers[0]].playerDatabaseId,'Bluff Wins');
    if(response){
      this.players[winnerPlayers[0]].connection.sendText(JSON.stringify({
        key: "challengeStatus",
        data: response
      }))
    }}
  } 
  this.lastwinnerplayerID = this.players[winnerPlayers[0]].playerId;
  // Continue
  setTimeout(function () {
    _this.gameStarted = false;
    _this.triggerNewGame();
  },  this.afterRoundCountdown * 200 * gameSpeedFactor);
}catch(err){
  logger.log(err);
}
};
Room.prototype.updateLeaderboard = async function (playerConnId, playerId, objectsCollected, name, connection,reward) {
  try {
    if (this.currentEvent) {
      let leaderboardEntry = await this.sequelizeObjects.LeaderBoard.findOne({
        where: { LBID: this.currentEvent.id, userId: playerId }
      });

      if (leaderboardEntry) {
        this.totalObjects[playerConnId] = this.calculateObjectBarLimit(playerConnId);
        leaderboardEntry.objectsCollected += Math.round(objectsCollected);
        await leaderboardEntry.save();
        
        if(this.players[connection]?.connection){
          if(!this.players[connection].isBot){
          this.players[connection].connection.sendText(JSON.stringify({
          key: "BonusOnWinningHand",
          Objects: this.eventObjectsCollected[playerConnId],
          totalObjects: this.totalObjects[playerConnId],
          reward: reward
        })); }
      }

      } else {
        const [newLeaderboardEntry, created] = await this.sequelizeObjects.LeaderBoard.findOrCreate({
          where: { LBID: this.currentEvent.id, userId: playerId, playerName: name },
          defaults: { objectsCollected: 0 }
        });
        
        this.totalObjects[playerConnId] = this.calculateObjectBarLimit(playerConnId);
        newLeaderboardEntry.objectsCollected += Math.round(objectsCollected);
        await newLeaderboardEntry.save();
        
        //logger.log(this.eventObjectsCollected[playerConnId]);

        if(this.players[connection]?.connection){this.players[connection].connection.sendText(JSON.stringify({
          key: "BonusOnWinningHand",
          Objects: this.eventObjectsCollected[playerConnId],
          totalObjects: this.totalObjects[playerConnId],
        })); }

      }
    }
  } catch (error) {
    logger.log(error);
  }
};

Room.prototype.getStakeMultiplier = function () {
  let stakes = this.roomMinBet; 
  if (stakes <= 10000) {
      return 10; 
  } else if (stakes <= 50000) {
      return 20; 
  } else if (stakes <= 100000) {
      return 30; 
  } else {
      return 40;
  }
};
Room.prototype.calculateObjectBarLimit = function (playerConnId) {
  const baseLimit = 50; // Base starting limit
  let nextLimit = baseLimit;

  if (this.increment[playerConnId] && this.surpassobjectcount[playerConnId]) {
    this.increment[playerConnId] += 5;
    this.surpassobjectcount[playerConnId] = false; // Reset the surpass flag
  }

  nextLimit += this.increment[playerConnId] * 2; // Dynamically calculate the next limit
  return Math.floor(nextLimit);
  };
Room.prototype.rewardPlayer = async function (limit) {
  let multiplier = 1000;
  let reward = limit * multiplier; 
  return reward;
  
};
Room.prototype.retrieveWinners = function() {
  let winners = this.calculateWinners();
  this.sendwinStatusUpdate(winners);
};

Room.prototype.calculateWinners = function() {
  let evaluatedPlayers = this.players.map((player, index) => ({
    playerName: player.playerName,
    playerDatabaseId: player.playerDatabaseId,
    evaluatedHand: this.evaluatePlayerCards(index).value,
    winningAmount: this.calculateWinningAmount(player)
  }));

  evaluatedPlayers.sort((a, b) => b.evaluatedHand - a.evaluatedHand);
  return evaluatedPlayers.slice(0, 3);
};
Room.prototype.calculateWinningAmount = function(player) {
  return player.playerMoney + this.totalPot / this.players.length;
};
// Function to handle WebSocket updatesRoom.prototype.sendwinStatusUpdate = function(winners) {
  Room.prototype.sendwinStatusUpdate = function(winners) {
    const winnersData = winners.map((winner, index) => ({
      place: index + 1,
      playerName: winner.playerName,
      winningAmount: winner.winningAmount
    }));

  };
// Game has stopped middle of the game due everyone folded or disconnected except one
Room.prototype.roundResultsMiddleOfTheGame = async function () {
  try {
    const _this = this;
    let winnerPlayerIndex = -1;

    // Find the single remaining player who has not folded.
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i] !== null && !this.players[i].isFold) {
        winnerPlayerIndex = i;
        break;
      }
    }

    if (winnerPlayerIndex !== -1) {
      const winner = this.players[winnerPlayerIndex];

      // **Added Logic**:
      // Before collecting the main pot, clear any pending side bets
      // for the winning player and refund their wager.
      console.log(`[BettingSystem] Round ended early. Clearing side bets for winner: ${winner.playerName}`);
      await this.clearBetsForPlayer(winner);

      // Existing logic to award the main pot.
      this.collectChipsToPotAndSendAction();
      this.collectingPot = false;
      winner.playerMoney += this.totalPot;
      this.currentStatusText = `${winner.playerName} is the only standing player!`;
      this.currentTurnText = '';
      this.isResultsCall = true;
      this.updateLoggedInPlayerDatabaseStatistics([winnerPlayerIndex], this.lastWinnerPlayers);
      this.lastWinnerPlayers = [winnerPlayerIndex];
    }

    // Schedule the start of the next game.
    setTimeout(function () {
      _this.gameStarted = false;
      _this.triggerNewGame();
    }, this.afterRoundCountdown * 200 * gameSpeedFactor);

  } catch (error) {
    logger.log(error);
  }
};


// *********************************************************************************************************************
// *********************************************************************************************************************
/* Every betting round goes thru this logic */

Room.prototype.bettingRound = function (current_player_turn) {
  try{
  let _this = this;
  if (this.getActivePlayers()) { // Checks that game has active players (not fold ones)
    let verifyBets = this.verifyPlayersBets(); // Active players have correct amount of money in game
    let noRoundPlayedPlayer = this.getNotRoundPlayedPlayer(); // Returns player position who has not played it's round
    if (current_player_turn >= this.players.length || this.isCallSituation && verifyBets === -1 || verifyBets === -1 && noRoundPlayedPlayer === -1) {
      this.resetPlayerStates();
      if (verifyBets === -1 && this.smallBlindGiven) {
        if (noRoundPlayedPlayer === -1) {
          this.currentStage = this.currentStage + 1;
          if (this.collectChipsToPotAndSendAction()) { // Collect pot and send action if there is pot to collect
            setTimeout(function () {
              _this.collectingPot = false;
              _this.staging();
            }, 1000* gameSpeedFactor); // Have some time to collect pot and send action
          } else {
            setTimeout(function () {
              _this.staging(); // No pot to collect, continue without timing
            }, 1000* gameSpeedFactor);
          }
        } else {
          //this.bettingRound(noRoundPlayedPlayer);
          // --- going into testing ---
          this.players[noRoundPlayedPlayer].isPlayerTurn = true;
          this.players[noRoundPlayedPlayer].playerTimeLeft = this.turnTimeOut* gameSpeedFactor;
          this.currentTurnText = '' + this.players[noRoundPlayedPlayer].playerName + ' Turn';
          this.sendStatusUpdate();

          if (this.players[noRoundPlayedPlayer].isBot) {
            this.botActionHandler(noRoundPlayedPlayer);
          }
          this.bettingRoundTimer(noRoundPlayedPlayer);
          // --- going into testing ---
        }
      } else {
        this.isCallSituation = true;
        this.bettingRound(verifyBets);
      }

    } else {

      if (this.players[current_player_turn] != null || this.isCallSituation && verifyBets === -1 || !this.smallBlindGiven || !this.bigBlindGiven || !this.bigBlindPlayerHadTurn) { // 07.08.2018, added || !this.bigBlindPlayerHadTurn

        // Forced small and big blinds case
        if (this.currentStage === Room.HOLDEM_STAGE_TWO_PRE_FLOP && (!this.smallBlindGiven || !this.bigBlindGiven)) {
          this.playerCheck(this.players[current_player_turn].playerId, this.players[current_player_turn].socketKey,true);
          this.bettingRound(current_player_turn + 1);

        } else {
          if (!this.players[current_player_turn].isFold && !this.players[current_player_turn].isAllIn) {
            if (verifyBets !== -1 || !this.smallBlindGiven || !this.bigBlindGiven) {
              this.isCallSituation = true;
            }
            // player's turn
            this.players[current_player_turn].isPlayerTurn = true;
            this.players[current_player_turn].playerTimeLeft = this.turnTimeOut* gameSpeedFactor;
            this.currentTurnText = '' + this.players[current_player_turn].playerName + ' Turn';
            this.sendStatusUpdate();

            if (this.players[current_player_turn].isBot) {
              this.botActionHandler(current_player_turn);
            }
            this.bettingRoundTimer(current_player_turn);
          } else {
            this.current_player_turn = this.current_player_turn + 1;
            this.bettingRound(this.current_player_turn);
          }
        }
      } else {
        if (this.isCallSituation && verifyBets !== -1) {
          this.bettingRound(verifyBets);
        } else {
          this.current_player_turn = this.current_player_turn + 1;
          this.bettingRound(this.current_player_turn);
        }
      }

    }
  } else {
    this.roundResultsMiddleOfTheGame();
  }
}catch(error){
  logger.log(error);
}
};

Room.prototype.bettingRoundTimer = function (current_player_turn) {
    try {
        let turnTime = 0;
        const _this = this;

        this.turnIntervalObj = setInterval(function () {
            // This interval correctly checks if the player is null
            if (_this.players[current_player_turn] !== null) {
                if (_this.players[current_player_turn] && _this.players[current_player_turn].playerState === player.Player.PLAYER_STATE_NON) {
                    turnTime = turnTime + 1000;
                    _this.players[current_player_turn].playerTimeLeft = _this.turnTimeOut * gameSpeedFactor - turnTime;
                } else {
                    _this.clearTimers();
                    _this.bettingRound(current_player_turn + 1);
                }
            } else {
                _this.clearTimers();
                _this.bettingRound(current_player_turn + 1);
            }
        }, 1000);

        this.turnTimeOutObj = setTimeout(function () {
            // server crash fix
            // make sure the player object exists before trying to access it
            if (_this.players[current_player_turn]) {
                if (_this.players[current_player_turn].playerState === player.Player.PLAYER_STATE_NON) {
                    if (_this.currentHighestBet == 0) {
                        _this.players[current_player_turn].isCheck = true;
                        console.log("autoChecked is called /auto setting players isCheck to " + _this.players[current_player_turn].isCheck)
                        _this.playerCheck(_this.players[current_player_turn].playerId, _this.players[current_player_turn].socketKey, true);
                        _this.sendStatusUpdate();
                        _this.players[current_player_turn].isCheck = false;
                        console.log("after sending the status update resseting isCheck to " + _this.players[current_player_turn].isCheck);
                    } else {
                        _this.playerFold(this.sequelizeObjects, _this.players[current_player_turn].playerId, _this.players[current_player_turn].socketKey, false, true);
                        _this.sendStatusUpdate();
                        _this.autofold[_this.players[current_player_turn].playerId]++;
                        if (_this.autofold[_this.players[current_player_turn].playerId] >= 3) {
                            _this.autofold[_this.players[current_player_turn].playerId] = 0;
                            holdem.onPlayerLeaveRoom(_this.players[current_player_turn].connectionId, _this.players[current_player_turn].socketKey, _this.roomId);
                        }
                    }
                }
            }
            // ---- END OF FIX ----
            
            _this.clearTimers();
            _this.bettingRound(current_player_turn + 1);
        }, _this.turnTimeOut * gameSpeedFactor + 200);

    } catch (error) {
        logger.log(error);
    }
};

// *********************************************************************************************************************
// *********************************************************************************************************************


// ------------------------------------------------------------------------
/* Timers */

Room.prototype.clearTimers = function () {
  clearInterval(this.turnIntervalObj);
  clearTimeout(this.turnTimeOutObj);
};


// ------------------------------------------------------------------------
// Some helper methods

Room.prototype.sendStatusUpdate = function () {
  try{
  let response = {key: '', data: {}};
  response.key = 'statusUpdate';
  response.data.totalPot = this.totalPot;
  response.data.WiningAmount= this.potCollected;
  response.data.currentStatus = this.currentStatusText;
  response.data.currentTurnText = this.currentTurnText;
  response.data.middleCards = this.middleCards;
  response.data.playersData = [];
  response.data.highestBet = this.currentHighestBet;
  response.data.isCallSituation = this.isCallSituation;
  response.data.isResultsCall = this.isResultsCall;
  response.data.roundWinnerPlayerIds = this.roundWinnerPlayerIds;
  response.data.roundWinnerPlayerCards = this.roundWinnerPlayerCards;
  for (let i in this.players) {
    let playerData = {};
    playerData.playerId = this.players[i].playerId;
    playerData.connectionId = this.players[i].connectionId?this.players[i].connectionId:this.players[i].isBot?this.players[i].playerId:-1;
    playerData.playerDatabaseId = this.players[i].playerDatabaseId;
    playerData.playerName = this.players[i].playerName;
    playerData.profileImageLink = this.players[i].profileImageLink;
    playerData.playerMoney = this.players[i].playerMoney;
    playerData.totalBet = this.players[i].totalBet;
    playerData.isPlayerTurn = this.players[i].isPlayerTurn;
    playerData.isFold = this.players[i].isFold;
    playerData.isCheck = this.players[i].isCheck;
    playerData.isAllIn = this.players[i].isAllIn;
    playerData.giftID = this.giftsend[this.players[i].playerId] || -1;
    playerData.timeLeft = this.players[i].playerTimeLeft;
    playerData.timeBar = this.players[i].playerTimeLeft / this.turnTimeOut * 100* gameSpeedFactor;
    response.data.playersData[i] = playerData;
  }
  response.data.roomName = this.roomName; // Room name
  response.data.playingPlayersCount = this.players.length; // Players count in this room
  response.data.appendPlayersCount = this.playersToAppend.length; // Waiting to get appended in game players count
  response.data.spectatorsCount = this.spectators.length; // Spectating people count
  response.data.deckStatus = this.deckCard + '/' + this.deckSize;
  response.data.deckCardsBurned = this.deckCardsBurned; // How many cards is burned
  response.data.collectingPot = this.collectingPot;
  


  let waitingPlayerResponce = {key: '', data: {}};
  waitingPlayerResponce.key = 'WaitingPlayersStatus';
  waitingPlayerResponce.data.roomName = this.roomName; // Room name
  waitingPlayerResponce.data.playingPlayersCount = this.players.length; // Players count in this room
  waitingPlayerResponce.data.appendPlayersCount = this.playersToAppend.length;
  waitingPlayerResponce.data.playersData = [];
  for (let i = 0; i < this.playersToAppend.length; i++) {
    let playerData = {};
    playerData.playerId = this.playersToAppend[i].playerId;
    playerData.connectionId = this.playersToAppend[i].connectionId;
    playerData.playerName = this.playersToAppend[i].playerName;
    playerData.profileImageLink = this.playersToAppend[i].profileImageLink;
    playerData.playerMoney = this.playersToAppend[i].playerMoney;
    playerData.totalBet = this.playersToAppend[i].totalBet;
    playerData.giftID = -1;
    playerData.isPlayerTurn = this.playersToAppend[i].isPlayerTurn;
    playerData.isFold = this.playersToAppend[i].isFold;
    playerData.isCheck = this.players[i].isCheck;
    playerData.timeLeft = this.playersToAppend[i].playerTimeLeft;
    playerData.timeBar = this.playersToAppend[i].playerTimeLeft / this.turnTimeOut * 100* gameSpeedFactor;
    waitingPlayerResponce.data.playersData[i] =  playerData;
  }

  if (String(JSON.stringify(this.updateJsonTemp)) !== String(JSON.stringify(response))) { // Added !== (faster, no conversion over !=)
    for (let i = 0; i < this.players.length; i++) {
      this.updateJsonTemp = response;
      this.sendWebSocketData(i, response);
      this.sendWebSocketData(i, waitingPlayerResponce);
    }
    for (let w = 0; w < this.playersToAppend.length; w++) {
      this.sendWaitingPlayerWebSocketData(w, response);
      this.sendWaitingPlayerWebSocketData(w, waitingPlayerResponce);
    }
    for (let s = 0; s < this.spectators.length; s++) {
      this.sendSpectatorWebSocketData(s, response);
    }
  }

  
}catch(error){
    logger.log(error);
  }
};



//  -------------------------------------------------------------------------------------------------------------------
//send gift working
Room.prototype.sendGift = function (playerID,otherPlayerID,giftID) {
  try{
  let response = {key: '', data: {}};
  response.key = 'giftsend';
  response.data.playerID = playerID;
  response.data.otherPlayerID = otherPlayerID;
  response.data.giftID = giftID;
  this.giftsend[otherPlayerID] = giftID;
    for (let i = 0; i < this.players.length; i++) {
      this.sendWebSocketData(i, response);
    }
    for (let w = 0; w < this.playersToAppend.length; w++) {
      this.sendWebSocketData(w, response);
    }
  }catch(error){
    logger.log(error);
  }
};

Room.prototype.sendGiftToAll = function (playerID,giftID) {
  try{
    for (let j in this.players){
    let response = {key: '', data: {}};
    response.key = 'giftsend';
    response.data.playerID = playerID;
    response.data.otherPlayerID = this.players[j].connectionId?this.players[j].connectionId:this.players[j].isBot?this.players[j].playerId:-1;
    response.data.giftID = giftID;
    this.giftsend[this.players[j].connectionId?this.players[j].connectionId:this.players[j].isBot?this.players[j].playerId:-1] = giftID;
      for (let i = 0; i < this.players.length; i++) {
        this.sendWebSocketData(i, response);
      }
      for (let w = 0; w < this.playersToAppend.length; w++) {
        this.sendWebSocketData(w, response);
      }
  }
}catch(error){
    logger.log(error);
}
};


// ---------------------------------------------------------------------------------------------------------------------

// Remember that if small or big blind is not given, folding player must still pay blind
Room.prototype.playerFold = async function (sequelizeObjects, connection_id, socketKey,check,autofoldcall) {
  try{
  let playerId = this.getPlayerId(connection_id);
  if (this.players[playerId] !== undefined) {
    if (this.players[playerId].connection != null && this.players[playerId].socketKey === socketKey || this.players[playerId].isBot) {
      if (playerId !== -1) {
        // clearbets
              if (this.currentStage < Room.HOLDEM_STAGE_THREE_THE_FLOP) {
                  console.log(`[BettingSystem] Player '${this.players[playerId].playerName}' folded before the flop. Clearing their active side bets.`);
                  await this.clearBetsForPlayer(this.players[playerId]);
              }
       // end betclear
        if (!this.smallBlindGiven || !this.bigBlindGiven) {
          let blind_amount = 0;
          if (!this.smallBlindGiven && !this.bigBlindGiven) {
            blind_amount = (this.roomMinBet / 2);
            this.smallBlindGiven = true;
          } else if (this.smallBlindGiven && !this.bigBlindGiven) {
            blind_amount = this.roomMinBet;
            this.bigBlindGiven = true;
          }
          if (blind_amount <= this.players[playerId].playerMoney) {
            if (blind_amount === this.players[playerId].playerMoney || this.someOneHasAllIn()) {
              this.players[playerId].isAllIn = true;
            }
            this.players[playerId].totalBet = this.players[playerId].totalBet + blind_amount;
            this.players[playerId].playerMoney = this.players[playerId].playerMoney - blind_amount;
          }
        }
        this.players[playerId].setStateFold();
        this.checkHighestBet();
        //this.calculateTotalPot();
        this.sendLastPlayerAction(connection_id, PLAYER_ACTION_FOLD); 
        this.sendAudioCommand('fold');
        if(!autofoldcall)
        {        
        this.autofold[ this.players[playerId].playerId] = 0;
      }
        try{
        if(check){
        if(this.currentStage == Room.HOLDEM_STAGE_ONE_HOLE_CARDS || this.currentStage == Room.HOLDEM_STAGE_TWO_PRE_FLOP){
          dbUtils.UpdatePlayerFoldStatePromise(sequelizeObjects,this.players[playerId].playerDatabaseId,"PREFLOP").then((result) => {
            //logger.log("PREFLOP FOLD");
          });
        } else if(this.currentStage == Room.HOLDEM_STAGE_THREE_THE_FLOP || this.currentStage == Room.HOLDEM_STAGE_FOUR_POST_FLOP){
          dbUtils.UpdatePlayerFoldStatePromise(sequelizeObjects,this.players[playerId].playerDatabaseId,"FLOP").then((result) => {
            //logger.log("FLOP FOLD");
          });
        } else if(this.currentStage == Room.HOLDEM_STAGE_FIVE_THE_TURN || this.currentStage == Room.HOLDEM_STAGE_SIX_THE_POST_TURN){
          dbUtils.UpdatePlayerFoldStatePromise(sequelizeObjects,this.players[playerId].playerDatabaseId,"TURN").then((result) => {
            //logger.log("TURN FOLD");
          });
        } else if(this.currentStage == Room.HOLDEM_STAGE_SEVEN_THE_RIVER || this.currentStage == Room.HOLDEM_STAGE_EIGHT_THE_SHOW_DOWN){
          dbUtils.UpdatePlayerFoldStatePromise(sequelizeObjects,this.players[playerId].playerDatabaseId,"RIVER").then((result) => {
            //logger.log("RIVER FOLD");
          });
        }
      }
      
     
    }
      catch (e) {
        logger.log(e);
        
      }}
    }
  }
}catch(err){
  logger.log(err);
}
};


// Player checks but also Call goes tru this function
Room.prototype.playerCheck = async function (connection_id, socketKey,isCall) {
  try{
  let playerId = this.getPlayerId(connection_id);
  if (this.players[playerId] != null){
    if ( this.players[playerId].socketKey === socketKey || this.players[playerId].isBot) {
    
      if (playerId !== -1) {
        let check_amount = 0;
        if (this.isCallSituation || this.totalPot === 0 || !this.smallBlindGiven || !this.bigBlindGiven) {
          if (this.smallBlindGiven && this.bigBlindGiven) {
            check_amount = this.currentHighestBet === 0 ? this.roomMinBet : (this.currentHighestBet - this.players[playerId].totalBet);
          } else {
            if (this.smallBlindGiven && !this.bigBlindGiven) {
              check_amount = this.roomMinBet;
              this.bigBlindGiven = true;
              this.players[playerId].roundPlayed = false; // 07.08.2018, remove if causes problems
            } else {
              check_amount = this.roomMinBet / 2;
              this.smallBlindGiven = true;
            }
          }
          if (check_amount <= this.players[playerId].playerMoney) {
            this.players[playerId].setStateCheck();
            let activePlayers = this.getActivePlayersCount();
            let AllinPlayers = this.someOneHasAllInCount();
            if ((check_amount === this.players[playerId].playerMoney || this.someOneHasAllIn()) && AllinPlayers.length === activePlayers.length - 1) {
              this.players[playerId].isAllIn = true;

            }
            this.players[playerId].totalBet = this.players[playerId].totalBet + check_amount;
            this.players[playerId].playerMoney = this.players[playerId].playerMoney - check_amount;
          }
          if (this.isCallSituation) {
            this.sendLastPlayerAction(connection_id, PLAYER_ACTION_CALL);
              const response = await this.challenge(this.players[playerId].playerDatabaseId,'Call Bets');
              if(response){
                this.players[playerId].connection.sendText(JSON.stringify({
                  key: "challengeStatus",
                  data: response
                }))
              }
            
          }
        } else {
         
          this.players[playerId].setStateCheck();
          this.sendLastPlayerAction(connection_id, PLAYER_ACTION_CHECK);
        }
        if (this.isCallSituation || check_amount > 0) {
          this.sendAudioCommand('call');
          if(!isCall){
            this.autofold[ this.players[playerId].playerId] = 0;
          }


        } else {
          this.sendAudioCommand('check');
          this.autofold[ this.players[playerId].playerId] = 0;



        }
        this.checkHighestBet();
        //this.calculateTotalPot();
      }
    }
  }
}catch(err){
  logger.log(err);
}
};


Room.prototype.playerRaise = async function (connection_id, socketKey, amount) {
  try {
    let playerId = this.getPlayerId(connection_id);
    console.log(`--- playerRaise triggered for connection_id: ${connection_id} with amount: ${amount} ---`);

    if (this.players[playerId] && (this.players[playerId].socketKey === socketKey || this.players[playerId].isBot)) {
      if (playerId !== -1) {
        let player = this.players[playerId];
        // We check this to know if the player INTENDED to go all-in for challenge/stat purposes
        let isAllInAction = (amount >= player.playerMoney);

        console.log(`[playerRaise] Player: ${player.playerName}, Current Money: ${player.playerMoney}, Current Bet: ${player.totalBet}`);
        
        // Logic to cap bets
        // This logic runs on every raise to check for capping.
        
        // Find the largest total stack (money + current bet) among all active opponents.
        let maxOpponentStack = 0;
        for (let i = 0; i < this.players.length; i++) {
          if (i !== playerId && this.players[i] && !this.players[i].isFold) {
            const opponentStack = this.players[i].playerMoney + this.players[i].totalBet;
            if (opponentStack > maxOpponentStack) {
              maxOpponentStack = opponentStack;
            }
          }
        }
        
        // The total amount the player is trying to have in the pot after this raise.
        const intendedTotalBet = player.totalBet + amount;

        console.log(`[playerRaise] Player's Intended Total Bet: ${intendedTotalBet}`);
        console.log(`[playerRaise] Max Opponent Stack Available to Call: ${maxOpponentStack}`);

        // If the intended total bet exceeds what the biggest opponent can call, we must cap the raise amount.
        if (maxOpponentStack > 0 && intendedTotalBet > maxOpponentStack) {
          console.log(`[playerRaise] Intended bet (${intendedTotalBet}) exceeds opponent's max stack (${maxOpponentStack}). Capping bet.`);
          
          // The new raise amount is the difference between the opponent's stack and what we've already bet.
          const cappedAmount = maxOpponentStack - player.totalBet;
          const originalAmount = amount;
          amount = cappedAmount > 0 ? cappedAmount : 0; // Update the amount for the rest of the function.

          console.log(`[playerRaise] Raise amount has been CAPPED from ${originalAmount} to ${amount}`);
        }
        // end of bet cap logic
        
        // This block handles a normal, non-all-in raise.
        if (amount < player.playerMoney) {
          console.log(`[playerRaise] Processing as a normal raise.`);
          player.setStateRaise();
          player.totalBet += amount;
          player.playerMoney -= amount;
          this.isCallSituation = true;
        // This block handles a bet that uses all (or all that's left after capping) of the player's money.
        } else { 
          console.log(`[playerRaise] Processing as an all-in.`);
          player.setStateRaise();
          player.isAllIn = true;
          // The final bet amount cannot be more than the player's available money.
          const finalBetAmount = Math.min(amount, player.playerMoney); 
          player.totalBet += finalBetAmount;
          player.playerMoney -= finalBetAmount;
        }

        console.log(`[playerRaise] Final State - Player: ${player.playerName}, New Money: ${player.playerMoney}, New Bet: ${player.totalBet}, Is All-In: ${player.isAllIn}`);

        // Handle blinds if they haven't been given yet.
        if (!this.smallBlindGiven || !this.bigBlindGiven) {
          if (amount >= (this.roomMinBet / 2)) this.smallBlindGiven = true;
          if (amount >= this.roomMinBet) this.bigBlindGiven = true;
        }

        // Handle original all-in intent for challenges, even if the bet was capped.
        if (isAllInAction) {
          player.isAllIn = true; // Ensure the all-in flag is set if the intent was there.
          const response = await this.challenge(player.playerDatabaseId, 'All-In Win');
          if (response && player.connection) {
            player.connection.sendText(JSON.stringify({
              key: "challengeStatus",
              data: response
            }));
          }
        }
        
        // Send notifications and audio commands for the raise.
        this.sendLastPlayerAction(connection_id, PLAYER_ACTION_RAISE);
        this.sendAudioCommand('raise');
        this.autofold[player.playerId] = 0;
        
        // Check the highest bet after the raise.
        this.checkHighestBet();
      }
    }
  } catch (err) {
    console.error('[playerRaise] ---!!! An error occurred !!!---', err);
    logger.log(err);
  }
};

Room.prototype.someOneHasAllInCount = function () {
  try {
    let count = 0;
    let activePlayers = [];
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].isAllIn) {
        count++;
        activePlayers.push(this.players[i]);
      }
    }
    //logger.log(`player count for all in is ${count}`);
    return activePlayers;
  } catch (err) {
    logger.log(err);
  }
};
Room.prototype.getActivePlayersCount = function () {
  try {
    let activePlayers = [];
    for (let i in this.players){
      if (this.players[i] !== null && !this.players[i].isFold) {
        activePlayers.push(this.players[i]);
      }
    }
    return activePlayers; // Return the list of active players
  } catch (err) {
    logger.log(err);
    return [];
  }
};

// ---------------------------------------------------------------------------------------------------------------------

/*
Room.prototype.calculateTotalPot = function () {
    //this.totalPot = 0;
    this.totalPot = this.totalPot + this.tempPot;
    for (let i = 0; i < this.players.length; i++) {
        this.totalPot = this.totalPot + this.players[i].totalBet;
    }
};
*/


// Burn one card before dealing
Room.prototype.burnCard = function () {
  this.deckCard = this.deckCard + 1;
  this.deckCardsBurned = this.deckCardsBurned + 1;
};


Room.prototype.resetPlayerParameters = function () {
  try{
  this.resetPlayerStates();
  for (let i = 0; i < this.players.length; i++) {
    this.players[i].resetParams();
    this.players[i].checkFunds(this.roomMinBet);
  }
}catch(err){
  logger.log(err);
}
};

Room.prototype.resetPlayerStates = function () {
  try{
  for (let i = 0; i < this.players.length; i++) {
    this.players[i].playerState = player.Player.PLAYER_STATE_NON;
  }
}catch(err){
  logger.log(err);
}
};


// Method checks that every player has correct amount of money in bet
Room.prototype.verifyPlayersBets = function () {
  try{
  let highestBet = 0;
  for (let i = 0; i < this.players.length; i++) { // Get highest bet
    if (this.players[i] != null) {
      if (!this.players[i].isFold) {
        if (highestBet === 0) {
          highestBet = this.players[i].totalBet;
        }
        if (this.players[i].totalBet > highestBet) {
          highestBet = this.players[i].totalBet;
        }
      }
    }
  }
  for (let i = 0; i < this.players.length; i++) { // Find some one with lower bet
    if (this.players[i] != null) {
      if (!this.players[i].isFold && !this.players[i].isAllIn) {
        if (this.players[i].totalBet < highestBet) {
          return i;
        }
      }
    }
  }
  return !this.smallBlindGiven || !this.bigBlindGiven ? 0 : -1;
}catch(err){
  logger.log(err);
}
};


Room.prototype.checkHighestBet = function () {
  try{
  for (let i = 0; i < this.players.length; i++) {
    if (this.players[i].totalBet > this.currentHighestBet) {
      this.currentHighestBet = this.players[i].totalBet;
    }
  }
}catch(err){
  logger.log(err);
}
};


// Get room parameters
Room.prototype.getRoomParams = function () {
  try{
  let response = {key: '', data: {}};
  response.key = 'roomParams';
  response.data.gameStarted = !!(this.currentStage >= Room.HOLDEM_STAGE_ONE_HOLE_CARDS && this.holeCardsGiven);
  response.data.playerCount = this.players.length;
  response.data.roomMinBet = this.roomMinBet;
  response.data.middleCards = this.middleCards;
  response.data.tableStakes = this.tableStakes;

  response.data.holdemType = this.holdemType;
  response.data.tableType = this.tableType;
  response.data.tableOwner = this.tableOwner;

  response.data.playersData = [];
  for (let i = 0; i < this.players.length; i++) {
    let playerData = {};
    playerData.playerId = this.players[i].playerId;
    playerData.playerName = this.players[i].playerName;
    playerData.playerMoney = this.players[i].playerMoney;
    playerData.isDealer = this.players[i].isDealer;
    response.data.playersData[i] = playerData;
  }
  return response;
}catch(err){
  logger.log(err);
}
};


// Send data to game players via this function
Room.prototype.sendWebSocketData = async function (player, data) {
  try{
  if (this.players[player] != null && !this.players[player].isBot) {
    if (this.players[player].connection != null) {
      if (this.players[player].connection.readyState === OPEN) {
        //console.log('* Sending data: ' + JSON.stringify(data));
        
        if(this.players[player].connection!=null){
        this.players[player].connection.sendText(JSON.stringify(data));
        }
      } else {
        this.players[player].connection = null;
      }
    } else {
      this.players[player].setStateFold();
    }
  }
}catch(err){
  logger.log(err);
}
};


// Send data to waiting game players via this function
Room.prototype.sendWaitingPlayerWebSocketData = function (player, data) {
  try{
  if (this.playersToAppend[player] != null && !this.playersToAppend[player].isBot) {
    if (this.playersToAppend[player].connection != null) {
      if (this.playersToAppend[player].connection.readyState === OPEN) {
        this.playersToAppend[player].connection.sendText(JSON.stringify(data));
      } else {
        this.playersToAppend[player].connection = null;
      }
    }
  }
}catch(err){
  logger.log(err);
}
};


// Send room status data to spectators
Room.prototype.sendSpectatorWebSocketData = function (spectator, data) {
  try{
  if (this.spectators[spectator] != null) {
    if (this.spectators[spectator].connection != null) {
      if (this.spectators[spectator].connection.readyState === OPEN) {
        this.spectators[spectator].connection.sendText(JSON.stringify(data));
      }
    }
  }
}catch(err){
  logger.log(err);
}
};


// Clean spectators with this function
Room.prototype.cleanSpectators = function () {
  try{
  this.spectatorsTemp = [];
  for (let i = 0; i < this.spectators.length; i++) { // Take good spectators to temp array
    if (this.spectators[i] !== null) {
      if (this.spectators[i].connection !== null) {
        this.spectatorsTemp.push(this.spectators[i]);
      }
    }
  }
  this.spectators = []; // Clear main spectators array before refilling with good ones
  for (let p = 0; p < this.spectatorsTemp.length; p++) {
    if (this.spectatorsTemp[p] !== null) {
      if (this.spectatorsTemp[p].connection !== null) {
        this.spectators.push(this.spectatorsTemp[p]);
      }
    }
  }
}catch(err){
  logger.log(err);
}
};


// Clean spectators with this function
Room.prototype.LeaveRoom = async function (connectionId, player) { // <-- Made this function async
  try {
    logger.log("Leave room called in room", logger.LOG_GREEN);

    const playerId = connectionId;
    let playerLeft = false;
    let leavingPlayer = null;

    // Iterate through playersToAppend to find and handle the specific player
    for (let p = 0; p < this.playersToAppend.length; p++) {
      if (this.playersToAppend[p] && this.playersToAppend[p].connection) {
        if (this.playersToAppend[p].playerId === playerId) {
          leavingPlayer = this.playersToAppend[p];
          let abc = { key: "GetPlayerInfoNow", data: {} };
          if(leavingPlayer.connection) {
            leavingPlayer.connection.sendText(JSON.stringify(abc));
          }
          leavingPlayer.selectedRoomId = -1;
          this.giftsend[leavingPlayer.playerId] = -1;
          this.roomLeft.push(this.playersToAppend[p]);
          this.playersToAppend.splice(p, 1);
          playerLeft = true;
          break;
        }
      }
    }

    // If the player wasn't found in playersToAppend, check the main players list
    if (!playerLeft) {
      for (let p = 0; p < this.players.length; p++) {
        if (this.players[p] && this.players[p].playerId === playerId) {
          leavingPlayer = this.players[p];
          let abc = { key: "GetPlayerInfoNow", data: {} };
          if (leavingPlayer.connection) {
            leavingPlayer.connection.sendText(JSON.stringify(abc));
          }
          leavingPlayer.selectedRoomId = -1;
          this.giftsend[leavingPlayer.playerId] = -1;
          this.roomLeft.push(this.players[p]);
          this.players.splice(p, 1);
          break;
        }
      }
    }

    if (leavingPlayer) {
      // clear bets on leave
      // We check if the game is in a pre-flop stage. If so, any active side bets should be refunded.
      //commented this code because its also being triggered in fold and fold is called when leaveroom is called
      // if (this.currentStage < Room.HOLDEM_STAGE_THREE_THE_FLOP) {
      //     console.log(`[BettingSystem] Player left before the flop. Clearing their active side bets.`);
      //     await this.clearBetsForPlayer(leavingPlayer);
      // }

      this.giftsend[leavingPlayer.playerId] = -1;
      const leaveMessage = {
        key: "PlayerLeft",
        data: {
          playerId: leavingPlayer.playerId,
          UserId: leavingPlayer.playerDatabaseId, 
          playerName: leavingPlayer.playerName, 
        }
      };

      // Notify all players in playersToAppend
      for (const p of this.playersToAppend) {
        if (p.connection && !p.isBot) {
          p.connection.sendText(JSON.stringify(leaveMessage));
        }
      }

      // Notify all players in players
      for (const p of this.players) {
        if (p.connection && !p.isBot) {
          p.connection.sendText(JSON.stringify(leaveMessage));
        }
      }
    }

    this.checkLeavePlayers();

  } catch (err) {
    logger.log(err);
  }
};


// Needed to be able to play other players command audio on client side
Room.prototype.sendAudioCommand = async function (action) {
  try{
  let response = {key: '', data: {}};
  response.key = 'audioCommand';
  response.data.command = action;
  for (let i = 0; i < this.players.length; i++) {
    this.updateJsonTemp = response;
    this.sendWebSocketData(i, response);
  }
  
  for (let w = 0; w < this.playersToAppend.length; w++) {
    this.sendWaitingPlayerWebSocketData(w, response);
  }
  for (let s = 0; s < this.spectators.length; s++) {
    this.sendSpectatorWebSocketData(s, response);
  }
}catch(err){
  logger.log(err);
}
 
};


// Animated last user action text command
Room.prototype.sendLastPlayerAction = function (connection_id, actionStr) {
  try{
  let response = {key: '', data: {}};
  
  response.key = 'lastUserAction';
  this.lastUserAction.playerId = connection_id;
  this.lastUserAction.actionText = actionStr;
  
  // Get player's bet amount
  let playerId = this.getPlayerId(connection_id);
  let betAmount = 0;
  if (playerId !== -1 && this.players[playerId] != null) {
    betAmount = this.players[playerId].totalBet;
  }
  this.lastUserAction.betAmount = betAmount;
  
  response.data = JSON.stringify(this.lastUserAction);
  for (let i = 0; i < this.players.length; i++) {
    this.updateJsonTemp = response;
    this.sendWebSocketData(i, response);
  }
  for (let w = 0; w < this.playersToAppend.length; w++) {
    this.sendWaitingPlayerWebSocketData(w, response);
  }
  for (let s = 0; s < this.spectators.length; s++) {
    this.sendSpectatorWebSocketData(s, response);
  }
}catch(err){
  logger.log(err);
}
};


// Collect chips to pot action, collects and clears user total pots for this round
Room.prototype.collectChipsToPotAndSendAction = function () {
  try{
  // Collections
  let boolMoneyToCollect = false;
  for (let u = 0; u < this.players.length; u++) {
    if (this.players[u].totalBet > 0) {
      boolMoneyToCollect = true;
      this.roundTotalBet[u] = (this.roundTotalBet[u] || 0) + this.players[u].totalBet;
    }
    this.totalPot = this.totalPot + this.players[u].totalBet; 
    this.players[u].totalBet = 0; // It's collected, we can empty players total bet
  }
  // Send animation action
  if (boolMoneyToCollect) {
    this.collectingPot = true;
    let response = {key: '', data: {}};
    console.log("sending collectChipsToPot event")
    response.key = 'collectChipsToPot';
    for (let i = 0; i < this.players.length; i++) {
      this.updateJsonTemp = response;
      this.sendWebSocketData(i, response);
    }
    for (let w = 0; w < this.playersToAppend.length; w++) {
      this.sendWaitingPlayerWebSocketData(w, response);
    }
    for (let s = 0; s < this.spectators.length; s++) {
      this.sendSpectatorWebSocketData(s, response);
    }
    return true; // Money to collect, wait before continuing to staging
  }
  return false; // No money to collect, continue staging without delay
}catch(err){
  logger.log(err);
}
};


// Custom message to send to a playing client before object is moved
Room.prototype.sendClientMessage = function (playerObject, message) {
  try{
  let response = {key: '', data: {}};
  response.key = 'clientMessage';
  response.data.message = message;
  if (playerObject.connection != null) {
    if (playerObject.connection.readyState === OPEN) {
      playerObject.connection.sendText(JSON.stringify(response));
    }
  }
}catch(err){
  logger.log(err);
}
};


Room.prototype.getNextDeckCard = function () {
  let nextCard = this.deck[this.deckCard];
  this.deckCard = this.deckCard + 1;
  return nextCard;
};


Room.prototype.getPlayerId = function (connection_id) {
  try{
  let playerId = -1;
  for (let i = 0; i < this.players.length; i++) {
    if (this.players[i].playerId === connection_id) {
      playerId = i;
      break;
    }
  }
  return playerId;
}catch(err){
  logger.log(err);
}
};


Room.prototype.getActivePlayers = function () {
  try{
  let count = 0;
  for (let i = 0; i < this.players.length; i++) {
    if (this.players[i] !== null) {
      if (!this.players[i].isFold) {
        count = count + 1;
      }
    }
  }
  return count > 1;
}catch(err){
  logger.log(err);
}
};


// Function checks if some one has all in
Room.prototype.someOneHasAllIn = function () {
  try {
    let count = 0;
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].isAllIn) {
        count++;
      }
    }
    //logger.log(`player count for all in is ${count}`);
    return count > 0 ? count : null;
  } catch (err) {
    logger.log(err);
  }
};


// Set next dealer player
Room.prototype.setNextDealerPlayer = function () {
  try{
  this.dealerPlayerArrayIndex = this.dealerPlayerArrayIndex + 1;
  if (this.dealerPlayerArrayIndex >= this.players.length) {
    this.dealerPlayerArrayIndex = 0;
  }
  if(this.players.length>0){
  this.players[this.dealerPlayerArrayIndex].isDealer = true;
}
  }catch(err){
    logger.log(err);
  }
};


// Get next small blind player
Room.prototype.getNextSmallBlindPlayer = function () {
  try{
  if (this.players.length > 2) {
    this.smallBlindPlayerArrayIndex = this.dealerPlayerArrayIndex + 1;
    if (this.smallBlindPlayerArrayIndex >= this.players.length) {
      this.smallBlindPlayerArrayIndex = 0;
    }
  } else {
    this.smallBlindPlayerArrayIndex = this.dealerPlayerArrayIndex;
  }
}catch(err){
  logger.log(err);
}
};


// Get next big blind player
// Note: always get thru smallBlindPlayerArrayIndex since +2 can convert position to one backwards after >= checking 2 comes 1
Room.prototype.getNextBigBlindPlayer = function () {
  try{
  let bigBlindPlayerIndex = this.smallBlindPlayerArrayIndex + 1;
  if (bigBlindPlayerIndex >= this.players.length) {
    bigBlindPlayerIndex = 0;
  }
  return bigBlindPlayerIndex;
}catch(err){
  logger.log(err);
}
};


// Reset player round related parameters
Room.prototype.resetRoundParameters = function () {
  try{
  for (let i = 0; i < this.players.length; i++) {
    this.players[i].roundPlayed = false;
  }
}catch(err){
  logger.log(err);
}
};


// Get player which has not played round
Room.prototype.getNotRoundPlayedPlayer = function () {
  try{
  // Check that all players have had their turn
  for (let i = 0; i < this.players.length; i++) {
    if (!this.players[i].isFold && !this.players[i].roundPlayed && !this.players[i].isAllIn) {
      return i;
    }
  }
  // Check that big blind player have had it's turn
  if (this.currentStage === Room.HOLDEM_STAGE_TWO_PRE_FLOP && this.smallBlindGiven && this.bigBlindGiven && this.bigBlindPlayerHadTurn === false) {
    this.bigBlindPlayerHadTurn = true;
    let bigBlindPlayer = this.getNextBigBlindPlayer();
    this.players[bigBlindPlayer].playerState = player.Player.PLAYER_STATE_NON;
    this.players[bigBlindPlayer].roundPlayed = false;
    //logger.log('Big blind player: ' + bigBlindPlayer, logger.LOG_CYAN);
    return bigBlindPlayer;
  }
  // Otherwise return -1 to continue
  return -1;
}catch(err){
  logger.log(err);
}
};


// Evaluate player hand
Room.prototype.evaluatePlayerCards = function (current_player) {
  try{
  let cardsToEvaluate = [];
  let ml = this.middleCards.length;
  // Push available middle cards
  for (let i = 0; i < ml; i++) {
    if (this.middleCards[i] !== void 0) { // Index is not 'undefined'
      cardsToEvaluate.push(this.middleCards[i]);
    }
  }
  // Push player hole cards
  if (this.players[current_player] === undefined) {
    return {value: 0, handName: null};
  } else {
    if (this.players[current_player].playerCards == null || this.players[current_player].playerCards === undefined) { // 03.08.2018 bug fix
      return {value: 0, handName: null};
    } else {
      cardsToEvaluate.push(this.players[current_player].playerCards[0]);
      cardsToEvaluate.push(this.players[current_player].playerCards[1]);
      let cl = cardsToEvaluate.length;
      if (cl === 3 || cl === 5 || cl === 6 || cl === 7) {
        return evaluator.evalHand(cardsToEvaluate);
      } else {
        return {value: null, handName: null};
      }
    }
  }
}catch(err){
  logger.log(err);
}
};


// Update logged in users database statistics (Input is array of this.players indexes)
Room.prototype.updateLoggedInPlayerDatabaseStatistics = function (winnerPlayers, lastWinnerPlayers) {
  try{
  for (let i = 0; i < this.players.length; i++) {
    if (this.players[i] !== null) {
      if (this.players[i].connection !== null) {
        if (!this.players[i].isBot && this.players[i].isLoggedInPlayer()) {

          // this.fancyLogGreen(this.arrayHasValue(winnerPlayers, i));
          if (this.arrayHasValue(winnerPlayers, i)) { // Update win count
            let winStreak = this.arrayHasValue(lastWinnerPlayers, i);
            dbUtils.UpdatePlayerWinCountPromise(this.sequelizeObjects, this.eventEmitter, this.players[i].playerId, this.players[i].playerDatabaseId, winStreak).then(() => {
            });
            this.players[i].playerWinCount = this.players[i].playerWinCount + 1;

          } else {

            // Update lose count (update only if money is raised up from small and big blinds)
            if (this.totalPot > (this.roomMinBet * this.players.length)) {
              this.players[i].playerLoseCount = this.players[i].playerLoseCount + 1;
              dbUtils.UpdatePlayerLoseCountPromise(this.sequelizeObjects, this.players[i].playerDatabaseId).then(() => {
              });
            }
          }
          let PlayerWinMoney = this.players[i].playersAllMoney + +this.players[i].playerMoney;
          // Update player funds
          if(PlayerWinMoney > this.players[i].biggestWallet ){
            this.players[i].biggestWallet = PlayerWinMoney;
          }
          dbUtils.UpdatePlayerMoneyPromise(this.sequelizeObjects, this.players[i].playerDatabaseId, PlayerWinMoney).then(() => {
          });
          
          dbUtils.InsertPlayerStatisticPromise(
            this.sequelizeObjects, this.players[i].playerDatabaseId,
            PlayerWinMoney, this.players[i].playerWinCount,
            this.players[i].playerLoseCount
          ).then(() => {
            //logger.log('Updated player ' + this.players[i].playerName + ' statistics.', logger.LOG_GREEN);
          }).catch(error => {
            logger.log(error, logger.LOG_RED);
          });
        }
      }
    }
  }
  this.sendStatusUpdate();
}catch(err){
  logger.log(err);
}
};


// Array has player
Room.prototype.arrayHasValue = function (array, value) {
  try{
  let l = array.length;
  for (let i = 0; i < l; i++) {
    if (array[i] === value) {
      return true;
    }
  }
  return false;
}catch(err){
  logger.log(err);
}
};


// ---------------------------------------------------------------------------------------------------------------------


Room.prototype.botActionHandler = function (current_player_turn) {
  try{
  const _this = this;
  let check_amount = (this.currentHighestBet === 0 ? this.roomMinBet : (this.currentHighestBet - this.players[current_player_turn].totalBet));
  //logger.log('check_amount: ' + check_amount);
  //logger.log('currentHighestBet: ' + this.currentHighestBet);
  //logger.log('bot all money'+ this.players[current_player_turn].playersAllMoney);
  let activePlayers = this.getActivePlayersCount();
  let AllinPlayers = this.someOneHasAllInCount();
  for(otherPlayerID in this.players){
  if(AllinPlayers.length === activePlayers.length - 1 && !this.players[otherPlayerID].isAllIn &&this.players[current_player_turn].totalBet<=this.players[otherPlayerID].totalBet){
        this.players[otherPlayerID].isAllIn = true;
        /* this.isCallSituation = false; */
  }
  }
  let playerId = this.players[current_player_turn].playerId;
  let botObj = new bot.Bot(
    this.holdemType,
    this.players[current_player_turn].playerName,
    this.players[current_player_turn].playerMoney,
    this.players[current_player_turn].playerCards,
    this.isCallSituation,
    this.roomMinBet,
    check_amount,
    this.smallBlindGiven,
    this.bigBlindGiven,
    this.evaluatePlayerCards(current_player_turn).value,
    this.currentStage,
    this.players[current_player_turn].totalBet,
    this.tableOwner,
    this.currentHighestBet
  );
  let resultSet = botObj.performAction();
  let tm = setTimeout(function () {
    switch (resultSet.action) {
      case 'bot_fold':
        _this.playerFold(this.sequelizeObjects,playerId);
        break;
      case 'bot_check':
        _this.playerCheck(playerId);
        break;
      case 'bot_call':
        _this.playerCheck(playerId);
        break;
      case 'bot_raise':
        _this.playerRaise(playerId, null, resultSet.amount);
        break;
      case 'remove_bot': // Bot run out of money
        _this.playerFold(playerId);
        _this.removeBotFromRoom(current_player_turn);
        break;
      default:
        _this.playerCheck(playerId);
        break;
    }
    _this.sendStatusUpdate();

    clearTimeout(tm);
  }, config.games.holdEm.bot.turnTimes[utils.getRandomInt(1, 4)]);
}catch(err){
  logger.log(err);
}
};


Room.prototype.removeBotFromRoom = function (current_player_turn) {
  try{
  this.eventEmitter.emit('needNewBot', this.roomId);
  this.players[current_player_turn].connection = null;
  }catch(err){
    logger.log(err);
  }
};


// Returns count of bots in this room
Room.prototype.getRoomBotCount = function () {
  try{
  let l = this.players.length;
  let c = 0;
  for (let i = 0; i < l; i++) {
    if (this.players[i].isBot) {
      c++;
    }
  }
  return c;
}catch(err){
  logger.log(err);
}
};


// ---------------------------------------------------------------------------------------------------------------------

// Extend array capabilities
// noinspection JSUnusedGlobalSymbols
Room.prototype.contains = function (array, element) {
  try{
  return this.indexOf(element) > -1;
}catch(err){
  logger.log(err);
}
};


Room.prototype.indexOf = function indexOf(member, startFrom) {
  try{
  if (this == null) {
    throw new TypeError('Array.prototype.indexOf() - can\'t convert `\' + this + \'` to object');
  }
  let index = isFinite(startFrom) ? Math.floor(startFrom) : 0,
    that = this instanceof Object ? this : new Object(this),
    length = isFinite(that.length) ? Math.floor(that.length) : 0;
  if (index >= length) {
    return -1;
  }
  if (index < 0) {
    index = Math.max(length + index, 0);
  }
  if (member === undefined) {
    do {
      if (index in that && that[index] === undefined) {
        return index;
      }
    } while (++index < length);
  } else {
    do {
      if (that[index] === member) {
        return index;
      }
    } while (++index < length);
  }
  return -1;
}catch(err){
  logger.log(err);
}
};

// ---------------------------------------------------------------------------------------------------------------------

Room.prototype.challenge = async function (playerId, challengename) {
 try {
  let challenge = await this.sequelizeObjects.DailyChallenges.findOne({
    where:{
      name:challengename
    }
  })
  let user = await this.sequelizeObjects.UserChallenge.findOne({
    where:{
      userId:playerId,
      challengeId:challenge.id,
      isCompleted:false
    }
  })
  if(user){
  switch(challenge.name){
    case "Play Hands":
      return this.playHands(playerId,challenge.id);
    case "Win Hands":
      return this.winHands(playerId,challenge.id);
    case "Fold Hands":
      return this.foldHands(playerId,challenge.id);
    case "See Flops":
      return this.seeFlops(playerId,challenge.id);
    case "Pair Wins":
      return this.winPair(playerId,challenge.id);
    case "Straight Win":
      return this.winStraight(playerId,challenge.id);
    case "Flush Win":
      return this.winFlush(playerId,challenge.id);
    case"Full House":
      return this.winFullHouse(playerId,challenge.id);
    case"Two Pairs":
      return this.winTwoPairs(playerId,challenge.id);
    case"River Reach":
      return this.winRiverReach(playerId,challenge.id);
    case "Raise Bets":
      return this.raiseBets(playerId,challenge.id);
    case "Call Bets":
      return this.callBets(playerId,challenge.id);
    case "Bluff Wins":
      return this.winBluff(playerId,challenge.id);
    case"Bet Chips":
      return this.betChips(playerId,challenge.id);
    case"High Card":
      return this.highCard(playerId,challenge.id);
    case"Three Kind":
      return this.winThreeKind(playerId,challenge.id);
    case"Consecutive Wins":
      return this.consecutiveWins(playerId,challenge.id);
    case"All-In Plays":
      return this.allInPlays(playerId,challenge.id);
    case"All-In Win":
      return this.winAllIn(playerId,challenge.id);
    case"Earn Chips":
      return this.earnChips(playerId,challenge.id);
    case"Royal Loyal":
      return this.winRoyalLoyal(playerId,challenge.id);
    case"Flush Wins":
      return this.winFlushWins(playerId,challenge.id);
    case"Straight Wins":
      return this.winStraightWins(playerId,challenge.id);
    case"Final Table":
      return this.finalTable(playerId,challenge.id);
    case"Different Rooms":
      return this.differentRooms(playerId,challenge.id);
    case"Three Hands":
      return this.threeHands(playerId,challenge.id);
    case"Two's Three":
      return this.twosThree(playerId,challenge.id);
    case"Pair Wear":
      return this.pairWear(playerId,challenge.id);
    case"Flop Bets":
      return this.flopBets(playerId,challenge.id);
    case"Pair Bets":
      return this.pairBets(playerId,challenge.id);
    case"Four Kinds":
      return this.fourKinds(playerId,challenge.id);
    case"Full Win":
      return this.fullWin(playerId,challenge.id);
    case"Straight Chips":
      return this.straightChips(playerId,challenge.id);
  }
  
  }else{
    return false;
  }
}catch(err){
    logger.log(err);
  }
  
}
Room.prototype.straightChips = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.fullWin = async function (playerId,challengeId){

  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.fourKinds = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.pairBets = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.flopBets = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.pairWear = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.twosThree = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.threeHands = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.differentRooms = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.finalTable = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.winStraightWins = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.winFlushWins = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.winRoyalLoyal = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.earnChips = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.winAllIn = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.allInPlays = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}

Room.prototype.consecutiveWins = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.winThreeKind = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.highCard = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}

Room.prototype.betChips = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.winBluff = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.callBets = async function (playerId,challengeId){

  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.raiseBets = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.winRiverReach = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.winFullHouse = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.winTwoPairs = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.winFlush = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.winStraight = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.winPair = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.seeFlops = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.foldHands = async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}

Room.prototype.winHands = async function (playerId,challengeId){
 return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.playHands= async function (playerId,challengeId){
  return await this.challengeStatus(playerId,challengeId)
}
Room.prototype.challengeStatus = async function (userId,challengeId) {
  try{
    let increment = 1
    let progress =  await this.sequelizeObjects.UserChallenge.findOne({
      where: {
        userId: userId,
        challengeId:challengeId,
        isCompleted:false,
        assignedAt: { [Op.gt]: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        priority: 1

      }
    })
    const challenge = await this.sequelizeObjects.DailyChallenges.findOne({
      where: {
        id:challengeId
      }
    })
    if(challenge && progress){
      progress.progress += increment
      await progress.save()
      if(progress.progress >= challenge.target){
        progress.isCompleted = true
        await progress.save()
        await this.unlockNextChallenge(userId);
        return {message:"challenge is completed",progress:progress.progress,target:challenge.target,challengeName:challenge.name}
      }
      return {message:"You made the progress",progress:progress.progress,target:challenge.target,challengeName:challenge.name}
  }
 
}catch(err){
    logger.log(err, logger.LOG_RED);
  }

};
Room.prototype.unlockNextChallenge = async function (userId) {
  const nextChallenge = await this.sequelizeObjects.UserChallenge.findOne({
    where: {
      userId: userId,
      isCompleted: false,
      assignedAt: { [Op.gt]: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      priority: 0  // Find the next challenge with priority 0
    }
  });
  
  if (nextChallenge) {
    nextChallenge.priority = 1;  // Activate the next challenge
    await nextChallenge.save();
  }
};
//is called on recieving BetFop event on socket
Room.prototype.updateBet = async function (connectionId, socketKey, playerId, betType, amount) {
    const logPrefix = `[BettingSystem][updateBet][${Date.now()}]`;

    try {
        const validBetTypes = ['2 Red', '2 Black', 'Pair', 'Flush', 'Straight'];
        console.log(`${logPrefix} Received request: connectionId=${connectionId}, playerId=${playerId}, betType=${betType}, amount=${amount}`);

        // Reject invalid bet types
        if (!validBetTypes.includes(betType)) {
            console.log(`${logPrefix} Invalid betType received: '${betType}'. Rejecting.`);
            const player = this.players[this.getPlayerId(connectionId)];
            if (player?.connection) {
                player.connection.sendText(JSON.stringify({
                    key: "BetFailed",
                    message: `Invalid bet type '${betType}'.`,
                    betType: betType,
                    balance: player.playersAllMoney
                }));
            }
            return;
        }

        const playerIndex = this.getPlayerId(connectionId);
        if (playerIndex === -1) throw new Error(`Invalid player connectionId: ${connectionId}`);

        const player = this.players[playerIndex];
        if (!player || player.socketKey !== socketKey) {
            console.log(`${logPrefix} Player object not found or socketKey mismatch. Aborting.`);
            return;
        }

        const user = await this.sequelizeObjects.User.findOne({ where: { id: playerId } });
        if (!user) {
            console.log(`${logPrefix} CRITICAL: User with id ${playerId} not found in database.`);
            player.connection?.sendText(JSON.stringify({
                key: "BetFailed",
                message: "User not found",
                betType: betType
            }));
            return;
        }

        player.playersAllMoney = Number(player.playersAllMoney);
        user.money = Number(user.money);

        const parsedAmount = parseInt(amount, 10);
        console.log(`${logPrefix} Parsed amount: ${parsedAmount}`);

        const existingBet = await this.sequelizeObjects.BetTheFlop.findOne({
            where: { userId: playerId, betType, isActive: true }
        });

        let oldAmount = 0;
        let amountDifference = parsedAmount;
        let isNewBet = false;

        if (existingBet) {
            oldAmount = Number(existingBet.amount);
            amountDifference = parsedAmount - oldAmount;
            console.log(`${logPrefix} Found existing bet. Old amount: ${oldAmount}, New amount: ${parsedAmount}, Difference: ${amountDifference}`);
        } else {
            isNewBet = true;
            console.log(`${logPrefix} No existing bet found. This is a new bet of ${parsedAmount}.`);
        }

        // Handle Bet Cancellation
        if (parsedAmount === 0 || (amountDifference === 0 && existingBet)) {
            const refundAmount = existingBet ? Number(existingBet.amount) : 0;
            if (refundAmount > 0) {
                player.playersAllMoney += refundAmount;
                user.money += refundAmount;
                await user.save();
                console.log(`${logPrefix} Refunded ${refundAmount} to player. New balance: ${player.playersAllMoney}`);
            }

            if (existingBet) {
                await existingBet.destroy();
                console.log(`${logPrefix} Bet record removed from DB.`);
            }

            // --- MODIFICATION FOR CANCELLATION ---
            if (this.activeBets[playerId] && this.activeBets[playerId].bets) {
                delete this.activeBets[playerId].bets[betType];
                // If no more bets are left for this player, remove the player's main entry
                if (Object.keys(this.activeBets[playerId].bets).length === 0) {
                    delete this.activeBets[playerId];
                }
                console.log(`${logPrefix} Cleared bet from memory.`);
            }
            // --- END MODIFICATION ---

            player.connection?.sendText(JSON.stringify({
                key: "BetCancelled",
                betType,
                balance: player.playersAllMoney,
                message: `Your bet on ${betType} has been cancelled.`
            }));
            console.log(`${logPrefix} Sent BetCancelled to client.`);
            return;
        }

        // Handle Fund Adjustments
        if (amountDifference > 0) {
            console.log(`${logPrefix} Player needs ${amountDifference}. Current balance: ${player.playersAllMoney}.`);
            if (player.playersAllMoney < amountDifference) {
                console.log(`${logPrefix} Insufficient funds. Bet failed.`);
                player.connection?.sendText(JSON.stringify({
                    key: "BetFailed",
                    message: "Insufficient funds",
                    betType: betType,
                    balance: player.playersAllMoney,
                }));
                return;
            }

            player.playersAllMoney -= amountDifference;
            user.money -= amountDifference;

        } else if (amountDifference < 0) {
            console.log(`${logPrefix} Bet decreased. Refunding ${Math.abs(amountDifference)}.`);
            player.playersAllMoney += Math.abs(amountDifference);
            user.money += Math.abs(amountDifference);
        }

        await user.save();
        //console.log(`${logPrefix} User balance updated in DB: ${user.money}`);

        if (existingBet) {
            existingBet.amount = parsedAmount;
            await existingBet.save();
            console.log(`${logPrefix} Updated existing bet record.`);
        } else {
            await this.sequelizeObjects.BetTheFlop.create({
                userId: playerId,
                betType,
                amount: parsedAmount,
                isActive: true
            });
            console.log(`${logPrefix} Created new bet record.`);
        }
        
        // --- MODIFICATION FOR DATA STRUCTURE ---
        // Keep playerId as the key, but store the connectionId inside the object.
        this.activeBets[playerId] = this.activeBets[playerId] || {
            connectionId: connectionId,
            bets: {}
        };
        // Always update the connectionId in case the player reconnected
        this.activeBets[playerId].connectionId = connectionId;

        // Place the bet into the nested 'bets' object.
        this.activeBets[playerId].bets[betType] = parsedAmount;
        console.log(`${logPrefix} Updated in-memory activeBets for playerId ${playerId}:`, JSON.stringify(this.activeBets[playerId]));
        // --- END MODIFICATION ---

        player.connection?.sendText(JSON.stringify({
            key: isNewBet ? "BetPlaced" : "BetUpdated",
            betType,
            betAmount: parsedAmount,
            balance: player.playersAllMoney,
            message: isNewBet
                //? `Your bet on ${betType} has been placed with amount ${parsedAmount}.`
                ? `Bet Placed`
                //: `Your bet on ${betType} has been updated to ${parsedAmount}.`
                : `Bet Updated`

        }));
        console.log(`${logPrefix} Sent '${isNewBet ? "BetPlaced" : "BetUpdated"}' confirmation to client.`);

    } catch (err) {
        const logPrefixError = `[BettingSystem][updateBet][ERROR]`;
        console.log(`${logPrefixError}`, err);

        const player = this.players[this.getPlayerId(connectionId)];
        if (player?.connection) {
            player.connection.sendText(JSON.stringify({
                key: "BetFailed",
                message: "An error occurred while updating your bet.",
                betType: betType,
                balance: player.playersAllMoney
            }));
        }
    }
};

//is called in theFlop and in theRiver
Room.prototype.processAllBets = async function () {
    const logPrefix = `[BettingSystem][processAllBets]`;

    try {
        const stage = this.middleCards.length; // 3 = Flop, 5 = River
        const stageName = stage === 3 ? 'Flop' : stage === 5 ? 'River' : `Stage ${stage}`;
        console.log(`\n${logPrefix} --- Starting bet processing for stage: ${stage} (${stageName}) ---`);

        if (!this.activeBets || Object.keys(this.activeBets).length === 0) {
            console.log(`${logPrefix} No active bets to process. Exiting.`);
            return;
        }

        const cardsToEvaluate = utils.asciiToStringCardsArray(this.middleCards);
        const solvedHand = pokerSolver.solve(cardsToEvaluate);
        console.log(`${logPrefix} Community cards [${this.middleCards.join(', ')}] solved as: ${solvedHand.name} - ${solvedHand.descr}`);

        const betTypeAvailability = {
            '2 Red': stage >= 3,
            '2 Black': stage >= 3,
            'Pair': stage >= 3,
            'Flush': stage >= 3,
            'Straight': stage >= 3
        };

        const conditions = {
            '2 Red': solvedHand.cards.filter(c => ['h', 'd'].includes(c.suit)).length >= 2,
            '2 Black': solvedHand.cards.filter(c => ['s', 'c'].includes(c.suit)).length >= 2,
            'Pair': solvedHand.name === "Pair",
            'Flush': this.isFlush(solvedHand.cards),
            'Straight': this.isStraight(solvedHand.cards)
        };
        console.log(`${logPrefix} Evaluated conditions:`, JSON.stringify(conditions));


        // The loop iterates over activeBets using the database ID (userId) as the key.
        for (const [userId, betData] of Object.entries(this.activeBets)) {
            const storedConnectionId = betData.connectionId;
            const playerIndex = this.getPlayerId(storedConnectionId);

            // If a player with the stored connectionId is no longer in the room, skip their bets.
            if (playerIndex === -1) {
                console.log(`\n${logPrefix} Player with stored connectionId ${storedConnectionId} (for DB User ${userId}) not found. Skipping bets.`);
                continue;
            }

            const player = this.players[playerIndex];
            const bets = betData.bets; // Get the nested bets object.

            console.log(`\n${logPrefix} Processing bets for player: ${player.playerName} (DB ID: ${userId})`);
            
            const user = await this.sequelizeObjects.User.findOne({ where: { id: userId } });
            if (!user) {
                console.log(`${logPrefix} Could not find user ${userId} in DB. Skipping.`);
                continue;
            }

            user.money = Number(user.money || 0);
            player.playersAllMoney = Number(player.playersAllMoney || 0);

            const betEntries = Object.entries({ ...bets });
            let totalWinnings = 0;

            for (const [betType, amount] of betEntries) {
                const numericAmount = Number(amount);
                if (isNaN(numericAmount) || numericAmount <= 0) {
                    console.warn(`${logPrefix} Invalid bet amount for ${betType}: ${amount}. Skipping.`);
                    continue;
                }

                if (!betTypeAvailability[betType]) {
                    console.log(`${logPrefix} Bet type '${betType}' not valid for stage ${stage}. Skipping.`);
                    continue;
                }

                // Use the userId (the loop's key) for database interactions.
                const dbBet = await this.sequelizeObjects.BetTheFlop.findOne({
                    where: { userId, betType, isActive: true }
                });

                if (!dbBet) {
                    console.log(`${logPrefix} DB bet missing for '${betType}', cleaning up memory.`);
                    if(this.activeBets[userId] && this.activeBets[userId].bets) delete this.activeBets[userId].bets[betType];
                    continue;
                }

                const conditionMet = conditions[betType];
                const winnings = conditionMet ? Math.floor(numericAmount * this.betMultipliers[betType]) : 0;

                if (conditionMet) {
                    totalWinnings += winnings;
                    console.log(`${logPrefix} WIN -> ${betType}: Bet ${numericAmount}, Win ${winnings}`);
                } else {
                    console.log(`${logPrefix} LOSS -> ${betType}: Bet ${numericAmount}, Win 0`);
                }

                // Send result to the active player connection.
                if(player.connection) {
                    player.connection.sendText(JSON.stringify({
                        key: "BetTheFlop",
                        message: conditionMet,
                        BetType: betType,
                        amount: winnings
                    }));
                }

                // Deactivate the bet in the database.
                await dbBet.update({ isActive: false });
                
                // Clean up the specific bet from the in-memory object.
                if (this.activeBets[userId] && this.activeBets[userId].bets) {
                    delete this.activeBets[userId].bets[betType];
                }
            }

            // Apply total winnings in one go.
            if (totalWinnings > 0) {
                user.money += totalWinnings;
                player.playersAllMoney += totalWinnings;
            }

            await user.save(); // One DB write per user.
        }
        // --- MODIFICATION END ---


        // Final cleanup: remove users who have no more active bets.
        for (const userId in this.activeBets) {
            if (Object.keys(this.activeBets[userId].bets).length === 0) {
                delete this.activeBets[userId];
                console.log(`${logPrefix} Cleanup: Removed entry for userId ${userId} from memory.`);
            }
        }

        console.log(`${logPrefix} --- Bet processing complete for stage ${stage} (${stageName}) ---\n`);
    } catch (err) {
        console.error(`${logPrefix} CRITICAL ERROR:`, err);
    }
};

// Room.prototype.recordClientBet =async function (playerId, betType, amount) {
//   const logPrefix = `[BettingSystem][recordClientBet]`;

//   if (!this.clientReportedBets[playerId]) {
//     this.clientReportedBets[playerId] = {};
//   }

//   this.clientReportedBets[playerId][betType] = amount;

//   console.log(`${logPrefix} Received client bet — playerId: ${playerId}, betType: ${betType}, amount: ${amount}`);

//   // Check if server and client bets match
//   if (this.compareBetStructures(this.activeBets, this.clientReportedBets)) {
//     if (!this.betsVerified) {
//       this.betsVerified = true;
//       console.log(`${logPrefix} ✅ All bets matched. Triggering processAllBets.`);
//       if (this.middleCards.length === 3 && Object.keys(this.activeBets).length > 0) {
//       await this.processAllBets(); // Resolves: Pair, 2 Red, 2 Black , Flush and Straight
//       console.log(`${logPrefix} ✅ bets proccessed.`);

//       //this.betscalled = false;
//     }
     
//     }
//   } else {
//     console.log(`${logPrefix} Waiting for more client-reported bets...`);
//   }
// };
// Room.prototype.compareBetStructures = function (serverBets, clientBets) {
//   const normalize = (bets) => {
//     const flat = [];
//     for (const playerId in bets) {
//       for (const betType in bets[playerId]) {
//         flat.push({
//           playerId: parseInt(playerId),
//           betType,
//           amount: parseInt(bets[playerId][betType])
//         });
//       }
//     }
//     return flat.sort((a, b) =>
//       a.playerId - b.playerId || a.betType.localeCompare(b.betType)
//     );
//   };

//   const serverFlat = normalize(serverBets);
//   const clientFlat = normalize(clientBets);

//   return JSON.stringify(serverFlat) === JSON.stringify(clientFlat);
// };


Room.prototype.clearBetsLocks = new Map();
//method to clear active bets of a player, is called in Fold
Room.prototype.clearBetsForPlayer = async function (player) {
    const logPrefix = `[BettingSystem][clearBetsForPlayer]`;

    try {
        if (!player || !player.playerId || !player.playerDatabaseId) {
            console.log(`${logPrefix} Invalid or incomplete player object passed. Aborting cleanup.`);
            return;
        }

        const playerId = player.playerDatabaseId;

        // --- Lock check ---
        if (this.clearBetsLocks.get(playerId)) {
            console.log(`${logPrefix} Already processing bets for player ${player.playerName}, skipping duplicate.`);
            return;
        }
        this.clearBetsLocks.set(playerId, true);

        // --- Idempotent check ---
        if (player.betClearedThisHand) {
            console.log(`${logPrefix} Bets already cleared this hand for ${player.playerName}, skipping.`);
            return;
        }

        console.log(`${logPrefix} Initiating cleanup for player (DBID: ${playerId})`);

        // No in-memory bets?
        if (!this.activeBets[playerId] || Object.keys(this.activeBets[playerId]).length === 0) {
            console.log(`${logPrefix} No active in-memory bets found for this player. No action needed.`);
            player.betClearedThisHand = true;
            this.clearBetsLocks.delete(playerId);
            return;
        }

        const activeDbBets = await this.sequelizeObjects.BetTheFlop.findAll({
            where: { userId: playerId, isActive: true }
        });

        if (activeDbBets.length === 0) {
            console.log(`${logPrefix} No active bets found in DB. Proceeding to clean memory only.`);
        }

        let totalRefundAmount = 0;
        const betTypes = [];

        for (const bet of activeDbBets) {
            totalRefundAmount += Number(bet.amount);
            betTypes.push(bet.betType);
        }

        console.log(`${logPrefix} Found ${activeDbBets.length} bets to refund. Total amount: ${totalRefundAmount}. Types: ${betTypes.join(', ')}`);

        if (totalRefundAmount > 0) {
            const user = await this.sequelizeObjects.User.findOne({ where: { id: playerId } });

            if (user) {
                user.money = Number(user.money || 0);
                player.playersAllMoney = Number(player.playersAllMoney || 0);

                user.money += totalRefundAmount;
                player.playersAllMoney += totalRefundAmount;

                await user.save();
                console.log(`${logPrefix} Refunded ${totalRefundAmount} to user. New balance: ${user.money}.`);
            } else {
                console.log(`${logPrefix} CRITICAL: User not found in DB for refund. Skipping refund.`);
            }
        }

        await this.sequelizeObjects.BetTheFlop.destroy({
            where: { userId: playerId, isActive: true }
        });
        console.log(`${logPrefix} All active bets for the user have been destroyed in the database.`);

        delete this.activeBets[playerId];
        console.log(`${logPrefix} Player's entry removed from in-memory activeBets.`);

        if (player.connection) {
            player.connection.sendText(JSON.stringify({
                key: "AllBetsCancelled",
                refundedAmount: totalRefundAmount,
                message: `Your active side bets have been cancelled and ${totalRefundAmount} has been refunded.`
            }));
            console.log(`${logPrefix} Sent AllBetsCancelled to client.`);
        }

        // ✅ Mark bets cleared after successful execution
        player.betClearedThisHand = true;

    } catch (err) {
        console.log(`${logPrefix} CRITICAL ERROR during bet cleanup:`, err);
    } finally {
        // ✅ Always release lock
        if (player?.playerDatabaseId) {
            this.clearBetsLocks.delete(player.playerDatabaseId);
        }
    }
};

//old bet method (works for older versions<44)
Room.prototype.betFlop = async function (connectionId, socketKey, playerID, betType, amount) {
    console.log("betFlop is called in room")
    try {
        console.log(`[BetTheFlop] --- Initiating betFlop for playerID: ${playerID}, betType: ${betType}, amount: ${amount} ---`);
        const playerIndex = this.getPlayerId(connectionId);
        if (playerIndex === -1) {
            console.log(`[BetTheFlop] ERROR: Player with connectionId ${connectionId} not found in room.`);
            // cant inform client since no connection       
            return;
        }

        const player = this.players[playerIndex];
        const user = await this.sequelizeObjects.User.findOne({ where: { id: playerID } });

        if (!user || !player) {
            console.log(`[BetTheFlop] ERROR: User or player object could not be found for playerID: ${playerID}.`);
            return;
        }
        
        const betAmount = parseInt(amount);
        if (isNaN(betAmount) || betAmount <= 0) {
            console.log(`[BetTheFlop] Invalid bet amount received: ${amount}. Ignoring.`);
            // notify client
            if(player.connection) {
                player.connection.sendText(JSON.stringify({
                    key: "BetFailed",
                    message: "Invalid bet amount provided."
                }));
            }
            return; 
        }

        const existingBet = await this.sequelizeObjects.BetTheFlop.findOne({
            where: { userId: playerID, betType: betType, isActive: true }
        });

        let amountToDeduct = betAmount;
        let oldAmount = 0;

        if (existingBet) {
            oldAmount = parseInt(existingBet.amount, 10);
            amountToDeduct = betAmount - oldAmount;
            console.log(`[BetTheFlop] Found existing bet of ${oldAmount}. Player is updating bet. New amount difference is: ${amountToDeduct}`);
        } else {
            console.log(`[BetTheFlop] No existing bet found. This is a new bet.`);
        }

        console.log(`[BetTheFlop] Player's current balance: ${player.playersAllMoney}. Required amount: ${amountToDeduct}.`);
        
        if (player.playersAllMoney >= amountToDeduct) {
            console.log(`[BetTheFlop] Player has sufficient funds. Proceeding with deduction.`);
            
            if (amountToDeduct !== 0) {
                player.playersAllMoney -= amountToDeduct;
                user.money -= amountToDeduct;
                await user.save();
                console.log(`[BetTheFlop] Deducted ${amountToDeduct}. Player's new balance: ${player.playersAllMoney}.`);
            }

            if (existingBet) {
                console.log(`[BetTheFlop] Updating bet record in DB for ${betType} to new amount ${betAmount}.`);
                existingBet.amount = betAmount;
                await existingBet.save();
            } else {
                console.log(`[BetTheFlop] Creating new bet record in DB for ${betType} with amount ${betAmount}.`);
                await this.sequelizeObjects.BetTheFlop.create({
                    userId: playerID,
                    betType: betType,
                    amount: betAmount,
                    isActive: true
                });
            }

            this.betscalled = true;
            this.betTheFlop[connectionId] = betAmount;
            
            // bet success
            if(player.connection) {
                player.connection.sendText(JSON.stringify({
                    key: "BetPlaced",
                    message: `Your bet on ${betType} is now ${betAmount}.`
                }));
            }
            console.log(`[BetTheFlop] --- Bet successfully placed for playerID: ${playerID} ---`);

        } else {
            console.log(`[BetTheFlop] Player has INSUFFICIENT funds. Current balance: ${player.playersAllMoney}, needed: ${amountToDeduct}.`);
            // bet failed
            if(player.connection){
                player.connection.sendText(JSON.stringify({
                    key: "BetFailed",
                    message: "Insufficient funds to place or update your bet."
                }));
            }
        }
    } catch (err) {
        logger.log(err);
        console.log(`[BetTheFlop] CRITICAL ERROR in betFlop:`, err);
        // server error
        const player = this.players[this.getPlayerId(connectionId)];
        if (player && player.connection) {
            player.connection.sendText(JSON.stringify({
                key: "BetFailed",
                message: "A server error occurred while placing your bet."
            }));
        }
    }
};
Room.prototype.processBet = async function (betType, multiplier, conditionFn) {
  try {
    console.log(`[BetTheFlop] --- Processing bets for type: ${betType} with multiplier: ${multiplier} ---`);
    const middlecard = this.middleCards.slice(0, 3);
    console.log(`[BetTheFlop] Evaluating with middle cards: ${JSON.stringify(middlecard)}`);
    const hand = pokerSolver.solve(utils.asciiToStringCardsArray(middlecard));

    for (const player of this.players) {
      if (!player || player.isBot) continue;

      const userBet = await this.sequelizeObjects.BetTheFlop.findOne({
        where: { userId: player.playerDatabaseId, isActive: true, betType },
      });

      if (userBet) {
        console.log(`[BetTheFlop] Found active bet for player for type ${betType}.`);
        const user = await this.sequelizeObjects.User.findOne({
          where: { id: player.playerDatabaseId },
        });

        if (user) {
          const conditionMet = conditionFn(hand, middlecard);
          console.log(`[BetTheFlop] Condition for to win was: ${conditionMet ? 'MET (WIN)' : 'NOT MET (LOSS)'}`);
          
          if (conditionMet) {
            const betAmount = parseInt(userBet.amount, 10);
            const reward = Math.floor(betAmount * multiplier);
            console.log(`[BetTheFlop] WIN! Bet: ${betAmount}, Reward: ${reward}. Player's balance before reward: ${player.playersAllMoney}`);

            // Add the reward to the player's balances
            user.money += reward;
            player.playersAllMoney += reward;
            await user.save();
            console.log(`[BetTheFlop] Player's balance after reward: ${player.playersAllMoney}`);

            player.connection.sendText(JSON.stringify({
                key: "BetTheFlop", message: true, BetType: betType, amount: reward,
            }));
          } else {
            console.log(`[BetTheFlop] LOSS. No reward for player.`);
            player.connection.sendText(JSON.stringify({
                key: "BetTheFlop", message: false, BetType: betType, amount: 0,
            }));
          }
          
          console.log(`[BetTheFlop] Deactivating bet for player , type ${betType}.`);
          await userBet.update({ isActive: false });
        }
      }
    }
    console.log(`[BetTheFlop] --- Finished processing bets for type: ${betType} ---`);
  } catch (err) {
    logger.log(err);
    console.log(`[BetTheFlop] CRITICAL ERROR in processBet:`, err);
  }
};
Room.prototype.callRed = async function () {
  console.log("calling red")
  await this.processBet(
    "2 Red",
    2,
    (hand, middlecard) => hand.cards.filter(card => card.suit === "d" || card.suit === "h").length >= 2
  );
};

Room.prototype.betAmountStatus = async function () {
  const betAmountMap = new Map([
    [10000, 500000], [20000, 750000], [25000, 1000000],
    [50000, 1500000], [100000, 2000000], [200000, 2500000],
    [500000, 3000000], [1000000, 3500000], [5000000, 4000000],
    [20000000, 5000000], [50000000, 6000000], [100000000, 7000000],
  ]);

  return betAmountMap.get(this.roomMinBet) || 7000000;
};

Room.prototype.callBlack = async function () {
      console.log("calling Black")

  await this.processBet(
    "2 Black",
    2,
    (hand, middlecard) => hand.cards.filter(card => card.suit === "s" || card.suit === "c").length >= 2
  );
};

Room.prototype.callStraight = async function () {
    console.log("calling Straight")

  await this.processBet(
    "Straight",
    23,
    (hand) => this.isStraight(hand.cards) // Custom logic for checking straight
  );
};

Room.prototype.callFlush = async function () {
      console.log("calling Flush")

  await this.processBet(
    "Flush",
    15.5,
    (hand) => this.isFlush(hand.cards) // Custom logic for checking flush
  );
};

// Helper function to check if a three-card hand is a straight
Room.prototype.isStraight = function (cards) {

  // Extract and sort ranks
  const ranks = cards.map(card => card.rank).sort((a, b) => a - b);
  // Check for consecutive ranks
  return ranks[1] - ranks[0] === 1 && ranks[2] - ranks[1] === 1;
};

// Helper function to check if a three-card hand is a flush
Room.prototype.isFlush = function (cards) {
  // Extract suits
  const suits = cards.map(card => card.suit);
  // Check if all suits are the same
  return new Set(suits).size === 1;
};

Room.prototype.callPair = async function () {
        console.log("calling Pair")

  await this.processBet(
    "Pair",
    4.8,
    (hand) => hand.name === "Pair"
  );
};

Room.prototype.showCards = async function (connectionId,socketKey,playerId) {
  try{
    this.showPlayerCards[connectionId] = true;
  }catch(err){
    logger.log(err);
  }

}
Room.prototype.currentPosition = async function () {
  try{
    return this.middleCards;
  }catch(err){
    logger.log(err);
  }
}

Room.prototype.destroyVideo = async function (connectionId) {
  try{
    for(let i in this.players){
      if(!this.players[i].isBot){
        this.players[i].connection.sendText(JSON.stringify({
          key:"destroyVideo",
          playerId:connectionId
        }));
      }
    }
  }catch(err){
    logger.log(err);
  }
}
Room.prototype.onVideo = async function (connectionId) {
  try{
    for(let i in this.players){
        if(!this.players[i].isBot){
          this.players[i].connection.sendText(JSON.stringify({
            key:"onvideo",
            playerId:connectionId
          }));
        }
        
    }
  }catch(err){
    logger.log(err);
  }
}
