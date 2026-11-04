const fs   = require('fs');
const path = require('path');

const LOGS_FILE = path.join(__dirname, '../data/logs.json');
const MAX_LOGS  = 500; // keep last 500 entries

// Ensure data directory and file exist
function ensureFile() {
  const dir = path.dirname(LOGS_FILE);
  if (!fs.existsSync(dir))  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(LOGS_FILE)) fs.writeFileSync(LOGS_FILE, '[]', 'utf8');
}

function readLogs() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(LOGS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeLogs(logs) {
  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), 'utf8');
}

/**
 * Log a command execution.
 * @param {object} entry
 * @param {string} entry.command       - command name used
 * @param {string} entry.usedAlias     - exact text the user typed (alias or name)
 * @param {string} entry.args          - arguments string
 * @param {string} entry.userId        - executor user ID
 * @param {string} entry.username      - executor username
 * @param {string} entry.guildId       - guild ID
 * @param {string} entry.guildName     - guild name
 * @param {string} entry.channelId     - channel ID
 * @param {string} entry.channelName   - channel name
 * @param {string} entry.messageId     - original message ID
 * @param {boolean} entry.permitted    - did the user pass permission check
 * @param {string|null} entry.botReply - summary of bot reply (or null if silent)
 * @param {boolean} entry.success      - did command complete without error
 * @param {string|null} entry.error    - error message if any
 */
function logCommand(entry) {
  ensureFile();
  const logs = readLogs();

  logs.unshift({
    id:          Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    timestamp:   new Date().toISOString(),
    ...entry,
  });

  // Trim to max
  if (logs.length > MAX_LOGS) logs.splice(MAX_LOGS);

  writeLogs(logs);
}

function getLogs({ page = 1, limit = 50, command = '', userId = '' } = {}) {
  let logs = readLogs();

  if (command) logs = logs.filter(l => l.command === command || l.usedAlias === command);
  if (userId)  logs = logs.filter(l => l.userId === userId);

  const total = logs.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const items = logs.slice(start, start + limit);

  return { items, total, pages, page };
}

function clearLogs() {
  writeLogs([]);
}

module.exports = { logCommand, getLogs, clearLogs };
