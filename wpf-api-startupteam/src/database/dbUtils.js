'use strict';

// Imports
const Sequelize = require('sequelize');
const logger = require('..//app/logger');
// const user = require('../models/user');
// const friendslistModel = require('../models/FriendsModel');
// const userGameStatsModel = require('../models/UserGameStats');
const { DATE } = require("sequelize");
const moment = require('moment');

const Op = Sequelize.Op;



/**
 * Create new user if not exists
 * @param {Object} sequelizeObjects
 * @param {String} username
 * @param {String} password
 * @param {String} email
 * @returns {Promise<any>}
 * @constructor
 */
function CreateAccountPromise(sequelizeObjects, username, password, email) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: { name: username },
    })
      .then(userObj => {
        if (userObj.length > 0) {
          resolve({ result: false });
        } else {
          logger.log(`${username}  ${email}  ${password}`);
          sequelizeObjects.User.create({
            name: username,
            password: password,
            email: email,
            money: 10000,
          })
            .then(() => {
              resolve({ result: true });
            })

        }
      })
      
  });
}

exports.CreateAccountPromise = CreateAccountPromise;

/**
 * Create new user if not exists
 * @param {Object} sequelizeObjects
 * @returns {Promise<any>}
 * @constructor
 */
function BonusAmountsPromise(sequelizeObjects) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.BonusValues.findAll({
    }).then(userObj => {
      if (userObj.length > 0) {
        resolve({result: userObj[0]});
      }
    })
  });
}

exports.BonusAmountsPromise = BonusAmountsPromise;

/**
 * Create new user if not exists
 * @param {Object} sequelizeObjects
 * @returns {Promise<any>}
 * @constructor
 */
function AllGiftsPromise(sequelizeObjects) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.Gifts.findAll({
      where: {Enabled: "true"},
    }).then(userObj => {
      if (userObj.length > 0) {
        resolve({result: userObj});
      }
    })
  });
}

exports.AllGiftsPromise = AllGiftsPromise;

/**
 * Create new user if not exists
 * @param {Object} sequelizeObjects
 * @param {String} playerId
 * @param {String} Cards
 * @param {Number} value
 * @param {String} name
 * @returns {Promise<any>}
 * @constructor
 */
function PlayerCardsUpdate(sequelizeObjects, playerId, Cards,value,name) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: {id: playerId},
    }).then(userObj => {
      if (userObj.length <= 0) {
        resolve({result: false});
      } else {
        userObj[0].update(
          {
            BestCards: Cards,
            BestHandName:name,
            BestHandValue:value,
          }
        ).then(() => {
          resolve({result: true});
        })
      }
    })    
    
  });
}

exports.PlayerCardsUpdate = PlayerCardsUpdate;

/**
 * Create new user if not exists
 * @param {Object} sequelizeObjects
 * @param {String} playerId
 * @returns {Promise<any>}
 * @constructor
 */
function PlayerCards(sequelizeObjects, playerId) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: {id: playerId},
    }).then(userObj => {
      if (userObj.length <= 0) {
        resolve({result: false});
      } else {
        if(userObj[0].BestCards == null || userObj[0].BestCards===""){
          resolve({result: false});
        }else{
          resolve({result: true,bestCards : userObj[0].BestCards});
        }
      }
    })
  });
}

exports.PlayerCards = PlayerCards;

/**
 * Create new user if not exists
 * @param {Object} sequelizeObjects
 * @param {number} MyID
 * @param {number} OtherPlayerID
 * @returns {Promise<any>}
 * @constructor
 */
function ReturnPlayerInfoPromise(sequelizeObjects, MyID, OtherPlayerID) {
  return new Promise(function (resolve, reject) {
    let OtherUser ="Usman";
    sequelizeObjects.User.findAll({
      limit: 1,
      where: [{id: OtherPlayerID}]
    }).then(userInfo =>{
      if(userInfo.length>0){
        OtherUser = userInfo[0];
        OtherUser.udid ="";
        sequelizeObjects.Friends.findAll({
          limit: 1,
          where: [{idMyPlayer: MyID},{idOtherPlayer:OtherPlayerID}]
        }).then(userObj => {
          if (userObj.length > 0) {
            if(userInfo[0].BestCards != null && userInfo[0].BestCards!=""){
              resolve({result: true,OwnerID:MyID,FStatus:userObj[0].FriendStatus,UserInfo : OtherUser,userCards:JSON.parse(userInfo[0].BestCards)});
            } else{
              resolve({result: true,OwnerID:MyID,FStatus:userObj[0].FriendStatus,UserInfo : OtherUser,userCards:null});
            }
                
          } else {
            sequelizeObjects.Friends.findAll({
              limit: 1,
              where: [{idMyPlayer: OtherPlayerID},{idOtherPlayer:MyID }]
            }).then(userInfo1 =>{
              if(userInfo1.length>0){
                if(userInfo[0].BestCards != null && userInfo[0].BestCards!=""){
                  resolve({result: true,OwnerID:OtherPlayerID,FStatus:userInfo1[0].FriendStatus,UserInfo : OtherUser,userCards:JSON.parse(userInfo[0].BestCards)});
                } else{
                  resolve({result: true,OwnerID:MyID,FStatus:userInfo1[0].FriendStatus,UserInfo : OtherUser,userCards:null});
                }
              }else{
                if(userInfo[0].BestCards != null && userInfo[0].BestCards!=""){
                  resolve({result: true,OwnerID:"",FStatus:"",UserInfo : OtherUser,userCards:JSON.parse(userInfo[0].BestCards)});
                } else{
                  resolve({result: true,OwnerID:"",FStatus:"",UserInfo : OtherUser,userCards:null});
                }
                //resolve({result: true,OwnerID:"",FStatus:"",UserInfo : OtherUser,userCards:JSON.parse(userInfo[0].BestCards)});
              }
            }).catch(err => {
              logger.log('Error finding user:', err);
              reject({ result: false, error: 'Error finding user' });
            });
          }
        })
      }else{
        resolve({result: true});
      }
    })
  });
}
exports.ReturnPlayerInfoPromise = ReturnPlayerInfoPromise;

