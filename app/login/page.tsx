'use client';
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('thewonderingscholar@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg('Invalid email or password. Please try again.');
    } else {
      window.location.href = '/admin'; // Login success hone par admin dashboard par bhej dega
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center font-sans px-6">
      <div className="max-w-md w-full bg-white p-10 shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 font-serif uppercase tracking-widest">
            Admin Login
          </h1>
          <p className="text-[11px] text-gray-500 tracking-widest uppercase mt-2">
            The Wandering Scholar
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 text-xs p-3 mb-6 font-bold text-center border border-red-100">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold tracking-widest uppercase text-gray-600">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 p-3 text-sm focus:border-amber-700 focus:outline-none bg-gray-50"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold tracking-widest uppercase text-gray-600">
                Password
              </label>
              <span className="text-[9px] text-amber-700 cursor-pointer hover:underline uppercase tracking-widest">
                Forgot?
              </span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 p-3 text-sm focus:border-amber-700 focus:outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-[#111] hover:bg-[#222] text-white font-bold py-4 px-8 w-full uppercase tracking-widest text-[11px] transition duration-300 mt-4 disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : 'SECURE LOGIN'}
          </button>
        </form>
      </div>
    </div>
  );
}
