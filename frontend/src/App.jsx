import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import About from './pages/About/About'; 
import ContactPage from './pages/Contact/ContactPage';
import Cursor from './components/UI/Cursor';
import { Analytics } from "@vercel/analytics/next"
// Import trang ComingSoon
import ComingSoon from './pages/ComingSoon'; 

// Import 3 trang Demo
import PortfolioDemo from './pages/Project/demos/PortfolioDemo';
import BusinessDemo from './pages/Project/demos/BusinessDemo';
import EcommerceDemo from './pages/Project/demos/EcommerceDemo';

import './styles/variables.css'; 

const LayoutWrapper = ({ children, toggleTheme, isDark }) => {
  const location = useLocation();
  const isDemoPage = location.pathname.startsWith('/demo');

  return (
    <>
      {!isDemoPage && <Header toggleTheme={toggleTheme} isDark={isDark} />}
      <main className={!isDemoPage ? "app-main-content" : ""}>
        {children}
      </main>
      {!isDemoPage && <Footer isDark={isDark} />}
    </>
  );
};

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
      <Analytics />
      <LayoutWrapper toggleTheme={toggleTheme} isDark={isDark}>
        <Routes>
          {/* TRANG CHỦ VÀ ABOUT GIỮ NGUYÊN */}
          <Route path="/" element={<Home isDark={isDark} />} />
          <Route path="/about" element={<About isDark={isDark} />} />

          {/* TẤT CẢ CÁC TRANG CÒN LẠI TRỎ ĐẾN COMING SOON */}
          <Route path="/services" element={<ComingSoon isDark={isDark} />} />
          <Route path="/projects" element={<ComingSoon isDark={isDark} />} />
          <Route path="/contact" element={<ComingSoon isDark={isDark} />} />

          {/* CÁC ROUTE DÀNH CHO DEMO (Nếu bạn vẫn muốn giữ để test) */}
          <Route path="/demo/portfolio" element={<PortfolioDemo />} />
          <Route path="/demo/business" element={<BusinessDemo />} />
          <Route path="/demo/ecommerce" element={<EcommerceDemo />} />
          
          {/* TRANG 404 CŨNG CÓ THỂ TRỎ ĐẾN COMING SOON NẾU MUỐN */}
          <Route path="*" element={<ComingSoon isDark={isDark} />} />
        </Routes>
      </LayoutWrapper>
    </Router>
  );
}

export default App;