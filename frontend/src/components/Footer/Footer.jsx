import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Mail, ArrowUpRight } from 'lucide-react';
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
      { name: t('footer.contact', 'Liên hệ'), path: '/contact' },
      { name: t('footer.faq', 'Câu hỏi thường gặp'), path: '/faq' },
      { name: t('footer.privacy', 'Chính sách bảo mật'), path: '/privacy' }
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
              {t('footer.slogan', 'Nâng tầm bản sắc số cho thương hiệu của bạn.')}
            </p>
            <div className="footer-socials">
              <a href="#" className="social-link"><Facebook size={20} /></a>
              <a href="#" className="social-link"><Instagram size={20} /></a>
              <a href="#" className="social-link"><Linkedin size={20} /></a>
            </div>
          </div>

          {/* Cột 2 & 3: Links */}
          <div className="footer-links-group">
            <div className="link-col">
              <h4 className="link-title">{t('footer.explore', 'Khám phá')}</h4>
              {footerLinks.company.map((link, i) => (
                <Link key={i} to={link.path} className="link-item">
                  {link.name}
                </Link>
              ))}
            </div>
            <div className="link-col">
              <h4 className="link-title">{t('footer.connect', 'Kết nối')}</h4>
              {footerLinks.support.map((link, i) => (
                <Link key={i} to={link.path} className="link-item">
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Cột 4: Newsletter/Contact CTA */}
          <div className="footer-newsletter">
            <h4 className="link-title">{t('footer.start_project', 'Bắt đầu dự án')}</h4>
            <p>{t('footer.cta_desc', 'Gửi lời chào và cùng tạo nên điều kỳ diệu.')}</p>
            <a href="mailto:hello@impakt.vn" className="footer-email-cta">
              hello@impakt.vn
              <ArrowUpRight size={18} />
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="copyright">
            © {currentYear} IMPAKT Digital Studio. All rights reserved.
          </div>
          <div className="footer-bottom-links">
            <span>Designed with Passion</span>
            <div className="dot-separator"></div>
            <span>Crafted by IMPAKT</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;