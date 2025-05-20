#!/bin/bash

echo "Starting database fix script..."

# Path to the SQLite database
DB_PATH="data/db.sqlite"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
  echo "Database file not found at $DB_PATH"
  exit 1
fi

# Create backup
BACKUP_PATH="${DB_PATH}.backup.$(date +%Y%m%d%H%M%S)"
echo "Creating backup at $BACKUP_PATH"
cp "$DB_PATH" "$BACKUP_PATH"

# Drop problematic tables
echo "Dropping problematic backup tables..."
sqlite3 "$DB_PATH" "DROP TABLE IF EXISTS users_backup;"

# Check database integrity
echo "Checking database integrity..."
INTEGRITY=$(sqlite3 "$DB_PATH" "PRAGMA integrity_check;")
echo "Integrity check result: $INTEGRITY"

# Display table structure for users
echo "Current users table structure:"
sqlite3 "$DB_PATH" ".schema users"

echo "Database fix completed!"
echo "You can now restart your application." 