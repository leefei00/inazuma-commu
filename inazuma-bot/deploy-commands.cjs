require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('add-player')
    .setDescription('เพิ่มข้อมูลตัวละครใหม่เข้าสู่ Inazuma Commu Database')
    .addStringOption(option => 
      option.setName('name-surname')
        .setDescription('ชื่อ-นามสกุลตัวละคร')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('year')
        .setDescription('ปีการศึกษา')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('school')
        .setDescription('ชื่อโรงเรียน / สังกัด')
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
        .setDescription('ค่าพลัง Shoot')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('control')
        .setDescription('ค่าพลัง Control')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('speed')
        .setDescription('ค่าพลัง Speed')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('defence')
        .setDescription('ค่าพลัง Defence')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('power')
        .setDescription('ค่าพลัง Power')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('catch')
        .setDescription('ค่าพลัง Catch')
        .setRequired(true))
    .addAttachmentOption(option => 
      option.setName('image')
        .setDescription('อัปโหลดรูปภาพตัวละคร')
        .setRequired(true)),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
  try {
    console.log('กำลังเริ่มต้นรีเฟรช Slash Commands...');

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );

    console.log('✅ ลงทะเบียนคำสั่งสำเร็จเรียบร้อยแล้ว!');
  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
  }
})();