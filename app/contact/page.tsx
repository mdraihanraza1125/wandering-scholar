'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

const ArrowLeft = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;

export default function ContactUsPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aboutData, setAboutData] = useState({ heading: 'About The Wandering Scholar', text: 'Welcome to my digital journal...' });

  useEffect(() => {
    async function fetchAbout() {
      const { data } = await supabase.from('author_profile').select('about_heading, about_text').eq('id', 1).single();
      if (data && data.about_heading) {
        setAboutData({ heading: data.about_heading, text: data.about_text });
      }
    }
    fetchAbout();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!formData.name || !formData.email || !formData.message) return;
    
    setIsSubmitting(true);
    setStatus('Sending your dispatch...');

    const { error } = await supabase.from('messages').insert([{
      name: formData.name, email: formData.email, message: formData.message
    }]);

    if (!error) {
      setStatus('Message sent successfully! 📬 I will reply shortly.');
      setFormData({ name: '', email: '', message: '' });
    } else {
      console.error(error);
      // Agar Supabase block kare (RLS error)
      setStatus('Error: Could not send. Make sure RLS is disabled on messages table in Supabase.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-gray-900 font-serif">
      <header className="bg-white py-4 px-6 border-b border-gray-100 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <Link href="/" className="text-gray-500 hover:text-black flex items-center gap-2 text-xs font-bold tracking-widest font-sans uppercase"><ArrowLeft /> HOME</Link>
        <span className="font-black tracking-widest text-sm font-sans uppercase">CONTACT & PROFILE</span>
        <div className="w-20"></div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-20">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-[10px] font-bold text-[#b45f1b] uppercase tracking-[0.2em] font-sans block">— The Manifest —</span>
            <h1 className="text-4xl font-black text-gray-900 leading-tight">{aboutData.heading}</h1>
            <div className="text-sm text-gray-600 font-sans leading-relaxed whitespace-pre-wrap">
              {aboutData.text}
            </div>
          </div>
          <div className="relative aspect-[4/5] bg-gray-100 rounded-2xl overflow-hidden shadow-xl border-4 border-white">
            <img src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80" className="w-full h-full object-cover" />
          </div>
        </section>

        <section className="bg-white border border-gray-200 p-8 md:p-12 rounded-3xl shadow-xl max-w-2xl mx-auto">
          <div className="text-center mb-8 space-y-2">
            <h2 className="text-2xl font-black font-sans uppercase tracking-wider text-gray-900">Get In Touch</h2>
            <p className="text-xs text-gray-500 font-sans">Have an alliance project, historical lead, or a travel query? Send a dispatch.</p>
          </div>

          <form onSubmit={handleSubmit} className="font-sans space-y-6">
            <div>
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-widest block mb-2">Full Name</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-[#faf8f5] border border-gray-300 text-xs p-3.5 rounded-xl w-full focus:outline-none focus:border-[#b45f1b] focus:bg-white" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-widest block mb-2">Email Address</label>
              <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-[#faf8f5] border border-gray-300 text-xs p-3.5 rounded-xl w-full focus:outline-none focus:border-[#b45f1b] focus:bg-white" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-widest block mb-2">Your Message</label>
              <textarea required rows="5" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="bg-[#faf8f5] border border-gray-300 text-xs p-3.5 rounded-xl w-full focus:outline-none focus:border-[#b45f1b] focus:bg-white resize-none" />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white py-4 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#b45f1b] transition-all shadow-md disabled:bg-gray-400">
              {isSubmitting ? 'Sending...' : 'Send Secure Message 🚀'}
            </button>

            {status && <div className={`p-4 text-xs font-bold rounded-xl border text-center animate-fadeIn ${status.includes('Error') ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'}`}>{status}</div>}
          </form>
        </section>
      </main>
    </div>
  );
}