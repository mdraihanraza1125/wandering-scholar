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
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const initialFormState = { title: '', category: 'TRAVEL JOURNAL', date: '', read_time: '', image_url: '', description: '' };
  const [formData, setFormData] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [settingsData, setSettingsData] = useState({ id: 1, name: '', bio: '', avatar_url: '', hero_image_url: '', author_quote: '' });
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

  // --- IMAGE UPLOADS ---
  const handleImageUpload = async (e, type) => {
    try {
      setUploading(true);
      setMessage('Uploading image...');
      const file = e.target.files[0];
      if (!file) return;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
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

  // --- DOCUMENT UPLOAD ---
  const handleDocumentUpload = async (e) => {
    try {
      setFileUploading(true);
      setMessage('Uploading document...');
      const file = e.target.files[0];
      if (!file) return;
      
      const fileExt = file.name.split('.').pop();
      const fileName = `docs/${Math.random()}.${fileExt}`;
      const originalName = file.name;

      const { error: uploadError } = await supabase.storage.from('blog-images').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('blog-images').getPublicUrl(fileName);
      
      const downloadBoxHTML = `<div style="margin: 24px 0; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #f9fafb;"><span style="font-size: 20px;">📄</span> <strong style="color: #111;">${originalName}</strong> &nbsp;&nbsp;|&nbsp;&nbsp; <a href="${data.publicUrl}" target="_blank" style="color: #b45f1b; font-weight: bold; text-decoration: underline;">Download File ⬇️</a></div><p><br/></p>`;

      const editor = quillRef.current?.getEditor();
      if (editor) {
        const range = editor.getSelection();
        const insertIndex = range ? range.index : editor.getLength();
        editor.clipboard.dangerouslyPasteHTML(insertIndex, downloadBoxHTML);
      } else {
        setFormData(prev => ({ ...prev, description: prev.description + downloadBoxHTML }));
      }
      setMessage('Document added! 📄');

    } catch (error) { setMessage('Error uploading file: ' + error.message); } 
    finally { setFileUploading(false); }
  };

  // 🔥 SUPER SMART SHORTCODE PROCESSOR 🔥
  const processShortcodes = (text) => {
    if (!text) return text;
    let newText = text;
    
    // Editor HTML paragraph tags ko safai se hatane ka function
    const cleanHTML = (str) => str.replace(/<\/?p[^>]*>/gi, ' ').trim();
    
    // Handle both [quote] and [qoute] (Spelling Mistake Proof)
    newText = newText.replace(/\[q(?:uo|ou)te\]([\s\S]*?)\[\/q(?:uo|ou)te\]/gi, (match, content) => {
      return `</blockquote><blockquote style="border-left: 4px solid #b45f1b; padding-left: 16px; font-style: italic; color: #4b5563; font-size: 1.125rem; margin: 24px 0;">"${cleanHTML(content)}"</blockquote><p><br/></p>`;
    });
    
    // Handle [tip]
    newText = newText.replace(/\[tip\]([\s\S]*?)\[\/tip\]/gi, (match, content) => {
      return `</div><div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; padding: 16px; border-radius: 8px; color: #0f766e; margin: 24px 0;">✨ <strong>Travel Tip:</strong> ${cleanHTML(content)}</div><p><br/></p>`;
    });
    
    // Handle [warn]
    newText = newText.replace(/\[warn\]([\s\S]*?)\[\/warn\]/gi, (match, content) => {
      return `</div><div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 16px; border-radius: 8px; color: #b45309; margin: 24px 0;">⚠️ <strong>Important:</strong> ${cleanHTML(content)}</div><p><br/></p>`;
    });

    return newText;
  };

  // --- FORM SUBMIT ---
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    
    // Publish karne se pehle automatically nishan ko box mein convert karega
    const finalDescription = processShortcodes(formData.description);

    if (isEditing) {
      const { id, created_at, description, ...restData } = formData; 
      const updateData = { ...restData, description: finalDescription };
      
      const { error } = await supabase.from('stories').update(updateData).eq('id', editId);
      if (!error) {
        setMessage('Post Updated Successfully! 🎉');
        setIsEditing(false);
        setFormData(initialFormState);
        setEditId(null);
        setActiveTab('manage'); 
        fetchStories(); 
      } else {
        setMessage('Error updating post: ' + error.message);
      }
    } else {
      const insertData = { ...formData, description: finalDescription };
      const { error } = await supabase.from('stories').insert([insertData]);
      if (!error) {
        setMessage('Post Published Successfully! 🎉');
        setFormData(initialFormState);
      } else {
        setMessage('Error publishing: ' + error.message);
      }
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    await supabase.from('author_profile').update(settingsData).eq('id', 1);
    setMessage('Settings Saved! 🌟');
  };

  // Gallery Submits
  const handleMultiPhotoSelect = (e) => { 
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
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
    e.preventDefault();
    if (!galleryLocation || selectedPhotos.length === 0) return;
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

  if (!isAuthenticated) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-800">Loading Workspace...</div>;

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col lg:flex-row font-sans text-sm relative">
      
      {/* MOBILE HEADER */}
      <div className="lg:hidden flex items-center justify-between bg-[#0a0a0a] text-white p-4 sticky top-0 z-40 shadow-md">
        <h2 className="text-xl font-black text-[#b45f1b]">STUDIO.</h2>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-xs font-bold uppercase tracking-widest bg-[#1a1a1a] px-4 py-2 rounded-lg border border-gray-800">
          {isSidebarOpen ? 'Close ✕' : '☰ Menu'}
        </button>
      </div>
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#0a0a0a] text-white p-8 flex flex-col justify-between shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-black text-[#b45f1b]">STUDIO.</h2>
            <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>✕</button>
          </div>
          <nav className="space-y-3">
            <button onClick={() => { setActiveTab('write'); setIsEditing(false); setFormData(initialFormState); setMessage(''); setIsSidebarOpen(false); }} className={`w-full text-left px-5 py-3 rounded-xl font-bold transition-all duration-200 ${activeTab === 'write' ? 'bg-[#b45f1b] text-white shadow-lg' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'}`}>✎ Write Post</button>
            <button onClick={() => { setActiveTab('manage'); setMessage(''); setIsSidebarOpen(false); }} className={`w-full text-left px-5 py-3 rounded-xl font-bold transition-all duration-200 ${activeTab === 'manage' ? 'bg-[#b45f1b] text-white shadow-lg' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'}`}>⚙ Manage Posts</button>
            <button onClick={() => { setActiveTab('gallery'); setMessage(''); setIsSidebarOpen(false); }} className={`w-full text-left px-5 py-3 rounded-xl font-bold transition-all duration-200 ${activeTab === 'gallery' ? 'bg-[#b45f1b] text-white shadow-lg' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'}`}>🖼️ Manage Gallery</button>
            <button onClick={() => { setActiveTab('settings'); setMessage(''); setIsSidebarOpen(false); }} className={`w-full text-left px-5 py-3 rounded-xl font-bold transition-all duration-200 ${activeTab === 'settings' ? 'bg-[#b45f1b] text-white shadow-lg' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'}`}>⚙️ Site Settings</button>
          </nav>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} className="text-left text-red-400 hover:text-red-300 font-bold text-xs uppercase tracking-widest mt-10 transition-colors">Logout ⏏</button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-10 lg:p-16 w-full overflow-x-hidden min-h-[calc(100vh-60px)]">
        {message && (
          <div className="p-4 mb-8 text-xs font-bold bg-gray-900 text-white rounded-lg shadow-md flex justify-between items-center border border-gray-700">
            {message} <button onClick={() => setMessage('')} className="text-gray-400 hover:text-white">✖</button>
          </div>
        )}

        {/* --- WRITE POST TAB --- */}
        {activeTab === 'write' && (
          <div className="max-w-4xl mx-auto animate-fadeIn">
            <div className="flex justify-between items-center mb-8">
               <h1 className="text-2xl md:text-3xl font-black text-gray-900">
                 {isEditing ? 'Editing Story' : 'Draft New Story'}
               </h1>
               {isEditing && (
                 <button onClick={() => { setIsEditing(false); setFormData(initialFormState); setEditId(null); }} className="text-xs font-bold bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200">
                   Cancel Edit
                 </button>
               )}
            </div>

            <form onSubmit={handlePostSubmit} className="bg-white p-6 md:p-10 shadow-lg border border-gray-200 rounded-2xl space-y-8">
              <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Enter post title..." className="w-full text-2xl md:text-4xl font-bold border-b-2 border-gray-200 pb-4 outline-none focus:border-[#b45f1b] text-gray-900 placeholder-gray-400 transition-colors" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                <div>
                  <label className="text-[10px] font-bold text-[#b45f1b] uppercase block mb-2">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full border-b-2 border-gray-200 pb-2 outline-none focus:border-[#b45f1b] text-gray-900 font-medium bg-transparent">
                    <option>TRAVEL JOURNAL</option><option>HISTORY & HERITAGE</option><option>POETRY</option><option>STORIES</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#b45f1b] uppercase block mb-2">Publish Date</label>
                  <input type="text" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} placeholder="e.g. May 20, 2024" className="w-full border-b-2 border-gray-200 pb-2 outline-none focus:border-[#b45f1b] text-gray-900 font-medium placeholder-gray-400" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#b45f1b] uppercase block mb-2">Read Time</label>
                  <input type="text" value={formData.read_time} onChange={(e) => setFormData({ ...formData, read_time: e.target.value })} placeholder="e.g. 5 min read" className="w-full border-b-2 border-gray-200 pb-2 outline-none focus:border-[#b45f1b] text-gray-900 font-medium placeholder-gray-400" />
                </div>
              </div>

              {/* UPLOAD SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
                 {/* Cover Image Upload */}
                 <div>
                  <label className="text-[10px] font-bold text-gray-600 uppercase block mb-3">1. Cover Image (Required)</label>
                  {!formData.image_url ? (
                    <div className="w-full h-32 border-2 border-dashed border-[#b45f1b] bg-[#b45f1b]/5 rounded-xl flex items-center justify-center relative cursor-pointer hover:bg-[#b45f1b]/10 transition-colors">
                      <input type="file" onChange={(e) => handleImageUpload(e, 'post')} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <span className="font-bold text-[#b45f1b] text-xs">{uploading ? 'Uploading...' : '🖼️ + Upload Cover'}</span>
                    </div>
                  ) : (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden shadow-md border border-gray-200 group">
                      <img src={formData.image_url} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setFormData({ ...formData, image_url: '' })} className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-[10px] font-bold rounded transition-colors">Remove</button>
                    </div>
                  )}
                 </div>

                 {/* Document Upload */}
                 <div>
                   <label className="text-[10px] font-bold text-gray-600 uppercase block mb-3">2. Attach File (Travel Plan / PDF)</label>
                   <div className="w-full h-32 border-2 border-dashed border-blue-400 bg-blue-50 rounded-xl flex items-center justify-center relative cursor-pointer hover:bg-blue-100 transition-colors">
                      <input type="file" accept=".pdf,.doc,.docx" onChange={handleDocumentUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <div className="text-center">
                        <span className="font-bold text-blue-600 text-xs block mb-1">{fileUploading ? 'Uploading File...' : '📄 + Upload PDF/Word'}</span>
                        <span className="text-[9px] text-gray-500 uppercase">Inserts at cursor position</span>
                      </div>
                    </div>
                 </div>
              </div>

              {/* EDITOR & FORMATTING TOOLS */}
              <div>
                <label className="text-[10px] font-bold text-[#b45f1b] uppercase flex justify-between items-end mb-2">
                  <span>Story Content</span>
                </label>

                {/* INSTRUCTION BOX & LIVE CONVERT BUTTON */}
                <div className="bg-blue-50 p-4 rounded-t-xl border border-blue-200 border-b-0">
                  <p className="text-[11px] font-bold text-blue-800 uppercase tracking-widest mb-3">
                    Magic Markers (Type inside editor to format text):
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs font-mono text-gray-800 font-medium mb-4">
                     <span className="bg-white px-2 py-1 rounded shadow-sm"><strong className="text-[#b45f1b]">[quote]</strong> text <strong className="text-[#b45f1b]">[/quote]</strong></span>
                     <span className="bg-white px-2 py-1 rounded shadow-sm"><strong className="text-teal-700">[tip]</strong> text <strong className="text-teal-700">[/tip]</strong></span>
                     <span className="bg-white px-2 py-1 rounded shadow-sm"><strong className="text-amber-700">[warn]</strong> text <strong className="text-amber-700">[/warn]</strong></span>
                  </div>
                  
                  {/* Ye button dabane par live convert ho jayega */}
                  <button 
                    type="button" 
                    onClick={() => {
                      const newHtml = processShortcodes(formData.description);
                      setFormData(prev => ({...prev, description: newHtml}));
                      setMessage('Markers converted to Boxes! ✨');
                    }} 
                    className="bg-blue-600 text-white px-5 py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-md"
                  >
                    ✨ Convert Markers Now
                  </button>
                </div>

                <div className="bg-white text-gray-900 border border-gray-200 rounded-b-xl overflow-hidden">
                   <ReactQuill 
                     ref={quillRef} 
                     theme="snow" 
                     value={formData.description} 
                     onChange={(val) => setFormData({ ...formData, description: val })} 
                     className="h-[400px] mb-12" 
                   />
                </div>
              </div>

              {/* FIXED SUBMIT BUTTON */}
              <button type="submit" disabled={uploading || fileUploading} className={`w-full md:w-auto px-12 py-4 text-xs font-bold uppercase rounded-xl shadow-md transition-colors ${isEditing ? 'bg-[#b45f1b] hover:bg-[#8a4812] text-white' : 'bg-black hover:bg-gray-800 text-white'}`}>
                {uploading || fileUploading ? 'Processing...' : (isEditing ? 'Update Post ✅' : 'Publish Post 🚀')}
              </button>
            </form>
          </div>
        )}

        {/* --- MANAGE POSTS TAB --- */}
        {activeTab === 'manage' && (
          <div className="max-w-5xl mx-auto animate-fadeIn">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-8">All Stories</h1>
            <div className="grid grid-cols-1 gap-5">
              {stories.map((story) => (
                <div key={story.id} className="bg-white p-4 md:p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-gray-200">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img src={story.image_url} className="w-16 h-16 object-cover rounded-lg shrink-0 border border-gray-200" />
                    <div>
                      <h3 className="font-bold text-lg md:text-xl text-gray-900 line-clamp-1">{story.title}</h3>
                      <span className="text-[10px] md:text-xs text-[#b45f1b] font-bold block mt-1 uppercase tracking-wider">{story.category}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto justify-end">
                    <button onClick={() => { setFormData(story); setIsEditing(true); setEditId(story.id); setActiveTab('write'); window.scrollTo(0, 0); }} className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-5 py-2 rounded-lg text-xs font-bold flex-1 sm:flex-none text-center transition-colors">
                      Edit
                    </button>
                    <button onClick={async () => { if (window.confirm('Delete this story?')) { await supabase.from('stories').delete().eq('id', story.id); fetchStories(); } }} className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-5 py-2 rounded-lg text-xs font-bold flex-1 sm:flex-none text-center transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- GALLERY TAB --- */}
        {activeTab === 'gallery' && (
          <div className="max-w-6xl mx-auto animate-fadeIn">
            <h1 className="text-2xl md:text-3xl font-black mb-8 text-gray-900">Manage Photo Albums</h1>
            <form onSubmit={handleAdvancedGallerySubmit} className="bg-white p-6 shadow-lg border border-gray-200 rounded-2xl mb-12">
              <div className="mb-6"><label className="text-[10px] font-bold text-[#b45f1b] uppercase block mb-2">Location Name (Album Title)</label><input type="text" required value={galleryLocation} onChange={(e) => setGalleryLocation(e.target.value)} className="w-full text-xl font-bold border-b-2 border-gray-200 pb-2 outline-none focus:border-[#b45f1b]" placeholder="e.g. Kashmir Diaries" /></div>
              <div className="mb-8"><label className="text-[10px] font-bold text-[#b45f1b] uppercase block mb-2">Select Photos</label><div className="w-full h-24 border-2 border-dashed border-[#b45f1b] bg-[#b45f1b]/5 rounded-xl flex items-center justify-center relative cursor-pointer"><input type="file" accept="image/*" multiple onChange={handleMultiPhotoSelect} className="absolute inset-0 opacity-0 cursor-pointer" /><span className="text-[#b45f1b] font-bold text-sm">+ Click to Select Multiple Photos</span></div></div>
              {selectedPhotos.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-xl mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedPhotos.map((photo, i) => (
                    <div key={i} className="bg-white p-2 rounded shadow-sm relative"><button type="button" onClick={() => removeSelectedPhoto(i)} className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full text-xs z-10">×</button><img src={photo.preview} className="w-full h-24 object-cover rounded mb-2" /><textarea value={photo.description} onChange={(e) => handlePhotoDescriptionChange(i, e.target.value)} placeholder="Description..." className="w-full text-xs border p-1 rounded resize-none" rows="2"></textarea></div>
                  ))}
                </div>
              )}
              <button type="submit" disabled={uploading} className="bg-black text-white px-8 py-3 text-xs font-bold uppercase rounded-xl">{uploading ? 'Uploading...' : 'Save Album'}</button>
            </form>
            <h2 className="font-bold text-xl mb-6">Existing Albums</h2>
            <div className="space-y-6">
              {Object.keys(galleryAlbums).map((location) => (
                <div key={location} className="bg-white p-4 rounded-xl shadow border border-gray-200">
                  <div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="font-bold text-lg text-[#b45f1b]">{location} ({galleryAlbums[location].length})</h3>
                    <div className="flex gap-2">
                      <label className="bg-green-50 text-green-700 px-3 py-1 text-[10px] font-bold rounded cursor-pointer">+ ADD<input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleAddPhotosToExistingAlbum(e, location)} /></label>
                      <button onClick={async () => { if (window.confirm('Delete album?')) { await supabase.from('gallery').delete().eq('location_name', location); fetchGallery(); } }} className="bg-red-50 text-red-700 px-3 py-1 text-[10px] font-bold rounded">DELETE</button>
                    </div>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                    {galleryAlbums[location].map((item) => (
                      <div key={item.id} className="min-w-[120px] relative group"><img src={item.image_url} className="w-full h-24 object-cover rounded" /><div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center transition"><button onClick={async () => { await supabase.from('gallery').delete().eq('id', item.id); fetchGallery(); }} className="text-red-400 text-xs font-bold">✖ Delete</button></div></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto animate-fadeIn">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-8">Site Settings</h1>
            <form onSubmit={handleSettingsSubmit} className="bg-white p-6 shadow-lg border border-gray-200 rounded-2xl space-y-8">
              <div><h2 className="text-lg font-bold mb-4">1. Hero Banner</h2><div className="w-full h-32 border-2 border-dashed border-[#b45f1b] bg-[#b45f1b]/5 rounded-xl flex items-center justify-center relative"><input type="file" onChange={(e) => handleImageUpload(e, 'hero')} className="absolute inset-0 opacity-0 cursor-pointer" /><span className="text-[#b45f1b] font-bold text-sm">{settingsData.hero_image_url ? 'Change Image 📸' : '+ Upload Image'}</span></div></div>
              <div><h2 className="text-lg font-bold mb-4">2. Author Profile</h2>
                <div className="flex gap-6 items-start">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">{settingsData.avatar_url ? <img src={settingsData.avatar_url} className="w-full h-full object-cover" /> : <span className="text-4xl">👤</span>}<input type="file" onChange={(e) => handleImageUpload(e, 'avatar')} className="absolute inset-0 opacity-0 cursor-pointer" /></div>
                  <div className="flex-1 space-y-4"><input type="text" value={settingsData.name} onChange={(e) => setSettingsData({ ...settingsData, name: e.target.value })} placeholder="Author Name" className="w-full border-b-2 p-2 outline-none" /><textarea value={settingsData.bio} onChange={(e) => setSettingsData({ ...settingsData, bio: e.target.value })} placeholder="Bio" rows="3" className="w-full border-2 p-3 rounded-xl resize-none outline-none" /><input type="text" value={settingsData.author_quote} onChange={(e) => setSettingsData({ ...settingsData, author_quote: e.target.value })} placeholder="Quote" className="w-full border-b-2 p-2 outline-none italic" /></div>
                </div>
              </div>
              <button type="submit" className="bg-black text-white px-10 py-3 text-xs font-bold uppercase rounded-xl">Save Settings</button>
            </form>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
      `}} />
    </div>
  );
}