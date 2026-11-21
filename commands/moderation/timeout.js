const { buildEmbed } = require('../../utils/embedBuilder');
const ms = require('ms');

const DEFAULT_DURATION     = 10 * 60 * 1000;
const DEFAULT_DURATION_STR = '10m';
const MAX_DURATION         = 28 * 24 * 60 * 60 * 1000;

module.exports = {
  name: 'timeout',
  aliases: ['تأديب', 'تاديب', 'نام', 'timeout'],
  description: 'Timeout a member. Duration defaults to 10 minutes if not provided.',
  usage: '!timeout <@user | ID> [duration] [reason]',

  async execute(message, args, client) {
    const target = message.mentions.members.first()
      || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

    if (!target) {
      return message.reply({
        embeds: [buildEmbed({
          title: 'Timeout - Usage Error',
          description: 'Please mention a user or provide their ID.\nUsage: `!timeout <@user | ID> [duration] [reason]`',
          client, guild: message.guild,
        })],
      });
    }

    if (!target.moderatable) {
      return message.reply({
        embeds: [buildEmbed({
          title: 'Timeout Failed',
          description: `I cannot timeout **${target.user.username}**.`,
          client, guild: message.guild,
        })],
      });
    }

    if (target.roles.highest.position >= message.member.roles.highest.position) {
      return message.reply({
        embeds: [buildEmbed({
          title: 'Timeout Failed',
          description: `You cannot timeout **${target.user.username}**, they have an equal or higher role than you.`,
          client, guild: message.guild,
        })],
      });
    }

    const argOffset = message.mentions.users.size ? 1 : 0;
    const rawDur    = args[argOffset];

    let duration    = DEFAULT_DURATION;
    let durationStr = DEFAULT_DURATION_STR;
    let reasonStart = argOffset;

    if (rawDur) {
      const parsed = ms(rawDur);
      if (parsed && parsed > 0 && parsed <= MAX_DURATION) {
        duration    = parsed;
        durationStr = rawDur;
        reasonStart = argOffset + 1;
      }
    }

    const reason = (args.slice(reasonStart).join(' ') || 'No reason provided.').slice(0, 512);
    await target.timeout(duration, reason);

    return message.reply({
      embeds: [buildEmbed({
        title: 'Member Timed Out',
        description: `Successfully timed out **${target.user.username}**.`,
        fields: [
          { name: 'User',      value: `<@${target.id}>`,         inline: false },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: false },
          { name: 'Duration',  value: durationStr,                inline: false },
          { name: 'Reason',    value: reason,                     inline: false },
        ],
        client, guild: message.guild,
      })],
    });
  },
};
