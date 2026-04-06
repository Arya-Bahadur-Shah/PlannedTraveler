import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Flag, MessageCircle, Send, PenSquare, Trash2, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const BlogFeed = () => {
  const [posts, setPosts] = useState([]);
  const [me, setMe] = useState(null);
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchPosts();
    // Fetch current user profile so we can compare ownership for delete button
    api.get('profile/me/')
      .then(res => setMe(res.data))
      .catch(() => setMe(null)); // Not logged in — that's OK
  }, []);

  const fetchPosts = () => {
    setLoading(true);
    api.get('posts/')
      .then(res => setPosts(res.data))
      .catch(() => showToast('Could not load posts.', 'error'))
      .finally(() => setLoading(false));
  };

  const handleLike = async (id) => {
    if (!me) {
      showToast('Please log in to like posts.', 'warning');
      return;
    }
    try {
      const res = await api.post(`posts/${id}/like/`);
      setPosts(posts.map(p => p.id === id ? { ...p, likes_count: res.data.likes } : p));
    } catch {
      showToast('Could not register like.', 'error');
    }
  };

  const handleReport = async (id) => {
    if (!me) {
      showToast('Please log in to report posts.', 'warning');
      return;
    }
    const reason = prompt('Reason for reporting this post:');
    if (reason) {
      try {
        await api.post('reports/', { post: id, reason });
        showToast('Report submitted to admins. Thank you!', 'success');
      } catch {
        showToast('Could not submit report.', 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`posts/${id}/`);
      setPosts(posts.filter(p => p.id !== id));
      showToast('Post deleted successfully.', 'success');
    } catch {
      showToast('You are not authorized to delete this post.', 'error');
    }
  };

  const handleComment = async (postId) => {
    if (!me) {
      showToast('Please log in to comment.', 'warning');
      return;
    }
    if (!commentText.trim()) return;
    try {
      await api.post('comments/', { post: postId, text: commentText });
      setCommentText('');
      fetchPosts();
    } catch {
      showToast('Could not post comment.', 'error');
    }
  };

  const isOwner = (post) => {
    // Compare as numbers to avoid type mismatch (me.id is number, post.author is number from DRF)
    return me && me.id === post.author;
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-theme)' }}>
      {/* ── Toast ───────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl font-bold text-white text-sm flex items-center gap-3 ${
              toast.type === 'error' ? 'bg-red-500' :
              toast.type === 'success' ? 'bg-emerald-500' :
              toast.type === 'warning' ? 'bg-orange-400' : 'bg-[var(--primary)]'
            }`}
          >
            {toast.message}
            <button onClick={() => setToast(null)}><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-8 md:p-12 max-w-4xl mx-auto">
        {/* ── Header ──────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-5xl font-black tracking-tighter mb-2" style={{ color: 'var(--text-theme)' }}>
              Community Escapes
            </h1>
            <p className="opacity-50 font-bold">First-hand experiences from our travelers</p>
          </div>
          {me && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/create-blog')}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-white shadow-lg"
              style={{ background: 'var(--primary)' }}
            >
              <PenSquare size={18} /> Write a Story
            </motion.button>
          )}
          {!me && (
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-4 rounded-2xl font-black border-2 opacity-60 hover:opacity-100 transition-all"
              style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
            >
              Log in to Share
            </button>
          )}
        </div>

        {/* ── Loading ──────────────────────────────────── */}
        {loading && (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="animate-spin opacity-40" size={40} />
          </div>
        )}

        {/* ── Empty State ──────────────────────────────── */}
        {!loading && posts.length === 0 && (
          <div className="text-center py-24 opacity-40">
            <p className="text-3xl font-black mb-3">No stories yet.</p>
            <p className="font-bold">Be the first to share your travel experience!</p>
          </div>
        )}

        {/* ── Posts ──────────────────────────────────────── */}
        <div className="space-y-10">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-[3rem] overflow-hidden shadow-xl border"
              style={{
                background: 'var(--card-theme)',
                borderColor: 'rgba(var(--primary-rgb, 99,102,241), 0.08)'
              }}
            >
              {/* Cover Image */}
              {post.image && (
                <div className="relative h-72 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <span className="absolute top-5 left-5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-white backdrop-blur bg-white/10 border border-white/20">
                    Story
                  </span>
                  {/* Delete button for owner */}
                  {isOwner(post) && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      onClick={() => handleDelete(post.id)}
                      className="absolute top-5 right-5 p-3 rounded-full bg-red-500 text-white shadow-lg"
                      title="Delete your post"
                    >
                      <Trash2 size={15} />
                    </motion.button>
                  )}
                </div>
              )}

              <div className="p-8">
                {/* Author + Delete (no image case) */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white"
                         style={{ background: 'var(--primary)' }}>
                      {post.author_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-black text-sm">{post.author_name}</p>
                      <p className="text-xs opacity-40 font-bold">
                        {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  {/* Delete for posts without cover image */}
                  {isOwner(post) && !post.image && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      onClick={() => handleDelete(post.id)}
                      className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      title="Delete your post"
                    >
                      <Trash2 size={15} />
                    </motion.button>
                  )}
                </div>

                <h2 className="text-2xl font-black mb-3" style={{ color: 'var(--text-theme)' }}>{post.title}</h2>
                <p className="opacity-70 leading-relaxed mb-6 line-clamp-4">{post.content}</p>

                {/* Actions */}
                <div className="flex items-center gap-6 border-t pt-5" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-2 font-bold text-pink-500 hover:text-pink-600 transition-colors"
                  >
                    <Heart size={18} />
                    <span className="text-sm">{post.likes_count || 0}</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (!me) { showToast('Log in to comment.', 'warning'); return; }
                      setActiveCommentPost(activeCommentPost === post.id ? null : post.id);
                    }}
                    className="flex items-center gap-2 font-bold opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <MessageCircle size={18} />
                    <span className="text-sm">{post.comments?.length || 0}</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleReport(post.id)}
                    className="flex items-center gap-2 font-bold text-orange-400 opacity-50 hover:opacity-100 transition-opacity ml-auto"
                  >
                    <Flag size={15} />
                    <span className="text-xs">Report</span>
                  </motion.button>
                </div>

                {/* Comment Section */}
                <AnimatePresence>
                  {activeCommentPost === post.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-5 rounded-3xl p-5 overflow-hidden"
                      style={{ background: 'rgba(0,0,0,0.04)' }}
                    >
                      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1">
                        {post.comments?.length === 0 && (
                          <p className="text-xs opacity-40 italic font-bold">No comments yet. Be the first!</p>
                        )}
                        {post.comments?.map((c, idx) => (
                          <div key={idx} className="bg-white/60 backdrop-blur p-3 rounded-2xl text-sm">
                            <span className="font-black text-xs mr-2" style={{ color: 'var(--primary)' }}>
                              {c.user_name}:
                            </span>
                            {c.text}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                          className="flex-1 bg-white/60 p-3 rounded-2xl outline-none text-sm font-bold placeholder:font-normal"
                        />
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleComment(post.id)}
                          className="p-3 rounded-2xl text-white"
                          style={{ background: 'var(--primary)' }}
                        >
                          <Send size={16} />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogFeed;