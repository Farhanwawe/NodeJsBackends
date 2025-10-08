const { Op } = require('sequelize');
const {Referral,ReferralClick,Device} = require('../../src/database/sequelize');

class RewardController {
  async distributeReward(referralClickId, transaction = null) {
    const click = await ReferralClick.findByPk(referralClickId, {
      include: [{
        model: User,
        as: 'referrer',
        attributes: ['id']
      }],
      transaction
    });
    
    if (!click || !click.converted) {
      throw new Error('Invalid or unconverted referral click');
    }

    // Calculate rewards (you can customize this logic)
    const referrerReward = 100; // Base reward
    const refereeReward = 50;   // Bonus for new user
    
    return await ReferralReward.create({
      referralClickId,
      referrerId: click.referrerId,
      refereeId: click.convertedUserId,
      rewardType: 'signup',
      rewardAmount: referrerReward + refereeReward,
      referrerReward,
      refereeReward,
      status: 'pending'
    }, { transaction });
  }

  async processRewardPayment(rewardId, transaction = null) {
    const reward = await ReferralReward.findByPk(rewardId, {
      include: [
        { model: User, as: 'referrer' },
        { model: User, as: 'referee', required: false }
      ],
      transaction
    });
    
    if (reward.status !== 'pending') {
      throw new Error('Reward already processed');
    }

    // Process payments
    await sequelize.transaction(async (t) => {
      const currentTransaction = transaction || t;
      
      // Update referrer's balance
      await User.increment('money', { // Changed from 'balance' to 'money' to match your User model
        by: reward.referrerReward,
        where: { id: reward.referrerId },
        transaction: currentTransaction
      });
      
      // Update referee's balance if applicable
      if (reward.refereeId && reward.refereeReward) {
        await User.increment('money', { // Changed from 'balance' to 'money'
          by: reward.refereeReward,
          where: { id: reward.refereeId },
          transaction: currentTransaction
        });
      }
      
      // Mark reward as paid
      await reward.update({
        status: 'paid',
        paidAt: new Date(),
        transactionId: `txn_${Date.now()}`
      }, { transaction: currentTransaction });
    });
    
    return reward;
  }

  async getUserRewards(userId) {
    return await ReferralReward.findAll({
      where: {
        [Op.or]: [
          { referrerId: userId },
          { refereeId: userId }
        ]
      },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'referrer',
          attributes: ['id', 'username']
        },
        {
          model: User,
          as: 'referee',
          attributes: ['id', 'username'],
          required: false
        }
      ]
    });
  }
}

module.exports = new RewardController();