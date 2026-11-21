const { buildEmbed } = require('../../utils/embedBuilder');

module.exports = {
  name: 'afk',
  aliases: ['away'],
  description: 'Set your AFK status. Bot will notify anyone who mentions you.',
  usage: '!afk [reason]',

  async execute(message, args, client) {
    const reason = args.join(' ') || 'AFK';
    client.afkUsers.set(message.author.id, { reason, since: Date.now() });

    return message.reply({
      embeds: [buildEmbed({
        title: 'AFK Set',
        description: `You are now AFK.\nAnyone who mentions you will be notified.`,
        fields: [
          { name: 'User',   value: `<@${message.author.id}>`, inline: false },
          { name: 'Reason', value: reason,                     inline: false },
        ],
        client, guild: message.guild,
      })],
    });
  },
};
