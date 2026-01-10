import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Construction, Asterisk } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/UI/Button'; 
import './ComingSoon.css';

const ComingSoon = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const marqueeContent = i18n.isInitialized ? t('coming_soon.marquee_text') : "UNDER CONSTRUCTION";
  const marqueeItems = Array(20).fill(`${marqueeContent} `);

  return (
    <div className="cs-x-wrapper">
      <div className="cs-x-lines">
        <div className="cs-line-massive slant-right">
          <div className="cs-ticker-fast">
            {marqueeItems.map((text, i) => (
              <span key={`right-${i}`}>{text} <Asterisk size={32} /> </span>
            ))}
          </div>
        </div>
        <div className="cs-line-massive slant-left">
          <div className="cs-ticker-fast reverse">
            {marqueeItems.map((text, i) => (
              <span key={`left-${i}`}>{text} <Asterisk size={32} /> </span>
            ))}
          </div>
        </div>
      </div>

      <div className="cs-center-content">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="cs-minimal-card"
        >
          <div className="cs-icon-custom-wrapper">
            <div className="cs-icon-gradient-border">
               <Construction size={38} strokeWidth={1.5} className="cs-icon-adaptive" />
            </div>
          </div>
          <div className="cs-badge-flat">
          </div>

          <div className="cs-text-compact">
            <h1 className="cs-title-small">{t('coming_soon.headline_top')}</h1>
            <p className="cs-desc-small">{t('coming_soon.construction_text')}</p>
          </div>

          <div className="cs-footer-compact">
            <Button onClick={() => navigate('/')} className="cs-btn-simple">
              <ArrowLeft size={18} />
              <span style={{ marginLeft: '10px' }}>{t('coming_soon.cta_back_home')}</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ComingSoon;