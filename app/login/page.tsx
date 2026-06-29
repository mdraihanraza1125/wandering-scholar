'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center font-sans p-6">
      
      {/* Back to home link */}
      <Link href="/" className="absolute top-8 left-8 text-[10px] font-bold tracking-widest uppercase text-gray-500 hover:text-black transition">
        ← Back to Home
      </Link>

      <div className="bg-white p-10 md:p-14 w-full max-w-md shadow-2xl border border-gray-100 rounded-lg">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-wider mb-2">ADMIN LOGIN</h1>
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">THE WANDERING SCHOLAR</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 mb-6 rounded text-xs font-bold text-center border border-red-100">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-8">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full text-black bg-transparent border-b-2 border-gray-200 py-3 text-sm focus:outline-none focus:border-[#b45f1b] transition placeholder-gray-300 font-medium"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Password</label>
            </div>
            {/* type="password" makes the text show as dots! */}
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full text-black bg-transparent border-b-2 border-gray-200 py-3 text-lg tracking-widest focus:outline-none focus:border-[#b45f1b] transition placeholder-gray-300 font-medium"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-4 text-xs font-bold tracking-widest uppercase rounded shadow-lg transition ${loading ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-[#111] text-white hover:bg-[#b45f1b]'}`}
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
}