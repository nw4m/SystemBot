const { buildEmbed } = require('../../utils/embedBuilder');

module.exports = {
  name: 'kick',
  aliases: ['برا', 'بره', 'اطرد', 'kick'],
  description: 'Kick a member from the server.',
  usage: '!kick <@user | ID> [reason]',

  async execute(message, args, client) {
    const rawTarget = args[0]?.replace(/[<@!>]/g, '') || '';
    const target = (rawTarget ? await message.guild.members.fetch(rawTarget).catch(() => null) : null)
      || message.mentions.members.first();

    if (!target) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Kick - Usage Error', description: 'Please mention a user or provide their ID.\nUsage: `!kick <@user | ID> [reason]`', client, guild: message.guild })],
      });
    }

    if (!target.kickable) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Kick Failed', description: `I cannot kick **${target.user.username}**.`, client, guild: message.guild })],
      });
    }

    if (target.roles.highest.position >= message.member.roles.highest.position) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Kick Failed', description: `You cannot kick **${target.user.username}**, they have an equal or higher role than you.`, client, guild: message.guild })],
      });
    }

    const reason = (args.slice(1).join(' ') || 'No reason provided.').slice(0, 512);
    await target.kick(reason);

    return message.reply({
      embeds: [buildEmbed({
        title: 'Member Kicked',
        description: `Successfully kicked **${target.user.username}**.`,
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
