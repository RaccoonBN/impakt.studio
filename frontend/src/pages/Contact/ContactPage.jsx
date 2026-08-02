import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Facebook,
  Globe2,
  Instagram,
  Mail,
  MessageSquareText,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Button from '../../components/UI/Button';
import './ContactPage.css';

const CONTACT_EMAIL = 'impaktstudio.official@gmail.com';
const CONTACT_PHONE = '+84 889 379 983';
const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61585316609857';
const INSTAGRAM_URL = 'https://www.instagram.com/impaktstudio.official/';

const asArray = (value) => (Array.isArray(value) ? value : []);

const ContactPage = () => {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const assurances = useMemo(
    () => asArray(t('contact.assurances', { returnObjects: true })),
    [t],
  );

  const nextSteps = useMemo(
    () => asArray(t('contact.next_steps.items', { returnObjects: true })),
    [t],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setLoading(true);
    setErrorMessage('');

    const payload = {
      name: String(formData.get('name') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      projectType: String(formData.get('projectType') || '').trim(),
      message: String(formData.get('message') || '').trim(),
      company: String(formData.get('company') || '').trim(),
      locale:
        document.documentElement.lang ||
        navigator.language ||
        'vi-VN',
      sourceUrl: window.location.href,
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'CONTACT_SUBMIT_FAILED');
      }

      form.reset();
      setIsSuccess(true);
    } catch (error) {
      console.error('Contact form submission failed:', error);
      setErrorMessage(t('contact.form.error_send'));
    } finally {
      setLoading(false);
    }
  };

  const reveal = {
    initial: reduceMotion ? false : { opacity: 0, y: 20 },
    whileInView: reduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.18 },
    transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
  };

  return (
    <main className="cp-page">
      <div className="cp-background" aria-hidden="true">
        <motion.span
          className="cp-orb cp-orb-one"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, 28, 0], y: [0, 18, 0], scale: [1, 1.08, 1] }
          }
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="cp-orb cp-orb-two"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, -24, 0], y: [0, -20, 0], scale: [1, 1.06, 1] }
          }
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="cp-grid-pattern" />
      </div>

      <section className="cp-hero">
        <div className="cp-container">
          <motion.header
            className="cp-hero-copy"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.66, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="cp-eyebrow">
              <Sparkles size={15} />
              {t('contact.badge')}
            </span>

            <h1 className="cp-title">{t('contact.headline')}</h1>
            <p className="cp-description">{t('contact.desc')}</p>

            <div className="cp-assurance-list">
              {assurances.map((item, index) => {
                const icons = [MessageSquareText, Clock3, ShieldCheck];
                const Icon = icons[index % icons.length];

                return (
                  <motion.div
                    className="cp-assurance-item"
                    key={`assurance-${index}`}
                    initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.46,
                      delay: 0.2 + index * 0.08,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={reduceMotion ? undefined : { y: -3 }}
                  >
                    <span className="cp-assurance-icon">
                      <Icon size={17} />
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.desc}</small>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.header>

          <div className="cp-contact-grid">
            <motion.aside className="cp-info-panel" {...reveal}>
              <div className="cp-info-heading">
                <span className="cp-section-label">{t('contact.info_badge')}</span>
                <h2>{t('contact.info_title')}</h2>
                <p>{t('contact.info_desc')}</p>
              </div>

              <div className="cp-channel-list">
                <a className="cp-channel-item" href={`mailto:${CONTACT_EMAIL}`}>
                  <span className="cp-channel-icon">
                    <Mail size={20} />
                  </span>
                  <span className="cp-channel-copy">
                    <small>{t('contact.form.label_email')}</small>
                    <strong>{CONTACT_EMAIL}</strong>
                  </span>
                  <ArrowUpRight size={18} />
                </a>

                <a
                  className="cp-channel-item"
                  href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}
                >
                  <span className="cp-channel-icon">
                    <Phone size={20} />
                  </span>
                  <span className="cp-channel-copy">
                    <small>{t('contact.form.label_phone')}</small>
                    <strong>{CONTACT_PHONE}</strong>
                  </span>
                  <ArrowUpRight size={18} />
                </a>

                <div className="cp-channel-item cp-channel-static">
                  <span className="cp-channel-icon">
                    <Globe2 size={20} />
                  </span>
                  <span className="cp-channel-copy">
                    <small>{t('contact.info_online')}</small>
                    <strong>{t('contact.info_online_value')}</strong>
                  </span>
                  <BadgeCheck size={18} />
                </div>
              </div>

              <div className="cp-next-steps">
                <div className="cp-next-steps-heading">
                  <span>{t('contact.next_steps.badge')}</span>
                  <h3>{t('contact.next_steps.title')}</h3>
                </div>

                <div className="cp-next-step-list">
                  {nextSteps.map((step, index) => (
                    <div className="cp-next-step" key={`next-step-${index}`}>
                      <span className="cp-next-step-number">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <strong>{step.title}</strong>
                        <p>{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cp-social-row">
                <span>{t('contact.follow_us')}</span>
                <div className="cp-social-links">
                  <a
                    href={FACEBOOK_URL}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Facebook"
                  >
                    <Facebook size={19} />
                  </a>
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                  >
                    <Instagram size={19} />
                  </a>
                </div>
              </div>
            </motion.aside>

            <motion.section className="cp-form-panel" {...reveal}>
              <AnimatePresence mode="wait">
                {!isSuccess ? (
                  <motion.div
                    key="contact-form-state"
                    initial={reduceMotion ? false : { opacity: 0, x: 18 }}
                    animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.42 }}
                  >
                    <div className="cp-form-heading">
                      <span className="cp-section-label">
                        {t('contact.form_badge')}
                      </span>
                      <h2>{t('contact.form_title')}</h2>
                      <p>{t('contact.form_desc')}</p>
                    </div>

                    <form
                      className="cp-form"
                      onSubmit={handleSubmit}
                      aria-busy={loading}
                    >
                      <div className="cp-honeypot" aria-hidden="true">
                        <label htmlFor="contact-company">Company</label>
                        <input
                          id="contact-company"
                          name="company"
                          type="text"
                          tabIndex="-1"
                          autoComplete="off"
                        />
                      </div>
                      <div className="cp-form-row">
                        <div className="cp-form-group">
                          <label htmlFor="contact-name">
                            {t('contact.form.label_name')}
                          </label>
                          <input
                            id="contact-name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            placeholder={t('contact.form.placeholder_name')}
                            required
                          />
                        </div>

                        <div className="cp-form-group">
                          <label htmlFor="contact-phone">
                            {t('contact.form.label_phone')}
                          </label>
                          <input
                            id="contact-phone"
                            name="phone"
                            type="tel"
                            autoComplete="tel"
                            placeholder={t('contact.form.placeholder_phone')}
                            required
                          />
                        </div>
                      </div>

                      <div className="cp-form-row">
                        <div className="cp-form-group">
                          <label htmlFor="contact-email">
                            {t('contact.form.label_email')}
                          </label>
                          <input
                            id="contact-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder={t('contact.form.placeholder_email')}
                            required
                          />
                        </div>

                        <div className="cp-form-group">
                          <label htmlFor="contact-type">
                            {t('contact.form.label_type')}
                          </label>
                          <div className="cp-select-wrapper">
                            <select
                              id="contact-type"
                              name="projectType"
                              defaultValue=""
                              required
                            >
                              <option value="" disabled>
                                {t('contact.form.type_placeholder')}
                              </option>
                              <option value="personal">
                                {t('contact.form.type_personal')}
                              </option>
                              <option value="business">
                                {t('contact.form.type_business')}
                              </option>
                              <option value="ecommerce">
                                {t('contact.form.type_ecommerce')}
                              </option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="cp-form-group">
                        <label htmlFor="contact-message">
                          {t('contact.form.label_msg')}
                        </label>
                        <textarea
                          id="contact-message"
                          name="message"
                          rows="5"
                          placeholder={t('contact.form.placeholder_msg')}
                          required
                        />
                      </div>

                      {errorMessage && (
                        <div
                          className="cp-form-error"
                          role="alert"
                          aria-live="assertive"
                        >
                          <AlertCircle size={18} />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      <div className="cp-form-footer">
                        <p>
                          <ShieldCheck size={17} />
                          {t('contact.form.privacy_note')}
                        </p>

                        <Button
                          variant="primary"
                          className="cp-submit-button"
                          type="submit"
                          disabled={loading}
                        >
                          {loading
                            ? t('contact.form.btn_sending')
                            : t('contact.form.btn_send')}
                          {!loading && <Send size={18} />}
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    className="cp-success-state"
                    key="contact-success-state"
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
                    animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                    transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
                    aria-live="polite"
                  >
                    <motion.div
                      className="cp-success-icon"
                      initial={reduceMotion ? false : { scale: 0.6, rotate: -8 }}
                      animate={reduceMotion ? undefined : { scale: 1, rotate: 0 }}
                      transition={{
                        duration: 0.5,
                        ease: [0.34, 1.56, 0.64, 1],
                      }}
                    >
                      <CheckCircle2 size={58} strokeWidth={1.6} />
                    </motion.div>

                    <span className="cp-section-label">
                      {t('contact.form.success_badge')}
                    </span>
                    <h2>{t('contact.form.success_title')}</h2>
                    <p>{t('contact.form.success_desc')}</p>

                    <Button
                      variant="secondary"
                      onClick={() => {
                        setIsSuccess(false);
                        setErrorMessage('');
                      }}
                    >
                      {t('contact.form.btn_back')}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ContactPage;