import React from 'react';
import { AlertCircle } from 'lucide-react';

const AuthError = ({ message }) => {
  if (!message) return null;
  return (
    <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 font-bold text-sm animate-shake">
      <AlertCircle size={18} />
      <span>{message}</span>
    </div>
  );
};

export default AuthError;