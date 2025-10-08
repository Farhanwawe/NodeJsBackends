/**
 * User model for database
 * @param sequelize
 * @param type data types
 * @returns {*|void|target}
 */
module.exports = (sequelize, type) => {
  return sequelize.define('user', {
    id: {
      type: type.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    name: type.STRING,
    xp: {type: type.INTEGER, defaultValue: 0},
    money: {type: type.NUMERIC, defaultValue: 0},
    win_count: {type: type.INTEGER, defaultValue: 0},
    lose_count: {type: type.INTEGER, defaultValue: 0},
    rew_ad_count: {type: type.INTEGER, defaultValue: 0},
    email: type.STRING,
    password: type.STRING,
    facebookid: type.STRING,
    udid: type.STRING,
    number: type.STRING,
    pre_flop: {type: type.INTEGER, defaultValue: 0},
    flop: {type: type.INTEGER, defaultValue: 0},
    turn: {type: type.INTEGER, defaultValue: 0},
    river: {type: type.INTEGER, defaultValue: 0},
    OnlineStatus :{type: type.BOOLEAN, defaultValue:"false"},
    profileImageLink : {type: type.STRING, defaultValue:"https://wawe-poker-api-handeling-fabddf98b575.herokuapp.com/Assets/ProfileImages/snow_man.png"},
    FbUserId: {type: type.STRING,defaultValue:""},
    BestCards :{type: type.STRING(1024),defaultValue:""},
    BestHandName :{type: type.STRING,defaultValue:""},
    BestHandValue :{type: type.NUMERIC,defaultValue:0},
    BiggestWalletEver :{type: type.NUMERIC,defaultValue:0},
    BiggestHand :{type: type.NUMERIC,defaultValue:0},
    InstaFollow :{type: type.NUMERIC,defaultValue:0},
    InstaFollow :{type: type.NUMERIC,defaultValue:0},
    FacebookLike :{type: type.NUMERIC,defaultValue:0},
    RateUs :{type: type.NUMERIC,defaultValue:0},
    TwitterFollow :{type: type.NUMERIC,defaultValue:0},
    VipStatus:{type: type.BOOLEAN, defaultValue:"false"},
    DropUser:{type: type.BOOLEAN, defaultValue:"false"},
    Level:{type: type.INTEGER, defaultValue:"1"},
    banDuration:{type:type.DATE,defaultValue:null},
    LoginStatus:{type: type.BOOLEAN, defaultValue:"false"},
    lastDisplayedPopupIndex:type.INTEGER,
    PopupCount:type.INTEGER,
    conn:type.BIGINT,
    welcomeBonus:type.BOOLEAN,
    username:type.STRING,
    vipLevel:{type: type.INTEGER, defaultValue:"0"},
    vipPoints:{type: type.INTEGER, defaultValue:"0"},
    membersince:{type: type.DATE},
    googleProfileImageLink : {type: type.STRING},
    facebookProfileImageLink : {type: type.STRING},
    usernameCounter:{type: type.INTEGER},
    countrycode:{type: type.STRING},
    platform:{type: type.STRING},
  })
};
