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
    // 1. นำ code ไปแลก Access Token กับ Discord
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/discord/callback',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token from Discord');
    }

    // 2. ดึงข้อมูลโปรไฟล์ผู้ใช้จาก Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const discordUser = await userResponse.json();

    console.log("📌 Discord User ID ที่ล็อกอินเข้ามา:", discordUser.id);

    // 3. ตรวจสอบข้อมูลในตาราง community_users ของ Supabase
    const { data: communityUser, error } = await supabase
      .from('community_users')
      .select('*')
      .eq('discord_id', discordUser.id)
      .maybeSingle();

    console.log("📌 ผลลัพธ์จาก Supabase:", communityUser);
    console.log("📌 Error จาก Supabase (ถ้ามี):", error);

    if (error || !communityUser) {
      console.log("❌ ไม่พบข้อมูลในระบบ หรือเกิดข้อผิดพลาด พาไปหน้า not-registered");
      return NextResponse.redirect(new URL('/not-registered', request.url));
    }

    // 4. บันทึกข้อมูลเซสชันลง Cookie
    const cookieStore = await cookies();
    cookieStore.set('user_session', JSON.stringify({
      discord_id: communityUser.discord_id,
      username: communityUser.username,
      school: communityUser.school
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 วัน
      path: '/'
    });

    // 5. ล็อกอินสำเร็จ พาเข้าสู่หน้าแรก
    return NextResponse.redirect(new URL('/', request.url));

  } catch (error) {
    console.error('❌ Discord Auth Error:', error);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}