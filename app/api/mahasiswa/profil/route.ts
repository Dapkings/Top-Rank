import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Inisialisasi standar Prisma sesuai kode asli abang (Bersih & otomatis)
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, email, nim, jurusan, angkatan } = body;

    console.log("Data diterima backend:", { nama, email, nim, jurusan, angkatan });

    // Validasi agar tidak ada data kosong yang masuk database
    if (!nama || !email || !nim || !jurusan || !angkatan) {
      return NextResponse.json({ success: false, error: 'Semua data wajib diisi!' }, { status: 400 });
    }

    // Menggunakan upsert berdasarkan email unik yang diketik di form front-end
    const userUpdate = await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: {
        nama: nama,
        nim: nim,
        jurusan: jurusan,
        angkatan: Number(angkatan),
      },
      create: {
        nama: nama,
        email: email.toLowerCase(),
        role: 'MAHASISWA',
        nim: nim,
        jurusan: jurusan,
        angkatan: Number(angkatan),
        totalPoin: 0,
      },
    });

    return NextResponse.json({ success: true, data: userUpdate });
  } catch (error) {
    console.error("Detail Error Database:", error);
    return NextResponse.json({ success: false, error: 'Gagal memproses ke database' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}