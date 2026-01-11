import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, ArrowUpRight } from 'lucide-react';
import './Footer.css';

import logoLight from '../../assets/logo_light.svg';
import logoDark from '../../assets/logo_dark.svg';

const Footer = ({ isDark }) => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: t('nav.about'), path: '/about' },
      { name: t('nav.projects'), path: '/projects' },
      { name: t('nav.services'), path: '/services' }
    ],
    support: [
      { name: t('footer.contact'), path: '/contact' },
      { name: t('footer.faq'), path: '/faq' },
      { name: t('footer.privacy'), path: '/privacy' }
    ]
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          {/* Cột 1: Logo & Slogan */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <img src={isDark ? logoDark : logoLight} alt="IMPAKT Logo" />
            </Link>
            <p className="footer-slogan">
              {t('footer.slogan')}
            </p>
            <div className="footer-socials">
              <a href="https://www.facebook.com/profile.php?id=61585316609857" target="_blank" rel="noreferrer" className="social-link">
                <Facebook size={20} />
              </a>
              <a href="https://www.instagram.com/impaktstudio.official/" target="_blank" rel="noreferrer" className="social-link">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Cột 2 & 3: Links */}
          <div className="footer-links-group">
            <div className="link-col">
              <h4 className="link-title">{t('footer.explore')}</h4>
              {footerLinks.company.map((link, i) => (
                <Link key={i} to={link.path} className="link-item">
                  {link.name}
                </Link>
              ))}
            </div>
            <div className="link-col">
              <h4 className="link-title">{t('footer.connect')}</h4>
              {footerLinks.support.map((link, i) => (
                <Link key={i} to={link.path} className="link-item">
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Cột 4: Newsletter/Contact CTA */}
          <div className="footer-newsletter">
            <h4 className="link-title">{t('footer.start_project')}</h4>
            <p>{t('footer.cta_desc')}</p>
            <a href="mailto:impaktstudio.official@gmail.com" className="footer-email-cta">
              impaktstudio.official@gmail.com
              <ArrowUpRight size={18} />
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="copyright">
            {t('footer.copy', { year: currentYear })}
          </div>
          <div className="footer-bottom-links">
            <span>{t('footer.passion')}</span>
            <div className="dot-separator"></div>
            <span>{t('footer.crafted')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;