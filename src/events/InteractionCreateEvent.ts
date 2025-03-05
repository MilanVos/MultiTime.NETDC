import { Interaction, ModalSubmitInteraction, TextChannel } from 'discord.js';
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

        if (interaction.isModalSubmit() && interaction.customId === 'ticket_modal') {
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

        if (interaction.isButton()) {
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
    }
}