/**
 * Create new user if not exists
 * @param {Object} sequelizeObjects
 * @param {number} MyID
 * @param {number} OtherPlayerID
 * @param {string} status
 * @returns {Promise<any>}
 * @constructor
 */
function ReturnPlayerRequestAccept(sequelizeObjects, MyID, OtherPlayerID,status) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.Friends.findAll({
      limit: 1,
      where: [{idMyPlayer: MyID},{idOtherPlayer:OtherPlayerID}]
    }).then(userObj => {
      if (userObj.length > 0) {
          userObj[0].update({FriendStatus: status}).then(() => {
          resolve({result: true,Relation:userObj[0]});
        });
      } else {
        sequelizeObjects.Friends.findAll({
          limit: 1,
          where: [{idMyPlayer: OtherPlayerID},{idOtherPlayer:MyID }]
        }).then(userInfo1 =>{
          if(userInfo1.length>0){
            userInfo1[0].update({FriendStatus: status}).then(() => {
              resolve({result: true,Relation:userInfo1[0]});
            }).catch(err => {
              logger.log('Error finding user:', err);
              reject({ result: false, error: 'Error finding user' });
            });
          }
        })
      }
    })
  });
}
exports.ReturnPlayerRequestAccept = ReturnPlayerRequestAccept;

/**
 * Create new user if not exists
 * @param {Object} sequelizeObjects
 * @param {number} MyID
 * @param {number} OtherPlayerID
 * @returns {Promise<any>}
 * @constructor
 */
function AddFriendInfoPromise(sequelizeObjects, MyID, OtherPlayerID) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll().then(userObject => {
      sequelizeObjects.Friends.findAll({
        limit: 1,
        where: [{idMyPlayer: MyID},{idOtherPlayer:OtherPlayerID}]
      }).then(userObj => {
        if (userObj.length > 0) {
            userObj[0].update({FriendStatus: "Request"}).then(() => {
            resolve({result: true,Relation:userObj[0]});
          })
        } else {
          sequelizeObjects.Friends.findAll({
            limit: 1,
            where: [{idMyPlayer: OtherPlayerID},{idOtherPlayer:MyID }]
          }).then(userInfo1 =>{
            if(userInfo1.length>0){
              let myname = userInfo1[0].NameMyPlayer;
              userInfo1[0].update({FriendStatus: "Request",idMyPlayer:MyID,idOtherPlayer:OtherPlayerID,NameMyPlayer:userInfo1[0].NameOtherPlayer,NameOtherPlayer:myname}).then(() => {
                resolve({result: true,Relation:userInfo1[0]});
              })
            }else{
              let myname,othername="";
              userObject.forEach(element => {
                if(myname=="" || othername==""){
                  if(element.id == MyID){
                    myname = element.name;
                  }else if(element.id == OtherPlayerID){
                    othername = element.name;
                  }
                }
              });
              sequelizeObjects.Friends.create(
                {
                  idMyPlayer: MyID,
                  idOtherPlayer: OtherPlayerID,
                  NameOtherPlayer : othername,
                  NameMyPlayer:myname,
                  FriendStatus: "Request",
                }
              ).then((user) => {
                resolve({result: true,requestSend:OtherPlayerID});
              })
            }
          })
        }
      });
    })
  });
}
exports.AddFriendInfoPromise = AddFriendInfoPromise;

/**
 * Create new user if not exists
 * @param {Object} sequelizeObjects
 * @param {number} MyID
 * @returns {Promise<any>}
 * @constructor
 */
function ReturnFriendListRequest(sequelizeObjects, MyID) {
  return new Promise(function (resolve, reject) {
      sequelizeObjects.Friends.findAll({
        where: [{idOtherPlayer: MyID},{FriendStatus:"Request"}]
      }).then(userObj => {
        let returnValues=[];
        if(userObj.length>0){
           for(let i=0;i<userObj.length;i++){
            returnValues.push(userObj[i]);
           }
          logger.log(JSON.stringify(userObj));
          resolve({returnValues});
        }else{
          resolve({ returnValues});
        }
      })
  });
}
exports.ReturnFriendListRequest = ReturnFriendListRequest;

/**
 * Create new user if not exists
 * @param {Object} sequelizeObjects
 * @param {number} MyID
 * @returns {Promise<any>}
 * @constructor
 */
function ReturnFriendListAccepted(sequelizeObjects, MyID) {
  return new Promise(function (resolve, reject) {

      sequelizeObjects.Friends.findAll({
        where: {
          [Op.and]: [{ idOtherPlayer: MyID }, { FriendStatus:"Accept" }],
        }
      }).then(userObj => {
        sequelizeObjects.Friends.findAll({
          where: {
            [Op.and]: [{ idMyPlayer: MyID }, { FriendStatus:"Accept" }],
          }
        }).then(userObj1 => {
          
          let returnValues=[];
          if(userObj.length>0){
             for(let i=0;i<userObj.length;i++){
              sequelizeObjects.User.findAll({
                limit: 1,
                where: [{id: userObj[i].idMyPlayer}]
              }).then(userObject =>{
                userObj[i].nameOtherPlayer = userObject.name;                
              });
               returnValues.push(userObj[i]);
             }
          }
          if(userObj1.length>0){
            for(let i=0;i<userObj1.length;i++){
              sequelizeObjects.User.findAll({
                limit: 1,
                where: [{id: userObj1[i].idOtherPlayer}]
              }).then(userObject =>{
                userObj1[i].nameOtherPlayer = userObject.name;
                
              });
              returnValues.push(userObj1[i]);
            }
         }
          resolve({returnValues});
        });
      });
  });
}
exports.ReturnFriendListAccepted = ReturnFriendListAccepted;

