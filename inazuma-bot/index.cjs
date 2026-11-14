const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers // สำคัญมากสำหรับดึงยศสมาชิก
    ] 
});

// สร้าง Collection สำหรับเก็บคำสั่งทั้งหมด
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(foldersPath).filter(file => file.endsWith('.cjs') || file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(foldersPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}

client.once('ready', () => {
    console.log(`🤖 ล็อกอินสำเร็จในชื่อ: ${client.user.tag}`);
});

// ⚡ ส่วนสำคัญ: ดักจับเหตุการณ์เมื่อมีคนพิมพ์หรือกดใช้ Slash Command
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการรันคำสั่ง:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: '❌ เกิดข้อผิดพลาดในการรันคำสั่งนี้!', ephemeral: true });
        } else {
            await interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการรันคำสั่งนี้!', ephemeral: true });
        }
    }
});

// ดึง Token จาก .env ทุกรูปแบบอัตโนมัติ
const token = process.env.DISCORD_TOKEN || process.env.TOKEN || process.env.BOT_TOKEN || process.env.BOT_KEY || process.env.DISCORD_BOT_TOKEN;
client.login(token);