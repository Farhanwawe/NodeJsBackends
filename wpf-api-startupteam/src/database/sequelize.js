// Components
const config = require('../../config');
const Sequelize = require('sequelize');
const dotEnv = require('dotenv');

dotEnv.config();

// Models
const UserModel = require('../models/user');
const StatisticModel = require('../models/statistic');
const friendslistModel = require('../models/FriendsModel');
const UserGameStatsModel = require('../models/UserGameStats');
const BonusValuesModel = require('../models/BonusValues');
const CustomNotificationsModel = require('../models/CustomNotifications');
const GiftsModel = require('../models/Gifts');
const vipAdminModel = require('../models/vipAdmin');
const WeeklyBonusModel = require('../models/WeeklyBonus');
const handleQueries = require('../models/HandleQueries');
const reports = require('../models/Reports');
const userLog = require('../models/userLog');
const inAppPurchase = require('../models/InAppPurchase');
const tables = require('../models/tables');
const event = require('../models/events');
const leaderBoard = require('../models/leaderboard');
const leaderboardEvent = require('../models/leaderboardevent');
const faceTimeSession = require('../models/FaceTimeSession');
const faceTimeSubSession = require('../models/FacetimeSubSession');
const faceTimeClaims = require('../models/facetimeClaims');
const slotResult = require('../models/slotResult');
const dailyChallenges = require('../models/dailyChallenges')
const userChallenge = require('../models/userChallenge')
const rewardChallenges= require('../models/rewardChallenges')
const levelChallenges = require('../models/levelChallenge');
const dailyBonusList = require('../models/dailybonuslist');
const betTheFlop = require('../models/betTheFlop');
const popups = require('../models/popup');
const popupdisplay = require('../models/popupdisplay');
const inAppProduct = require('../models/product');
const popupEvent  = require('../models/popupEvent.js');
const rewardVIPUser = require('../models/RewardVIPUser.js');
const userSetting = require('../models/userSetting');
const reporttable = require('../models/ReportTable');
const querytable = require('../models/QueryTable');
const vipMembership = require('../models/VipMembership');
const comments = require('../models/comments');
const versioncontrol = require('../models/Versioncontrol');
const UserSessionModel = require('../models/userSession'); 
const UserFeatureModel = require('../models/userFeature');
//ref models
const ReferralModel = require('../models/referral');
const ReferralClickModel = require('../models/referralClick');
const ReferralRewardModel = require('../models/referralReward');
const DeviceModel = require('../models/device');
//const userFeature = require('../models/userFeature');
// Sequelize instance
const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
  port: process.env.DB_PORT,
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT,
  pool: {
    max: 10,
    min: 0,
    idle: 10000
  },
  logging: function (str) {
    if (config.sequelize.logging) {
      console.log(str);
    }
  },
});


