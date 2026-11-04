const { buildEmbed } = require('../../utils/embedBuilder');

module.exports = {
  name: 'roleadd',
  aliases: ['ra', 'خد', 'حط', 'give'],
  description: 'Add a role to a member.',
  usage: '!roleadd <@user | ID> <@role | roleID>',

  async execute(message, args, client) {
    const member = message.mentions.members.first()
      || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

    if (!member) {
      return message.reply({
        embeds: [buildEmbed({ title: 'RoleAdd - Usage Error', description: 'Please mention a member.\nUsage: `!roleadd <@user> <@role>`', client, guild: message.guild })],
      });
    }

    const role = message.mentions.roles.first()
      || (args[1] ? message.guild.roles.cache.get(args[1]) : null);

    if (!role) {
      return message.reply({
        embeds: [buildEmbed({ title: 'RoleAdd - Usage Error', description: 'Please mention a role or provide its ID.\nUsage: `!roleadd <@user> <@role>`', client, guild: message.guild })],
      });
    }

    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply({
        embeds: [buildEmbed({ title: 'RoleAdd Failed', description: 'I cannot assign a role that is higher than or equal to my highest role.', client, guild: message.guild })],
      });
    }

    await member.roles.add(role);

    return message.reply({
      embeds: [buildEmbed({
        title: 'Role Added',
        description: `Successfully added <@&${role.id}> to **${member.user.username}**.`,
        fields: [
          { name: 'User',      value: `<@${member.id}>`,        inline: false },
          { name: 'Role',      value: `<@&${role.id}>`,          inline: false },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: false },
        ],
        client, guild: message.guild,
      })],
    });
  },
};
