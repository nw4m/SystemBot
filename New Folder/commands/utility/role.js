const { buildEmbed } = require('../../utils/embedBuilder');

module.exports = {
  name: 'role',
  aliases: ['r'],
  description: 'Show information about a role.',
  usage: '!role <@role | roleID>',

  async execute(message, args, client) {
    const role = message.mentions.roles.first()
      || (args[0] ? message.guild.roles.cache.get(args[0]) : null);

    if (!role) {
      return message.reply({
        embeds: [buildEmbed({ title: 'Role - Usage Error', description: 'Please mention a role or provide its ID.\nUsage: `!role <@role | roleID>`', client, guild: message.guild })],
      });
    }

    const createdAt   = `<t:${Math.floor(role.createdAt.getTime() / 1000)}:F>`;
    const memberCount = message.guild.members.cache.filter(m => m.roles.cache.has(role.id)).size;

    return message.reply({
      embeds: [buildEmbed({
        title: `Role Info - ${role.name}`,
        fields: [
          { name: 'Name',        value: role.name,                          inline: true },
          { name: 'ID',          value: role.id,                             inline: true },
          { name: 'Color',       value: role.hexColor,                       inline: true },
          { name: 'Position',    value: `${role.position}`,                  inline: true },
          { name: 'Members',     value: `${memberCount}`,                    inline: true },
          { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No',    inline: true },
          { name: 'Hoisted',     value: role.hoist      ? 'Yes' : 'No',     inline: true },
          { name: 'Managed',     value: role.managed    ? 'Yes' : 'No',     inline: true },
          { name: 'Created',     value: createdAt,                           inline: false },
        ],
        client, guild: message.guild,
        color: role.hexColor !== '#000000' ? role.hexColor : undefined,
      })],
    });
  },
};