/**
 * Create phone auth data
 * @param {Object} sequelizeObjects
 * @param {String} username
 * @param {String} udid
 * @param {String} number
 * @returns {Promise<any>}
 * @constructor
 */
function CreatePhoneAuthPromise(sequelizeObjects,username, number,udid) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: { number: number },
    }).then(userObj => {
      if (userObj.length > 0) {
        sequelizeObjects.User.findAll({
          limit: 1,
          where: { udid: udid },
        }).then(userObj1 =>{
          if(userObj1.length>0){
            if(userObj1[0].id === userObj[0].id){
              resolve({result: true,username:userObj[0].name,udid:userObj[0].udid,number:userObj[0].number,userid:userObj[0].id});
            }else{
              resolve({result: false,username:"",udid:"",number:0,userid:-1});
            }
          }else{
            resolve({result: false,username:"",udid:"",number:0,userid:-1});
          }
        })
        if(userObj[0].udid == udid ||userObj[0].udid==""){
          if(userObj[0].udid==""){
            userObj[0].update({udid: udid}).then(() => {
            });
          }
          resolve({result: true,username:userObj[0].name,udid:userObj[0].udid,number:userObj[0].number,userid:userObj[0].id});
        }else{
          resolve({result: false,username:"",udid:"",number:0,userid:-1});
        }
      } else {
        sequelizeObjects.User.create(
          {
            name: username,
            udid: udid,
            number: number,
            money:200000,
          }
        ).then((user) => {
          resolve({result: true,username:user.name,udid:udid,number:number,userid:user.id});
        });
      }
    });
  });
}
exports.CreatePhoneAuthPromise = CreatePhoneAuthPromise;

/**
 * Create facebook login data
 * @param {Object} sequelizeObjects
 * @param {String} username
 * @param {String} udid
 * @param {String} FBUserId
 * @param {String} FBDPLink
 * @returns {Promise<any>}
 * @constructor
 */
function CreateFacebookLoginPromise(sequelizeObjects,username,udid,FBUserId,FBDPLink) {
  return new Promise(function (resolve, reject) {
    logger.log("Executing Query");
    sequelizeObjects.User.findAll({
      limit: 1,
      where: {FbUserId: FBUserId},
    }).then(userObj => {
      logger.log("Executing Query1");
      if (userObj.length > 0) {
        sequelizeObjects.User.findAll({
          limit: 1,
          where: { udid: udid },
        }).then(userObj1 =>{
          if(userObj1.length>0){
          if(userObj1[0].FbUserId == userObj[0].FbUserId){
            resolve({result: true,reason:"ExactPlayer",user:userObj[0]});
          }else{
            resolve({result: false,reason:"DifferentUDID"});
          }
        }
        })
        logger.log("Executing Query2");
        if(userObj[0].udid == udid ||userObj[0].udid==""){
          if(userObj[0].udid==""){
            userObj[0].update({udid: udid}).then(() => {
            });
          }
          resolve({result: true,reason:"LoginSuccessfull",user:userObj[0]});
        }else{
          resolve({result: false,reason:"ALreadyLogedinanotherdevice"});
        }
      } else {
        logger.log("Executing Query3");
        sequelizeObjects.User.findAll({
          limit: 1,
          where: { udid: udid },
        }).then(user =>{
          if(user.length>0){
            resolve({result: false,reason:"DeviceidAlreadyExist"});
          }else{
            sequelizeObjects.User.create(
              {
                name: username,
                udid: udid,
                FbUserId: FBUserId,
                profileImageLink:FBDPLink,
              }
            ).then((user) => {
              resolve({result: true,reason:"CreatedNewID",user:user});
            });
          }
        });
        
      }
    }).catch(()=>{
      logger.log("Error Executing QUERY");
    });
  });
}
exports.CreateFacebookLoginPromise = CreateFacebookLoginPromise;

/**
 * Create gogle login data
 * @param {Object} sequelizeObjects
 * @param {String} username
 * @param {String} udid
 * @param {String} Email
 * @param {String} DPLink
 * @returns {Promise<any>}
 * @constructor
 */
function CreateGoogleLoginPromise(sequelizeObjects,username,udid,Email,DPLink) {
  return new Promise(function (resolve, reject) {
    logger.log("Executing Query");
    sequelizeObjects.User.findAll({
      limit: 1,
      where: {email: Email},
    }).then(userObj => {
      logger.log("Executing Query1");
      if (userObj.length > 0) {
        sequelizeObjects.User.findAll({
          limit: 1,
          where: { udid: udid },
        }).then(userObj1 =>{
          if(userObj1.length>0){
          if(userObj1[0].email == userObj[0].email){
            resolve({result: true,reason:"ExactPlayer",user:userObj[0]});
          }else{
            resolve({result: false,reason:"DifferentUDID"});
          }
        }
        })
        logger.log("Executing Query2");
        if(userObj[0].udid == udid ||userObj[0].udid==""){
          if(userObj[0].udid==""){
            userObj[0].update({udid: udid}).then(() => {
            });
          }
          resolve({result: true,reason:"LoginSuccessfull",user:userObj[0]});
        }else{
          resolve({result: false,reason:"ALreadyLogedinanotherdevice"});
        }
      } else {
        logger.log("Executing Query3");
        sequelizeObjects.User.findAll({
          limit: 1,
          where: { udid: udid },
        }).then(user =>{
          if(user.length>0){
            logger.log("Executing Query4");
            resolve({result: false,reason:"DeviceidAlreadyExist"});
          }else{
            logger.log("Executing Query5");
            sequelizeObjects.User.create(
              {
                name: username,
                udid: udid,
                email: Email,
                profileImageLink:DPLink,
              }
            ).then((user) => {
              resolve({result: true,reason:"CreatedNewID",user:user});
            });
          }
        });
        
      }
    }).catch(()=>{
      logger.log("Error Executing QUERY");
    });
  });
}
exports.CreateGoogleLoginPromise = CreateGoogleLoginPromise;



