#!/usr/bin/env node
/**
 * Single Migration File for Database Schema Updates
 * This file handles all database schema changes in one place
 * 
 * Usage:
 *   node migration.js run          - Run all pending migrations
 *   node migration.js rollback     - Rollback all migrations
 *   node migration.js status       - Check migration status
 */

const { Sequelize } = require('sequelize');
const dotEnv = require('dotenv');
dotEnv.config();

const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
  port: process.env.DB_PORT,
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT,
});

// Migration tracking
const MIGRATION_ID = 'comprehensive_schema_update_v1';
const MIGRATION_DESCRIPTION = 'Comprehensive database schema update with all model changes';

// Create migration tracking table
async function createMigrationTable() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Migrations" (
        id VARCHAR(255) PRIMARY KEY,
        description TEXT,
        executed_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Migration tracking table ready');
  } catch (error) {
    console.error('❌ Error creating migrations table:', error.message);
    throw error;
  }
}

// Check if migration has been executed
async function isMigrationExecuted() {
  try {
    const results = await sequelize.query(`
      SELECT id FROM "Migrations" WHERE id = $1
    `, {
      bind: [MIGRATION_ID],
      type: sequelize.QueryTypes.SELECT
    });
    return results && results.length > 0;
  } catch (error) {
    console.error('Error checking migration status:', error.message);
    return false;
  }
}

// Mark migration as executed
async function markMigrationExecuted() {
  try {
    await sequelize.query(`
      INSERT INTO "Migrations" (id, description, executed_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (id) DO NOTHING
    `, {
      bind: [MIGRATION_ID, MIGRATION_DESCRIPTION],
      type: sequelize.QueryTypes.INSERT
    });
    console.log('✅ Migration marked as executed');
  } catch (error) {
    console.error('❌ Error marking migration as executed:', error.message);
    throw error;
  }
}

// Check if column exists
async function columnExists(tableName, columnName) {
  try {
    const results = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1 AND column_name = $2
    `, {
      bind: [tableName, columnName],
      type: sequelize.QueryTypes.SELECT
    });
    return results && results.length > 0;
  } catch (error) {
    console.error(`Error checking column ${columnName} in ${tableName}:`, error.message);
    return false;
  }
}

// Check if table exists
async function tableExists(tableName) {
  try {
    const results = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = $1
    `, {
      bind: [tableName],
      type: sequelize.QueryTypes.SELECT
    });
    return results && results.length > 0;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error.message);
    return false;
  }
}

