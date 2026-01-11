import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, Fingerprint, Heart, ShieldCheck, Stars } from 'lucide-react';
import Button from '../../components/UI/Button'; // Sử dụng component của bạn
import './About.css';

const About = () => {
  const { t } = useTranslation();
  
  const anim = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  };

  return (
    <div className="about-page">
      <div className="about-wrapper">
        
        {/* HERO - Full Width tinh tế */}
        <motion.section {...anim} className="hero-section">
          <div className="meta-info">
            <span className="founded-tag">{t('about.founded_date')}</span>
            <div className="decor-line"></div>
          </div>
          <h1 className="headline-text">{t('about.headline')}</h1>
        </motion.section>

        {/* ORIGIN GRID - Layout dàn trải */}
        <section className="origin-section">
          <div className="origin-grid">
            <motion.div {...anim} className="origin-heading">
              <span className="label-accent">{t('about.origin_title')}</span>
              <h2>{t('about.origin_question')}</h2>
            </motion.div>
            
            <motion.div {...anim} className="origin-body">
              <p className="lead-paragraph">{t('about.origin_desc')}</p>
              <div className="split-text">
                <p>{t('about.p1')}</p>
                <p>{t('about.p2')}</p>
              </div>
            </motion.div>
          </div>
        </section>

    {/* FEATURES - 4 CỘT TRÊN 1 HÀNG */}
        <section className="features-section">
          <div className="features-grid-row">
            {[
              { icon: <Fingerprint size={28} />, title: 'about.diff_1_title', desc: 'about.diff_1_desc' },
              { icon: <Stars size={28} />, title: 'about.diff_2_title', desc: 'about.diff_2_desc' },
              { icon: <ShieldCheck size={28} />, title: 'about.legal_title', desc: 'about.legal_desc' },
              { icon: <Heart size={28} />, title: 'about.performance', desc: 'about.performanceText' }
            ].map((item, i) => (
              <motion.div 
                key={i} 
                {...anim} 
                transition={{ delay: i * 0.1 }} 
                className="compact-info-card"
              >
                <div className="card-icon-small">{item.icon}</div>
                <h3 className="card-title-small">{t(item.title)}</h3>
                <p className="card-desc-small">{t(item.desc)}</p>
              </motion.div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default About;