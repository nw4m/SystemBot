require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials, ActivityType } = require('discord.js');
const fs   = require('fs');
const path = require('path');

const { setClient }   = require('./dashboard/server.js');
const { logCommand }  = require('./utils/logger');
const { hasPermission } = require('./utils/permissionCheck');

// ─── Discord Client ───────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

client.commands = new Collection();
client.afkUsers  = new Map();

// ─── Load Commands ────────────────────────────────────────────────────────────
const commandFolders = ['moderation', 'utility'];
for (const folder of commandFolders) {
  const folderPath = path.join(__dirname, 'commands', folder);
  if (!fs.existsSync(folderPath)) continue;
  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const command = require(path.join(folderPath, file));
    if (command.name) {
      client.commands.set(command.name, command);
      if (command.aliases) {
        for (const alias of command.aliases) {
          client.commands.set(alias, command);
        }
      }
    }
  }
}

// ─── Ready ────────────────────────────────────────────────────────────────────
client.once('ready', () => {
  console.log(`[BOT] Logged in as ${client.user.tag}`);
  setClient(client);

  const statuses = ['مشاكس', 'idk', 'بص هقولك', 'لا'];
  let i = 0;

  client.user.setPresence({
    activities: [{ name: statuses[0], type: ActivityType.Custom }],
    status: 'idle',
  });

  setInterval(() => {
    i = (i + 1) % statuses.length;
    client.user.setPresence({
      activities: [{ name: statuses[i], type: ActivityType.Custom }],
      status: 'idle',
    });
  }, 7000);
});

// ─── Message Handler ──────────────────────────────────────────────────────────
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const config  = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'data/config.json'), 'utf8'));
  const prefix  = process.env.PREFIX || config.prefix || '!';

  // AFK: notify when someone mentions an AFK user
  if (message.mentions.users.size > 0) {
    for (const [id, afkData] of client.afkUsers) {
      if (message.mentions.users.has(id)) {
        const { buildEmbed } = require('./utils/embedBuilder');
        const embed = buildEmbed({
          title: 'AFK Notice',
          description: `<@${id}> is currently AFK.\nReason: **${afkData.reason}**`,
          client,
          guild: message.guild,
        });
        await message.reply({ embeds: [embed] }).catch(() => {});
      }
    }
  }

  // AFK: remove status when the AFK user speaks
  if (client.afkUsers.has(message.author.id)) {
    client.afkUsers.delete(message.author.id);
    const { buildEmbed } = require('./utils/embedBuilder');
    const embed = buildEmbed({
      title: 'Welcome Back',
      description: `Welcome back, ${message.author.username}! Your AFK status has been removed.`,
      client,
      guild: message.guild,
    });
    await message.reply({ embeds: [embed] }).catch(() => {});
  }

  if (!message.content.startsWith(prefix)) return;

  const args        = message.content.slice(prefix.length).trim().split(/ +/);
  const usedAlias   = args.shift().toLowerCase();           // what the user actually typed
  const command     = client.commands.get(usedAlias);
  if (!command) return;

  // ── Permission check (done centrally here to enable logging) ────────────────
  const permitted = await hasPermission(message, command.name, client);

  if (!permitted) {
    // Silent — no reply, but we still log the denied attempt
    logCommand({
      command:     command.name,
      usedAlias,
      args:        args.join(' '),
      userId:      message.author.id,
      username:    message.author.tag,
      guildId:     message.guild.id,
      guildName:   message.guild.name,
      channelId:   message.channel.id,
      channelName: message.channel.name,
      messageId:   message.id,
      permitted:   false,
      botReply:    null,
      success:     false,
      error:       'Permission denied',
    });
    return;
  }

  // ── Execute ──────────────────────────────────────────────────────────────────
  let botReply = null;
  let success  = true;
  let errorMsg = null;

  try {
    // Monkey-patch message.reply once to capture first bot reply summary
    const originalReply = message.reply.bind(message);
    message.reply = async (...replyArgs) => {
      // Extract embed title as summary if available
      const opts = replyArgs[0];
      if (opts?.embeds?.[0]) {
        const t = opts.embeds[0].data?.title || opts.embeds[0].title || null;
        if (t && !botReply) botReply = t;
      } else if (typeof opts === 'string' && !botReply) {
        botReply = opts.slice(0, 80);
      }
      message.reply = originalReply; // restore after first use
      return originalReply(...replyArgs);
    };

    await command.execute(message, args, client);
  } catch (err) {
    success  = false;
    errorMsg = err?.message || String(err);
    console.error(`[ERROR] Command ${command.name}:`, err);
  }

  logCommand({
    command:     command.name,
    usedAlias,
    args:        args.join(' '),
    userId:      message.author.id,
    username:    message.author.tag,
    guildId:     message.guild.id,
    guildName:   message.guild.name,
    channelId:   message.channel.id,
    channelName: message.channel.name,
    messageId:   message.id,
    permitted:   true,
    botReply,
    success,
    error:       errorMsg,
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────
client.login(process.env.TOKEN);
