const { buildEmbed } = require('../../utils/embedBuilder');

module.exports = {
  name: 'nickname',
  aliases: ['nick', 'n', 'setnick', '#nick', 'اسم'],
  description: 'Change or reset a member nickname.',
  usage: '!nickname <@user | ID> [new nickname]',

  async execute(message, args, client) {
    const target = message.mentions.members.first()
      || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

    if (!target) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Nickname - Usage Error', description: 'Please mention a user or provide their ID.\nUsage: `!nickname <@user | ID> [new nickname]`', client, guild: message.guild })],
      });
    }

    const newNick = args.slice(message.mentions.users.size ? 1 : 0).join(' ') || null;

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
