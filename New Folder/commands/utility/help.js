const { buildEmbed } = require('../../utils/embedBuilder');
const fs   = require('fs');
const path = require('path');

module.exports = {
  name: 'help',
  aliases: ['h', 'commands'],
  description: 'Show all available commands.',
  usage: '!help [command]',

  async execute(message, args, client) {
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/config.json'), 'utf8'));
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

    const c = (name, aliases) => `\`\`${name}\`\` \`\`(${aliases})\`\``;

    const modText = [
      c('!ban',           'نكح, تف, سيف, إعدام, اعدم, تقليع, تفنيش, تلطيش, كربج, ban'),
      c('!unban',         'إفراج, افراج, اعفاء, unban'),
      c('!kick',          'برا, بره, اطرد, kick'),
      c('!mute',          'اسكت, اخرس, اكتم, mute'),
      c('!unmute',        'اتكلم, unmute'),
      c('!timeout',       'تأديب, تاديب, نام, timeout'),
      c('!untimeout',     'اصحى, اتايب, untimeout'),
      c('!warn',          'w'),
      c('!warnings',      'warns, listwarns'),
      c('!clearwarnings', 'cw, clearwarns'),
      c('!nickname',      'nick, n, setnick, #nick, اسم, nickname'),
      c('!purge',         'clear, c, prune, نظف, تنظيف'),
      c('!lock',          'lk, قفل, lock'),
      c('!unlock',        'ulk, فك, افتحه, unlock'),
      c('!slowmode',      'sm'),
      c('!channelinfo',   'ci, channelinfo'),
      c('!roleadd',       'ra, خد, حط, give'),
      c('!roleremove',    'rr, شيل, هات, remove'),
      c('!role',          'r'),
    ].join('\n');

    const utilText = [
      c('!ping',       'pong'),
      c('!help',       'h, commands'),
      c('!userinfo',   'ui, whois'),
      c('!serverinfo', 'si, guildinfo'),
      c('!avatar',     'av, pfp'),
      c('!botinfo',    'bi, info'),
      c('!afk',        'away'),
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
