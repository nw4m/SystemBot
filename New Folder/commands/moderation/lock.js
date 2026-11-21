const { buildEmbed } = require('../../utils/embedBuilder');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
  name: 'lock',
  aliases: ['lk', 'قفل', 'lock'],
  description: 'Lock a channel so members cannot send messages.',
  usage: '!lock [#channel]',

  async execute(message, args, client) {
    const channel = message.mentions.channels.first() || message.channel;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('lock_confirm').setLabel('Confirm').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('lock_deny').setLabel('Cancel').setStyle(ButtonStyle.Danger),
    );

    const confirmMsg = await message.reply({
      content: `Are you sure you want to lock <#${channel.id}>?`,
      components: [row],
    });

    let interaction;
    try {
      interaction = await confirmMsg.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: (i) => i.user.id === message.author.id,
        time: 30_000,
      });
    } catch {
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('lock_confirm').setLabel('Confirm').setStyle(ButtonStyle.Success).setDisabled(true),
        new ButtonBuilder().setCustomId('lock_deny').setLabel('Cancel').setStyle(ButtonStyle.Danger).setDisabled(true),
      );
      await confirmMsg.edit({ content: 'Lock request timed out.', components: [disabledRow] }).catch(() => {});
      return;
    }

    if (interaction.customId === 'lock_deny') {
      await interaction.update({ content: 'OK', components: [] });
      return;
    }

    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
    } catch (err) {
      const description = err.code === 350005
        ? `Cannot lock <#${channel.id}>.\n\nThis server has **Onboarding** enabled and Discord requires at least one channel where @everyone can read and send messages.`
        : `Failed to lock <#${channel.id}>.\n\`${err.message}\``;
      await interaction.update({
        content: '',
        embeds: [buildEmbed({ title: 'Lock Failed', description, client, guild: message.guild, color: '#ff4444' })],
        components: [],
      });
      return;
    }

    await interaction.update({
      content: '',
      embeds: [buildEmbed({
        title: 'Channel Locked',
        description: `Successfully locked <#${channel.id}>.`,
        fields: [
          { name: 'Channel',   value: `<#${channel.id}>`,        inline: false },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: false },
        ],
        client, guild: message.guild,
      })],
      components: [],
    });
  },
};
