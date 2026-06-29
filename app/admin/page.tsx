'use client';
import React, { useState, useEffect } from 'react';
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
  
  // Sidebar state for mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Write Post States
  const initialFormState = {
    title: '',
    category: 'TRAVEL JOURNAL',
    date: '',
    read_time: '',
    image_url: '',
    description: '',
  };
  const [formData, setFormData] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Settings States
  const [settingsData, setSettingsData] = useState({
    id: 1,
    name: '',
    bio: '',
    avatar_url: '',
    hero_image_url: '',
    author_quote: '',
  });

  // Advanced Gallery States
  const [galleryLocation, setGalleryLocation] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
    const { data } = await supabase
      .from('stories')
      .select('*')
      .order('id', { ascending: false });
    if (data) setStories(data);
  }

  async function fetchSettings() {
    const { data } = await supabase
      .from('author_profile')
      .select('*')
      .eq('id', 1)
      .single();
    if (data) setSettingsData(data);
  }

  async function fetchGallery() {
    const { data } = await supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      const grouped = {};
      data.forEach((item) => {
        if (!grouped[item.location_name]) grouped[item.location_name] = [];
        grouped[item.location_name].push(item);
      });
      setGalleryAlbums(grouped);
    }
  }

  // --- GENERAL IMAGE UPLOAD (POSTS/SETTINGS) ---
  const handleImageUpload = async (e, type) => {
    try {
      setUploading(true);
      setMessage('Uploading image...');
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('blog-images')
        .getPublicUrl(fileName);

      if (type === 'post')
        setFormData({ ...formData, image_url: data.publicUrl });
      if (type === 'avatar')
        setSettingsData({ ...settingsData, avatar_url: data.publicUrl });
      if (type === 'hero')
        setSettingsData({ ...settingsData, hero_image_url: data.publicUrl });

      setMessage('Upload successful! 📸');
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- ADVANCED GALLERY LOGIC ---
  const handleMultiPhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const newPhotos = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      description: '',
    }));
    setSelectedPhotos((prev) => [...prev, ...newPhotos]);
  };

  const handlePhotoDescriptionChange = (index, value) => {
    const updated = [...selectedPhotos];
    updated[index].description = value;
    setSelectedPhotos(updated);
  };

  const removeSelectedPhoto = (index) => {
    const updated = [...selectedPhotos];
    updated.splice(index, 1);
    setSelectedPhotos(updated);
  };

  const handleAdvancedGallerySubmit = async (e) => {
    e.preventDefault();
    if (!galleryLocation) {
      setMessage('Please enter a location name!');
      return;
    }
    if (selectedPhotos.length === 0) {
      setMessage('Please select at least one photo!');
      return;
    }

    setUploading(true);
    setMessage(`Uploading ${selectedPhotos.length} photos...`);

    try {
      for (const item of selectedPhotos) {
        const fileExt = item.file.name.split('.').pop();
        const fileName = `gallery/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(fileName, item.file);

        if (!uploadError) {
          const { data } = supabase.storage
            .from('blog-images')
            .getPublicUrl(fileName);
          await supabase.from('gallery').insert([
            {
              location_name: galleryLocation,
              image_url: data.publicUrl,
              description: item.description,
            },
          ]);
        }
      }
      setMessage('All photos uploaded successfully! 🎉');
      setGalleryLocation('');
      setSelectedPhotos([]);
      fetchGallery();
    } catch (error) {
      setMessage('Error during upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- ADD PHOTOS TO EXISTING ALBUM ---
  const handleAddPhotosToExistingAlbum = async (e, locationName) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setMessage(`Adding ${files.length} photos to ${locationName}...`);

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `gallery/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(fileName, file);

        if (!uploadError) {
          const { data } = supabase.storage
            .from('blog-images')
            .getPublicUrl(fileName);
          await supabase.from('gallery').insert([
            {
              location_name: locationName,
              image_url: data.publicUrl,
              description: '', 
            },
          ]);
        }
      }
      setMessage(`Photos added to ${locationName} successfully! 🎉`);
      fetchGallery();
    } catch (error) {
      setMessage('Error adding photos: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- FORM SUBMITS ---
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (isEditing) {
      const { error } = await supabase
        .from('stories')
        .update(formData)
        .eq('id', editId);
      if (!error) {
        setMessage('Post Updated! 🎉');
        setIsEditing(false);
        setFormData(initialFormState);
      }
    } else {
      const { error } = await supabase.from('stories').insert([formData]);
      if (!error) {
        setMessage('Post Published! 🎉');
        setFormData(initialFormState);
      }
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    await supabase.from('author_profile').update(settingsData).eq('id', 1);
    setMessage('Settings Saved! 🌟');
  };

  if (!isAuthenticated)
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-gray-800">
        Loading Workspace...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col lg:flex-row font-sans text-sm relative">
      
      {/* MOBILE HEADER */}
      <div className="lg:hidden flex items-center justify-between bg-[#0a0a0a] text-white p-4 sticky top-0 z-40 shadow-md">
        <h2 className="text-xl font-black text-[#b45f1b]">STUDIO.</h2>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-xs font-bold uppercase tracking-widest bg-[#1a1a1a] px-4 py-2 rounded-lg border border-gray-800"
        >
          {isSidebarOpen ? 'Close ✕' : '☰ Menu'}
        </button>
      </div>

      {/* OVERLAY FOR MOBILE */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside 
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#0a0a0a] text-white p-8 flex flex-col justify-between shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-black text-[#b45f1b]">STUDIO.</h2>
            <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>✕</button>
          </div>

          <nav className="space-y-3">
            <button
              onClick={() => { setActiveTab('write'); setIsEditing(false); setFormData(initialFormState); setMessage(''); setIsSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3 rounded-xl font-bold transition-all duration-200 ${
                activeTab === 'write' ? 'bg-[#b45f1b] text-white shadow-lg' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
              }`}
            >
              ✎ Write Post
            </button>
            <button
              onClick={() => { setActiveTab('manage'); setMessage(''); setIsSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3 rounded-xl font-bold transition-all duration-200 ${
                activeTab === 'manage' ? 'bg-[#b45f1b] text-white shadow-lg' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
              }`}
            >
              ⚙ Manage Posts
            </button>
            <button
              onClick={() => { setActiveTab('gallery'); setMessage(''); setIsSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3 rounded-xl font-bold transition-all duration-200 ${
                activeTab === 'gallery' ? 'bg-[#b45f1b] text-white shadow-lg' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
              }`}
            >
              🖼️ Manage Gallery
            </button>
            <button
              onClick={() => { setActiveTab('settings'); setMessage(''); setIsSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3 rounded-xl font-bold transition-all duration-200 ${
                activeTab === 'settings' ? 'bg-[#b45f1b] text-white shadow-lg' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
              }`}
            >
              ⚙️ Site Settings
            </button>
          </nav>
        </div>
        <button
          onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}
          className="text-left text-red-400 hover:text-red-300 font-bold text-xs uppercase tracking-widest mt-10 transition-colors"
        >
          Logout ⏏
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-10 lg:p-16 w-full overflow-x-hidden min-h-[calc(100vh-60px)]">
        {message && (
          <div className="p-4 mb-8 text-xs font-bold bg-green-800 text-green-100 rounded-lg shadow-md flex justify-between items-center border border-green-700">
            {message}{' '}
            <button onClick={() => setMessage('')} className="text-green-200 hover:text-white">✖</button>
          </div>
        )}

        {/* --- WRITE POST TAB --- */}
        {activeTab === 'write' && (
          <div className="max-w-4xl mx-auto animate-fadeIn">
            <h1 className="text-2xl md:text-3xl font-black mb-8 text-gray-900">
              {isEditing ? 'Edit Story' : 'Draft New Story'}
            </h1>
            <form onSubmit={handlePostSubmit} className="bg-white p-6 md:p-10 shadow-lg border border-gray-200 rounded-2xl space-y-8">
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter title..."
                className="w-full text-2xl md:text-4xl font-bold border-b-2 border-gray-200 pb-4 outline-none focus:border-[#b45f1b] text-gray-900 placeholder-gray-400 transition-colors"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                <div>
                  <label className="text-[10px] font-bold text-[#b45f1b] uppercase block mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border-b-2 border-gray-200 pb-2 outline-none focus:border-[#b45f1b] text-gray-900 font-medium bg-transparent"
                  >
                    <option>TRAVEL JOURNAL</option>
                    <option>HISTORY & HERITAGE</option>
                    <option>POETRY</option>
                    <option>STORIES</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#b45f1b] uppercase block mb-2">Publish Date</label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder="e.g. May 20, 2024"
                    className="w-full border-b-2 border-gray-200 pb-2 outline-none focus:border-[#b45f1b] text-gray-900 font-medium placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#b45f1b] uppercase block mb-2">Read Time</label>
                  <input
                    type="text"
                    value={formData.read_time}
                    onChange={(e) => setFormData({ ...formData, read_time: e.target.value })}
                    placeholder="e.g. 5 min read"
                    className="w-full border-b-2 border-gray-200 pb-2 outline-none focus:border-[#b45f1b] text-gray-900 font-medium placeholder-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#b45f1b] uppercase block mb-2">Cover Image</label>
                {!formData.image_url ? (
                  <div className="w-full h-40 border-2 border-dashed border-[#b45f1b] bg-[#b45f1b]/5 rounded-xl flex items-center justify-center relative cursor-pointer hover:bg-[#b45f1b]/10 transition-colors">
                    <input type="file" onChange={(e) => handleImageUpload(e, 'post')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <span className="font-bold text-[#b45f1b]">{uploading ? 'Uploading...' : '+ Upload Cover'}</span>
                  </div>
                ) : (
                  <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden shadow-lg border border-gray-200 group">
                    <img src={formData.image_url} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setFormData({ ...formData, image_url: '' })} className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs font-bold rounded shadow-lg transition-colors">
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#b45f1b] uppercase block mb-2">Story Content</label>
                <div className="bg-white text-gray-900 border border-gray-200 rounded-lg overflow-hidden">
                   <ReactQuill theme="snow" value={formData.description} onChange={(val) => setFormData({ ...formData, description: val })} className="h-64 mb-10" />
                </div>
              </div>
              <button type="submit" className="bg-black hover:bg-gray-800 text-white w-full md:w-auto px-10 py-4 text-xs font-bold uppercase rounded-xl shadow-md transition-colors">
                Publish Post
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
                    <button
                      onClick={() => { setFormData(story); setIsEditing(true); setEditId(story.id); setActiveTab('write'); }}
                      className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 px-5 py-2 rounded-lg text-xs font-bold flex-1 sm:flex-none text-center transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm('Delete this story?')) {
                          await supabase.from('stories').delete().eq('id', story.id); fetchStories();
                        }
                      }}
                      className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300 px-5 py-2 rounded-lg text-xs font-bold flex-1 sm:flex-none text-center transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- ADVANCED GALLERY TAB --- */}
        {activeTab === 'gallery' && (
          <div className="max-w-6xl mx-auto animate-fadeIn">
            <h1 className="text-2xl md:text-3xl font-black mb-8 text-gray-900">Manage Photo Albums</h1>

            <form onSubmit={handleAdvancedGallerySubmit} className="bg-white p-6 md:p-8 shadow-lg border border-gray-200 rounded-2xl mb-12">
              <h2 className="font-bold text-lg md:text-xl text-gray-900 border-b border-gray-200 pb-4 mb-6">Create New Album / Add Photos</h2>
              <div className="mb-6">
                <label className="text-[10px] font-bold text-[#b45f1b] uppercase block mb-2">Location Name (Album Title)</label>
                <input
                  type="text" required value={galleryLocation} onChange={(e) => setGalleryLocation(e.target.value)}
                  className="w-full text-xl md:text-2xl font-bold border-b-2 border-gray-200 pb-2 outline-none focus:border-[#b45f1b] text-gray-900 placeholder-gray-400 transition-colors"
                  placeholder="e.g. Kashmir Diaries"
                />
              </div>
              <div className="mb-8">
                <label className="text-[10px] font-bold text-[#b45f1b] uppercase block mb-2">Select Photos (Multiple)</label>
                <div className="w-full h-24 border-2 border-dashed border-[#b45f1b] bg-[#b45f1b]/5 rounded-xl flex items-center justify-center relative cursor-pointer hover:bg-[#b45f1b]/10 transition-colors">
                  <input type="file" accept="image/*" multiple onChange={handleMultiPhotoSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <span className="text-[#b45f1b] font-bold text-sm">+ Click to Select Multiple Photos</span>
                </div>
              </div>

              {selectedPhotos.length > 0 && (
                <div className="bg-gray-50 p-4 md:p-6 rounded-xl mb-6 border border-gray-200">
                  <h3 className="font-bold text-sm text-gray-800 mb-4">Selected Photos ({selectedPhotos.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedPhotos.map((photo, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 relative">
                        <button type="button" onClick={() => removeSelectedPhoto(index)} className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full text-xs font-bold shadow hover:scale-110 transition z-10">×</button>
                        <img src={photo.preview} className="w-full h-32 object-cover rounded mb-3 border border-gray-100" />
                        <textarea
                          value={photo.description} onChange={(e) => handlePhotoDescriptionChange(index, e.target.value)}
                          placeholder="Description..." className="w-full text-xs text-gray-800 border border-gray-300 p-2 rounded outline-none resize-none focus:border-[#b45f1b]" rows="2"
                        ></textarea>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button type="submit" disabled={uploading} className={`w-full py-4 text-xs font-bold uppercase rounded-xl transition-colors shadow-md ${uploading ? 'bg-gray-400 text-white' : 'bg-black text-white hover:bg-gray-800'}`}>
                {uploading ? 'Uploading...' : 'Save & Publish Album'}
              </button>
            </form>

            <h2 className="font-bold text-xl md:text-2xl text-gray-900 mb-6">Existing Albums</h2>
            <div className="space-y-8 md:space-y-10">
              {Object.keys(galleryAlbums).length === 0 && <p className="text-gray-500 font-medium">No albums created yet.</p>}
              {Object.keys(galleryAlbums).map((location) => (
                <div key={location} className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-200">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 border-b border-gray-100 pb-4 gap-4">
                    <h3 className="font-bold text-lg md:text-xl uppercase tracking-widest text-[#b45f1b]">
                      {location} <span className="text-xs text-gray-500 normal-case block md:inline mt-1 md:mt-0 font-semibold tracking-normal">({galleryAlbums[location].length} photos)</span>
                    </h3>

                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                      <label className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300 px-4 py-2 md:py-1.5 text-[10px] font-bold rounded cursor-pointer flex items-center justify-center flex-1 md:flex-none transition-colors">
                        + ADD PHOTOS
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleAddPhotosToExistingAlbum(e, location)} />
                      </label>
                      <button
                        onClick={async () => {
                          const newName = prompt('Enter new album name:', location);
                          if (newName) { await supabase.from('gallery').update({ location_name: newName }).eq('location_name', location); fetchGallery(); }
                        }}
                        className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 px-4 py-2 md:py-1.5 text-[10px] font-bold rounded flex-1 md:flex-none transition-colors"
                      >
                        EDIT NAME
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm('Delete this whole album?')) { await supabase.from('gallery').delete().eq('location_name', location); fetchGallery(); }
                        }}
                        className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300 px-4 py-2 md:py-1.5 text-[10px] font-bold rounded flex-1 md:flex-none transition-colors"
                      >
                        DELETE ALBUM
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {galleryAlbums[location].map((item) => (
                      <div key={item.id} className="min-w-[140px] md:min-w-[160px] relative group shrink-0 rounded-lg overflow-hidden border border-gray-200">
                        <img src={item.image_url} className="w-full h-28 md:h-36 object-cover" />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-200 gap-3">
                          <button
                            onClick={async () => {
                              const newDesc = prompt('Update description:', item.description);
                              if (newDesc !== null) { await supabase.from('gallery').update({ description: newDesc }).eq('id', item.id); fetchGallery(); }
                            }}
                            className="text-white text-xs font-bold hover:text-blue-300 transition-colors"
                          >
                            ✎ Edit Desc
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('Delete photo?')) { await supabase.from('gallery').delete().eq('id', item.id); fetchGallery(); }
                            }}
                            className="text-red-400 text-xs font-bold hover:text-red-300 transition-colors"
                          >
                            ✖ Delete
                          </button>
                        </div>
                      </div>
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
            <form onSubmit={handleSettingsSubmit} className="bg-white p-6 md:p-10 shadow-lg border border-gray-200 rounded-2xl space-y-10 md:space-y-12">
              <div>
                <h2 className="text-base md:text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">1. Homepage Hero Banner</h2>
                <div className="w-full h-32 md:h-48 border-2 border-dashed border-[#b45f1b] bg-[#b45f1b]/5 rounded-xl flex items-center justify-center relative cursor-pointer text-center p-4 hover:bg-[#b45f1b]/10 transition-colors">
                  <input type="file" onChange={(e) => handleImageUpload(e, 'hero')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <span className="text-[#b45f1b] font-bold text-sm">
                    {settingsData.hero_image_url ? 'Change Hero Image Banner 📸' : '+ Upload Hero Image Banner'}
                  </span>
                </div>
              </div>
              <div>
                <h2 className="text-base md:text-lg font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">2. Author Profile Section</h2>
                <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-center md:items-start">
                  <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 shadow-md">
                    {settingsData.avatar_url ? (
                      <img src={settingsData.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl text-gray-300">👤</span>
                    )}
                    <input type="file" onChange={(e) => handleImageUpload(e, 'avatar')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <div className="flex-1 w-full space-y-6">
                    <div>
                       <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Author Name</label>
                       <input
                         type="text" value={settingsData.name} onChange={(e) => setSettingsData({ ...settingsData, name: e.target.value })}
                         placeholder="Enter your name" className="w-full border-b-2 border-gray-300 p-2 outline-none focus:border-[#b45f1b] font-bold text-gray-900 transition-colors"
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Detailed Bio</label>
                       <textarea
                         value={settingsData.bio} onChange={(e) => setSettingsData({ ...settingsData, bio: e.target.value })}
                         placeholder="Write something about yourself..." rows="4" className="w-full border-2 border-gray-300 p-4 rounded-xl resize-none outline-none focus:border-[#b45f1b] text-sm text-gray-900 transition-colors"
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Italic Quote</label>
                       <input
                         type="text" value={settingsData.author_quote} onChange={(e) => setSettingsData({ ...settingsData, author_quote: e.target.value })}
                         placeholder="e.g., Not all those who wander are lost." className="w-full border-b-2 border-gray-300 p-2 outline-none focus:border-[#b45f1b] italic text-gray-800 transition-colors"
                       />
                    </div>
                  </div>
                </div>
              </div>
              <button type="submit" className="bg-black hover:bg-gray-800 text-white w-full md:w-auto px-12 py-4 text-xs font-bold uppercase rounded-xl shadow-md transition-colors">
                Save Settings
              </button>
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
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}} />
    </div>
  );
}