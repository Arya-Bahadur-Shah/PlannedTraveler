import { Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';

function App() {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<div className="p-10 text-center">Login Page (Coming Soon)</div>} />
      <Route path="/" element={<Navigate to="/register" />} />
    </Routes>
  );
}

export default App;