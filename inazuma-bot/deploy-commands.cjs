const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(foldersPath).filter(file => file.endsWith('.cjs') || file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(foldersPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] ไฟล์คำสั่งที่ ${filePath} ขาดคุณสมบัติ 'data' หรือ 'execute'`);
    }
}

const token = process.env.DISCORD_TOKEN || process.env.TOKEN || process.env.BOT_TOKEN || process.env.BOT_KEY || process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
    console.error('❌ กรุณาตรวจสอบ CLIENT_ID และ Token ในไฟล์ .env ให้ถูกต้อง');
    process.exit(1);
}

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`🔄 กำลังรีเฟรชคำสั่ง (${commands.length} คำสั่ง)...`);

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        console.log('🎉 ลงทะเบียนคำสั่งสำเร็จเรียบร้อยแล้ว!');
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error);
    }
})();