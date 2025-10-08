/**
 * Notification Service
 * Handles all push notification functionality including scheduling, sending, and management
 */

const { Op } = require('sequelize');
const { PlayerCardsUpdate } = require('../database/dbUtils');

class NotificationService {
  constructor(sequelizeObjects, admin, logger) {
    this.sequelizeObjects = sequelizeObjects;
    this.admin = admin;
    this.logger = logger;
    
    // In-memory map of scheduled timeouts by Notification.id
    this.scheduledNotificationTimeouts = new Map();
    
    // Engagement notification messages for all users
    this.engagementMessages = [
      {
        title: "🃏 Poker Time!",
        body: "Join a table and show off your poker skills!"
      },
      {
        title: "🏆 New Challenges Await!",
        body: "Complete challenges and earn exclusive rewards!"
      },
      {
        title: "🎲 Lucky Day!",
        body: "Your luck is at its peak - come play and win big!"
      },
      {
        title: "🌟 Community Challenge!",
        body: "Join forces with other players for epic community rewards!"
      },
      {
        title: "🎈 Welcome Back!",
        body: "We missed you! Come back and enjoy the fun!"
      }
    ];
    
    // Timer values loaded from database
    this.engagementTime = 12 * 60 * 60 * 1000; // Default 12 hours in milliseconds
    this.offlineUserTime = 36 * 60 * 60 * 1000; // Default 36 hours in milliseconds
    this.checkingTime = 6 * 60 * 60 * 1000; // Default 6 hours in milliseconds
    
    // Schedule engagement notifications every 2 hours
    this.engagementNotificationInterval = null;
    
    // Event notification monitoring
    this.eventNotificationInterval = null;
    
    // Inactive user monitoring
    this.inactiveUserInterval = null;
    
    // Scheduled notification monitoring (database polling)
    this.scheduledNotificationInterval = null;
    
    // Track users who have already received re-engagement notifications with timestamps
    this.notifiedInactiveUsers = [];
  }

  /**
   * Load notification timer values from database
   */
  async loadNotificationTimers() {
    try {
      if (!this.sequelizeObjects || !this.sequelizeObjects.NotificationTimer) {
        this.logger.log('NotificationTimer model not available, using default values');
        return;
      }

      const { NotificationTimer } = this.sequelizeObjects;
      
      // Get the first (and should be only) timer configuration
      let timerConfig = await NotificationTimer.findOne();
      
      if (!timerConfig) {
        // Create default timer configuration if none exists
        timerConfig = await NotificationTimer.create({
          engagementTime: 12 * 60 * 60 * 1000, // 12 hours in milliseconds
          offlineUserTime: 36 * 60 * 60 * 1000, // 36 hours in milliseconds
          checkingTime: 6 * 60 * 60 * 1000 // 6 hours in milliseconds
        });
        this.logger.log('Created default notification timer configuration');
      }

      this.engagementTime = timerConfig.engagementTime;
      this.offlineUserTime = timerConfig.offlineUserTime;
      this.checkingTime = timerConfig.checkingTime;
      
      this.logger.log(`Loaded notification timers - Engagement: ${this.engagementTime}ms, Offline User: ${this.offlineUserTime}ms, Checking: ${this.checkingTime}ms`);
    } catch (err) {
      this.logger.log(`Error loading notification timers: ${err && err.message ? err.message : err}`);
    }
  }

  /**
   * Update notification timer values in database
   */
  async updateNotificationTimers(engagementTime, offlineUserTime, checkingTime) {
    try {
      if (!this.sequelizeObjects || !this.sequelizeObjects.NotificationTimer) {
        this.logger.log('NotificationTimer model not available');
        return false;
      }

      const { NotificationTimer } = this.sequelizeObjects;
      
      // Get the first (and should be only) timer configuration
      let timerConfig = await NotificationTimer.findOne();
      
      if (!timerConfig) {
        // Create new timer configuration
        timerConfig = await NotificationTimer.create({
          engagementTime: engagementTime,
          offlineUserTime: offlineUserTime,
          checkingTime: checkingTime
        });
        this.logger.log('Created new notification timer configuration');
      } else {
        // Update existing configuration
        await timerConfig.update({
          engagementTime: engagementTime,
          offlineUserTime: offlineUserTime,
          checkingTime: checkingTime
        });
        this.logger.log('Updated notification timer configuration');
      }

      // Update in-memory values
      this.engagementTime = engagementTime;
      this.offlineUserTime = offlineUserTime;
      this.checkingTime = checkingTime;
      
      this.logger.log(`Updated notification timers - Engagement: ${this.engagementTime}ms, Offline User: ${this.offlineUserTime}ms, Checking: ${this.checkingTime}ms`);
      return true;
    } catch (err) {
      this.logger.log(`Error updating notification timers: ${err && err.message ? err.message : err}`);
      return false;
    }
  }

