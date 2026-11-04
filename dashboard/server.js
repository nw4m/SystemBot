if (!process.env.TOKEN) {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
}

const express = require('express');
const session = require('express-session');
const flash   = require('connect-flash');
const path    = require('path');
const fs      = require('fs');
const os      = require('os');

const app        = express();
const PORT       = process.env.DASHBOARD_PORT || 3000;
const configPath = path.join(__dirname, '../data/config.json');
const configSrc  = path.join(__dirname, '../config.json'); // original read-only source

// ─── Ensure writable data dir ─────────────────────────────────────────────────
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Copy config.json into data/ on first run (or if data/config.json missing)
if (!fs.existsSync(configPath)) {
  const base = fs.existsSync(configSrc)
    ? fs.readFileSync(configSrc, 'utf8')
    : JSON.stringify({ prefix: '!', embedColor: '#fd6868', permissions: {}, khat: { text: '', deleteCmd: false }, warnings: {} }, null, 2);
  fs.writeFileSync(configPath, base, 'utf8');
}

let discordClient = null;
function setClient(c) { discordClient = c; }

// ─── Middleware ───────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.DASHBOARD_SECRET || 'supersecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 },
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error   = req.flash('error');
  next();
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session.loggedIn) return next();
  res.redirect('/login');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getConfig() {
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}
function saveConfig(data) {
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
}

// Container-only stats (memory + uptime of the process itself, not the host OS)
function getContainerStats() {
  const mem     = process.memoryUsage();
  const upSec   = Math.floor(process.uptime());
  const upH     = Math.floor(upSec / 3600);
  const upM     = Math.floor((upSec % 3600) / 60);
  const upS     = upSec % 60;

  // os.freemem / totalmem reflects the container cgroup limits on Pterodactyl
  const totalMem = os.totalmem();
  const freeMem  = os.freemem();
  const usedMem  = totalMem - freeMem;
  const memPct   = ((usedMem / totalMem) * 100).toFixed(1);

  return {
    rss:       `${(mem.rss           / 1024 / 1024).toFixed(1)} MB`,
    heapUsed:  `${(mem.heapUsed      / 1024 / 1024).toFixed(1)} MB`,
    heapTotal: `${(mem.heapTotal     / 1024 / 1024).toFixed(1)} MB`,
    external:  `${(mem.external      / 1024 / 1024).toFixed(1)} MB`,
    totalMem:  `${(totalMem          / 1024 / 1024).toFixed(0)} MB`,
    usedMem:   `${(usedMem           / 1024 / 1024).toFixed(0)} MB`,
    memPct:    `${memPct}%`,
    uptime:    `${upH}h ${upM}m ${upS}s`,
    nodeVer:   process.version,
    pid:       process.pid,
  };
}

const ALL_COMMANDS = [
  'ban', 'unban', 'kick', 'mute', 'unmute', 'timeout', 'untimeout',
  'warn', 'warnings', 'clearwarnings', 'nickname', 'purge',
  'lock', 'unlock', 'slowmode', 'channelinfo', 'roleadd', 'roleremove',
  'role', 'ping', 'help', 'userinfo', 'serverinfo', 'avatar', 'botinfo', 'afk',
  'خط',
];

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  if (req.session.loggedIn) return res.redirect('/dashboard');
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  if (req.session.loggedIn) return res.redirect('/dashboard');
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const envUser = process.env.DASHBOARD_USERNAME || 'admin';
  const envPass = process.env.DASHBOARD_PASSWORD || 'admin123';

  if (username === envUser && password === envPass) {
    req.session.loggedIn = true;
    req.session.username = username;
    req.flash('success', 'Welcome back, ' + username + '!');
    return res.redirect('/dashboard');
  }

  req.flash('error', 'Invalid username or password.');
  res.redirect('/login');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// ─── Overview ─────────────────────────────────────────────────────────────────
app.get('/dashboard', requireAuth, (req, res) => {
  const config = getConfig();
  const warnings = config.warnings || {};
  const totalWarnings = Object.values(warnings).reduce((sum, guild) =>
    sum + Object.values(guild).reduce((s, w) => s + w.length, 0), 0);

  let botOnline    = false;
  let totalMembers = 0;
  let guildName    = 'N/A';
  let guildIcon    = null;
  let botPing      = 0;

  if (discordClient?.isReady()) {
    botOnline = true;
    botPing   = Math.round(discordClient.ws.ping);
    const guild = discordClient.guilds.cache.first();
    if (guild) {
      totalMembers = guild.memberCount;
      guildName    = guild.name;
      guildIcon    = guild.iconURL({ dynamic: true, size: 64 });
    }
  }

  res.render('dashboard', {
    username: req.session.username,
    config,
    totalWarnings,
    totalCommands: ALL_COMMANDS.length,
    botOnline,
    totalMembers,
    guildName,
    guildIcon,
    botPing,
    container: getContainerStats(),
  });
});

// ─── Settings ─────────────────────────────────────────────────────────────────
app.get('/settings', requireAuth, (req, res) => {
  const config = getConfig();
  res.render('settings', {
    username: req.session.username,
    config,
    commands: ALL_COMMANDS,
  });
});

