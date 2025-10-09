const UserModel = require('../models/user');
const StatisticModel = require('../models/statistic');
const FriendsModel = require('../models/FriendsModel');
const UserGameStatsModel = require('../models/UserGameStats');
const BonusValuesModel = require('../models/BonusValues');
const CustomNotificationsModel = require('../models/CustomNotifications');
const GiftsModel = require('../models/Gifts');
const VipAdminModel = require('../models/vipAdmin');
const WeeklyBonusModel = require('../models/WeeklyBonus');
const HandleQueriesModel = require('../models/HandleQueries');
const ReportsModel = require('../models/Reports');
const UserLogModel = require('../models/userLog');
const InAppPurchaseModel = require('../models/InAppPurchase');
const TablesModel = require('../models/tables');
const EventModel = require('../models/events');
const LeaderBoardModel = require('../models/leaderboard');
const LeaderboardEventModel = require('../models/leaderboardevent');
const FaceTimeSessionModel = require('../models/FaceTimeSession');
const FaceTimeSubSessionModel = require('../models/FacetimeSubSession');
const FaceTimeClaimsModel = require('../models/facetimeClaims');
const SlotResultModel = require('../models/slotResult');
const DailyChallengesModel = require('../models/dailyChallenges');
const UserChallengeModel = require('../models/userChallenge');
const RewardChallengesModel = require('../models/rewardChallenges');
const LevelChallengesModel = require('../models/levelChallenge');
const DailyBonusListModel = require('../models/dailybonuslist');
const BetTheFlopModel = require('../models/betTheFlop');
const PopupsModel = require('../models/popup');
const PopupDisplayModel = require('../models/popupdisplay');
const InAppProductModel = require('../models/product');
const PopupEventModel = require('../models/popupEvent');
const RewardVIPUserModel = require('../models/RewardVIPUser');
const UserSettingModel = require('../models/userSetting');
const ReportTableModel = require('../models/ReportTable');
const QueryTableModel = require('../models/QueryTable');
const VipMembershipModel = require('../models/VipMembership');
const CommentsModel = require('../models/comments');
const VersionControlModel = require('../models/Versioncontrol');
const UserSessionModel = require('../models/userSession');
const UserFeatureModel = require('../models/userFeature');
const ReferralModel = require('../models/referral');
const ReferralClickModel = require('../models/referralClick');
const ReferralRewardModel = require('../models/referralReward');
const DeviceModel = require('../models/device');

function initializeModels(sequelize, Sequelize) {
  const models = {
    User: UserModel(sequelize, Sequelize),
    UserFeature: UserFeatureModel(sequelize, Sequelize),
    Statistic: StatisticModel(sequelize, Sequelize),
    Friends: FriendsModel(sequelize, Sequelize),
    UserGameStats: UserGameStatsModel(sequelize, Sequelize),
    BonusValues: BonusValuesModel(sequelize, Sequelize),
    CustomNotifications: CustomNotificationsModel(sequelize, Sequelize),
    Gifts: GiftsModel(sequelize, Sequelize),
    VipAdmin: VipAdminModel(sequelize, Sequelize),
    WeeklyBonus: WeeklyBonusModel(sequelize, Sequelize),
    HandleQueries: HandleQueriesModel(sequelize, Sequelize),
    Reports: ReportsModel(sequelize, Sequelize),
    UserLog: UserLogModel(sequelize, Sequelize),
    InAppPurchase: InAppPurchaseModel(sequelize, Sequelize),
    Tables: TablesModel(sequelize, Sequelize),
    Event: EventModel(sequelize, Sequelize),
    LeaderboardEvent: LeaderboardEventModel(sequelize, Sequelize),
    LeaderBoard: LeaderBoardModel(sequelize, Sequelize),
    FaceTimeSession: FaceTimeSessionModel(sequelize, Sequelize),
    FaceTimeSubSession: FaceTimeSubSessionModel(sequelize, Sequelize),
    FaceTimeClaims: FaceTimeClaimsModel(sequelize, Sequelize),
    SlotResult: SlotResultModel(sequelize, Sequelize),
    DailyChallenges: DailyChallengesModel(sequelize, Sequelize),
    UserChallenge: UserChallengeModel(sequelize, Sequelize),
    RewardChallenges: RewardChallengesModel(sequelize, Sequelize),
    LevelChallenges: LevelChallengesModel(sequelize, Sequelize),
    DailyBonusList: DailyBonusListModel(sequelize, Sequelize),
    BetTheFlop: BetTheFlopModel(sequelize, Sequelize),
    Popups: PopupsModel(sequelize, Sequelize),
    PopupDisplay: PopupDisplayModel(sequelize, Sequelize),
    InAppProducts: InAppProductModel(sequelize, Sequelize),
    PopupEvent: PopupEventModel(sequelize, Sequelize),
    RewardVIPUser: RewardVIPUserModel(sequelize, Sequelize),
    UserSetting: UserSettingModel(sequelize, Sequelize),
    ReportTable: ReportTableModel(sequelize, Sequelize),
    QueryTable: QueryTableModel(sequelize, Sequelize),
    VipMembership: VipMembershipModel(sequelize, Sequelize),
    Comments: CommentsModel(sequelize, Sequelize),
    Version: VersionControlModel(sequelize, Sequelize),
    UserSession: UserSessionModel(sequelize, Sequelize),
    Referral: ReferralModel(sequelize, Sequelize),
    ReferralClick: ReferralClickModel(sequelize, Sequelize),
    ReferralReward: ReferralRewardModel(sequelize, Sequelize),
    Device: DeviceModel(sequelize, Sequelize),
  };

  return models;
}

module.exports = initializeModels;
