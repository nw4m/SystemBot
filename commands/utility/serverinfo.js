const { buildEmbed } = require('../../utils/embedBuilder');

module.exports = {
  name: 'serverinfo',
  aliases: ['si', 'guildinfo'],
  description: 'Show information about the server.',
  usage: '!serverinfo',

  async execute(message, args, client) {
    const guild = message.guild;
    await guild.members.fetch().catch(() => {});

    const owner        = await guild.fetchOwner().catch(() => null);
    const createdAt    = `<t:${Math.floor(guild.createdAt.getTime() / 1000)}:F>`;
    const totalMembers = guild.memberCount;
    const bots         = guild.members.cache.filter(m => m.user.bot).size;
    const humans       = totalMembers - bots;
    const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
    const voiceChannels= guild.channels.cache.filter(c => c.type === 2).size;
    const roles        = guild.roles.cache.size - 1;

    return message.reply({
      embeds: [buildEmbed({
        title: `Server Info - ${guild.name}`,
        description: guild.description || 'No description.',
        fields: [
          { name: 'Owner',        value: owner ? `<@${owner.id}>` : 'Unknown',              inline: true },
          { name: 'Server ID',    value: guild.id,                                            inline: true },
          { name: 'Created',      value: createdAt,                                           inline: false },
          { name: 'Members',      value: `${humans} humans / ${bots} bots / ${totalMembers} total`, inline: false },
          { name: 'Channels',     value: `${textChannels} text / ${voiceChannels} voice`,    inline: true },
          { name: 'Roles',        value: `${roles}`,                                          inline: true },
          { name: 'Boost Level',  value: `Level ${guild.premiumTier}`,                        inline: true },
          { name: 'Boosts',       value: `${guild.premiumSubscriptionCount}`,                 inline: true },
        ],
        client, guild,
      })],
    });
  },
};
