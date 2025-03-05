import { Client, Collection, ClientOptions } from 'discord.js';
import { Command } from './Command';
import { Event } from './Event';
import { TicketManager } from '../managers/TicketManager';
import { readdirSync } from 'fs';
import { join } from 'path';

export class BotClient extends Client {
    public commands: Collection<string, Command> = new Collection();
    public events: Collection<string, Event> = new Collection();
    public ticketManager: TicketManager;

    constructor(options: ClientOptions) {
        super(options);
        this.ticketManager = new TicketManager(this);
    }

    public async init(token: string): Promise<void> {
        await this.loadCommands();
        await this.loadEvents();
        await this.login(token);
    }

    private async loadCommands(): Promise<void> {
        const commandsPath = join(__dirname, '..', 'commands');
        const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

        for (const file of commandFiles) {
            const filePath = join(commandsPath, file);
            const commandClass = require(filePath).default;
            const command: Command = new commandClass();

            this.commands.set(command.name, command);
            console.log(`Loaded command: ${command.name}`);
        }
    }

    private async loadEvents(): Promise<void> {
        const eventsPath = join(__dirname, '..', 'events');
        const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.ts'));

        for (const file of eventFiles) {
            const filePath = join(eventsPath, file);
            const eventClass = require(filePath).default;
            const event: Event = new eventClass(this);

            this.events.set(event.name, event);
            
            if (event.once) {
                this.once(event.name, (...args) => event.execute(...args));
            } else {
                this.on(event.name, (...args) => event.execute(...args));
            }
            
            console.log(`Loaded event: ${event.name}`);
        }
    }

    public reloadCommands(): void {
        this.commands.clear();
        this.loadCommands();
    }

    public reloadEvents(): void {
        this.removeAllListeners();
        this.events.clear();
        this.loadEvents();
    }
}
