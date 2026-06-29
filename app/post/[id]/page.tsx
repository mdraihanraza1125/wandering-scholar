'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

const MountainLogo = () => (
  <svg viewBox="0 0 100 35" width="85" height="30" fill="#111" className="mb-1">
    <path d="M25 15 L0 35 L50 35 Z" opacity="0.9" />
    <path d="M75 12 L50 35 L100 35 Z" opacity="0.9" />
    <path d="M50 0 L20 35 L80 35 Z" />
  </svg>
);

export default function StoryReader({ params }) {
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSingleStory() {
      const { data } = await supabase
        .from('stories')
        .select('*')
        .eq('id', params.id)
        .single();

      if (data) setStory(data);
      setLoading(false);
    }
    fetchSingleStory();
  }, [params.id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center font-serif text-sm">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#faf8f5] text-gray-900 font-serif">
      {/* HEADER */}
      <header className="bg-white py-5 px-6 md:px-10 border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <a href="/" className="flex flex-col items-center">
            <MountainLogo />
            <span className="text-lg font-bold tracking-wider uppercase">
              The Wandering Scholar
            </span>
          </a>
          <a
            href="/"
            className="text-[10px] font-sans font-bold tracking-widest text-amber-700 uppercase hover:text-amber-900"
          >
            ← Back to Home
          </a>
        </div>
      </header>

      {/* ARTICLE CONTENT */}
      <div className="w-full h-[60vh] overflow-hidden relative">
        <img
          src={story?.image_url}
          alt={story?.title}
          className="w-full h-full object-cover"
        />
      </div>

      <article className="max-w-3xl mx-auto px-6 -mt-16 relative z-10 pb-20">
        <div className="bg-white p-10 md:p-14 shadow-xl border border-gray-100">
          <span className="text-[11px] font-sans text-amber-700 tracking-widest uppercase font-bold block mb-4 text-center">
            {story?.category}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-8 text-center">
            {story?.title}
          </h1>

          {/* Yahan update kiya gaya hai */}
          <div
            className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: story?.description }}
          />
        </div>
      </article>

      {/* FOOTER */}
      <footer className="bg-[#111] text-gray-500 text-xs py-12 text-center font-sans">
        © {new Date().getFullYear()} The Wandering Scholar. All Rights Reserved.
      </footer>
    </div>
  );
}
