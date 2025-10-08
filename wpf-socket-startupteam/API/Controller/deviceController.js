const crypto = require('crypto');
const { Op } = require('sequelize');
const {Referral,ReferralClick,Device} = require('../../src/database/sequelize');


class DeviceController {
  async getOrCreateDevice(deviceData, transaction = null) {
    const deviceHash = this._generateDeviceHash(deviceData);
    
    const [device] = await Device.findOrCreate({
      where: { deviceHash },
      defaults: {
        ipAddress: deviceData.ip,
        deviceType: deviceData.deviceType,
        os: deviceData.os,
        osVersion: deviceData.osVersion || 'unknown',
        manufacturer: deviceData.manufacturer || 'unknown',
        model: deviceData.model || 'unknown'
      },
      transaction
    });
    
    return device;
  }

  async checkDeviceBlacklist(deviceHash, transaction = null) {
    const device = await Device.findOne({
      where: { deviceHash },
      attributes: ['isBlacklisted', 'blacklistReason'],
      transaction
    });
    
    return device?.isBlacklisted || false;
  }

  async updateDeviceActivity(deviceHash, transaction = null) {
    return await Device.update(
      { lastActivity: new Date() },
      { 
        where: { deviceHash },
        transaction 
      }
    );
  }

  async incrementReferralCount(deviceHash, transaction = null) {
    return await Device.increment('referralCount', {
      where: { deviceHash },
      transaction
    });
  }

  _generateDeviceHash(deviceData) {
    const components = [
      deviceData.ip,
      deviceData.userAgent,
      deviceData.os,
      deviceData.deviceType
    ].filter(Boolean).join('|');
    
    return crypto
      .createHash('sha256')
      .update(components)
      .digest('hex');
  }
}

module.exports = new DeviceController();