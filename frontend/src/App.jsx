import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import About from './pages/About/About'; 
import ServicesPage from './pages/Services/ServicesPage';
import ContactPage from './pages/Contact/ContactPage';
import ProjectsPage from './pages/Project/ProjectsPage'; 
import Cursor from './components/UI/Cursor';

// Import 3 trang Demo
import PortfolioDemo from './pages/Project/demos/PortfolioDemo';
import BusinessDemo from './pages/Project/demos/BusinessDemo';
import EcommerceDemo from './pages/Project/demos/EcommerceDemo';

import './styles/variables.css'; 

// Component phụ trợ để kiểm tra xem có nên hiện Header/Footer không
const LayoutWrapper = ({ children, toggleTheme, isDark }) => {
  const location = useLocation();
  // Nếu đường dẫn bắt đầu bằng /demo, chúng ta ẩn Header & Footer
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
      <LayoutWrapper toggleTheme={toggleTheme} isDark={isDark}>
        <Routes>
          <Route path="/" element={<Home isDark={isDark} />} />
          <Route path="/about" element={<About isDark={isDark} />} />
          <Route path="/services" element={<ServicesPage isDark={isDark} />} />
          <Route path="/projects" element={<ProjectsPage isDark={isDark} />} />
          <Route path="/contact" element={<ContactPage isDark={isDark} />} />

          {/* CÁC ROUTE DÀNH CHO DEMO */}
          <Route path="/demo/portfolio" element={<PortfolioDemo />} />
          <Route path="/demo/business" element={<BusinessDemo />} />
          <Route path="/demo/ecommerce" element={<EcommerceDemo />} />
        </Routes>
      </LayoutWrapper>
    </Router>
  );
}

export default App;