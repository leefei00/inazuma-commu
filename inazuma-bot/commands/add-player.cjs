const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-player')
    .setDescription('เพิ่มข้อมูลตัวละครใหม่เข้าสู่ Inazuma Commu Database')
    .addStringOption(option => 
      option.setName('name-surname')
        .setDescription('ชื่อ-นามสกุล ตัวละคร')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('year')
        .setDescription('ปีการศึกษา (เช่น 01, 02, 03)')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('school')
        .setDescription('รหัสโรงเรียน (เช่น Zakkaze, Sanrin, Katsuen, Gokuyou)')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('position')
        .setDescription('ตำแหน่ง (เช่น FW, MF, DF, GK, MANAGER)')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('element')
        .setDescription('ธาตุ (เช่น FIRE, WIND, WOOD, EARTH)')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('shoot')
        .setDescription('ค่าพลัง Shoot (20-25)')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('control')
        .setDescription('ค่าพลัง Control (20-25)')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('speed')
        .setDescription('ค่าพลัง Speed (20-25)')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('defence')
        .setDescription('ค่าพลัง Defence (20-25)')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('power')
        .setDescription('ค่าพลัง Power (20-25)')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('catch')
        .setDescription('ค่าพลัง Catch (20-25)')
        .setRequired(true))
    .addAttachmentOption(option => 
      option.setName('image')
        .setDescription('อัปโหลดรูปภาพตัวละคร')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    const nameSurname = interaction.options.getString('name-surname');
    const year = interaction.options.getString('year');
    const school = interaction.options.getString('school');
    const position = interaction.options.getString('position');
    const element = interaction.options.getString('element');
    const shoot = interaction.options.getInteger('shoot');
    const control = interaction.options.getInteger('control');
    const speed = interaction.options.getInteger('speed');
    const defence = interaction.options.getInteger('defence');
    const power = interaction.options.getInteger('power');
    const catchStat = interaction.options.getInteger('catch');
    
    // ดึงไฟล์รูปภาพที่อัปโหลด
    const attachment = interaction.options.getAttachment('image');
    const imageUrl = attachment ? attachment.url : null;

    try {
      const apiUrl = process.env.API_URL || 'https://inazuma-commu.vercel.app/api/players';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: nameSurname,
          year,
          school,
          position,
          element,
          shoot,
          control,
          speed,
          defence,
          power,
          catch: catchStat,
          image: imageUrl
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }

      await interaction.editReply(`✅ เพิ่มตัวละคร **${nameSurname}** สังกัดโรงเรียน **${school}** สำเร็จเรียบร้อยแล้ว!`);
    } catch (error) {
      console.error(error);
      await interaction.editReply(`❌ เกิดข้อผิดพลาด: ${error.message}`);
    }
  },
};