app.post('/settings', requireAuth, (req, res) => {
  const config = getConfig();
  const { prefix, embedColor, khatText, khatDeleteCmd } = req.body;

  if (prefix)     config.prefix     = prefix.trim();
  if (embedColor) config.embedColor = embedColor.trim();

  // !خط settings
  if (!config.khat) config.khat = {};
  config.khat.text      = khatText      || '';
  config.khat.deleteCmd = khatDeleteCmd === 'on';

  for (const cmd of ALL_COMMANDS) {
    const raw     = req.body[`perm_${cmd}`] || '';
    const roleIds = raw.split(/[\n,]+/).map(r => r.trim()).filter(Boolean);
    config.permissions[cmd] = roleIds;
  }

  saveConfig(config);
  req.flash('success', 'Settings saved successfully.');
  res.redirect('/settings');
});

// ─── Warnings ─────────────────────────────────────────────────────────────────
app.get('/warnings', requireAuth, (req, res) => {
  const config = getConfig();
  res.render('warnings', {
    username: req.session.username,
    warnings: config.warnings || {},
  });
});

app.post('/warnings/clear/:guildId/:userId', requireAuth, (req, res) => {
  const config = getConfig();
  const { guildId, userId } = req.params;
  if (config.warnings?.[guildId]?.[userId]) {
    config.warnings[guildId][userId] = [];
    saveConfig(config);
  }
  req.flash('success', 'Warnings cleared.');
  res.redirect('/warnings');
});

// ─── Members ─────────────────────────────────────────────────────────────────
app.get('/members', requireAuth, async (req, res) => {
  const config  = getConfig();
  const showAll = req.query.all === '1';

  if (!discordClient?.isReady()) {
    return res.render('members', {
      username: req.session.username,
      members: [], config,
      guildName: 'N/A', totalMembers: 0, modCount: 0,
      showAll, error: 'Bot is not connected to Discord.',
    });
  }

  const guild = discordClient.guilds.cache.first();
  if (!guild) {
    return res.render('members', {
      username: req.session.username,
      members: [], config,
      guildName: 'N/A', totalMembers: 0, modCount: 0,
      showAll, error: 'Bot is not in any server.',
    });
  }

  try { await guild.members.fetch({ time: 10000 }); } catch (_) {}

  const { DISCORD_PERM_DEFAULTS } = require('../utils/permissionCheck');

  // Mod-level Discord permissions — used to decide who counts as "moderator"
  const MOD_PERMS = new Set([
    'BanMembers', 'KickMembers', 'ModerateMembers',
    'ManageMessages', 'ManageChannels', 'ManageRoles',
    'ManageNicknames', 'Administrator',
  ]);

  const allMembers = [];

  for (const [, m] of guild.members.cache) {
    if (m.user.bot) continue;

    const isAdmin = m.permissions.has('Administrator');

    // Does this member have ANY mod-level Discord permission?
    const isMod = isAdmin || [...MOD_PERMS].some(p => m.permissions.has(p));

    // Build allowed commands list
    const canUse = [];
    for (const cmd of ALL_COMMANDS) {
      if (isAdmin) { canUse.push(cmd); continue; }
      const allowedRoles = config.permissions?.[cmd] ?? [];
      if (allowedRoles.length > 0) {
        if (allowedRoles.some(rid => m.roles.cache.has(rid))) canUse.push(cmd);
        continue;
      }
      const defPerm = DISCORD_PERM_DEFAULTS[cmd];
      if (defPerm) { if (m.permissions.has(defPerm)) canUse.push(cmd); }
      else canUse.push(cmd);
    }

    const roles = [...m.roles.cache.values()]
      .filter(r => r.id !== guild.id)
      .sort((a, b) => b.position - a.position)
      .map(r => ({ name: r.name, color: r.hexColor }));

    allMembers.push({
      id: m.id, username: m.user.username,
      avatar: m.user.displayAvatarURL({ size: 64 }),
      nickname: m.nickname || null,
      isAdmin, isMod, roles, canUse,
    });
  }

  allMembers.sort((a, b) => {
    if (a.isAdmin !== b.isAdmin) return a.isAdmin ? -1 : 1;
    return b.canUse.length - a.canUse.length;
  });

  const modCount = allMembers.filter(m => m.isMod).length;
  const members  = showAll ? allMembers : allMembers.filter(m => m.isMod);

  res.render('members', {
    username: req.session.username,
    members, config,
    guildName: guild.name,
    totalMembers: guild.memberCount,
    modCount, showAll, error: null,
  });
});

// ─── Container Stats API ──────────────────────────────────────────────────────
app.get('/api/container', requireAuth, (req, res) => {
  res.json(getContainerStats());
});

// ─── Logs ─────────────────────────────────────────────────────────────────────
app.get('/logs', requireAuth, (req, res) => {
  const { getLogs } = require('../utils/logger');
  const page    = Math.max(1, parseInt(req.query.page)  || 1);
  const command = (req.query.command || '').trim();
  const userId  = (req.query.userId  || '').trim();

  const result = getLogs({ page, limit: 50, command, userId });

  res.render('logs', {
    username: req.session.username,
    ...result,
    filters: { command, userId },
  });
});

app.post('/logs/clear', requireAuth, (req, res) => {
  const { clearLogs } = require('../utils/logger');
  clearLogs();
  req.flash('success', 'All logs cleared.');
  res.redirect('/logs');
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).redirect('/dashboard');
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[DASHBOARD ERROR]', err);
  res.status(500).send('Internal server error.');
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[DASHBOARD] Running at http://localhost:${PORT}`);
});

module.exports = { app, setClient };
