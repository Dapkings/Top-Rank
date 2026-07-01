import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// 1. GET: MENAMPILKAN DATA DASHBOARD ADMIN
// ==========================================
export async function GET() {
  try {
    // 1. Hitung statistik untuk kartu informasi atas
    const totalMahasiswa = await prisma.user.count({ where: { role: 'MAHASISWA' } });
    const totalPengajuanMasuk = await prisma.pengajuan.count();
    const butuhVerifikasi = await prisma.pengajuan.count({ where: { status: 'PENDING' } });

    // Hitung total akumulasi poin yang sudah terdistribusi ke seluruh mahasiswa
    const agregasiPoin = await prisma.user.aggregate({
      where: { role: 'MAHASISWA' },
      _sum: { totalPoin: true }
    });
    const totalPoinTerdistribusi = agregasiPoin._sum.totalPoin || 0;

    // 2. Ambil data seluruh mahasiswa (untuk fitur list / pencarian bakat)
    const semuaMahasiswa = await prisma.user.findMany({
      where: { role: 'MAHASISWA' },
      select: {
        id: true,
        nama: true,
        email: true,
        nim: true,
        jurusan: true,
        totalPoin: true,
      },
      orderBy: { nama: 'asc' }
    });

    // 3. Ambil seluruh daftar pengajuan berkas (portofolio/sertifikat)
    const daftarPengajuan = await prisma.pengajuan.findMany({
      orderBy: { id: 'desc' }
    });

    // Kirimkan semua data ke frontend
    return NextResponse.json({
      success: true,
      statistik: {
        totalMahasiswa,
        totalPengajuanMasuk,
        butuhVerifikasi,
        totalPoinTerdistribusi,
      },
      semuaMahasiswa,
      daftarPengajuan
    });

  } catch (error) {
    console.error('Error GET Admin:', error);
    return NextResponse.json({ success: false, error: 'Gagal memuat data server' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// ==========================================
// 2. POST: MEMPROSES APPROVE / REJECT ADMIN
// ==========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    // Validasi input awal data kiriman frontend
    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Data ID atau Status tidak lengkap' }, { status: 400 });
    }

    // Update status berkas di database Prisma (APPROVED atau REJECTED)
    const berkasUpdated = await prisma.pengajuan.update({
      where: { id: Number(id) },
      data: { status: status }
    });

    // FITUR GAMIFIKASI: Jika berkas di-APPROVED, otomatis tambahkan poin prestasi ke akun mahasiswa
    if (status === 'APPROVED') {
      // Kita beri standar bonus 15 poin per berkas sertifikat/portofolio yang sah
      await prisma.user.update({
        where: { id: berkasUpdated.userId },
        data: {
          totalPoin: {
            increment: 15 
          }
        }
      });
    }

    return NextResponse.json({ success: true, data: berkasUpdated });

  } catch (error: any) {
    console.error('Error POST Admin (Verifikasi):', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}