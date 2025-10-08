const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const {Referral,ReferralClick,Device } = require('../../src/database/sequelize');

const sequelize = require('../database/sequelize');
const deviceController = require('../../API/Controller/deviceController');
const rewardController = require('../../API/Controller/rewardController');

class ReferralService {
  async generateCode(userId, campaign = 'default') {
    try {
      console.log("userId = " + userId);
  
      // Check if referral already exists for this user and campaign
      const existingReferral = await Referral.findOne({
        where: {
          referrerId: userId,
          campaign,
        },
      });
  
      if (existingReferral) {
        console.log("Referral already exists for userId:", userId);
        return existingReferral;
      }
  
      // If not, generate a new code and create the referral
      const code = this._generateRandomCode();
      return await Referral.create({
        referrerId: userId,
        code,
        campaign,
      });
    } catch (error) {
      console.error('Error generating referral code:', error);
      throw new Error('Failed to generate referral code');
    }
  }
  
  
  async trackClick(code, trackingData) {
    const { deviceHash, ip, userAgent, os, browser, deviceType } = trackingData;
  
    try {
      // Find or create the device entry in the 'devices' table
      const [device, created] = await Device.findOrCreate({
        where: { deviceHash },
        defaults: { 
          ip, 
          userAgent, 
          os, 
          browser, 
          deviceType 
        },
      });
  
      // Log if a new device is created
      if (created) {
        console.log(`New device added: ${device.deviceHash}`);
      }
  
      // Insert into referralClicks with the valid deviceHash
      await ReferralClick.create({
        referralId: trackingData.referralId, // assuming `code` is the referralId
        deviceHash,
        ipAddress: ip,
        userAgent,
        os,
        browser,
        converted: false,
        fraudScore: 0,
      });
  
      console.log('Referral click tracked successfully');
    } catch (error) {
      console.error('Error tracking referral click:', error);
      throw error; // Re-throw to be handled at the controller level
    }
  }
  

  async processConversion(userId, deviceData) {
    let transaction;
    try {
      transaction = await sequelize.transaction();
      
      const device = await deviceController.getOrCreateDevice(deviceData, { transaction });
      
      if (await deviceController.checkDeviceBlacklist(device.deviceHash)) {
        throw new Error('Device is blacklisted');
      }

      const click = await ReferralClick.findOne({
        where: { 
          deviceHash: device.deviceHash,
          converted: false
        },
        include: [Referral],
        order: [['createdAt', 'DESC']],
        transaction
      });

      if (!click) {
        await transaction.commit();
        return null;
      }

      await click.update({ 
        converted: true,
        convertedAt: new Date(),
        convertedUserId: userId 
      }, { transaction });

      await click.Referral.increment('conversionCount', { transaction });
      await deviceController.incrementReferralCount(device.deviceHash, { transaction });
      
      const reward = await rewardController.distributeReward(click.id, { transaction });
      await rewardController.processRewardPayment(reward.id, { transaction });
      
      await transaction.commit();
      return click;
      
    } catch (error) {
      if (transaction) await transaction.rollback();
      console.error('Error processing conversion:', error);
      throw error;
    }
  }

  // Utility methods
  _generateRandomCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  _calculateFraudScore(data) {
    let score = 0;
    
    // Private IP ranges
    if (data.ip.match(/^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/)) score += 20;
    
    // Bot detection
    if (data.userAgent?.match(/bot|crawl|spider/i)) score += 30;
    
    // Suspicious user agents
    if (!data.userAgent || data.userAgent.length < 10) score += 10;
    
    // High frequency checks could be added here
    
    return score;
  }

  // Additional useful methods
  async getUserReferralStats(userId) {
    return await Referral.findOne({
      where: { referrerId: userId },
      include: [{
        model: ReferralClick,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalClicks'],
          [sequelize.fn('SUM', sequelize.cast(sequelize.col('converted'), 'int')), 'conversions']
        ]
      }],
      group: ['Referral.id']
    });
  }
}

module.exports = new ReferralService();