const { buildEmbed } = require('../../utils/embedBuilder');
const fs   = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../data/config.json');

module.exports = {
  name: 'clearwarnings',
  aliases: ['cw', 'clearwarns'],
  description: 'Clear all warnings for a member.',
  usage: '!clearwarnings <@user | ID>',

  async execute(message, args, client) {
    const target = message.mentions.members.first()
      || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

    if (!target) {
      return message.reply({
        embeds: [buildEmbed({ title: 'ClearWarnings - Usage Error', description: 'Please mention a user or provide their ID.\nUsage: `!clearwarnings <@user | ID>`', client, guild: message.guild })],
      });
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.warnings?.[message.guild.id]?.[target.id]) {
      config.warnings[message.guild.id][target.id] = [];
      const tmp = configPath + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(config, null, 2), 'utf8');
      fs.renameSync(tmp, configPath);
    }

    return message.reply({
      embeds: [buildEmbed({
        title: 'Warnings Cleared',
        description: `All warnings for **${target.user.username}** have been cleared.`,
        fields: [
          { name: 'User',      value: `<@${target.id}>`,         inline: false },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: false },
        ],
        client, guild: message.guild,
      })],
    });
  },
};
