import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const BackgroundVideo = () => {
  const { currentTheme, activeTheme } = useTheme();

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <AnimatePresence mode='wait'>
        <motion.video
          key={activeTheme}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover scale-105"
        >
          <source src={currentTheme.video} type="video/mp4" />
        </motion.video>
      </AnimatePresence>
      <div className="absolute inset-0 transition-colors duration-1000"
        style={{ 
          backgroundColor: activeTheme === 'dark' ? 'rgba(15, 23, 42, 0.4)' : 'rgba(250, 249, 246, 0.3)',
          backdropFilter: 'blur(10px)' 
        }} 
      />
    </div>
  );
};

export default BackgroundVideo;