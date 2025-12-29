import React from 'react';
import { useTranslation } from 'react-i18next';
import { Fingerprint, Zap, Layers, Asterisk } from 'lucide-react';
import './WhyUs.css';

const WhyUs = () => {
  const { t } = useTranslation();

  const reasons = [
    { key: 'p1', icon: <Fingerprint size={36} strokeWidth={1.2} /> },
    { key: 'p2', icon: <Zap size={36} strokeWidth={1.2} /> },
    { key: 'p3', icon: <Layers size={36} strokeWidth={1.2} /> }
  ];

  const benefits = t('why.benefits', { returnObjects: true });
  
  // Tạo một mảng nhân bản (ví dụ nhân 6 lần) để đảm bảo độ dài cực lớn, 
  // lấp đầy mọi màn hình Desktop lớn nhất mà không bị hụt.
  const marqueeItems = Array(6).fill(benefits).flat();

  return (
    <section className="impakt-why-section">
      <div className="container">
        <div className="why-header reveal">
          <h2 className="why-title-main why-gradient-text">{t('why.title')}</h2>
          <p className="why-subtitle">{t('why.subheadline')}</p>
        </div>

        <div className="why-adaptive-grid">
          {reasons.map((item, index) => (
            <div key={index} className="why-glass-card reveal">
              <div className="why-icon-wrap">{item.icon}</div>
              <h3 className="why-card-title">{t(`why.${item.key}_title`)}</h3>
              <p className="why-card-desc">{t(`why.${item.key}_desc`)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee Wrapper */}
      <div className="why-marquee-bar">
        <div className="why-marquee-track">
          {marqueeItems.map((benefit, i) => (
            <div key={i} className="why-marquee-pill">
              <Asterisk size={14} className="why-star" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyUs;