import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // 1. Ambil data mahasiswa yang sedang login (Ganti ID sesuai sistem auth kamu, misal ID: 1)
    const mahasiswaId = 1; 

    const user = await prisma.user.findUnique({
      where: { id: mahasiswaId },
      include: {
        // Ganti dengan nama relasi tabel portofolio/pengajuan di schema.prisma kamu
        pengajuan: { 
          where: { status: 'APPROVED' } 
        }
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
    }

    // 2. Kumpulkan semua keyword kompetensi dari jurusan dan judul sertifikat mahasiswa
    const userMhs = user as any;
    const prodiMhs = userMhs?.jurusan?.toLowerCase() || '';
    const sertifikatMhs = userMhs?.pengajuan?.map((p: any) => p.judul?.toLowerCase() || '').join(' ') || '';
    const totalPoin = userMhs?.totalPoin || 0;

    // 3. Mock Data Opportunity / Lowongan Kerja (Bisa kamu ganti ambil dari DB jika sudah ada tabel lowongan)
    const daftarLowongan = [
      {
        id: 1,
        posisi: 'React & Next.js Frontend Developer',
        perusahaan: 'PT. Tech Solusindo Utama',
        prodiCocok: 'informatika',
        skillWajib: 'web',
        poinMin: 10,
        deskripsi: 'Membangun dashboard interaktif skala enterprise dengan performa tinggi.'
      },
      {
        id: 2,
        posisi: 'UI/UX Designer Specialist',
        perusahaan: 'Creative Studio Digital',
        prodiCocok: 'sistem informasi',
        skillWajib: 'design',
        poinMin: 5,
        deskripsi: 'Merancang user flow dan wireframing aplikasi mobile & web modern.'
      },
      {
        id: 3,
        posisi: 'AI & Data Analyst Intern',
        perusahaan: 'Sains Data Analytics Corp',
        prodiCocok: 'informatika',
        skillWajib: 'python',
        poinMin: 15,
        deskripsi: 'Mengolah big data kampus untuk keperluan predictive analysis bisnis.'
      }
    ];

    // 4. Proses Algoritma "AI Matching" Dinamis
    const hasilRekomendasi = daftarLowongan.map((job) => {
      let skorKecocokan = 0;
      let alasan = [];

      // Cek kesesuaian Prodi
      if (prodiMhs.includes(job.prodiCocok)) {
        skorKecocokan += 40;
        alasan.push(`Jurusan Anda (${userMhs.jurusan}) sangat linear`);
      }

      // Cek kesesuaian Skill dari riwayat sertifikat/portofolio
      if (sertifikatMhs.includes(job.skillWajib)) {
        skorKecocokan += 40;
        alasan.push(`Sertifikat portofolio Anda divalidasi memiliki keahlian terkait`);
      }

      // Cek kecukupan Poin Akumulasi Gamifikasi
      if (totalPoin >= job.poinMin) {
        skorKecocokan += 20;
      } else {
        alasan.push(`Disarankan menaikkan poin prestasi lagi sebanyak ${job.poinMin - totalPoin} Pts`);
      }

      return {
        ...job,
        skorMatch: skorKecocokan,
        alasanRekomendasi: alasan.length > 0 ? alasan : ['Kualifikasi umum terpenuhi']
      };
    }).sort((a, b) => b.skorMatch - a.skorMatch); // Urutkan dari skor kecocokan AI tertinggi

    return NextResponse.json({
      success: true,
      analisisAI: {
        nama: user.nama,
        totalPoin: totalPoin,
        rekomendasiKarir: hasilRekomendasi
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Gagal memproses rekomendasi AI' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}