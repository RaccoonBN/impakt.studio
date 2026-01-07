import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowUpRight, Instagram, Linkedin, Mail, MousePointer2 } from 'lucide-react';
import './PortfolioDemo.css';

const PortfolioDemo = () => {
  const { t } = useTranslation();

  // Animation variants cho Framer Motion
  const fadeInUp = {
    initial: { y: 60, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.8, ease: [0.6, 0.01, -0.05, 0.95] }
  };

  return (
    <div className="pd-root">
      {/* HEADER GIẢ LẬP CHO DEMO */}
      <nav className="pd-nav">
        <div className="pd-logo">IMPAKT.STUDIO</div>
        <div className="pd-menu">
          <a href="#work">{t('projects.demo_portfolio.view_work')}</a>
          <a href="#contact" className="pd-contact-link">{t('contact.badge')}</a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pd-hero">
        <motion.div 
          className="pd-hero-content"
          initial="initial"
          animate="animate"
        >
          <motion.span variants={fadeInUp} className="pd-badge">
            {t('projects.demo_portfolio.role')}
          </motion.span>
          
          <motion.h1 variants={fadeInUp} className="pd-title">
            Định hình <br/> 
            <span className="pd-outline">Thương hiệu</span>
          </motion.h1>

          <motion.div variants={fadeInUp} className="pd-hero-footer">
            <p className="pd-desc">{t('projects.demo_portfolio.slogan')}</p>
            <div className="pd-scroll-hint">
              <MousePointer2 size={16} />
              <span>Scroll to explore</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* PROJECTS GRID SECTION */}
      <section id="work" className="pd-work-section">
        <div className="pd-grid">
          {[1, 2, 3, 4].map((item) => (
            <motion.div 
              key={item} 
              className="pd-work-card"
              whileHover={{ y: -10 }}
            >
              <div className="pd-work-image">
                <div className="pd-image-placeholder"></div>
                <div className="pd-work-overlay">
                  <ArrowUpRight size={32} />
                </div>
              </div>
              <div className="pd-work-info">
                <h3>Campaign Visual 202{item}</h3>
                <p>Creative Direction / Photography</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FOOTER SECTION */}
      <footer id="contact" className="pd-footer">
        <div className="pd-footer-content">
          <h2 className="pd-footer-title">Let's Create <br/>Something Great.</h2>
          <p>{t('projects.demo_portfolio.about')}</p>
          
          <div className="pd-social-links">
            <a href="#"><Instagram /></a>
            <a href="#"><Linkedin /></a>
            <a href="#"><Mail /></a>
          </div>
          
          <div className="pd-copyright">
            <p>© 2026 IMPAKT Studio • Creative Director Showcase</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PortfolioDemo;