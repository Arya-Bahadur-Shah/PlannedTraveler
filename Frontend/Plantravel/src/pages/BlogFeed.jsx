import React from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Heart, MessageSquare } from 'lucide-react';

const BlogFeed = () => {
  const blogs = [
    { title: "Winter in Mustang", author: "Arya Shah", likes: 124, image: "https://images.unsplash.com/photo-1544735038-442efbd29173?auto=format&fit=crop&w=800&q=80" },
    { title: "Pokhara Lakeside Food Guide", author: "Sita Sharma", likes: 89, image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80" }
  ];

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black tracking-tighter uppercase">Community Escapes</h2>
          <p className="opacity-50 font-bold">Discover first-hand experiences from our travelers</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
            <input placeholder="Search places..." className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white/50 border border-[var(--primary)]/10 outline-none" />
          </div>
          <button className="p-4 rounded-2xl bg-[var(--primary)] text-white"><Filter size={20}/></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {blogs.map((blog, i) => (
          <motion.div key={i} whileHover={{ y: -10 }} className="rounded-[3rem] overflow-hidden bg-[var(--card-theme)] shadow-lg group">
            <div className="h-64 overflow-hidden relative">
              <img src={blog.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={blog.title} />
              <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur rounded-full text-xs font-black uppercase text-[var(--primary)]">Featured</div>
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-2 group-hover:text-[var(--primary)] transition-colors">{blog.title}</h3>
              <p className="text-sm opacity-40 font-bold mb-6">By {blog.author}</p>
              <div className="flex items-center gap-6 border-t border-black/5 pt-6">
                <span className="flex items-center gap-2 text-sm font-bold opacity-60"><Heart size={16}/> {blog.likes}</span>
                <span className="flex items-center gap-2 text-sm font-bold opacity-60"><MessageSquare size={16}/> 12</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default BlogFeed;