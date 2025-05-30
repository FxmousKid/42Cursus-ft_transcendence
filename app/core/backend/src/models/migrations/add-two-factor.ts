import { Sequelize, QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  try {
    // Add two_factor_enabled column
    await queryInterface.describeTable('users')
      .then(tableDefinition => {
        if (!tableDefinition.two_factor_enabled) {
          return queryInterface.addColumn('users', 'two_factor_enabled', {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
          });
        }
        return Promise.resolve();
      });

    // Add two_factor_secret column
    await queryInterface.describeTable('users')
      .then(tableDefinition => {
        if (!tableDefinition.two_factor_secret) {
          return queryInterface.addColumn('users', 'two_factor_secret', {
            type: DataTypes.STRING(255),
            allowNull: true
          });
        }
        return Promise.resolve();
      });

    // Add two_factor_temp_secret column
    await queryInterface.describeTable('users')
      .then(tableDefinition => {
        if (!tableDefinition.two_factor_temp_secret) {
          return queryInterface.addColumn('users', 'two_factor_temp_secret', {
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
    // Remove two_factor_enabled column
    await queryInterface.describeTable('users')
      .then(tableDefinition => {
        if (tableDefinition.two_factor_enabled) {
          return queryInterface.removeColumn('users', 'two_factor_enabled');
        }
        return Promise.resolve();
      });

    // Remove two_factor_secret column
    await queryInterface.describeTable('users')
      .then(tableDefinition => {
        if (tableDefinition.two_factor_secret) {
          return queryInterface.removeColumn('users', 'two_factor_secret');
        }
        return Promise.resolve();
      });

    // Remove two_factor_temp_secret column
    await queryInterface.describeTable('users')
      .then(tableDefinition => {
        if (tableDefinition.two_factor_temp_secret) {
          return queryInterface.removeColumn('users', 'two_factor_temp_secret');
        }
        return Promise.resolve();
      });
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
} 