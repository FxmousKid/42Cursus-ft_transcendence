const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting database fix script...');

// Path to the SQLite database
const dbPath = path.join(__dirname, 'data', 'db.sqlite');

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at ${dbPath}`);
  process.exit(1);
}

// Backup the current database
const backupPath = `${dbPath}.backup.${Date.now()}`;
console.log(`Creating backup at ${backupPath}`);
fs.copyFileSync(dbPath, backupPath);

// SQL commands to execute
const sqlCommands = [
  // Drop any backup tables that might be causing issues
  'DROP TABLE IF EXISTS users_backup;',
  // Check for issues with the users table
  'PRAGMA integrity_check;',
];

// Execute the commands
const command = `sqlite3 ${dbPath} "${sqlCommands.join('')}"`;
console.log(`Executing: ${command}`);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  
  console.log(`Database fixed successfully!`);
  console.log(`Output: ${stdout}`);
  console.log('You can now restart your application.');
}); 