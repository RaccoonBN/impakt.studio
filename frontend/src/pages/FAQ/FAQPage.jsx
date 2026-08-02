import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Code2,
  CreditCard,
  FileText,
  Globe2,
  Headphones,
  LayoutTemplate,
  Search,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/UI/Button';
import './FAQPage.css';

const CONTACT_PATH = '/contact';

const CATEGORY_ICONS = {
  all: CircleHelp,
  service: LayoutTemplate,
  process: Clock3,
  cost: CreditCard,
  technical: Code2,
  support: Headphones,
};

const asArray = (value) => (Array.isArray(value) ? value : []);

const FAQPage = () => {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  const [activeCategory, setActiveCategory] = useState('all');
  const [openQuestionId, setOpenQuestionId] = useState('service-1');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = useMemo(
    () => asArray(t('faq.categories', { returnObjects: true })),
    [t],
  );

  const questions = useMemo(
    () => asArray(t('faq.questions', { returnObjects: true })),
    [t],
  );

  const filteredQuestions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return questions.filter((item) => {
      const matchesCategory =
        activeCategory === 'all' || item.category === activeCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return `${item.question} ${item.answer}`
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [activeCategory, questions, searchTerm]);

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    setOpenQuestionId(null);
  };

  const reveal = {
    initial: reduceMotion ? false : { opacity: 0, y: 20 },
    whileInView: reduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.16 },
    transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
  };

  return (
    <main className="faq-page">
      <div className="faq-background" aria-hidden="true">
        <motion.span
          className="faq-orb faq-orb-one"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, 22, 0], y: [0, 16, 0], scale: [1, 1.06, 1] }
          }
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.span
          className="faq-orb faq-orb-two"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, -20, 0], y: [0, -18, 0], scale: [1, 1.05, 1] }
          }
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />

        <span className="faq-grid-pattern" />
      </div>

      <section className="faq-hero">
        <div className="faq-container">
          <motion.header
            className="faq-header"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.66, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="faq-eyebrow">
              <Sparkles size={15} />
              {t('faq.badge')}
            </span>

            <h1>{t('faq.headline')}</h1>
            <p>{t('faq.desc')}</p>

            <div className="faq-search-box">
              <Search size={20} />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t('faq.search_placeholder')}
                aria-label={t('faq.search_placeholder')}
              />
            </div>

            <div className="faq-quick-points">
              <span>
                <CheckCircle2 size={16} />
                {t('faq.quick_points.clear_scope')}
              </span>
              <span>
                <Clock3 size={16} />
                {t('faq.quick_points.fast_answer')}
              </span>
              <span>
                <ShieldCheck size={16} />
                {t('faq.quick_points.transparent')}
              </span>
            </div>
          </motion.header>

          <motion.div className="faq-layout" {...reveal}>
            <aside className="faq-category-panel">
              <span className="faq-category-label">
                {t('faq.category_label')}
              </span>

              <div className="faq-category-list" role="tablist">
                {categories.map((category) => {
                  const Icon = CATEGORY_ICONS[category.id] || CircleHelp;
                  const isActive = activeCategory === category.id;

                  return (
                    <button
                      type="button"
                      key={category.id}
                      className={isActive ? 'is-active' : ''}
                      onClick={() => handleCategoryChange(category.id)}
                      role="tab"
                      aria-selected={isActive}
                    >
                      <span className="faq-category-icon">
                        <Icon size={18} />
                      </span>

                      <span className="faq-category-copy">
                        <strong>{category.label}</strong>
                        <small>{category.desc}</small>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="faq-support-card">
                <Wrench size={22} />
                <div>
                  <span>{t('faq.support_card.badge')}</span>
                  <h3>{t('faq.support_card.title')}</h3>
                  <p>{t('faq.support_card.desc')}</p>
                </div>

                <Link to={CONTACT_PATH}>
                  {t('faq.support_card.button')}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </aside>

            <section className="faq-content-panel">
              <div className="faq-content-heading">
                <div>
                  <span>{t('faq.list_badge')}</span>
                  <h2>{t('faq.list_title')}</h2>
                </div>

                <strong>
                  {t('faq.result_count', {
                    count: filteredQuestions.length,
                  })}
                </strong>
              </div>

              <div className="faq-accordion">
                <AnimatePresence initial={false}>
                  {filteredQuestions.map((item, index) => {
                    const isOpen = openQuestionId === item.id;

                    return (
                      <motion.article
                        className={`faq-item ${isOpen ? 'is-open' : ''}`}
                        key={item.id}
                        layout
                        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                        transition={{
                          duration: 0.34,
                          delay: index * 0.025,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <button
                          type="button"
                          className="faq-question"
                          onClick={() =>
                            setOpenQuestionId(isOpen ? null : item.id)
                          }
                          aria-expanded={isOpen}
                          aria-controls={`faq-answer-${item.id}`}
                        >
                          <span className="faq-question-number">
                            {String(index + 1).padStart(2, '0')}
                          </span>

                          <span className="faq-question-copy">
                            <small>{item.categoryLabel}</small>
                            <strong>{item.question}</strong>
                          </span>

                          <span className="faq-chevron">
                            <ChevronDown size={20} />
                          </span>
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              id={`faq-answer-${item.id}`}
                              className="faq-answer"
                              initial={
                                reduceMotion
                                  ? false
                                  : { height: 0, opacity: 0 }
                              }
                              animate={
                                reduceMotion
                                  ? undefined
                                  : { height: 'auto', opacity: 1 }
                              }
                              exit={
                                reduceMotion
                                  ? undefined
                                  : { height: 0, opacity: 0 }
                              }
                              transition={{
                                duration: 0.34,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                            >
                              <div>
                                <FileText size={18} />
                                <p>{item.answer}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>

                {filteredQuestions.length === 0 && (
                  <motion.div
                    className="faq-empty-state"
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  >
                    <Search size={30} />
                    <h3>{t('faq.empty.title')}</h3>
                    <p>{t('faq.empty.desc')}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setActiveCategory('all');
                      }}
                    >
                      {t('faq.empty.button')}
                    </button>
                  </motion.div>
                )}
              </div>
            </section>
          </motion.div>

          <motion.section className="faq-final-cta" {...reveal}>
            <div>
              <span className="faq-section-label">
                {t('faq.final_cta.badge')}
              </span>
              <h2>{t('faq.final_cta.title')}</h2>
              <p>{t('faq.final_cta.desc')}</p>
            </div>

            <Link to={CONTACT_PATH} className="faq-button-link">
              <Button variant="primary" className="faq-cta-button">
                {t('faq.final_cta.button')}
                <ArrowRight size={18} />
              </Button>
            </Link>
          </motion.section>
        </div>
      </section>
    </main>
  );
};

export default FAQPage;