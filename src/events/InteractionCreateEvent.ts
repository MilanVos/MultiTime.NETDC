import { Interaction, ModalSubmitInteraction, TextChannel, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { Event } from '../structures/Event';
import { BotClient } from '../structures/Client';

export default class InteractionCreateEvent extends Event {
    constructor(client: BotClient) {
        super(client, 'interactionCreate');
    }

    public async execute(interaction: Interaction): Promise<void> {
        if (interaction.isChatInputCommand()) {
            const command = this.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction, this.client);
            } catch (error) {
                console.error(error);
                if (!interaction.replied) {
                    await interaction.reply({ content: 'Er is een fout opgetreden!', flags: ['Ephemeral'] });
                }
            }
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'ticket_modal') {
                try {
                    await interaction.deferReply({ ephemeral: true });

                    const category = interaction.fields.getTextInputValue('category');
                    const priority = interaction.fields.getTextInputValue('priority');
                    const description = interaction.fields.getTextInputValue('description');

                    const channel = await this.client.ticketManager.createTicket(
                        interaction.guild!,
                        interaction.user,
                        description,
                        category
                    );

                    await interaction.editReply({
                        content: `Ticket aangemaakt in ${channel}`
                    });
                } catch (error) {
                    console.error(error);
                    await interaction.editReply({
                        content: `${error}`
                    });
                }
            }

            if (interaction.customId.endsWith('_application_reason')) {
                try {
                    await interaction.deferUpdate();
                    
                    const reason = interaction.fields.getTextInputValue('reason');
                    const isAccepted = interaction.customId.startsWith('accept');
                    
                    await this.client.applicationManager.handleResponse(
                        interaction.channel as TextChannel,
                        interaction.user,
                        isAccepted,
                        reason
                    );

                    await interaction.followUp({
                        content: `Sollicitatie ${isAccepted ? 'geaccepteerd' : 'afgewezen'}! De kandidaat is op de hoogte gebracht.`,
                        flags: ['Ephemeral']
                    });
                } catch (error) {
                    console.error(error);
                    await interaction.followUp({
                        content: 'Er is een fout opgetreden bij het verwerken van de sollicitatie.',
                        flags: ['Ephemeral']
                    });
                }
            }
        }

        if (interaction.isButton()) {
            if (interaction.customId === 'accept_application' || interaction.customId === 'reject_application') {
                const modal = new ModalBuilder()
                    .setCustomId(`${interaction.customId}_reason`)
                    .setTitle(interaction.customId === 'accept_application' ? 'Accepteer Sollicitatie' : 'Wijs Sollicitatie Af');

                const reasonInput = new TextInputBuilder()
                    .setCustomId('reason')
                    .setLabel('Reden')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput)
                );

                await interaction.showModal(modal);
                return;
            }

            await interaction.deferReply({ ephemeral: true });
            
            switch (interaction.customId) {
                case 'close_ticket':
                    await this.client.ticketManager.closeTicket(interaction.channel as TextChannel, interaction.user);
                    await interaction.editReply({ content: 'Ticket wordt gesloten...' });
                    break;
                case 'claim_ticket':
                    await this.client.ticketManager.claimTicket(interaction.channel as TextChannel, interaction.user);
                    await interaction.editReply({ content: 'Ticket geclaimd!' });
                    break;
                case 'transcript_ticket':
                    await this.client.ticketManager.createTranscript(interaction.channel as TextChannel);
                    await interaction.editReply({ content: 'Transcript gemaakt!' });
                    break;
            }
        
}

if (interaction.isModalSubmit() && interaction.customId === 'apply_modal') {
    try {
        await interaction.deferReply({ ephemeral: true });

        const formData = {
            name: interaction.fields.getTextInputValue('name'),
            age: interaction.fields.getTextInputValue('age'),
            experience: interaction.fields.getTextInputValue('experience'),
            motivation: interaction.fields.getTextInputValue('motivation'),
            availability: interaction.fields.getTextInputValue('availability')
        };

        const channel = await this.client.applicationManager.createApplication(
            interaction.guild!,
            interaction.user,
            formData
        );

        await interaction.editReply({
            content: `Je sollicitatie is ingediend in ${channel}`
        });
    } catch (error) {
        console.error(error);
        await interaction.editReply({
            content: `${error}`
        });
    }
}
    }
}