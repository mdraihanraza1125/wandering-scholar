'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

// --- ICONS & LOGO ---
const Instagram = () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;
const YouTube = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>;
const SearchIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const MenuIcon = () => <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const CloseIcon = () => <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

const MountainLogo = () => (
  <svg viewBox="0 0 240 60" width="130" height="35" fill="#111" className="-mb-1">
    <path d="M120 10 L80 50 L100 50 L50 60 L190 60 L150 25 L165 45 Z" />
  </svg>
);

export default function Home() {
  const [stories, setStories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Newsletter State
  const [subEmail, setSubEmail] = useState('');
  const [subStatus, setSubStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { title: 'TRAVEL JOURNAL', slug: 'travel-journal', desc: 'Stories from my journeys.', icon: '📝' },
    { title: 'HISTORY & HERITAGE', slug: 'history-heritage', desc: 'Exploring history.', icon: '🏛️' },
    { title: 'NATURE & ADVENTURE', slug: 'nature-adventure', desc: 'Wilderness and epic thrills.', icon: '🏔️' },
    { title: 'STORIES', slug: 'stories', desc: 'Conversations with strangers.', icon: '📖' },
  ];

  useEffect(() => {
    setMounted(true);
    async function fetchData() {
      const { data: sData } = await supabase.from('stories').select('*').order('id', { ascending: false }).limit(8);
      const { data: aData } = await supabase.from('author_profile').select('*').eq('id', 1).single();
      setStories(sData || []);
      setSettings(aData);
    }
    fetchData();
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if(!subEmail) return;
    setIsSubmitting(true);
    
    // Save to supabase subscribers table
    const { error } = await supabase.from('subscribers').insert([{ email: subEmail }]);
    
    if (error) {
       setSubStatus('Error saving. Please try again.');
    } else {
       setSubStatus('Thank you! You are now subscribed. 📮');
       setSubEmail('');
    }
    setIsSubmitting(false);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#faf8f5] text-gray-800 font-serif">
      <div className="bg-black text-white text-[11px] py-2 px-8 flex justify-between items-center font-sans tracking-widest border-b border-gray-900 hidden sm:flex">
        <span>{" Every journey has a story beyond the destination. "}</span>
        <div className="flex items-center space-x-5 opacity-80"><Instagram /><YouTube /></div>
      </div>

      <header className="bg-white py-4 px-6 lg:px-10 border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-8">
          
          <div className="flex flex-col items-center lg:items-start w-full lg:w-auto">
            <Link href="/" className="flex flex-col items-center">
              <MountainLogo />
              <h1 className="text-xl md:text-[22px] font-serif font-black tracking-wide text-gray-900 leading-none mt-1">
                THE WANDERING SCHOLAR
              </h1>
              <p className="text-[11px] md:text-xs font-serif text-gray-800 tracking-wider mt-1.5 font-medium">
                Travel | History | Stories
              </p>
            </Link>
          </div>

          <div className="lg:hidden flex justify-between items-center w-full border-t border-gray-100 pt-3 mt-1">
            <span className="text-[10px] font-bold tracking-widest text-gray-400 font-sans">MENU</span>
            <div className="flex items-center gap-6">
               <span className="cursor-pointer text-gray-600" onClick={() => setIsSearchOpen(!isSearchOpen)}><SearchIcon /></span>
               <button onClick={() => setIsMobileMenuOpen(true)} className="text-black"><MenuIcon /></button>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center gap-x-6 text-[10px] font-sans tracking-widest font-bold">
             <Link href="/" className="text-[#c66b1a] border-b-2 border-[#c66b1a] pb-1">HOME</Link>
             <Link href="/travel-journal" className="hover:text-[#c66b1a] transition">TRAVEL JOURNAL</Link>
             <Link href="/history-heritage" className="hover:text-[#c66b1a] transition">HISTORY & HERITAGE</Link>
             <Link href="/nature-adventure" className="hover:text-[#c66b1a] transition">NATURE & ADVENTURE</Link>
             <Link href="/stories" className="hover:text-[#c66b1a] transition">STORIES</Link>
             <Link href="/gallery" className="hover:text-[#c66b1a] transition">PHOTO GALLERY</Link>
             <Link href="/contact" className="hover:text-[#c66b1a] transition text-[#b45f1b]">CONTACT US</Link>
             <span className="cursor-pointer text-gray-600 hover:text-black ml-4" onClick={() => setIsSearchOpen(!isSearchOpen)}><SearchIcon /></span>
          </nav>
        </div>
      </header>

      {isSearchOpen && (
        <div className="sticky top-[85px] lg:top-[73px] left-0 w-full bg-white border-b border-gray-100 py-4 px-6 z-40 shadow-sm flex justify-center">
          <input type="text" placeholder="Search..." autoFocus className="w-full max-w-2xl p-3 border text-sm font-sans focus:outline-none focus:border-[#b45f1b]" onChange={(e) => setSearchTerm(e.target.value)} value={searchTerm} />
        </div>
      )}

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex justify-end">
          <div className="w-64 bg-white h-full shadow-2xl p-6 flex flex-col font-sans">
            <button className="self-end mb-8 text-black" onClick={() => setIsMobileMenuOpen(false)}>
              <CloseIcon />
            </button>
            <nav className="flex flex-col gap-6 text-xs font-bold tracking-widest uppercase">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-[#c66b1a] border-b pb-2">HOME</Link>
              <Link href="/travel-journal" onClick={() => setIsMobileMenuOpen(false)} className="border-b pb-2">TRAVEL JOURNAL</Link>
              <Link href="/history-heritage" onClick={() => setIsMobileMenuOpen(false)} className="border-b pb-2">HISTORY & HERITAGE</Link>
              <Link href="/nature-adventure" onClick={() => setIsMobileMenuOpen(false)} className="border-b pb-2">NATURE & ADVENTURE</Link>
              <Link href="/stories" onClick={() => setIsMobileMenuOpen(false)} className="border-b pb-2">STORIES</Link>
              <Link href="/gallery" onClick={() => setIsMobileMenuOpen(false)} className="border-b pb-2">PHOTO GALLERY</Link>
              <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-[#c66b1a] pt-2">CONTACT US</Link>
            </nav>
          </div>
        </div>
      )}

      <section className="relative h-[500px] bg-gray-900 overflow-hidden flex items-center justify-center">
        <img src={settings?.hero_image_url || "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=1920&q=80"} className="absolute inset-0 w-full h-full object-cover opacity-60" />
        <div className="relative text-center text-white p-6">
          <p className="text-sm tracking-[0.2em] font-sans uppercase mb-4 opacity-90">— Welcome to —</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">THE WANDERING SCHOLAR</h2>
          <p className="font-sans max-w-2xl mx-auto opacity-90 leading-relaxed text-sm md:text-base">A digital journal of travels, thoughts, history, nature, and stories.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto py-10 md:py-20 px-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        {categories.map((cat, i) => (
          <Link href={`/${cat.slug}`} key={i} className="bg-[#1c1c1c] text-white p-6 text-center min-h-[160px] md:min-h-[200px] flex flex-col items-center justify-center cursor-pointer hover:bg-[#c66b1a] transition duration-300">
            <div className="text-3xl mb-4 font-sans">{cat.icon}</div>
            <h4 className="text-[10px] font-bold tracking-widest uppercase mb-2 font-sans">{cat.title}</h4>
          </Link>
        ))}
        <Link href="/gallery" className="bg-[#1c1c1c] text-white p-6 text-center min-h-[160px] md:min-h-[200px] flex flex-col items-center justify-center cursor-pointer hover:bg-[#c66b1a] transition duration-300 col-span-2 md:col-span-1">
          <div className="text-3xl mb-4 font-sans">📷</div>
          <h4 className="text-[10px] font-bold tracking-widest uppercase mb-2 font-sans">PHOTO GALLERY</h4>
        </Link>
      </section>

      <section className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
            <h3 className="text-center font-bold font-sans tracking-widest uppercase mb-12 text-xl">Latest Stories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {stories.map((story) => (
                <Link href={`/post/${story.id}`} key={story.id} className="group flex flex-col border border-gray-100 hover:shadow-xl transition duration-300 bg-white">
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                    <img src={story.image_url} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <span className="text-[9px] font-sans text-[#c66b1a] tracking-widest uppercase font-bold block mb-2">{story.category}</span>
                    <h4 className="text-lg font-bold group-hover:text-[#b45f1b] transition mb-3">{story.title}</h4>
                  </div>
                </Link>
              ))}
            </div>
        </div>
      </section>

      <section className="bg-[#f4f2ee] py-20 px-6 md:px-8 border-t border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="w-40 h-40 md:w-48 md:h-48 shrink-0">
            {settings?.avatar_url ? <img src={settings.avatar_url} className="w-full h-full object-cover rounded-full shadow-lg border-4 border-white" /> : <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center text-5xl font-sans">👤</div>}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold uppercase tracking-widest font-sans mb-4">About the Author</h3>
            <p className="text-sm font-sans text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">{settings?.name && <span className="font-bold">I'm {settings.name}, </span>}{settings?.bio}</p>
          </div>
          <div className="flex-1 text-center md:text-left border-t md:border-t-0 md:border-l border-gray-300 pt-8 md:pt-0 md:pl-12 flex items-center">
            <h2 className="text-2xl md:text-4xl font-serif italic text-gray-800 leading-snug">{settings?.author_quote}</h2>
          </div>
        </div>
      </section>
      
      {/* PERFECTLY ALIGNED FOOTER */}
      <footer className="bg-[#0e0e0e] text-gray-400 py-16 px-6 font-sans border-t border-gray-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* Aligned Quick Links */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-white text-xs font-black tracking-widest uppercase mb-6">Quick Links</h4>
            <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-xs font-semibold">
              <Link href="/" className="hover:text-white transition">Home</Link>
              <Link href="/travel-journal" className="hover:text-white transition">Travel Journal</Link>
              <Link href="/history-heritage" className="hover:text-white transition">History & Heritage</Link>
              <Link href="/nature-adventure" className="hover:text-white transition">Nature & Adv.</Link>
              <Link href="/stories" className="hover:text-white transition">Stories</Link>
              <Link href="/gallery" className="hover:text-white transition">Photo Gallery</Link>
              <Link href="/contact" className="hover:text-white transition text-[#c66b1a] col-span-2">Contact Us</Link>
            </div>
          </div>

          <div className="flex flex-col items-center text-center justify-center border-t md:border-t-0 border-gray-800 pt-8 md:pt-0">
             <h3 className="text-white font-serif font-black text-lg tracking-widest mb-2">THE WANDERING SCHOLAR</h3>
             <p className="text-[11px] text-gray-500 italic max-w-sm leading-relaxed">Documenting the raw essence of global cultures, historical ruins, and majestic hidden landscapes.</p>
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-left border-t md:border-t-0 border-gray-800 pt-8 md:pt-0">
            <h4 className="text-white text-xs font-black tracking-widest uppercase mb-4">Subscribe to Journal</h4>
            <p className="text-[11px] text-gray-500 mb-4 leading-relaxed max-w-xs">Get emails when new wanderlust field-guides, maps, and local stories go live.</p>
            <form onSubmit={handleSubscribe} className="flex w-full max-w-xs relative">
              <input type="email" required value={subEmail} onChange={(e) => setSubEmail(e.target.value)} placeholder="Your email address..." className="bg-[#1a1a1a] border border-gray-800 text-xs px-4 py-3 text-white focus:outline-none focus:border-[#b45f1b] w-full rounded-l-lg" />
              <button type="submit" disabled={isSubmitting} className="bg-[#b45f1b] text-white px-5 text-xs font-bold uppercase tracking-wider rounded-r-lg hover:bg-[#924710] transition-colors">{isSubmitting ? '...' : 'Join'}</button>
            </form>
            {subStatus && <p className={`text-[10px] font-bold mt-3 ${subStatus.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{subStatus}</p>}
          </div>

        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-gray-900 text-center">
          <p className="text-[10px] tracking-widest text-gray-600">© {new Date().getFullYear()} THE WANDERING SCHOLAR. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
}