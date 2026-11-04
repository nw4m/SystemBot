const { buildEmbed } = require('../../utils/embedBuilder');

module.exports = {
  name: 'ping',
  aliases: ['pong'],
  description: 'Check the bot latency.',
  usage: '!ping',

  async execute(message, args, client) {
    const sent = await message.reply({
      embeds: [buildEmbed({ title: 'Pinging...', description: 'Calculating latency...', client, guild: message.guild })],
    });

    const latency    = sent.createdTimestamp - message.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);

    await sent.edit({
      embeds: [buildEmbed({
        title: 'Pong',
        description: 'Bot is online and responsive.',
        fields: [
          { name: 'Bot Latency', value: `${latency}ms`,    inline: true },
          { name: 'API Latency', value: `${apiLatency}ms`, inline: true },
        ],
        client, guild: message.guild,
      })],
    });
  },
};
