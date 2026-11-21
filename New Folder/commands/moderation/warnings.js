const { buildEmbed } = require('../../utils/embedBuilder');
const fs   = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../data/config.json');

module.exports = {
  name: 'warnings',
  aliases: ['warns', 'listwarns'],
  description: 'List all warnings for a member.',
  usage: '!warnings <@user | ID>',

  async execute(message, args, client) {
    const target = message.mentions.members.first()
      || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

    if (!target) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Warnings - Usage Error', description: 'Please mention a user or provide their ID.\nUsage: `!warnings <@user | ID>`', client, guild: message.guild })],
      });
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const userWarnings = config.warnings?.[message.guild.id]?.[target.id] ?? [];

    if (userWarnings.length === 0) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Warnings', description: `**${target.user.username}** has no warnings.`, client, guild: message.guild })],
      });
    }

    const warnList = userWarnings
      .map((w, i) => `**${i + 1}.** ${w.reason}, by <@${w.moderator}>`)
      .join('\n');

    return message.reply({
      embeds: [buildEmbed({
        title: `Warnings for ${target.user.username}`,
        description: warnList,
        fields: [{ name: 'Total', value: `${userWarnings.length}`, inline: false }],
        client, guild: message.guild,
      })],
    });
  },
};
