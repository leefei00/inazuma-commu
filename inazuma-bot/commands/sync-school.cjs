const { SlashCommandBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// Map ชื่อยศจริงใน Discord (ฝั่งซ้าย) ให้ตรงกับฐานข้อมูล Supabase (ฝั่งขวา)
const ROLE_SCHOOL_MAP = {
    "Zakkaze": "Zakkaze Gakuen",
    "Sanrin": "Sanrin Junior High",
    "Katsuen": "Katsuen Academy",
    "Gokuyou": "Gokuyou"
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('syncschool')
        .setDescription('ซิงค์ยศโรงเรียนและเคลียร์สมาชิกที่ออกจากเซิร์ฟเวอร์ (เฉพาะแอดมิน)'),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.editReply({ content: '❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้!' });
        }

        try {
            const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            const guild = interaction.guild;
            await guild.members.fetch(); // โหลดข้อมูลสมาชิกทั้งหมดในเซิร์ฟเวอร์
            
            let activeCount = 0;
            const activeDiscordIds = [];

            // 1. วนลูปอัปเดตข้อมูลคนที่ยังอยู่ในเซิร์ฟเวอร์และมีสิทธิ์ยศโรงเรียน
            for (const [memberId, member] of guild.members.cache) {
                if (member.user.bot) continue;

                let userSchool = null;
                for (const role of member.roles.cache.values()) {
                    if (ROLE_SCHOOL_MAP[role.name]) {
                        userSchool = ROLE_SCHOOL_MAP[role.name];
                        break;
                    }
                }

                if (userSchool) {
                    activeDiscordIds.push(member.id); // เก็บ ID คนที่ยังอยู่ไว้
                    const { error } = await supabase
                        .from('community_users')
                        .upsert({
                            discord_id: member.id,
                            username: member.user.tag,
                            school: userSchool
                        }, { onConflict: 'discord_id' });

                    if (!error) {
                        activeCount++;
                    }
                }
            }

            // 2. ตรวจสอบและลบข้อมูลคนที่ไม่อยู่ในเซิร์ฟเวอร์แล้ว (หรือโดนถอดยศโรงเรียนออก)
            const { data: dbUsers, error: fetchError } = await supabase
                .from('community_users')
                .select('discord_id');

            let deletedCount = 0;
            if (!fetchError && dbUsers) {
                // หา ID ที่มีอยู่ใน Database แต่ไม่อยู่ในรายชื่อ active ในเซิร์ฟเวอร์ปัจจุบัน
                const idsToDelete = dbUsers
                    .map(user => user.discord_id)
                    .filter(id => !activeDiscordIds.includes(id));

                if (idsToDelete.length > 0) {
                    const { error: deleteError } = await supabase
                        .from('community_users')
                        .delete()
                        .in('discord_id', idsToDelete);

                    if (!deleteError) {
                        deletedCount = idsToDelete.length;
                    } else {
                        console.error('❌ Error deleting left members:', deleteError.message);
                    }
                }
            }

            await interaction.editReply(
                `✅ ซิงค์ข้อมูลสำเร็จ!\n` +
                `- อัปเดตข้อมูลผู้เล่นปัจจุบัน: **${activeCount} คน**\n` +
                `- ลบข้อมูลคนที่ออกจากเซิร์ฟเวอร์: **${deletedCount} คน**`
            );
        } catch (error) {
            console.error('❌ Error syncing school:', error);
            await interaction.editReply('❌ เกิดข้อผิดพลาดในการซิงค์ข้อมูล ดูรายละเอียดเพิ่มเติมที่ Terminal');
        }
    },
};