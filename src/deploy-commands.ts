import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

config();

if (!process.env.TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_ID) {
    throw new Error('Missing required environment variables');
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

for (const file of commandFiles) {
    const CommandClass = require(`./commands/${file}`).default;
    const command = new CommandClass();
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID as string,
                process.env.GUILD_ID as string
            ),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
