import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Cookie,
  Database,
  FileText,
  Globe2,
  LockKeyhole,
  Mail,
  Printer,
  Scale,
  Server,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import './PrivacyPolicyPage.css';

const CONTACT_EMAIL = 'hello@impakt.vn';

const SECTION_ICONS = {
  introduction: FileText,
  data_collection: Database,
  collection_methods: Server,
  purposes: UserCheck,
  sharing: Users,
  cookies_analytics: Cookie,
  retention_security: LockKeyhole,
  user_rights: ShieldCheck,
  cross_border: Globe2,
  children: Users,
  legal_basis: Scale,
  updates_contact: Mail,
};

const SUMMARY_ICONS = [Database, ShieldCheck, UserCheck];

const asArray = (value) => (Array.isArray(value) ? value : []);

const PrivacyPolicyPage = () => {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [activeSectionId, setActiveSectionId] = useState('introduction');

  const summaries = useMemo(
    () => asArray(t('privacy.summary.items', { returnObjects: true })),
    [t],
  );

  const sections = useMemo(
    () => asArray(t('privacy.sections', { returnObjects: true })),
    [t],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const sectionElements = sections
      .map((section) => document.getElementById(`privacy-${section.id}`))
      .filter(Boolean);

    if (!sectionElements.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries[0]) {
          setActiveSectionId(
            visibleEntries[0].target.id.replace('privacy-', ''),
          );
        }
      },
      {
        rootMargin: '-18% 0px -64% 0px',
        threshold: [0.08, 0.2, 0.45],
      },
    );

    sectionElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [sections]);

  const handlePrint = () => {
    window.print();
  };

  const reveal = {
    initial: reduceMotion ? false : { opacity: 0, y: 20 },
    whileInView: reduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.12 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  };

  return (
    <main className="privacy-page">
      <div className="privacy-background" aria-hidden="true">
        <motion.span
          className="privacy-orb privacy-orb-one"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, 22, 0], y: [0, 16, 0], scale: [1, 1.06, 1] }
          }
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.span
          className="privacy-orb privacy-orb-two"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, -20, 0], y: [0, -18, 0], scale: [1, 1.05, 1] }
          }
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />

        <span className="privacy-grid-pattern" />
      </div>

      <section className="privacy-hero">
        <div className="privacy-container">
          <motion.header
            className="privacy-header"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.66, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="privacy-eyebrow">
              <Sparkles size={15} />
              {t('privacy.badge')}
            </span>

            <h1>{t('privacy.headline')}</h1>
            <p>{t('privacy.desc')}</p>

            <div className="privacy-meta-row">
              <span>
                <Clock3 size={16} />
                {t('privacy.last_updated')}
              </span>

              <span>
                <Scale size={16} />
                {t('privacy.jurisdiction')}
              </span>

              <button type="button" onClick={handlePrint}>
                <Printer size={16} />
                {t('privacy.print_button')}
              </button>
            </div>
          </motion.header>

          <motion.section className="privacy-summary" {...reveal}>
            <div className="privacy-summary-heading">
              <span>{t('privacy.summary.badge')}</span>
              <h2>{t('privacy.summary.title')}</h2>
              <p>{t('privacy.summary.desc')}</p>
            </div>

            <div className="privacy-summary-grid">
              {summaries.map((item, index) => {
                const Icon = SUMMARY_ICONS[index % SUMMARY_ICONS.length];

                return (
                  <article key={`privacy-summary-${index}`}>
                    <span className="privacy-summary-icon">
                      <Icon size={21} />
                    </span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.desc}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </motion.section>

          <div className="privacy-layout">
            <motion.aside className="privacy-toc" {...reveal}>
              <div className="privacy-toc-heading">
                <span className="privacy-toc-label">
                  {t('privacy.toc_label')}
                </span>
                <span className="privacy-toc-count">{sections.length}</span>
              </div>

              <nav aria-label={t('privacy.toc_label')}>
                {sections.map((section, index) => {
                  const Icon = SECTION_ICONS[section.id] || FileText;

                  return (
                    <a
                      href={`#privacy-${section.id}`}
                      key={section.id}
                      className={
                        activeSectionId === section.id ? 'is-active' : ''
                      }
                      onClick={() => setActiveSectionId(section.id)}
                      aria-current={
                        activeSectionId === section.id ? 'location' : undefined
                      }
                    >
                      <span className="privacy-toc-icon">
                        <Icon size={17} />
                      </span>

                      <span>
                        <small>{String(index + 1).padStart(2, '0')}</small>
                        <strong>{section.title}</strong>
                      </span>
                    </a>
                  );
                })}
              </nav>

              <div className="privacy-toc-note">
                <ShieldCheck size={20} />
                <p>{t('privacy.toc_note')}</p>
              </div>
            </motion.aside>

            <section className="privacy-content">
              {sections.map((section, index) => {
                const Icon = SECTION_ICONS[section.id] || FileText;
                const paragraphs = asArray(section.paragraphs);
                const bullets = asArray(section.bullets);
                const notes = asArray(section.notes);

                return (
                  <motion.article
                    className="privacy-section-card"
                    id={`privacy-${section.id}`}
                    key={section.id}
                    {...reveal}
                    transition={{
                      ...reveal.transition,
                      delay: index * 0.025,
                    }}
                  >
                    <header className="privacy-section-header">
                      <span className="privacy-section-number">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <span className="privacy-section-icon">
                        <Icon size={22} />
                      </span>

                      <div>
                        <small>{section.eyebrow}</small>
                        <h2>{section.title}</h2>
                      </div>
                    </header>

                    <div className="privacy-section-body">
                      {paragraphs.map((paragraph, paragraphIndex) => (
                        <p key={`${section.id}-paragraph-${paragraphIndex}`}>
                          {paragraph}
                        </p>
                      ))}

                      {bullets.length > 0 && (
                        <ul>
                          {bullets.map((bullet, bulletIndex) => (
                            <li key={`${section.id}-bullet-${bulletIndex}`}>
                              <CheckCircle2 size={17} />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {notes.length > 0 && (
                        <div className="privacy-note-list">
                          {notes.map((note, noteIndex) => (
                            <div
                              className="privacy-note"
                              key={`${section.id}-note-${noteIndex}`}
                            >
                              <BarChart3 size={18} />
                              <p>{note}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {section.id === 'updates_contact' && (
                        <a
                          className="privacy-contact-link"
                          href={`mailto:${CONTACT_EMAIL}`}
                        >
                          <Mail size={18} />
                          <span>
                            <small>{t('privacy.contact_label')}</small>
                            <strong>{CONTACT_EMAIL}</strong>
                          </span>
                        </a>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </section>
          </div>

          <motion.section className="privacy-final-note" {...reveal}>
            <div>
              <span>{t('privacy.final_note.badge')}</span>
              <h2>{t('privacy.final_note.title')}</h2>
              <p>{t('privacy.final_note.desc')}</p>
            </div>

            <a href={`mailto:${CONTACT_EMAIL}`}>
              <Mail size={18} />
              {t('privacy.final_note.button')}
            </a>
          </motion.section>
        </div>
      </section>
    </main>
  );
};

export default PrivacyPolicyPage;