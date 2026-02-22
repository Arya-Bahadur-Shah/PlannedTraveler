import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Heart, Flag, MessageCircle } from 'lucide-react';

const BlogFeed = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    api.get('posts/').then(res => setPosts(res.data));
  }, []);

  const handleLike = async (id) => {
    const res = await api.post(`posts/${id}/like/`);
    setPosts(posts.map(p => p.id === id ? {...p, likes_count: res.data.likes} : p));
  };

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      {posts.map(post => (
        <div key={post.id} className="bg-[var(--card-theme)] rounded-[3rem] overflow-hidden shadow-lg border border-[var(--primary)]/5">
          {post.image && <img src={post.image} className="w-full h-64 object-cover" />}
          <div className="p-8">
            <h3 className="text-2xl font-bold mb-4">{post.title}</h3>
            <p className="opacity-70 line-clamp-3 mb-6">{post.content}</p>
            
            <div className="flex justify-between items-center border-t border-black/5 pt-6">
              <div className="flex gap-6">
                <button onClick={() => handleLike(post.id)} className="flex items-center gap-2 font-bold text-pink-500">
                   <Heart size={20} /> {post.likes_count || 0}
                </button>
                <button className="flex items-center gap-2 font-bold opacity-40 hover:opacity-100 transition-all">
                   <Flag size={18} /> Report
                </button>
              </div>
              <span className="text-xs font-black uppercase tracking-widest opacity-30">By {post.author_name}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};