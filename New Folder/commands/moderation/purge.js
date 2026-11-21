const { buildEmbed } = require('../../utils/embedBuilder');

module.exports = {
  name: 'purge',
  aliases: ['clear', 'c', 'prune', 'نظف', 'تنظيف'],
  description: 'Delete a number of messages from the channel.',
  usage: '!purge <amount 1-100>',

  async execute(message, args, client) {
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Purge - Usage Error', description: 'Please provide a number between 1 and 100.\nUsage: `!purge <1-100>`', client, guild: message.guild })],
      });
    }

    await message.delete().catch(() => {});
    const deleted = await message.channel.bulkDelete(amount, true).catch(() => null);
    const count   = deleted?.size ?? 0;

    const confirm = await message.channel.send({
      embeds: [buildEmbed({
        title: 'Channel Purged',
        description: `Successfully deleted **${count}** message(s).`,
        fields: [
          { name: 'Channel',   value: `<#${message.channel.id}>`,  inline: false },
          { name: 'Moderator', value: `<@${message.author.id}>`,   inline: false },
          { name: 'Deleted',   value: `${count} messages`,          inline: false },
        ],
        client, guild: message.guild,
      })],
    });

    setTimeout(() => confirm.delete().catch(() => {}), 5000);
  },
};
