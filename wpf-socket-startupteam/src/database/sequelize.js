// Components
const config = require('../../config.js');
const Sequelize = require('sequelize');
const dotEnv = require('dotenv');
// Migration system is now handled by the standalone migration.js file

dotEnv.config();

// Models
const UserModel = require('../models/user.js');
const StatisticModel = require('../models/statistic.js');
const friendslistModel = require('../models/FriendsModel.js');
const UserGameStatsModel = require('../models/UserGameStats.js');
const BonusValuesModel = require('../models/BonusValues.js');
const CustomNotificationsModel = require('../models/CustomNotifications.js');
const GiftsModel = require('../models/Gifts.js');
const vipAdminModel = require('../models/vipAdmin.js');
const WeeklyBonusModel = require('../models/WeeklyBonus.js');
const handleQueries = require('../models/HandleQueries.js');
const reports = require('../models/Reports.js');
const userLog = require('../models/userLog.js');
const inAppPurchase = require('../models/InAppPurchase.js');
const tables = require('../models/tables.js');
const event = require('../models/events.js');
const leaderBoard = require('../models/leaderboard.js');
const leaderboardEvent = require('../models/leaderboardevent.js');
const faceTimeSession = require('../models/FaceTimeSession.js');
const faceTimeSubSession = require('../models/FacetimeSubSession.js');
const faceTimeClaims = require('../models/facetimeClaims.js');
const slotResult = require('../models/slotResult.js');
const NotificationModel = require('../models/Notification.js');
const dailyChallenges = require('../models/dailyChallenges.js')
const userChallenge = require('../models/userChallenge.js')
const rewardChallenges= require('../models/rewardChallenges.js')
const levelChallenges = require('../models/levelChallenge.js');
const dailyBonusList = require('../models/dailybonuslist.js');
const betTheFlop = require('../models/betTheFlop.js');
const popups = require('../models/popup.js');
const popupdisplay = require('../models/popupdisplay.js');
const inAppProduct = require('../models/product.js');
const popupEvent  = require('../models/popupEvent.js');
const rewardVIPUser = require('../models/RewardVIPUser.js');
const userSetting = require('../models/userSetting.js');
const reporttable = require('../models/ReportTable.js');
const querytable = require('../models/QueryTable.js');
const vipMembership = require('../models/VipMembership.js');
const comments = require('../models/comments.js');
const versioncontrol = require('../models/Versioncontrol.js');
const UserSessionModel = require('../models/userSession.js'); 
const UserFeatureModel = require('../models/userFeature.js');
//ref models
const ReferralModel = require('../models/referral.js');
const ReferralClickModel = require('../models/referralClick.js');
const ReferralRewardModel = require('../models/referralReward.js');
const DeviceModel = require('../models/device.js');
const NotificationTimerModel = require('../models/NotificationTimer.js');
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
const Notification = NotificationModel(sequelize, Sequelize);

const Referral = ReferralModel(sequelize, Sequelize);
const ReferralClick = ReferralClickModel(sequelize, Sequelize);
const ReferralReward = ReferralRewardModel(sequelize, Sequelize);
const Device = DeviceModel(sequelize, Sequelize);
const NotificationTimer = NotificationTimerModel(sequelize, Sequelize);


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

// UserFeature relationships
User.hasMany(UserFeature, { foreignKey: 'userId', as: 'userFeatures' });
UserFeature.belongsTo(User, { foreignKey: 'userId' });
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
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    // Sync tables (create if not exist)
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ Database tables synchronized');
    
    console.log('✅ Database initialization complete');
    console.log('ℹ️  Run "node migration.js run" to apply schema changes');
    
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    throw err;
  }
}

// Initialize database
initializeDatabase();


// Export models
module.exports = {
  sequelize,
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
  Notification,
  Referral,
  ReferralClick,
  ReferralReward,
  Device,
  UserFeature,
  NotificationTimer
};
