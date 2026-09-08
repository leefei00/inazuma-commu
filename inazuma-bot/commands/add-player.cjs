const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-player')
    .setDescription('เพิ่มข้อมูลตัวละครใหม่เข้าสู่ Inazuma Commu Database')
    .addStringOption(option => 
      option.setName('name')
        .setDescription('ชื่อตัวละคร')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('school')
        .setDescription('ชื่อโรงเรียน / สังกัด')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('kick')
        .setDescription('ค่าพลังเตะ (Kick)')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const playerName = interaction.options.getString('name');
    const playerSchool = interaction.options.getString('school');
    const playerKick = interaction.options.getInteger('kick');

    try {
      // ⚠️ อย่าลืมเปลี่ยน URL นี้เป็นโดเมน Vercel ของคุณจริงๆ
      const response = await fetch('https://inazuma-commu.vercel.app/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playerName,
          school: playerSchool,
          kick: playerKick,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }

      await interaction.editReply(`✅ เพิ่มตัวละคร **${playerName}** สำเร็จเรียบร้อยแล้ว`);
    } catch (error) {
      console.error(error);
      await interaction.editReply(`❌ เกิดข้อผิดพลาด: ${error.message}`);
    }
  },
};