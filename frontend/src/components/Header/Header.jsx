import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Globe, Menu, X } from 'lucide-react';
import './Header.css';

import logoLight from '../../assets/logo_light.svg';
import logoDark from '../../assets/logo_dark.svg';

const Header = ({ toggleTheme, isDark }) => {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi');
  };

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.about'), path: '/about' },
    { name: t('nav.services'), path: '/services' },
    { name: t('nav.projects'), path: '/projects' },
    { name: t('nav.contact'), path: '/contact' },
  ];

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        <Link to="/" className="logo" onClick={() => setIsMenuOpen(false)}>
          <img src={isDark ? logoDark : logoLight} alt="IMPAKT Studio" />
        </Link>

        {/* Desktop Menu */}
        <nav className="nav-desktop">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} className={`nav-item ${location.pathname === link.path ? 'active' : ''}`}>
              <span className="nav-text">{link.name}</span>
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          {/* Nút Ngôn ngữ dạng Icon Bare */}
          <div className="icon-only-btn lang-toggle" onClick={toggleLanguage}>
            <Globe size={22} strokeWidth={2} />
            <span className="lang-code">{i18n.language?.toUpperCase()}</span>
          </div>

          {/* Nút Theme dạng Icon Bare */}
          <div className="icon-only-btn theme-toggle" onClick={toggleTheme}>
            {isDark ? <Sun size={24} strokeWidth={2} /> : <Moon size={24} strokeWidth={2} />}
          </div>

          {/* Icon Menu chỉ hiện trên Mobile */}
          <div className="mobile-menu-icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={30} /> : <Menu size={30} />}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`nav-mobile-overlay ${isMenuOpen ? 'show' : ''}`}>
         {navLinks.map((link) => (
            <Link key={link.path} to={link.path} onClick={() => setIsMenuOpen(false)}>
              {link.name}
            </Link>
          ))}
      </div>
    </header>
  );
};

export default Header;