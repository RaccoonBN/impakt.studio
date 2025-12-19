import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Home from './pages/Home/Home';
import './styles/variables.css'; // Đảm bảo variables được import tại đây

function App() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const theme = isDark ? 'dark' : 'light';
    
    // 1. Gán thuộc tính data-theme cho thẻ <html>
    root.setAttribute('data-theme', theme);
    
    // 2. Mẹo để fix lỗi màu không ăn: Ép class vào body nếu cần thiết
    document.body.className = theme;
    
    // 3. Lưu vào localStorage
    localStorage.setItem('theme', theme);
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <Router>
      <Header toggleTheme={toggleTheme} isDark={isDark} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;