  /**
   * Send engagement notification to all users
   */
  async sendEngagementNotification() {
    try {
      if (!this.sequelizeObjects) {
        this.logger.log('Engagement notification: sequelizeObjects not ready');
        return;
      }

      // Pick a random message
      const randomMessage = this.engagementMessages[Math.floor(Math.random() * this.engagementMessages.length)];
      
      this.logger.log(`Sending engagement notification: "${randomMessage.title}" to all users`);

      // Get all users with Firebase tokens
      const { UserFeature } = this.sequelizeObjects;
      const tokens = await UserFeature.findAll({ 
        where: { firebaseToken: { [Op.ne]: null } }, 
        attributes: ['firebaseToken','userId'], 
        raw: true 
      });

      if (!tokens || tokens.length === 0) {
        this.logger.log('Engagement notification: No tokens found for any users');
        return;
      }

      this.logger.log(`Engagement notification: sending to ${tokens.length} users`);

      const baseMessage = {
        notification: {
          title: randomMessage.title,
          body: randomMessage.body
        }
      };

      // Send to all users
      const sends = tokens.map(t => {
        const msg = { ...baseMessage, token: t.firebaseToken };
        return this.admin.messaging().send(msg)
          .then((resp) => {
            this.logger.log(`Engagement notification success: userId=${t.userId}, tokenTail=${(t.firebaseToken || '').slice(-8)}, messageId=${resp}`);
          })
          .catch((err) => {
            this.logger.log(`Engagement notification error: userId=${t.userId}, tokenTail=${(t.firebaseToken || '').slice(-8)}, error=${err && err.message ? err.message : err}`);
          });
      });

      await Promise.allSettled(sends);
      this.logger.log(`Engagement notification completed: "${randomMessage.title}"`);

    } catch (err) {
      this.logger.log(`Engagement notification error: ${err && err.message ? err.message : err}`);
    }
  }

  /**
   * Start engagement notification scheduler
   */
  async startEngagementNotifications() {
    try {
      // Prevent starting multiple intervals
      if (this.engagementNotificationInterval) {
        this.logger.log('Engagement notification system already running, skipping start');
        return;
      }
      
      // Load timer values from database first
      await this.loadNotificationTimers();
      
      // Send first notification immediately (for testing)
      this.logger.log('Starting engagement notification system...');
      
      // Send immediately
      this.sendEngagementNotification();
      
      // Then schedule using database value
      this.engagementNotificationInterval = setInterval(async () => {
        try {
          await this.sendEngagementNotification();
        } catch (err) {
          this.logger.log(`Error in engagement notification interval: ${err.message}`);
        }
      }, this.engagementTime); // Use database value

      this.logger.log(`Engagement notification system started (interval: ${this.engagementTime}ms)`);
    } catch (err) {
      this.logger.log(`startEngagementNotifications error: ${err && err.message ? err.message : err}`);
    }
  }

  /**
   * Stop engagement notification scheduler
   */
  stopEngagementNotifications() {
    if (this.engagementNotificationInterval) {
      clearInterval(this.engagementNotificationInterval);
      this.engagementNotificationInterval = null;
      this.logger.log('Engagement notification system stopped');
    }
  }

  /**
   * Check database for ready scheduled notifications
   */
  async checkScheduledNotifications() {
    try {
      if (!this.sequelizeObjects) return;
      
      // Find notifications that are due to be sent
      const readyNotifications = await this.sequelizeObjects.Notification.findAll({
        where: {
          sent: false,
          scheduledAt: {
            [Op.lte]: new Date() // scheduledAt <= now
          }
        },
        raw: true
      });

      if (readyNotifications.length > 0) {
        this.logger.log(`Found ${readyNotifications.length} ready notifications to send`);
        
        // Send each ready notification
        for (let i = 0; i < readyNotifications.length; i++) {
          const notification = readyNotifications[i];
          try {
            this.logger.log(`Sending ready notification: ID=${notification.id}, title="${notification.title}", userId=${notification.userId}`);
            await this.sendNotification(notification);
          } catch (err) {
            this.logger.log(`Error sending ready notification ID=${notification.id}: ${err && err.message ? err.message : err}`);
          }
        }
      }
    } catch (err) {
      this.logger.log(`Error checking scheduled notifications: ${err && err.message ? err.message : err}`);
    }
  }

