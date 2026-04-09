import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Map, DollarSign, Activity, Compass } from 'lucide-react';
import api from '../services/api';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

const AnalyticsDashboard = () => {
  const { currentTheme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('analytics/')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-20 font-black animate-pulse text-center">Loading Insights...</div>;

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto min-h-screen">
      <div className="mb-12">
        <h1 className="text-5xl font-black tracking-tighter flex items-center gap-4">
          <Activity className="text-[var(--primary)] w-12 h-12" />
          Travel Analytics
        </h1>
        <p className="opacity-60 font-bold mt-2 text-lg">Your journey statistics and spending habits.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="p-8 rounded-[2.5rem] bg-[var(--card-theme)] shadow-lg border border-[var(--primary)]/10 flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Compass size={32} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-widest opacity-50">Total Planned Trips</p>
            <p className="text-4xl font-black">{data.total_trips}</p>
          </div>
        </div>
        
        <div className="p-8 rounded-[2.5rem] bg-[var(--card-theme)] shadow-lg border border-[var(--primary)]/10 flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Map size={32} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-widest opacity-50">Completed Trips</p>
            <p className="text-4xl font-black">{data.completed_trips}</p>
          </div>
        </div>

        <div className="p-8 rounded-[2.5rem] bg-[var(--card-theme)] shadow-lg border border-[var(--primary)]/10 flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
            <DollarSign size={32} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-widest opacity-50">Total Spent</p>
            <p className="text-4xl font-black text-emerald-600">Rs. {data.total_spent.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spending by Category (Pie Chart) */}
        <div className="p-8 rounded-[2.5rem] bg-[var(--card-theme)] shadow-lg border border-[var(--primary)]/10">
          <h3 className="text-2xl font-black mb-6">Spending Breakdown</h3>
          {data.category_data.length === 0 ? (
             <p className="opacity-40 italic font-bold">No expense data available.</p>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.category_data}
                    cx="50%" cy="50%"
                    innerRadius={80} outerRadius={120}
                    paddingAngle={5}
                    dataKey="value" stroke="none"
                  >
                    {data.category_data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    formatter={(value) => `Rs. ${value.toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {data.category_data.map((entry, index) => (
                  <span key={index} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    {entry.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Trips Trend (Bar Chart) */}
        <div className="p-8 rounded-[2.5rem] bg-[var(--card-theme)] shadow-lg border border-[var(--primary)]/10">
          <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
            Trip Activity <TrendingUp className="text-[var(--primary)] w-6 h-6"/>
          </h3>
          {data.trend_data.length === 0 ? (
            <p className="opacity-40 italic font-bold">No trip data available.</p>
          ) : (
            <div className="h-[300px] w-full mt-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.trend_data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', opacity: 0.5 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', opacity: 0.5 }} allowDecimals={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="trips" fill="var(--primary)" radius={[8, 8, 8, 8]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
