import { Sequelize } from 'sequelize';
import { up as addGoogleId } from './models/migrations/add-google-id';
import { up as addTwoFactor } from './models/migrations/add-two-factor';
import { up as createChatTables } from './models/migrations/create-chat-tables';
import { up as allowNullMatchPlayers } from './models/migrations/allow-null-match-players';

// Create a database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: console.log
});

async function runMigrations() {
  try {
    console.log('Starting migrations...');
    
    // Run migrations in order
    await addGoogleId(sequelize.getQueryInterface());
    await addTwoFactor(sequelize.getQueryInterface());
    await createChatTables(sequelize.getQueryInterface());
    await allowNullMatchPlayers(sequelize.getQueryInterface());
    
    console.log('Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations(); 