// Initialize models
const User = UserModel(sequelize, Sequelize);
const UserFeature = UserFeatureModel(sequelize, Sequelize);
const Statistic = StatisticModel(sequelize, Sequelize);
const Friends = friendslistModel(sequelize, Sequelize);
const UserGameStats = UserGameStatsModel(sequelize, Sequelize);
const BonusValues = BonusValuesModel(sequelize, Sequelize);
const CustomNotifications = CustomNotificationsModel(sequelize, Sequelize);
const Gifts = GiftsModel(sequelize, Sequelize);
const VipAdmin = vipAdminModel(sequelize, Sequelize);
const WeeklyBonus = WeeklyBonusModel(sequelize, Sequelize);
const HandleQueries = handleQueries(sequelize, Sequelize);
const Reports = reports(sequelize, Sequelize);
const UserLog = userLog(sequelize, Sequelize);
const InAppPurchase = inAppPurchase(sequelize, Sequelize);
const Tables = tables(sequelize, Sequelize);
const Event = event(sequelize, Sequelize);
const LeaderboardEvent = leaderboardEvent(sequelize, Sequelize);
const LeaderBoard = leaderBoard(sequelize, Sequelize);
const FaceTimeSession = faceTimeSession(sequelize, Sequelize);
const FaceTimeSubSession = faceTimeSubSession(sequelize, Sequelize);
const FaceTimeClaims = faceTimeClaims(sequelize, Sequelize);
const SlotResult = slotResult(sequelize, Sequelize);
const DailyChallenges = dailyChallenges(sequelize, Sequelize);  
const UserChallenge = userChallenge(sequelize, Sequelize);
const RewardChallenges = rewardChallenges(sequelize, Sequelize);
const LevelChallenges = levelChallenges(sequelize, Sequelize);
const DailyBonusList = dailyBonusList(sequelize, Sequelize);
const BetTheFlop = betTheFlop(sequelize, Sequelize);
const Popups = popups(sequelize, Sequelize);
const PopupDisplay = popupdisplay(sequelize, Sequelize);
const InAppProducts = inAppProduct(sequelize, Sequelize);
const PopupEvent = popupEvent(sequelize, Sequelize);
const RewardVIPUser = rewardVIPUser(sequelize, Sequelize);
const UserSetting = userSetting(sequelize, Sequelize);
const ReportTable = reporttable(sequelize, Sequelize);
const QueryTable = querytable(sequelize, Sequelize);
const VipMembership = vipMembership(sequelize, Sequelize);
const Comments = comments(sequelize, Sequelize);
const Version = versioncontrol(sequelize, Sequelize);
const UserSession = UserSessionModel(sequelize, Sequelize);

const Referral = ReferralModel(sequelize, Sequelize);
const ReferralClick = ReferralClickModel(sequelize, Sequelize);
const ReferralReward = ReferralRewardModel(sequelize, Sequelize);
const Device = DeviceModel(sequelize, Sequelize);


// Define relations
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
QueryTable.belongsTo(HandleQueries, { 
  foreignKey: 'QuerytId', 
  as: 'queryDetails' 
});

QueryTable.belongsTo(VipAdmin, { 
  foreignKey: 'AssigneeId', 
  as: 'assignedUser' 
});
ReportTable.belongsTo(Reports, { 
  foreignKey: 'reportId', 
  as: 'ReportDetails' 
});

ReportTable.belongsTo(VipAdmin, { 
  foreignKey: 'AssigneeId', 
  as: 'assigneReportdUser' 
});
RewardVIPUser.belongsTo(User, { foreignKey: 'userId' });
UserSetting.belongsTo(User, { foreignKey: 'userId' });
PopupDisplay.belongsTo(Popups, { foreignKey: 'popupId' });
PopupDisplay.belongsTo(User, { foreignKey: 'userId' });
BetTheFlop.belongsTo(User, { foreignKey: 'userId' });
WeeklyBonus.belongsTo(User, { foreignKey: 'userId' });
SlotResult.belongsTo(User, { foreignKey: 'userId' });
FaceTimeClaims.belongsTo(User, { foreignKey: 'userId' });
HandleQueries.belongsTo(User, { foreignKey: 'userId' });
HandleQueries.hasMany(QueryTable, { 
  foreignKey: 'QuerytId', 
  as: 'queryEntries' 
});
VipAdmin.hasMany(QueryTable, { 
  foreignKey: 'AssigneeId', 
  as: 'assignedQueries' 
});
Reports.hasMany(ReportTable, { 
  foreignKey: 'reportId', 
  as: 'reportEntries' 
});
VipAdmin.hasMany(ReportTable, { 
  foreignKey: 'AssigneeId', 
  as: 'assignedReports' 
});
Reports.belongsTo(User, { foreignKey: 'userId' });
UserChallenge.belongsTo(User, { foreignKey: 'userId' });
LevelChallenges.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(UserLog, { foreignKey: 'userId' });
User.hasMany(InAppPurchase, { foreignKey: 'userId' });
Event.hasMany(LeaderboardEvent, { foreignKey: 'eventId' });
User.hasMany(LeaderBoard, { foreignKey: 'userId' });
LeaderboardEvent.hasMany(LeaderBoard, { foreignKey: 'LBID' });
LeaderboardEvent.belongsTo(Event, { foreignKey: 'eventId' });
LeaderBoard.belongsTo(LeaderboardEvent, { foreignKey: 'LBID' });
LeaderBoard.belongsTo(User, { foreignKey: 'userId' });
FaceTimeSession.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(FaceTimeSession, { foreignKey: 'userId' });
FaceTimeSession.hasMany(FaceTimeSubSession, { foreignKey: 'sessionId' });
FaceTimeSubSession.belongsTo(FaceTimeSession, { foreignKey: 'sessionId' });
User.hasMany(UserSession, { foreignKey: 'userId' });
UserSession.belongsTo(User, { foreignKey: 'userId' });
// User Relationships
User.hasMany(Referral, { 
  foreignKey: 'referrerId',
  as: 'referralsCreated'
});