// Run all migrations
async function runMigrations() {
  try {
    console.log('🚀 Starting comprehensive database migration...');
    console.log('================================================');
    
    await createMigrationTable();
    
    // Check if already executed
    if (await isMigrationExecuted()) {
      console.log('✅ Migration already executed. Skipping...');
      return;
    }

    console.log('\n📦 Running database schema updates...\n');

    // 1. Add notificationType column to Notifications table
    console.log('1. Checking Notifications table...');
    const notificationsExists = await tableExists('Notifications');
    if (notificationsExists) {
      const notificationTypeExists = await columnExists('Notifications', 'notificationType');
      if (!notificationTypeExists) {
        console.log('   Adding notificationType column...');
        await sequelize.query(`
          ALTER TABLE "Notifications" 
          ADD COLUMN "notificationType" VARCHAR(20) NOT NULL DEFAULT 'me'
        `);
        await sequelize.query(`
          ALTER TABLE "Notifications" 
          ALTER COLUMN "notificationType" DROP DEFAULT
        `);
        console.log('   ✅ notificationType column added');
      } else {
        console.log('   ✅ notificationType column already exists');
      }
    } else {
      console.log('   ⚠️  Notifications table does not exist, skipping...');
    }

    // 2. Add notifyevent column to leaderboardEvents table
    console.log('\n2. Checking leaderboardEvents table...');
    const leaderboardEventsExists = await tableExists('leaderboardEvents');
    if (leaderboardEventsExists) {
      const notifyeventExists = await columnExists('leaderboardEvents', 'notifyevent');
      if (!notifyeventExists) {
        console.log('   Adding notifyevent column...');
        await sequelize.query(`
          ALTER TABLE "leaderboardEvents" 
          ADD COLUMN "notifyevent" BOOLEAN DEFAULT false
        `);
        console.log('   ✅ notifyevent column added');
      } else {
        console.log('   ✅ notifyevent column already exists');
      }
    } else {
      console.log('   ⚠️  leaderboardEvents table does not exist, skipping...');
    }

    // 3. Create device table if it doesn't exist
    console.log('\n3. Checking device table...');
    const deviceExists = await tableExists('devices');
    if (!deviceExists) {
      console.log('   Creating devices table...');
      await sequelize.query(`
        CREATE TABLE "devices" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "deviceHash" VARCHAR(64) UNIQUE,
          "ipAddress" VARCHAR(45),
          "deviceType" VARCHAR(32),
          "os" VARCHAR(32),
          "osVersion" VARCHAR(32),
          "manufacturer" VARCHAR(64),
          "model" VARCHAR(64),
          "isBlacklisted" BOOLEAN DEFAULT false,
          "blacklistReason" TEXT,
          "referralCount" INTEGER DEFAULT 0,
          "lastActivity" TIMESTAMP,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log('   ✅ devices table created');
    } else {
      console.log('   ✅ devices table already exists');
    }

    // 4. Create referral tables if they don't exist
    console.log('\n4. Checking referral tables...');
    
    // Referrals table
    const referralsExists = await tableExists('referrals');
    if (!referralsExists) {
      console.log('   Creating referrals table...');
      await sequelize.query(`
        CREATE TABLE "referrals" (
          "id" BIGSERIAL PRIMARY KEY,
          "referrerId" BIGINT NOT NULL REFERENCES "users"("id"),
          "code" VARCHAR(16) NOT NULL UNIQUE,
          "campaign" VARCHAR(32) DEFAULT 'default',
          "expiry" TIMESTAMP,
          "status" VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired')),
          "clickCount" INTEGER DEFAULT 0,
          "conversionCount" INTEGER DEFAULT 0,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log('   ✅ referrals table created');
    } else {
      console.log('   ✅ referrals table already exists');
    }

    // ReferralClicks table
    const referralClicksExists = await tableExists('referralClicks');
    if (!referralClicksExists) {
      console.log('   Creating referralClicks table...');
      await sequelize.query(`
        CREATE TABLE "referralClicks" (
          "id" BIGSERIAL PRIMARY KEY,
          "referralId" BIGINT NOT NULL REFERENCES "referrals"("id"),
          "deviceHash" VARCHAR(64) NOT NULL,
          "ipAddress" VARCHAR(45) NOT NULL,
          "userAgent" TEXT,
          "os" VARCHAR(32),
          "browser" VARCHAR(32),
          "converted" BOOLEAN DEFAULT false,
          "friendsMade" BOOLEAN DEFAULT false,
          "convertedAt" TIMESTAMP,
          "convertedUserId" BIGINT REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
          "fraudScore" INTEGER DEFAULT 0,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log('   ✅ referralClicks table created');
    } else {
      console.log('   ✅ referralClicks table already exists');
    }

    // ReferralRewards table
    const referralRewardsExists = await tableExists('referralRewards');
    if (!referralRewardsExists) {
      console.log('   Creating referralRewards table...');
      await sequelize.query(`
        CREATE TABLE "referralRewards" (
          "id" BIGSERIAL PRIMARY KEY,
          "referralId" BIGINT NOT NULL REFERENCES "referrals"("id"),
          "referrerId" BIGINT NOT NULL REFERENCES "users"("id"),
          "refereeId" BIGINT NOT NULL REFERENCES "users"("id"),
          "referralClickId" BIGINT REFERENCES "referralClicks"("id"),
          "rewardType" VARCHAR(32) NOT NULL,
          "rewardAmount" DECIMAL(10,2) NOT NULL,
          "status" VARCHAR(20) DEFAULT 'pending',
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log('   ✅ referralRewards table created');
    } else {
      console.log('   ✅ referralRewards table already exists');
    }

    // 5. Create userFeature table if it doesn't exist
    console.log('\n5. Checking userFeature table...');
    const userFeatureExists = await tableExists('userFeatures');
    if (!userFeatureExists) {
      console.log('   Creating userFeatures table...');
      await sequelize.query(`
        CREATE TABLE "userFeatures" (
          "id" BIGSERIAL PRIMARY KEY,
          "firebaseToken" VARCHAR NOT NULL,
          "userId" BIGINT NOT NULL REFERENCES "users"("id"),
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log('   ✅ userFeatures table created');
    } else {
      console.log('   ✅ userFeatures table already exists');
    }

    // 6. Add any missing columns to existing tables
    console.log('\n6. Checking for missing columns in existing tables...');
    
    // Check user table for any missing columns
    const userColumns = [
      { name: 'username', type: 'VARCHAR' },
      { name: 'vipLevel', type: 'INTEGER DEFAULT 0' },
      { name: 'vipPoints', type: 'INTEGER DEFAULT 0' },
      { name: 'membersince', type: 'TIMESTAMP' },
      { name: 'googleProfileImageLink', type: 'VARCHAR' },
      { name: 'facebookProfileImageLink', type: 'VARCHAR' },
      { name: 'usernameCounter', type: 'INTEGER' },
      { name: 'countrycode', type: 'VARCHAR' },
      { name: 'platform', type: 'VARCHAR' }
    ];

    for (const column of userColumns) {
      const exists = await columnExists('users', column.name);
      if (!exists) {
        console.log(`   Adding ${column.name} column to users table...`);
        await sequelize.query(`
          ALTER TABLE "users" 
          ADD COLUMN "${column.name}" ${column.type}
        `);
        console.log(`   ✅ ${column.name} column added`);
      }
    }

    // Mark migration as executed
    await markMigrationExecuted();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('================================================');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

// Rollback migration
async function rollbackMigration() {
  try {
    console.log('🔄 Rolling back migration...');
    
    // Check if migration was executed
    if (!(await isMigrationExecuted())) {
      console.log('❌ No migration to rollback');
      return;
    }

    console.log('⚠️  WARNING: This will remove all added columns and tables!');
    console.log('This action cannot be easily undone. Proceed with caution.');
    
    // Remove added columns
    console.log('\nRemoving added columns...');
    
    // Remove notificationType column
    try {
      await sequelize.query(`
        ALTER TABLE "Notifications" 
        DROP COLUMN IF EXISTS "notificationType"
      `);
      console.log('✅ notificationType column removed');
    } catch (error) {
      console.log('⚠️  Could not remove notificationType column:', error.message);
    }

    // Remove notifyevent column
    try {
      await sequelize.query(`
        ALTER TABLE "leaderboardEvents" 
        DROP COLUMN IF EXISTS "notifyevent"
      `);
      console.log('✅ notifyevent column removed');
    } catch (error) {
      console.log('⚠️  Could not remove notifyevent column:', error.message);
    }

    // Remove migration record
    await sequelize.query(`
      DELETE FROM "Migrations" WHERE id = $1
    `, {
      bind: [MIGRATION_ID],
      type: sequelize.QueryTypes.DELETE
    });
    
    console.log('✅ Migration rolled back successfully');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    throw error;
  }
}

// Check migration status
async function checkStatus() {
  try {
    await createMigrationTable();
    
    const isExecuted = await isMigrationExecuted();
    const status = isExecuted ? '✅ EXECUTED' : '⏳ PENDING';
    
    console.log('\n📋 Migration Status:');
    console.log('==================');
    console.log(`${status} - ${MIGRATION_ID}: ${MIGRATION_DESCRIPTION}`);
    
  } catch (error) {
    console.error('❌ Error checking status:', error.message);
  }
}

// Main function
async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'run':
        await runMigrations();
        break;
        
      case 'rollback':
        await rollbackMigration();
        break;
        
      case 'status':
        await checkStatus();
        break;
        
      default:
        console.log('📖 Database Migration Tool');
        console.log('==========================');
        console.log('');
        console.log('Available commands:');
        console.log('  run      - Run all pending migrations');
        console.log('  rollback - Rollback the migration (WARNING: destructive)');
        console.log('  status   - Check migration status');
        console.log('');
        console.log('Examples:');
        console.log('  node migration.js run');
        console.log('  node migration.js status');
        console.log('  node migration.js rollback');
        break;
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
