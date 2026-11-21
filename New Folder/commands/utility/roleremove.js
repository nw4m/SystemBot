const { buildEmbed } = require('../../utils/embedBuilder');

module.exports = {
  name: 'roleremove',
  aliases: ['rr', 'شيل', 'هات', 'remove'],
  description: 'Remove a role from a member.',
  usage: '!roleremove <@user | ID> <@role | roleID>',

  async execute(message, args, client) {
    const member = message.mentions.members.first()
      || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

    if (!member) {
      return message.reply({
        embeds: [buildEmbed({ title: 'RoleRemove - Usage Error', description: 'Please mention a member.\nUsage: `!roleremove <@user> <@role>`', client, guild: message.guild })],
      });
    }

    const role = message.mentions.roles.first()
      || (args[1] ? message.guild.roles.cache.get(args[1]) : null);

    if (!role) {
      return message.reply({
        embeds: [buildEmbed({ title: 'RoleRemove - Usage Error', description: 'Please mention a role or provide its ID.\nUsage: `!roleremove <@user> <@role>`', client, guild: message.guild })],
      });
    }

    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply({
        embeds: [buildEmbed({ title: 'RoleRemove Failed', description: 'I cannot remove a role that is higher than or equal to my highest role.', client, guild: message.guild })],
      });
    }

    await member.roles.remove(role);

    return message.reply({
      embeds: [buildEmbed({
        title: 'Role Removed',
        description: `Successfully removed <@&${role.id}> from **${member.user.username}**.`,
        fields: [
          { name: 'User',      value: `<@${member.id}>`,         inline: false },
          { name: 'Role',      value: `<@&${role.id}>`,           inline: false },
          { name: 'Moderator', value: `<@${message.author.id}>`,  inline: false },
        ],
        client, guild: message.guild,
      })],
    });
  },
};
