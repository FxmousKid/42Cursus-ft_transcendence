import { Sequelize } from 'sequelize';
import path from 'path';

// Database configuration
const DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../database.sqlite');

// Create a database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: DATABASE_PATH,
  logging: console.log
});

async function cleanupBackupTables() {
  try {
    console.log('Starting cleanup of backup tables...');
    
    // Get list of all tables
    const [results] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_backup';"
    );
    
    // Convert results to array of table names
    const backupTables = results.map((row: any) => row.name);
    
    if (backupTables.length === 0) {
      console.log('No backup tables found.');
    } else {
      console.log(`Found ${backupTables.length} backup tables: ${backupTables.join(', ')}`);
      
      // Drop each backup table
      for (const table of backupTables) {
        await sequelize.query(`DROP TABLE IF EXISTS "${table}";`);
        console.log(`Dropped table: ${table}`);
      }
    }
    
    console.log('Backup table cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupBackupTables(); 