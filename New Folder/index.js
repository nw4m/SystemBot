require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials, ActivityType, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const fs   = require('fs');
const path = require('path');
const https = require('https');

const { setClient }     = require('./dashboard/server.js');
const { logCommand }    = require('./utils/logger');
const { hasPermission } = require('./utils/permissionCheck');
const { registerEvents, takeSnapshot } = require('./utils/protection');

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

const EMOJI_URL  = 'https://cdn.discordapp.com/emojis/1524310663273517136.webp?size=96&animated=true';
const EMOJI_NAME = 'i_23';

function getDataConfig() {
  const p = path.join(__dirname, 'data/config.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveDataConfig(cfg) {
  const p = path.join(__dirname, 'data/config.json');
  fs.writeFileSync(p, JSON.stringify(cfg, null, 2), 'utf8');
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function ensureBotEmoji() {
  try {
    const config = getDataConfig();

    if (config.emojiId) {
      // verify it still exists via REST
      const existing = await client.rest.get(`/applications/${client.application.id}/emojis`)
        .catch(() => null);
      if (existing?.items?.some(e => e.id === config.emojiId)) {
        console.log(`[EMOJI] Already uploaded (${config.emojiId})`);
        return;
      }
      console.log('[EMOJI] Cached ID not found, re-uploading…');
    }

    const buf     = await fetchBuffer(EMOJI_URL);
    const b64     = `data:image/webp;base64,${buf.toString('base64')}`;
    const created = await client.rest.post(`/applications/${client.application.id}/emojis`, {
      body: { name: EMOJI_NAME, image: b64 },
    });
    config.emojiId = created.id;
    saveDataConfig(config);
    console.log(`[EMOJI] Uploaded successfully (${created.id})`);
  } catch (err) {
    console.error('[EMOJI] Failed to upload emoji:', err.message);
  }
}

client.commands = new Collection();
client.afkUsers = new Map();

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

client.once('ready', async () => {
  console.log(`[BOT] Logged in as ${client.user.tag}`);
  setClient(client);
  registerEvents(client);

  const guild = client.guilds.cache.first();
  if (guild) {
    await takeSnapshot(guild);
    setInterval(() => takeSnapshot(guild), 5 * 60 * 1000);
  }

  // Upload emoji once and cache the ID in data/config.json
  await ensureBotEmoji();

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

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const cfg    = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/config.json'), 'utf8'));
  const prefix = process.env.PREFIX || cfg.prefix || '!';

  if (message.mentions.users.size > 0) {
    for (const [id, afkData] of client.afkUsers) {
      if (message.mentions.users.has(id)) {
        const { buildEmbed } = require('./utils/embedBuilder');
        await message.reply({ embeds: [buildEmbed({
          title: 'AFK Notice',
          description: `<@${id}> is currently AFK.\nReason: **${afkData.reason}**`,
          client, guild: message.guild,
        })] }).catch(() => {});
      }
    }
  }

  if (client.afkUsers.has(message.author.id)) {
    client.afkUsers.delete(message.author.id);
    const { buildEmbed } = require('./utils/embedBuilder');
    await message.reply({ embeds: [buildEmbed({
      title: 'Welcome Back',
      description: `Welcome back, ${message.author.username}! Your AFK status has been removed.`,
      client, guild: message.guild,
    })] }).catch(() => {});
  }

  // Bot mention reply
  const onlyMention = message.mentions.users.has(client.user.id)
    && !message.mentions.everyone
    && message.content.trim().replace(`<@!${client.user.id}>`, '').replace(`<@${client.user.id}>`, '').trim() === '';

  if (onlyMention) {
    const mentionCfg = getDataConfig();
    const emojiStr   = mentionCfg.emojiId ? `<a:${EMOJI_NAME}:${mentionCfg.emojiId}>` : '';

    const container = new ContainerBuilder()
      .setAccentColor(0x160a4d)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `Hello! I'm ${client.user} ${emojiStr}\n\nI was created by <@1037400038629965854>, and this project is open source.\n\nYou can browse the code on [Github](https://github.com/nw4m/SystemBot)`
        )
      );

    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => {});
    return;
  }

  if (!message.content.startsWith(prefix)) return;
  const args      = message.content.slice(prefix.length).trim().split(/ +/);
  const usedAlias = args.shift().toLowerCase();
  const command   = client.commands.get(usedAlias);
  if (!command) return;

  const permitted = await hasPermission(message, command.name, client);

  if (!permitted) {
    logCommand({
      command: command.name, usedAlias, args: args.join(' '),
      userId: message.author.id, username: message.author.tag,
      guildId: message.guild.id, guildName: message.guild.name,
      channelId: message.channel.id, channelName: message.channel.name,
      messageId: message.id, permitted: false, botReply: null,
      success: false, error: 'Permission denied',
    });
    return;
  }

  let botReply = null;
  let success  = true;
  let errorMsg = null;

  try {
    const originalReply = message.reply.bind(message);
    message.reply = async (...replyArgs) => {
      const opts = replyArgs[0];
      if (opts?.embeds?.[0]) {
        const t = opts.embeds[0].data?.title || opts.embeds[0].title || null;
        if (t && !botReply) botReply = t;
      } else if (typeof opts === 'string' && !botReply) {
        botReply = opts.slice(0, 80);
      }
      message.reply = originalReply;
      return originalReply(...replyArgs);
    };
    await command.execute(message, args, client);
  } catch (err) {
    success  = false;
    errorMsg = err?.message || String(err);
    console.error(`[ERROR] Command ${command.name}:`, err);
  }

  logCommand({
    command: command.name, usedAlias, args: args.join(' '),
    userId: message.author.id, username: message.author.tag,
    guildId: message.guild.id, guildName: message.guild.name,
    channelId: message.channel.id, channelName: message.channel.name,
    messageId: message.id, permitted: true, botReply, success, error: errorMsg,
  });
});

client.login(process.env.TOKEN);
