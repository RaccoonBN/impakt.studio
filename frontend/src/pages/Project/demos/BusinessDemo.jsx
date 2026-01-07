import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Check, Shield, Zap, BarChart, ArrowRight, Play, Star } from 'lucide-react';
import './BusinessDemo.css';

const BusinessDemo = () => {
  const { t } = useTranslation();

  return (
    <div className="bd-root">
      {/* HEADER */}
      <header className="bd-header">
        <div className="bd-logo-container">
          <div className="bd-logo-icon"></div>
          <span className="bd-logo-text">BIZFLOW</span>
        </div>
        <nav className="bd-nav-desktop">
          <a href="#features">Tính năng</a>
          <a href="#pricing">Bảng giá</a>
          <a href="#about">Về chúng tôi</a>
        </nav>
        <div className="bd-auth-btns">
          <button className="bd-btn-ghost">Đăng nhập</button>
          <button className="bd-btn-primary">{t('projects.demo_business.cta')}</button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="bd-hero">
        <motion.div 
          className="bd-hero-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bd-tag">
            <Star size={14} fill="currentColor" />
            <span>Nền tảng quản trị số 1 năm 2026</span>
          </div>
          <h1 className="bd-hero-title">
            {t('projects.demo_business.headline')}
          </h1>
          <p className="bd-hero-subtitle">
            Hợp nhất quy trình làm việc, dữ liệu và đội ngũ của bạn trên một nền tảng duy nhất. Tăng 40% hiệu suất ngay trong tháng đầu tiên.
          </p>
          <div className="bd-hero-actions">
            <button className="bd-btn-lg-primary">Bắt đầu miễn phí <ArrowRight size={18} /></button>
            <button className="bd-btn-lg-outline"><Play size={18} fill="currentColor" /> Xem demo</button>
          </div>
          <div className="bd-hero-stats">
            <div><b>10k+</b> <span>Doanh nghiệp tin dùng</span></div>
            <div className="bd-divider"></div>
            <div><b>99.9%</b> <span>Thời gian hoạt động</span></div>
          </div>
        </motion.div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="bd-features">
        <div className="bd-section-header">
          <span className="bd-sub">{t('projects.filter_business')}</span>
          <h2>Giải pháp toàn diện cho mọi thách thức</h2>
        </div>

        <div className="bd-features-grid">
          {[
            { icon: <Zap color="#4f46e5" />, title: t('projects.demo_business.feature_1'), desc: 'Xử lý hàng triệu yêu cầu mỗi giây với độ trễ gần như bằng không.' },
            { icon: <Shield color="#4f46e5" />, title: t('projects.demo_business.feature_2'), desc: 'Mã hóa đầu cuối chuẩn quân đội, đảm bảo an toàn tuyệt đối cho dữ liệu.' },
            { icon: <BarChart color="#4f46e5" />, title: t('projects.demo_business.feature_3'), desc: 'Tự động hóa báo cáo và phân tích xu hướng kinh doanh bằng AI.' }
          ].map((f, i) => (
            <motion.div 
              key={i} 
              className="bd-feature-card"
              whileHover={{ y: -5 }}
            >
              <div className="bd-f-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <ul className="bd-f-list">
                <li><Check size={14} /> Cập nhật thời gian thực</li>
                <li><Check size={14} /> Tích hợp đa nền tảng</li>
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bd-footer">
        <div className="bd-footer-top">
          <div className="bd-footer-brand">
            <span className="bd-logo-text">BIZFLOW</span>
            <p>Đơn giản hóa quản trị doanh nghiệp trong kỷ nguyên số.</p>
          </div>
          <div className="bd-footer-links">
            <div className="bd-f-col">
              <h4>Sản phẩm</h4>
              <a href="#">Tính năng</a>
              <a href="#">Tích hợp</a>
            </div>
            <div className="bd-f-col">
              <h4>Công ty</h4>
              <a href="#">Về chúng tôi</a>
              <a href="#">Tuyển dụng</a>
            </div>
          </div>
        </div>
        <div className="bd-footer-bottom">
          <p>© 2026 BIZFLOW SaaS Tech. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default BusinessDemo;