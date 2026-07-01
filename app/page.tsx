'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingLoginPage() {
  const router = useRouter();
  
  // State untuk melacak role apa yang sedang dipilih untuk login
  const [selectedRole, setSelectedRole] = useState<'MAHASISWA' | 'ADMIN' | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorPesan, setErrorPesan] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return alert('Silakan masukkan email Anda!');
    
    setLoading(true);
    setErrorPesan('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const hasil = await response.json();

      if (hasil.success) {
        // Simpan sesi login lokal sederhana
        localStorage.setItem('userRole', hasil.user.role);
        localStorage.setItem('userEmail', hasil.user.email);

        // Arahkan ke dashboard yang sesuai (Fitur 1 Admin/Mahasiswa)
        if (hasil.user.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/mahasiswa');
        }
      } else {
        setErrorPesan(hasil.error || 'Login gagal, periksa email Anda.');
      }
    } catch (err) {
      setErrorPesan('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* BACKGROUND GLOW EFFECT (Biar mirip style di gambar) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-2xl text-center z-10 space-y-6">
        
        {/* TAG BADGE */}
        <div className="inline-block bg-blue-950/60 border border-blue-800/40 text-blue-400 text-xs font-semibold px-4 py-1.5 rounded-full shadow-inner">
          TopRank Logic AI Development #3
        </div>

        {/* JUDUL UTAMA */}
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight leading-none">
          University Talent <br />
          <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Hub</span>
        </h1>

        {/* DESKRIPSI */}
        <p className="text-sm md:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
          Ekosistem berbasis <span className="text-amber-400 font-semibold">Gamifikasi</span> untuk memetakan, mengembangkan, dan mempertemukan talenta mahasiswa dengan berbagai peluang.
        </p>

        {/* JIKA BELUM PILIH ROLE: TAMPILKAN DUA TOMBOL UTAMA */}
        {selectedRole === null ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <button 
              onClick={() => setSelectedRole('MAHASISWA')}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-98 cursor-pointer"
            >
              Masuk sebagai Mahasiswa
            </button>
            <button 
              onClick={() => setSelectedRole('ADMIN')}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold px-6 py-3.5 rounded-xl text-sm transition-all active:scale-98 cursor-pointer"
            >
              Masuk sebagai Administrator
            </button>
          </div>
        ) : (
          /* JIKA TOMBOL DIKLIK: TAMPILKAN FORM LOGIN INPUT */
          <div className="max-w-md mx-auto bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-2xl backdrop-blur-sm text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-slate-200">
                Login Gateway: <span className="text-blue-400">{selectedRole}</span>
              </h3>
              <button 
                onClick={() => { setSelectedRole(null); setErrorPesan(''); }} 
                className="text-xs text-slate-500 hover:text-slate-300 transition-all"
              >
                ← Kembali
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Masukkan Email Valid Akun Anda
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={selectedRole === 'ADMIN' ? "Contoh: superadmin@kampus.com" : "Contoh: andi@mahasiswa.com"} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                  autoFocus
                  required
                />
              </div>

              {errorPesan && (
                <p className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg text-center">
                  {errorPesan}
                </p>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-40 cursor-pointer"
              >
                {loading ? 'Menghubungkan Sesi...' : `Autentikasi ${selectedRole} 🚀`}
              </button>
            </form>
          </div>
        )}

      </div>
    </main>
  );
}