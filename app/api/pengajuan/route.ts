import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const emailMhs = request.headers.get('x-user-email');
    if (!emailMhs) {
      return NextResponse.json({ success: false, error: 'Sesi tidak valid, silakan login kembali' }, { status: 401 });
    }

    const body = await request.json();
    // Tambahkan 'kategori' untuk ditangkap dari body request
    const { tipe, judul, kategori } = body; 

    const user = await prisma.user.findUnique({
      where: { email: emailMhs }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Mengisi data lengkap sesuai kebutuhan type schema Prisma Anda
    const pengajuanBaru = await prisma.pengajuan.create({
      data: {
        tipe,
        judul,
        kategori: kategori || 'Lokal', // Menyediakan fallback jika kosong agar tidak error
        status: 'PENDING',
        userId: user.id 
      }
    });

    return NextResponse.json({ success: true, data: pengajuanBaru });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Gagal mengirim pengajuan' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}