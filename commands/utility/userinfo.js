const { buildEmbed } = require('../../utils/embedBuilder');

module.exports = {
  name: 'userinfo',
  aliases: ['ui', 'whois'],
  description: 'Show information about a user.',
  usage: '!userinfo [@user | ID]',

  async execute(message, args, client) {
    const member = message.mentions.members.first()
      || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : message.member);

    if (!member) {
      return message.reply({
        embeds: [buildEmbed({ title: 'User Not Found', description: 'Could not find that user.', client, guild: message.guild })],
      });
    }

    const user      = member.user;
    const joinedAt  = member.joinedAt
      ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:F>`
      : 'Unknown';
    const createdAt = `<t:${Math.floor(user.createdAt.getTime() / 1000)}:F>`;
    const roles     = member.roles.cache
      .filter(r => r.id !== message.guild.id)
      .map(r => `<@&${r.id}>`)
      .join(', ') || 'None';

    return message.reply({
      embeds: [buildEmbed({
        title: `User Info - ${user.username}`,
        description: `<@${user.id}>`,
        fields: [
          { name: 'Username',       value: user.tag,                                                              inline: true },
          { name: 'ID',             value: user.id,                                                               inline: true },
          { name: 'Nickname',       value: member.nickname || 'None',                                            inline: true },
          { name: 'Account Created',value: createdAt,                                                             inline: false },
          { name: 'Joined Server',  value: joinedAt,                                                              inline: false },
          { name: 'Roles',          value: roles.length > 1024 ? roles.substring(0, 1020) + '...' : roles,       inline: false },
        ],
        client, guild: message.guild,
      }).setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))],
    });
  },
};
