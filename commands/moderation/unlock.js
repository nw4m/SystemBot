const { buildEmbed } = require('../../utils/embedBuilder');

module.exports = {
  name: 'unlock',
  aliases: ['ulk', 'فك', 'افتحه', 'unlock'],
  description: 'Unlock a channel so members can send messages again.',
  usage: '!unlock [#channel]',

  async execute(message, args, client) {
    const channel = message.mentions.channels.first() || message.channel;

    await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: null,
    });

    return message.reply({
      embeds: [buildEmbed({
        title: 'Channel Unlocked',
        description: `Successfully unlocked <#${channel.id}>.`,
        fields: [
          { name: 'Channel',   value: `<#${channel.id}>`,         inline: false },
          { name: 'Moderator', value: `<@${message.author.id}>`,  inline: false },
        ],
        client, guild: message.guild,
      })],
    });
  },
};
