import React from 'react';
import { Image, Send, MapPin, Bold, Italic, List } from 'lucide-react';

const CreateBlog = () => {
  return (
    <div className="p-8 md:p-16 max-w-4xl mx-auto">
      <h1 className="text-5xl font-black tracking-tighter mb-12">Share your Escape</h1>
      
      <div className="space-y-6 bg-[var(--card-theme)] p-10 rounded-[3.5rem] border border-[var(--primary)]/10">
        <input type="text" placeholder="Title your journey..." 
          className="w-full text-4xl font-black bg-transparent outline-none placeholder:opacity-20 border-b-2 border-black/5 pb-6" />
        
        <div className="flex gap-4 border-b border-black/5 pb-4 opacity-40">
           <Bold size={18}/> <Italic size={18}/> <List size={18}/> <MapPin size={18}/>
        </div>

        <textarea placeholder="Tell your story. Where did you go? What did the air taste like?" 
          className="w-full min-h-[300px] bg-transparent outline-none text-lg leading-relaxed resize-none" />

        <div className="flex justify-between items-center pt-8 border-t border-black/5">
          <button className="flex items-center gap-2 font-bold opacity-50 hover:opacity-100 transition-all">
            <Image /> Add Photos
          </button>
          <button className="px-10 py-4 bg-[var(--primary)] text-white rounded-2xl font-black flex items-center gap-3">
            Publish Post <Send size={18}/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateBlog;