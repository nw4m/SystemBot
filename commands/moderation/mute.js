const { buildEmbed } = require('../../utils/embedBuilder');

module.exports = {
  name: 'mute',
  aliases: ['اسكت', 'اخرس', 'اكتم', 'mute'],
  description: 'Mute a member (timeout for 28 days).',
  usage: '!mute <@user | ID> [reason]',

  async execute(message, args, client) {
    const rawTarget = args[0]?.replace(/[<@!>]/g, '') || '';
    let target = rawTarget
      ? await message.guild.members.fetch(rawTarget).catch(() => null)
      : null;

    if (!target && message.reference) {
      const replied = await message.fetchReference().catch(() => null);
      if (replied) target = await message.guild.members.fetch(replied.author.id).catch(() => null);
    }

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
    await target.timeout(28 * 24 * 60 * 60 * 1000, reason);

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
