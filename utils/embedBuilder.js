const { EmbedBuilder } = require('discord.js');

/**
 * Builds a standard embed matching the BMO style.
 * @param {Object} options
 * @param {string} options.title
 * @param {string} [options.description]
 * @param {Array}  [options.fields]   - [{name, value, inline}]
 * @param {import('discord.js').Client} options.client
 * @param {import('discord.js').Guild}  options.guild
 * @param {string} [options.color]    - hex override
 */
function buildEmbed({ title, description, fields = [], client, guild, color }) {
  const config = require('../config.json');
  const embedColor = color || config.embedColor || '#fd6868';

  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle(title)
    .setTimestamp();

  if (description) embed.setDescription(description);

  // Author = bot name + bot avatar (small icon top-left)
  if (client?.user) {
    embed.setAuthor({
      name: client.user.username,
      iconURL: client.user.displayAvatarURL({ dynamic: true }),
    });
  }

  // Thumbnail = server icon (top-right)
  if (guild?.iconURL) {
    const iconURL = guild.iconURL({ dynamic: true });
    if (iconURL) embed.setThumbnail(iconURL);
  }

  // Footer = "Server Moderation | date"
  embed.setFooter({
    text: `${guild?.name ?? 'Server'} Moderation`,
    iconURL: guild?.iconURL?.({ dynamic: true }) ?? undefined,
  });

  if (fields.length > 0) {
    embed.addFields(fields);
  }

  return embed;
}

/**
 * Sends an error embed (no-permission / wrong usage).
 */
function errorEmbed({ description, client, guild }) {
  return buildEmbed({
    title: 'Error',
    description,
    client,
    guild,
    color: '#ff4444',
  });
}

module.exports = { buildEmbed, errorEmbed };
