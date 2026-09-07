require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ] 
});

client.on('ready', () => {
  console.log(`ล็อกอินสำเร็จในชื่อ: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.content === '!chars') {
    try {
      // ดึงข้อมูลจาก API ของ Next.js ที่เราเปิดรันไว้
      const response = await fetch('http://localhost:3000/api/characters');
      const data = await response.json();
      
      let reply = '**รายชื่อตัวละครจากเว็บ:**\n';
      data.forEach(c => {
        reply += `- ${c.name} (${c.class})\n`;
      });
      message.reply(reply);
    } catch (error) {
      message.reply('ดึงข้อมูลไม่สำเร็จ เช็กดูซิว่าเปิดเว็บรันอยู่หรือเปล่า');
    }
  }
});

// ดึง Token จากไฟล์ .env มาใช้งานอย่างปลอดภัย
client.login(process.env.DISCORD_BOT_TOKEN);