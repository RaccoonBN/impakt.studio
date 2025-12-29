import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import Button from '../../components/UI/Button'; // Import component mới
import './Hero.css';

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="hero">
      <div className="container hero-content fade-in">
        <div className="hero-badge"><span>{t('hero.badge')}</span></div>
        <h1 className="hero-title">
          {t('hero.headline')} <br />
          <span className="gradient-text">{t('hero.impact')}</span>
        </h1>
        <p className="hero-description">{t('hero.subtext')}</p>
        
        <div className="hero-actions">
          {/* Sử dụng Component Button đa năng */}
          <Button variant="primary">
            {t('hero.cta')} <ArrowRight size={20} />
          </Button>

          <Button variant="secondary">
            {t('hero.ctaSecondary')}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;