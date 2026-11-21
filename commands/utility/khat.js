const configStore = require('../../utils/configStore');

module.exports = {
  name: 'خط',
  aliases: ['khat', 'line'],
  description: 'Sends a custom auto-response message configured from the dashboard.',
  usage: '!خط',

  async execute(message, args, client) {
    const config    = configStore.read();
    const khat      = config.khat || {};
    const text      = khat.text      || 'No message configured. Set it from the dashboard.';
    const deleteCmd = khat.deleteCmd ?? false;

    if (deleteCmd) await message.delete().catch(() => {});

    await message.channel.send({ content: text, allowedMentions: { parse: [] } });
  },
};
