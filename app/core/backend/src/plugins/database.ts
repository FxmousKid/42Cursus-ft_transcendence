import fp from 'fastify-plugin';
import { Sequelize } from 'sequelize-typescript';
import path from 'path';
import { User } from '../models/user.model';
import { Friendship } from '../models/friendship.model';
import { Match } from '../models/match.model';

// Database configuration
const DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../database.sqlite');

// Define the db property on FastifyInstance
declare module 'fastify' {
  interface FastifyInstance {
    db: {
      sequelize: Sequelize;
      models: {
        User: typeof User;
        Friendship: typeof Friendship;
        Match: typeof Match;
      };
      Sequelize?: typeof Sequelize;
    };
  }
}

// Create Sequelize instance
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: DATABASE_PATH,
  logging: process.env.NODE_ENV !== 'production' ? console.log : false,
  models: [User, Friendship, Match], // Add your models here
  define: {
    // Ensure foreign keys are respected
    // This helps with SQLite's limited ALTER TABLE support
    freezeTableName: true,
  }
});

// Plugin to add the database connection to the Fastify instance
export const configureDatabasePlugin = fp(async (fastify, options) => {
  try {
    // Initialize database connection
    await sequelize.authenticate();
    fastify.log.info('Database connection has been established successfully.');
    
    // Sync models (in development only)
    if (process.env.NODE_ENV !== 'production') {
      // Sync models without creating backup tables
      // Using simple sync (not force or alter) to prevent table recreation
      await sequelize.sync();
      fastify.log.info('Database tables synchronized.');
      
      // Ensure foreign keys are enforced
      await sequelize.query('PRAGMA foreign_keys = ON;');
      fastify.log.info('Foreign key constraints enabled.');
    }

    // Add DB to Fastify instance
    fastify.decorate('db', {
      sequelize,
      models: {
        User,
        Friendship,
        Match,
      },
    });

    // Close database connection on server close
    fastify.addHook('onClose', async (instance) => {
      await sequelize.close();
      instance.log.info('Database connection closed.');
    });
  } catch (error) {
    fastify.log.error('Unable to connect to the database:', error);
    throw error;
  }
}); 