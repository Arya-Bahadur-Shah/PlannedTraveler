import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Heart, Flag, MessageCircle, Send } from 'lucide-react';

const BlogFeed = () => {
  const [posts, setPosts] = useState([]);
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = () => {
    api.get('posts/').then(res => setPosts(res.data));
  };

  const handleLike = async (id) => {
    const res = await api.post(`posts/${id}/like/`);
    setPosts(posts.map(p => p.id === id ? {...p, likes_count: res.data.likes} : p));
  };

  const handleReport = async (id) => {
    const reason = prompt("Reason for reporting:");
    if (reason) {
        await api.post('reports/', { post: id, reason });
        alert("Report submitted to Admins.");
    }
  };

  const submitComment = async (postId) => {
    if(!commentText) return;
    await api.post('comments/', { post: postId, text: commentText });
    setCommentText("");
    fetchPosts();
  };

  return (
    <div className="p-8 md:p-12 max-w-4xl mx-auto space-y-12">
      {posts.map(post => (
        <div key={post.id} className="bg-[var(--card-theme)] rounded-[3rem] overflow-hidden shadow-lg border border-[var(--primary)]/5">
          {post.image && <img src={post.image} className="w-full h-80 object-cover" />}
          <div className="p-8">
            <h3 className="text-3xl font-bold mb-4">{post.title}</h3>
            <p className="opacity-70 mb-6 leading-relaxed">{post.content}</p>
            
            <div className="flex justify-between items-center border-t border-black/5 pt-6">
              <div className="flex gap-6">
                <button onClick={() => handleLike(post.id)} className="flex items-center gap-2 font-bold text-pink-500">
                   <Heart size={20} /> {post.likes_count || 0}
                </button>
                <button onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)} className="flex items-center gap-2 font-bold opacity-60 hover:opacity-100 transition-all">
                   <MessageCircle size={20} /> {post.comments?.length || 0}
                </button>
                <button onClick={() => handleReport(post.id)} className="flex items-center gap-2 font-bold text-orange-400 opacity-60 hover:opacity-100 transition-all">
                   <Flag size={18} /> Report
                </button>
              </div>
              <span className="text-xs font-black uppercase tracking-widest opacity-40">By {post.author_name}</span>
            </div>

            {activeCommentPost === post.id && (
              <div className="mt-6 bg-black/5 p-6 rounded-3xl">
                <div className="space-y-4 mb-4 max-h-40 overflow-y-auto pr-2">
                  {post.comments?.map((c, idx) => (
                    <div key={idx} className="bg-white/50 p-3 rounded-xl text-sm">
                      <span className="font-bold text-[var(--primary)] text-xs mr-2">{c.user_name}:</span> 
                      {c.text}
                    </div>
                  ))}
                  {post.comments?.length === 0 && <p className="text-xs opacity-50 italic">No comments yet. Be the first!</p>}
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Add a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} className="flex-1 bg-white/50 p-3 rounded-xl outline-none text-sm" />
                  <button onClick={() => submitComment(post.id)} className="p-3 bg-[var(--primary)] text-white rounded-xl"><Send size={16}/></button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
export default BlogFeed;