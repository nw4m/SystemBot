const fs   = require('fs');
const path = require('path');

const LOGS_FILE = path.join(__dirname, '../data/logs.json');
const MAX_LOGS  = 500;

function ensureFile() {
  const dir = path.dirname(LOGS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(LOGS_FILE)) fs.writeFileSync(LOGS_FILE, '[]', 'utf8');
}

function readLogs() {
  ensureFile();
  try { return JSON.parse(fs.readFileSync(LOGS_FILE, 'utf8')); }
  catch { return []; }
}

function writeLogs(logs) {
  const tmp = LOGS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(logs, null, 2), 'utf8');
  fs.renameSync(tmp, LOGS_FILE);
}

function logCommand(entry) {
  ensureFile();
  const logs = readLogs();
  logs.unshift({
    id: Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    timestamp: new Date().toISOString(),
    ...entry,
  });
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

function clearLogs() { writeLogs([]); }

module.exports = { logCommand, getLogs, clearLogs };
