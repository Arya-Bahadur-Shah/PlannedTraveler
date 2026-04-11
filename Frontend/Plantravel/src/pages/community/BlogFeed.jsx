import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Flag, MessageCircle, Send, PenSquare, Trash2, X, Loader2, Search, TrendingUp, Clock, UserPlus, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const BlogFeed = () => {
  const [posts, setPosts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [me, setMe] = useState(null);
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('latest'); // 'latest' | 'popular'
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportPostId, setReportPostId] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const navigate = useNavigate();
  const searchTimeout = useRef(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchPosts();
    api.get('profile/me/').then(res => setMe(res.data)).catch(() => setMe(null));
  }, []);

  // ── Filter + sort whenever posts/search/sort changes ──
  useEffect(() => {
    let result = [...posts];

    // Search filter (title + content, case-insensitive)
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.content?.toLowerCase().includes(q) ||
        p.author_name?.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === 'popular') {
      result.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    } else {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    setFiltered(result);
  }, [posts, search, sortBy]);

  const fetchPosts = (query = '') => {
    setLoading(true);
    const url = query ? `posts/?search=${encodeURIComponent(query)}` : 'posts/';
    api.get(url)
      .then(res => setPosts(res.data))
      .catch(() => showToast('Could not load posts.', 'error'))
      .finally(() => setLoading(false));
  };

  // Debounce backend search
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      if (val.length === 0 || val.length >= 2) fetchPosts(val);
    }, 400);
  };

  const handleLike = async (id) => {
    if (!me) { showToast('Please log in to like posts.', 'warning'); return; }
    try {
      const res = await api.post(`posts/${id}/like/`);
      setPosts(prev => prev.map(p => p.id === id ? { ...p, likes_count: res.data.likes } : p));
    } catch { showToast('Could not register like.', 'error'); }
  };

  const handleReport = (id) => {
    if (!me) { showToast('Please log in to report posts.', 'warning'); return; }
    setReportPostId(id);
    setReportReason('');
    setReportModalOpen(true);
  };

  const submitReport = async () => {
    if (!reportReason.trim()) { showToast('Please enter a reason.', 'warning'); return; }
    try {
      await api.post('reports/', { post: reportPostId, reason: reportReason });
      showToast('Report submitted to admins. Thank you!', 'success');
      setReportModalOpen(false);
    } catch { showToast('Could not submit report.', 'error'); }
  };

  const handleFollow = async (userId) => {
    if (!me) { showToast('Please log in to follow users.', 'warning'); return; }
    try {
      const res = await api.post(`users/${userId}/follow/`);
      const isNowFollowing = res.data.status === 'followed';
      setPosts(prev => prev.map(p => p.author_id === userId ? { ...p, is_followed_by_me: isNowFollowing } : p));
      // showToast(isNowFollowing ? 'User followed.' : 'User unfollowed.', 'success');
    } catch { showToast('Could not follow user.', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`posts/${id}/`);
      setPosts(prev => prev.filter(p => p.id !== id));
      showToast('Post deleted successfully.', 'success');
    } catch { showToast('You are not authorized to delete this post.', 'error'); }
  };

  const handleComment = async (postId) => {
    if (!me) { showToast('Please log in to comment.', 'warning'); return; }
    if (!commentText.trim()) return;
    try {
      await api.post('comments/', { post: postId, text: commentText });
      setCommentText('');
      fetchPosts();
    } catch { showToast('Could not post comment.', 'error'); }
  };

  const isOwner = (post) => me && me.id === post.author;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-theme)' }}>
      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl font-bold text-white text-sm flex items-center gap-3 ${
              toast.type === 'error' ? 'bg-red-500' : toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'warning' ? 'bg-orange-400' : 'bg-[var(--primary)]'
            }`}>
            {toast.message}
            <button onClick={() => setToast(null)}><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Report Modal ── */}
      <AnimatePresence>
        {reportModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[var(--card-theme)] w-full max-w-lg rounded-[2rem] p-8 shadow-2xl border border-black/5"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black flex items-center gap-2 text-red-500">
                  <Flag className="text-red-500" size={24} /> Report Post
                </h3>
                <button onClick={() => setReportModalOpen(false)} className="p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors">
                  <X size={18} />
                </button>
              </div>
              
              <p className="font-bold opacity-60 mb-4 text-sm" style={{ color: 'var(--text-theme)' }}>
                Please provide a reason for reporting this post. Our moderation team will review it shortly.
              </p>
              
              <textarea 
                className="w-full bg-black/5 border-2 border-transparent focus:border-red-400/50 rounded-2xl p-4 outline-none font-bold text-sm min-h-[120px] resize-none transition-colors mb-6"
                placeholder="Spam, inappropriate content, harassment..."
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                autoFocus
              ></textarea>
              
              <div className="flex items-center justify-end gap-3 border-t border-black/5 pt-6">
                <button onClick={() => setReportModalOpen(false)} className="px-6 py-3 rounded-xl font-bold opacity-60 hover:opacity-100 transition-opacity" style={{ color: 'var(--text-theme)' }}>
                  Cancel
                </button>
                <button 
                  onClick={submitReport}
                  className="px-6 py-3 rounded-xl font-black text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all flex items-center gap-2"
                >
                  <Send size={16} /> Submit Report
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-8 md:p-12 max-w-4xl mx-auto">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <h1 className="text-5xl font-black tracking-tighter mb-2" style={{ color: 'var(--text-theme)' }}>
              Community Escapes
            </h1>
            <p className="opacity-50 font-bold">First-hand experiences from our travelers</p>
          </div>
          {me ? (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/create-blog')}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-white shadow-lg flex-shrink-0"
              style={{ background: 'var(--primary)' }}>
              <PenSquare size={18} /> Write a Story
            </motion.button>
          ) : (
            <button onClick={() => navigate('/login')}
              className="px-6 py-4 rounded-2xl font-black border-2 opacity-60 hover:opacity-100 transition-all flex-shrink-0"
              style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
              Log in to Share
            </button>
          )}
        </div>

        {/* ── Search & Sort Bar ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" style={{ color: 'var(--text-theme)' }} />
            <input
              type="text"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search stories, authors…"
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl font-medium text-sm outline-none transition-all"
              style={{
                background: 'var(--card-theme)',
                border: '1px solid rgba(0,0,0,0.07)',
                color: 'var(--text-theme)',
              }}
            />
            {search && (
              <button onClick={() => { setSearch(''); fetchPosts(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-70 transition-opacity">
                <X size={15} style={{ color: 'var(--text-theme)' }} />
              </button>
            )}
          </div>

          {/* Sort Chips */}
          <div className="flex gap-2 flex-shrink-0">
            {[
              { id: 'latest', label: 'Latest', icon: <Clock size={13} /> },
              { id: 'popular', label: 'Popular', icon: <TrendingUp size={13} /> },
            ].map(s => (
              <button key={s.id} onClick={() => setSortBy(s.id)}
                className="flex items-center gap-1.5 px-4 py-3 rounded-2xl font-black text-xs transition-all"
                style={sortBy === s.id
                  ? { background: 'var(--primary)', color: 'white' }
                  : { background: 'var(--card-theme)', color: 'var(--text-theme)', border: '1px solid rgba(0,0,0,0.07)', opacity: 0.6 }}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Result count */}
        {search && !loading && (
          <p className="text-xs font-black opacity-40 mb-4 uppercase tracking-widest">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
          </p>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="animate-spin opacity-40" size={40} />
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-24 opacity-40">
            {search ? (
              <>
                <Search size={40} className="mx-auto mb-4 opacity-30" />
                <p className="text-2xl font-black mb-2">No results found</p>
                <p className="font-bold">Try a different search term.</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-black mb-3">No stories yet.</p>
                <p className="font-bold">Be the first to share your travel experience!</p>
              </>
            )}
          </div>
        )}

        {/* ── Posts ── */}
        <div className="space-y-10">
          {filtered.map((post, i) => (
            <motion.div key={post.id}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-[3rem] overflow-hidden shadow-xl border"
              style={{ background: 'var(--card-theme)', borderColor: 'rgba(var(--primary-rgb, 99,102,241), 0.08)' }}>
              {/* Cover Image */}
              {post.image && (
                <div className="relative h-72 overflow-hidden">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <span className="absolute top-5 left-5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-white backdrop-blur bg-white/10 border border-white/20">
                    Story
                  </span>
                  {isOwner(post) && (
                    <motion.button whileHover={{ scale: 1.1 }} onClick={() => handleDelete(post.id)}
                      className="absolute top-5 right-5 p-3 rounded-full bg-red-500 text-white shadow-lg" title="Delete your post">
                      <Trash2 size={15} />
                    </motion.button>
                  )}
                </div>
              )}

              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white" style={{ background: 'var(--primary)' }}>
                      {post.author_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-black text-sm" style={{ color: 'var(--text-theme)' }}>{post.author_name}</p>
                        {me && me.id !== post.author_id && (
                          <button 
                            onClick={() => handleFollow(post.author_id)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                              post.is_followed_by_me 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100' 
                                : 'bg-[var(--primary)] text-white hover:opacity-90'
                            }`}
                          >
                            {post.is_followed_by_me ? <><UserCheck size={10} /> Following</> : <><UserPlus size={10} /> Follow</>}
                          </button>
                        )}
                      </div>
                      <p className="text-xs opacity-40 font-bold">
                        {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  {isOwner(post) && !post.image && (
                    <motion.button whileHover={{ scale: 1.1 }} onClick={() => handleDelete(post.id)}
                      className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Delete your post">
                      <Trash2 size={15} />
                    </motion.button>
                  )}
                </div>

                <h2 className="text-2xl font-black mb-3" style={{ color: 'var(--text-theme)' }}>
                  {/* Highlight search match in title */}
                  {search && post.title?.toLowerCase().includes(search.toLowerCase()) ? (
                    <span dangerouslySetInnerHTML={{
                      __html: post.title.replace(new RegExp(`(${search})`, 'gi'), '<mark style="background:rgba(99,102,241,0.15);color:inherit;border-radius:4px;padding:0 2px">$1</mark>')
                    }} />
                  ) : post.title}
                </h2>
                <p className="opacity-70 leading-relaxed mb-6 line-clamp-4">{post.content}</p>

                {/* Actions */}
                <div className="flex items-center gap-6 border-t pt-5" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleLike(post.id)}
                    className="flex items-center gap-2 font-bold text-pink-500 hover:text-pink-600 transition-colors">
                    <Heart size={18} />
                    <span className="text-sm">{post.likes_count || 0}</span>
                  </motion.button>

                  <motion.button whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (!me) { showToast('Log in to comment.', 'warning'); return; }
                      setActiveCommentPost(activeCommentPost === post.id ? null : post.id);
                    }}
                    className="flex items-center gap-2 font-bold opacity-50 hover:opacity-100 transition-opacity">
                    <MessageCircle size={18} />
                    <span className="text-sm">{post.comments?.length || 0}</span>
                  </motion.button>

                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleReport(post.id)}
                    className="flex items-center gap-2 font-bold text-orange-400 opacity-50 hover:opacity-100 transition-opacity ml-auto">
                    <Flag size={15} />
                    <span className="text-xs">Report</span>
                  </motion.button>
                </div>

                {/* Comment Section */}
                <AnimatePresence>
                  {activeCommentPost === post.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} className="mt-5 rounded-3xl p-5 overflow-hidden" style={{ background: 'rgba(0,0,0,0.04)' }}>
                      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1">
                        {post.comments?.length === 0 && (
                          <p className="text-xs opacity-40 italic font-bold">No comments yet. Be the first!</p>
                        )}
                        {post.comments?.map((c, idx) => (
                          <div key={idx} className="bg-white/60 backdrop-blur p-3 rounded-2xl text-sm">
                            <span className="font-black text-xs mr-2" style={{ color: 'var(--primary)' }}>{c.user_name}:</span>
                            {c.text}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input type="text" placeholder="Add a comment…" value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                          className="flex-1 bg-white/60 p-3 rounded-2xl outline-none text-sm font-bold placeholder:font-normal" />
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleComment(post.id)}
                          className="p-3 rounded-2xl text-white" style={{ background: 'var(--primary)' }}>
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