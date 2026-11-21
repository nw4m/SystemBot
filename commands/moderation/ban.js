const { buildEmbed } = require('../../utils/embedBuilder');

module.exports = {
  name: 'ban',
  aliases: ['نكح', 'تف', 'سيف', 'إعدام', 'اعدم', 'تقليع', 'تفنيش', 'تلطيش', 'كربج', 'ban'],
  description: 'Ban a member from the server.',
  usage: '!ban <@user | ID> [reason]',

  async execute(message, args, client) {
    const target = message.mentions.members.first()
      || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

    if (!target) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Ban - Usage Error', description: 'Please mention a user or provide their ID.\nUsage: `!ban <@user | ID> [reason]`', client, guild: message.guild })],
      });
    }

    if (!target.bannable) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Ban Failed', description: `I cannot ban **${target.user.username}**. They may have a higher role than me.`, client, guild: message.guild })],
      });
    }

    if (target.roles.highest.position >= message.member.roles.highest.position) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Ban Failed', description: `You cannot ban **${target.user.username}**, they have an equal or higher role than you.`, client, guild: message.guild })],
      });
    }

    const reason = (args.slice(1).join(' ') || 'No reason provided.').slice(0, 512);

    return message.reply({
      embeds: [buildEmbed({
        title: 'Member Banned',
        description: `Successfully banned **${target.user.username}**.`,
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
