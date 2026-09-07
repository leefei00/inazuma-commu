import { NextResponse } from 'next/server';

export async function GET() {
  // ข้อมูลตัวละครตัวอย่าง
  const characters = [
    { id: 1, name: 'นักผจญภัย', class: 'Warrior' },
    { id: 2, name: 'นักเวท', class: 'Mage' }
  ];
  return NextResponse.json(characters);
}