'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase'; // Updated Path

export default function PublicGallery() {
  const [galleryAlbums, setGalleryAlbums] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGallery() {
      const { data } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        const grouped = {};
        data.forEach(item => {
          if (!grouped[item.location_name]) grouped[item.location_name] = [];
          grouped[item.location_name].push(item);
        });
        setGalleryAlbums(grouped);
      }
      setLoading(false);
    }
    fetchGallery();
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-gray-800 font-sans">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade { animation: fadeIn 0.6s ease-out forwards; opacity: 0; }
        .gallery-bg { background: linear-gradient(to bottom, rgba(10,10,10,0.8), rgba(10,10,10,0.9)), url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1920&q=80') center/cover; }
      `}} />

      {/* HEADER */}
      <header className="bg-white py-5 px-6 lg:px-10 border-b border-gray-100 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <Link href="/" className="font-black tracking-wider text-xl text-[#b45f1b]">STUDIO.</Link>
        <Link href="/" className="text-[10px] font-bold uppercase tracking-widest hover:text-[#b45f1b] transition flex items-center gap-2">
          <span>←</span> Back to Home
        </Link>
      </header>

      {/* HERO BANNER */}
      <section className="py-24 text-center gallery-bg text-white relative overflow-hidden flex flex-col items-center justify-center">
        <div className="relative z-10 animate-fade" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-4xl md:text-6xl font-black tracking-widest uppercase mb-6">Photo Gallery</h1>
          <div className="w-20 h-1 bg-[#b45f1b] mx-auto mb-6 rounded-full"></div>
          <p className="text-gray-300 text-sm md:text-base tracking-widest uppercase font-medium">Moments frozen in time</p>
        </div>
      </section>

      {/* GALLERY CONTENT */}
      <section className="max-w-7xl mx-auto py-20 px-6 min-h-[500px]">
        {loading ? (
          <div className="text-center text-gray-500 py-20 font-bold tracking-widest uppercase animate-pulse">Loading Memories...</div>
        ) : Object.keys(galleryAlbums).length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
            <span className="text-5xl mb-6">📷</span>
            <p className="text-gray-500 tracking-widest uppercase font-bold text-sm">No albums uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-24">
            {Object.keys(galleryAlbums).map((location, albumIndex) => (
              <div key={location} className="animate-fade" style={{ animationDelay: `${albumIndex * 0.2 + 0.2}s` }}>
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-3xl font-black text-gray-900 uppercase tracking-widest">{location}</h2>
                  <div className="h-[2px] flex-1 bg-gray-200"></div>
                  <span className="text-xs font-bold text-[#b45f1b] uppercase tracking-widest bg-[#b45f1b]/10 px-4 py-1 rounded-full">
                    {galleryAlbums[location].length} Photos
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {galleryAlbums[location].map((photo) => (
                    <div key={photo.id} className="group relative overflow-hidden rounded-xl bg-gray-100 aspect-square cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300">
                      <img src={photo.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                      
                      {photo.description && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 md:p-6">
                          <p className="text-white text-xs md:text-sm font-medium leading-relaxed translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            {photo.description}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="bg-[#111] text-gray-500 py-12 text-center text-[10px] tracking-widest font-bold uppercase">
        <p>© {new Date().getFullYear()} THE WANDERING SCHOLAR.</p>
      </footer>
    </div>
  );
}