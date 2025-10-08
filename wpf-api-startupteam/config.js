console.log(`Port for server is ${process.env.PORT}`);
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
    startGameTimeOut: 2000,     // 2000 stock
    startingRooms: 5,          // Default 4, How many rooms to create at start
    roomZeroBotCount: 0,
    roomOneBotCount: 0,
    roomTwoBotCount: 0,
    roomOthersBotCount: 0,      // For production set to 0
  },
  neuralNetwork: {
    learningRate: 0.8
  },
  games: {
    holdEm: {
      bot: {
        giveRealNames: true, // true => random from assets/names.txt, false => Bot<numbers>
        startMoney: 1000000000000, // Default 1000000
        turnTimes: [1000, 1500, 2000, 2500, 3000],
        minMoney: [
          1500000,     // Low bet game
          5000000,    // Medium bet game
          10000000    // High bet game
        ],
        betAmounts: [
          [25000, 35000, 40000, 50000],         // Low bet game
          [125000, 150000, 200000, 250000],       // Medium bet game
          [1100000, 1200000, 1500000, 2000000]    // High bet game
        ]
      },
      holdEmGames: [
        {
          name: 'Texas Hold\'em with medium bets',
          typeName: '5k/10k',
          buyIn:'50k/1.25M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 10000,
          minimumAmount : 50000,
          maximumAmount : 1250000,
          afterRoundCountdown: 7,
          level:1
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '10k/20k',
          buyIn:'500k/2.5M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 20000,
          minimumAmount : 500000,
          maximumAmount : 2500000,
          afterRoundCountdown: 7,
          level:5
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '25k/50k',
          buyIn:'1.25M/7.5M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 25000,
          minimumAmount : 1250000,
          maximumAmount : 7500000,
          afterRoundCountdown: 7,
          level:10 
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '50k/100k',
          buyIn:'2.5M/12.5M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 50000,
          minimumAmount : 2500000,
          maximumAmount : 12500000,
          afterRoundCountdown: 7,
          level:15 
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '100k/200k',
          buyIn:'5M/25M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 100000,
          minimumAmount : 5000000,
          maximumAmount : 25000000,
          afterRoundCountdown: 7,
          level:20 
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '250k/500k',
          buyIn:'12.5M/62.5M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 200000,
          minimumAmount : 12500000,
          maximumAmount : 62500000,
          afterRoundCountdown: 7,
          level:25 
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '500k/1M',
          buyIn:'25M/125M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 500000,
          minimumAmount : 25000000,
          maximumAmount : 125000000,
          afterRoundCountdown: 7,
          level:30 
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '2.5/5M',
          buyIn:'125M/625M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 1000000,
          minimumAmount : 125000000,
          maximumAmount : 625000000,
          afterRoundCountdown: 7,
          level:35 
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '10M/20M',
          buyIn:'500M/2.5B',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 5000000,
          minimumAmount : 500000000,
          maximumAmount : 2500000000,
          afterRoundCountdown: 7,
          level:40
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '25M/50M',
          buyIn:'1.25B/6.25B',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 20000000,
          minimumAmount : 1250000000,
          maximumAmount : 6250000000,
          afterRoundCountdown: 7,
          level:45
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '50M/100M',
          buyIn:'2.5B/10B',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 50000000,
          minimumAmount : 2500000000,
          maximumAmount : 10000000000,
          afterRoundCountdown: 7,
          level:50
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '100M/200M',
          buyIn:'5B/20B',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 100000000,
          minimumAmount : 5000000000,
          maximumAmount : 20000000000,
          afterRoundCountdown: 7,
          level:55
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '250M/500M',
          buyIn:'13B/62.5B',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 200000000,
          minimumAmount : 13000000000,
          maximumAmount : 62500000000,
          afterRoundCountdown: 7,
          level:60
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '500M/1B',
          buyIn:'25B/100B',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 500000000,
          minimumAmount : 25000000000,
          maximumAmount : 100000000000,
          afterRoundCountdown: 7,
          level:65
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '1B/2B',
          buyIn:'50B/150B',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 1000000000,
          minimumAmount : 50000000000,
          maximumAmount : 150000000000,
          afterRoundCountdown: 7,
          level:70
        },
      ],
      holdEmGamesPrivate: [
        {
          name: 'Texas Hold\'em with low bets',
          typeName: '1k/2k',
          buyIn:'50k/250k',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 20,
          minBet: 1000,
          minimumAmount : 50000,
          maximumAmount : 250000,
          afterRoundCountdown: 10
        },
        {
          name: 'Texas Hold\'em with medium bets',
          typeName: '2k/4k',
          buyIn:'100k/500k',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 20,
          minBet: 2000,
          minimumAmount : 100000,
          maximumAmount : 500000,
          afterRoundCountdown: 10
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '5k/10k',
          buyIn:'250k/1.25M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 20,
          minBet: 5000,
          minimumAmount : 250000,
          maximumAmount : 1250000,
          afterRoundCountdown: 10 
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '10k/20k',
          buyIn:'500k/2.5M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 20,
          minBet: 10000,
          minimumAmount : 500000,
          maximumAmount : 2500000,
          afterRoundCountdown: 10 
        }
      ],
      holdEmGamesAllInFold: [
        {
          name: 'Texas Hold\'em with medium bets',
          typeName: '5k/10k',
          buyIn:'50k/1.25M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 10000,
          minimumAmount : 50000,
          maximumAmount : 1250000,
          afterRoundCountdown: 7,
          level:1
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '10k/20k',
          buyIn:'500k/2.5M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 20000,
          minimumAmount : 500000,
          maximumAmount : 2500000,
          afterRoundCountdown: 7,
          level:5
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '25k/50k',
          buyIn:'1.25M/7.5M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 25000,
          minimumAmount : 1250000,
          maximumAmount : 7500000,
          afterRoundCountdown: 7,
          level:10 
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '50k/100k',
          buyIn:'2.5M/12.5M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 50000,
          minimumAmount : 2500000,
          maximumAmount : 12500000,
          afterRoundCountdown: 7,
          level:15 
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '100k/200k',
          buyIn:'5M/25M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 100000,
          minimumAmount : 5000000,
          maximumAmount : 25000000,
          afterRoundCountdown: 7,
          level:20 
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '250k/500k',
          buyIn:'12.5M/62.5M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 200000,
          minimumAmount : 12500000,
          maximumAmount : 62500000,
          afterRoundCountdown: 7,
          level:25 
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '500k/1M',
          buyIn:'25M/125M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 500000,
          minimumAmount : 25000000,
          maximumAmount : 125000000,
          afterRoundCountdown: 7,
          level:30 
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '2.5/5M',
          buyIn:'125M/625M',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 1000000,
          minimumAmount : 125000000,
          maximumAmount : 625000000,
          afterRoundCountdown: 7,
          level:35 
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '10M/20M',
          buyIn:'500M/2.5B',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 5000000,
          minimumAmount : 500000000,
          maximumAmount : 2500000000,
          afterRoundCountdown: 7,
          level:40
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '25M/50M',
          buyIn:'1.25B/6.25B',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 20000000,
          minimumAmount : 1250000000,
          maximumAmount : 6250000000,
          afterRoundCountdown: 7,
          level:45
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '50M/100M',
          buyIn:'2.5B/10B',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 50000000,
          minimumAmount : 2500000000,
          maximumAmount : 10000000000,
          afterRoundCountdown: 7,
          level:50
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '100M/200M',
          buyIn:'5B/20B',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 100000000,
          minimumAmount : 5000000000,
          maximumAmount : 20000000000,
          afterRoundCountdown: 7,
          level:55
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '250M/500M',
          buyIn:'13B/62.5B',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 200000000,
          minimumAmount : 13000000000,
          maximumAmount : 62500000000,
          afterRoundCountdown: 7,
          level:60
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '500M/1B',
          buyIn:'25B/100B',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 500000000,
          minimumAmount : 25000000000,
          maximumAmount : 100000000000,
          afterRoundCountdown: 7,
          level:65
        },
        {
          name: 'Texas Hold\'em with high bets',
          typeName: '1B/2B',
          buyIn:'50B/150B',
          max_seats: 5,
          minPlayers: 2,
          turnCountdown: 10,
          minBet: 1000000000,
          minimumAmount : 50000000000,
          maximumAmount : 150000000000,
          afterRoundCountdown: 7,
          level:70
        },
],
    },
    fiveCardDraw: {},
    blackJack: {}
  }
};