  /**
   * Start scheduled notification monitoring (database polling)
   */
  startScheduledNotificationMonitoring() {
    try {
      // Prevent starting multiple intervals
      if (this.scheduledNotificationInterval) {
        this.logger.log('Scheduled notification monitoring already running, skipping start');
        return;
      }
      
      this.logger.log('Starting scheduled notification monitoring...');
      
      // Check every 30 seconds for ready notifications
      this.scheduledNotificationInterval = setInterval(async () => {
        try {
          await this.checkScheduledNotifications();
        } catch (err) {
          this.logger.log(`Error in scheduled notification monitoring interval: ${err.message}`);
        }
      }, 30000); // Check every 30 seconds

      this.logger.log('Scheduled notification monitoring started (checking every 30 seconds)');
    } catch (err) {
      this.logger.log(`Error starting scheduled notification monitoring: ${err && err.message ? err.message : err}`);
    }
  }

  /**
   * Stop scheduled notification monitoring
   */
  stopScheduledNotificationMonitoring() {
    if (this.scheduledNotificationInterval) {
      clearInterval(this.scheduledNotificationInterval);
      this.scheduledNotificationInterval = null;
      this.logger.log('Scheduled notification monitoring stopped');
    }
  }

  /**
   * Process pending notifications on startup
   */
  async processNotifications() {
    try {
      if (!this.sequelizeObjects) return;
      
      // Load overdue notifications and send them immediately
      const overdue = await this.sequelizeObjects.Notification.findAll({
        where: {
          sent: false,
          scheduledAt: {
            [Op.lt]: new Date()
          }
        },
        raw: true
      });

      for (let i = 0; i < overdue.length; i++) {
        const notification = overdue[i];
        this.logger.log(`Processing overdue notification: ${notification.id}, title: "${notification.title}"`);
        await this.sendNotification(notification);
      }

      // Load pending notifications and schedule them
      const pending = await this.sequelizeObjects.Notification.findAll({ 
        where: { sent: false }, 
        raw: true 
      });
      
      const now = Date.now();
      for (let i = 0; i < pending.length; i++) {
        const n = pending[i];
        const when = new Date(n.scheduledAt).getTime();
        if (when <= now) {
          // Due - send immediately (async, without blocking loop)
          this.sendNotification(n);
        } else {
          this.scheduleNotificationInMemory(n);
        }
      }
      
      this.logger.log(`processNotifications loaded=${pending.length}`);
    } catch (err) {
      this.logger.log(`processNotifications error: ${err && err.message ? err.message : err}`);
    }
  }

  /**
   * Send a notification record (handles different notification types)
   */
  async sendNotification(notificationRecord) {
    try {
      if (!this.sequelizeObjects) {
        throw new Error('Sequelize not initialized');
      }
      
      const title = notificationRecord.title || 'Wawe Poker Face';
      const body = notificationRecord.body || 'Your spinner is ready! Come back and play.';
      const userId = notificationRecord.userId;
      const notificationType = notificationRecord.notificationType || 'me';
      
      // Get token from UserFeature model for personal notifications
      let token = null;
      if (notificationType === 'me' && userId) {
        try {
          const { UserFeature } = this.sequelizeObjects;
          const userFeature = await UserFeature.findOne({ 
            where: { userId: userId }, 
            attributes: ['firebaseToken'], 
            raw: true 
          });
          if (userFeature && userFeature.firebaseToken) {
            token = userFeature.firebaseToken;
          } else {
            this.logger.log(`No token found for userId=${userId} in UserFeature model`);
            return;
          }
        } catch (tokenErr) {
          this.logger.log(`Error fetching token for userId=${userId}: ${tokenErr && tokenErr.message ? tokenErr.message : tokenErr}`);
          return;
        }
      }

      const baseMessage = {
        notification: {
          title: title,
          body: body
        }
      };

      this.logger.log(`Sending notification type: ${notificationType}, userId: ${userId || 'N/A'}, title: "${title}"`);

      if (notificationType === 'friend') {
        await this.sendFriendNotification(userId, baseMessage);
      } else if (notificationType === 'public') {
        await this.sendPublicNotification(baseMessage);
      } else {
        // Default: send to the single provided token (notificationType === 'me')
        await this.sendPersonalNotification(token, baseMessage);
      }

      // Mark notification as sent, then remove from table
      try {
        await this.sequelizeObjects.Notification.update({ sent: true }, { where: { id: notificationRecord.id } });
      } catch (updErr) {
        this.logger.log(`Mark sent update error for notificationId=${notificationRecord.id}: ${updErr && updErr.message ? updErr.message : updErr}`);
      }
      try {
        await this.sequelizeObjects.Notification.destroy({ where: { id: notificationRecord.id } });
      } catch (delErr) {
        this.logger.log(`Delete sent notification error for notificationId=${notificationRecord.id}: ${delErr && delErr.message ? delErr.message : delErr}`);
      }
    } catch (err) {
      this.logger.log(`sendNotification error: ${err && err.message ? err.message : err}`);
    }
  }

