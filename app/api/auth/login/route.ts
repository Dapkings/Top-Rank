import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email wajib diisi!' }, { status: 400 });
    }

    // Cari user berdasarkan email di database
    let user = await prisma.user.findUnique({
      where: { email: email }
    });

    // Simulasi Auto-Register jika akun belum ada (biar gampang ditesting)
    if (!user) {
      // Jika email mengandung kata 'admin', buat sebagai ADMIN
      const penentuanRole = email.toLowerCase().includes('admin') ? 'ADMIN' : 'MAHASISWA';
      
      user = await prisma.user.create({
        data: {
          email: email,
          nama: email.split('@')[0], // ambil nama depan email
          role: penentuanRole,
          totalPoin: 0
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Login berhasil!',
      user: {
        email: user.email,
        role: user.role,
        nama: user.nama
      }
    });

  } catch (error) {
    console.error('Auth Error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}