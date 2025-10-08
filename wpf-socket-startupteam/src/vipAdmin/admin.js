const express = require('express');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const router = express.Router();
const verifyToken=require('./verifyToken')
const { VipAdmin } = require('../database/sequelize'); // Adjust path as necessary
const { User } = require('../database/sequelize');
const JWT_EXPIRATION = '1h'; 
const {HandleQueries} = require ('../database/sequelize');
const {Reports} = require ('../database/sequelize');
const {Tables} = require ('../database/sequelize');
const {UserLog} = require ('../database/sequelize');
const {Event} = require ('../database/sequelize');
const {Gifts} = require ('../database/sequelize');
const {RewardVIPUser} = require ('../database/sequelize');
const {PopupEvent,Popups} = require ('../database/sequelize');
const {Comments} = require ('../database/sequelize');
const {InAppProducts} = require ('../database/sequelize');
const {InAppPurchase} = require ('../database/sequelize');
const {VipMembership} = require ('../database/sequelize');
const {QueryTable,ReportTable} = require ('../database/sequelize');
const{Version} = require ('../database/sequelize');

const path = require('path');

router.use(express.json());
const generateToken = (admin) => {
    return jwt.sign({ id: admin.id, name: admin.name, email: admin.email }, process.env.JWT_SECRET, { algorithm: 'HS256',expiresIn: JWT_EXPIRATION });
};
// Define admin routes
router.post('/register', async (req, res) => {
    try {
        const { name, email, password,phone,role } = req.body;

        // Insert into VipAdmin table using Sequelize
        const admin = await VipAdmin.create({
            name: name,
            email: email,
            phone:phone,
            password: password,
            role:role
            
        });

        // Respond with success message and inserted data
        res.status(201).json({ message: 'Admin created successfully', admin: admin });
    } catch (err) {
        // Handle errors
        console.error('Error creating admin:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
 

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log("email "+req.body.email + " password "+req.body.password)
    try {
        const admin = await VipAdmin.findOne({
            where: {
                email: email,
                password: password
            }
        });

        if (admin) {
            const token = generateToken(admin);
            res.status(200).json({ message: 'Login successful',token, admin: admin });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Error while querying admin login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.get('/total-admin', async (req, res) => {
    try {
        const totalUsers = await VipAdmin.count();
        res.status(200).json({ totalUsers });
    } catch (error) {
        console.error('Error fetching total users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.get('/total-users', async (req, res) => {
    try {
        const totalUsers = await User.count();
        res.status(200).json({ totalUsers });
    } catch (error) {
        console.error('Error fetching total users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.get('/verify-token', verifyToken, async (req, res) => {
    try {
        const admin = await VipAdmin.findByPk(req.adminId);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.status(200).json({ admin: admin });
    } catch (error) {
        console.error('Error fetching admin profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.get('/admin-info', verifyToken, async (req, res) => {
    try {
      const admin = await VipAdmin.findByPk(req.adminId);
  
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
  
      res.status(200).json({ admin: admin });
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

router.get('/users', async (req, res) => {
    try {
        const users = await User.findAll({
            where: { DropUser: false },
            attributes: { exclude: ['password'] } // Exclude sensitive data
        });
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error(`Error fetching user with ID ${id}:`, error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name,facebookid, money,OnlineStatus,number, email, password,VipStatus  } = req.body;

    try {
        // Find the user by ID
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user attributes
        user.name = name;
        user.money = money;
        user.email = email;
        user.VipStatus  = VipStatus ;
        user.facebookid = facebookid;
        user.OnlineStatus = OnlineStatus; 
        user.password = password; 
        user.number = number; 

       

        // Save the updated user
        await user.save();

        res.status(200).json(user);
    } catch (error) {
        console.error(`Error updating user with ID ${id}:`, error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/sendQueries', async (req, res) => {
    try {
        const { userId, fullname, email,phone,message } = req.body;

        
        const handlequery = await HandleQueries.create({
            userId: userId,
            fullname: fullname,
            phone: phone,
            email: email,
            message: message
            
        });

        // Respond with success message and inserted data
        res.status(201).json({ message: 'Query created successfully', handlequery: handlequery });
    } catch (err) {
        // Handle errors
        console.error('Error creating admin:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
  });
  router.get('/retrieveQuery', async (req, res) => {
    try {
        const query = await HandleQueries.findAll();
        res.status(200).json(query);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.post('/queryStatus', async (req, res) => {
    try {
      const { queryIds } = req.body; // Expecting an array of query IDs
  
      if (!Array.isArray(queryIds) || queryIds.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty queryIds array' });
      }
  
      const queries = await QueryTable.findAll({
        where: { QuerytId: queryIds },
        attributes: ['QuerytId', 'status']
      });
  
      res.json(queries);
    } catch (error) {
      console.error('Error fetching query statuses:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
router.get('/retrieveQuery/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Step 1: Check QueryTable for the query
        let queryDetails = await QueryTable.findOne({
            where: { QuerytId: id },
            include: [
                {
                    model: HandleQueries,
                    as: 'queryDetails'
                },
                {
                    model: VipAdmin,
                    as: 'assignedUser',
                    attributes: ['id', 'name', 'email', 'role']
                }
            ]
        });

        // Step 2: If not found, check HandleQueries
        if (!queryDetails) {
            const handleQuery = await HandleQueries.findOne({
                where: { id }
            });

            if (!handleQuery) {
                return res.status(404).json({ message: 'Query not found in HandleQueries either.' });
            }

            // Step 3: Create a new QueryTable entry
            queryDetails = await QueryTable.create({
                QuerytId: id, // Unique Query ID
                AssignedBy: 'Admin',
                status: 'open'
            });

            // Optionally, re-fetch to include relations
            queryDetails = await QueryTable.findOne({
                where: { QuerytId: queryDetails.QuerytId },
                include: [
                    {
                        model: HandleQueries,
                        as: 'queryDetails'
                    },
                    {
                        model: VipAdmin,
                        as: 'assignedUser',
                        attributes: ['id', 'name', 'email', 'role']
                    }
                ]
            });
        }

        res.json(queryDetails);
    } catch (error) {
        console.error('Error retrieving or creating query details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/getSupportUsers', async (req, res) => {
    try {
      const supportUsers = await VipAdmin.findAll({
        where: { role: 'Support' },
        attributes: ['id', 'name']
      });
      res.json(supportUsers);
    } catch (error) {
      console.error('Error fetching support users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Update Assignee
  router.post('/updateAssignee/:id', async (req, res) => {
    const { id } = req.params;
    const { assigneeId, version } = req.body; // Expect version from the client
  
    try {
        const queryRecord = await QueryTable.findOne({ where: { QuerytId: id } });
  
        if (!queryRecord) {
            return res.status(404).json({ message: 'Query not found' });
        }

        // Check for version mismatch
        if (queryRecord.version !== version) {
            return res.status(409).json({ 
                message: 'Version mismatch. Record has been updated by another process.', 
                currentVersion: queryRecord.version 
            });
        }
  
        // Update assignee and increment version
        queryRecord.AssigneeId = assigneeId;
        queryRecord.version += 1; // Increment version number to reflect update
        queryRecord.AssignedAt= new Date(),
  
        await queryRecord.save();
        let assignee = await HandleQueries.findOne({ where: { id: id } });
        if(assignee){
            const assignedId = await VipAdmin.findOne({where:{id:assigneeId}})
            assignee.assignedUser = assignedId.name;
            await assignee.save();
        }  
  
        res.json({ message: 'Assignee updated successfully', version: queryRecord.version });
    } catch (error) {
        console.error('Error updating assignee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
  router.post('/updateStatus/:id', async (req, res) => {
    const { id } = req.params;
    const {status,conclusionTime,conclusion } = req.body;
  
    try {
      const queryRecord = await QueryTable.findOne({ where: { QuerytId: id } });
  
      if (!queryRecord) {
        return res.status(404).json({ message: 'Query not found' });
      }

      queryRecord.status = status;
      queryRecord.closedAt = conclusionTime;
      queryRecord.conclusion = conclusion;
      await queryRecord.save();
  
      res.json({ message: 'Assignee updated successfully' });
    } catch (error) {
      console.error('Error updating assignee:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
router.get('/totalQuery', async (req, res) => {
    try {
        const handle = await HandleQueries.count();
        res.status(200).json({ handle });
    } catch (error) {
        console.error('Error fetching total users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.get('/totalVipUser', async (req, res) => {
    try {
        const vipUserCount = await User.count({
            where: { VipStatus: true }
        });
        res.status(200).json({ count: vipUserCount });
    } catch (error) {
        console.error('Error fetching total VIP users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/retrieveVipUser', async (req, res) => {
    try {
        const vipUserCount = await User.findAll({
            where: { VipStatus: true }
        });
        res.status(200).json(vipUserCount );
    } catch (error) {
        console.error('Error fetching total VIP users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.put('/dropuser/:id', async (req, res) => {
      const {id} = req.params;
      try{
      
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.DropUser = true;
        await user.save();
      res.status(200).send({ message: 'User Deleted successfully' });
    } catch (error) {
      res.status(500).send({ error: 'Error updating user' });
    }
  });

  router.get('/retrievereport', async (req, res) => {
    try {
        const query = await Reports.findAll();
        res.status(200).json(query);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.post('/reportStatus', async (req, res) => {
    try {
      const { queryIds } = req.body; // Expecting an array of query IDs
  
      if (!Array.isArray(queryIds) || queryIds.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty queryIds array' });
      }
  
      const queries = await ReportTable.findAll({
        where: { reportId: queryIds },
        attributes: ['reportId', 'status']
      });
  
      res.json(queries);
    } catch (error) {
      console.error('Error fetching query statuses:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
router.get('/retrievereport/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let queryDetails = await ReportTable.findOne({
        where: { reportId: id },
        include: [
          {
            model: Reports,
            as: 'ReportDetails'
          },
          {
            model: VipAdmin,
            as: 'assigneReportdUser',
            attributes: ['id', 'name','email', 'role']
          }
        ]
      });
  
      if (!queryDetails) {
        const handleQuery = await Reports.findOne({
            where: { id }
        });

        if (!handleQuery) {
            return res.status(404).json({ message: 'Query not found in HandleQueries either.' });
        }

        // Step 3: Create a new QueryTable entry
        queryDetails = await ReportTable.create({
            reportId: id, // Unique Query ID
            AssignedBy: 'Admin',
            status: 'open'
        });

        queryDetails = await ReportTable.findOne({
            where: { reportId: queryDetails.reportId },
            include: [
              {
                model: Reports,
                as: 'ReportDetails'
              },
              {
                model: VipAdmin,
                as: 'assigneReportdUser',
                attributes: ['id', 'name','email', 'role']
              }
            ]
          });

      }
  
      res.json(queryDetails);
    } catch (error) {
      console.error('Error retrieving query details:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
});
  
  // Update Assignee
  router.post('/updateReportAssignee/:id', async (req, res) => {
    const { id } = req.params;
    const { assigneeId, version } = req.body; // Expect version from the client
  
    try {
        const queryRecord = await ReportTable.findOne({ where: { reportId: id } });
  
        if (!queryRecord) {
            return res.status(404).json({ message: 'Query not found' });
        }

        // Check for version mismatch
        if (queryRecord.version !== version) {
            return res.status(409).json({ 
                message: 'Version mismatch. Record has been updated by another process.', 
                currentVersion: queryRecord.version 
            });
        }
  
        // Update assignee and increment version
        queryRecord.AssigneeId = assigneeId;
        queryRecord.version += 1;
        queryRecord.AssignedAt= new Date(), // Increment version number to reflect update
  
        await queryRecord.save();
        let assignee = await Reports.findOne({ where: { id: id } });
        if(assignee){
            const assignedId = await VipAdmin.findOne({where:{id:assigneeId}})
            assignee.assignedUser = assignedId.name;
            await assignee.save();
        }  
  
        res.json({ message: 'Assignee updated successfully', version: queryRecord.version });
    } catch (error) {
        console.error('Error updating assignee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
  });
  router.post('/updateReportStatus/:id', async (req, res) => {
    const { id } = req.params;
    const {status,conclusionTime,conclusion } = req.body;
  
    try {
      const queryRecord = await ReportTable.findOne({ where: { reportId: id } });
  
      if (!queryRecord) {
        return res.status(404).json({ message: 'Query not found' });
      }

      queryRecord.status = status;
      queryRecord.closedAt = conclusionTime;
      queryRecord.conclusion = conclusion;
      await queryRecord.save();
  
      res.json({ message: 'Assignee updated successfully' });
    } catch (error) {
      console.error('Error updating assignee:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
router.post('/tables', async (req, res) => {
    try {
        const {
            name,
            typeName,
            buyIn,
            max_seats,
            minPlayers,
            turnCountdown,
            minBet,
            minimumAmount,
            maximumAmount,
            afterRoundCountdown,
            type,
            sequence,
            display
        } = req.body;

        // Function to check if a value should be a BigInt
        const isBigInt = (value) => {
            return typeof value === 'string' && !isNaN(BigInt(value));
        };

        // Convert values to BigInt if they are strings representing large numbers
        const formattedMinimumAmount = isBigInt(minimumAmount) ? BigInt(minimumAmount) : Number(minimumAmount);
        const formattedMaximumAmount = isBigInt(maximumAmount) ? BigInt(maximumAmount) : Number(maximumAmount);

        // Log for debugging
        console.log('Formatted values:', { formattedMinimumAmount, formattedMaximumAmount });

        const newTable = await Tables.create({
            name,
            typeName,
            buyIn,
            max_seats,
            minPlayers,
            turnCountdown,
            minBet,
            minimumAmount: formattedMinimumAmount,
            maximumAmount: formattedMaximumAmount,
            afterRoundCountdown,
            type,
            sequence,
            display
        });

        res.status(201).json(newTable);
    } catch (error) {
        console.error('Error creating table:', error); // More detailed error logging
        res.status(500).json({ error: 'Failed to create table' });
    }
});

router.get('/getTables',async(req,res)=>{
    try{
        const tables = await Tables.findAll();
        res.status(200).json(tables);
    }catch(error){
        console.error('Error fetching tables:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.get('/getUsertotaltime', async (req, res) => {
    
    try {
        const{userId} = req.body;
        const formatMilliseconds = (ms) => {
            const totalSeconds = Math.floor(ms / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            return `${hours}h ${minutes}m ${seconds}s`;
        }
        const userLogs = await UserLog.findAll({ where: { userId } });
    
        if (!userLogs.length) {
          return res.status(404).json({ error: 'No logs found for this user' });
        }
    
        const totalTimeSpend = userLogs.reduce((acc, log) => {
          // Ensure time_spend is a valid number
          const timeSpend = parseInt(log.time_spend, 10);
          return acc + (isNaN(timeSpend) ? 0 : timeSpend);
        }, 0);
        
        // Ensure the accumulated time spend is a valid number
        const formattedTimeSpend = isNaN(totalTimeSpend) ? '0h 0m 0s' : formatMilliseconds(totalTimeSpend);
    
        res.json({ userId, totalTimeSpend: formattedTimeSpend });
      } catch (error) {
        console.error('Error fetching user time spend:', error);
        res.status(500).send('Internal Server Error');
      }
})

router.post('/banUser', async (req, res) => {
    const { userId, duration, permanent } = req.body;
    const user = await User.findByPk(userId);

    user.DropUser = true;
    user.banDuration = permanent ? null : new Date(Date.now() + duration);
    await user.save();

    res.json({ message: `User ${userId} has been banned.` });
});
router.post('/unbanUser', async (req, res) => {
    const { userId } = req.body;
    const user = await User.findByPk(userId);
    user.DropUser = false;
    user.banDuration = null;
    await user.save();

    res.json({ message: `User ${userId} has been unbanned.` });
});
router.get('/getEvents', async (req, res) => {
    try {
        const events = await Event.findAll();
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});
router.post('/addEvent', async (req, res) => {
    const { name, currency } = req.body;

    // Basic validation
    if (!name || !currency) {
        return res.status(400).json({ error: 'Name and currency are required' });
    }

    try {
        // Create a new event
        const newEvent = await Event.create({
            name,
            currency,
        });

        res.status(201).json(newEvent);
    } catch (error) {
        console.error('Error adding event:', error);
        res.status(500).json({ error: 'Failed to add event' });
    }
});
router.get('/getEvent/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const event = await Event.findByPk(id);
        if (event) {
            res.json(event);
        } else {
            res.status(404).json({ error: 'Event not found' });
        }
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});
router.put('/updateEvent/:id', async (req, res) => {
    const { id } = req.params;
    const { name, currency } = req.body;

    if (!name || !currency) {
        return res.status(400).json({ error: 'Name and currency are required' });
    }

    try {
        const event = await Event.findByPk(id);
        if (event) {
            event.name = name;
            event.currency = currency;
            await event.save();
            res.json(event);
        } else {
            res.status(404).json({ error: 'Event not found' });
        }
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
});
router.get('/bannedUsers', async (req, res) => {
    try {
        const bannedUsers = await User.findAll({ where: { DropUser: true } });
        res.json(bannedUsers);
    } catch (error) {
        console.error('Error fetching banned users:', error);
        res.status(500).json({ error: 'Failed to fetch banned users' });
    }
});
const imagePaths = {
    chips: 'https://wawe-poker-api-handeling-fabddf98b575.herokuapp.com/Assets/chip_box.png',
    spinner: 'https://wawe-poker-api-handeling-fabddf98b575.herokuapp.com/Assets/spinners.png',
    deal: 'https://wawe-poker-api-handeling-fabddf98b575.herokuapp.com/Assets/spin&chip.png'
  };
router.use('/Assets', express.static(path.join(__dirname, '../Assets')));
router.get('/test-image', (req, res) => {
    res.sendFile(path.join(__dirname, 'Assets', 'chip_box.png'));
});
router.post('/RewardVIPUser', async (req, res) => {
    try{
        const { userId, Chips, Spinner } = req.body;

        // Determine the image path based on the input
        let imagePath = '';
        if (Chips && Spinner) {
          imagePath = imagePaths.deal; // Both Chips and Spinner are given
        } else if (Chips) {
          imagePath = imagePaths.chips; // Only Chips are given
        } else if (Spinner) {
          imagePath = imagePaths.spinner; // Only Spinners are given
        }
    
        // Create the reward entry in the database
        const RewardUser = await RewardVIPUser.create({
          userId,
          Chips,
          Spinner,
          Image: imagePath, // Save the image path in the database
          isCollected: false
        });

        res.status(201).json(RewardUser);


    }catch(error){
        console.error('Error creating reward:', error);
        res.status(500).json({ error: 'Failed to create reward' });
    }
})

router.get('/getGifts', async (req, res) => {
    try {
        const gift = await Gifts.findAll();
        res.json(gift);
    } catch (error) {
        console.error('Error fetching Gifts:', error);
        res.status(500).json({ error: 'Failed to fetch Gifts' });
    }
});
router.post('/addGifts', async (req, res) => {
    console.log('Incoming Payload:', req.body);

    let { GiftName, GiftPrice, Enabled, ImageURL } = req.body;

    // Ensure GiftPrice is a number and Enabled is a boolean
    GiftPrice = parseInt(GiftPrice);
    Enabled = Boolean(Enabled);

    console.log('Processed Enabled:', Enabled, 'Type:', typeof Enabled);

    try {
        const newGift = await Gifts.create({
            GiftName,
            GiftPrice,
            Enabled,
            ImageURL,
        });
        res.status(201).json(newGift);
    } catch (error) {
        console.error('Error adding gift:', error.message, error);
        res.status(500).json({ error: 'Failed to add gift', details: error.message });
    }
});
router.get('/getGifts/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const event = await Gifts.findByPk(id);
        if (event) {
            res.json(event);
        } else {
            res.status(404).json({ error: 'Gifts not found' });
        }
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});
router.put('/updateGifts/:id', async (req, res) => {
    const { id } = req.params;
    const { GiftName, GiftPrice,Enabled,ImageURL } = req.body;

    if (!GiftName || !GiftPrice || !Enabled || !ImageURL) {
        return res.status(400).json({ error: 'Name and currency are required' });
    }

    try {
        const event = await Gifts.findByPk(id);
        if (event) {
            event.GiftName = GiftName;
            event.GiftPrice = GiftPrice;
            event.Enabled = Enabled;
            event.ImageURL = ImageURL;
            await event.save();
            res.json(event);
        } else {
            res.status(404).json({ error: 'Gifts not found' });
        }
    } catch (error) {
        console.error('Error updating Gifts:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
});

router.get('/getPopups', async (req, res) => {
    try {
        const popups = await Popups.findAll({ raw: true }); // Fetch data and return as plain objects
        const popupevent = await PopupEvent.findAll({ raw: true });

        // Combine popups and popupevent by merging items with the same name
        const mergedData = [...popups, ...popupevent].reduce((acc, item) => {
            const existingItem = acc.find(existing => existing.name === item.name);
            if (existingItem) {
                // Merge the existing item with the new data
                Object.assign(existingItem, item);
            } else {
                acc.push({ ...item });
            }
            return acc;
        }, []);
        mergedData.forEach((item, index) => {
            item.index = index + 1; // Index starts from 1
        });
        res.json(mergedData);
    } catch (error) {
        console.error('Error fetching Gifts:', error);
        res.status(500).json({ error: 'Failed to fetch Gifts' });
    }
});
router.post('/addPopups', async (req, res) => {
    console.log('Incoming Payload:', req.body);

    let { Name, isVisible, StartTime, EndTime, Reward, DontReward, popupType } = req.body;

    // Validate and process inputs
    Reward = parseInt(Reward);
    DontReward = parseInt(DontReward);
    isVisible = Boolean(isVisible);

    console.log('Processed isVisible:', isVisible, 'Type:', typeof isVisible);

    try {
        const leastPriorityPopup = await Popups.findOne({
            attributes: ['Priorty'],
            order: [['Priorty', 'DESC']] // Fetch the lowest priority
        });
        const newPriority = leastPriorityPopup ? leastPriorityPopup.Priorty + 1 : 1;
        if (popupType === 'event') {
            // Save event popup to both tables
            const popup = await Popups.create({
                name: Name,
                isVisible: isVisible,
                Rewards: 0, // No reward for event
                DontReward: 0, // No don't reward for event
                Priorty: newPriority
            });

            await PopupEvent.create({
                popupId: popup.id, // Link the popup and event
                name: Name,
                startTime: StartTime,
                endTime: EndTime,
                isActive: isVisible
            });

            res.status(201).json("Event popup added successfully!");
        } else if (popupType === 'oneTime') {
            // Save one-time popup only to Popups table
            await Popups.create({
                name: Name,
                isVisible: isVisible,
                Rewards: Reward,
                DontReward: DontReward,
                Priorty: newPriority
            });

            res.status(201).json("One-time popup added successfully!");
        } else {
            res.status(400).json({ error: 'Invalid popupType provided' });
        }
    } catch (error) {
        console.error('Error adding popup:', error.message, error);
        res.status(500).json({ error: 'Failed to add popup', details: error.message });
    }
});
router.get('/getPopups/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const popups = await Popups.findAll({ raw: true }); // Fetch data and return as plain objects
        const popupevent = await PopupEvent.findAll({ raw: true });

        // Combine popups and popupevent by merging items with the same name
        const mergedData = [...popups, ...popupevent].reduce((acc, item) => {
            const existingItem = acc.find(existing => existing.name === item.name);
            if (existingItem) {
                // Merge the existing item with the new data
                Object.assign(existingItem, item);
            } else {
                acc.push({ ...item });
            }
            return acc;
        }, []);
        const result = mergedData.find(item => item.name === id);

        if (result) {
            res.status(200).json(result); // Return the matching item
        } else {
            res.status(404).json({ error: 'No data found with the matching name' }); // Handle no matches
        }

    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});
router.put('/updatePopups/:id', async (req, res) => {
    const { id } = req.params;
    const { Name, Reward,IsVisible,DontReward, StartTime, EndTime } = req.body;
    try {
        const popup = await Popups.findOne({where:{name:id}});
        const event = await PopupEvent.findOne({where:{name:id}})
        if(popup && event){
            popup.Reward = Reward;
            popup.DontReward = DontReward;
            popup.isVisible = IsVisible
            popup.name = Name
            event.name = Name
            event.startTime = StartTime
            event.endTime = EndTime
            event.isActive = IsVisible
            popup.save();
            event.save();
            res.json("Updated Sucessfully")
        }else{
            if(popup){
                popup.Reward = Reward;
                popup.DontReward = DontReward;
                popup.isVisible = IsVisible
                popup.name = Name
                popup.save()
                res.json("Updated Sucessfully")
            }
            else if(event){
                event.name = Name
                event.startTime = StartTime
                event.endTime = EndTime
                event.isActive = IsVisible
                event.save();
            res.json("Updated Sucessfully")
            }
            else{
                res.status(404).json({error:"'No data found with the matching name'"})
            }
        }
    } catch (error) {
        console.error('Error updating Gifts:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
});
router.post('/updatePopupsSequence', async (req, res) => {
    const { popups } = req.body;

    try {
        for (const popup of popups) {
            await Popups.update(
                { Priorty: popup.Priorty },
                { where: { id: popup.id } }
            );
        }
        res.status(200).json({ message: 'Priorities updated successfully' });
    } catch (error) {
        console.error('Error updating priorities:', error.message);
        res.status(500).json({ error: 'Failed to update priorities' });
    }
});
router.get('/GetPopupsSequence', async (req, res) => {
    try {
        const popups = await Popups.findAll({order: [['Priorty', 'ASC']]});
        popups.forEach((item, index) => {
            item.index = index + 1; // Index starts from 1
        });
        res.json(popups);
    } catch (error) {
        console.error('Error fetching Gifts:', error);
        res.status(500).json({ error: 'Failed to fetch Gifts' });
    }
});
router.get('/getInapp', async (req, res) => {
    try {
        const inapp = await InAppProducts.findAll();
        res.json(inapp);
    } catch (error) {
        console.error('Error fetching Gifts:', error);
        res.status(500).json({ error: 'Failed to fetch Gifts' });
    }
});
router.get('/getInapp/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const inapp = await InAppProducts.findOne({where:{id:id}});
        res.json(inapp);
    } catch (error) {
        console.error('Error fetching Gifts:', error);
        res.status(500).json({ error: 'Failed to fetch Gifts' });
    }
})
router.put('/updateInapp/:id', async (req, res) => {
    const { id } = req.params;
    const { productname, productPrice, product_ID, lastPrice, lastChips, chips, spinner, relatedFreeProductId } = req.body;
    try {
        const inapp = await InAppProducts.findOne({where:{id:id}});
        if(inapp){
            inapp.productname = productname
            inapp.productPrice = productPrice
            inapp.product_ID = product_ID
            inapp.lastPrice = lastPrice
            inapp.lastChips = lastChips,
            inapp.chips = chips
            inapp.spinner = spinner
            inapp.relatedFreeProductId = relatedFreeProductId
            inapp.save();
            res.json("Updated Sucessfully");
        }else{
            res.status(404).json({error:"'No data found with the matching name'"})
        }
    } catch (error) {
        console.error('Error updating Gifts:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
});
router.post('/addInapp', async (req, res) => {
    console.log('Incoming Payload:', req.body);

    let { productname, productPrice, product_ID, lastPrice, lastChips, chips, spinner, relatedFreeProductId } = req.body; 

    // Validate and process inputs  
    productPrice = parseInt(productPrice);
    lastPrice = parseInt(lastPrice);
    lastChips = parseInt(lastChips);
    chips = parseInt(chips);
    spinner = parseInt(spinner);
    relatedFreeProductId = parseInt(relatedFreeProductId);

    try {
        const inapp = await InAppProducts.create({
            productname,
            productPrice,
            product_ID,
            lastPrice,
            lastChips,
            chips,
            spinner,
            relatedFreeProductId,
        });

        res.status(201).json(inapp);
    } catch (error) {
        console.error('Error creating reward:', error);
        res.status(500).json({ error: 'Failed to create reward' });
    }  
});



router.get('/user-inapp-details', async (req, res) => {
    try {
        // Aggregate total spending per user
        const inAppSpending = await InAppPurchase.findAll({
            attributes: ['userId', [InAppPurchase.sequelize.fn('SUM', InAppPurchase.sequelize.cast(InAppPurchase.sequelize.col('productPrice'), 'FLOAT')), 'totalSpent']],
            group: ['userId']
        });

        // Convert spending data into a map for quick lookup
        const spendingMap = inAppSpending.reduce((acc, item) => {
            acc[item.userId] = parseFloat(item.get('totalSpent')) || 0; // Ensure it returns a number
            return acc;
        }, {});

        // Fetch user details for all unique userIds
        const users = await User.findAll({
            where: { id: { [Op.in]: Object.keys(spendingMap) } },
            attributes: ['id', 'username', 'name', 'money','VipStatus'],
        });

        // Attach total spending to each user
        const userDetails = users.map(user => ({
            ...user.get(),
            totalSpent: spendingMap[user.id] || 0
        }));

        res.status(200).json(userDetails);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching user details.', error: error.message });
    }
});
router.get('/inapp-purchases/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const purchases = await InAppPurchase.findAll({
            where: { userId },
        });

        if (!purchases.length) {
            return res.status(200).json({ message: 'No in-app purchases found for this user.', purchases: [] });
        }

        const inAppProducts = await InAppProducts.findAll(
            { where:{product_ID: purchases.map(purchase => purchase.productID)} }
        );
        const mergedData = purchases.map(purchase => {
            // Find the corresponding product for each purchase
            const product = inAppProducts.find(item => item.product_ID === purchase.productID);
            return {
                ...purchase.toJSON(),
                product: product ? product.toJSON() : null
            };
        });
        res.status(200).json({mergedData});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching in-app purchases.', error: error.message });
    }
});
router.get('/userProfile/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const userqueries = await QueryTable.findAll({
            where: { AssigneeId: userId },
        })
        const userReport = await ReportTable.findAll({
            where: { AssigneeId: userId },
        })

        res.status(200).json({ userqueries, userReport });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching user details.', error: error.message });
    } 
})
router.get('/getComments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { tag } = req.query;
        const comments = await Comments.findAll({
            where: { TicketId: id , tag:tag},
        });
        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});
router.post('/addComments/:id', async (req, res) => {
    const { id } = req.params;
    const {comment, tag,userId, userName, role}  = req.body;

    try {
        const newComment = await Comments.create({
            TicketId : id,
            comment,
            tag,
            userId,
            userName,
            role,
            Timestamp: new Date(),
        });
        res.status(201).json(newComment);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

router.get('/VipClub', async (req, res) => {
    try {
        const events = await VipMembership.findAll();
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});
router.post('/addVipClub', async (req, res) => {
    const { Name, RequiredPoints, purchaseBonus,level } = req.body;
    try {
        // Create a new event
        const newEvent = await VipMembership.create({
            Name,
            RequiredPoints,
            purchaseBonus,
            level
        });

        res.status(201).json(newEvent);
    } catch (error) {
        console.error('Error adding event:', error);
        res.status(500).json({ error: 'Failed to add event' });
    }
});
router.get('/VipClub/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const event = await VipMembership.findByPk(id);
        if (event) {
            res.json(event);
        } else {
            res.status(404).json({ error: 'Event not found' });
        }
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});
router.put('/updateVipClub/:id', async (req, res) => {
    const { id } = req.params;
    const { Name, RequiredPoints, purchaseBonus,level } = req.body;

    try {
        const event = await VipMembership.findByPk(id);
        if (event) {
            event.Name = Name
            event.RequiredPoints = RequiredPoints
            event.purchaseBonus = purchaseBonus
            event.level = level
            await event.save();
            res.json(event);
        } else {
            res.status(404).json({ error: 'Event not found' });
        }
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
});

router.get('/adminusers/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await VipAdmin.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error(`Error fetching user with ID ${id}:`, error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.put('/adminusers/:id', async (req, res) => {
    const { id } = req.params;
    const { name,number, email, password } = req.body;

    try {
        // Find the user by ID
        const user = await VipAdmin.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user attributes
        user.name = name;
        user.email = email;
        user.password = password; 
        user.phone = number; 

       

        // Save the updated user
        await user.save();

        res.status(200).json(user);
    } catch (error) {
        console.error(`Error updating user with ID ${id}:`, error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/make-vip', async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.VipStatus = true;
        await user.save();
        res.status(200).json({ message: 'User made VIP successfully' });
    } catch (error) {
        console.error('Error making user VIP:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.post('/remove-vip', async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.VipStatus = false;
        
        await user.save();
        res.status(200).json({ message: 'User made VIP successfully' });
    } catch (error) {
        console.error('Error making user VIP:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/getVersion', async (req, res) => {
    try {
        const version = await Version.findAll();
        res.json(version);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});
router.post('/addVersion', async (req, res) => {
    const { version, type, facebook,google,phone,apple,platform } = req.body;
    try {
        // Create a new event
        const newEvent = await Version.create({
            version,
            type,
            facebook,
            google,
            phone,
            apple,
            platform
        });

        res.status(201).json(newEvent);
    } catch (error) {
        console.error('Error adding event:', error);
        res.status(500).json({ error: 'Failed to add event' });
    }
});
router.get('/version/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const event = await Version.findByPk(id);
        if (event) {
            res.json(event);
        } else {
            res.status(404).json({ error: 'Version not found' });
        }
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});
router.put('/updateVersion/:id', async (req, res) => {
    const { id } = req.params;
    const { version, type, facebook,google,phone,apple,platform } = req.body;

    try {
        const event = await Version.findByPk(id);
        if (event) {
            event.version = version
            event.type = type
            event.facebook = facebook
            event.google = google
            event.phone = phone
            event.apple = apple
            event.platform = platform
            await event.save();
            res.json(event);
        } else {
            res.status(404).json({ error: 'Version not found' });
        }
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
});
router.get('/share', (req, res) => {
    const userAgent = req.headers['user-agent'].toLowerCase();

    if (userAgent.includes('android')) {
        res.redirect('intent://#Intent;scheme=pokerface;package=com.wawe.PokerFace;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.wawe.PokerFace;end');
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        res.redirect('https://apps.apple.com/us/app/your-app/id123456789');
    } else {
        res.redirect('https://wawepokerface.com/play-now.php'); // Fallback for unsupported devices
    }
});
module.exports = router;