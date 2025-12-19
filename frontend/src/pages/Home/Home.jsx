import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Globe, Zap, ShieldCheck, Heart, LayoutTemplate, Server, Gauge, CheckCircle } from 'lucide-react';
import './Home.css';

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="home-container">
      {/* --- HERO SECTION (Giữ nguyên cấu trúc cũ của bạn) --- */}
      <section className="hero">
        <div className="container">
          <div className="hero-content fade-in">
            <div className="hero-badge">
              <span>{t('hero.badge')}</span>
            </div>
            <h1 className="hero-title">
              {t('hero.headline')} <br />
              <span className="gradient-text">{t('hero.impact')}</span>
            </h1>
            <p className="hero-description">
              {t('hero.subtext')}
            </p>
            <div className="hero-actions">
              <button className="btn-primary">
                Bắt đầu ngay <ArrowRight size={20} />
              </button>
              <button className="btn-secondary">
                Xem quy trình
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- SERVICES SECTION (Tập trung 1 dịch vụ toàn diện) --- */}
      <section className="services-preview">
        <div className="container">
          <div className="section-header fade-in">
            <h2 className="section-title">Thiết Kế & Vận Hành Website</h2>
            <p className="section-subtitle">Giải pháp hệ sinh thái số toàn diện cho doanh nghiệp của bạn</p>
          </div>
          
          <div className="featured-card fade-in">
             <div className="card-info">
                <div className="service-icon-box">
                    <Globe size={40} />
                </div>
                <h3>Giải pháp trọn gói</h3>
                <p>Chúng tôi lo mọi thứ từ tên miền, hạ tầng cho đến thiết kế giao diện độc bản và vận hành ổn định lâu dài.</p>
             </div>
             
             <div className="card-specs">
                <div className="spec-item">
                    <LayoutTemplate className="spec-icon" size={22} />
                    <span>Thiết kế UX/UI độc bản</span>
                </div>
                <div className="spec-item">
                    <Server className="spec-icon" size={22} />
                    <span>Tên miền & Hosting tốc độ cao</span>
                </div>
                <div className="spec-item">
                    <Gauge className="spec-icon" size={22} />
                    <span>Tối ưu vận hành & Bảo trì</span>
                </div>
                <div className="spec-item">
                    <CheckCircle className="spec-icon" size={22} />
                    <span>Sẵn sàng SEO & Marketing</span>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- WHY US SECTION --- */}
      <section className="why-us">
        <div className="container grid-2">
          <div className="why-text fade-in">
            <h2 className="section-title">{t('why.title')}</h2>
            <div className="why-features">
              <div className="feature-item">
                <Zap className="feature-icon" size={24} />
                <div>
                  <h4>{t('why.p1_title')}</h4>
                  <p>{t('why.p1_desc')}</p>
                </div>
              </div>
              <div className="feature-item">
                <ShieldCheck className="feature-icon" size={24} />
                <div>
                  <h4>{t('why.p2_title')}</h4>
                  <p>{t('why.p2_desc')}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="why-visual">
             <div className="abstract-shape"></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;