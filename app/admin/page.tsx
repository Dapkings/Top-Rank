'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'verifikasi' | 'mahasiswa' | 'opportunity'>('overview');
  
  const [statistik, setStatistik] = useState({
    totalMahasiswa: 0,
    totalPengajuanMasuk: 0,
    butuhVerifikasi: 0,
    totalPoinTerdistribusi: 0
  });
  
  const [daftarBerkas, setDaftarBerkas] = useState<any[]>([]);
  const [daftarMahasiswa, setDaftarMahasiswa] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [kataKunci, setKataKunci] = useState('');

  const muatDataAdmin = async () => {
    try {
      const res = await fetch('/api/admin');
      const hasil = await res.json();
      if (hasil.success) {
        setStatistik(hasil.statistik);
        setDaftarBerkas(hasil.daftarPengajuan || []);
        setDaftarMahasiswa(hasil.semuaMahasiswa || []);
      }
    } catch (err) {
      console.error('Gagal memuat data admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    muatDataAdmin();
  }, []);

  const handleAksiVerifikasi = async (id: any, statusBaru: 'APPROVED' | 'REJECTED') => {
  try {
    // URL disesuaikan dengan struktur foldermu: app/api/admin/route.ts
    const res = await fetch('/api/admin', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: Number(id), 
        status: statusBaru 
      })
    });

    const hasil = await res.json();

    if (hasil.success) {
      alert(`Berhasil merubah status menjadi ${statusBaru}!`);
      await muatDataAdmin();
    } else {
      alert(hasil.error || 'Gagal mengubah status.');
    }
  } catch (err) {
    console.error(err);
    alert('Terjadi kesalahan jaringan atau server mati.');
  }
};

  const mahasiswaTerfilter = daftarMahasiswa.filter((mhs: any) => {
    const kueri = kataKunci.toLowerCase();
    return (
      mhs.nama?.toLowerCase().includes(kueri) ||
      mhs.nim?.toLowerCase().includes(kueri) ||
      mhs.jurusan?.toLowerCase().includes(kueri) ||
      mhs.email?.toLowerCase().includes(kueri)
    );
  });

  // LOGIKA OVERVIEW: Hitung Berapa Jumlah Mahasiswa Per Prodi Secara Dinamis
  const hitungProdi = () => {
    const pemetaan: { [key: string]: number } = {};
    daftarMahasiswa.forEach((m) => {
      const prodi = m.jurusan || 'Belum Mengisi Profil';
      pemetaan[prodi] = (pemetaan[prodi] || 0) + 1;
    });
    return Object.entries(pemetaan);
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Memuat Panel Admin...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER BAR */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-red-500 flex items-center gap-2">Admin Command Center 🛠️</h1>
            <p className="text-xs text-slate-400">Sistem Kontrol Verifikasi Prestasi & Gamifikasi Kampus</p>
          </div>
          <button onClick={() => router.push('/')} className="bg-slate-900 border border-slate-800 text-xs px-4 py-2 rounded-xl text-amber-500 font-bold hover:bg-slate-800 transition-all">
            Keluar Panel 🚪
          </button>
        </div>

        {/* 4 KARTU STATISTIK UTAMA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            onClick={() => setActiveTab('mahasiswa')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${activeTab === 'mahasiswa' ? 'bg-red-950/40 border-red-500 shadow-md' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
          >
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Mahasiswa (Klik Detail) 🔍</span>
            <span className="text-2xl font-black text-white mt-1 block">{statistik.totalMahasiswa} Orang</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pengajuan Masuk</span>
            <span className="text-2xl font-black text-blue-400 mt-1 block">{statistik.totalPengajuanMasuk} Berkas</span>
          </div>

          <div 
            onClick={() => setActiveTab('verifikasi')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 ${activeTab === 'verifikasi' ? 'bg-red-950/40 border-red-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
          >
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Butuh Verifikasi</span>
            <span className="text-2xl font-black text-amber-500 mt-1 block">{statistik.butuhVerifikasi} Berkas</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Poin Terdistribusi</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">{statistik.totalPoinTerdistribusi} Poin</span>
          </div>
        </div>

        {/* TOMBOL NAVIGASI TAB MENU */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'overview' ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}>
            📊 Overview Statistik
          </button>
          <button onClick={() => setActiveTab('verifikasi')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'verifikasi' ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}>
            🧾 Verifikasi Dokumen ({statistik.butuhVerifikasi})
          </button>
          <button onClick={() => setActiveTab('mahasiswa')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'mahasiswa' ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}>
            👥 Data Kompetensi Mahasiswa ({statistik.totalMahasiswa})
          </button>
          <button onClick={() => setActiveTab('opportunity')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'opportunity' ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}>
            📢 Post Opportunity Job
          </button>
        </div>

        {/* 1. OVERVIEW TAB (KINI SUDAH ADA METRIK AKTIVITAS & SEBARAN TALENT) */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Kartu Sebaran Prodi */}
            <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">🎓 Sebaran Prodi Mahasiswa</h3>
              <div className="space-y-2">
                {hitungProdi().map(([prodi, jumlah]: any) => (
                  <div key={prodi} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800/50">
                    <span className="text-xs text-white truncate max-w-[150px] font-medium">{prodi}</span>
                    <span className="text-xs bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full font-bold">{jumlah} Mhs</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Kartu Feed Aktivitas Pengajuan Terkini */}
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">⏱️ Log Berkas Masuk Terakhir</h3>
              <div className="space-y-2">
                {daftarBerkas.slice(0, 4).map((berkas: any) => (
                  <div key={berkas.id} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                    <div>
                      <p className="font-bold text-white">{berkas.judul}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Tipe: {berkas.tipe} • User ID: {berkas.userId}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${berkas.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : berkas.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {berkas.status}
                    </span>
                  </div>
                ))}
                {daftarBerkas.length === 0 && (
                  <p className="text-xs text-slate-500 italic p-4 text-center">Belum ada aktivitas riwayat pengajuan dari mahasiswa.</p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* 2. VERIFIKASI TAB */}
        {activeTab === 'verifikasi' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">📥 Antrean Validasi Portofolio & Sertifikat</h3>
            {daftarBerkas.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Belum ada berkas portofolio masuk.</p>
            ) : (
              <div className="space-y-3">
                {daftarBerkas.map((berkas: any) => (
                  <div key={berkas.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-bold text-slate-400">{berkas.tipe}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${berkas.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : berkas.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {berkas.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">{berkas.judul}</h4>
                    </div>

                    {berkas.status === 'PENDING' && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAksiVerifikasi(berkas.id, 'APPROVED')} className="bg-emerald-600 hover:bg-emerald-500 text-xs px-3 py-1.5 rounded-lg text-white font-bold transition-all">
                          ✓ Approve
                        </button>
                        <button onClick={() => handleAksiVerifikasi(berkas.id, 'REJECTED')} className="bg-red-600 hover:bg-red-500 text-xs px-3 py-1.5 rounded-lg text-white font-bold transition-all">
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. DATA KOMPETENSI / MAHASISWA TAB */}
        {activeTab === 'mahasiswa' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">👥 Leaderboard Kompetensi & Data Mahasiswa</h3>
              <div className="relative w-full sm:w-72">
                <input 
                  type="text" 
                  value={kataKunci}
                  onChange={(e) => setKataKunci(e.target.value)}
                  placeholder="Cari prodi, nama, atau NIM... 🔍" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-all"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950">
                    <th className="p-3">Nama Lengkap</th>
                    <th className="p-3">NIM</th>
                    <th className="p-3">Jurusan / Prodi</th>
                    <th className="p-3">Email Sesi</th>
                    <th className="p-3 text-center">Akumulasi Poin</th>
                  </tr>
                </thead>
                <tbody>
                  {mahasiswaTerfilter.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-500 italic">Data mahasiswa tidak ditemukan.</td>
                    </tr>
                  ) : (
                    mahasiswaTerfilter.map((mhs: any) => (
                      <tr key={mhs.id} className="border-b border-slate-800/60 hover:bg-slate-950/40 transition-colors">
                        <td className="p-3 font-bold text-white">{mhs.nama}</td>
                        <td className="p-3 text-slate-300 font-mono">{mhs.nim || '-'}</td>
                        <td className="p-3 text-slate-300">{mhs.jurusan || '-'}</td>
                        <td className="p-3 text-slate-400">{mhs.email}</td>
                        <td className="p-3 text-center font-bold text-emerald-400 bg-emerald-500/5">{mhs.totalPoin || 0} Pts</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. POST OPPORTUNITY JOB TAB */}
        {activeTab === 'opportunity' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">📢 Publikasi Peluang Kerja / Magang Baru</h3>
            <p className="text-xs text-slate-400">Gunakan formulir ini untuk menyebarkan info lowongan karir eksklusif kepada mahasiswa yang memenuhi batas poin minimum prestasi.</p>
            
            <form className="space-y-4 max-w-xl" onSubmit={(e) => { e.preventDefault(); alert('Fitur simpan draft lowongan berhasil dipicu!'); }}>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 block">Nama Posisi Pekerjaan</label>
                <input type="text" placeholder="Contoh: Junior Web Developer Internship" className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-red-500" required />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 block">Nama Perusahaan / Instansi</label>
                <input type="text" placeholder="Contoh: PT. Tech Solusindo Utama" className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-red-500" required />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 block">Deskripsi Singkat & Kualifikasi</label>
                <textarea rows={3} placeholder="Sebutkan requirements skill dan benefit magang..." className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-red-500" required></textarea>
              </div>
              <button type="submit" className="bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-bold rounded-xl transition-all">
                Publish Lowongan Pekerjaan 🚀
              </button>
            </form>
          </div>
        )}

      </div>
    </main>
  );
}