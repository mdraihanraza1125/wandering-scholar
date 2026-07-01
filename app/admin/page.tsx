'use client';
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../../lib/supabase'; 
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('write');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stories, setStories] = useState([]);
  const [galleryAlbums, setGalleryAlbums] = useState({});
  const [inboxMessages, setInboxMessages] = useState([]); 
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false); 
  const [videoUploading, setVideoUploading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const initialFormState = { title: '', category: 'TRAVEL JOURNAL', date: '', read_time: '', image_url: '', description: '' };
  const [formData, setFormData] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [settingsData, setSettingsData] = useState({ id: 1, name: '', bio: '', avatar_url: '', hero_image_url: '', author_quote: '', about_heading: '', about_text: '' });
  const [galleryLocation, setGalleryLocation] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  const quillRef = useRef(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) window.location.href = '/login';
      else setIsAuthenticated(true);
    }
    checkAuth();
  }, []);

  useEffect(() => {
    if (activeTab === 'manage') fetchStories();
    if (activeTab === 'settings') fetchSettings();
    if (activeTab === 'gallery') fetchGallery();
    if (activeTab === 'inbox') fetchMessages(); 
  }, [activeTab]);

  async function fetchStories() {
    const { data } = await supabase.from('stories').select('*').order('id', { ascending: false });
    if (data) setStories(data);
  }

  async function fetchSettings() {
    const { data } = await supabase.from('author_profile').select('*').eq('id', 1).single();
    if (data) setSettingsData(data);
  }

  async function fetchGallery() {
    const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
    if (data) {
      const grouped = {};
      data.forEach((item) => {
        if (!grouped[item.location_name]) grouped[item.location_name] = [];
        grouped[item.location_name].push(item);
      });
      setGalleryAlbums(grouped);
    }
  }

  // 🔥 STRONG FETCH MESSAGES LOGIC 🔥
  async function fetchMessages() {
    setMessage('Loading inbox...');
    const { data, error } = await supabase.from('messages').select('*').order('id', { ascending: false });
    if (error) {
      setMessage('Error loading inbox. Check Supabase RLS!');
    } else if (data) {
      setInboxMessages(data);
      setMessage('');
    }
  }

  // --- UPLOADS ---
  const handleImageUpload = async (e, type) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;
      const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('blog-images').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('blog-images').getPublicUrl(fileName);
      if (type === 'post') setFormData({ ...formData, image_url: data.publicUrl });
      if (type === 'avatar') setSettingsData({ ...settingsData, avatar_url: data.publicUrl });
      if (type === 'hero') setSettingsData({ ...settingsData, hero_image_url: data.publicUrl });
      setMessage('Upload successful! 📸');
    } catch (error) { setMessage('Error: ' + error.message); } 
    finally { setUploading(false); }
  };

  const handleDocumentUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      setFileUploading(true);
      const fileName = `docs/${Math.random()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('blog-images').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('blog-images').getPublicUrl(fileName);
      
      const downloadBoxHTML = `<div style="margin: 24px 0; padding: 16px; border: 2px dashed #b45f1b; border-radius: 12px; background-color: #f9fafb;"><span style="font-size: 20px;">📄</span> <strong>${file.name}</strong> &nbsp;|&nbsp; <a href="${data.publicUrl}" target="_blank" download style="color: #b45f1b; font-weight: bold;">Download File ⬇️</a></div><p><br/></p>`;
      const editor = quillRef.current?.getEditor();
      if (editor) editor.clipboard.dangerouslyPasteHTML(editor.getSelection()?.index || editor.getLength(), downloadBoxHTML);
      setMessage('Document attached! 📄');
    } catch (error) { setMessage('Error: ' + error.message); } 
    finally { setFileUploading(false); }
  };

  const handleVideoUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      setVideoUploading(true);
      const fileName = `videos/${Math.random()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('blog-images').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('blog-images').getPublicUrl(fileName);
      
      const videoHTML = `<div style="margin:30px 0; border-radius:16px; overflow:hidden; border: 4px solid #000; background:#000;"><video controls style="width:100%; display:block;" src="${data.publicUrl}"></video></div><p><br/></p>`;
      const editor = quillRef.current?.getEditor();
      if (editor) editor.clipboard.dangerouslyPasteHTML(editor.getSelection()?.index || editor.getLength(), videoHTML);
      setMessage('Video attached! 🎥');
    } catch (error) { setMessage('Error video upload: ' + error.message); } 
    finally { setVideoUploading(false); }
  };

  const processShortcodes = (text) => {
    if (!text) return text;
    let newText = text.replace(/<\/?p[^>]*>/gi, ' ').trim();
    newText = newText.replace(/\[q(?:uo|ou)te\]([\s\S]*?)\[\/q(?:uo|ou)te\]/gi, `</blockquote><blockquote style="border-left: 4px solid #b45f1b; padding-left: 16px; font-style: italic; color: #111; font-size: 1.125rem; margin: 24px 0; font-weight: bold;">"$1"</blockquote><p><br/></p>`);
    newText = newText.replace(/\[tip\]([\s\S]*?)\[\/tip\]/gi, `</div><div style="background-color: #e0f2fe; border: 2px solid #0284c7; padding: 16px; border-radius: 8px; color: #0f172a; margin: 24px 0;">✨ <strong>Travel Tip:</strong> $1</div><p><br/></p>`);
    newText = newText.replace(/\[warn\]([\s\S]*?)\[\/warn\]/gi, `</div><div style="background-color: #fef08a; border: 2px solid #d97706; padding: 16px; border-radius: 8px; color: #451a03; margin: 24px 0;">⚠️ <strong>Important:</strong> $1</div><p><br/></p>`);
    return newText;
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    const finalDescription = processShortcodes(formData.description);
    if (isEditing) {
      const { id, created_at, description, ...restData } = formData; 
      const { error } = await supabase.from('stories').update({ ...restData, description: finalDescription }).eq('id', editId);
      if (!error) { setMessage('Post Updated Successfully! 🎉'); setIsEditing(false); setFormData(initialFormState); setEditId(null); setActiveTab('manage'); fetchStories(); } else setMessage('Error: ' + error.message);
    } else {
      const { error } = await supabase.from('stories').insert([{ ...formData, description: finalDescription }]);
      if (!error) { setMessage('Post Published! 🎉'); setFormData(initialFormState); } else setMessage('Error: ' + error.message);
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    await supabase.from('author_profile').update(settingsData).eq('id', 1);
    setMessage('Site Settings & About Us Saved! 🌟');
  };

  // --- GALLERY LOGIC ---
  const handleMultiPhotoSelect = (e) => { 
    const files = Array.from(e.target.files); if (files.length === 0) return;
    const newPhotos = files.map((file) => ({ file, preview: URL.createObjectURL(file), description: '' }));
    setSelectedPhotos((prev) => [...prev, ...newPhotos]);
  };
  const handlePhotoDescriptionChange = (index, value) => {
    const updated = [...selectedPhotos]; updated[index].description = value; setSelectedPhotos(updated);
  };
  const removeSelectedPhoto = (index) => {
    const updated = [...selectedPhotos]; updated.splice(index, 1); setSelectedPhotos(updated);
  };
  const handleAdvancedGallerySubmit = async (e) => {
    e.preventDefault(); if (!galleryLocation || selectedPhotos.length === 0) return;
    setUploading(true);
    try {
      for (const item of selectedPhotos) {
        const fileName = `gallery/${Math.random()}.${item.file.name.split('.').pop()}`;
        const { error } = await supabase.storage.from('blog-images').upload(fileName, item.file);
        if (!error) {
          const { data } = supabase.storage.from('blog-images').getPublicUrl(fileName);
          await supabase.from('gallery').insert([{ location_name: galleryLocation, image_url: data.publicUrl, description: item.description }]);
        }
      }
      setMessage('Album Published! 🎉'); setGalleryLocation(''); setSelectedPhotos([]); fetchGallery();
    } catch (error) { setMessage('Error: ' + error.message); } finally { setUploading(false); }
  };
  const handleAddPhotosToExistingAlbum = async (e, locationName) => {
    const files = Array.from(e.target.files); if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fileName = `gallery/${Math.random()}.${file.name.split('.').pop()}`;
        const { error } = await supabase.storage.from('blog-images').upload(fileName, file);
        if (!error) {
          const { data } = supabase.storage.from('blog-images').getPublicUrl(fileName);
          await supabase.from('gallery').insert([{ location_name: locationName, image_url: data.publicUrl, description: '' }]);
        }
      }
      setMessage(`Photos added to ${locationName}! 🎉`); fetchGallery();
    } catch (error) { setMessage('Error: ' + error.message); } finally { setUploading(false); }
  };

  // 🔥 NEW: EDIT EXISTING PHOTO DESCRIPTION 🔥
  const handleEditExistingPhotoDesc = async (photoId, currentDesc) => {
    const newDesc = window.prompt("Edit Photo Description:", currentDesc || "");
    if (newDesc !== null) {
      const { error } = await supabase.from('gallery').update({ description: newDesc }).eq('id', photoId);
      if (!error) {
        setMessage('Description Updated! ✅');
        fetchGallery(); // Refresh gallery
      } else {
        setMessage('Error updating description: ' + error.message);
      }
    }
  };


  if (!isAuthenticated) return <div className="min-h-screen flex items-center justify-center font-bold text-white bg-black">Loading Workspace...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row font-sans text-sm relative">
      
      {/* MOBILE HEADER */}
      <div className="lg:hidden flex items-center justify-between bg-black text-white p-4 sticky top-0 z-40 shadow-md">
        <h2 className="text-xl font-black text-[#b45f1b]">STUDIO.</h2>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-xs font-bold uppercase bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
          {isSidebarOpen ? 'Close ✕' : '☰ Menu'}
        </button>
      </div>
      {isSidebarOpen && <div className="fixed inset-0 bg-black/80 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* HARD DARK SIDEBAR */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#0a0a0a] border-r border-gray-800 text-white p-6 flex flex-col justify-between shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="flex justify-between items-center mb-10 pl-2">
            <h2 className="text-3xl font-black text-[#b45f1b] tracking-wider">STUDIO.</h2>
            <button className="lg:hidden text-white font-bold" onClick={() => setIsSidebarOpen(false)}>✕</button>
          </div>
          <nav className="space-y-2">
            <button onClick={() => { setActiveTab('write'); setIsEditing(false); setFormData(initialFormState); setMessage(''); setIsSidebarOpen(false); }} className={`w-full text-left px-5 py-3 rounded-lg font-bold transition-all duration-200 uppercase tracking-widest text-[11px] ${activeTab === 'write' ? 'bg-[#b45f1b] text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>✎ Write Post</button>
            <button onClick={() => { setActiveTab('manage'); setMessage(''); setIsSidebarOpen(false); }} className={`w-full text-left px-5 py-3 rounded-lg font-bold transition-all duration-200 uppercase tracking-widest text-[11px] ${activeTab === 'manage' ? 'bg-[#b45f1b] text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>⚙ Manage Posts</button>
            <button onClick={() => { setActiveTab('gallery'); setMessage(''); setIsSidebarOpen(false); }} className={`w-full text-left px-5 py-3 rounded-lg font-bold transition-all duration-200 uppercase tracking-widest text-[11px] ${activeTab === 'gallery' ? 'bg-[#b45f1b] text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>🖼️ Photo Gallery</button>
            <button onClick={() => { setActiveTab('inbox'); setMessage(''); setIsSidebarOpen(false); }} className={`w-full text-left px-5 py-3 rounded-lg font-bold transition-all duration-200 uppercase tracking-widest text-[11px] flex justify-between ${activeTab === 'inbox' ? 'bg-[#b45f1b] text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}><span>📬 Inbox</span> {inboxMessages.length > 0 && <span className="bg-white text-black rounded-full px-2 py-0.5 text-[10px] font-black">{inboxMessages.length}</span>}</button>
            <button onClick={() => { setActiveTab('settings'); setMessage(''); setIsSidebarOpen(false); }} className={`w-full text-left px-5 py-3 rounded-lg font-bold transition-all duration-200 uppercase tracking-widest text-[11px] ${activeTab === 'settings' ? 'bg-[#b45f1b] text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>⚙️ Settings & Pages</button>
          </nav>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} className="text-left text-red-500 hover:text-red-400 font-bold text-xs uppercase tracking-widest mt-10 p-2">Logout ⏏</button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 w-full overflow-x-hidden min-h-screen bg-gray-100">
        
        {/* SOLID ALERT MESSAGE */}
        {message && <div className="p-4 mb-8 text-sm font-bold bg-black text-white rounded-lg shadow-xl flex justify-between items-center border-l-4 border-[#b45f1b]">{message} <button onClick={() => setMessage('')} className="text-gray-400 hover:text-white text-lg">✖</button></div>}

        {/* --- WRITE TAB --- */}
        {activeTab === 'write' && (
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-black text-black mb-6 uppercase tracking-tight">{isEditing ? 'EDIT STORY' : 'DRAFT NEW STORY'}</h1>
            <form onSubmit={handlePostSubmit} className="bg-white p-8 shadow-2xl border-t-8 border-black rounded-xl space-y-8">
              
              <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="ENTER POST TITLE..." className="w-full text-3xl font-black border-b-4 border-gray-200 pb-4 outline-none focus:border-black text-black placeholder-gray-300 uppercase" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[11px] font-black text-black uppercase block mb-2">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full border-2 border-gray-300 p-3 outline-none font-bold text-black focus:border-black rounded-lg">
                    <option>TRAVEL JOURNAL</option><option>HISTORY & HERITAGE</option><option>NATURE & ADVENTURE</option><option>STORIES</option>
                  </select>
                </div>
                <div><label className="text-[11px] font-black text-black uppercase block mb-2">Publish Date</label><input type="text" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} placeholder="e.g. May 20, 2024" className="w-full border-2 border-gray-300 p-3 outline-none font-bold text-black focus:border-black rounded-lg" /></div>
                <div><label className="text-[11px] font-black text-black uppercase block mb-2">Read Time</label><input type="text" value={formData.read_time} onChange={(e) => setFormData({ ...formData, read_time: e.target.value })} placeholder="e.g. 5 min read" className="w-full border-2 border-gray-300 p-3 outline-none font-bold text-black focus:border-black rounded-lg" /></div>
              </div>

              {/* HARD COLORED UPLOAD BOXES */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-gray-50 border-2 border-gray-300 p-4 rounded-xl">
                  <label className="text-[11px] font-black text-black uppercase block mb-3">1. Cover Image</label>
                  {!formData.image_url ? (
                    <div className="w-full h-24 border-2 border-dashed border-gray-400 bg-white hover:border-black rounded-lg flex flex-col items-center justify-center relative cursor-pointer"><input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'post')} className="absolute inset-0 opacity-0 cursor-pointer" /><span className="font-bold text-black text-xs">🖼️ CLICK TO UPLOAD</span></div>
                  ) : (<div className="relative w-full h-24 rounded-lg overflow-hidden border-2 border-black"><img src={formData.image_url} className="w-full h-full object-cover" /><button type="button" onClick={() => setFormData({ ...formData, image_url: '' })} className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded">✖ REMOVE</button></div>)}
                 </div>
                 
                 <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl">
                   <label className="text-[11px] font-black text-blue-900 uppercase block mb-3">2. Document (PDF)</label>
                   <div className="w-full h-24 border-2 border-dashed border-blue-400 bg-white hover:border-blue-600 rounded-lg flex flex-col items-center justify-center relative cursor-pointer"><input type="file" accept=".pdf,.doc,.docx" onChange={handleDocumentUpload} className="absolute inset-0 opacity-0 cursor-pointer" /><span className="font-bold text-blue-700 text-xs">{fileUploading ? 'UPLOADING...' : '📄 ATTACH PDF'}</span></div>
                 </div>
                 
                 <div className="bg-purple-50 border-2 border-purple-200 p-4 rounded-xl">
                   <label className="text-[11px] font-black text-purple-900 uppercase block mb-3">3. Travel Vlog (MP4)</label>
                   <div className="w-full h-24 border-2 border-dashed border-purple-400 bg-white hover:border-purple-600 rounded-lg flex flex-col items-center justify-center relative cursor-pointer"><input type="file" accept="video/mp4,video/*" onChange={handleVideoUpload} className="absolute inset-0 opacity-0 cursor-pointer" /><span className="font-bold text-purple-700 text-xs">{videoUploading ? 'UPLOADING...' : '🎥 ATTACH VIDEO'}</span></div>
                 </div>
              </div>

              {/* EDITOR */}
              <div className="border-2 border-black rounded-xl overflow-hidden">
                <div className="bg-black p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest mb-2">Magic Formatting Codes:</p>
                    <div className="flex gap-2 text-[10px] font-mono font-bold">
                       <span className="bg-gray-800 text-[#b45f1b] px-2 py-1 rounded">[quote] text [/quote]</span>
                       <span className="bg-gray-800 text-blue-400 px-2 py-1 rounded">[tip] text [/tip]</span>
                       <span className="bg-gray-800 text-yellow-400 px-2 py-1 rounded">[warn] text [/warn]</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setFormData(prev => ({...prev, description: processShortcodes(formData.description)})); setMessage('✅ Codes converted to Boxes!'); }} className="bg-white text-black px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest hover:bg-gray-200">✨ CONVERT BOXES</button>
                </div>
                <div className="bg-white text-black">
                   <ReactQuill ref={quillRef} theme="snow" value={formData.description} onChange={(val) => setFormData({ ...formData, description: val })} className="h-[500px] mb-12" />
                </div>
              </div>

              <button type="submit" disabled={uploading || fileUploading || videoUploading} className="w-full bg-black text-white px-12 py-5 text-sm font-black uppercase tracking-widest rounded-xl hover:bg-[#b45f1b] transition-colors shadow-2xl">
                {uploading || fileUploading || videoUploading ? 'PROCESSING...' : (isEditing ? 'UPDATE POST NOW ✅' : 'PUBLISH POST 🚀')}
              </button>
            </form>
          </div>
        )}

        {/* --- MANAGE POSTS TAB --- */}
        {activeTab === 'manage' && (
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-black text-black mb-8 uppercase tracking-tight">MANAGE STORIES</h1>
            <div className="grid grid-cols-1 gap-4">
              {stories.map((story) => (
                <div key={story.id} className="bg-white p-5 rounded-xl shadow-lg border-2 border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-6 w-full">
                    <img src={story.image_url} className="w-20 h-20 object-cover rounded-lg border-2 border-black" />
                    <div>
                      <h3 className="font-black text-xl text-black leading-tight">{story.title}</h3>
                      <span className="text-xs text-white bg-black px-2 py-1 rounded font-bold uppercase tracking-wider mt-2 inline-block">{story.category}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => { setFormData(story); setIsEditing(true); setEditId(story.id); setActiveTab('write'); }} className="bg-blue-600 hover:bg-blue-800 text-white px-6 py-3 rounded-lg text-xs font-black uppercase">EDIT</button>
                    <button onClick={async () => { if (window.confirm('Are you sure you want to delete this?')) { await supabase.from('stories').delete().eq('id', story.id); fetchStories(); } }} className="bg-red-600 hover:bg-red-800 text-white px-6 py-3 rounded-lg text-xs font-black uppercase">DELETE</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- INBOX TAB --- */}
        {activeTab === 'inbox' && (
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
               <h1 className="text-3xl font-black text-black uppercase tracking-tight">INBOX 📬</h1>
               <button onClick={fetchMessages} className="bg-black text-white px-4 py-2 rounded font-bold text-xs uppercase">Refresh Inbox 🔄</button>
            </div>
            
            <div className="grid grid-cols-1 gap-5">
              {inboxMessages.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl border-2 border-dashed border-gray-300 text-gray-500 font-bold uppercase tracking-widest">Inbox is completely empty.</div>
              ) : (
                inboxMessages.map((msg) => (
                  <div key={msg.id} className="bg-white p-8 rounded-xl shadow-xl border-l-8 border-black">
                    <div className="flex justify-between items-start mb-4 border-b-2 border-gray-100 pb-4">
                      <div>
                        <h3 className="font-black text-2xl text-black">{msg.name}</h3>
                        <p className="text-sm text-blue-600 font-bold">{msg.email}</p>
                      </div>
                      <span className="text-xs text-white bg-black px-3 py-1 rounded font-bold uppercase">{msg.created_at?.split('T')[0]}</span>
                    </div>
                    <p className="text-base text-gray-800 whitespace-pre-wrap font-medium leading-relaxed">{msg.message}</p>
                    <div className="mt-6 pt-4 border-t border-gray-100 text-right">
                       <button onClick={async () => { if (window.confirm('Permanently delete this message?')) { await supabase.from('messages').delete().eq('id', msg.id); fetchMessages(); } }} className="text-xs font-black text-red-600 hover:text-red-800 uppercase tracking-widest bg-red-50 px-4 py-2 rounded">Delete Message ✖</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- SETTINGS TAB (STRONG HIGHLIGHT ON ABOUT US) --- */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-black text-black mb-8 uppercase tracking-tight">SITE & PAGES SETTINGS</h1>
            <form onSubmit={handleSettingsSubmit} className="bg-white p-8 shadow-2xl border-t-8 border-black rounded-xl space-y-10">
              
              {/* HERO */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h2 className="text-xl font-black text-black mb-4 uppercase tracking-widest">1. Homepage Hero Image</h2>
                <div className="w-full h-40 border-4 border-dashed border-gray-400 bg-white hover:border-black rounded-xl flex items-center justify-center relative cursor-pointer">
                  <input type="file" onChange={(e) => handleImageUpload(e, 'hero')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <span className="text-black font-black text-sm uppercase">{settingsData.hero_image_url ? 'CHANGE IMAGE 📸' : '+ UPLOAD IMAGE'}</span>
                </div>
              </div>
              
              {/* AUTHOR */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h2 className="text-xl font-black text-black mb-6 uppercase tracking-widest">2. Author Details (Homepage)</h2>
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-black bg-white flex items-center justify-center shrink-0 shadow-lg">
                    {settingsData.avatar_url ? <img src={settingsData.avatar_url} className="w-full h-full object-cover" /> : <span className="text-5xl">👤</span>}
                    <input type="file" onChange={(e) => handleImageUpload(e, 'avatar')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <div className="flex-1 space-y-4 w-full">
                    <input type="text" value={settingsData.name} onChange={(e) => setSettingsData({ ...settingsData, name: e.target.value })} placeholder="AUTHOR NAME" className="w-full border-2 border-gray-300 p-3 rounded-lg font-bold text-black focus:border-black outline-none" />
                    <textarea value={settingsData.bio} onChange={(e) => setSettingsData({ ...settingsData, bio: e.target.value })} placeholder="Short Bio for homepage..." rows="3" className="w-full border-2 border-gray-300 p-3 rounded-lg font-medium text-black focus:border-black outline-none resize-none" />
                    <input type="text" value={settingsData.author_quote} onChange={(e) => setSettingsData({ ...settingsData, author_quote: e.target.value })} placeholder="Hero Quote / Italic Tagline" className="w-full border-2 border-gray-300 p-3 rounded-lg font-bold italic text-black focus:border-black outline-none" />
                  </div>
                </div>
              </div>

              {/* 🔥 ABOUT US / CONTACT PAGE CONTENT EDIT 🔥 */}
              <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200 shadow-sm">
                <h2 className="text-xl font-black text-blue-900 mb-2 uppercase tracking-widest flex items-center gap-2"><span>📝</span> 3. About & Contact Page Content</h2>
                <p className="text-xs text-blue-700 font-bold mb-6">Manage the text that appears on your public Contact Us page.</p>
                <div className="space-y-4">
                  <input type="text" value={settingsData.about_heading || ''} onChange={(e) => setSettingsData({ ...settingsData, about_heading: e.target.value })} placeholder="HEADING (e.g. About The Wandering Scholar)" className="w-full border-2 border-blue-300 p-4 rounded-lg font-black text-black text-lg focus:border-black outline-none bg-white" />
                  <textarea value={settingsData.about_text || ''} onChange={(e) => setSettingsData({ ...settingsData, about_text: e.target.value })} placeholder="Write your full about us paragraphs here..." rows="8" className="w-full border-2 border-blue-300 p-4 rounded-lg font-medium text-black text-sm focus:border-black outline-none bg-white resize-none leading-relaxed" />
                </div>
              </div>

              <button type="submit" className="w-full bg-black text-white px-10 py-5 text-sm font-black uppercase tracking-widest rounded-xl hover:bg-[#b45f1b] transition shadow-2xl">SAVE ALL SETTINGS ✅</button>
            </form>
          </div>
        )}

        {/* --- GALLERY TAB (WITH EDIT DESCRIPTION FIX) --- */}
        {activeTab === 'gallery' && (
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-black text-black mb-8 uppercase tracking-tight">MANAGE PHOTO ALBUMS</h1>
            
            <form onSubmit={handleAdvancedGallerySubmit} className="bg-white p-8 shadow-xl border-t-8 border-black rounded-xl mb-12">
              <div className="mb-6">
                <label className="text-[11px] font-black text-black uppercase block mb-2">Location / Album Title</label>
                <input type="text" required value={galleryLocation} onChange={(e) => setGalleryLocation(e.target.value)} className="w-full text-2xl font-black border-b-4 border-gray-200 pb-3 outline-none focus:border-black text-black uppercase placeholder-gray-300" placeholder="E.G. DELHI DIARIES" />
              </div>
              <div className="mb-8">
                <label className="text-[11px] font-black text-black uppercase block mb-2">Select Photos</label>
                <div className="w-full h-32 border-4 border-dashed border-gray-300 bg-gray-50 hover:border-black rounded-xl flex items-center justify-center relative cursor-pointer transition">
                  <input type="file" accept="image/*" multiple onChange={handleMultiPhotoSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <span className="text-black font-black text-sm uppercase tracking-widest">+ CLICK TO SELECT PHOTOS</span>
                </div>
              </div>
              {selectedPhotos.length > 0 && (
                <div className="bg-gray-100 p-6 rounded-xl mb-6 grid grid-cols-2 md:grid-cols-4 gap-6 border border-gray-200">
                  {selectedPhotos.map((photo, i) => (
                    <div key={i} className="bg-white p-3 rounded-lg shadow-md relative border border-gray-200">
                      <button type="button" onClick={() => removeSelectedPhoto(i)} className="absolute -top-3 -right-3 bg-red-600 text-white w-8 h-8 rounded-full text-sm font-black shadow-lg hover:scale-110 border-2 border-white">✕</button>
                      <img src={photo.preview} className="w-full h-32 object-cover rounded mb-3 border border-gray-100" />
                      <textarea value={photo.description} onChange={(e) => handlePhotoDescriptionChange(i, e.target.value)} placeholder="Description..." className="w-full text-xs font-bold border-2 border-gray-200 p-2 rounded focus:border-black outline-none resize-none bg-gray-50 text-black" rows="2"></textarea>
                    </div>
                  ))}
                </div>
              )}
              <button type="submit" disabled={uploading} className="bg-black text-white px-10 py-4 text-xs font-black uppercase tracking-widest rounded-lg hover:bg-[#b45f1b] transition shadow-lg w-full md:w-auto">{uploading ? 'UPLOADING ALBUM...' : 'SAVE NEW ALBUM 🚀'}</button>
            </form>

            <h2 className="font-black text-2xl mb-8 text-black uppercase tracking-widest">Existing Albums</h2>
            
            <div className="space-y-8">
              {Object.keys(galleryAlbums).map((location) => (
                <div key={location} className="bg-white p-8 rounded-xl shadow-xl border-l-8 border-black">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b-2 border-gray-100 pb-6 gap-4">
                    <h3 className="font-black text-3xl text-black uppercase">{location} <span className="text-gray-400 text-sm font-bold bg-gray-100 px-3 py-1 rounded-full">({galleryAlbums[location].length} photos)</span></h3>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <label className="flex-1 text-center bg-green-600 text-white px-5 py-3 text-[11px] font-black tracking-widest uppercase rounded cursor-pointer hover:bg-green-700 transition shadow-md">
                        + ADD NEW PHOTOS
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleAddPhotosToExistingAlbum(e, location)} />
                      </label>
                      <button onClick={async () => { if (window.confirm('Delete entire album permanently?')) { await supabase.from('gallery').delete().eq('location_name', location); fetchGallery(); } }} className="flex-1 text-center bg-red-100 text-red-700 px-5 py-3 text-[11px] font-black tracking-widest uppercase rounded hover:bg-red-200 transition border border-red-200">
                        DELETE ALBUM
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-6 overflow-x-auto pb-6 pt-2 custom-scrollbar">
                    {galleryAlbums[location].map((item) => (
                      <div key={item.id} className="min-w-[200px] h-48 relative group rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm flex-shrink-0">
                        <img src={item.image_url} className="w-full h-full object-cover" />
                        
                        {/* OPACITY LAYER ON HOVER */}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
                           
                           {/* 🔥 NEW: EDIT DESCRIPTION BUTTON 🔥 */}
                           <button 
                             onClick={() => handleEditExistingPhotoDesc(item.id, item.description)} 
                             className="bg-blue-600 text-white w-full py-2 rounded text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-500"
                           >
                             ✏️ Edit Text
                           </button>

                           {/* DELETE BUTTON */}
                           <button 
                             onClick={async () => { await supabase.from('gallery').delete().eq('id', item.id); fetchGallery(); }} 
                             className="bg-red-600 text-white w-full py-2 rounded text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-red-500"
                           >
                             ✖ Delete Photo
                           </button>
                        </div>

                        {/* Shows description at bottom if it exists */}
                        {item.description && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-[9px] p-2 truncate font-bold">
                            {item.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #000; border-radius: 10px; }
      `}} />
    </div>
  );
}