/**
 * Create facebook login data
 * @param {Object} sequelizeObjects
 * @param {String} username
 * @param {String} playerID
 * @param {String} FBUserId
 * @param {String} FBDPLink
 * @returns {Promise<any>}
 * @constructor
 */
function VerifyFacebookPromise(sequelizeObjects,playerID,username,FBUserId,FBDPLink) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: {FbUserId: FBUserId},
    }).then(userObj => {
      if (userObj.length > 0) {
        resolve({result: false,reason:"UserAlreadyExist"});
      } else {
        sequelizeObjects.User.findAll({
          limit: 1,
          where: { id: playerID },
        }).then(user =>{
          if(user.length>0){
            user.update({FBUserId: FBUserId},
              {profileImageLink : FBDPLink},
              {name : username}
            ).then((user1)=>{
              resolve({result: true,reason:"PlayerUpdated",user:user1});
            });
          }else{
            resolve({result: true,reason:"PlayerNotFound"});
          }
        });
      }
    }).catch(()=>{
      logger.log("Error Executing QUERY");
    });
  });
}
exports.VerifyFacebookPromise = VerifyFacebookPromise;

/**
 * Create facebook login data
 * @param {Object} sequelizeObjects
 * @param {String} phoneNo
 * @returns {Promise<any>}
 * @constructor
 */
function VerifyPhonePromise(sequelizeObjects,phoneNo) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: {number: phoneNo},
    }).then(userObj => {
      if (userObj.length > 0) {
        resolve({result: false,reason:"PhoneNumberAlreadyExist"});
      } else {
        resolve({result: true,reason:"PhoneNumberNotFound"});
      }
    }).catch(()=>{
      logger.log("Error Executing QUERY");
    });
  });
}
exports.VerifyPhonePromise = VerifyPhonePromise;

/**
 * Create facebook login data
 * @param {Object} sequelizeObjects
 * @param {String} playerID
 * @param {String} phoneNo
 * @returns {Promise<any>}
 * @constructor
 */
function VerifiedPhonePromise(sequelizeObjects,playerID,phoneNo) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: {number: phoneNo},
    }).then(userObj => {
      if (userObj.length > 0) {
        resolve({result: false,reason:"UserAlreadyExist"});
      } else {
        sequelizeObjects.User.findAll({
          limit: 1,
          where: { id: playerID },
        }).then(user =>{
          if(user.length>0){
            user[0].update({number: phoneNo},
            ).then((user1)=>{
              resolve({result: true,reason:"PhoneNumberUpdated",user:user1});
            });
          }else{
            resolve({result: true,reason:"PlayerNotFound"});
          }
        });
      }
    }).catch(()=>{
      logger.log("Error Executing QUERY");
    });
  });
}
exports.VerifiedPhonePromise = VerifiedPhonePromise;

// /**
//  * Find user for login
//  * @param {Object} sequelizeObjects
//  * @param {String} username
//  * @param {String} password
//  * @returns {Promise<any>}
//  * @constructor
//  */
// function LoginPromise(sequelizeObjects, username, password) {
//   return new Promise(function (resolve, reject) {
//     sequelizeObjects.User.findAll({
//       limit: 1,
//       where: {name: username, password: password},
//     }).then(users => {
//       if (users.length > 0) {
//         resolve({result: true, username: users[0].name, password: users[0].password});
//       } else {
//         resolve({result: false, username: null, password: null});
//       }
//     });
//   });
// }

// exports.LoginPromise = LoginPromise;

/**
 * unity user for login
 * @param {Object} sequelizeObjects
 * @param {String} id
 * @param {String} udid
 * @returns {Promise<any>}
 * @constructor
 */
function UnityLoginPromise(sequelizeObjects, id, udid) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: {id: id}, 
    }).then( userData=>{
      logger.log("udid DB "+userData.udid+"  udid recieved  "+udid,logger.LOG_GREEN);
    });
    sequelizeObjects.User.findAll({
      limit: 1,
      where: {id: id, udid: udid}, 
    }).then(users => {
      if (users.length > 0) {
        resolve({result: true, id: users[0].id, udid:""});
      } else {
        resolve({result: false, id: "", udid: ""});
      }
    });
  });
}
exports.UnityLoginPromise = UnityLoginPromise;

/**
 * unity user for login
 * @param {Object} sequelizeObjects
 * @param {String} id
 * @param {String} dataType
 * @param {String} setValue
 * @returns {Promise<any>}
 * @constructor
 */
function UpadteUserData(sequelizeObjects, id, dataType,setValue) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: {id: id}, 
    }).then(users => {
      if (users.length > 0) {
        switch(dataType){
          case "insta": 
          users[0].update({InstaFollow:setValue}).then(returnUser=>{
            let newUser = returnUser;
            newUser.udid = "";
            resolve({result: true,reason:"InstaFollowUpdate",status:setValue, user: newUser});
          });
          break;
          case "facebook": 
          users[0].update({FacebookLike:setValue}).then(returnUser=>{
            let newUser = returnUser;
            newUser.udid = "";
            resolve({result: true,reason:"FacebookLikeUpdate",status:setValue, user: newUser});
          });
          break;
          case "rateUs": 
          users[0].update({RateUs:setValue}).then(returnUser=>{
            let newUser = returnUser;
            newUser.udid = "";
            resolve({result: true,reason:"RateUsUpdate",status:setValue, user: newUser});
          });
          break;
          case "twitter": 
          users[0].update({TwitterFollow:setValue}).then(returnUser=>{
            let newUser = returnUser;
            newUser.udid = "";
            resolve({result: true,reason:"TwitterFollowUpdate",status:setValue, user: newUser});
          });
          break;
          default:
            resolve({result: false,reason:"invalidtype", user: null});
            break;
        }
      } else {
        resolve({result: false,reason:"noUserExist"});
      }
    });
  });
}
exports.UpadteUserData = UpadteUserData;

