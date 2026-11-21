const { buildEmbed } = require('../../utils/embedBuilder');

module.exports = {
  name: 'unmute',
  aliases: ['اتكلم', 'unmute'],
  description: 'Unmute (remove timeout) from a member.',
  usage: '!unmute <@user | ID> [reason]',

  async execute(message, args, client) {
    const target = message.mentions.members.first()
      || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

    if (!target) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Unmute - Usage Error', description: 'Please mention a user or provide their ID.\nUsage: `!unmute <@user | ID> [reason]`', client, guild: message.guild })],
      });
    }

    if (target.roles.highest.position >= message.member.roles.highest.position) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Unmute Failed', description: `You cannot unmute **${target.user.username}**, they have an equal or higher role than you.`, client, guild: message.guild })],
      });
    }

    const reason = (args.slice(1).join(' ') || 'No reason provided.').slice(0, 512);
    await target.timeout(null, reason);

    return message.reply({
      embeds: [buildEmbed({
        title: 'Member Unmuted',
        description: `Successfully unmuted **${target.user.username}**.`,
        fields: [
          { name: 'User',      value: `<@${target.id}>`,         inline: false },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: false },
          { name: 'Reason',    value: reason,                     inline: false },
        ],
        client, guild: message.guild,
      })],
    });
  },
};
