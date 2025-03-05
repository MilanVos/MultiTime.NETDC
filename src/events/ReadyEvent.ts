import { Event } from '../structures/Event';
import { BotClient } from '../structures/Client';

export default class ReadyEvent extends Event {
    constructor(client: BotClient) {
        super(client, 'ready', true);
    }

    public async execute(): Promise<void> {
        console.log(`Logged in as ${this.client.user?.tag}!`);
    }
}