  /**
   * Send notification to friends of a user
   */
  async sendFriendNotification(userId, baseMessage) {
    try {
      this.logger.log(`Friend notification requested for userId=${userId}. Loading friends and tokens...`);
      const { Friends, UserFeature } = this.sequelizeObjects;
      const friendRows = [];
      const f1 = Friends.findAll({ where: { idMyPlayer: userId, FriendStatus: 'Accept' }, raw: true });
      const f2 = Friends.findAll({ where: { idOtherPlayer: userId, FriendStatus: 'Accept' }, raw: true });
      const [a, b] = await Promise.all([f1, f2]);
      for (let i = 0; i < a.length; i++) friendRows.push(a[i]);
      for (let i = 0; i < b.length; i++) friendRows.push(b[i]);
      const uid = Number(userId);
      const friendIds = Array.from(new Set(
        friendRows.map(r => (Number(r.idMyPlayer) === uid ? Number(r.idOtherPlayer) : Number(r.idMyPlayer)))
      )).filter(fid => Number.isFinite(fid) && fid !== uid);
      
      if (friendIds.length === 0) {
        this.logger.log(`Friend notification: userId=${userId} has no accepted friends. Skipping fan-out.`);
      } else {
        const tokens = await UserFeature.findAll({ where: { userId: { [Op.in]: friendIds } }, attributes: ['firebaseToken','userId'], raw: true });
        if (!tokens || tokens.length === 0) {
          this.logger.log(`Friend notification: No tokens found for friends of userId=${userId}. friendIds=${JSON.stringify(friendIds)}`);
        } else {
          // Normalize types before comparison to avoid false negatives (e.g., '27' vs 27)
          const tokenUserIdSet = new Set(tokens
            .map(t => Number(t.userId))
            .filter(n => Number.isFinite(n))
          );
          const missingTokenFor = friendIds.filter(fid => !tokenUserIdSet.has(Number(fid)));
          this.logger.log(`Friend notification: sending to ${tokens.length} tokens for ${tokenUserIdSet.size} friends (userIds=${JSON.stringify(Array.from(tokenUserIdSet))}). Missing tokens for userIds=${JSON.stringify(missingTokenFor)}.`);
          const sends = tokens.map(t => {
            const msg = { ...baseMessage, token: t.firebaseToken };
            return this.admin.messaging().send(msg)
              .then((resp) => {
                this.logger.log(`Friend notification success: userId=${t.userId}, tokenTail=${(t.firebaseToken || '').slice(-8)}, messageId=${resp}`);
              })
              .catch((err) => {
                this.logger.log(`Friend notification error: userId=${t.userId}, tokenTail=${(t.firebaseToken || '').slice(-8)}, error=${err && err.message ? err.message : err}`);
              });
          });
          await Promise.allSettled(sends);
        }
      }
    } catch (friendErr) {
      this.logger.log(`Friend notification error: ${friendErr && friendErr.message ? friendErr.message : friendErr}`);
    }
  }

  /**
   * Send notification to all users
   */
  async sendPublicNotification(baseMessage) {
    try {
      this.logger.log(`Public notification requested. Loading all user tokens...`);
      const { UserFeature } = this.sequelizeObjects;
      const tokens = await UserFeature.findAll({ 
        where: { firebaseToken: { [Op.ne]: null } }, 
        attributes: ['firebaseToken','userId'], 
        raw: true 
      });
      if (!tokens || tokens.length === 0) {
        this.logger.log(`Public notification: No tokens found for any users.`);
      } else {
        this.logger.log(`Public notification: sending to ${tokens.length} users`);
        const sends = tokens.map(t => {
          const msg = { ...baseMessage, token: t.firebaseToken };
          return this.admin.messaging().send(msg)
            .then((resp) => {
              this.logger.log(`Public notification success: userId=${t.userId}, tokenTail=${(t.firebaseToken || '').slice(-8)}, messageId=${resp}`);
            })
            .catch((err) => {
              this.logger.log(`Public notification error: userId=${t.userId}, tokenTail=${(t.firebaseToken || '').slice(-8)}, error=${err && err.message ? err.message : err}`);
            });
        });
        await Promise.allSettled(sends);
      }
    } catch (publicErr) {
      this.logger.log(`Public notification error: ${publicErr && publicErr.message ? publicErr.message : publicErr}`);
    }
  }

