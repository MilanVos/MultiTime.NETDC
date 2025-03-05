import { GatewayIntentBits } from 'discord.js';
import { BotClient } from './structures/Client';
import { config } from 'dotenv';

config();

const client = new BotClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.init(process.env.TOKEN!);
