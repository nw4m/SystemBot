const { buildEmbed } = require('../../utils/embedBuilder');

module.exports = {
  name: 'avatar',
  aliases: ['av', 'pfp'],
  description: 'Show a user avatar.',
  usage: '!avatar [@user | ID]',

  async execute(message, args, client) {
    const member = message.mentions.members.first()
      || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : message.member);

    const user      = member?.user || message.author;
    const avatarURL = user.displayAvatarURL({ dynamic: true, size: 1024 });

    return message.reply({
      embeds: [buildEmbed({
        title: `${user.username}'s Avatar`,
        description: `[Open in browser](${avatarURL})`,
        client, guild: message.guild,
      }).setImage(avatarURL)],
    });
  },
};
