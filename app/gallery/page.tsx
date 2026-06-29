'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase'; 

export default function PublicGallery() {
  const [galleryAlbums, setGalleryAlbums] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Naye States: Album aur Photo handle karne ke liye
  const [selectedAlbum, setSelectedAlbum] = useState(null); 
  const [selectedPhoto, setSelectedPhoto] = useState(null); 

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

  // Keyboard 'Escape' key se Lightbox band karne ka function
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedPhoto(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-gray-800 font-sans selection:bg-[#b45f1b] selection:text-white">
      
      {/* CUSTOM ANIMATIONS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        
        .animate-fade { animation: fadeIn 0.5s ease-out forwards; }
        .animate-slide-up { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .animate-zoom { animation: zoomIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .gallery-bg { background: linear-gradient(to bottom, rgba(10,10,10,0.85), rgba(10,10,10,0.95)), url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1920&q=80') center/cover; }
      `}} />

      {/* HEADER */}
      <header className="bg-white py-5 px-6 lg:px-10 border-b border-gray-100 sticky top-0 z-40 flex justify-between items-center shadow-sm">
        <Link href="/" className="font-black tracking-wider text-xl text-[#b45f1b]">STUDIO.</Link>
        <Link href="/" className="text-[10px] font-bold uppercase tracking-widest hover:text-[#b45f1b] transition-colors flex items-center gap-2">
          <span>←</span> Back to Home
        </Link>
      </header>

      {/* HERO BANNER */}
      <section className="py-20 md:py-28 text-center gallery-bg text-white relative overflow-hidden flex flex-col items-center justify-center">
        <div className="relative z-10 animate-fade">
          <h1 className="text-4xl md:text-6xl font-black tracking-widest uppercase mb-6 drop-shadow-lg">Photo Gallery</h1>
          <div className="w-20 h-1 bg-[#b45f1b] mx-auto mb-6 rounded-full shadow-lg"></div>
          <p className="text-gray-300 text-sm md:text-base tracking-widest uppercase font-medium">Moments frozen in time</p>
        </div>
      </section>

      {/* MAIN GALLERY SECTION */}
      <section className="max-w-7xl mx-auto py-16 px-6 min-h-[500px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
             <div className="w-12 h-12 border-4 border-gray-200 border-t-[#b45f1b] rounded-full animate-spin mb-4"></div>
             <p className="text-gray-500 tracking-widest uppercase font-bold text-xs">Loading Albums...</p>
          </div>
        ) : Object.keys(galleryAlbums).length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center animate-slide-up">
            <span className="text-6xl mb-6 grayscale opacity-50">📷</span>
            <p className="text-gray-500 tracking-widest uppercase font-bold text-sm">No albums uploaded yet.</p>
          </div>
        ) : (
          <>
            {/* VIEW 1: ALBUM COVERS LIST */}
            {!selectedAlbum && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                {Object.keys(galleryAlbums).map((albumName, index) => {
                  const firstPhoto = galleryAlbums[albumName][0]; // Album ki pehli photo ko cover banayenge
                  const photoCount = galleryAlbums[albumName].length;

                  return (
                    <div 
                      key={albumName} 
                      onClick={() => setSelectedAlbum(albumName)}
                      className="group cursor-pointer animate-slide-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg bg-gray-200 mb-4 border border-gray-100">
                        <img 
                          src={firstPhoto.image_url} 
                          alt={albumName} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <div className="absolute bottom-0 left-0 p-6 w-full flex justify-between items-end">
                           <h2 className="text-white text-xl md:text-2xl font-black uppercase tracking-widest leading-tight">{albumName}</h2>
                           <span className="bg-[#b45f1b] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm">
                             {photoCount} {photoCount === 1 ? 'Photo' : 'Photos'}
                           </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW 2: INSIDE AN ALBUM (Photos Grid) */}
            {selectedAlbum && (
              <div className="animate-fade">
                {/* Album Header & Back Button */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6 border-b border-gray-200 pb-6">
                  <div>
                    <button 
                      onClick={() => setSelectedAlbum(null)}
                      className="text-[#b45f1b] text-xs font-bold uppercase tracking-widest hover:text-black transition-colors mb-3 flex items-center gap-2"
                    >
                      <span>←</span> Back to Albums
                    </button>
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-widest">
                      {selectedAlbum}
                    </h2>
                  </div>
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-gray-200">
                    {galleryAlbums[selectedAlbum].length} Photos
                  </span>
                </div>

                {/* Photos Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {galleryAlbums[selectedAlbum].map((photo, index) => (
                    <div 
                      key={photo.id} 
                      onClick={() => setSelectedPhoto(photo)}
                      className="group relative overflow-hidden rounded-xl bg-gray-200 aspect-square cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 animate-slide-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <img 
                        src={photo.image_url} 
                        alt="Gallery Item" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                         <span className="bg-white/90 text-black px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                           View Image
                         </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* VIEW 3: FULL-SCREEN LIGHTBOX MODAL */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-10 animate-fade">
          
          {/* Close Button */}
          <button 
            onClick={() => setSelectedPhoto(null)} 
            className="absolute top-6 right-6 md:top-10 md:right-10 text-white hover:text-[#b45f1b] transition-colors z-[110]"
            title="Close"
          >
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <line x1="18" y1="6" x2="6" y2="18"></line>
               <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Modal Content */}
          <div className="relative max-w-5xl w-full flex flex-col items-center animate-zoom">
            <img 
              src={selectedPhoto.image_url} 
              alt="Expanded view" 
              className="max-h-[75vh] md:max-h-[85vh] w-auto max-w-full rounded-lg shadow-2xl object-contain border border-gray-800"
            />
            
            {/* Description Box (agar description hai tabhi dikhega) */}
            {selectedPhoto.description && (
              <div className="mt-6 bg-black/50 p-4 md:p-6 rounded-lg border border-gray-800 text-center max-w-2xl w-full">
                <p className="text-gray-200 text-sm md:text-base font-medium leading-relaxed">
                  {selectedPhoto.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="bg-[#111] text-gray-500 py-12 text-center text-[10px] tracking-widest font-bold uppercase border-t border-black">
        <p>© {new Date().getFullYear()} THE WANDERING SCHOLAR. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
}