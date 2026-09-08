require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ] 
});

client.once('clientReady', () => {
  console.log(`ล็อกอินสำเร็จในชื่อ: ${client.user.tag}`);
});

// ดักจับ Slash Commands (เช่น /add-player)
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'add-player') {
    // 1. ดึงค่าทั้งหมดที่ผู้ใช้กรอกผ่านช่อง Discord
    const nameSurname = interaction.options.getString('name-surname');
    const year = interaction.options.getString('year');
    const school = interaction.options.getString('school');
    const shoot = interaction.options.getInteger('shoot');
    const control = interaction.options.getInteger('control');
    const speed = interaction.options.getInteger('speed');
    const defence = interaction.options.getInteger('defence');
    const power = interaction.options.getInteger('power');
    const catchStat = interaction.options.getInteger('catch');
    const position = interaction.options.getString('position');
    const element = interaction.options.getString('element');
    
    // ดึงไฟล์รูปภาพที่ผู้ใช้อัปโหลดแนบมา (เปลี่ยนจาก getString เป็น getAttachment)
    const attachment = interaction.options.getAttachment('image');
    const imageUrl = attachment ? attachment.url : null; 

    // แจ้งเตือนบอทให้รับทราบคำสั่งชั่วคราว (ป้องกัน Time out)
    await interaction.deferReply({ flags: 64 });

    try {
      // 2. ยิงข้อมูล Request ไปที่ API ของเว็บ
      const apiUrl = process.env.API_URL || 'http://localhost:3000/api/players';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          name: nameSurname,
          year,
          school,
          shoot,
          control,
          speed,
          defence,
          power,
          catch: catchStat,
          position,
          element,
          image: imageUrl // ส่งลิงก์ไฟล์รูปภาพที่อัปโหลดเข้าฐานข้อมูล
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Response ไม่สำเร็จ: ${errorText}`);
      }

      // 3. แจ้งเตือนว่าสำเร็จ
      await interaction.editReply({
        content: `🎉 บันทึกข้อมูลตัวละคร **${nameSurname}** สังกัดโรงเรียน **${school}** ลงฐานข้อมูลสำเร็จแล้ว!`
      });

    } catch (error) {
      console.error('Error saving character:', error);
      await interaction.editReply({
        content: '❌ เกิดข้อผิดพลาดในการบันทึกข้อมูลลงฐานข้อมูล (ตรวจสอบ Terminal ของบอทเพื่อดูรายละเอียด Error)'
      });
    }
  }
});

// โค้ดสำหรับรับข้อความแชท (!chars)
client.on('messageCreate', async message => {
  if (message.content === '!chars') {
    try {
      const apiUrl = process.env.API_URL || 'http://localhost:3000/api/players';
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      let reply = '**รายชื่อตัวละครจากเว็บ:**\n';
      data.forEach(c => {
        reply += `- ${c.name} (${c.class || c.school})\n`;
      });
      message.reply(reply);
    } catch (error) {
      message.reply('ดึงข้อมูลไม่สำเร็จ เช็กดูซิว่าเปิดเว็บรันอยู่หรือเปล่า');
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);