function setupAssociations(models) {
  const {
    User, Statistic, WeeklyBonus, FaceTimeClaims, HandleQueries, SlotResult,
    UserChallenge, LevelChallenges, BetTheFlop, PopupDisplay, RewardVIPUser,
    QueryTable, VipAdmin, ReportTable, Reports, Popups, UserSetting,
    UserLog, InAppPurchase, Event, LeaderboardEvent, LeaderBoard,
    FaceTimeSession, FaceTimeSubSession, UserSession, Referral,
    ReferralClick, ReferralReward, Device
  } = models;

  User.hasMany(Statistic);
  User.hasMany(WeeklyBonus, { foreignKey: 'userId' });
  User.hasMany(FaceTimeClaims, { foreignKey: 'userId' });
  User.hasMany(HandleQueries, { foreignKey: 'userId' });
  User.hasMany(SlotResult, { foreignKey: 'userId' });
  User.hasMany(UserChallenge, { foreignKey: 'userId' });
  User.hasMany(LevelChallenges, { foreignKey: 'userId' });
  User.hasMany(BetTheFlop, { foreignKey: 'userId' });
  User.hasMany(PopupDisplay, { foreignKey: 'userId' });
  User.hasMany(RewardVIPUser, { foreignKey: 'userId' });
  User.hasMany(UserLog, { foreignKey: 'userId' });
  User.hasMany(InAppPurchase, { foreignKey: 'userId' });
  User.hasMany(LeaderBoard, { foreignKey: 'userId' });
  User.hasMany(FaceTimeSession, { foreignKey: 'userId' });
  User.hasMany(UserSession, { foreignKey: 'userId' });

  QueryTable.belongsTo(HandleQueries, { foreignKey: 'QuerytId', as: 'queryDetails' });
  QueryTable.belongsTo(VipAdmin, { foreignKey: 'AssigneeId', as: 'assignedUser' });

  ReportTable.belongsTo(Reports, { foreignKey: 'reportId', as: 'ReportDetails' });
  ReportTable.belongsTo(VipAdmin, { foreignKey: 'AssigneeId', as: 'assigneReportdUser' });

  RewardVIPUser.belongsTo(User, { foreignKey: 'userId' });
  UserSetting.belongsTo(User, { foreignKey: 'userId' });
  PopupDisplay.belongsTo(Popups, { foreignKey: 'popupId' });
  PopupDisplay.belongsTo(User, { foreignKey: 'userId' });
  BetTheFlop.belongsTo(User, { foreignKey: 'userId' });
  WeeklyBonus.belongsTo(User, { foreignKey: 'userId' });
  SlotResult.belongsTo(User, { foreignKey: 'userId' });
  FaceTimeClaims.belongsTo(User, { foreignKey: 'userId' });
  HandleQueries.belongsTo(User, { foreignKey: 'userId' });

  HandleQueries.hasMany(QueryTable, { foreignKey: 'QuerytId', as: 'queryEntries' });
  VipAdmin.hasMany(QueryTable, { foreignKey: 'AssigneeId', as: 'assignedQueries' });
  Reports.hasMany(ReportTable, { foreignKey: 'reportId', as: 'reportEntries' });
  VipAdmin.hasMany(ReportTable, { foreignKey: 'AssigneeId', as: 'assignedReports' });

  Reports.belongsTo(User, { foreignKey: 'userId' });
  UserChallenge.belongsTo(User, { foreignKey: 'userId' });
  LevelChallenges.belongsTo(User, { foreignKey: 'userId' });

  Event.hasMany(LeaderboardEvent, { foreignKey: 'eventId' });
  LeaderboardEvent.hasMany(LeaderBoard, { foreignKey: 'LBID' });
  LeaderboardEvent.belongsTo(Event, { foreignKey: 'eventId' });
  LeaderBoard.belongsTo(LeaderboardEvent, { foreignKey: 'LBID' });
  LeaderBoard.belongsTo(User, { foreignKey: 'userId' });

  FaceTimeSession.belongsTo(User, { foreignKey: 'userId' });
  FaceTimeSession.hasMany(FaceTimeSubSession, { foreignKey: 'sessionId' });
  FaceTimeSubSession.belongsTo(FaceTimeSession, { foreignKey: 'sessionId' });

  UserSession.belongsTo(User, { foreignKey: 'userId' });

  User.hasMany(Referral, { foreignKey: 'referrerId', as: 'referralsCreated' });
  User.hasMany(ReferralClick, { foreignKey: 'referrerId', as: 'referralClicks' });
  User.hasMany(ReferralReward, { foreignKey: 'referrerId', as: 'referralRewardsGiven' });
  User.hasMany(ReferralReward, { foreignKey: 'refereeId', as: 'referralRewardsReceived' });

  Referral.hasMany(ReferralClick, { foreignKey: 'referralId', as: 'clicks' });
  Referral.hasMany(ReferralReward, { foreignKey: 'referralId', as: 'rewards' });
  Referral.belongsTo(User, { foreignKey: 'referrerId', as: 'referrer' });

  ReferralClick.belongsTo(Referral, { foreignKey: 'referralId', as: 'referral' });
  ReferralClick.belongsTo(User, { foreignKey: 'referrerId', as: 'referrer' });
  ReferralClick.belongsTo(User, { foreignKey: 'convertedUserId', as: 'convertedUser' });
  ReferralClick.belongsTo(Device, { foreignKey: 'deviceHash', targetKey: 'deviceHash', as: 'device' });

  ReferralReward.belongsTo(Referral, { foreignKey: 'referralId', as: 'referral' });
  ReferralReward.belongsTo(User, { foreignKey: 'referrerId', as: 'referrer' });
  ReferralReward.belongsTo(User, { foreignKey: 'refereeId', as: 'referee' });
  ReferralReward.belongsTo(ReferralClick, { foreignKey: 'referralClickId', as: 'referralClick' });

  Device.hasMany(ReferralClick, { foreignKey: 'deviceHash', sourceKey: 'deviceHash', as: 'referralClicks' });
}

module.exports = setupAssociations;
