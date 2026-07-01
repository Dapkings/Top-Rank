import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Hitung statistik untuk kartu atas
    const totalMahasiswa = await prisma.user.count({ where: { role: 'MAHASISWA' } });
    const totalPengajuanMasuk = await prisma.pengajuan.count();
    const butuhVerifikasi = await prisma.pengajuan.count({ where: { status: 'PENDING' } });
    
    const agregasiPoin = await prisma.user.aggregate({
      where: { role: 'MAHASISWA' },
      _sum: { totalPoin: true }
    });
    const totalPoinTerdistribusi = agregasiPoin._sum.totalPoin || 0;

    // 2. AMBIL DATA SELURUH MAHASISWA (Untuk fitur Lihat Seluruh Data Mahasiswa)
    const semuaMahasiswa = await prisma.user.findMany({
      where: { role: 'MAHASISWA' },
      select: {
        id: true,
        nama: true,
        email: true,
        nim: true,
        jurusan: true,
        totalPoin: true
      },
      orderBy: { nama: 'asc' }
    });

    // 3. Ambil daftar pengajuan berkas
    const daftarPengajuan = await prisma.pengajuan.findMany({
      orderBy: { id: 'desc' }
    });

    return NextResponse.json({
      success: true,
      statistik: {
        totalMahasiswa,
        totalPengajuanMasuk,
        butuhVerifikasi,
        totalPoinTerdistribusi
      },
      semuaMahasiswa, // Data list nama mahasiswa dikirim ke frontend!
      daftarPengajuan
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Gagal memuat data server' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}