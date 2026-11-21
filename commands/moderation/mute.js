const { buildEmbed } = require('../../utils/embedBuilder');

module.exports = {
  name: 'mute',
  aliases: ['اسكت', 'اخرس', 'اكتم', 'mute'],
  description: 'Mute a member (timeout for 28 days).',
  usage: '!mute <@user | ID> [reason]',

  async execute(message, args, client) {
    const target = message.mentions.members.first()
      || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

    if (!target) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Mute - Usage Error', description: 'Please mention a user or provide their ID.\nUsage: `!mute <@user | ID> [reason]`', client, guild: message.guild })],
      });
    }

    if (!target.moderatable) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Mute Failed', description: `I cannot mute **${target.user.username}**.`, client, guild: message.guild })],
      });
    }

    if (target.roles.highest.position >= message.member.roles.highest.position) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Mute Failed', description: `You cannot mute **${target.user.username}**, they have an equal or higher role than you.`, client, guild: message.guild })],
      });
    }

    const reason = (args.slice(1).join(' ') || 'No reason provided.').slice(0, 512);

    return message.reply({
      embeds: [buildEmbed({
        title: 'Member Muted',
        description: `Successfully muted **${target.user.username}**.`,
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
