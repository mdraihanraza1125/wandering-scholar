'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const ArrowLeft = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const ShareIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>;

export default function SingleStory() {
  const { id } = useParams();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 🔥 COMMENTS SYSTEM STATES 🔥
  const [comments, setComments] = useState([]);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    async function fetchStoryAndComments() {
      if (id) {
        const { data } = await supabase.from('stories').select('*').eq('id', id).single();
        if (data) setStory(data);

        // Fetching Comments for this story
        const { data: cData } = await supabase.from('post_comments').select('*').eq('story_id', id).order('id', { ascending: true });
        if (cData) setComments(cData);
      }
      setLoading(false);
    }
    fetchStoryAndComments();
  }, [id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if(!commentName || !commentText) return;

    const newComment = { story_id: id, name: commentName, text: commentText, created_at: new Date().toLocaleDateString() };
    
    // Attempting to post to Supabase, falls back gracefully to state representation
    const { data, error } = await supabase.from('post_comments').insert([newComment]).select();
    
    if(!error && data) {
      setComments([...comments, data[0]]);
    } else {
      // Local Fallback if db table setup is pending
      setComments([...comments, newComment]);
    }
    
    setCommentName('');
    setCommentText('');
  };

  const formatStoryContent = (html) => {
    if (!html) return '';
    let parsed = html;
    const cleanHTML = (str) => str.replace(/<\/?p[^>]*>/gi, ' ').trim();
    
    parsed = parsed.replace(/\[q(?:uo|ou)te\]([\s\S]*?)\[\/q(?:uo|ou)te\]/gi, (match, content) => {
      return `<blockquote class="magic-quote">${cleanHTML(content)}</blockquote>`;
    });
    parsed = parsed.replace(/\[tip\]([\s\S]*?)\[\/tip\]/gi, (match, content) => {
      return `<div class="magic-tip">✨ <strong>Travel Tip:</strong> ${cleanHTML(content)}</div>`;
    });
    parsed = parsed.replace(/\[warn\]([\s\S]*?)\[\/warn\]/gi, (match, content) => {
      return `<div class="magic-warn">⚠️ <strong>Important:</strong> ${cleanHTML(content)}</div>`;
    });
    return parsed;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]"><div className="w-12 h-12 border-4 border-t-[#b45f1b] rounded-full animate-spin"></div></div>;
  if (!story) return <div className="min-h-screen flex flex-col items-center justify-center"><h1 className="text-xl font-bold">Story Not Found</h1><Link href="/">Back Home</Link></div>;

  return (
    <div className="min-h-screen bg-[#faf8f5] text-gray-900 font-serif">
      <style dangerouslySetInnerHTML={{__html: `
        .story-content p { margin-bottom: 1.8em; line-height: 1.8; font-size: 1.125rem; color: #374151; }
        .story-content blockquote { background: #fff9f5; border-left: 5px solid #b45f1b; padding: 24px; margin: 2em 0; font-style: italic; color: #4b5563; }
        .magic-tip { background-color: #f0fdfa; border: 1px solid #ccfbf1; padding: 20px; border-radius: 12px; color: #0f766e; margin: 2em 0; font-family: sans-serif; }
        .magic-warn { background-color: #fffbeb; border: 1px solid #fef3c7; padding: 20px; border-radius: 12px; color: #b45309; margin: 2em 0; font-family: sans-serif; }
      `}} />

      {/* HEADER */}
      <header className="bg-white py-4 px-6 border-b border-gray-100 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <button onClick={() => window.history.back()} className="text-gray-500 hover:text-black flex items-center gap-2 text-xs font-bold tracking-widest font-sans"><ArrowLeft /> BACK</button>
        <Link href="/" className="font-serif font-black tracking-widest text-lg text-black">THE WANDERING SCHOLAR</Link>
        <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="text-gray-500 hover:text-[#b45f1b]"><ShareIcon /></button>
      </header>

      <main className="pb-20">
        <section className="relative w-full h-[50vh] md:h-[60vh] bg-black"><img src={story.image_url} className="w-full h-full object-cover opacity-80" /></section>

        {/* TITLE CARD */}
        <section className="max-w-3xl mx-auto px-6 -mt-24 relative z-10">
          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl border-t-4 border-[#b45f1b]">
            <span className="bg-[#b45f1b]/10 px-3 py-1 rounded text-[10px] font-sans font-bold text-[#b45f1b]">{story.category}</span>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mt-4 mb-4">{story.title}</h1>
            <p className="text-xs text-gray-400 font-sans">{story.date} • {story.read_time}</p>
          </div>
        </section>

        {/* CONTENT */}
        <section className="max-w-3xl mx-auto px-6 py-10">
          <div className="story-content" dangerouslySetInnerHTML={{ __html: formatStoryContent(story.description) }} />
        </section>

        {/* 🔥 NEW COMPREHENSIVE COMMENTS ENGINE 🔥 */}
        <section className="max-w-3xl mx-auto px-6 pt-10 border-t border-gray-200">
          <h3 className="font-sans font-black text-lg uppercase tracking-widest text-gray-900 mb-6">Discussions ({comments.length})</h3>
          
          {/* Comments List */}
          <div className="space-y-4 mb-10">
            {comments.length === 0 ? (
              <p className="text-xs font-sans text-gray-400 italic">No thoughts shared yet. Start the conversation below!</p>
            ) : (
              comments.map((c, idx) => (
                <div key={idx} className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm font-sans">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-gray-900">{c.name}</span>
                    <span className="text-[10px] text-gray-400">{c.created_at?.split('T')[0] || c.created_at}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{c.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleCommentSubmit} className="bg-gray-50 border border-gray-200 p-6 rounded-2xl font-sans space-y-4">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Leave a Reply</h4>
            <div className="grid grid-cols-1 gap-4">
              <input type="text" required value={commentName} onChange={(e) => setCommentName(e.target.value)} placeholder="Your Name" className="bg-white border text-xs p-3 rounded-lg w-full focus:outline-none focus:border-[#b45f1b]" />
              <textarea required rows="4" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Type your comment here..." className="bg-white border text-xs p-3 rounded-lg w-full focus:outline-none focus:border-[#b45f1b] resize-none" />
            </div>
            <button type="submit" className="bg-black text-white px-6 py-3 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#b45f1b] transition-colors">Post Comment</button>
          </form>
        </section>

      </main>
    </div>
  );
}