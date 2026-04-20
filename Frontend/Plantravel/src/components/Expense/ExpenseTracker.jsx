import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Plus, Trash2, AlertTriangle, PieChart, Tag, FileText, Edit2 } from 'lucide-react';
import api from '../../services/api';

const ExpenseTracker = ({ trip }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newExpense, setNewExpense] = useState({ amount: '', category: 'MISC', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const categories = [
    { id: 'FOOD', label: 'Food & Dining', color: 'from-orange-400 to-rose-400', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
    { id: 'TRANSPORT', label: 'Transportation', color: 'from-blue-400 to-indigo-400', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'ACCOMMODATION', label: 'Accommodation', color: 'from-violet-400 to-purple-400', bg: 'bg-violet-50 text-violet-700 border-violet-200' },
    { id: 'ACTIVITIES', label: 'Activities', color: 'from-emerald-400 to-teal-400', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'MISC', label: 'Misc', color: 'from-gray-400 to-slate-400', bg: 'bg-gray-50 text-gray-700 border-gray-200' },
  ];

  const fetchExpenses = () => {
    api.get(`expenses/?trip=${trip.id}`)
       .then(res => {
         setExpenses(res.data);
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

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.amount) return;
    
    setSubmitting(true);
    try {
      if (editingId) {
        await api.patch(`expenses/${editingId}/`, {
          amount: parseFloat(newExpense.amount),
          category: newExpense.category,
          description: newExpense.description
        });
        setEditingId(null);
      } else {
        await api.post('expenses/', {
          trip: trip.id,
          amount: parseFloat(newExpense.amount),
          category: newExpense.category,
          description: newExpense.description
        });
      }
      setNewExpense({ amount: '', category: 'MISC', description: '' });
      fetchExpenses();
    } catch (err) {
      console.error(err);
      alert('Failed to save expense. Ensure amount is valid.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (expense) => {
    setNewExpense({
      amount: expense.amount,
      category: expense.category,
      description: expense.description || ''
    });
    setEditingId(expense.id);
  };
  
  const cancelEdit = () => {
    setEditingId(null);
    setNewExpense({ amount: '', category: 'MISC', description: '' });
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

  if (loading) return (
    <div className="flex items-center justify-center p-8 w-full bg-[var(--card-theme)] rounded-[2rem] border border-[var(--primary)]/10 shadow-lg">
      <div className="w-8 h-8 rounded-full border-4 border-[var(--primary)]/20 border-t-[var(--primary)] animate-spin" />
    </div>
  );

  return (
    <div className="bg-[var(--card-theme)] rounded-[2rem] p-6 lg:p-8 border border-[var(--primary)]/10 shadow-sm relative overflow-hidden group">
      
      {/* Decorative Blur */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[var(--primary)] opacity-[0.03] blur-[100px] rounded-full pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-1000" />
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className="p-3 bg-[var(--primary)]/10 rounded-2xl text-[var(--primary)] shrink-0">
          <DollarSign size={24} strokeWidth={3} />
        </div>
        <div>
          <h3 className="text-2xl font-black tracking-tight leading-none mb-1">Expense Tracker</h3>
          <p className="text-xs opacity-50 font-bold">Monitor your spending for {trip.destination}</p>
        </div>
      </div>

      {/* Budget Overview Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-[1.5rem] mb-8 border relative overflow-hidden backdrop-blur-xl ${
          isOverBudget ? 'bg-red-50/50 border-red-200' : isWarning ? 'bg-yellow-50/50 border-yellow-200' : 'bg-[var(--primary)]/5 border-[var(--primary)]/20'
        } flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}
      >
        <div className="relative z-10 shrink-0">
          <p className={`text-[10px] font-black uppercase tracking-widest ${
            isOverBudget ? 'text-red-500' : isWarning ? 'text-yellow-600' : 'text-[var(--primary)]'
          } opacity-80 mb-1`}>
            Total Spent
          </p>
          <p className={`text-4xl font-black tracking-tighter ${
            isOverBudget ? 'text-red-600' : isWarning ? 'text-yellow-700' : 'text-[var(--primary)]'
          }`}>
            <span className="text-xl mr-1">Rs.</span>
            {totalSpent.toLocaleString()}
          </p>
          <p className="text-xs font-black opacity-40 mt-1 tracking-wide">
            BUDGET: RS. {budget.toLocaleString()}
          </p>
        </div>
        
        <div className="flex-1 w-full relative z-10 pt-2 md:pt-0">
          <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-widest opacity-60">
            <span className={isOverBudget ? 'text-red-600 opacity-100' : ''}>{budgetPercentage.toFixed(1)}% Used</span>
            {isOverBudget && <span className="text-red-500 flex items-center gap-1 opacity-100"><AlertTriangle size={12} /> Over Limit</span>}
            {isWarning && <span className="text-yellow-600 flex items-center gap-1 opacity-100"><AlertTriangle size={12} /> Nearing</span>}
          </div>
          <div className="h-3 w-full bg-black/5 rounded-full overflow-hidden p-0.5 inset-shadow-sm">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={`h-full rounded-full shadow-inner ${
                isOverBudget ? 'bg-gradient-to-r from-red-400 to-red-600' : 
                isWarning ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 
                'bg-gradient-to-r from-[var(--primary)] to-indigo-400'
              }`}
            />
          </div>
        </div>
      </motion.div>

      <div className="flex flex-wrap gap-8">
        
        {/* Add Expense Form */}
        <div className="flex-grow shrink min-w-[300px] basis-[350px] relative z-10">
          <div className="bg-black/[0.02] rounded-[1.5rem] p-6 border border-black/5 shadow-sm">
            <h4 className="font-black text-lg mb-5 flex items-center gap-2 tracking-tight opacity-80">
              <Plus size={18} className="text-[var(--primary)]" /> {editingId ? 'Edit Expense' : 'Log Expense'}
            </h4>
            
            <form onSubmit={handleSubmitExpense} className="space-y-4">
              
              <div className="group relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[var(--primary)]/50 group-focus-within:text-[var(--primary)] transition-colors">
                  <DollarSign size={16} strokeWidth={3} />
                </div>
                <input 
                  type="number" required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-black/5 outline-none font-black transition-all focus:border-[var(--primary)]/30 focus:shadow-sm text-sm"
                  placeholder="0.00"
                  value={newExpense.amount}
                  onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                />
              </div>

              <div className="group relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-black/20 group-focus-within:text-black/50 transition-colors">
                  <Tag size={16} strokeWidth={3} />
                </div>
                <select 
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-black/5 outline-none font-bold text-xs transition-all focus:border-black/10 focus:shadow-sm appearance-none"
                  value={newExpense.category}
                  onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>

              <div className="group relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-black/20 group-focus-within:text-black/50 transition-colors">
                  <FileText size={16} strokeWidth={3} />
                </div>
                <input 
                  type="text" 
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-black/5 outline-none font-bold text-xs transition-all focus:border-black/10 focus:shadow-sm"
                  placeholder="What was this for?"
                  value={newExpense.description}
                  onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                />
              </div>

              <div className="flex gap-2">
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="flex-1 mt-2 py-3.5 rounded-xl font-black text-white shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed text-xs"
                  style={{ background: 'var(--primary)', boxShadow: '0 4px 15px rgba(var(--primary-rgb), 0.2)' }}
                >
                  {submitting ? 'Saving...' : <><Plus strokeWidth={4} size={16} /> {editingId ? 'UPDATE' : 'ADD EXPENSE'}</>}
                </motion.button>
                {editingId && (
                  <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={cancelEdit}
                    className="mt-2 px-4 py-3.5 rounded-xl font-black text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all text-xs"
                  >
                    CANCEL
                  </motion.button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Expense List */}
        <div className="flex-grow shrink min-w-[350px] basis-[0] relative z-10 flex flex-col">
          <h4 className="font-black text-lg mb-4 flex items-center gap-2 tracking-tight opacity-80">
            <PieChart size={18} className="text-[var(--primary)]" /> Recent Transactions
          </h4>
          
          <div className="flex-1 bg-black/[0.02] rounded-[1.5rem] border border-black/5 p-4 min-h-[300px] shadow-sm">
            {expenses.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-8">
                <div className="w-16 h-16 mb-4 rounded-full bg-black/5 flex items-center justify-center">
                  <DollarSign size={32} className="opacity-50" />
                </div>
                <h5 className="text-lg font-black mb-1">Clean Ledger</h5>
                <p className="font-bold text-xs">No expenses logged yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence>
                  {expenses.map((expense) => {
                    const catInfo = categories.find(c => c.id === expense.category) || categories[4];
                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={expense.id} 
                        className="group flex items-center justify-between p-3.5 rounded-[1rem] bg-white shadow-sm border border-black/5 hover:shadow hover:border-[var(--primary)]/20 transition-all gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br ${catInfo.color} flex items-center justify-center shadow-inner`}>
                            <Tag className="text-white drop-shadow-md" size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-[13px] opacity-90 leading-tight mb-0.5 truncate">{expense.description || 'General Expense'}</p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${catInfo.bg}`}>{expense.category}</span>
                              <span className="text-[9px] font-black uppercase tracking-widest opacity-40 shrink-0">
                                {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 opacity-90">
                          <span className="font-black text-[15px] tracking-tight whitespace-nowrap">
                            <span className="text-[10px] mr-0.5 opacity-60">Rs.</span>
                            <span className="text-[var(--primary)]">{parseFloat(expense.amount).toLocaleString()}</span>
                          </span>
                          <button 
                            onClick={() => handleEdit(expense)} 
                            className="p-1.5 md:opacity-0 group-hover:opacity-100 text-blue-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all"
                            title="Edit transaction"
                          >
                            <Edit2 size={14} strokeWidth={3} />
                          </button>
                          <button 
                            onClick={() => handleDelete(expense.id)} 
                            className="p-1.5 md:opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                            title="Delete transaction"
                          >
                            <Trash2 size={14} strokeWidth={3} />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;

