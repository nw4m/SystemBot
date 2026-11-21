const { buildEmbed } = require('../../utils/embedBuilder');
const fs   = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../data/config.json');

function getConfig()     { return JSON.parse(fs.readFileSync(configPath, 'utf8')); }
function saveConfig(cfg) {
  const tmp = configPath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(cfg, null, 2), 'utf8');
  fs.renameSync(tmp, configPath);
}

module.exports = {
  name: 'warn',
  aliases: ['w'],
  description: 'Warn a member.',
  usage: '!warn <@user | ID> [reason]',

  async execute(message, args, client) {
    const target = message.mentions.members.first()
      || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

    if (!target) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Warn - Usage Error', description: 'Please mention a user or provide their ID.\nUsage: `!warn <@user | ID> [reason]`', client, guild: message.guild })],
      });
    }

    const reason = args.slice(1).join(' ') || 'No reason provided.';
    const config = getConfig();

    if (!config.warnings[message.guild.id])          config.warnings[message.guild.id] = {};
    if (!config.warnings[message.guild.id][target.id]) config.warnings[message.guild.id][target.id] = [];

    config.warnings[message.guild.id][target.id].push({
      reason,
      moderator: message.author.id,
      date: new Date().toISOString(),
    });

    saveConfig(config);
    const warnCount = config.warnings[message.guild.id][target.id].length;

    return message.reply({
      embeds: [buildEmbed({
        title: 'Member Warned',
        description: `Successfully warned **${target.user.username}**. They now have **${warnCount}** warning(s).`,
        fields: [
          { name: 'User',           value: `<@${target.id}>`,         inline: false },
          { name: 'Moderator',      value: `<@${message.author.id}>`, inline: false },
          { name: 'Reason',         value: reason,                     inline: false },
          { name: 'Total Warnings', value: `${warnCount}`,             inline: false },
        ],
        client, guild: message.guild,
      })],
    });
  },
};
