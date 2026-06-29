'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase'; // Updated Path
import { useParams } from 'next/navigation';

export default function CategoryPage() {
  const { slug } = useParams();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  // URL slug ko Database Category Name se map karna
  const categoryMap = {
    'travel-journal': 'TRAVEL JOURNAL',
    'history-heritage': 'HISTORY & HERITAGE',
    'poetry': 'POETRY',
    'stories': 'STORIES'
  };

  const categoryName = slug ? categoryMap[slug] : '';

  useEffect(() => {
    async function fetchCategoryStories() {
      if (categoryName) {
        const { data } = await supabase
          .from('stories')
          .select('*')
          .eq('category', categoryName)
          .order('id', { ascending: false });
        if (data) setStories(data);
      }
      setLoading(false);
    }
    fetchCategoryStories();
  }, [categoryName]);

  // Agar koi galat URL daale toh 404 Page show hoga
  if (!categoryName && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf8f5] font-sans">
        <h1 className="text-6xl font-black text-[#b45f1b] mb-4">404</h1>
        <p className="text-xl font-bold mb-8">Page Not Found</p>
        <Link href="/" className="bg-black text-white px-8 py-3 rounded uppercase text-xs font-bold tracking-widest hover:bg-[#b45f1b] transition">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-gray-800 font-sans">
      
      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp { 
          from { opacity: 0; transform: translateY(40px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .hero-bg {
          background: linear-gradient(to bottom, rgba(10,10,10,0.8), rgba(10,10,10,0.9)), url('https://images.unsplash.com/photo-1455390582262-044cdead27d8?auto=format&fit=crop&w=1920&q=80') center/cover;
        }
      `}} />

      {/* HEADER */}
      <header className="bg-white py-5 px-6 lg:px-10 border-b border-gray-100 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <Link href="/" className="font-black tracking-wider text-xl text-[#b45f1b]">STUDIO.</Link>
        <Link href="/" className="text-[10px] font-bold uppercase tracking-widest hover:text-[#b45f1b] transition flex items-center gap-2">
          <span>←</span> Back to Home
        </Link>
      </header>

      {/* CATEGORY HERO BANNER */}
      <section className="py-24 text-center hero-bg text-white relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
        <div className="relative z-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-4xl md:text-6xl font-black tracking-widest uppercase mb-6">{categoryName}</h1>
          <div className="w-20 h-1 bg-[#b45f1b] mx-auto mb-6 rounded-full"></div>
          <p className="text-gray-300 text-sm md:text-base tracking-widest uppercase font-medium">
             A collection of thoughts and moments
          </p>
        </div>
      </section>

      {/* STORIES GRID WITH ANIMATION */}
      <section className="max-w-7xl mx-auto py-20 px-6 min-h-[500px]">
        {loading ? (
          <div className="text-center text-gray-500 py-20 font-bold tracking-widest uppercase animate-pulse">
            Loading Stories...
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center animate-slide-up">
            <span className="text-5xl mb-6">🪶</span>
            <p className="text-gray-500 tracking-widest uppercase font-bold text-sm">The ink is still wet. No stories here yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
            {stories.map((story, index) => (
              <Link 
                href={`/post/${story.id}`} 
                key={story.id} 
                className="group border border-gray-200 bg-white rounded-xl hover:shadow-2xl transition-all duration-500 animate-slide-up flex flex-col overflow-hidden hover:-translate-y-2"
                style={{ animationDelay: `${index * 0.15 + 0.2}s` }} // Staggered Animation
              >
                <div className="overflow-hidden aspect-[4/3] bg-gray-100 relative">
                  <img src={story.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" alt={story.title} />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <span className="text-[9px] text-[#b45f1b] font-black tracking-widest uppercase mb-3 block">
                    {story.date || 'RECENT'}
                  </span>
                  <h4 className="text-2xl font-bold text-gray-900 group-hover:text-[#b45f1b] transition-colors leading-tight mb-4 line-clamp-3">
                    {story.title}
                  </h4>
                  <div className="mt-auto flex items-center justify-between text-[10px] text-gray-400 tracking-widest uppercase font-bold border-t border-gray-100 pt-5">
                    <span>{story.read_time || '3 min read'}</span>
                    <span className="group-hover:text-[#b45f1b] transition-colors flex items-center gap-1">Read Story <span className="text-lg leading-none">→</span></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="bg-[#111] text-gray-500 py-12 text-center text-[10px] tracking-widest font-bold uppercase">
        <p>© {new Date().getFullYear()} THE WANDERING SCHOLAR. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
}