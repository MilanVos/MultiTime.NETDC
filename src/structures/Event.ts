import { ClientEvents } from 'discord.js';
import { BotClient } from './Client';

export abstract class Event {
    protected client: BotClient;
    public readonly name: keyof ClientEvents;
    public readonly once: boolean;

    constructor(client: BotClient, name: keyof ClientEvents, once = false) {
        this.client = client;
        this.name = name;
        this.once = once;
    }

    public abstract execute(...args: any[]): Promise<void>;
}