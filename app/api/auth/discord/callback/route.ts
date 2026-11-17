import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// ใช้ Service Role Key เพื่อให้ Server-side อ่านข้อมูลข้าม RLS ได้
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    // 1. กำหนด Redirect URI ให้รองรับทั้ง Vercel และ Localhost อัตโนมัติ
    const redirectUri = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://inazuma-commu.vercel.app/api/auth/discord/callback' 
        : 'http://localhost:3000/api/auth/discord/callback');

    // 2. นำ code ไปแลก Access Token กับ Discord
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.error('❌ Discord Token Response Error:', tokenData);
      throw new Error('Failed to get access token from Discord');
    }

    // 3. ดึงข้อมูลโปรไฟล์ผู้ใช้จาก Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const discordUser = await userResponse.json();

    console.log("📌 Discord User ID ที่ล็อกอินเข้ามา:", discordUser.id);
    console.log("📌 Discord Username:", discordUser.username);

    // 4. ตรวจสอบข้อมูลในตาราง community_users ของ Supabase
    const { data: communityUser, error } = await supabase
      .from('community_users')
      .select('*')
      .eq('discord_id', String(discordUser.id))
      .maybeSingle();

    console.log("📌 ผลลัพธ์จาก Supabase:", communityUser);
    console.log("📌 Error จาก Supabase (ถ้ามี):", error);

    // ถ้ายังไม่มีข้อมูลในตาราง ให้สร้างข้อมูลเริ่มต้นใหม่ทันที
    let userData = communityUser;
    if (!userData) {
      console.log("⚠️ ไม่พบผู้ใช้ในระบบ กำลังสร้างข้อมูลเริ่มต้นสำหรับ:", discordUser.username);
      
      // เปลี่ยนวิธี destructure ให้ถูกต้องตาม Type ของ Supabase
      const { data: newUser, error: insertError } = await supabase
        .from('community_users')
        .insert([
          {
            discord_id: String(discordUser.id),
            username: discordUser.username || 'Unknown',
            school: 'Zakkaze',
            role: 'MEMBER'
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Insert User Error:', insertError);
        return NextResponse.redirect(new URL('/?error=db_insert_failed', request.url));
      }
      userData = newUser;
    }

    // 5. บันทึกข้อมูลเซสชันลง Cookie (อายุ 7 วัน)
    const cookieStore = await cookies();
    cookieStore.set('user_session', JSON.stringify({
      discord_id: userData.discord_id,
      username: userData.username,
      school: userData.school || 'Zakkaze'
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    // 6. ล็อกอินสำเร็จ พาเข้าสู่หน้าแรก
    return NextResponse.redirect(new URL('/', request.url));

  } catch (error) {
    console.error('❌ Discord Auth Error:', error);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}