User.hasMany(ReferralClick, {
  foreignKey: 'referrerId',
  as: 'referralClicks'
});

User.hasMany(ReferralReward, {
  foreignKey: 'referrerId',
  as: 'referralRewardsGiven'
});

User.hasMany(ReferralReward, {
  foreignKey: 'refereeId',
  as: 'referralRewardsReceived'
});

// Referral Relationships
Referral.hasMany(ReferralClick, {
  foreignKey: 'referralId',
  as: 'clicks'
});

Referral.hasMany(ReferralReward, {
  foreignKey: 'referralId',
  as: 'rewards'
});

Referral.belongsTo(User, {
  foreignKey: 'referrerId',
  as: 'referrer'
});

// ReferralClick Relationships
ReferralClick.belongsTo(Referral, {
  foreignKey: 'referralId',
  as: 'referral'
});

ReferralClick.belongsTo(User, {
  foreignKey: 'referrerId',
  as: 'referrer'
});

ReferralClick.belongsTo(User, {
  foreignKey: 'convertedUserId',
  as: 'convertedUser'
});

ReferralClick.belongsTo(Device, {
  foreignKey: 'deviceHash',
  targetKey: 'deviceHash',
  as: 'device'
});

// ReferralReward Relationships
ReferralReward.belongsTo(Referral, {
  foreignKey: 'referralId',
  as: 'referral'
});

ReferralReward.belongsTo(User, {
  foreignKey: 'referrerId',
  as: 'referrer'
});

ReferralReward.belongsTo(User, {
  foreignKey: 'refereeId',
  as: 'referee'
});

ReferralReward.belongsTo(ReferralClick, {
  foreignKey: 'referralClickId',
  as: 'referralClick'
});

// Device Relationships
Device.hasMany(ReferralClick, {
  foreignKey: 'deviceHash',
  sourceKey: 'deviceHash',
  as: 'referralClicks'
});




// Sync with database
sequelize.sync()
  .then(() => {
    console.log("Database synchronized");
  })
  .catch((err) => {
    console.error("Error synchronizing database: ", err);
  });


// Export models
module.exports = {
  User,
  Statistic,
  Friends,
  UserGameStats,
  BonusValues,
  CustomNotifications,
  Gifts,
  VipAdmin,
  WeeklyBonus,
  HandleQueries,
  Reports,
  UserLog,
  InAppPurchase,
  Tables,
  Event
  ,LeaderboardEvent,
  LeaderBoard,
  FaceTimeSession,
  FaceTimeSubSession,
  FaceTimeClaims,
  SlotResult,
  DailyChallenges,
  UserChallenge,
  RewardChallenges,
  LevelChallenges,
  DailyBonusList,
  BetTheFlop,
  Popups,
  PopupDisplay,
  InAppProducts,
  PopupEvent,
  RewardVIPUser,
  UserSetting,
  ReportTable,
  QueryTable,
  VipMembership,
  Comments,
  Version,
  UserSession,
  Referral,
  ReferralClick,
  ReferralReward,
  Device,
  UserFeature
};
