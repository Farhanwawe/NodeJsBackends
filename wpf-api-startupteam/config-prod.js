exports = module.exports = {
  logging: true,
  server: {
    secure: false, // false=ws, true=wss
    PORT:  process.env.PORT,
    host: '0.0.0.0'
  },
  sequelize: {
    logging: false,
  },
  common: {
    startGameTimeOut: 3000,     // 2000 stock
    startingRooms: 1,           // Default 4, How many rooms to create at start
    roomZeroBotCount: 0,
    roomOneBotCount: 0,
    roomTwoBotCount: 0,
    roomOthersBotCount: 0,      // For production set to 0
  },
  neuralNetwork: {
    learningRate: 0.3
  },
  games: {
    holdEm: {
      bot: {
        giveRealNames: true, // true => random from assets/names.txt, false => Bot<numbers>
        startMoney: 10000,
        turnTimes: [1000, 1500, 2000, 2500, 3000],
        minMoney: [
          50,     // Low bet game
          200,    // Medium bet game
          2000    // High bet game
        ],
        betAmounts: [
          [25, 35, 100, 500],         // Low bet game
          [125, 150, 200, 250],       // Medium bet game
          [1100, 1200, 1500, 2000]    // High bet game
        ]
      },
      holdEmGames: [
        {
          name: 'Texas Hold\'em with medium bets',
          typeName: '5k;',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 10000,
          minimumAmount : 50000,
          maximumAmount : 1250000,
          afterRoundCountdown: 7
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '10k',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 20000,
          minimumAmount : 500000,
          maximumAmount : 2500000,
          afterRoundCountdown: 7 
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '25k',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 25000,
          minimumAmount : 1250000,
          maximumAmount : 7500000,
          afterRoundCountdown: 7 
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '50k',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 50000,
          minimumAmount : 2500000,
          maximumAmount : 12500000,
          afterRoundCountdown: 7 
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '100k',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 100000,
          minimumAmount : 2500000,
          maximumAmount : 12500000,
          afterRoundCountdown: 7 
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '250k',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 200000,
          minimumAmount : 5000000,
          maximumAmount : 25000000,
          afterRoundCountdown: 7 
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '2.5M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 500000,
          minimumAmount : 12500000,
          maximumAmount : 62500000,
          afterRoundCountdown: 7 
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '10M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 1000000,
          minimumAmount : 25000000,
          maximumAmount : 125000000,
          afterRoundCountdown: 7 
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '25M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 5000000,
          minimumAmount : 125000000,
          maximumAmount : 625000000,
          afterRoundCountdown: 7
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '50M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 20000000,
          minimumAmount : 500000000,
          maximumAmount : 2500000000,
          afterRoundCountdown: 7
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '100M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 50000000,
          minimumAmount : 1250000000,
          maximumAmount : 6250000000,
          afterRoundCountdown: 7
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '100M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 100000000,
          minimumAmount : 2500000000,
          maximumAmount : 10000000000,
          afterRoundCountdown: 7
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '100M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 200000000,
          minimumAmount : 5000000000,
          maximumAmount : 20000000000,
          afterRoundCountdown: 7
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '100M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 500000000,
          minimumAmount : 13000000000,
          maximumAmount : 62500000000,
          afterRoundCountdown: 7
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '100M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 1000000000,
          minimumAmount : 25000000000,
          maximumAmount : 100000000000,
          afterRoundCountdown: 7
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '100M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 2000000000,
          minimumAmount : 50000000000,
          maximumAmount : 150000000000,
          afterRoundCountdown: 7
        }
      ],
    },
    fiveCardDraw: {},
    blackJack: {}
  }
};
