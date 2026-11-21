const { EmbedBuilder } = require('discord.js');
const fs   = require('fs');
const path = require('path');

function buildEmbed({ title, description, fields = [], client, guild, color }) {
  let embedColor = color || '#fd6868';
  try {
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/config.json'), 'utf8'));
    embedColor = color || config.embedColor || '#fd6868';
  } catch {}

  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle(title)
    .setTimestamp();

  if (description) embed.setDescription(description);

  if (client?.user) {
    embed.setAuthor({
      name: client.user.username,
      iconURL: client.user.displayAvatarURL({ dynamic: true }),
    });
  }

  if (guild?.iconURL) {
    const iconURL = guild.iconURL({ dynamic: true });
    if (iconURL) embed.setThumbnail(iconURL);
  }

  embed.setFooter({
    text: `${guild?.name ?? 'Server'} Moderation`,
    iconURL: guild?.iconURL?.({ dynamic: true }) ?? undefined,
  });

  if (fields.length > 0) embed.addFields(fields);

  return embed;
}

function errorEmbed({ description, client, guild }) {
  return buildEmbed({ title: 'Error', description, client, guild, color: '#ff4444' });
}

module.exports = { buildEmbed, errorEmbed };
