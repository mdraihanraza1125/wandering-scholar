'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { useParams } from 'next/navigation';

export default function CategoryPage() {
  const { slug } = useParams();
  const [stories, setStories] = useState([]);

  // Format slug back to category name (e.g. travel-journal -> TRAVEL JOURNAL)
  const categoryName = slug
    ? slug.toString().replace('-', ' ').toUpperCase()
    : '';

  useEffect(() => {
    async function fetchCategoryStories() {
      const { data } = await supabase
        .from('stories')
        .select('*')
        .eq('category', categoryName)
        .order('id', { ascending: false });
      if (data) setStories(data);
    }
    if (categoryName) fetchCategoryStories();
  }, [categoryName]);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-gray-800 font-serif">
      <header className="bg-white py-5 px-10 border-b border-gray-100 sticky top-0 z-50 shadow-sm flex justify-between items-center">
        <Link href="/" className="font-bold tracking-wider text-xl">
          THE WANDERING SCHOLAR
        </Link>
        <Link
          href="/"
          className="text-[10px] font-sans font-bold uppercase tracking-widest hover:text-[#c66b1a]"
        >
          ← Back to Home
        </Link>
      </header>

      <section className="py-20 text-center bg-gray-50 border-b">
        <h1 className="text-4xl font-bold font-sans tracking-widest uppercase text-[#b45f1b]">
          {categoryName}
        </h1>
        <p className="mt-4 text-gray-500 font-sans text-sm tracking-widest uppercase">
          Explore stories from this category
        </p>
      </section>

      <section className="max-w-7xl mx-auto py-16 px-8 min-h-[400px]">
        {stories.length === 0 ? (
          <div className="text-center text-gray-500 font-sans py-20">
            No stories published in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {stories.map((story) => (
              <Link
                href={`/post/${story.id}`}
                key={story.id}
                className="group border border-gray-200 bg-white hover:shadow-xl transition"
              >
                <img
                  src={story.image_url}
                  className="w-full h-56 object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="p-6">
                  <h4 className="text-xl font-bold group-hover:text-[#b45f1b] mb-2">
                    {story.title}
                  </h4>
                  <span className="text-[10px] text-gray-400 font-sans tracking-widest uppercase">
                    {story.date}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="bg-[#111] text-gray-500 py-10 text-center font-sans text-[10px] tracking-widest">
        © 2026 THE WANDERING SCHOLAR.
      </footer>
    </div>
  );
}