/**
 * Gets user parameters to user object
 * @param {Object} sequelizeObjects
 * @param {String} username
 * @param {String} password
 * @returns {Promise<any>}
 * @constructor
 */
function GetLoggedInUserParametersPromise(sequelizeObjects, username, password) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: {name: username, password: password},
    }).then(users => {
      if (users.length > 0) {
        resolve({
          result: true,
          id: users[0].id,
          name: users[0].name,
          money: users[0].money,
          win_count: users[0].win_count,
          lose_count: users[0].lose_count
        });
      } else {
        resolve({result: false, id: null, name: null, money: null, win_count: null, lose_count: null});
      }
    });
  });
}

exports.GetLoggedInUserParametersPromise = GetLoggedInUserParametersPromise;


/**
 * Gets user parameters to user object unity
 * @param {Object} sequelizeObjects
 * @param {String} userid
 * @param {String} udid
 * @returns {Promise<any>}
 * @constructor
 */
function GetLoggedInUserParametersPromiseUnity(sequelizeObjects, userid, udid) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: { id: userid},
    }).then(users => {
      if (users.length > 0) {
        resolve({
          result: true,
          id: users[0].id,
          name: users[0].name,
          money: users[0].money,
          win_count: users[0].win_count,
          lose_count: users[0].lose_count,
          biggestHand : users[0].BiggestHand,
          biggestWalletEver :users[0].BiggestWalletEver,
          profileImageLink : users[0].profileImageLink,
          xp : users[0].xp,
          Level: users[0].Level
        });
        logger.log("BiggestHand value "+users[0].BiggestHand +"   ");
      } else {
        resolve({result: false, id: null, name: null, money: null, win_count: null, lose_count: null});
      }
    });
  });
}

exports.GetLoggedInUserParametersPromiseUnity = GetLoggedInUserParametersPromiseUnity;

/**
 * Update player name
 * @param {Object} sequelizeObjects
 * @param {Number} userId
 * @param {String} newName
 * @returns {Promise<any>}
 * @constructor
 */
function UpdatePlayerNamePromise(sequelizeObjects, userId, newName) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: {id: userId},
    }).then(obj => {
      if (obj.length > 0) {
        obj[0].update({name: newName}).then(() => {
          resolve({result: true});
        });
      } else {
        resolve({result: false});
      }
    });
  });
}

exports.UpdatePlayerNamePromise = UpdatePlayerNamePromise;


/**
 * Update player current funds/money
 * @param {Object} sequelizeObjects
 * @param {Number} userId
 * @param {Number} money
 * @returns {Promise<any>}
 * @constructor
 */
function UpdatePlayerMoneyPromise(sequelizeObjects, userId, money) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: {id: userId},
    }).then(obj => {
      
      if (obj.length > 0) {
        logger.log("BiggestWalletEver is less than money"+obj[0].money +"     "+ obj[0].BiggestWalletEver);
        if(Number(obj[0].money) > Number(obj[0].BiggestWalletEver)){
          logger.log("BiggestWalletEver is less than money");
          obj[0].update({money: parseInt(money),BiggestWalletEver:parseInt(money)}).then((obj1) => {
            if(obj1.BestCards != null && obj1.BestCards!=""){
              resolve({result: true, user: obj1,userCards:JSON.parse(obj1.BestCards)});
            } else{
              resolve({result: true, user: obj1,userCards:null});
            }
          });
        }else{
          obj[0].update({money: parseInt(money)}).then((obj1) => {
            if(obj1.BestCards != null && obj1.BestCards!=""){
              resolve({result: true, user: obj1,userCards:JSON.parse(obj1.BestCards)});
            } else{
              resolve({result: true, user: obj1,userCards:null});
            }
          });
        }
      } else {
        resolve({result: false});
      }
    });
  });
}

exports.UpdatePlayerMoneyPromise = UpdatePlayerMoneyPromise;


/**
 * Update player current funds/money
 * @param {Object} sequelizeObjects
 * @param {Number} userId
 * @param {Number} money
 * @returns {Promise<any>}
 * @constructor
 */
function UpdatePlayerbiggestHandPromise(sequelizeObjects, userId, money) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: {id: userId},
    }).then(obj => {
      if (obj.length > 0) {
          obj[0].update({BiggestHand: money}).then((obj1) => {
              resolve({result: true});
          });
      } else {
        resolve({result: false});
      }
    });
  });
}

exports.UpdatePlayerbiggestHandPromise = UpdatePlayerbiggestHandPromise;


/**
 * Increment player win count
 * notice that this also needs event emitter for front end notification
 * @param {Object} sequelizeObjects
 * @param {Object} eventEmitter
 * @param {Number} connectionId
 * @param {Number} userId
 * @param {Boolean} isWinStreak
 * @returns {Promise<any>}
 * @constructor
 */
function UpdatePlayerWinCountPromise(sequelizeObjects, eventEmitter, connectionId, userId, isWinStreak) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: {id: userId},
    }).then(obj => {
      if (obj.length > 0) {
        const incrementXp = (isWinStreak ? 200 : 100);
        obj[0].update({win_count: obj[0].win_count + 1, xp: obj[0].xp + incrementXp}).then(() => {
          resolve({result: true});
        }).then(() => {
          eventEmitter.emit('onXPGained', connectionId, incrementXp, 'you won the round.' + (isWinStreak === true ? ' (Win streak bonus)' : ''));
          resolve({result: true});
        });
      } else {
        resolve({result: false});
      }
    });
  });
}

