import { CommandInteraction } from 'discord.js';
import { BotClient } from './Client';

export interface Command {
    name: string;
    description: string;
    execute(interaction: CommandInteraction, client: BotClient): Promise<void>;
}
