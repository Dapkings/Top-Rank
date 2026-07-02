'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardMahasiswa() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profil' | 'riwayat' | 'leaderboard' | 'reward' | 'ai'>('profil');
  
  // State Profil Mahasiswa
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [nim, setNim] = useState('');
  const [jurusan, setJurusan] = useState('');
  const [angkatan, setAngkatan] = useState('');
  const [profilSelesai, setProfilSelesai] = useState(false);
  
  // State Input Pengajuan
  const [tipe, setTipe] = useState('SERTIKAT'); 
  const [kategori, setKategori] = useState('Lokal (1 Poin)'); 
  const [judul, setJudul] = useState('');
  
  // State Data Real-time Backend
  const [totalPoin, setTotalPoin] = useState(0);
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  
  const [loadingSimpan, setLoadingSimpan] = useState(false);
  const [pesan, setPesan] = useState('');

  const [dataAI, setDataAI] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const muatRekomendasiAI = async () => {
    setLoadingAI(true);
    try {
      const res = await fetch('/api/mahasiswa/rekomendasi');
      const hasil = await res.json();
      if (hasil.success) {
        setDataAI(hasil.analisisAI);
      }
    } catch (err) {
      console.error('Gagal memuat rekomendasi AI');
    } finally {
      setLoadingAI(false);
    }
  };

  // 1. FUNGSI UTAMA: SINKRONISASI DATA & MENJAGA STATE SAAT REFRESH
  const muatDataDashboard = async () => {
    if (typeof window === 'undefined') return;
    
    // Ambil email dari localStorage hasil login
    const emailSesi = localStorage.getItem('userEmail') || '';
    if (!emailSesi) {
      // Jika email session kosong, tendang kembali ke halaman login
      router.push('/');
      return;
    }

    // Set state email agar form input email sinkron dengan session login
    setEmail(emailSesi);

    try {
      const res = await fetch('/api/mahasiswa/dashboard', {
        method: 'GET',
        headers: { 'x-user-email': emailSesi }
      });
      const hasil = await res.json();
      
      if (hasil.success) {
  setTotalPoin(hasil.totalPoin || 0);
  setRiwayat(hasil.riwayatPengajuan || []);
  setLeaderboardData(hasil.leaderboard || []);
  
  // Ambil data nama dari database jika ada, jika tidak ada pakai inputan kosong
  setNama(hasil.nama || '');
  setNim(hasil.nim || '');
  setJurusan(hasil.jurusan || '');
  setAngkatan(String(hasil.angkatan || ''));

  // 🛠️ PERBAIKAN: Form HANYA mengunci jika NIM sudah terisi di database
  if (hasil.nim) {
    setProfilSelesai(true); 
  } else {
    setProfilSelesai(false); // Form tetap terbuka jika NIM masih kosong
  }
}
    } catch (err) {
      console.error('Gagal memuat data sinkronisasi dashboard:', err);
    }
  };

  // Panggil fungsi sinkronisasi setiap kali komponen dimuat (termasuk setelah refresh)
  useEffect(() => {
    muatDataDashboard();
  }, []);

  // 2. FUNGSI SIMPAN & KUNCI PROFIL KE DATABASE
  const handleSimpanProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !email || !nim || !jurusan) {
      return alert('Mohon lengkapi seluruh field profil terlebih dahulu!');
    }
    
    try {
      const response = await fetch('/api/mahasiswa/profil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(), // Pastikan tidak ada spasi tidak sengaja
          nama, 
          nim, 
          jurusan, 
          angkatan: Number(angkatan) 
        }),
      });
      const hasil = await response.json();
      
      if (hasil.success) {
        setProfilSelesai(true);
        // Perbarui email di localStorage untuk memastikan sinkronisasi sesi berikutnya aman
        localStorage.setItem('userEmail', email.trim());
        alert('✅ Profil sukses disimpan ke database & fitur pengajuan terbuka!');

      } else {
        alert(hasil.error || 'Gagal menyimpan data profil.');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi ke server.');
    }
  };

  // 3. FUNGSI SUBMIT PENGAJUAN SERTIFIKAT / PORTOFOLIO
  const handleSubmitPengajuan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul) return alert('Judul tidak boleh kosong!');
    setLoadingSimpan(true);
    setPesan('');

    try {
      const response = await fetch('/api/pengajuan', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': email
        },
        body: JSON.stringify({ tipe, kategori, judul }),
      });
      const hasil = await response.json();
      
      if (hasil.success) {
        setPesan('🎉 Pengajuan berhasil dikirim! Menunggu verifikasi admin.');
        setJudul('');
        await muatDataDashboard(); // Paksa reload agar riwayat langsung muncul di tab sebelah
      } else {
        setPesan(`❌ ${hasil.error || 'Gagal mengirim pengajuan.'}`);
      }
    } catch (err) {
      setPesan('❌ Terjadi kesalahan jaringan.');
    } finally {
      setLoadingSimpan(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* TOP BAR BARIS ATAS */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Mahasiswa 🎓</h1>
            <p className="text-xs text-slate-400">Selamat datang, silakan lengkapi profil Anda</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Total Poin Kamu</span>
              <span className="text-xl font-bold text-amber-400">{totalPoin} Poin</span>
            </div>
            <button onClick={handleLogout} className="bg-red-950/30 hover:bg-red-900/40 border border-red-900/50 text-red-400 font-bold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer">
              Logout 🚪
            </button>
          </div>
        </div>

        {/* TABS MENU UTAMA */}
        <div className="flex flex-wrap gap-2 text-xs font-semibold border-b border-slate-800 pb-4">
          <button onClick={() => setActiveTab('profil')} className={`px-4 py-2.5 rounded-xl transition-all ${activeTab === 'profil' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}>
            🚀 Isi Profil & Pengajuan
          </button>
          <button onClick={() => setActiveTab('riwayat')} className={`px-4 py-2.5 rounded-xl transition-all ${activeTab === 'riwayat' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}>
            📄 Status Pengajuan ({riwayat.length})
          </button>
          <button onClick={() => setActiveTab('leaderboard')} className={`px-4 py-2.5 rounded-xl transition-all ${activeTab === 'leaderboard' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}>
            🏆 Leaderboard Campus
          </button>
          <button onClick={() => setActiveTab('reward')} className={`px-4 py-2.5 rounded-xl transition-all ${activeTab === 'reward' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}>
            🎁 Tukar Poin Reward
          </button>
          <button onClick={() => setActiveTab('ai')} className={`px-4 py-2.5 rounded-xl transition-all ${activeTab === 'ai' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}>
            🤖 Rekomendasi AI
          </button>
        </div>

        {/* AREA PANEL CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'profil' && (
              <>
                {/* 1. MENGISI / LENGKAPI PROFIL */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-blue-400 mb-4 flex items-center gap-2">
                    <span className="bg-blue-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">1</span>
                    Mengisi / Lengkapi Profil
                  </h3>
                  
                  <form onSubmit={handleSimpanProfil} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Nama Lengkap</label>
                        <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Dava Agus" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none disabled:opacity-40" disabled={profilSelesai} required />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Email Kampus / Aktif</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Contoh: dava@dosen.com" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none disabled:opacity-40" disabled={profilSelesai} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">NIM Mahasiswa</label>
                        <input type="text" value={nim} onChange={(e) => setNim(e.target.value)} placeholder="Contoh: 24.01.5152" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none disabled:opacity-40" disabled={profilSelesai} required />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Jurusan / Prodi</label>
                        <input type="text" value={jurusan} onChange={(e) => setJurusan(e.target.value)} placeholder="Contoh: Teknik Informatika" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none disabled:opacity-40" disabled={profilSelesai} required />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Angkatan</label>
                        <input type="number" value={angkatan} onChange={(e) => setAngkatan(e.target.value)} placeholder="Contoh: 2024" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none disabled:opacity-40" disabled={profilSelesai} required />
                      </div>
                    </div>
                    
                    {!profilSelesai ? (
                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-3 rounded-xl text-sm transition-all cursor-pointer">
                        Simpan & Kunci Profil
                      </button>
                    ) : (
                      <div className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold py-3 rounded-xl text-center">
                        ✓ Profil Berhasil Terkunci Ke Sistem
                      </div>
                    )}
                  </form>
                </div>

                {/* 2. TAMBAH SKILL / SERTIFIKAT */}
                <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 relative transition-all duration-300 ${!profilSelesai ? 'opacity-30 pointer-events-none select-none' : 'opacity-100'}`}>
                  
                  {!profilSelesai && (
                    <div className="absolute inset-0 bg-transparent flex items-center justify-center z-10">
                      <span className="bg-slate-950/90 border border-slate-800 text-slate-400 text-xs px-4 py-2.5 rounded-xl font-medium shadow-2xl">
                        🔒 Fitur Terkunci! Harap klik "Simpan & Kunci Profil" di atas untuk aktivasi form.
                      </span>
                    </div>
                  )}

                  <h3 className="text-sm font-bold text-blue-400 mb-4 flex items-center gap-2">
                    <span className="bg-blue-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">2</span>
                    Tambah Skill / Sertifikat / Portofolio
                  </h3>
                  
                  <form onSubmit={handleSubmitPengajuan} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Tipe Pengajuan</label>
                        <select value={tipe} onChange={(e) => setTipe(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none">
                          <option value="SERTIKAT">Sertifikat Lomba / Pelatihan</option>
                          <option value="PORTFOLIO">Portofolio Project / Freelance</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Kategori Tingkat</label>
                        <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none">
                          <option value="Lokal (1 Poin)">Lokal (1 Poin)</option>
                          <option value="Nasional (5 Poin)">Nasional (5 Poin)</option>
                          <option value="Kerja Industri / Magang (8 Poin)">Kerja Industri / Magang (8 Poin)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Judul / Nama Kegiatan</label>
                      <input type="text" value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Contoh: Web Portofolio E-Commerce" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none" required />
                    </div>

                    <button type="submit" disabled={loadingSimpan} className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-3 rounded-xl text-sm transition-all cursor-pointer">
                      {loadingSimpan ? 'Mengirim Data...' : 'Submit untuk Verifikasi'}
                    </button>

                    {pesan && <p className="text-xs text-center font-medium bg-slate-950 p-3 rounded-xl border border-slate-800 mt-2">{pesan}</p>}
                  </form>
                </div>
              </>
            )}

            {/* TAB RIWAYAT STATUS PENGAJUAN */}
            {activeTab === 'riwayat' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
                <h3 className="text-base font-bold">Daftar Dokumen Pengajuan Anda</h3>
                {riwayat.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada pengajuan portofolio terkirim atau disinkronisasi.</p>
                ) : (
                  riwayat.map((item: any) => (
                    <div key={item.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-[9px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono font-bold">{item.tipe}</span>
                        <h4 className="text-sm font-bold mt-1 text-white">{item.judul}</h4>
                        <p className="text-[10px] text-slate-500">Kategori: {item.kategori || 'Umum'}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${item.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : item.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {item.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB LEADERBOARD */}
            {activeTab === 'leaderboard' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-base font-bold mb-4">🏆 Peringkat Kompetensi Kampus</h3>
                <div className="space-y-2">
                  {leaderboardData.map((mhs: any, idx: number) => (
                    <div key={mhs.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-bold text-xs w-4">#{idx + 1}</span>
                        <div>
                          <p className="text-sm font-bold text-white">{mhs.nama || 'Anonim'}</p>
                          <p className="text-[11px] text-slate-500">{mhs.nim} — {mhs.jurusan}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-400 bg-amber-400/5 px-2.5 py-1 rounded-lg border border-amber-500/10">{mhs.totalPoin || 0} Poin</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB REWARD */}
            {activeTab === 'reward' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-base font-bold mb-2">🎁 Penukaran Poin Reward</h3>
                <p className="text-xs text-slate-400 mb-6">Tukarkan poin kompetensi Anda dengan benefit internal perguruan tinggi.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Voucher Kantin Perguruan Tinggi</h4>
                      <p className="text-[11px] text-slate-500 mt-1">Dapat digunakan sebagai potongan makan/minum gratis.</p>
                    </div>
                    <button className="mt-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2 px-4 rounded-xl text-xs transition-all cursor-pointer">Tukar 10 Poin</button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB AI */}
{activeTab === 'ai' && (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
    <div className="text-center py-4 space-y-2 border-b border-slate-800/60 pb-5">
      <div className="text-3xl">🤖</div>
      <h3 className="text-base font-bold text-white">Rekomendasi Karir & Skill Berbasis AI</h3>
      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
        Sistem kecerdasan buatan sedang memetakan portofolio unggulan Anda untuk dicocokkan dengan postingan opportunity.
      </p>
    </div>

    {loadingAI ? (
      <p className="text-xs text-amber-500 animate-pulse text-center py-4">AI sedang mengompilasi portofolio Anda...</p>
    ) : dataAI ? (
      <div className="space-y-4">
        {dataAI.rekomendasiKarir.map((karir: any) => (
          <div key={karir.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-white">{karir.posisi}</span>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md font-mono">{karir.perusahaan}</span>
              </div>
              <p className="text-xs text-slate-400">{karir.deskripsi}</p>
              
              <div className="pt-2 flex flex-wrap gap-1">
                {karir.alasanRekomendasi.map((alasan: string, idx: number) => (
                  <span key={idx} className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    • {alasan}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-right bg-slate-900 p-3 rounded-xl border border-slate-800 min-w-[120px] w-full md:w-auto">
              <span className="text-[9px] text-slate-400 font-bold uppercase block">AI Match Score</span>
              <span className={`text-xl font-black block mt-0.5 ${karir.skorMatch >= 70 ? 'text-emerald-400' : 'text-amber-500'}`}>
                {karir.skorMatch}%
              </span>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="flex justify-center pt-2">
        <button 
          onClick={muatRekomendasiAI} 
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-xs px-5 py-2.5 rounded-xl text-white font-bold hover:opacity-90 transition-all shadow-md shadow-blue-950"
        >
          Mulai Analisis AI Sekarang 🔮
        </button>
      </div>
    )}
  </div>
)}
          </div>

          {/* RIGHT ALUR BAR */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="font-bold text-xs text-slate-200">Peta Alur Sistem 🗺️</h4>
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="border-l-2 border-blue-500 pl-3">
                <p className="font-bold text-slate-300">1. Mengisi Profil</p>
                <p className="text-slate-500 mt-0.5">Mahasiswa melengkapi data profil.</p>
              </div>
              <div className="border-l-2 border-blue-500 pl-3">
                <p className="font-bold text-slate-300">2. Upload Prestasi</p>
                <p className="text-slate-500 mt-0.5">Isi deskripsi skill atau hasil portofolio.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}