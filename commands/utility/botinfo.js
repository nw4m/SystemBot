const { buildEmbed } = require('../../utils/embedBuilder');

module.exports = {
  name: 'botinfo',
  aliases: ['bi', 'info'],
  description: 'Show information about the bot.',
  usage: '!botinfo',

  async execute(message, args, client) {
    const uptime   = process.uptime();
    const hours    = Math.floor(uptime / 3600);
    const minutes  = Math.floor((uptime % 3600) / 60);
    const seconds  = Math.floor(uptime % 60);
    const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const guilds   = client.guilds.cache.size;
    const users    = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
    const commands = client.commands.size;

    return message.reply({
      embeds: [buildEmbed({
        title: `Bot Info - ${client.user.username}`,
        description: 'A moderation bot built for your server.',
        fields: [
          { name: 'Bot Tag',      value: client.user.tag,                    inline: true },
          { name: 'Bot ID',       value: client.user.id,                     inline: true },
          { name: 'Uptime',       value: `${hours}h ${minutes}m ${seconds}s`, inline: true },
          { name: 'Servers',      value: `${guilds}`,                         inline: true },
          { name: 'Users',        value: `${users}`,                          inline: true },
          { name: 'Commands',     value: `${commands}`,                       inline: true },
          { name: 'Memory Usage', value: `${memUsage} MB`,                    inline: true },
          { name: 'Library',      value: 'discord.js v14',                    inline: true },
          { name: 'Node.js',      value: process.version,                     inline: true },
        ],
        client, guild: message.guild,
      }).setThumbnail(client.user.displayAvatarURL({ dynamic: true }))],
    });
  },
};
