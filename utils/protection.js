const fs   = require('fs');
const path = require('path');
const ms   = require('ms');

const configPath   = path.join(__dirname, '../data/config.json');
const snapshotPath = path.join(__dirname, '../data/snapshot.json');

function getConfig() {
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function getSnapshot() {
  try {
    if (!fs.existsSync(snapshotPath)) return null;
    return JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  } catch { return null; }
}

function saveSnapshot(data) {
  const dir = path.dirname(snapshotPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(snapshotPath, JSON.stringify(data, null, 2), 'utf8');
}

async function takeSnapshot(guild) {
  try {
    const cfg = getConfig();
    if (!cfg.protection?.antiNuke?.enabled) return;
    const roles    = [];
    const channels = [];

    for (const [, role] of guild.roles.cache) {
      if (role.managed || role.id === guild.id) continue;
      roles.push({
        id:          role.id,
        name:        role.name,
        color:       role.color,
        hoist:       role.hoist,
        mentionable: role.mentionable,
        permissions: role.permissions.bitfield.toString(),
        position:    role.position,
      });
    }

    for (const [, ch] of guild.channels.cache) {
      const overwrites = [];
      for (const [, ow] of ch.permissionOverwrites.cache) {
        overwrites.push({
          id:    ow.id,
          type:  ow.type,
          allow: ow.allow.bitfield.toString(),
          deny:  ow.deny.bitfield.toString(),
        });
      }
      channels.push({
        id:         ch.id,
        name:       ch.name,
        type:       ch.type,
        position:   ch.position,
        parentId:   ch.parentId || null,
        topic:      ch.topic   || null,
        nsfw:       ch.nsfw    || false,
        overwrites,
      });
    }

    saveSnapshot({ guildId: guild.id, timestamp: Date.now(), roles, channels });
  } catch {}
}

async function restoreRole(guild, snap) {
  try {
    const existing = guild.roles.cache.get(snap.id);
    const data = {
      name:        snap.name,
      color:       snap.color,
      hoist:       snap.hoist,
      mentionable: snap.mentionable,
      permissions: BigInt(snap.permissions),
      position:    snap.position,
    };
    if (existing) {
      await existing.edit(data).catch(() => {});
    } else {
      await guild.roles.create(data).catch(() => {});
    }
  } catch {}
}

async function restoreChannel(guild, snap) {
  try {
    const { ChannelType, OverwriteType } = require('discord.js');
    const existing = guild.channels.cache.get(snap.id);
    const overwrites = snap.overwrites.map(ow => ({
      id:    ow.id,
      type:  ow.type,
      allow: BigInt(ow.allow),
      deny:  BigInt(ow.deny),
    }));

    if (existing) {
      await existing.edit({
        name:                 snap.name,
        position:             snap.position,
        parent:               snap.parentId,
        topic:                snap.topic,
        nsfw:                 snap.nsfw,
        permissionOverwrites: overwrites,
      }).catch(() => {});
    } else {
      await guild.channels.create({
        name:                 snap.name,
        type:                 snap.type,
        position:             snap.position,
        parent:               snap.parentId,
        topic:                snap.topic,
        nsfw:                 snap.nsfw,
        permissionOverwrites: overwrites,
      }).catch(() => {});
    }
  } catch {}
}

const trackers = new Map();

function track(key, windowMs) {
  const now = Date.now();
  if (!trackers.has(key)) trackers.set(key, []);
  const times = trackers.get(key).filter(t => now - t < windowMs);
  times.push(now);
  trackers.set(key, times);
  return times.length;
}

function resetTracker(key) {
  trackers.delete(key);
}

function isWhitelisted(config, userId, member, isBot) {
  const wl = config.protection?.whitelist || {};
  if (wl.users?.includes(userId)) return true;
  if (isBot && wl.bots?.includes(userId)) return true;
  if (member && wl.roles?.length > 0) {
    if (wl.roles.some(rid => member.roles?.cache?.has(rid))) return true;
  }
  return false;
}

async function sendLog(client, config, embed) {
  const channelId = config.protection?.logChannel;
  if (!channelId) return;
  try {
    const ch = await client.channels.fetch(channelId).catch(() => null);
    if (ch) await ch.send({ embeds: [embed] }).catch(() => {});
  } catch {}
}

async function punish(member, action, timeoutDuration, reason) {
  if (!member) return;
  try {
    if (action === 'ban') {
      if (member.bannable) await member.ban({ reason });
    } else if (action === 'kick') {
      if (member.kickable) await member.kick(reason);
    } else if (action === 'timeout') {
      if (member.moderatable) {
        const dur = ms(timeoutDuration || '1h') || 3600000;
        await member.timeout(dur, reason);
      }
    }
  } catch {}
}

function buildEmbed(color, title, fields) {
  const { EmbedBuilder } = require('discord.js');
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setTimestamp();
  if (fields?.length) embed.addFields(fields);
  return embed;
}

async function handleNukeEvent(client, guild, userId, featureKey, reason, restoreTarget) {
  const config = getConfig();
  const prot   = config.protection;
  if (!prot?.antiNuke?.enabled) return;

  const feature = prot.antiNuke[featureKey];
  if (!feature?.enabled) return;

  let member = null;
  try { member = await guild.members.fetch(userId).catch(() => null); } catch {}

  if (userId === guild.members.me?.id) return;

  const isBot = member?.user?.bot || false;
  if (isWhitelisted(config, userId, member, isBot)) return;

  const windowMs = (feature.seconds || 10) * 1000;
  const count    = track(`${featureKey}:${userId}`, windowMs);

  if (count >= (feature.count || 3)) {
    resetTracker(`${featureKey}:${userId}`);
    await punish(member, feature.action, feature.timeoutDuration, reason);
    if (restoreTarget) await restoreTarget(guild);

    const embed = buildEmbed('#ff4444', 'Anti-Nuke Triggered', [
      { name: 'Event',    value: featureKey,                 inline: true },
      { name: 'User',     value: `<@${userId}> (${userId})`, inline: true },
      { name: 'Action',   value: feature.action,             inline: true },
      { name: 'Restored', value: restoreTarget ? 'Yes' : 'No', inline: true },
      { name: 'Reason',   value: reason,                     inline: false },
    ]);
    await sendLog(client, config, embed);
  }
}

async function onChannelDelete(client, channel) {
  if (!channel.guild) return;
  const executor = await getAuditExecutor(channel.guild, 12);
  if (!executor) return;
  const snap = getSnapshot();
  const snapCh = snap?.channels?.find(c => c.id === channel.id);
  await handleNukeEvent(client, channel.guild, executor, 'channelDelete', 'Mass channel deletion detected',
    snapCh ? (guild) => restoreChannel(guild, snapCh) : null
  );
}

async function onChannelCreate(client, channel) {
  if (!channel.guild) return;
  const executor = await getAuditExecutor(channel.guild, 10);
  if (!executor) return;
  await handleNukeEvent(client, channel.guild, executor, 'channelCreate', 'Mass channel creation detected', null);
}

async function onChannelEdit(client, oldChannel, newChannel) {
  if (!newChannel.guild) return;
  const executor = await getAuditExecutor(newChannel.guild, 11);
  if (!executor) return;
  const snap = getSnapshot();
  const snapCh = snap?.channels?.find(c => c.id === newChannel.id);
  await handleNukeEvent(client, newChannel.guild, executor, 'channelEdit', 'Mass channel edit detected',
    snapCh ? (guild) => restoreChannel(guild, snapCh) : null
  );
}

async function onRoleDelete(client, role) {
  if (!role.guild) return;
  const executor = await getAuditExecutor(role.guild, 32);
  if (!executor) return;
  const snap = getSnapshot();
  const snapRole = snap?.roles?.find(r => r.id === role.id);
  await handleNukeEvent(client, role.guild, executor, 'roleDelete', 'Mass role deletion detected',
    snapRole ? (guild) => restoreRole(guild, snapRole) : null
  );
}

async function onRoleCreate(client, role) {
  if (!role.guild) return;
  const executor = await getAuditExecutor(role.guild, 30);
  if (!executor) return;
  await handleNukeEvent(client, role.guild, executor, 'roleCreate', 'Mass role creation detected', null);
}

async function onRoleEdit(client, oldRole, newRole) {
  if (!newRole.guild) return;
  const executor = await getAuditExecutor(newRole.guild, 31);
  if (!executor) return;
  const snap = getSnapshot();
  const snapRole = snap?.roles?.find(r => r.id === newRole.id);
  await handleNukeEvent(client, newRole.guild, executor, 'roleEdit', 'Mass role edit detected',
    snapRole ? (guild) => restoreRole(guild, snapRole) : null
  );
}

async function onGuildBanAdd(client, ban) {
  const executor = await getAuditExecutor(ban.guild, 22);
  if (!executor) return;
  await handleNukeEvent(client, ban.guild, executor, 'massBan', 'Mass ban detected', null);
}

async function onMemberRemove(client, member) {
  const logs = await member.guild.fetchAuditLogs({ limit: 1, type: 20 }).catch(() => null);
  if (!logs) return;
  const entry = logs.entries.first();
  if (!entry) return;
  if (Date.now() - entry.createdTimestamp > 3000) return;
  if (entry.target?.id !== member.id) return;
  const executor = entry.executor?.id;
  if (!executor) return;
  await handleNukeEvent(client, member.guild, executor, 'massKick', 'Mass kick detected', null);
}

async function onWebhookUpdate(client, channel) {
  if (!channel.guild) return;
  const executor = await getAuditExecutor(channel.guild, 50);
  if (!executor) return;
  await handleNukeEvent(client, channel.guild, executor, 'webhookCreate', 'Mass webhook creation detected', null);
}

async function onMemberAdd(client, member) {
  const config = getConfig();
  const prot   = config.protection;
  if (!prot?.antiRaid?.enabled) return;

  const isBot = member.user.bot;
  if (isWhitelisted(config, member.id, member, isBot)) return;

  const raid = prot.antiRaid;

  if (raid.joinRate?.enabled) {
    const windowMs = (raid.joinRate.seconds || 10) * 1000;
    const count    = track(`joinRate:${member.guild.id}`, windowMs);

    if (count >= (raid.joinRate.count || 5)) {
      resetTracker(`joinRate:${member.guild.id}`);
      await punish(member, raid.joinRate.action, raid.joinRate.timeoutDuration, 'Anti-Raid: Join rate exceeded');

      const embed = buildEmbed('#ff9900', 'Anti-Raid Triggered', [
        { name: 'Type',   value: 'Join Rate',                      inline: true },
        { name: 'User',   value: `<@${member.id}> (${member.id})`, inline: true },
        { name: 'Action', value: raid.joinRate.action,              inline: true },
      ]);
      await sendLog(client, config, embed);
    }
  }

  if (raid.accountAge?.enabled) {
    const ageDays = (Date.now() - member.user.createdTimestamp) / 86400000;
    if (ageDays < (raid.accountAge.days || 7)) {
      await punish(member, raid.accountAge.action, raid.accountAge.timeoutDuration, 'Anti-Raid: Account too new');

      const embed = buildEmbed('#ff9900', 'Anti-Raid Triggered', [
        { name: 'Type',        value: 'New Account',                     inline: true },
        { name: 'User',        value: `<@${member.id}> (${member.id})`,  inline: true },
        { name: 'Account Age', value: `${ageDays.toFixed(1)} days`,       inline: true },
        { name: 'Action',      value: raid.accountAge.action,             inline: true },
      ]);
      await sendLog(client, config, embed);
    }
  }
}

async function getAuditExecutor(guild, actionType) {
  try {
    const logs = await guild.fetchAuditLogs({ limit: 1, type: actionType }).catch(() => null);
    if (!logs) return null;
    const entry = logs.entries.first();
    if (!entry) return null;
    if (Date.now() - entry.createdTimestamp > 5000) return null;
    return entry.executor?.id || null;
  } catch {
    return null;
  }
}

function registerEvents(client) {
  client.on('channelDelete',     ch         => onChannelDelete(client, ch));
  client.on('channelCreate',     ch         => onChannelCreate(client, ch));
  client.on('channelUpdate',     (old, nw)  => onChannelEdit(client, old, nw));
  client.on('roleDelete',        role       => onRoleDelete(client, role));
  client.on('roleCreate',        role       => onRoleCreate(client, role));
  client.on('roleUpdate',        (old, nw)  => onRoleEdit(client, old, nw));
  client.on('guildBanAdd',       ban        => onGuildBanAdd(client, ban));
  client.on('guildMemberRemove', member     => onMemberRemove(client, member));
  client.on('webhookUpdate',     ch         => onWebhookUpdate(client, ch));
  client.on('guildMemberAdd',    member     => onMemberAdd(client, member));
}

module.exports = { registerEvents, takeSnapshot };
