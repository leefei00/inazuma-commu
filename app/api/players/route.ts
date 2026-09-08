import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ใช้ Service Role Key เพื่อให้หลังบ้านมีสิทธิ์เขียนข้อมูลลง Database ได้
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // บันทึกข้อมูลลงตาราง players
    const { data, error } = await supabaseAdmin
      .from('players')
      .insert([body])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}