  /**
   * Send personal notification to a single user
   */
  async sendPersonalNotification(token, baseMessage) {
    const singleMessage = { ...baseMessage, token: token };
    try {
      this.logger.log(`Personal notification: title=${singleMessage.notification.title}, bodyLen=${(singleMessage.notification.body || '').length}, tokenTail=${(token || '').slice(-8)}`);
    } catch (e) {}
    try {
      const response = await this.admin.messaging().send(singleMessage);
      this.logger.log(`Personal notification success: messageId=${response}`);
    } catch (error) {
      this.logger.log(`Personal notification error: ${error && error.message ? error.message : error}`);
      // Do not mark as sent on failure
      return;
    }
  }

  /**
   * Schedule a notification record in-memory
   */
  scheduleNotificationInMemory(notificationRecord) {
    const now = Date.now();
    const when = new Date(notificationRecord.scheduledAt).getTime();
    const delay = Math.max(0, when - now);
    
    this.logger.log(`Scheduling push: in ${delay}ms, title=${notificationRecord.title || 'Wawe Poker Face'}, userId=${notificationRecord.userId || 'n/a'}, id=${notificationRecord.id}`);
    
    const timeoutId = setTimeout(async () => {
      try {
        this.logger.log(`Timeout fired for notification ID: ${notificationRecord.id}, title: "${notificationRecord.title}"`);
        this.scheduledNotificationTimeouts.delete(notificationRecord.id);
        await this.sendNotification(notificationRecord);
      } catch (err) {
        this.logger.log(`Error in scheduled notification timeout: ${err.message}`);
      }
    }, delay);
    
    this.scheduledNotificationTimeouts.set(notificationRecord.id, timeoutId);
    this.logger.log(`Scheduled timeout ID: ${timeoutId} for notification ID: ${notificationRecord.id}`);
  }

  /**
   * Public API: persist and schedule notification
   */
  async sendNotificationAfterDelay(delayMs, title, body, userId, notificationType = 'me') {
    try {
      if (!this.sequelizeObjects) {
        // Fallback: schedule in memory only if DB not ready (should be rare)
        const scheduledAt = new Date(Date.now() + (Number(delayMs) || 0));
        this.scheduleNotificationInMemory({ id: `mem-${scheduledAt.getTime()}-${Math.random()}`, title, body, userId, notificationType, scheduledAt, sent: false });
        return;
      }
      
      // If a pending notification exists for the same user and title, remove it and keep the newest one
      try {
        if (userId) {
          await this.sequelizeObjects.Notification.destroy({ where: { sent: false, userId: userId, title: title || 'Wawe Poker Face' } });
          try { this.logger.log(`Dedup notifications: removed previous pending notifications for userId=${userId}, title=${title || 'Wawe Poker Face'}`); } catch (e) {}
        }
      } catch (dedupErr) {
        this.logger.log(`Dedup notifications error for userId=${userId || 'n/a'} title=${title || 'Wawe Poker Face'}: ${dedupErr && dedupErr.message ? dedupErr.message : dedupErr}`);
      }
      
      const scheduledAt = new Date(Date.now() + (Number(delayMs) || 0));
      const rec = await this.sequelizeObjects.Notification.create({
        userId: userId || null,
        title: title || 'Wawe Poker Face',
        body: body || 'Your spinner is ready! Come back and play.',
        notificationType: notificationType || 'me',
        scheduledAt: scheduledAt,
        sent: false
      });
      
      this.logger.log(`Notification scheduled in database: ID=${rec.id}, scheduledAt=${scheduledAt.toISOString()}, userId=${userId}`);
      // Note: No in-memory scheduling - will be picked up by database polling
    } catch (err) {
      this.logger.log(`sendNotificationAfterDelay persist error: ${err && err.message ? err.message : err}`);
    }
  }

