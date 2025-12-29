import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Zap, ArrowRight, Asterisk, Plus } from 'lucide-react';
import './About.css';

const About = () => {
  const { t } = useTranslation();

  return (
    <div className="about-page">
      {/* Background Decor - Chữ chạy ngầm cực lớn */}
      <div className="about-bg-text">IMPAKT</div>

      <div className="container">
        {/* --- HERO SECTION --- */}
        <section className="about-hero-section">
          <div className="hero-content-wrap">
            <div className="about-badge reveal">
              <Asterisk size={14} className="spin-icon" />
              <span>{t('about.badge')}</span>
            </div>
            <h1 className="about-headline gradient-text reveal">
              {t('about.headline')}
            </h1>
          </div>
          {/* Một đường kẻ dọc trang trí */}
          <div className="scroll-line"></div>
        </section>

        {/* --- MAIN STORY: Phá vỡ bố cục đối xứng --- */}
        <section className="about-story-section">
          <div className="story-wrapper">
            <div className="story-main-text reveal">
              <p className="highlight-text">{t('about.p1')}</p>
            </div>
            
            <div className="story-secondary-wrap">
               <div className="decor-plus"><Plus /></div>
               <div className="story-sub-text reveal">
                  <p>{t('about.p2')}</p>
                  <p>{t('about.p3')}</p>
                  
                  <div className="about-cta-wrapper">
                    <button className="about-btn-premium">
                      <span>{t('common.work_with_us', 'Hợp tác cùng chúng tôi')}</span>
                      <div className="btn-circle"><ArrowRight size={18} /></div>
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* --- VALUES: Hiệu ứng thẻ nổi --- */}
        <section className="about-values-section">
          <div className="values-floating-grid">
            <div className="value-premium-card reveal">
              <div className="card-number">01</div>
              <div className="value-icon-box">
                <ShieldCheck size={40} strokeWidth={1} />
              </div>
              <h3 className="value-title-sm">{t('about.transparency')}</h3>
              <p className="value-desc-sm">{t('about.transparencyText')}</p>
            </div>

            <div className="value-premium-card reveal delay-1">
              <div className="card-number">02</div>
              <div className="value-icon-box">
                <Zap size={40} strokeWidth={1} />
              </div>
              <h3 className="value-title-sm">{t('about.performance')}</h3>
              <p className="value-desc-sm">{t('about.performanceText')}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;