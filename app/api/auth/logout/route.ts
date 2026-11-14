import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  
  // สั่งลบ Cookie user_session ทิ้ง
  cookieStore.delete('user_session');

  // พาผู้ใช้กลับหน้าแรก
  return NextResponse.redirect(new URL('/', request.url));
}