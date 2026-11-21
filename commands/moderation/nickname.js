const { buildEmbed } = require('../../utils/embedBuilder');

module.exports = {
  name: 'nickname',
  aliases: ['nick', 'n', 'setnick', '#nick', 'اسم'],
  description: 'Change or reset a member nickname.',
  usage: '!nickname <@user | ID> [new nickname]',

  async execute(message, args, client) {
    const rawTarget = args[0]?.replace(/[<@!>]/g, '') || '';
    let target = rawTarget
      ? await message.guild.members.fetch(rawTarget).catch(() => null)
      : null;

    if (!target && message.reference) {
      const replied = await message.fetchReference().catch(() => null);
      if (replied) target = await message.guild.members.fetch(replied.author.id).catch(() => null);
    }

    const newNick = args.slice(rawTarget ? 1 : 0).join(' ') || null;

    if (!target) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Nickname - Usage Error', description: 'Please mention a user or provide their ID.\nUsage: `!nickname <@user | ID> [new nickname]`', client, guild: message.guild })],
      });
    }

    if (!target.manageable) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Nickname Failed', description: `I cannot change the nickname of **${target.user.username}**.`, client, guild: message.guild })],
      });
    }

    if (target.roles.highest.position >= message.member.roles.highest.position) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Nickname Failed', description: `You cannot change the nickname of **${target.user.username}**, they have an equal or higher role than you.`, client, guild: message.guild })],
      });
    }

    await target.setNickname(newNick);

    return message.reply({
      embeds: [buildEmbed({
        title: 'Nickname Updated',
        description: newNick
          ? `Changed **${target.user.username}**'s nickname to **${newNick}**.`
          : `Reset **${target.user.username}**'s nickname.`,
        fields: [
          { name: 'User',         value: `<@${target.id}>`,         inline: false },
          { name: 'Moderator',    value: `<@${message.author.id}>`, inline: false },
          { name: 'New Nickname', value: newNick || 'Reset to default', inline: false },
        ],
        client, guild: message.guild,
      })],
    });
  },
};