exports.UpdatePlayerWinCountPromise = UpdatePlayerWinCountPromise;


/**
 * Decrement player win count
 * @param {Object} sequelizeObjects
 * @param {Number} userId
 * @returns {Promise<any>}
 * @constructor
 */
function UpdatePlayerLoseCountPromise(sequelizeObjects, userId) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: {id: userId},
    }).then(obj => {
      if (obj.length > 0) {
        obj[0].update({lose_count: obj[0].lose_count + 1}).then(() => {
          resolve({result: true});
        });
      } else {
        resolve({result: false});
      }
    });
  });
}

exports.UpdatePlayerLoseCountPromise = UpdatePlayerLoseCountPromise;


/**
 * Decrement player win count
 * @param {Object} sequelizeObjects
 * @param {Number} userId
 * @param {string} foldState
 * @returns {Promise<any>}
 * @constructor
 */
function UpdatePlayerFoldStatePromise(sequelizeObjects, userId, foldState) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: {id: userId},
    }).then(obj => {
      if (obj.length > 0) {
        if(foldState == "PREFLOP"){
          obj[0].update({pre_flop: +obj[0].pre_flop + +1}).then(() => {
            resolve({result: true});
          });
        }else if(foldState == "FLOP"){
          obj[0].update({flop: +obj[0].flop + +1}).then(() => {
            resolve({result: true});
          });
        }else if(foldState == "TURN"){
          obj[0].update({turn: +obj[0].turn + +1}).then(() => {
            resolve({result: true});
          });
        }else if(foldState == "RIVER"){
          obj[0].update({river: +obj[0].river + +1}).then(() => {
            resolve({result: true});
          });
        }
      } else {
        reject({result: false});
      }
    });
  });
}

exports.UpdatePlayerFoldStatePromise = UpdatePlayerFoldStatePromise;


/**
 * Insert statistic line for own dedicated table
 * @param {Object} sequelizeObjects
 * @param {Number} userId
 * @param {Number} money
 * @param {Number} win_count
 * @param {Number} lose_count
 * @returns {Promise<any>}
 * @constructor
 */
function InsertPlayerStatisticPromise(sequelizeObjects, userId, money, win_count, lose_count) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.Statistic.create(
      {
        user_id: userId,
        money: money,
        win_count: win_count,
        lose_count: lose_count,
      }
    ).then(() => {
      resolve({result: true});
    }).catch(error => {
      reject(error);
    });
  });
}

exports.InsertPlayerStatisticPromise = InsertPlayerStatisticPromise;


/**
 * User saw rewarding ad, increment money, ad count, xp
 * TODO: Needs validation implementation, user can call this method as cheat without checks for validity
 * @param {Object} sequelizeObjects
 * @param {Number} userId
 * @returns {Promise<any>}
 * @constructor
 */
function UpdatePlayerRewardingAdShownPromise(sequelizeObjects, userId) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: {id: userId},
    }).then(obj => {
      if (obj.length > 0) {
        obj[0].update({
          money: Number(obj[0].money) + 2000, // Increment money
          rew_ad_count: Number(obj[0].rew_ad_count) + 1,
          xp: Number(obj[0].xp) + 100 // Increment xp
        }).then(() => {
          resolve({result: true});
        });
      } else {
        resolve({result: false});
      }
    });
  });
}

exports.UpdatePlayerRewardingAdShownPromise = UpdatePlayerRewardingAdShownPromise;


/**
 * Get user statistics for front end ui
 * or any other use case
 * @param {Object} sequelizeObjects
 * @param {Number} userId
 * @returns {Promise<any>}
 * @constructor
 */
function GetLoggedInUserStatisticsPromise(sequelizeObjects, userId) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: {id: userId},
    }).then(users => {
      if (users.length > 0) {
        resolve({
          result: true,
          id: users[0].id,
          name: users[0].name,
          money: users[0].money,
          win_count: users[0].win_count,
          lose_count: users[0].lose_count,
          xp: users[0].xp,
        });
      } else {
        resolve({result: false, id: null, name: null, money: null, win_count: null, lose_count: null, xp: null});
      }
    });
  });
}

exports.GetLoggedInUserStatisticsPromise = GetLoggedInUserStatisticsPromise;


/**
 * Get all user ranks for viewing purposes
 * limited by 50 results, order by xp desc
 * @param {Object} sequelizeObjects
 * @returns {Promise<any>}
 * @constructor
 */
function GetRankingsPromise(sequelizeObjects) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      raw: true, // raw array of results
      limit: 50,
      attributes: ['name', 'xp', 'win_count', 'lose_count'],
      // where: {id: {[Op.notIn]: [1, 2, 3]}},
      order: [
        ['xp', 'DESC'],
      ],
    }).then(userObj => {
      if (userObj.length > 0) {
        resolve({result: true, ranks: userObj});
      } else {
        resolve({result: false})
      }
    });
  });
}

exports.GetRankingsPromise = GetRankingsPromise;

/**
 * Get player chart statistic data for chart viewing
 * @param {Object} sequelizeObjects
 * @param {Number} userId
 * @returns {Promise<any>}
 * @constructor
 */
function GetPlayerInfoPromise(sequelizeObjects,userId) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      raw: true, // raw array of results
      limit: 1,
      where: {id: userId},
    }).then(userObj => {
      if (userObj.length > 0) {
        if(userObj[0].BestCards != null && userObj[0].BestCards!=""){
          resolve({result: true, user: userObj[0],userCards:JSON.parse(userObj[0].BestCards)});
        } else{
          resolve({result: true, user: userObj[0],userCards:null});
        }
      } else {
        resolve({result: false})
      }
    });
  });
}
exports.GetPlayerInfoPromise = GetPlayerInfoPromise;
/**
 * Get player chart statistic data for chart viewing
 * @param {Object} sequelizeObjects
 * @param {Number} userId
 * @returns {Promise<any>}
 * @constructor
 */
