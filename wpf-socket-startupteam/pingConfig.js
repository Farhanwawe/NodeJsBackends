let pingSettings = {
    pingInterval: 3,
    timeoutThreshold: 3,
    maxMissed: 5,
    qualityThresholds: {
      strong: 50,
      good: 100,
      normal: 200,
      bad: 350,
      disconnected: 999 // default max or fallback
    }
  };
  
  module.exports = {
    getSettings: () => pingSettings,
  
    updateSettings: (newSettings) => {
        let thresholdRejected = false;
      
        if (typeof newSettings.pingInterval === 'number') {
          pingSettings.pingInterval = newSettings.pingInterval;
        }
      
        if (typeof newSettings.timeoutThreshold === 'number') {
          pingSettings.timeoutThreshold = newSettings.timeoutThreshold;
        }
      
        if (typeof newSettings.maxMissed === 'number') {
          pingSettings.maxMissed = newSettings.maxMissed;
        }
      
        if (
          typeof newSettings.qualityThresholds === 'object' &&
          newSettings.qualityThresholds !== null
        ) {
          const validKeys = ['strong', 'good', 'normal', 'bad', 'disconnected'];
          const newThresholds = { ...pingSettings.qualityThresholds };
      
          validKeys.forEach((key) => {
            if (typeof newSettings.qualityThresholds[key] === 'number') {
              newThresholds[key] = newSettings.qualityThresholds[key];
            }
          });
      
          const values = validKeys.map(k => newThresholds[k]);
          const isOrdered = values.every((val, i, arr) => i === 0 || val > arr[i - 1]);
      
          if (isOrdered) {
            pingSettings.qualityThresholds = newThresholds;
          } else {
            console.warn("Invalid qualityThresholds order. Update ignored.");
            thresholdRejected = true;
          }
        }
      
        return !thresholdRejected;
      }
      
      
  };
  