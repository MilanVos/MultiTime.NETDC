import { CommandInteraction, SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { Command } from '../structures/Command';
import { BotClient } from '../structures/Client';

export default class ApplyCommand implements Command {
    public name = 'apply';
    public description = 'Solliciteer voor staff';
    
    public data = new SlashCommandBuilder()
        .setName('apply')
        .setDescription('Solliciteer voor staff');

    public async execute(interaction: CommandInteraction): Promise<void> {
        const modal = new ModalBuilder()
            .setCustomId('apply_modal')
            .setTitle('Staff Sollicitatie');

        const nameInput = new TextInputBuilder()
            .setCustomId('name')
            .setLabel('Wat is je naam?')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const ageInput = new TextInputBuilder()
            .setCustomId('age')
            .setLabel('Wat is je leeftijd?')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const experienceInput = new TextInputBuilder()
            .setCustomId('experience')
            .setLabel('Wat is je ervaring?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const motivationInput = new TextInputBuilder()
            .setCustomId('motivation')
            .setLabel('Waarom wil je staff worden?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const availabilityInput = new TextInputBuilder()
            .setCustomId('availability')
            .setLabel('Hoeveel uur per week ben je beschikbaar?')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(ageInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(experienceInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(motivationInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(availabilityInput)
        );

        await interaction.showModal(modal);
    }
}
