import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom'; // 1. Import Link
import { Check, User, Building2, ShoppingBag, ArrowRight } from 'lucide-react';
import Button from '../../components/UI/Button';
import './Service.css';

const Service = () => {
  const { t } = useTranslation();

  const packages = [
    { key: 'starter', icon: <User size={32} /> },
    { key: 'business', icon: <Building2 size={32} /> },
    { key: 'commerce', icon: <ShoppingBag size={32} /> }
  ];

  return (
    <section className="services-section">
      <div className="container">
        <div className="section-header reveal">
          <h2 className="section-title">{t('services_home.headline')}</h2>
          <p className="section-subtitle">{t('services_home.subheadline')}</p>
        </div>

        <div className="pricing-grid">
          {packages.map((pkg, index) => (
            <div 
              key={pkg.key} 
              className={`pricing-card reveal delay-${index + 1} ${pkg.key === 'business' ? 'highlighted' : ''}`}
            >
              {pkg.key === 'business' && (
                <div className="popular-badge">{t(`services_home.packages.${pkg.key}.badge`)}</div>
              )}

              <div className="card-header">
                <div className="icon-wrapper">
                  {pkg.icon}
                </div>
                <h3 className="pkg-name">{t(`services_home.packages.${pkg.key}.name`)}</h3>
                <p className="pkg-desc">{t(`services_home.packages.${pkg.key}.desc`)}</p>
              </div>

              <div className="price-box">
                <span className="price-label">{t(`services_home.packages.${pkg.key}.label_price`)}</span>
                <div className="price-value">{t(`services_home.packages.${pkg.key}.price`)}</div>
              </div>

              <ul className="pkg-features">
                {t(`services_home.packages.${pkg.key}.features`, { returnObjects: true }).map((feature, i) => (
                  <li key={i}>
                    <div className="check-circle">
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="card-footer">
                {/* 2. Bao bọc Button bằng Link trỏ đến trang /services */}
                <Link to="/services" className="btn-full-link">
                  <Button 
                    variant={pkg.key === 'business' ? 'primary' : 'secondary'} 
                    className="btn-full"
                  >
                    {t('services_home.cta_view_details')} <ArrowRight size={18} />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Service;