'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase'; // Path dhyan rakhna
import Link from 'next/link';
import { useParams } from 'next/navigation';

// --- ICONS ---
const ArrowLeft = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const ShareIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>;

export default function SingleStory() {
  const { id } = useParams();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStory() {
      if (id) {
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('id', id)
          .single();
          
        if (data) setStory(data);
      }
      setLoading(false);
    }
    fetchStory();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-[#b45f1b] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!story && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf8f5] font-sans">
        <h1 className="text-5xl font-black text-[#b45f1b] mb-4">404</h1>
        <p className="text-xl font-bold mb-8">Story Not Found</p>
        <Link href="/" className="bg-black text-white px-8 py-3 rounded uppercase text-xs font-bold tracking-widest hover:bg-[#b45f1b] transition">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-gray-900 font-serif selection:bg-[#b45f1b] selection:text-white">
      
      {/* CSS Animations & Quill Fixes */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-up { animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        
        /* Reader Formatting */
        .story-content p { margin-bottom: 1.5em; line-height: 1.8; font-size: 1.125rem; color: #374151; }
        .story-content h2, .story-content h3 { font-family: sans-serif; font-weight: 900; margin-top: 2em; margin-bottom: 1em; color: #111; }
        .story-content img { max-width: 100%; border-radius: 12px; margin: 2em 0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
      `}} />

      {/* MINIMAL HEADER */}
      <header className="bg-white py-4 px-6 border-b border-gray-100 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <button onClick={() => window.history.back()} className="text-gray-500 hover:text-black transition-colors flex items-center gap-2 text-xs font-bold tracking-widest uppercase font-sans">
          <ArrowLeft /> <span>Back</span>
        </button>
        <Link href="/" className="font-serif font-black tracking-widest text-lg text-black">STUDIO.</Link>
        <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="text-gray-500 hover:text-[#b45f1b] transition-colors" title="Copy Link">
          <ShareIcon />
        </button>
      </header>

      <main className="pb-20">
        {/* HERO IMAGE SECTION */}
        <section className="relative w-full h-[50vh] md:h-[70vh] bg-black overflow-hidden">
          <img 
            src={story.image_url} 
            alt={story.title} 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
        </section>

        {/* STORY HEADER (Title & Meta) */}
        <section className="max-w-3xl mx-auto px-6 -mt-32 relative z-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white p-8 md:p-12 rounded-t-2xl shadow-2xl border-t-4 border-[#b45f1b]">
            <div className="flex flex-wrap items-center gap-4 text-[10px] font-sans font-bold tracking-widest uppercase text-[#b45f1b] mb-6">
              <span className="bg-[#b45f1b]/10 px-3 py-1 rounded">{story.category}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">{story.date || 'Recently Published'}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">{story.read_time || '5 min read'}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-8">
              {story.title}
            </h1>
            <div className="w-16 h-1 bg-gray-200"></div>
          </div>
        </section>

        {/* STORY CONTENT (Where your magic boxes & files appear) */}
        <section className="max-w-3xl mx-auto px-6 py-10">
          <div 
            className="story-content animate-fade-up" 
            style={{ animationDelay: '0.3s' }}
            dangerouslySetInnerHTML={{ __html: story.description }} 
          />
        </section>

        {/* AUTHOR & FOOTER SECTION */}
        <section className="max-w-3xl mx-auto px-6 mt-10 animate-fade-up" style={{ animationDelay: '0.5s' }}>
          <div className="border-t border-b border-gray-200 py-10 flex flex-col md:flex-row items-center gap-8 bg-gray-50 rounded-2xl p-8">
             <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center text-2xl shrink-0 border-2 border-white shadow-md">
               👤
             </div>
             <div className="text-center md:text-left">
               <h4 className="font-sans font-bold text-sm tracking-widest uppercase mb-2">The Wandering Scholar</h4>
               <p className="text-sm text-gray-600 font-sans leading-relaxed">
                 Thank you for reading. Every journey has a story beyond the destination, and I'm glad to share this one with you.
               </p>
             </div>
          </div>
        </section>
      </main>

    </div>
  );
}