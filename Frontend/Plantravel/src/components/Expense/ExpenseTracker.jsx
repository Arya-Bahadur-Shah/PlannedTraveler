import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Plus, Trash2, AlertTriangle, PieChart } from 'lucide-react';
import api from '../../services/api';

const ExpenseTracker = ({ trip }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newExpense, setNewExpense] = useState({ amount: '', category: 'MISC', description: '' });

  const categories = [
    { id: 'FOOD', label: 'Food & Dining', color: 'bg-orange-100 text-orange-700' },
    { id: 'TRANSPORT', label: 'Transportation', color: 'bg-blue-100 text-blue-700' },
    { id: 'ACCOMMODATION', label: 'Accommodation', color: 'bg-violet-100 text-violet-700' },
    { id: 'ACTIVITIES', label: 'Activities', color: 'bg-emerald-100 text-emerald-700' },
    { id: 'MISC', label: 'Misc', color: 'bg-gray-100 text-gray-700' },
  ];

  const fetchExpenses = () => {
    api.get(`expenses/`)
       .then(res => {
         // Filter for current trip
         const tripExpenses = res.data.filter(e => e.trip === trip.id);
         setExpenses(tripExpenses);
         setLoading(false);
       })
       .catch(err => {
         console.error(err);
         setLoading(false);
       });
  };

  useEffect(() => {
    if (trip) fetchExpenses();
  }, [trip]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.amount) return;
    
    try {
      await api.post('expenses/', {
        trip: trip.id,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        description: newExpense.description
      });
      setNewExpense({ amount: '', category: 'MISC', description: '' });
      fetchExpenses();
    } catch (err) {
      console.error(err);
      alert('Failed to add expense');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`expenses/${id}/`);
      fetchExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const budget = parseFloat(trip.budget) || 0;
  const budgetPercentage = budget > 0 ? (totalSpent / budget) * 100 : 0;
  const isOverBudget = totalSpent > budget;
  const isWarning = budgetPercentage > 85 && !isOverBudget;

  if (loading) return <div className="animate-pulse flex items-center justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin"/></div>;

  return (
    <div className="bg-[var(--card-theme)] rounded-3xl p-6 border border-[var(--primary)]/10 shadow-lg mt-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-black flex items-center gap-2"><DollarSign className="text-emerald-500"/> Expense Tracker</h3>
          <p className="text-sm opacity-60 font-bold">Track your spending for {trip.destination}</p>
        </div>
      </div>

      {/* Budget Overview */}
      <div className={`p-6 rounded-2xl mb-8 border ${isOverBudget ? 'bg-red-50 border-red-200' : isWarning ? 'bg-yellow-50 border-yellow-200' : 'bg-emerald-50 border-emerald-100'} flex flex-col md:flex-row items-center justify-between gap-6`}>
        <div>
          <p className={`text-xs font-black uppercase tracking-widest ${isOverBudget ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-emerald-600'} opacity-70`}>Total Spent</p>
          <p className={`text-4xl font-black ${isOverBudget ? 'text-red-700' : isWarning ? 'text-yellow-700' : 'text-emerald-700'}`}>Rs. {totalSpent.toLocaleString()}</p>
          <p className="text-sm font-bold opacity-60 mt-1">out of Rs. {budget.toLocaleString()}</p>
        </div>
        
        <div className="flex-1 w-full max-w-sm">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className={isOverBudget ? 'text-red-600' : 'opacity-60'}>{budgetPercentage.toFixed(1)}% Used</span>
            {isOverBudget && <span className="text-red-600 flex items-center gap-1"><AlertTriangle size={14}/> Over Budget!</span>}
            {isWarning && <span className="text-yellow-600 flex items-center gap-1"><AlertTriangle size={14}/> Nearing Limit</span>}
          </div>
          <div className="h-3 w-full bg-black/5 rounded-full overflow-hidden">
            <div 
              className={`h-full ${isOverBudget ? 'bg-red-500' : isWarning ? 'bg-yellow-400' : 'bg-emerald-500'} rounded-full transition-all duration-1000`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Expense Form */}
        <div className="lg:col-span-1 bg-black/5 p-5 rounded-2xl border border-black/5">
          <h4 className="font-black mb-4">Add Expense</h4>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1 block">Amount (Rs.)</label>
              <input 
                type="number" required
                className="w-full p-3 rounded-xl bg-white border border-black/10 outline-none font-bold"
                placeholder="e.g. 500"
                value={newExpense.amount}
                onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1 block">Category</label>
              <select 
                className="w-full p-3 rounded-xl bg-white border border-black/10 outline-none font-bold text-sm"
                value={newExpense.category}
                onChange={e => setNewExpense({...newExpense, category: e.target.value})}
              >
                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1 block">Description</label>
              <input 
                type="text" 
                className="w-full p-3 rounded-xl bg-white border border-black/10 outline-none text-sm"
                placeholder="Dinner at Lakeside"
                value={newExpense.description}
                onChange={e => setNewExpense({...newExpense, description: e.target.value})}
              />
            </div>
            <button 
              type="submit"
              className="w-full py-3 rounded-xl font-black text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              style={{ background: 'var(--primary)' }}
            >
              <Plus size={18}/> Add 
            </button>
          </form>
        </div>

        {/* Expense List */}
        <div className="lg:col-span-2">
          <h4 className="font-black mb-4 flex items-center gap-2"><PieChart size={18}/> Recent Log</h4>
          {expenses.length === 0 ? (
            <div className="p-8 text-center text-sm font-bold opacity-40 border-2 border-dashed border-black/10 rounded-2xl">
              No expenses logged for this trip yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {expenses.map((expense, idx) => {
                const catInfo = categories.find(c => c.id === expense.category) || categories[4];
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                    key={expense.id} 
                    className="flex items-center justify-between p-4 rounded-2xl bg-white shadow-sm border border-black/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${catInfo.color}`}>
                        {expense.category}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{expense.description || 'No description'}</p>
                        <p className="text-xs opacity-50">{new Date(expense.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-black text-emerald-600 border px-3 py-1 bg-emerald-50 border-emerald-100 rounded-lg">Rs. {parseFloat(expense.amount).toLocaleString()}</span>
                      <button onClick={() => handleDelete(expense.id)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;
