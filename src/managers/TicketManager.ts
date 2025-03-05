import { TextChannel, Guild, User, ChannelType, PermissionFlagsBits, Role, ButtonBuilder, ActionRowBuilder, ButtonStyle, EmbedBuilder, CategoryChannel, Collection } from 'discord.js';
import { BotClient } from '../structures/Client';

interface TicketStats {
    totalTickets: number;
    openTickets: number;
    closedTickets: number;
    averageResponseTime: number;
}

interface TicketPriority {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    color: number;
    maxResponseTime: number;
}

export class TicketManager {
    private client: BotClient;
    private supportRoles: Map<string, string>;
    private ticketCategoryId: string;
    private transcriptChannelId: string;
    private inactivityTimeout: number = 24 * 60 * 60 * 1000;
    private ticketStats: TicketStats = {
        totalTickets: 0,
        openTickets: 0,
        closedTickets: 0,
        averageResponseTime: 0
    };

    private priorities: Map<string, TicketPriority> = new Map([
        ['LOW', { level: 'LOW', color: 0x00ff00, maxResponseTime: 24 }],
        ['MEDIUM', { level: 'MEDIUM', color: 0xffff00, maxResponseTime: 12 }],
        ['HIGH', { level: 'HIGH', color: 0xff9900, maxResponseTime: 6 }],
        ['URGENT', { level: 'URGENT', color: 0xff0000, maxResponseTime: 1 }]
    ]);

    constructor(client: BotClient) {
        this.client = client;
        this.ticketCategoryId = process.env.TICKET_CATEGORY_ID!;
        this.transcriptChannelId = process.env.TRANSCRIPT_CHANNEL_ID!;
        this.supportRoles = new Map([
            ['TIER1', process.env.SUPPORT_TIER1_ROLE_ID!],
            ['TIER2', process.env.SUPPORT_TIER2_ROLE_ID!],
            ['TIER3', process.env.SUPPORT_TIER3_ROLE_ID!],
            ['ADMIN', process.env.SUPPORT_ADMIN_ROLE_ID!]
        ]);
        this.setupInactivityChecker();
    }

    private async getAllOpenTickets(): Promise<Collection<string, TextChannel>> {
        const category = this.client.channels.cache.get(this.ticketCategoryId) as CategoryChannel;
        return category.children.cache.filter(channel => 
            channel.type === ChannelType.GuildText
        ) as Collection<string, TextChannel>;
    }

    private setupInactivityChecker() {
        setInterval(() => {
            this.checkInactiveTickets();
        }, 30 * 60 * 1000); 
    }

    private async checkInactiveTickets() {
        const tickets = await this.getAllOpenTickets();
        for (const ticket of tickets.values()) {
            const lastMessage = (await ticket.messages.fetch({ limit: 1 })).first();
            if (lastMessage && Date.now() - lastMessage.createdTimestamp > this.inactivityTimeout) {
                await this.sendInactivityWarning(ticket);
            }
        }
    }

    public async createCustomTicket(guild: Guild, user: User, formData: any) {
        const { priority, category, description, attachments } = formData;
        const ticketPriority = this.priorities.get(priority);
        
        const channel = await this.createTicket(guild, user, description, category);
        
        await this.setPrioritySettings(channel, ticketPriority!);
        
        this.ticketStats.totalTickets++;
        this.ticketStats.openTickets++;
        
        return channel;
    }

    private async setPrioritySettings(channel: TextChannel, priority: TicketPriority) {
        await channel.send({
            embeds: [{
                title: `Priority: ${priority.level}`,
                description: `Response expected within ${priority.maxResponseTime} hours`,
                color: priority.color
            }]
        });
    }

    public getTicketStatistics(): TicketStats {
        return this.ticketStats;
    }

    private async sendInactivityWarning(channel: TextChannel) {
        await channel.send({
            embeds: [{
                title: '⚠️ Inactivity Warning',
                description: 'This ticket has been inactive for 24 hours. It will be automatically closed in 2 hours if there is no activity.',
                color: 0xff9900
            }]
        });
    }

