'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const ArrowLeft = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;

// URL slugs ko Database ki categories se map karna
const categoryMap = {
  'travel-journal': 'TRAVEL JOURNAL',
  'history-heritage': 'HISTORY & HERITAGE',
  'nature-adventure': 'NATURE & ADVENTURE',
  'stories': 'STORIES'
};

export default function CategoryPage() {
  const { category } = useParams();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  const dbCategoryName = categoryMap[category] || 'UNKNOWN';

  useEffect(() => {
    async function fetchCategoryStories() {
      if (dbCategoryName !== 'UNKNOWN') {
        const { data } = await supabase
          .from('stories')
          .select('*')
          .eq('category', dbCategoryName)
          .order('id', { ascending: false });
        
        if (data) setStories(data);
      }
      setLoading(false);
    }
    fetchCategoryStories();
  }, [category, dbCategoryName]);

  if (loading) return <div className="min-h-screen flex justify-center items-center"><div className="w-10 h-10 border-4 border-t-[#b45f1b] rounded-full animate-spin"></div></div>;

  if (dbCategoryName === 'UNKNOWN') return <div className="min-h-screen flex flex-col items-center justify-center"><h1 className="text-4xl font-black">404 - Category Not Found</h1><Link href="/" className="mt-4 border-b-2 border-black font-bold">Go Home</Link></div>;

  return (
    <div className="min-h-screen bg-[#faf8f5] font-serif">
      <header className="bg-white py-6 px-6 md:px-12 border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => window.history.back()} className="text-gray-500 hover:text-black flex items-center gap-2 text-xs font-bold tracking-widest font-sans uppercase"><ArrowLeft /> BACK</button>
        <h1 className="font-black tracking-widest text-lg font-sans uppercase">{dbCategoryName}</h1>
        <div className="w-20"></div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-4">{dbCategoryName}</h2>
          <p className="text-gray-500 font-sans uppercase tracking-widest text-xs">Explore {stories.length} Stories</p>
        </div>

        {stories.length === 0 ? (
          <div className="text-center text-gray-500 italic py-20">No stories published in this category yet. Check back soon!</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {stories.map((story) => (
              <Link href={`/post/${story.id}`} key={story.id} className="group bg-white flex flex-col border border-gray-100 hover:shadow-xl transition duration-300">
                <div className="aspect-[4/3] overflow-hidden"><img src={story.image_url} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" /></div>
                <div className="p-6">
                  <h4 className="text-xl font-bold group-hover:text-[#b45f1b] transition mb-3 leading-snug">{story.title}</h4>
                  <p className="text-[10px] font-sans text-gray-400 font-bold uppercase">{story.date} • {story.read_time}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}