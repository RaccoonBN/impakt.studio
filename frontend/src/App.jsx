import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import About from './pages/About/About'; 
import './styles/variables.css'; 
import Cursor from './components/UI/Cursor';

function App() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const theme = isDark ? 'dark' : 'light';
    
    root.setAttribute('data-theme', theme);
    document.body.className = theme;
    localStorage.setItem('theme', theme);
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <Router>
      <Cursor />
      <Header toggleTheme={toggleTheme} isDark={isDark} />
      
      {/* Dùng thẻ <main> làm wrapper để đẩy Footer xuống đáy 
          khi nội dung trang ngắn (sử dụng CSS flex-grow)
      */}
      <main className="app-main-content">
        <Routes>
          <Route path="/" element={<Home isDark={isDark} />} />
          <Route path="/about" element={<About isDark={isDark} />} />
        </Routes>
      </main>

      <Footer isDark={isDark} />
    </Router>
  );
}

export default App;