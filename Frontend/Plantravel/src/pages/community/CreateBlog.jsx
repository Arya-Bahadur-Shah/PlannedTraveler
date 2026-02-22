import React, { useState } from 'react';
import { Send, Image as ImageIcon, X } from 'lucide-react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const CreateBlog = () => {
  const [data, setData] = useState({ title: '', content: '', image: null });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    if (data.image) formData.append('image', data.image);

    try {
      await api.post('posts/', formData);
      navigate('/blogs');
    } catch { alert("Error sharing escape."); }
  };

  return (
    <div className="p-8 md:p-16 max-w-4xl mx-auto">
      <h1 className="text-5xl font-black mb-12">Share your Journey</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-[var(--card-theme)] p-10 rounded-[3rem] shadow-xl">
        <input type="text" placeholder="Post Title" required className="w-full text-3xl font-bold bg-transparent outline-none border-b border-black/10 pb-4"
          onChange={e => setData({...data, title: e.target.value})} />
        
        <textarea placeholder="Write your story..." required className="w-full h-64 bg-transparent outline-none text-lg resize-none"
          onChange={e => setData({...data, content: e.target.value})} />

        <div className="flex justify-between items-center border-t border-black/5 pt-8">
          <input type="file" id="file" hidden onChange={e => setData({...data, image: e.target.files[0]})} />
          <label htmlFor="file" className="flex items-center gap-2 cursor-pointer font-bold opacity-60 hover:opacity-100">
            <ImageIcon /> {data.image ? data.image.name : "Add Cover Photo"}
          </label>
          <button className="px-10 py-4 bg-[var(--primary)] text-white rounded-2xl font-black flex items-center gap-2">
            Publish <Send size={18}/>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateBlog;