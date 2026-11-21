const { buildEmbed } = require('../../utils/embedBuilder');

module.exports = {
  name: 'slowmode',
  aliases: ['sm'],
  description: 'Set slowmode on a channel. Use 0 to disable.',
  usage: '!slowmode <seconds 0-21600> [#channel]',

  async execute(message, args, client) {
    const seconds = parseInt(args[0]);
    if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Slowmode - Usage Error', description: 'Please provide a valid number of seconds (0-21600).\nUsage: `!slowmode <seconds> [#channel]`', client, guild: message.guild })],
      });
    }

    const channel = message.mentions.channels.first() || message.channel;
    await channel.setRateLimitPerUser(seconds);

    return message.reply({
      embeds: [buildEmbed({
        title: 'Slowmode Updated',
        description: seconds === 0
          ? `Slowmode disabled for <#${channel.id}>.`
          : `Slowmode set to **${seconds}s** for <#${channel.id}>.`,
        fields: [
          { name: 'Channel',   value: `<#${channel.id}>`,                          inline: false },
          { name: 'Moderator', value: `<@${message.author.id}>`,                   inline: false },
          { name: 'Duration',  value: seconds === 0 ? 'Disabled' : `${seconds}s`,  inline: false },
        ],
        client, guild: message.guild,
      })],
    });
  },
};
