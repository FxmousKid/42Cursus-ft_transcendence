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

async function fixForeignKeys() {
  try {
    console.log('Starting foreign key fix...');
    
    // Create a temporary table with correct references
    await sequelize.query(`
      CREATE TABLE friendships_new (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        friend_id INTEGER NOT NULL REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'pending',
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      );
    `);
    
    // Copy data from the old table
    await sequelize.query(`
      INSERT INTO friendships_new (id, user_id, friend_id, status, createdAt, updatedAt)
      SELECT id, user_id, friend_id, status, createdAt, updatedAt FROM friendships;
    `);
    
    // Drop the old table
    await sequelize.query('DROP TABLE friendships;');
    
    // Rename the new table
    await sequelize.query('ALTER TABLE friendships_new RENAME TO friendships;');
    
    console.log('Foreign key references fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Foreign key fix failed:', error);
    process.exit(1);
  }
}

// Run the fix
fixForeignKeys(); 