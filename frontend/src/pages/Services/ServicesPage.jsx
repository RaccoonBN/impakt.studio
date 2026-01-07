import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Check, ArrowUpRight, Sparkles, User, Building2, ShoppingBag, Globe, Code2, LayoutTemplate, Rocket } from 'lucide-react';
import Button from '../../components/UI/Button';
import './ServicesPage.css';

const ServicesPage = () => {
  const { t } = useTranslation();
  const [hoveredStep, setHoveredStep] = useState(null);

  const getPackageIcon = (key) => {
    switch (key) {
      case 'starter': return <User size={22} />;
      case 'business': return <Building2 size={22} />;
      case 'commerce': return <ShoppingBag size={22} />;
      default: return <Globe size={22} />;
    }
  };

  const packages = useMemo(() => t('services.pricing.packages', { returnObjects: true }) || {}, [t]);
  const processSteps = useMemo(() => t('services.process.steps', { returnObjects: true }) || [], [t]);

  return (
    <div className="services-root">
      <div className="glow-container">
        <div className="glow-ball ball-1" />
        <div className="glow-ball ball-2" />
      </div>

      <div className="content-limit">
        
        {/* HERO SECTION */}
        <header className="services-hero">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="hero-badge">
            <span><Sparkles size={14} /> {t('services.badge')}</span>
          </motion.div>
          <h1 className="main-headline">{t('services.headline')}</h1>
          <p className="main-subline">{t('services.subline')}</p>
        </header>

        {/* FEATURED SERVICE (Nâng cấp giao diện) */}
        <section className="featured-service">
          <div className="service-card-large">
            <div className="service-visual-icons">
              <LayoutTemplate size={32} className="icon-float-1" />
              <Code2 size={40} className="icon-main" />
              <Rocket size={32} className="icon-float-2" />
            </div>
            <div className="service-info">
              <h2 className="section-title">{t('services.main_services.web.title')}</h2>
              <p className="service-desc">{t('services.main_services.web.desc')}</p>
            </div>
          </div>
        </section>

        {/* PROCESS SECTION */}
        <section className="process-section">
          <div className="section-intro">
            <span className="side-label">{t('services.process.badge')}</span>
            <h2 className="section-title">{t('services.process.headline')}</h2>
            <p className="section-desc">{t('services.process.subline')}</p>
          </div>

          <div className="process-grid">
            {processSteps.map((step, i) => (
              <div 
                key={i}
                className={`step-card ${hoveredStep === i ? 'focused' : ''} ${hoveredStep !== null && hoveredStep !== i ? 'dimmed' : ''}`}
                onMouseEnter={() => setHoveredStep(i)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                {/* Số thứ tự lớn làm nền */}
                <span className="step-number-bg">{i + 1}</span>
                
                <div className="step-content">
                  <div className="step-header">
                    <div className="step-icon-dot" />
                    <div className="step-line-connector" />
                  </div>
                  <h4 className="step-title">{step?.title}</h4>
                  <p className="step-text">{step?.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        {/* PRICING SECTION (Thu nhỏ lại) */}
        <section className="pricing-section">
          <div className="pricing-head">
            <h2 className="section-title">{t('services.pricing.headline')}</h2>
            <p className="section-desc">{t('services.pricing.subheadline')}</p>
          </div>

          <div className="pricing-grid">
            {Object.entries(packages).map(([key, pkg]) => {
              const isBusiness = key === 'business';
              return (
                <div key={key} className={`pricing-card ${isBusiness ? 'highlighted' : ''}`}>
                  {isBusiness && <div className="popular-badge">{pkg.badge}</div>}
                  
                  <div className="card-header">
                    <div className="icon-wrapper">{getPackageIcon(key)}</div>
                    <span className="pkg-name">{pkg?.name}</span>
                    <p className="pkg-desc">{pkg?.desc}</p>
                  </div>

                  <div className="price-box">
                    <span className="price-label">{pkg?.label_price}</span>
                    <h3 className="price-value">{pkg?.price}</h3>
                  </div>

                  <ul className="pkg-features">
                    {pkg?.features?.map((f, idx) => (
                      <li key={idx}>
                        <div className="check-circle"><Check size={12} strokeWidth={3} /></div>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="card-footer">
                    <Button variant={isBusiness ? 'primary' : 'outline'} className="btn-full">
                      {t('services.cta_short')} <ArrowUpRight size={18} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="services-footer">
          <p className="note-text">{t('services.pricing.pricing_note')}</p>
        </footer>
      </div>
    </div>
  );
};

export default ServicesPage;