function GetPlayerChartDataPromise(sequelizeObjects, userId) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.Statistic.findAll({
      raw: true, // raw array of results
      limit: 150,
      attributes: ['money', 'win_count', 'lose_count'],
      where: {user_id: userId},
      order: [
        ['id', 'DESC'],
      ],
    }).then(ranks => {
      if (ranks.length > 0) {
        // select result must be reversed but not by id asc, that causes old data,
        // desc brings new data but in wrong order .reverse() array fixes this
        resolve({result: true, ranks: ranks.reverse()});
      } else {
        resolve({result: false, ranks: []})
      }
    });
  });
}
exports.GetPlayerChartDataPromise = GetPlayerChartDataPromise;

/**
* Create new user if not exists
* @param {Object} sequelizeObjects
* @param {String} playerId
* @returns {Promise<any>}
* @constructor
*/
function SpinGetPromise(sequelizeObjects, playerId) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.UserGameStats.findAll({
      limit: 1,
      where: { PlayerId: playerId },
    }).then(returnObj => {
      if (returnObj.length > 0) {
        let normalSpinnerLastTime = moment(returnObj[0].NormalSpinnerLastTime, 'YYYY-MM-DD HH:mm:ss').unix();
        let currentTime = Math.floor(Date.now() / 1000);
        let spinnercount = parseInt(returnObj[0].SpinnerInfo, 10) || 0;  // Get SpinnerInfo (spin count), default to 0 if undefined

        // If SpinnerInfo (spin count) is greater than 0, decrement it by 1
        if (spinnercount > 0) {
          spinnercount -= 1;

          returnObj[0].update({
            SpinnerInfo: spinnercount.toString(),  // Update SpinnerInfo in the database
          }).then(result => {
            resolve({
              result: true,
              purchaseSpinner: false,  // Purchase spinner condition doesn't change here
              spinnerCount: spinnercount,  // Return the updated spin count
              SpinnerInfo: result,  // Return the updated user game stats
            });
          }).catch(reject);
        } else {
          // Original logic for time-based spinner usage if spin count is less than or equal to 0
          if (normalSpinnerLastTime <= currentTime) {
            returnObj[0].update({
              NormalSpinnerLastTime: Date.now() + 10800000,  // Set the next available spin time (3 hours in future)
            }).then(result => {
              if (moment(returnObj[0].PurchaseSpinnerLastTime, 'YYYY-MM-DD HH:mm:ss').unix() <= currentTime) {
                resolve({
                  result: true,
                  purchaseSpinner: true,
                  spinnercount:0,
                  SpinnerInfo: result,  // Pass the result object
                });
              } else {
                resolve({
                  result: true,
                  purchaseSpinner: false,
                  spinnercount:0,
                  SpinnerInfo: result,  // Pass the result object
                });
              }
            }).catch(reject);
          } else {
            resolve({
              result: false,
              remainingTime: normalSpinnerLastTime - currentTime, 
              spinnercount:0,
              SpinnerInfo: returnObj[0],  // Pass the user game stats
            });
          }
        }
      } else {
        // If the player's stats do not exist, create a new entry
        sequelizeObjects.UserGameStats.create({
          PlayerId: playerId,
          NormalSpinnerLastTime: Date.now(),
          PurchaseSpinnerLastTime: Date.now(),
          totalXP: 0,
          XPNextLevel: 0,
          XPPrevLevel: 0,
          SpinnerInfo: '0',  // Initialize SpinnerInfo as '0'
        }).then(playerCreated => {
          resolve({
            result: true,
            SpecialSpinnerAvailable: true,
            spinnercount:0,
            SpinnerInfo: playerCreated,  // Pass the created player object
          });
        }).catch(reject);
      }
    }).catch(reject);
  });
}

exports.SpinGetPromise = SpinGetPromise;


/**
* R$eturn user all details of gifts
* @param {Object} sequelizeObjects
* @returns {Promise<any>}
* @constructor
*/
function GetAllGiftsPromise(sequelizeObjects) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.Gifts.findAll({
      where: {Enabled: "true"},
    }).then(returnObj => {
      if (returnObj.length > 0) {
        resolve({result: true,GiftsInfo :returnObj});
      } else {
        resolve({result: true,GiftsInfo :null});
      }
    });
  });
}
exports.GetAllGiftsPromise = GetAllGiftsPromise;
function GetDailyChallenges(sequelizeObjects,userId) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.UserChallenge.findAll({where:{userId:userId}}).then(returnObj => {
      if (returnObj.length > 0) {
        resolve({result: true,UserChallenges :returnObj});
      } else {
        resolve({result: true,challengesInfo :null});
      }
    });
  });
}
exports.GetDailyChallenges = GetDailyChallenges;
//SpinGetPurchasePromise

/**
 * Create new user if not exists
 * @param {Object} sequelizeObjects
 * @param {String} playerId
 * @returns {Promise<any>}
 * @constructor
 */
function SpinGetPurchasePromise(sequelizeObjects, playerId) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.UserGameStats.findAll({
      limit: 1,
      where: {PlayerId: playerId},
    }).then(returnObj => {
      if (returnObj.length > 0) {  
        let x = moment(returnObj[0].PurchaseSpinnerLastTime, 'YYYY-MM-DD HH:mm:ss').unix();
        let y = Math.floor(Date.now()/1000);
        if(x<=y){
          returnObj[0].update({PurchaseSpinnerLastTime:Date.now()+86400000}).then((result)=> {
            //let x = new DATE()
            logger.log(y,logger.LOG_UNDERSCORE);
            resolve({result: true,SpinnerInfo :result});
          });
        }else{
          logger.log(y,logger.LOG_UNDERSCORE);
          let z = -1;
          z= y-x;
          resolve({result: false,remainingTime:z,SpinnerInfo :returnObj[0]});
        }
      }
    });
  });
}

