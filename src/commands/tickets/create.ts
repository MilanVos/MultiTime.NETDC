import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, TextChannel, ChannelType, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Maak een nieuw support ticket')
    .addStringOption(option =>
        option.setName('reden')
            .setDescription('Waarom maak je een ticket aan?')
            .setRequired(true));

export async function execute(interaction: CommandInteraction) {
    const reason = interaction.options.get('reden')?.value as string;
    const guild = interaction.guild;
    
    if (!guild) return;

    const ticketChannel = await guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
            {
                id: guild.id,
                deny: [PermissionFlagsBits.ViewChannel],
            },
            {
                id: interaction.user.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
        ],
    });

    await ticketChannel.send({
        embeds: [{
            title: '🎫 Nieuw Ticket',
            description: `Ticket aangemaakt door ${interaction.user}\nReden: ${reason}`,
            color: 0x00ff00,
        }],
        components: [{
            type: 1,
            components: [{
                type: 2,
                style: 4,
                label: 'Sluit Ticket',
                custom_id: 'close_ticket',
            }],
        }],
    });

    await interaction.reply({
        content: `Ticket aangemaakt in ${ticketChannel}`,
        ephemeral: true,
    });
}
