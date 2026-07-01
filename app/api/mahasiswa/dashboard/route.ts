import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const emailMhs = request.headers.get('x-user-email');
    if (!emailMhs) {
      return NextResponse.json({ success: false, error: 'Sesi email kosong' }, { status: 400 });
    }

    // 1. CARI USER DENGAN RELASI 'pengajuan' (TANPA S) SESUAI ERROR DI PRISMA
    const user = await prisma.user.findUnique({
      where: { email: emailMhs },
      include: {
        pengajuan: true // Sesuai petunjuk error: "Did you mean to write 'pengajuan'?"
      }
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        totalPoin: 0,
        riwayatPengajuan: [],
        leaderboard: []
      });
    }

    // 2. Ambil data leaderboard mahasiswa
    const allUsers = await prisma.user.findMany({
      where: { role: 'MAHASISWA' },
      select: { 
        id: true, 
        nama: true, 
        nim: true, 
        jurusan: true, 
        totalPoin: true 
      },
      orderBy: { totalPoin: 'desc' }
    });

    // 3. Kembalikan data ke frontend dengan Type Assertion (as any) biar aman dari sisa merah TypeScript
    return NextResponse.json({
      success: true,
      nama: user.nama,
      email: user.email,
      nim: (user as any).nim || '',
      jurusan: (user as any).jurusan || '',
      angkatan: (user as any).angkatan || '',
      totalPoin: user.totalPoin || 0,
      riwayatPengajuan: (user as any).pengajuan || [], // Menggunakan penamaan yang sesuai dengan database
      leaderboard: allUsers
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Gagal memuat data server' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}