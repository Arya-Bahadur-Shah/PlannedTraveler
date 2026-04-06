import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Heart, MessageSquare, Trash, Plus } from 'lucide-react';
import api from '../services/api';

const BlogFeed = () => {
  const [blogs, setBlogs] = useState([]);
  const [me, setMe] = useState(null);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [isCreating, setIsCreating] = useState(false);

  const fetchBlogs = () => {
    api.get('posts/').then(res => setBlogs(res.data));
  };

  useEffect(() => {
    fetchBlogs();
    api.get('profile/me/').then(res => setMe(res.data)).catch(() => {});
  }, []);

  const handleCreate = async () => {
    try {
      await api.post('posts/', newPost);
      setNewPost({ title: '', content: '' });
      setIsCreating(false);
      fetchBlogs();
    } catch { alert('Failed to create post'); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`posts/${id}/`);
      fetchBlogs();
    } catch { alert('Not authorized'); }
  };

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black tracking-tighter uppercase">Community Escapes</h2>
          <p className="opacity-50 font-bold">Discover first-hand experiences from our travelers</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button onClick={() => setIsCreating(!isCreating)} className="px-6 py-4 rounded-2xl bg-[var(--primary)] text-white w-full font-bold flex gap-2">
             <Plus /> Create Story
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="mb-12 bg-[var(--card-theme)] shadow-xl p-8 rounded-[3rem] border border-[var(--primary)]/10">
          <h3 className="text-2xl font-black mb-4">Share Your Experience</h3>
          <input value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} placeholder="Title" className="w-full text-xl font-bold bg-transparent border-b-2 outline-none mb-4 p-2"/>
          <textarea value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} placeholder="What's your story?" className="w-full bg-black/5 rounded-2xl outline-none p-4 font-bold opacity-80" rows="3"/>
          <button onClick={handleCreate} className="mt-4 px-6 py-3 bg-[var(--primary)] text-white font-bold rounded-xl shadow-lg">Post</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {blogs.map((blog, i) => (
          <motion.div key={i} whileHover={{ y: -10 }} className="rounded-[3rem] overflow-hidden bg-[var(--card-theme)] shadow-lg group relative">
            <div className="h-64 overflow-hidden relative bg-[var(--primary)]/10 flex items-center justify-center">
              {blog.image ? <img src={blog.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={blog.title} /> : <span className="font-black opacity-30 text-2xl uppercase">No Image</span>}
              <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur rounded-full text-xs font-black uppercase text-[var(--primary)]">Story</div>
              {me && me.id === blog.author && (
                <button onClick={() => handleDelete(blog.id)} className="absolute top-6 right-6 p-3 bg-red-500/90 text-white rounded-full"><Trash size={16}/></button>
              )}
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-2 group-hover:text-[var(--primary)] transition-colors">{blog.title}</h3>
              <p className="text-sm opacity-40 font-bold mb-4">By {blog.author_name}</p>
              <p className="opacity-80 line-clamp-3 mb-6">{blog.content}</p>
              <div className="flex items-center gap-6 border-t border-black/5 pt-6">
                <span className="flex items-center gap-2 text-sm font-bold opacity-60"><Heart size={16}/> {blog.likes_count}</span>
                <span className="flex items-center gap-2 text-sm font-bold opacity-60"><MessageSquare size={16}/> {blog.comments ? blog.comments.length : 0}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default BlogFeed;