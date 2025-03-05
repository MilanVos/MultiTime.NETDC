import { CommandInteraction, SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { Command } from '../structures/Command';
import { BotClient } from '../structures/Client';

export default class TicketCommand implements Command {
    public name = 'ticket';
    public description = 'Maak een nieuw support ticket';
    
    public data = new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Maak een nieuw support ticket');

    public async execute(interaction: CommandInteraction): Promise<void> {
        if (!interaction.isRepliable()) return;

        const modal = new ModalBuilder()
            .setCustomId('ticket_modal')
            .setTitle('Nieuw Support Ticket');

        const categoryInput = new TextInputBuilder()
            .setCustomId('category')
            .setLabel('Categorie')
            .setPlaceholder('Support/Bug/Question/Other')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const priorityInput = new TextInputBuilder()
            .setCustomId('priority')
            .setLabel('Prioriteit')
            .setPlaceholder('LOW/MEDIUM/HIGH/URGENT')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Beschrijf je probleem')
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(10)
            .setMaxLength(1000)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(categoryInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(priorityInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput)
        );

        await interaction.showModal(modal);
    }
}