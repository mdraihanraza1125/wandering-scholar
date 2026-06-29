'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function GalleryPage() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [albums, setAlbums] = useState({});
  const [activeAlbum, setActiveAlbum] = useState(null); // null means 'Album View', string means 'Photo View'

  useEffect(() => {
    async function fetchGallery() {
      const { data } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) {
        setGalleryItems(data);

        // Group photos by location to create Albums
        const groupedAlbums = {};
        data.forEach((item) => {
          if (!groupedAlbums[item.location_name]) {
            groupedAlbums[item.location_name] = {
              name: item.location_name,
              cover: item.image_url,
              photos: [],
            };
          }
          groupedAlbums[item.location_name].photos.push(item);
        });
        setAlbums(groupedAlbums);
      }
    }
    fetchGallery();
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-gray-800 font-serif">
      {/* Inline CSS for smooth fade-in animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
      `,
        }}
      />

      <header className="bg-white py-5 px-10 border-b border-gray-100 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <Link href="/" className="font-bold tracking-wider text-xl">
          THE WANDERING SCHOLAR
        </Link>
        <Link
          href="/"
          className="text-[10px] font-sans font-bold uppercase tracking-widest hover:text-[#c66b1a] transition"
        >
          ← Back to Home
        </Link>
      </header>

      <section className="py-24 text-center bg-[#111] text-white border-b relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1920&q=80')] opacity-20 object-cover bg-center"></div>
        <div className="relative z-10">
          <h1 className="text-5xl font-bold font-sans tracking-widest uppercase">
            PHOTO GALLERY
          </h1>
          <p className="mt-4 text-gray-400 font-sans text-sm tracking-widest uppercase">
            {activeAlbum
              ? `Memories from ${activeAlbum}`
              : 'Travel diaries and captured moments'}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto py-16 px-8 min-h-[500px]">
        {/* VIEW 1: ALBUMS LIST */}
        {!activeAlbum && (
          <div className="animate-fade-in">
            {Object.keys(albums).length === 0 ? (
              <div className="text-center text-gray-500 py-20 font-sans">
                No albums created yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
                {Object.values(albums).map((album, index) => (
                  <div
                    key={index}
                    onClick={() => setActiveAlbum(album.name)}
                    className="group cursor-pointer bg-white p-4 border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 rounded-lg flex flex-col"
                  >
                    <div className="aspect-[4/3] overflow-hidden rounded-md relative bg-gray-200">
                      <img
                        src={album.cover}
                        alt={album.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition duration-500"></div>
                      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 text-[10px] font-sans font-bold rounded">
                        {album.photos.length} Photos
                      </div>
                    </div>
                    <div className="pt-5 pb-2 text-center">
                      <h3 className="text-lg font-bold uppercase tracking-widest text-[#b45f1b] group-hover:text-black transition">
                        {album.name}
                      </h3>
                      <p className="text-[10px] text-gray-500 font-sans mt-2 uppercase tracking-wider">
                        Click to open album
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: PHOTOS INSIDE AN ALBUM */}
        {activeAlbum && (
          <div className="animate-fade-in">
            <div className="mb-10 flex justify-center">
              <button
                onClick={() => setActiveAlbum(null)}
                className="bg-black text-white px-8 py-3 text-[10px] font-bold font-sans tracking-widest uppercase hover:bg-[#b45f1b] transition shadow-lg rounded"
              >
                ← Back to All Albums
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {albums[activeAlbum].photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="bg-white p-3 border border-gray-200 shadow-sm rounded-lg hover:shadow-lg transition duration-300"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="aspect-square overflow-hidden rounded bg-gray-100 mb-3 relative group">
                    <img
                      src={photo.image_url}
                      alt="Gallery item"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>
                  {photo.description ? (
                    <p className="text-xs text-gray-600 font-sans text-center px-2 leading-relaxed">
                      {photo.description}
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-400 font-sans text-center italic">
                      No description
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <footer className="bg-[#111] text-gray-500 py-16 text-center font-sans">
        <p className="text-[10px] tracking-widest">
          © {new Date().getFullYear()} THE WANDERING SCHOLAR. ALL RIGHTS
          RESERVED.
        </p>
      </footer>
    </div>
  );
}
