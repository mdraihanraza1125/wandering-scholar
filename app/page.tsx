'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

// --- ICONS & LOGO ---
const Instagram = () => (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);
const YouTube = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);
const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);
const MountainLogo = () => (
  <svg viewBox="0 0 100 35" width="85" height="30" fill="#111" className="mb-1">
    <path d="M25 15 L0 35 L50 35 Z" opacity="0.9" />
    <path d="M75 12 L50 35 L100 35 Z" opacity="0.9" />
    <path d="M50 0 L20 35 L80 35 Z" />
  </svg>
);

export default function Home() {
  const [stories, setStories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const categories = [
    {
      title: 'TRAVEL JOURNAL',
      slug: 'travel-journal',
      desc: 'Stories from my journeys.',
      icon: '📝',
    },
    {
      title: 'HISTORY & HERITAGE',
      slug: 'history-heritage',
      desc: 'Exploring history.',
      icon: '🏛️',
    },
    {
      title: 'POETRY',
      slug: 'poetry',
      desc: 'Nature and silent moments.',
      icon: '✒️',
    },
    {
      title: 'STORIES',
      slug: 'stories',
      desc: 'Conversations with strangers.',
      icon: '📖',
    },
  ];

  useEffect(() => {
    setMounted(true);
    async function fetchData() {
      const { data: sData } = await supabase
        .from('stories')
        .select('*')
        .order('id', { ascending: false })
        .limit(8);
      const { data: aData } = await supabase
        .from('author_profile')
        .select('*')
        .eq('id', 1)
        .single();
      setStories(sData || []);
      setSettings(aData);
    }
    fetchData();
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#faf8f5] text-gray-800 font-serif">
      <div className="bg-black text-white text-[11px] py-2 px-8 flex justify-between items-center font-sans tracking-widest border-b border-gray-900">
        <span>{' Every journey has a story beyond the destination. '}</span>
        <div className="flex items-center space-x-5 opacity-80">
          <Instagram />
          <YouTube />
        </div>
      </div>

      <header className="bg-white py-5 px-10 border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex flex-col items-center">
            <MountainLogo />
            <h1 className="text-lg font-bold tracking-wider">
              THE WANDERING SCHOLAR
            </h1>
          </Link>

          <nav className="hidden lg:flex items-center gap-x-6 text-[10px] font-sans tracking-widest font-bold">
            <Link
              href="/"
              className="text-[#c66b1a] border-b-2 border-[#c66b1a] pb-1"
            >
              HOME
            </Link>
            <Link
              href="/category/travel-journal"
              className="hover:text-[#c66b1a] transition"
            >
              TRAVEL JOURNAL
            </Link>
            <Link
              href="/category/history-heritage"
              className="hover:text-[#c66b1a] transition"
            >
              HISTORY & HERITAGE
            </Link>
            <Link
              href="/category/poetry"
              className="hover:text-[#c66b1a] transition"
            >
              POETRY
            </Link>
            <Link
              href="/category/stories"
              className="hover:text-[#c66b1a] transition"
            >
              STORIES
            </Link>
            <Link href="/gallery" className="hover:text-[#c66b1a] transition">
              PHOTO GALLERY
            </Link>
            <span
              className="cursor-pointer text-gray-600 hover:text-black ml-4"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <SearchIcon />
            </span>
          </nav>
        </div>
      </header>

      <section className="relative h-[500px] bg-gray-900 flex items-center justify-center">
        <img
          src={
            settings?.hero_image_url ||
            'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=1920&q=80'
          }
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="relative text-center text-white p-6">
          <p className="text-sm tracking-[0.2em] font-sans uppercase mb-4 opacity-90">
            — Welcome to —
          </p>
          <h2 className="text-5xl font-bold mb-4">THE WANDERING SCHOLAR</h2>
          <p className="font-sans max-w-2xl mx-auto opacity-90 leading-relaxed">
            A digital journal of travels, thoughts, history, poetry, and
            stories.
          </p>
        </div>
      </section>

      {/* 5 COLUMNS LINKING TO DEDICATED PAGES */}
      <section className="max-w-7xl mx-auto py-20 px-8 grid grid-cols-1 md:grid-cols-5 gap-4">
        {categories.map((cat, i) => (
          <Link
            href={`/category/${cat.slug}`}
            key={i}
            className="bg-[#1c1c1c] text-white p-6 text-center min-h-[200px] flex flex-col items-center justify-center cursor-pointer hover:bg-[#c66b1a] transition duration-300"
          >
            <div className="text-3xl mb-4">{cat.icon}</div>
            <h4 className="text-[10px] font-bold tracking-widest uppercase mb-2">
              {cat.title}
            </h4>
            <p className="text-[10px] text-gray-400 font-sans">{cat.desc}</p>
          </Link>
        ))}
        {/* Gallery Column */}
        <Link
          href="/gallery"
          className="bg-[#1c1c1c] text-white p-6 text-center min-h-[200px] flex flex-col items-center justify-center cursor-pointer hover:bg-[#c66b1a] transition duration-300"
        >
          <div className="text-3xl mb-4">📷</div>
          <h4 className="text-[10px] font-bold tracking-widest uppercase mb-2">
            PHOTO GALLERY
          </h4>
          <p className="text-[10px] text-gray-400 font-sans">
            Capturing moments.
          </p>
        </Link>
      </section>

      {/* LATEST POSTS GRID */}
      <section className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-8">
          <h3 className="text-center font-bold font-sans tracking-widest uppercase mb-12 text-xl">
            Latest Stories
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {stories.map((story) => (
              <Link
                href={`/post/${story.id}`}
                key={story.id}
                className="group flex flex-col border border-gray-100 hover:shadow-xl transition duration-300 bg-white"
              >
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                  <img
                    src={story.image_url}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-[9px] font-sans text-[#c66b1a] tracking-widest uppercase font-bold block mb-2">
                    {story.category}
                  </span>
                  <h4 className="text-lg font-bold group-hover:text-[#b45f1b] transition mb-3">
                    {story.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AUTHOR SECTION */}
      <section className="bg-[#f4f2ee] py-20 px-8 border-t border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="w-48 h-48 shrink-0">
            {settings?.avatar_url ? (
              <img
                src={settings.avatar_url}
                className="w-full h-full object-cover rounded-full shadow-lg border-4 border-white"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center text-5xl">
                👤
              </div>
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold uppercase tracking-widest font-sans mb-4">
              About the Author
            </h3>
            <p className="text-sm font-sans text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">
              {settings?.name && (
                <span className="font-bold">I'm {settings.name}, </span>
              )}
              {settings?.bio}
            </p>
          </div>
          <div className="flex-1 text-center md:text-left border-t md:border-t-0 md:border-l border-gray-300 pt-8 md:pt-0 md:pl-12 flex items-center">
            <h2 className="text-3xl md:text-4xl font-serif italic text-gray-800 leading-snug">
              {settings?.author_quote}
            </h2>
          </div>
        </div>
      </section>

      <footer className="bg-[#111] text-gray-500 py-16 text-center font-sans">
        <p className="text-[10px] tracking-widest">
          © 2026 THE WANDERING SCHOLAR. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
}
