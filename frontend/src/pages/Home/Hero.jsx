import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-content">
          <div className="badge-gradient">{t('hero.badge')}</div>
          <h1 className="hero-title">
            {t('hero.headline')} <br />
            <span className="gradient-text">{t('hero.impact')}</span>
          </h1>
          <p className="hero-subtext">{t('hero.subtext')}</p>
          
          <div className="hero-actions">
            <button className="btn-gradient">
              {t('hero.cta')} <ArrowRight size={18} />
            </button>
            <button className="btn-outline">
              {t('hero.ctaSecondary')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;