import { TextChannel, Guild, User, ChannelType, PermissionFlagsBits, ButtonBuilder, ActionRowBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { BotClient } from '../structures/Client';

export class ApplicationManager {
    private client: BotClient;
    private applicationCategoryId: string;
    private staffRoleId: string;

    constructor(client: BotClient) {
        this.client = client;
        this.applicationCategoryId = process.env.APPLICATION_CATEGORY_ID!;
        this.staffRoleId = process.env.STAFF_ROLE_ID!;
    }

    public async createApplication(guild: Guild, user: User, formData: any): Promise<TextChannel> {
        const channel = await guild.channels.create({
            name: `apply-${user.username}`,
            type: ChannelType.GuildText,
            parent: this.applicationCategoryId,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: user.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages],
                },
                {
                    id: this.staffRoleId,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                }
            ],
        });

        const embed = new EmbedBuilder()
            .setTitle('📝 Nieuwe Staff Sollicitatie')
            .setDescription(`Sollicitatie van ${user.tag}`)
            .addFields([
                { name: 'Naam', value: formData.name },
                { name: 'Leeftijd', value: formData.age },
                { name: 'Ervaring', value: formData.experience },
                { name: 'Motivatie', value: formData.motivation },
                { name: 'Beschikbaarheid', value: formData.availability }
            ])
            .setColor('#00ff00')
            .setTimestamp();

        const buttons = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('accept_application')
                    .setLabel('Accepteren')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('reject_application')
                    .setLabel('Afwijzen')
                    .setStyle(ButtonStyle.Danger)
            );

        await channel.send({ embeds: [embed], components: [buttons] });
        return channel;
    }

    public async handleResponse(channel: TextChannel, user: User, accepted: boolean, reason: string): Promise<void> {
        const applicantUsername = channel.name.split('-')[1];
        const applicant = channel.guild.members.cache.find(member => 
            member.user.username.toLowerCase() === applicantUsername.toLowerCase()
        )?.user;

        if (!applicant) {
            throw new Error('Could not find the applicant');
        }

        const embed = new EmbedBuilder()
            .setTitle(accepted ? '✅ Sollicitatie Geaccepteerd' : '❌ Sollicitatie Afgewezen')
            .setDescription(`Door: ${user.tag}\nReden: ${reason}`)
            .setColor(accepted ? '#00ff00' : '#ff0000')
            .setTimestamp();

        await applicant.send({ embeds: [embed] });
        await channel.delete();
    }
}