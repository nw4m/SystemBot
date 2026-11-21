const { buildEmbed } = require('../../utils/embedBuilder');

module.exports = {
  name: 'unban',
  aliases: ['إفراج', 'افراج', 'اعفاء', 'unban'],
  description: 'Unban a user by ID.',
  usage: '!unban <userID> [reason]',

  async execute(message, args, client) {
    const userId = args[0];
    if (!userId) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Unban - Usage Error', description: 'Please provide a user ID.\nUsage: `!unban <userID> [reason]`', client, guild: message.guild })],
      });
    }

    const reason = args.slice(1).join(' ') || 'No reason provided.';
    const ban = await message.guild.bans.fetch(userId).catch(() => null);
    if (!ban) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Unban Failed', description: `No ban found for user ID \`${userId}\`.`, client, guild: message.guild })],
      });
    }

    await message.guild.members.unban(userId, reason);

    return message.reply({
      embeds: [buildEmbed({
        title: 'Member Unbanned',
        description: `Successfully unbanned **${ban.user.username}**.`,
        fields: [
          { name: 'User',      value: `<@${userId}>`,            inline: false },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: false },
          { name: 'Reason',    value: reason,                     inline: false },
        ],
        client, guild: message.guild,
      })],
    });
  },
};
