import { Sequelize, QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Check if google_id column exists
  try {
    // Add the column if it doesn't exist
    await queryInterface.describeTable('users')
      .then(tableDefinition => {
        if (!tableDefinition.google_id) {
          return queryInterface.addColumn('users', 'google_id', {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true
          });
        }
        return Promise.resolve();
      });
    
    // Make password nullable if it's not already
    await queryInterface.describeTable('users')
      .then(tableDefinition => {
        if (tableDefinition.password && !tableDefinition.password.allowNull) {
          return queryInterface.changeColumn('users', 'password', {
            type: DataTypes.STRING(255),
            allowNull: true
          });
        }
        return Promise.resolve();
      });
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  try {
    // Check if google_id column exists before removing
    await queryInterface.describeTable('users')
      .then(tableDefinition => {
        if (tableDefinition.google_id) {
          return queryInterface.removeColumn('users', 'google_id');
        }
        return Promise.resolve();
      });
    
    // Make password required again if it exists
    await queryInterface.describeTable('users')
      .then(tableDefinition => {
        if (tableDefinition.password) {
          return queryInterface.changeColumn('users', 'password', {
            type: DataTypes.STRING(255),
            allowNull: false
          });
        }
        return Promise.resolve();
      });
  } catch (error) {
    console.error('Migration reversion error:', error);
    throw error;
  }
} 