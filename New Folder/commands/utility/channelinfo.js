const { buildEmbed } = require('../../utils/embedBuilder');

const channelTypes = {
  0: 'Text Channel', 2: 'Voice Channel', 4: 'Category',
  5: 'Announcement', 10: 'Ann. Thread', 11: 'Public Thread',
  12: 'Private Thread', 13: 'Stage Channel', 15: 'Forum Channel',
};

module.exports = {
  name: 'channelinfo',
  aliases: ['ci'],
  description: 'Show information about a channel.',
  usage: '!channelinfo [#channel]',

  async execute(message, args, client) {
    const channel   = message.mentions.channels.first() || message.channel;
    const createdAt = `<t:${Math.floor(channel.createdAt.getTime() / 1000)}:F>`;
    const type      = channelTypes[channel.type] || `Type ${channel.type}`;

    return message.reply({
      embeds: [buildEmbed({
        title: `Channel Info - #${channel.name}`,
        fields: [
          { name: 'Name',     value: channel.name,                                      inline: true },
          { name: 'ID',       value: channel.id,                                         inline: true },
          { name: 'Type',     value: type,                                                inline: true },
          { name: 'Created',  value: createdAt,                                           inline: false },
          { name: 'Category', value: channel.parent?.name || 'None',                     inline: true },
          { name: 'Position', value: `${channel.position}`,                               inline: true },
          { name: 'Slowmode', value: channel.rateLimitPerUser ? `${channel.rateLimitPerUser}s` : 'Off', inline: true },
          { name: 'NSFW',     value: channel.nsfw ? 'Yes' : 'No',                        inline: true },
          { name: 'Topic',    value: channel.topic || 'No topic set',                    inline: false },
        ],
        client, guild: message.guild,
      })],
    });
  },
};