    private async hasExistingTicket(guild: Guild, user: User, category: string): Promise<boolean> {
        const ticketCategory = guild.channels.cache.get(this.ticketCategoryId) as CategoryChannel;
        const existingTickets = ticketCategory.children.cache.filter(channel => 
            channel.name.includes(user.username.toLowerCase()) && 
            channel.name.includes(category.toLowerCase())
        );
        
        return existingTickets.size > 0;
    }

    public async createTicket(guild: Guild, user: User, reason: string, category: string): Promise<TextChannel> {
        if (await this.hasExistingTicket(guild, user, category)) {
            throw new Error(`Je hebt al een actief ticket in de categorie: ${category}`);
        }

        const ticketCount = await this.getTicketCount(guild);
        const ticketCategory = guild.channels.cache.get(this.ticketCategoryId) as CategoryChannel;
        
        const supportRole = await guild.roles.fetch(process.env.SUPPORT_ROLE_ID!);
        if (!supportRole) {
            throw new Error(`Support role ${process.env.SUPPORT_ROLE_ID} not found`);
        }
        
        const channel = await guild.channels.create({
            name: `ticket-${ticketCount}-${user.username}`,
            type: ChannelType.GuildText,
            parent: ticketCategory,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: supportRole.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel, 
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.ManageMessages
                    ],
                }
            ],
        });

        await this.setupTicketChannel(channel, user, reason, category);
        return channel;
    }
    private async setupTicketChannel(channel: TextChannel, user: User, reason: string, category: string): Promise<void> {
        const supportRole = channel.guild.roles.cache.get(this.supportRoles.get('TIER1')!);
        
        const embed = new EmbedBuilder()
            .setTitle('🎫 Nieuw Ticket')
            .setDescription(`
                **Gebruiker:** ${user}
                **Categorie:** ${category}
                **Reden:** ${reason}
                
                Een ${supportRole} lid zal je zo snel mogelijk helpen!
                
                __Ticket Controls:__
                • 🔒 Sluit ticket
                • ✋ Claim ticket
                • 📝 Maak transcript
            `)
            .setColor('#00ff00')
            .setTimestamp();

        const buttons = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Sluit Ticket')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒'),
                new ButtonBuilder()
                    .setCustomId('claim_ticket')
                    .setLabel('Claim Ticket')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('✋'),
                new ButtonBuilder()
                    .setCustomId('transcript_ticket')
                    .setLabel('Maak Transcript')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📝')
            );

        await channel.send({ embeds: [embed], components: [buttons] });
    }

    private async getTicketCount(guild: Guild): Promise<number> {
        const ticketCategory = guild.channels.cache.get(this.ticketCategoryId) as CategoryChannel;
        return ticketCategory.children.cache.size + 1;
    }

    public async claimTicket(channel: TextChannel, user: User): Promise<void> {
        await channel.send({
            embeds: [{
                description: `Ticket is geclaimd door ${user}`,
                color: 0x3498db
            }]
        });

        await channel.setTopic(`Geclaimd door: ${user.tag}`);
    }

    public async createTranscript(channel: TextChannel): Promise<void> {
        const messages = await channel.messages.fetch();
        const transcript = messages.map(m => `${m.author.tag}: ${m.content}`).join('\n');
        
        const transcriptChannel = channel.guild.channels.cache.get(this.transcriptChannelId) as TextChannel;
        await transcriptChannel.send({
            files: [{
                attachment: Buffer.from(transcript),
                name: `transcript-${channel.name}.txt`
            }]
        });
    }

    public async closeTicket(channel: TextChannel, user: User): Promise<void> {
        this.ticketStats.openTickets--;
        this.ticketStats.closedTickets++;

        await channel.send({
            embeds: [{
                description: `Ticket wordt gesloten door ${user}...`,
                color: 0xff0000
            }]
        });

        await this.createTranscript(channel);
        
        setTimeout(async () => {
            await channel.delete();
        }, 5000);
    }
}