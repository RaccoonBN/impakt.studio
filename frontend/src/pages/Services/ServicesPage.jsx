import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  Code2,
  FileText,
  Fingerprint,
  Gauge,
  Layers3,
  LayoutTemplate,
  MessageSquareText,
  PackageCheck,
  Palette,
  Rocket,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
  Wrench,
} from 'lucide-react';
import Button from '../../components/UI/Button';
import './ServicesPage.css';

const CONTACT_PATH = '/contact';
const PACKAGE_KEYS = ['starter', 'business', 'commerce'];

const packageIcons = {
  starter: User,
  business: Building2,
  commerce: ShoppingBag,
};

const processIcons = [
  MessageSquareText,
  Search,
  LayoutTemplate,
  Code2,
  Gauge,
  Rocket,
];

const asArray = (value) => (Array.isArray(value) ? value : []);
const asObject = (value) => (
  value && typeof value === 'object' && !Array.isArray(value) ? value : {}
);

const ServicesPage = () => {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [activePackageKey, setActivePackageKey] = useState('business');

  const packages = useMemo(
    () =>
      PACKAGE_KEYS.map((key) => ({
        key,
        ...asObject(t(`services.packages.items.${key}`, { returnObjects: true })),
      })),
    [t],
  );

  const activePackage =
    packages.find((pkg) => pkg.key === activePackageKey) || packages[0] || {};

  const ActivePackageIcon =
    packageIcons[activePackage.key] || Building2;

  const activeDeliverables = asArray(activePackage.deliverables);
  const activeFeatures = asArray(activePackage.features);
  const activeExtensions = asArray(activePackage.extensions);

  const commonIncluded = useMemo(
    () => asArray(t('services.packages.common_included.items', { returnObjects: true })),
    [t],
  );

  const processSteps = useMemo(
    () => asArray(t('services.process.steps', { returnObjects: true })),
    [t],
  );

  const heroPrinciples = useMemo(
    () => asArray(t('services.hero.principles', { returnObjects: true })),
    [t],
  );

  const heroFlow = useMemo(
    () => asArray(t('services.hero.flow', { returnObjects: true })),
    [t],
  );

  const reveal = {
    initial: reduceMotion ? false : { opacity: 0, y: 22 },
    whileInView: reduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.16 },
    transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
  };

  const heroContainerMotion = reduceMotion
    ? {}
    : {
        initial: 'hidden',
        animate: 'visible',
        variants: {
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.1, delayChildren: 0.08 },
          },
        },
      };

  const heroItemMotion = reduceMotion
    ? {}
    : {
        variants: {
          hidden: { opacity: 0, y: 24 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] },
          },
        },
      };

  const principleIcons = [Fingerprint, Palette, Layers3];

  return (
    <main className="services-page">
      <div className="sp-background" aria-hidden="true">
        <span className="sp-orb sp-orb-one" />
        <span className="sp-orb sp-orb-two" />
        <span className="sp-grid-pattern" />
      </div>

      <section className="sp-hero">
        <div className="sp-container sp-hero-inner">
          <motion.div className="sp-hero-copy" {...heroContainerMotion}>
            <motion.span className="sp-eyebrow" {...heroItemMotion}>
              <Sparkles size={15} />
              {t('services.badge')}
            </motion.span>

            <motion.h1 className="sp-hero-title" {...heroItemMotion}>
              {t('services.headline')}
            </motion.h1>

            <motion.p className="sp-hero-description" {...heroItemMotion}>
              {t('services.subline')}
            </motion.p>

            <div className="sp-hero-principles">
              {heroPrinciples.map((item, index) => {
                const PrincipleIcon = principleIcons[index % principleIcons.length];

                return (
                  <motion.div
                    className="sp-hero-principle"
                    key={`hero-principle-${index}`}
                    {...heroItemMotion}
                    whileHover={reduceMotion ? undefined : { y: -4 }}
                  >
                    <span className="sp-principle-icon">
                      <PrincipleIcon size={18} />
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div className="sp-hero-actions" {...heroItemMotion}>
              <a href="#service-packages" className="sp-button-link">
                <Button variant="primary" className="sp-primary-button">
                  {t('services.hero.view_packages')}
                  <ArrowRight size={18} />
                </Button>
              </a>

              <a href="#working-process" className="sp-text-link">
                {t('services.hero.view_process')}
                <ArrowRight size={17} />
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            className="sp-hero-visual"
            initial={reduceMotion ? false : { opacity: 0, x: 44, scale: 0.96 }}
            animate={reduceMotion ? undefined : { opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span
              className="sp-visual-glow"
              aria-hidden="true"
              animate={reduceMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.52, 0.72, 0.52] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            <motion.span
              className="sp-glass-ring sp-glass-ring-one"
              aria-hidden="true"
              animate={reduceMotion ? undefined : { rotate: 360, scale: [1, 1.04, 1] }}
              transition={{
                rotate: { duration: 28, repeat: Infinity, ease: 'linear' },
                scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
              }}
            />

            <motion.span
              className="sp-glass-ring sp-glass-ring-two"
              aria-hidden="true"
              animate={reduceMotion ? undefined : { rotate: -360, opacity: [0.42, 0.72, 0.42] }}
              transition={{
                rotate: { duration: 34, repeat: Infinity, ease: 'linear' },
                opacity: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' },
              }}
            />

            <motion.span
              className="sp-glass-shard sp-glass-shard-one"
              aria-hidden="true"
              animate={reduceMotion ? undefined : { x: [0, 10, 0], y: [0, -12, 0], rotate: [8, 13, 8] }}
              transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut' }}
            />

            <motion.span
              className="sp-glass-shard sp-glass-shard-two"
              aria-hidden="true"
              animate={reduceMotion ? undefined : { x: [0, -8, 0], y: [0, 10, 0], rotate: [-12, -7, -12] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            />

            <motion.div
              className="sp-floating-note sp-floating-note-one"
              animate={reduceMotion ? undefined : { y: [0, -9, 0], rotate: [-2, 0, -2] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <CheckCircle2 size={16} />
              {t('services.hero.floating_primary')}
            </motion.div>

            <motion.div
              className="sp-floating-note sp-floating-note-two"
              animate={reduceMotion ? undefined : { y: [0, 8, 0], rotate: [2, 0, 2] }}
              transition={{ duration: 5.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Fingerprint size={16} />
              {t('services.hero.floating_secondary')}
            </motion.div>

            <motion.div
              className="sp-brand-card"
              whileHover={reduceMotion ? undefined : { y: -5, rotateX: 1.5, rotateY: -1.5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="sp-brand-card-header">
                <span className="sp-brand-card-badge">
                  <Sparkles size={14} />
                  {t('services.hero.visual_badge')}
                </span>
                <span className="sp-brand-card-status">
                  {t('services.hero.visual_status')}
                </span>
              </div>

              <h2>{t('services.hero.visual_title')}</h2>
              <p className="sp-brand-card-description">
                {t('services.hero.visual_desc')}
              </p>

              <div className="sp-brand-flow">
                {heroFlow.map((step, index) => (
                  <motion.div
                    className="sp-brand-flow-item"
                    key={`hero-flow-${index}`}
                    initial={reduceMotion ? false : { opacity: 0, x: 18 }}
                    animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.46,
                      delay: 0.42 + index * 0.09,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={reduceMotion ? undefined : { x: 5 }}
                  >
                    <span className="sp-brand-flow-number">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <strong>{step.title}</strong>
                      <small>{step.desc}</small>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="sp-brand-card-footer">
                <Fingerprint size={20} />
                <span>{t('services.hero.visual_note')}</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="sp-section sp-packages-section" id="service-packages">
        <div className="sp-container sp-service-container">
          <motion.div className="sp-section-heading" {...reveal}>
            <span className="sp-section-label">{t('services.packages.badge')}</span>
            <h2>{t('services.packages.headline')}</h2>
            <p>{t('services.packages.subline')}</p>
          </motion.div>

          <div
            className="sp-service-tabs"
            role="tablist"
            aria-label={t('services.packages.nav_aria')}
          >
            {packages.map((pkg, index) => {
              const Icon = packageIcons[pkg.key] || Building2;
              const isActive = pkg.key === activePackage.key;

              return (
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`service-panel-${pkg.key}`}
                  className={`sp-service-tab ${isActive ? 'is-active' : ''}`}
                  key={pkg.key}
                  onClick={() => setActivePackageKey(pkg.key)}
                >
                  <span className="sp-service-tab-icon">
                    <Icon size={20} />
                  </span>

                  <span className="sp-service-tab-content">
                    <small>
                      {t('services.packages.package_label')}{' '}
                      {String(index + 1).padStart(2, '0')}
                    </small>
                    <strong>{pkg.name}</strong>
                    <em>{pkg.price}</em>
                  </span>

                  {pkg.featured && (
                    <span className="sp-service-tab-badge">{pkg.badge}</span>
                  )}
                </button>
              );
            })}
          </div>

          {activePackage.key && (
            <motion.article
              id={`service-panel-${activePackage.key}`}
              className={`sp-service-panel ${activePackage.featured ? 'is-featured' : ''}`}
              role="tabpanel"
              key={activePackage.key}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            >
              <header className="sp-service-panel-header">
                <div className="sp-service-identity">
                  <span className="sp-service-main-icon">
                    <ActivePackageIcon size={26} />
                  </span>

                  <div>
                    <span className="sp-service-index">
                      {t('services.packages.package_label')}{' '}
                      {String(PACKAGE_KEYS.indexOf(activePackage.key) + 1).padStart(2, '0')}
                    </span>
                    <h3>{activePackage.name}</h3>
                  </div>
                </div>

                <p className="sp-service-summary">{activePackage.summary}</p>

                <div className="sp-service-price">
                  <span>{t('services.packages.labels.price')}</span>
                  <strong>{activePackage.price}</strong>
                </div>
              </header>

              <div className="sp-service-meta">
                <div className="sp-service-meta-item">
                  <BadgeCheck size={19} />
                  <div>
                    <span>{t('services.packages.labels.best_for')}</span>
                    <strong>{activePackage.best_for}</strong>
                  </div>
                </div>

                <div className="sp-service-meta-item">
                  <Clock3 size={19} />
                  <div>
                    <span>{t('services.packages.labels.timeline')}</span>
                    <strong>{activePackage.timeline}</strong>
                  </div>
                </div>
              </div>

              <div className="sp-service-detail-grid">
                <section className="sp-service-detail-card">
                  <div className="sp-service-card-heading">
                    <PackageCheck size={21} />
                    <div>
                      <span>{t('services.packages.labels.deliverables_eyebrow')}</span>
                      <h4>{t('services.packages.labels.deliverables')}</h4>
                    </div>
                  </div>

                  <ul className="sp-service-list">
                    {activeDeliverables.map((item, index) => (
                      <li key={`deliverable-${activePackage.key}-${index}`}>
                        <CheckCircle2 size={17} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="sp-service-detail-card">
                  <div className="sp-service-card-heading">
                    <Wrench size={21} />
                    <div>
                      <span>{t('services.packages.labels.features_eyebrow')}</span>
                      <h4>{t('services.packages.labels.features')}</h4>
                    </div>
                  </div>

                  <ul className="sp-service-list">
                    {activeFeatures.map((item, index) => (
                      <li key={`feature-${activePackage.key}-${index}`}>
                        <Check size={17} strokeWidth={2.7} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <div className="sp-service-lower-grid">
                <section className="sp-service-extension-card">
                  <span className="sp-service-small-label">
                    {t('services.packages.labels.extensions')}
                  </span>

                  <div className="sp-service-extension-list">
                    {activeExtensions.map((item, index) => (
                      <span key={`extension-${activePackage.key}-${index}`}>
                        {item}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="sp-service-result-card">
                  <Rocket size={21} />
                  <div>
                    <span>{t('services.packages.labels.result')}</span>
                    <strong>{activePackage.result}</strong>
                  </div>
                </section>
              </div>

              <footer className="sp-service-panel-footer">
                <div className="sp-service-note">
                  <FileText size={18} />
                  <p>{activePackage.note}</p>
                </div>

                <Link to={CONTACT_PATH} className="sp-button-link">
                  <Button
                    variant={activePackage.featured ? 'primary' : 'outline'}
                    className="sp-service-button"
                  >
                    {t('services.packages.select_button')}
                    <ArrowRight size={17} />
                  </Button>
                </Link>
              </footer>
            </motion.article>
          )}

          <motion.div className="sp-service-included" {...reveal}>
            <div className="sp-service-included-heading">
              <ShieldCheck size={24} />
              <div>
                <span>{t('services.packages.common_included.badge')}</span>
                <h3>{t('services.packages.common_included.headline')}</h3>
              </div>
            </div>

            <div className="sp-service-included-grid">
              {commonIncluded.map((item, index) => (
                <span key={`included-${index}`}>
                  <CheckCircle2 size={16} />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="sp-section sp-process-section" id="working-process">
        <div className="sp-container">
          <div className="sp-process-intro">
            <motion.div className="sp-section-heading sp-process-heading" {...reveal}>
              <span className="sp-section-label">{t('services.process.badge')}</span>
              <h2>{t('services.process.headline')}</h2>
              <p>{t('services.process.subline')}</p>
            </motion.div>

            <motion.div
              className="sp-process-abstract"
              aria-hidden="true"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.94, x: 24 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="sp-process-abstract-glow" />
              <span className="sp-process-orbit sp-process-orbit-one" />
              <span className="sp-process-orbit sp-process-orbit-two" />
              <span className="sp-process-axis sp-process-axis-horizontal" />
              <span className="sp-process-axis sp-process-axis-vertical" />

              <motion.div
                className="sp-process-core"
                animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Layers3 size={25} />
                <strong>{String(processSteps.length).padStart(2, '0')}</strong>
                <small>{t('services.process.badge')}</small>
              </motion.div>

              <motion.span
                className="sp-process-node sp-process-node-one"
                animate={reduceMotion ? undefined : { y: [0, -8, 0], rotate: [-4, 2, -4] }}
                transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <MessageSquareText size={19} />
                <b>01</b>
              </motion.span>

              <motion.span
                className="sp-process-node sp-process-node-two"
                animate={reduceMotion ? undefined : { x: [0, 7, 0], y: [0, 5, 0] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Code2 size={19} />
                <b>04</b>
              </motion.span>

              <motion.span
                className="sp-process-node sp-process-node-three"
                animate={reduceMotion ? undefined : { y: [0, 8, 0], rotate: [3, -2, 3] }}
                transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Rocket size={19} />
                <b>06</b>
              </motion.span>

              <span className="sp-process-pill sp-process-pill-one">
                <CheckCircle2 size={14} />
                UI/UX
              </span>
              <span className="sp-process-pill sp-process-pill-two">
                <Gauge size={14} />
                QA
              </span>
            </motion.div>
          </div>

          <div className="sp-process-list">
            {processSteps.map((step, index) => {
              const Icon = processIcons[index % processIcons.length];

              return (
                <motion.article
                  className="sp-process-card"
                  key={`process-${index}`}
                  {...reveal}
                  transition={{ ...reveal.transition, delay: index * 0.035 }}
                >
                  <div className="sp-process-number">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <div className="sp-process-icon">
                    <Icon size={22} />
                  </div>

                  <div className="sp-process-copy">
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>

                  <div className="sp-process-detail">
                    <div>
                      <span>{t('services.process.output_label')}</span>
                      <strong>{step.output}</strong>
                    </div>
                    <div>
                      <span>{t('services.process.client_label')}</span>
                      <strong>{step.client_action}</strong>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <motion.div className="sp-process-note" {...reveal}>
            <FileText size={21} />
            <p>{t('services.process.note')}</p>
          </motion.div>
        </div>
      </section>

      <section className="sp-final-cta">
        <motion.div className="sp-container" {...reveal}>
          <div className="sp-cta-card">
            <div className="sp-cta-copy">
              <span className="sp-section-label">{t('services.final_cta.badge')}</span>
              <h2>{t('services.final_cta.headline')}</h2>
              <p>{t('services.final_cta.subline')}</p>
            </div>

            <Link to={CONTACT_PATH} className="sp-button-link">
              <Button variant="primary" className="sp-cta-button">
                {t('services.final_cta.button')}
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
};

export default ServicesPage;