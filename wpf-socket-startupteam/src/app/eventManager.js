const logger = require('./logger');
const { LeaderBoard, LeaderboardEvent, Event, User } = require('../database/sequelize');

// Import notification service (will be injected)
let notificationService = null;

// Function to set notification service instance
function setNotificationService(service) {
    notificationService = service;
}

async function scheduleEvents() {
    try {
        const now = new Date();

        // Check if there's any active leaderboard event
        let activeLeaderboardEvent = await LeaderboardEvent.findOne({ where: { isActive: true } });

        if (!activeLeaderboardEvent) {
            // Fetch all events from the Event model
            const events = await Event.findAll({ order: [['id', 'ASC']] }); // Order events by ID for consistent iteration

            if (events.length === 0) {
                logger.log("No events found to schedule.");
                return { event: "No events found to schedule." };
            }

            // Determine the next event to schedule
            const lastScheduledEvent = await LeaderboardEvent.findOne({
                where: { isActive: false },
                order: [['endTime', 'DESC']]
            });

            let nextEvent;
            if (!lastScheduledEvent) {
                // If no events have been scheduled yet, start with the first event
                nextEvent = events[0];
            } else {
                // Find the next event in the sequence
                const lastEventIndex = events.findIndex(event => event.id === lastScheduledEvent.eventId);
                nextEvent = events[(lastEventIndex + 1) % events.length]; // Circular iteration
            }

            // Schedule the next event
            const startTime = now;
            const endTime = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours later

            activeLeaderboardEvent = await LeaderboardEvent.create({
                eventId: nextEvent.id,
                startTime,
                endTime,
                isActive: true,
                notifyevent: false // Set to false initially, will be set to true by admin
            });

            logger.log(`Scheduled new leaderboard event for event ID ${nextEvent.id} from ${startTime} to ${endTime}`);
            return { event: `Event ID ${nextEvent.id} started successfully` };
        } else {
            //console.log("current active event:", JSON.stringify(activeLeaderboardEvent, null, 2));
            // If there's an active event, check if it has ended
            if (activeLeaderboardEvent.endTime <= now) {
                await activeLeaderboardEvent.update({ isActive: false });
                logger.log(`Event ended: ${activeLeaderboardEvent.id}`);
                return scheduleEvents(); // Recursively schedule the next event
            }
        }

        return { event: "No new events scheduled at this time" };
    } catch (err) {
        logger.log(`Error in scheduling events: ${err.message}`);
        return { event: "An error occurred while scheduling events." };
    }
}


// Call this function periodically (e.g., every minute)
 setInterval(scheduleEvents, 60 * 1000); // DISABLED - Events are manually managed

module.exports = { scheduleEvents, setNotificationService };