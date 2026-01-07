import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, Globe, Send, Instagram, Facebook, CheckCircle } from 'lucide-react';
import Button from '../../components/UI/Button';
import './ContactPage.css';

const ContactPage = () => {
  const { t } = useTranslation();
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Giả lập gửi form trong 1.5 giây
    setTimeout(() => {
      setLoading(false);
      setIsSuccess(true);
    }, 1500);
  };

  return (
    <div className="contact-root">
      {/* Hiệu ứng nền Glow */}
      <div className="contact-glow ball-1" />
      <div className="contact-glow ball-2" />

      <div className="contact-container">
        {/* TIÊU ĐỀ TRANG */}
        <header className="contact-header">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="contact-badge"
          >
            {t('contact.badge')}
          </motion.span>
          <h1 className="contact-title">
            {t('contact.headline')}
          </h1>
          <p className="contact-desc-top">{t('contact.desc')}</p>
        </header>

        <div className="contact-grid">
          {/* CỘT TRÁI: THÔNG TIN KẾT NỐI ONLINE */}
          <div className="contact-info">
            <div className="info-card">
              <h3 className="info-main-title">{t('contact.info_title')}</h3>
              
              <div className="info-item">
                <div className="info-icon"><Mail size={22} /></div>
                <div className="info-text">
                  <span>{t('contact.form.label_email')}</span>
                  <p>hello@impakt.vn</p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon"><Phone size={22} /></div>
                <div className="info-text">
                  <span>{t('contact.form.label_phone')}</span>
                  <p>+84 123 456 789</p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon"><Globe size={22} /></div>
                <div className="info-text">
                  <span>{t('contact.info_online')}</span>
                  <p>Toàn cầu / Trực tuyến</p>
                </div>
              </div>

              <div className="social-connect-box">
                <h4>{t('contact.follow_us')}</h4>
                <div className="social-links">
                  <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-btn fb">
                    <Facebook size={22} />
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-btn ig">
                    <Instagram size={22} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: FORM LIÊN HỆ */}
          <div className="contact-form-wrapper">
            <AnimatePresence mode='wait'>
              {!isSuccess ? (
                <motion.form 
                  key="contact-form"
                  className="contact-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onSubmit={handleSubmit}
                >
                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('contact.form.label_name')}</label>
                      <input type="text" placeholder={t('contact.form.placeholder_name')} required />
                    </div>
                    <div className="form-group">
                      <label>{t('contact.form.label_phone')}</label>
                      <input type="tel" placeholder={t('contact.form.placeholder_phone')} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t('contact.form.label_email')}</label>
                    <input type="email" placeholder={t('contact.form.placeholder_email')} required />
                  </div>

                  <div className="form-group">
                    <label>{t('contact.form.label_type')}</label>
                    <div className="select-wrapper">
                      <select required defaultValue="">
                        <option value="" disabled>{t('contact.form.type_placeholder')}</option>
                        <option value="ca-nhan">{t('contact.form.type_personal')}</option>
                        <option value="doanh-nghiep">{t('contact.form.type_business')}</option>
                        <option value="ecommerce">{t('contact.form.type_ecommerce')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t('contact.form.label_msg')}</label>
                    <textarea 
                      rows="5" 
                      placeholder={t('contact.form.placeholder_msg')}
                      required
                    ></textarea>
                  </div>
                  
                  <Button variant="primary" className="btn-send" type="submit" disabled={loading}>
                    {loading ? t('contact.form.btn_sending') : t('contact.form.btn_send')} 
                    {!loading && <Send size={18} />}
                  </Button>
                </motion.form>
              ) : (
                <motion.div 
                  className="success-container"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <div className="success-icon-box">
                    <CheckCircle size={80} strokeWidth={1.5} />
                  </div>
                  <h3>{t('contact.form.success_title')}</h3>
                  <p>{t('contact.form.success_desc')}</p>
                  <Button variant="secondary" onClick={() => setIsSuccess(false)}>
                    {t('contact.form.btn_back')}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;