  /**
   * Send ban notification to a specific connection
   */
  sendBanNotification(connectionId, message, players) {
    try {
      if (!players[connectionId] || !players[connectionId].connection) {
        throw new Error(`Invalid connectionId: ${connectionId}`);
      }
      try {
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "banNotification",
            message: message,
          })
        );
      } catch (err) {
        this.logger.log(err);
      }
    } catch (err) {
      this.logger.log(err);
    }
  }

  /**
   * Send warning notification to a specific connection
   */
  sendWarningNotification(connectionId, message, players) {
    try {
      if (!players[connectionId] || !players[connectionId].connection) {
        throw new Error(`Invalid connectionId: ${connectionId}`);
      }
      try {
        players[connectionId].connection.sendText(
          JSON.stringify({
            key: "banNotification",
            message: message,
          })
        );
      } catch (err) {
        this.logger.log(err);
      }
    } catch (err) {
      this.logger.log(err);
    }
  }

  /**
   * Check for leaderboard events that need notification
   */
  async checkEventNotifications() {
    try {
      if (!this.sequelizeObjects) {
        this.logger.log('Sequelize not available for event notifications');
        return;
      }

      const { LeaderboardEvent, Event } = this.sequelizeObjects;

      // Find active events that need notification
      const eventsToNotify = await LeaderboardEvent.findAll({
        where: { 
          isActive: true, 
          notifyevent: true 
        }
      });

      this.logger.log(`Found ${eventsToNotify.length} events to notify`);

      for (const event of eventsToNotify) {
        try {
          // Get event name by directly querying the events table using eventId
          let eventName = 'Poker Event'; // Default fallback
          let eventCurrency = '';
          
          this.logger.log(`Processing leaderboard event ID: ${event.id}, eventId: ${event.eventId}`);
          
          if (event.eventId) {
            const eventDetails = await Event.findByPk(event.eventId);
            if (eventDetails) {
              eventName = eventDetails.name || 'Poker Event';
              eventCurrency = eventDetails.currency || '';
              this.logger.log(`✅ Found event: "${eventName}" (Event ID: ${event.eventId})`);
            } else {
              this.logger.log(`❌ No event found for eventId: ${event.eventId}`);
            }
          } else {
            this.logger.log(`❌ No eventId found for leaderboard event: ${event.id}`);
          }
          
          const startTime = new Date(event.startTime);
          const endTime = new Date(event.endTime);
          
          // Create notification with event details
          const title = `🎉 ${eventName} Started!`;
          const body = `Join the event and win the prizes!`;

          this.logger.log(`Sending event notification: ${eventName} (Event ID: ${event.eventId}, LeaderboardEvent ID: ${event.id})`);

          // Send public notification to all users
          await this.sendNotificationAfterDelay(
            0, // Send immediately
            title,
            body,
            null, // No specific user (public notification)
            'public' // Notification type
          );

          // Mark notification as sent
          await event.update({ notifyevent: false });
          
          this.logger.log(`✅ Event notification sent successfully for: ${eventName} (ID: ${event.id})`);
        } catch (notifyErr) {
          this.logger.log(`❌ Error sending notification for event ${event.id}: ${notifyErr.message}`);
        }
      }
    } catch (err) {
      this.logger.log(`Error in checkEventNotifications: ${err.message}`);
    }
  }

  /**
   * Start event notification monitoring
   */
  startEventNotificationMonitoring() {
    try {
      // Prevent starting multiple intervals
      if (this.eventNotificationInterval) {
        this.logger.log('Event notification monitoring already running, skipping start');
        return;
      }
      
      this.logger.log('Starting event notification monitoring...');
      
      // Check for event notifications every minute
      this.eventNotificationInterval = setInterval(async () => {
        try {
          await this.checkEventNotifications();
        } catch (err) {
          this.logger.log(`Error in event notification interval: ${err.message}`);
        }
      }, 60 * 1000); // Every 60 seconds

      this.logger.log('Event notification monitoring started');
    } catch (err) {
      this.logger.log(`Error starting event notification monitoring: ${err.message}`);
    }
  }

  /**
   * Check for inactive users and send re-engagement notifications
   * Considers users inactive if they have no active or recently disconnected sessions in the threshold period
   */
  async checkInactiveUsers() {
    try {
      if (!this.sequelizeObjects) {
        this.logger.log('Sequelize not available for inactive user notifications');
        return;
      }

      // Load timer values from database if not already loaded
      if (this.offlineUserTime === 36 * 60 * 60 * 1000) { // Check if still using default
        await this.loadNotificationTimers();
      }

      const { User, UserFeature, UserSession } = this.sequelizeObjects;
      const { Op, sequelize } = require('sequelize');

      // Calculate threshold time ago using database value
      // Database stores times 5 hours behind UTC, so we need to adjust our threshold
      const now = new Date();
      // Subtract 5 hours from current time to match database timezone, then subtract offline user time
      const thresholdTimeAgo = new Date(now.getTime() - (5 * 60 * 60 * 1000) - this.offlineUserTime);

      this.logger.log(`Checking for users inactive since: ${thresholdTimeAgo.toISOString()}`);
      
      // Note: We'll clean up old notifications after processing all users

      // First, get all users with Firebase tokens
      const allUsersWithTokens = await User.findAll({
        include: [{
          model: UserFeature,
          as: 'userFeatures',
          where: {
            firebaseToken: { [Op.ne]: null }
          },
          attributes: ['firebaseToken', 'userId'],
          required: true // This ensures only users with UserFeature records are returned
        }],
        attributes: ['id', 'username', 'membersince']
      });

      // Then filter out users who have been active or recently disconnected in the last 36 hours
      const inactiveUsers = [];
      
      for (const user of allUsersWithTokens) {
        // Check if user has any recent sessions in the last 36 hours (active or recently disconnected)
        // Use raw SQL to handle timezone conversion properly
        const { sequelize } = this.sequelizeObjects;
        const recentSession = await sequelize.query(`
          SELECT id FROM "userSessions" 
          WHERE "userId" = :userId 
          AND "session_start" > :threshold
          AND status IN ('active', 'disconnected', 'expired')
          ORDER BY "session_start" DESC 
          LIMIT 1
        `, {
          replacements: {
            userId: user.id,
            threshold: thresholdTimeAgo
          },
          type: sequelize.QueryTypes.SELECT
        });

        // If no recent session found, user is inactive
        if (!recentSession || recentSession.length === 0) {
          inactiveUsers.push(user);
        }
      }

      this.logger.log(`Found ${inactiveUsers.length} inactive users with Firebase tokens`);

      if (inactiveUsers.length === 0) {
        this.logger.log('No inactive users found for re-engagement notification');
        return;
      }

      this.logger.log(`Processing ${inactiveUsers.length} inactive users...`);

      // Send re-engagement notification to each inactive user (only if not recently notified)
      for (const user of inactiveUsers) {
        try {
          const userFeature = user.userFeatures && user.userFeatures[0];
          const firebaseToken = userFeature && (userFeature.firebaseToken || userFeature.dataValues?.firebaseToken);
          if (!userFeature || !firebaseToken) {
            this.logger.log(`No Firebase token for inactive user: ${user.username} (ID: ${user.id})`);
            continue;
          }

          // Check if we've already notified this user recently (within 24 hours)
          const existingNotification = this.notifiedInactiveUsers.find(n => n.userId === user.id);
          const currentTime = now.getTime();
          
          if (existingNotification) {
            const timeSinceNotification = currentTime - existingNotification.notificationTime;
            const hoursSinceNotification = Math.floor(timeSinceNotification / (1000 * 60 * 60));
            
            this.logger.log(`Checking notification for ${user.username} (ID: ${user.id}) - last notified ${hoursSinceNotification} hours ago`);
            
            if (timeSinceNotification < (24 * 60 * 60 * 1000)) { // Less than 24 hours
              this.logger.log(`Skipping notification for ${user.username} (ID: ${user.id}) - notified ${hoursSinceNotification} hours ago (need 24+ hours)`);
              continue;
            } else {
              // Remove old entry and allow new notification
              this.notifiedInactiveUsers = this.notifiedInactiveUsers.filter(n => n.userId !== user.id);
              this.logger.log(`Removing old notification record for ${user.username} (ID: ${user.id}) - ${hoursSinceNotification} hours old`);
            }
          } else {
            this.logger.log(`No previous notification found for ${user.username} (ID: ${user.id}) - will send notification`);
          }

          // Get the last session time for this user
          const lastSession = await UserSession.findOne({
            where: { userId: user.id },
            order: [['session_start', 'DESC']],
            attributes: ['session_start']
          });

            let hoursInactive = 36; // Default to 36 hours if no session found
            if (lastSession && lastSession.session_start) {
              const lastSessionTime = new Date(lastSession.session_start);
              const currentTime = new Date();
              // Add 5 hours to lastSessionTime to convert from database timezone to UTC
              const adjustedLastSessionTime = new Date(lastSessionTime.getTime() + (5 * 60 * 60 * 1000));
              hoursInactive = Math.floor((currentTime.getTime() - adjustedLastSessionTime.getTime()) / (1000 * 60 * 60));

              this.logger.log(`User ${user.username} inactive for ${hoursInactive} hours`);
            }

            const title = "🎮 We Miss You!";
            const body = `Come back to the game! You've been away for ${hoursInactive} hours. Join now and win big!`;

          // Send personal notification to this specific user
          await this.sendNotificationAfterDelay(
            0, // Send immediately
            title,
            body,
            user.id, // Specific user ID
            'me' // Personal notification type
          );

          // Mark this user as notified with current timestamp
          this.notifiedInactiveUsers.push({
            userId: user.id,
            username: user.username,
            notificationTime: currentTime,
            hoursInactive: hoursInactive
          });

          this.logger.log(`✅ Re-engagement notification sent to: ${user.username} (ID: ${user.id}, Inactive: ${hoursInactive}h)`);

        } catch (userErr) {
          this.logger.log(`❌ Error sending re-engagement notification to user ${user.id}: ${userErr.message}`);
        }
      }

      this.logger.log(`✅ Completed inactive user check - ${this.notifiedInactiveUsers.length} users in notification tracking`);
      
      // Clean up old notifications after processing all users
      this.cleanupOldNotifications();

    } catch (err) {
      this.logger.log(`Error in checkInactiveUsers: ${err.message}`);
    }
  }

  /**
   * Start inactive user monitoring
   */
  async startInactiveUserMonitoring() {
    try {
      // Prevent starting multiple intervals
      if (this.inactiveUserInterval) {
        this.logger.log('Inactive user monitoring already running, skipping start');
        return;
      }
      
      // Load timer values from database first
      await this.loadNotificationTimers();
      
      this.logger.log('Starting inactive user monitoring...');
      
      // Check for inactive users using database value
      this.inactiveUserInterval = setInterval(async () => {
        try {
          await this.checkInactiveUsers();
        } catch (err) {
          this.logger.log(`Error in inactive user monitoring interval: ${err.message}`);
        }
      }, this.checkingTime); // Use database value

      this.logger.log(`Inactive user monitoring started (checking every ${this.checkingTime}ms, threshold: ${this.offlineUserTime}ms)`);
    } catch (err) {
      this.logger.log(`Error starting inactive user monitoring: ${err.message}`);
    }
  }

  /**
   * Stop inactive user monitoring
   */
  stopInactiveUserMonitoring() {
    if (this.inactiveUserInterval) {
      clearInterval(this.inactiveUserInterval);
      this.inactiveUserInterval = null;
      this.logger.log('Inactive user monitoring stopped');
    }
  }

  /**
   * Clean up old notification tracking entries to prevent memory leaks
   * Removes entries older than 7 days
   */
  cleanupOldNotifications() {
    try {
      const currentTime = Date.now();
      const sevenDaysAgo = currentTime - (7 * 24 * 60 * 60 * 1000); // Clean up entries older than 7 days
      
      const beforeCount = this.notifiedInactiveUsers.length;
      
      // Remove entries older than 7 days
      this.notifiedInactiveUsers = this.notifiedInactiveUsers.filter(notification => {
        return notification.notificationTime > sevenDaysAgo;
      });
      
      const afterCount = this.notifiedInactiveUsers.length;
      const removedCount = beforeCount - afterCount;
      
      if (removedCount > 0) {
        this.logger.log(`Cleaned up ${removedCount} old notification records (older than 7 days)`);
      }
    } catch (err) {
      this.logger.log(`Error cleaning up old notifications: ${err.message}`);
    }
  }

  /**
   * Reset notification tracking for a user (call when user becomes active)
   */
  resetUserNotificationTracking(userId) {
    try {
      const beforeCount = this.notifiedInactiveUsers.length;
      this.notifiedInactiveUsers = this.notifiedInactiveUsers.filter(n => n.userId !== userId);
      const afterCount = this.notifiedInactiveUsers.length;
      
      if (beforeCount > afterCount) {
        this.logger.log(`Reset notification tracking for user ${userId} (removed ${beforeCount - afterCount} records)`);
      }
    } catch (err) {
      this.logger.log(`Error resetting notification tracking for user ${userId}: ${err.message}`);
    }
  }

  /**
   * Stop event notification monitoring
   */
  stopEventNotificationMonitoring() {
    if (this.eventNotificationInterval) {
      clearInterval(this.eventNotificationInterval);
      this.eventNotificationInterval = null;
      this.logger.log('Event notification monitoring stopped');
    }
  }

  /**
   * Clean up scheduled timeouts
   */
  cleanup() {
    this.stopEngagementNotifications();
    this.stopEventNotificationMonitoring();
    this.stopInactiveUserMonitoring();
    this.stopScheduledNotificationMonitoring();
    for (const [id, timeoutId] of this.scheduledNotificationTimeouts) {
      clearTimeout(timeoutId);
    }
    this.scheduledNotificationTimeouts.clear();
  }
}

module.exports = NotificationService;


