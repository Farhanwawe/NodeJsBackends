const { FaceTimeSession, FaceTimeSubSession, User, FaceTimeClaims } = require('../database/sequelize');
const holdem = require('../../holdem');
const logger = require('./logger');
const { Op } = require('sequelize');

class FaceTimeManager {
  constructor() {
    this.activeSessions = new Map();
    this.currentReward = 400000;  // initial reward
    this.maxReward = 1200000;     // maximum reward
    this.rewardIncrement = 200000; // reward increment per session
  }

  async calculateReward() {
    const reward = this.currentReward;
    logger.log(`Reward: ${reward}`);
    return reward;
  }

  calculateTotalTime() {
    const baseTime = 60 * 1000; // 60 seconds in ms
    const totalTime = baseTime * 1.5;
    logger.log(`Total time: ${totalTime}`);
    logger.log(`Sub-session time: ${totalTime / 4}`);
    return totalTime;
  }

  async startSession(userId) {
    try {
      const now = new Date();
      const totalTime = this.calculateTotalTime();
      
      // Find an existing session created in the last 24 hours that is still open
      let session = await FaceTimeSession.findOne({
        where: {
          userId,
          isCompleted: null,
          createdAt: { [Op.gte]: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
        },
        order: [['createdAt', 'DESC']]
      });
      
      if (session) {
        logger.log(`Reusing existing session for user ${userId}: ${JSON.stringify(session)}`);
      } else {
        session = await FaceTimeSession.create({ userId, totalTime });
        logger.log(`New session created for user ${userId}: ${JSON.stringify(session)}`);
      }
      
      const subSession = await FaceTimeSubSession.create({ sessionId: session.sessionId });
      this.activeSessions.set(userId, {
        session,
        currentSubSession: subSession,
        startTime: Date.now()
      });
      
      logger.log(`Active session for user ${userId}: ${JSON.stringify(this.activeSessions.get(userId))}`);
      logger.log(`Session started for user ${userId}`);
    } catch (err) {
      logger.log(`Error in starting session for user ${userId}: ${err.message}`);
    }
  }

  async stopSession(userId) {
    try {
      const sessionData = this.activeSessions.get(userId);
      if (!sessionData) {
        logger.log(`Session not found for user ${userId}`);
        return;
      }
      
      const { currentSubSession, startTime } = sessionData;
      if (!currentSubSession || !startTime) {
        logger.log(`Invalid session data for user ${userId}`);
        return;
      }
      
      const elapsed = Date.now() - startTime;
      await currentSubSession.update({ subTime: elapsed });
      
      logger.log(`Session stopped for user ${userId}`);
      logger.log(`Session Data: ${JSON.stringify(sessionData)}`);
    } catch (error) {
      logger.log(`Error stopping session for user ${userId}: ${error.message}`);
    }
  }

  async resumeSession(userId) {
    const sessionData = this.activeSessions.get(userId);
    if (!sessionData) return;
    sessionData.startTime = Date.now();
    logger.log(`Session resumed for user ${userId}`);
  }

  async completeSubSession(connectionId, socketkey, userId) {
    const sessionData = this.activeSessions.get(userId);
    if (!sessionData) return;
    
    try {
      const { session, currentSubSession } = sessionData;
      await currentSubSession.update({ isCompleted: true });
      
      const completedSubSessions = await FaceTimeSubSession.count({
        where: { sessionId: session.sessionId, isCompleted: true }
      });
      
      if (completedSubSessions >= 5) {
        await session.update({ isCompleted: true });
        await this.rewardUser(connectionId, socketkey, userId);
        this.activeSessions.delete(userId);
        logger.log(`Session completed and user ${userId} rewarded`);
        
        // Update the reward and reset if exceeding maximum reward
        this.currentReward = (this.currentReward + this.rewardIncrement > this.maxReward)
          ? 400000
          : this.currentReward + this.rewardIncrement;
      } else {
        // Create a new sub-session for an incomplete session
        const newSubSession = await FaceTimeSubSession.create({ sessionId: session.sessionId });
        sessionData.currentSubSession = newSubSession;
        sessionData.startTime = Date.now();
        logger.log(`New sub-session started for user ${userId}`);
        logger.log(`Session Data: ${JSON.stringify(sessionData)}`);
      }
    } catch (error) {
      logger.log(`Error completing sub-session for user ${userId}: ${error.message}`);
    }
  }

  async faceDetected(connectionId, socketkey, userId) {
    if (this.activeSessions.has(userId)) {
      await this.resumeSession(userId);
    } else {
      await this.startSession(userId);
    }
  }

  async faceLost(connectionId, socketkey, userId) {
    await this.stopSession(userId);
  }

  async rewardUser(connectionId, socketkey, userId) {
    try {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const claimsToday = await FaceTimeClaims.count({
        where: {
          userId,
          claimedAt: { [Op.between]: [startOfDay, endOfDay] }
        }
      });

      if (claimsToday >= 3) {
        logger.log(`User ${userId} has already claimed the maximum rewards for today.`);
        return;
      }

      const rewardDetails = await this.calculateReward();
      // Use atomic increment to reduce DB queries
      await User.increment('money', { by: rewardDetails, where: { id: userId } });
      await holdem.updatefactimereward(connectionId, socketkey, rewardDetails);
      await FaceTimeClaims.create({ userId, claimedAt: new Date() });

      logger.log(`User ${userId} rewarded with ${rewardDetails} money`);
    } catch (error) {
      logger.log(`Error rewarding user ${userId}: ${error.message}`);
    }
  }
}

module.exports = new FaceTimeManager();