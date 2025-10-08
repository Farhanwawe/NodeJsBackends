module.exports = {
    apps: [{
      name: 'WawePokerFace',
      script: 'holdem.js',  // This should be the entry point for your app
      instances: 'max',      // Use 'max' to take advantage of all CPU cores on Heroku (or specify a number)
      exec_mode: 'cluster',  // Run in cluster mode for better performance
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    }]
  };