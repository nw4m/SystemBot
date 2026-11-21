const { buildEmbed } = require('../../utils/embedBuilder');

module.exports = {
  name: 'untimeout',
  aliases: ['اصحى', 'اتايب', 'untimeout'],
  description: 'Remove timeout from a member.',
  usage: '!untimeout <@user | ID> [reason]',

  async execute(message, args, client) {
    const rawTarget = args[0]?.replace(/[<@!>]/g, '') || '';
    const target = rawTarget
      ? await message.guild.members.fetch(rawTarget).catch(() => null)
      : null;

    if (!target) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Untimeout - Usage Error', description: 'Please mention a user or provide their ID.\nUsage: `!untimeout <@user | ID> [reason]`', client, guild: message.guild })],
      });
    }

    if (target.roles.highest.position >= message.member.roles.highest.position) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Untimeout Failed', description: `You cannot remove timeout from **${target.user.username}**, they have an equal or higher role than you.`, client, guild: message.guild })],
      });
    }

    const reason = (args.slice(1).join(' ') || 'No reason provided.').slice(0, 512);
    await target.timeout(null, reason);

    return message.reply({
      embeds: [buildEmbed({
        title: 'Timeout Removed',
        description: `Successfully removed timeout from **${target.user.username}**.`,
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
