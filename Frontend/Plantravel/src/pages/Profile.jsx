import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { User, MapPin, BookOpen, Users, History, Settings as SettingsIcon, ChevronDown, ChevronUp } from 'lucide-react';
import ExpenseTracker from '../components/Expense/ExpenseTracker';

const Profile = () => {
  const { currentTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('blogs'); // blogs, history, social
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ username: '', bio: '' });
  const [expandedTripId, setExpandedTripId] = useState(null);

  const [profilePicFile, setProfilePicFile] = useState(null);

  const fetchProfile = () => {
    api.get('profile/me/').then(res => {
      setProfile(res.data);
      setEditData({ username: res.data.username, bio: res.data.bio || '' });
    });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    try {
      if (profilePicFile) {
        const formData = new FormData();
        formData.append('username', editData.username);
        formData.append('bio', editData.bio);
        formData.append('profile_picture', profilePicFile);
        await api.patch('profile/update_profile/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.patch('profile/update_profile/', editData);
      }
      setIsEditing(false);
      setProfilePicFile(null);
      fetchProfile();
    } catch (e) {
      console.error(e);
      alert('Failed to update profile');
    }
  };

  if (!profile) return <div className="p-20 font-black animate-pulse">Synchronizing Aura...</div>;

  return (
    <div className="p-8 md:p-16 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center gap-10 mb-16 bg-[var(--card-theme)] p-12 rounded-[4rem] shadow-xl border border-[var(--primary)]/10">
        <div className="w-40 h-40 rounded-[3rem] bg-[var(--primary)]/20 flex items-center justify-center overflow-hidden border-4 border-[var(--primary)] relative">
          {profile.profile_picture ? <img src={profile.profile_picture} className="w-full h-full object-cover" /> : <User size={64} className="text-[var(--primary)]" />}
          {isEditing && (
             <input 
               type="file" 
               accept="image/*" 
               onChange={e => setProfilePicFile(e.target.files[0])} 
               className="absolute inset-0 opacity-0 cursor-pointer z-10" 
               title="Upload Profile Picture"
             />
           )}
           {isEditing && <div className="absolute bottom-2 bg-black/50 text-white text-[10px] uppercase font-black px-3 py-1 rounded-full pointer-events-none">Change Pic</div>}
        </div>
        
        <div className="flex-1 text-center md:text-left">
          {isEditing ? (
            <div className="mb-6 space-y-3">
              <input 
                className="w-full p-2 text-2xl font-black bg-transparent border-b-2 border-black/20 outline-none" 
                value={editData.username} 
                onChange={(e) => setEditData({...editData, username: e.target.value})} 
              />
              <textarea 
                className="w-full p-2 bg-black/5 rounded-xl outline-none font-bold opacity-80" 
                rows="2" 
                value={editData.bio} 
                onChange={(e) => setEditData({...editData, bio: e.target.value})} 
              />
              <div className="flex gap-2">
                <button onClick={handleUpdateProfile} className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-bold text-sm">Save</button>
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-black/10 rounded-lg font-bold text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-5xl font-black tracking-tighter mb-2">{profile.username}</h1>
              <p className="opacity-60 font-bold mb-6 max-w-md">{profile.bio || "No bio yet. Define your traveler soul in settings."}</p>
            </>
          )}
          
          <div className="flex justify-center md:justify-start gap-8">
            <div className="text-center">
              <p className="text-2xl font-black">{profile.followers_count}</p>
              <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black">{profile.following_count}</p>
              <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Following</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black">{profile.posts.length}</p>
              <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Posts</p>
            </div>
          </div>
        </div>
        
        <button onClick={() => setIsEditing(!isEditing)} className="p-4 rounded-2xl bg-black/5 hover:bg-black/10 transition-all">
          <SettingsIcon size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-10 bg-black/5 p-2 rounded-3xl w-fit">
        {[
          { id: 'blogs', icon: <BookOpen size={18}/>, label: 'My Blogs' },
          { id: 'history', icon: <History size={18}/>, label: 'Travel History' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all 
              ${activeTab === tab.id ? 'bg-[var(--primary)] text-white shadow-lg' : 'opacity-40 hover:opacity-100'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeTab === 'blogs' && profile.posts.map(post => (
          <div key={post.id} className="p-6 rounded-[2.5rem] bg-[var(--card-theme)] border border-[var(--primary)]/5 shadow-md">
            <h4 className="text-xl font-bold mb-2">{post.title}</h4>
            <p className="opacity-60 text-sm line-clamp-2">{post.content}</p>
          </div>
        ))}

        {activeTab === 'history' && profile.trips.map(trip => (
          <div key={trip.id} className="flex flex-col gap-2">
            <div 
              onClick={() => setExpandedTripId(expandedTripId === trip.id ? null : trip.id)}
              className="p-8 rounded-[2.5rem] bg-[var(--card-theme)] border-l-8 border-[var(--primary)] flex justify-between items-center cursor-pointer hover:shadow-md transition-all"
            >
              <div>
                <p className="text-[10px] font-black uppercase opacity-40 mb-1">Destination</p>
                <h4 className="text-2xl font-black">{trip.destination}</h4>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <p className="font-bold opacity-60 text-sm">{trip.start_date}</p>
                  <span className={`text-[9px] font-black bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-1 rounded uppercase`}>
                    {trip.is_completed ? 'COMPLETED' : 'PLANNED'}
                  </span>
                </div>
                {expandedTripId === trip.id ? <ChevronUp className="text-[var(--primary)]" /> : <ChevronDown className="opacity-40" />}
              </div>
            </div>
            
            {/* Expanded section for Expense Tracker */}
            {expandedTripId === trip.id && (
              <div className="ml-4 md:ml-12 mb-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <ExpenseTracker trip={trip} />
              </div>
            )}
          </div>
        ))}
        
        {activeTab === 'blogs' && profile.posts.length === 0 && <p className="opacity-40 font-bold italic">No stories shared yet...</p>}
      </div>
    </div>
  );
};

export default Profile;