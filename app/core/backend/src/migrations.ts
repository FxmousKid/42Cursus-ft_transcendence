import { Sequelize } from 'sequelize';
import { up } from './models/migrations/add-google-id';

// Create a database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: console.log
});

async function runMigrations() {
  try {
    console.log('Starting migrations...');
    
    // Run migrations
    await up(sequelize.getQueryInterface());
    
    console.log('Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations(); 