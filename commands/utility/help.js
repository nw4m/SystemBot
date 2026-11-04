const { buildEmbed } = require('../../utils/embedBuilder');

module.exports = {
  name: 'help',
  aliases: ['h', 'commands'],
  description: 'Show all available commands.',
  usage: '!help [command]',

  async execute(message, args, client) {
    const config = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../../data/config.json'), 'utf8'));
    const prefix = process.env.PREFIX || config.prefix || '!';

    if (args[0]) {
      const cmd = client.commands.get(args[0].toLowerCase());
      if (!cmd) {
        return message.reply({
          embeds: [buildEmbed({
            title: 'Help - Command Not Found',
            description: `No command found for \`${args[0]}\`.`,
            client, guild: message.guild,
          })],
        });
      }
      return message.reply({
        embeds: [buildEmbed({
          title: `Command: ${cmd.name}`,
          description: cmd.description || 'No description.',
          fields: [
            { name: 'Usage',   value: `\`${cmd.usage || prefix + cmd.name}\``, inline: false },
            { name: 'Aliases', value: cmd.aliases?.join(', ') || 'None',        inline: false },
          ],
          client, guild: message.guild,
        })],
      });
    }

    const modText = [
      `!ban (نكح, تف, سيف, إعدام, اعدم, تقليع, تفنيش, تلطيش, كربج, ban)`,
      `!unban (إفراج, افراج, اعفاء, unban)`,
      `!kick (برا, بره, اطرد, kick)`,
      `!mute (اسكت, اخرس, اكتم, mute)`,
      `!unmute (اتكلم, unmute)`,
      `!timeout (تأديب, تاديب, نام, timeout)`,
      `!untimeout (اصحى, اتايب, untimeout)`,
      `!warn (w)`,
      `!warnings (warns, listwarns)`,
      `!clearwarnings (cw, clearwarns)`,
      `!nickname (nick, n, setnick, #nick, اسم, nickname)`,
      `!purge (clear, c, prune, نظف, تنظيف)`,
      `!lock (lk, قفل, lock)`,
      `!unlock (ulk, فك, افتحه, unlock)`,
      `!slowmode (sm)`,
      `!channelinfo (ci, channelinfo)`,
      `!roleadd (ra, خد, حط, give)`,
      `!roleremove (rr, شيل, هات, remove)`,
      `!role (r)`,
    ].join('\n');

    const utilText = [
      `!ping (pong)`,
      `!help (h, commands)`,
      `!userinfo (ui, whois)`,
      `!serverinfo (si, guildinfo)`,
      `!avatar (av, pfp)`,
      `!botinfo (bi, info)`,
      `!afk (away)`,
    ].join('\n');

    return message.reply({
      embeds: [buildEmbed({
        title: 'Prefix Commands',
        description: `Prefix: \`${prefix}\` — type \`${prefix}help <command>\` for details.`,
        fields: [
          { name: 'Moderation', value: modText,  inline: false },
          { name: 'Utility',    value: utilText, inline: false },
        ],
        client, guild: message.guild,
      })],
    });
  },
};