exports.SpinGetPurchasePromise = SpinGetPurchasePromise;

/**
* Create new user if not exists
* @param {Object} sequelizeObjects
* @param {String} playerId
* @returns {Promise<any>}
* @constructor
*/
function GetSpinnerStatusPromise(sequelizeObjects, playerId) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.UserGameStats.findAll({
      limit: 1,
      where: { PlayerId: playerId },
    }).then(returnObj => {
      if (returnObj.length > 0) {
        let normalSpinnerLastTime = moment(returnObj[0].NormalSpinnerLastTime, 'YYYY-MM-DD HH:mm:ss').unix();
        let purchaseSpinnerLastTime = moment(returnObj[0].PurchaseSpinnerLastTime, 'YYYY-MM-DD HH:mm:ss').unix();
        let currentTime = Math.floor(Date.now() / 1000);
        let spinnercount = parseInt(returnObj[0].SpinnerInfo, 10) || 0; // Get spin count from SpinnerInfo, default to 0 if undefined

        // If SpinnerInfo (spin count) is greater than 0
        if (spinnercount > 0) {
          if (normalSpinnerLastTime <= currentTime) {
          resolve({
            simpleSpinner: true,
            purchaseSpinner: purchaseSpinnerLastTime <= currentTime,
            spinnercount: spinnercount+1,
            SpinnerInfo:0  // Return current spin count without decrementing it
          });
          } else {
            resolve({
              simpleSpinner: true,
              purchaseSpinner: purchaseSpinnerLastTime <= currentTime,
              spinnercount: spinnercount,
              SpinnerInfo:0  // Return current spin count without decrementing it
            });
          }
        } else {
          // Original time-based spinner logic
          if (normalSpinnerLastTime <= currentTime) {
            if (purchaseSpinnerLastTime <= currentTime) {
              resolve({ simpleSpinner: true, purchaseSpinner: true,spinnercount:1, SpinnerInfo: 0 });
            } else {
              resolve({ simpleSpinner: true, purchaseSpinner: false,spinnercount:1, SpinnerInfo: 0 });
            }
          } else {
            if (purchaseSpinnerLastTime <= currentTime) {
              resolve({
                simpleSpinner: false,
                purchaseSpinner: true,
                spinnercount:0,
                SpinnerInfo: currentTime - normalSpinnerLastTime
              });
            } else {
              resolve({
                simpleSpinner: false,
                purchaseSpinner: false,
                spinnercount:0,
                SpinnerInfo: currentTime - normalSpinnerLastTime
              });
            }
          }
        }
      } else {
        // Create a new entry if no stats exist for the player
        sequelizeObjects.UserGameStats.create({
          PlayerId: playerId,
          NormalSpinnerLastTime: Date.now() - 28800000,  // Default to 8 hours ago
          PurchaseSpinnerLastTime: Date.now() - 86400000,  // Default to 24 hours ago
          totalXP: 0,
          XPNextLevel: 0,
          XPPrevLevel: 0,
          SpinnerInfo: '0',  // Initializing SpinnerInfo as '0'
        }).then(() => {
          resolve({ simpleSpinner: true, purchaseSpinner: true,spinnercount:1, SpinnerInfo: 0 });
        }).catch(reject);
      }
    }).catch(reject);
  });
}

exports.GetSpinnerStatusPromise = GetSpinnerStatusPromise;
function handleQueriesPromise(sequelizeObjects, userId, fullname, email, phone, message) {
  return new Promise(async function (resolve, reject) {
    try {
      // Create the query entry in HandleQueries
      await sequelizeObjects.HandleQueries.create({
        userId: userId,
        fullname: fullname,
        phone: phone,
        email: email,
        message: message
      });
      resolve({ result: true });
    } catch (error) {
      console.error('Error handling query:', error);
      reject({ result: false, error: error.message });
    }
  });
}

exports.handleQueriesPromise = handleQueriesPromise;

function handleReportpromise(sequelizeObjects, playerId,toReportplayerId,Reportfilter,email,message) {
  return new Promise(async function (resolve, reject) {
    try{
      await sequelizeObjects.Reports.create(
      {
        userId: playerId,
        ReportedId: toReportplayerId,
        ReportFilter: Reportfilter,
        email: email,
        message: message
      }
    )

    resolve({ result: true });
  } catch (error) {
    console.error('Error handling query:', error);
    reject({ result: false, error: error.message });
  }
});
} 

exports.handleReportpromise = handleReportpromise;


function handleUserLogpromise(sequelizeObjects, playerId,timeSpend,timeSpendFormatted,sessionStart,sessionEnd) {
  try{
  return new Promise(function (resolve, reject) {
    sequelizeObjects.UserLog.create(
      {
        userId: playerId,
        time_spend: timeSpend,
        time_spend_formated: timeSpendFormatted,
        session_start: sessionStart,
        session_end: sessionEnd
      }
    ).then(() => {
          resolve({result: true});
    })
  })
}catch(e){
  logger.log(e,logger.LOG_ERROR);
}
} 

exports.handleUserLogpromise = handleUserLogpromise;

function handleInAppPurchasePromise(sequelizeObjects, playerId,productId,productprice) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.InAppPurchase.create(
      {
        userId: playerId,
        productID: productId,
        productPrice: productprice
      }
    ).then(() => {
          resolve({result: true});
    })
  })
}
exports.handleInAppPurchasePromise = handleInAppPurchasePromise;