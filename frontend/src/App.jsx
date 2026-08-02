import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import About from './pages/About/About'; 
import ServicesPage from './pages/Services/ServicesPage';
import ContactPage from './pages/Contact/ContactPage';
import Cursor from './components/UI/Cursor';
import ProjectsPage from './pages/Project/ProjectsPage';
import { Analytics } from "@vercel/analytics/react"
// Import trang ComingSoon
import ComingSoon from './pages/ComingSoon'; 
import FAQPage from './pages/FAQ/FAQPage';
import PrivacyPolicyPage from './pages/Privacy/PrivacyPolicyPage';
import QuotationPage from './pages/Quotation/QuotationPage';

import './styles/variables.css'; 

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
  }, [pathname]);

  useEffect(() => {
    if (!('scrollRestoration' in window.history)) {
      return undefined;
    }

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  return null;
};

const LayoutWrapper = ({ children, toggleTheme, isDark }) => {
  const location = useLocation();

  const isStandalonePage =
    location.pathname.startsWith('/demo') ||
    location.pathname === '/quotation-builder';

  return (
    <>
      {!isStandalonePage && (
        <Header toggleTheme={toggleTheme} isDark={isDark} />
      )}

      <main className={!isStandalonePage ? 'app-main-content' : ''}>
        {children}
      </main>

      {!isStandalonePage && <Footer isDark={isDark} />}
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
      <ScrollToTop />
      <Cursor />
      <Analytics />
      <LayoutWrapper toggleTheme={toggleTheme} isDark={isDark}>
        <Routes>
          {/* TRANG CHỦ VÀ ABOUT GIỮ NGUYÊN */}
          <Route path="/" element={<Home isDark={isDark} />} />
          <Route path="/about" element={<About isDark={isDark} />} />

          {/* TẤT CẢ CÁC TRANG CÒN LẠI TRỎ ĐẾN COMING SOON */}
          <Route path="/services" element={<ServicesPage isDark={isDark} />} />
          <Route path="/contact" element={<ContactPage isDark={isDark} />} />
          <Route path="/projects" element={<ProjectsPage isDark={isDark} />}/>
          <Route path="/faq" element={<FAQPage isDark={isDark} />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage isDark={isDark} />} />

          
          {/* TRANG 404 CŨNG CÓ THỂ TRỎ ĐẾN COMING SOON NẾU MUỐN */}
          <Route
            path="/quotation-builder"
            element={<QuotationPage />}
          />

          <Route path="*" element={<ComingSoon isDark={isDark} />} />
        </Routes>
      </LayoutWrapper>
    </Router>
  );
}

export default App;