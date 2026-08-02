import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ExternalLink,
  Eye,
  Globe2,
  Loader2,
  Monitor,
  Quote,
  Smartphone,
  Sparkles,
  Star,
  Tablet,
  X,
} from 'lucide-react';
import Button from '../../components/UI/Button';
import './ProjectsPage.css';

const PROJECTS = [
  {
    id: 'joy-healthcare',
    translationKey: 'joy_healthcare',
    category: 'business',
    liveUrl: 'https://joyhealthcare.vn/',
    tags: ['Healthcare', 'Business Website', 'Responsive'],
  },
];

const VIEW_MODES = {
  desktop: {
    icon: Monitor,
    labelKey: 'projects.preview.desktop',
  },
  tablet: {
    icon: Tablet,
    labelKey: 'projects.preview.tablet',
  },
  mobile: {
    icon: Smartphone,
    labelKey: 'projects.preview.mobile',
  },
};

const DEVICE_VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};

const ResponsiveWebsiteFrame = ({
  mode,
  src,
  title,
  variant = 'inline',
  onLoad,
  loading = false,
  loadingText,
}) => {
  const stageRef = useRef(null);
  const [scale, setScale] = useState(0.5);
  const viewport = DEVICE_VIEWPORTS[mode] || DEVICE_VIEWPORTS.desktop;

  useEffect(() => {
    const stage = stageRef.current;

    if (!stage) {
      return undefined;
    }

    let frameId = 0;

    const updateScale = () => {
      window.cancelAnimationFrame(frameId);

      frameId = window.requestAnimationFrame(() => {
        const width = stage.clientWidth;
        const height = stage.clientHeight;
        const horizontalGap = variant === 'modal' ? 28 : 20;
        const verticalGap = variant === 'modal' ? 28 : 20;

        const availableWidth = Math.max(1, width - horizontalGap);
        const availableHeight = Math.max(1, height - verticalGap);

        const nextScale = Math.min(
          availableWidth / viewport.width,
          availableHeight / viewport.height,
          1,
        );

        setScale(Math.max(0.05, nextScale));
      });
    };

    updateScale();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(updateScale)
        : null;

    resizeObserver?.observe(stage);
    window.addEventListener('resize', updateScale);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [mode, variant, viewport.height, viewport.width]);

  return (
    <div
      ref={stageRef}
      className={`pp-device-stage is-${variant}`}
      data-device={mode}
    >
      <motion.div
        className={`pp-device-viewport is-${mode}`}
        style={{
          width: `${viewport.width}px`,
          height: `${viewport.height}px`,
          '--pp-device-scale': scale,
        }}
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {loading && (
          <div className="pp-iframe-loader">
            <Loader2 className="pp-spinner" size={28} />
            <span>{loadingText}</span>
          </div>
        )}

        <iframe
          key={`${src}-${mode}`}
          src={src}
          title={title}
          onLoad={onLoad}
          tabIndex={variant === 'inline' ? -1 : undefined}
          referrerPolicy="strict-origin-when-cross-origin"
          allow="fullscreen"
        />
      </motion.div>
    </div>
  );
};

const ProjectsPage = () => {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  const [selectedProject, setSelectedProject] = useState(null);
  const [modalViewMode, setModalViewMode] = useState('desktop');
  const [inlineViewModes, setInlineViewModes] = useState({});
  const [isIframeLoading, setIsIframeLoading] = useState(false);

  const projects = useMemo(
    () =>
      PROJECTS.map((project) => ({
        ...project,
        title: t(`projects.items.${project.translationKey}.title`),
        type: t(`projects.items.${project.translationKey}.type`),
        summary: t(`projects.items.${project.translationKey}.summary`),
        objective: t(`projects.items.${project.translationKey}.objective`),
        scope: t(`projects.items.${project.translationKey}.scope`),
        result: t(`projects.items.${project.translationKey}.result`),
        feedback: t(
          `projects.items.${project.translationKey}.feedback`,
          { returnObjects: true },
        ),
      })),
    [t],
  );

  useEffect(() => {
    if (!selectedProject) {
      document.body.style.removeProperty('overflow');
      return undefined;
    }

    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSelectedProject(null);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.removeProperty('overflow');
      window.removeEventListener('keydown', handleEscape);
    };
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject) {
      setIsIframeLoading(true);
    }
  }, [selectedProject, modalViewMode]);

  const openPreview = (project, initialMode = 'desktop') => {
    setModalViewMode(initialMode);
    setSelectedProject(project);
  };

  const getInlineMode = (projectId) => {
    return inlineViewModes[projectId] || 'desktop';
  };

  const setInlineMode = (projectId, mode) => {
    setInlineViewModes((currentModes) => ({
      ...currentModes,
      [projectId]: mode,
    }));
  };

  const reveal = {
    initial: reduceMotion ? false : { opacity: 0, y: 22 },
    whileInView: reduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.16 },
    transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
  };

  const previewModal =
    selectedProject && typeof document !== 'undefined'
      ? createPortal(
          <AnimatePresence>
            <motion.div
              className="pp-preview-overlay"
              role="dialog"
              aria-modal="true"
              aria-label={`${selectedProject.title} — ${t('projects.btn_preview')}`}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={reduceMotion ? undefined : { opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
            >
              <div className="pp-preview-toolbar">
                <div className="pp-preview-project-info">
                  <span>{t('projects.preview.label')}</span>
                  <strong>{selectedProject.title}</strong>
                </div>

                <div
                  className="pp-view-switcher"
                  role="group"
                  aria-label={t('projects.preview.device_label')}
                >
                  {Object.entries(VIEW_MODES).map(([mode, config]) => {
                    const Icon = config.icon;

                    return (
                      <button
                        type="button"
                        key={mode}
                        className={modalViewMode === mode ? 'is-active' : ''}
                        onClick={() => setModalViewMode(mode)}
                        aria-label={t(config.labelKey)}
                        title={t(config.labelKey)}
                      >
                        <Icon size={18} />
                      </button>
                    );
                  })}
                </div>

                <div className="pp-preview-actions">
                  <a
                    href={selectedProject.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{t('projects.btn_external')}</span>
                    <ExternalLink size={16} />
                  </a>
                </div>

                <button
                  type="button"
                  className="pp-close-button pp-close-button-toolbar"
                  onClick={() => setSelectedProject(null)}
                  aria-label={t('projects.preview.close')}
                >
                  <X size={22} />
                </button>
              </div>

              <div className="pp-preview-body">
                <ResponsiveWebsiteFrame
                  mode={modalViewMode}
                  src={selectedProject.liveUrl}
                  title={`${selectedProject.title} — ${t(
                    VIEW_MODES[modalViewMode].labelKey,
                  )}`}
                  variant="modal"
                  loading={isIframeLoading}
                  loadingText={t('projects.preview.loading')}
                  onLoad={() => setIsIframeLoading(false)}
                />

                <div className="pp-preview-fallback">
                  <span>{t('projects.preview.fallback')}</span>
                  <a
                    href={selectedProject.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('projects.btn_external')}
                    <ArrowRight size={15} />
                  </a>
                </div>

                <span className="pp-preview-portal-note">
                  {t('projects.preview.portal_note')}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <main className="pp-page">
      <div className="pp-background" aria-hidden="true">
        <motion.span
          className="pp-orb pp-orb-one"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, 26, 0], y: [0, 18, 0], scale: [1, 1.07, 1] }
          }
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="pp-orb pp-orb-two"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, -24, 0], y: [0, -20, 0], scale: [1, 1.05, 1] }
          }
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="pp-grid-pattern" />
      </div>

      <section className="pp-hero">
        <div className="pp-container">
          <motion.header
            className="pp-header"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.66, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="pp-eyebrow">
              <Sparkles size={15} />
              {t('projects.badge')}
            </span>

            <h1>{t('projects.headline')}</h1>
            <p>{t('projects.desc')}</p>
          </motion.header>

          <div className="pp-project-list">
            {projects.map((project, index) => {
              const inlineMode = getInlineMode(project.id);

              return (
                <motion.article
                  className="pp-project-card"
                  key={project.id}
                  {...reveal}
                  transition={{
                    ...reveal.transition,
                    delay: index * 0.06,
                  }}
                >
                  <div className="pp-project-copy">
                    <div className="pp-project-topline">
                      <span className="pp-project-number">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="pp-project-type">
                        <Building2 size={15} />
                        {project.type}
                      </span>
                      <span className="pp-live-status">
                        <span />
                        {t('projects.live_status')}
                      </span>
                    </div>

                    <h2>{project.title}</h2>
                    <p className="pp-project-summary">{project.summary}</p>

                    <div className="pp-tags">
                      {project.tags.map((tag) => (
                        <span key={`${project.id}-${tag}`}>{tag}</span>
                      ))}
                    </div>

                    <div className="pp-case-grid">
                      <div className="pp-case-item">
                        <span>{t('projects.labels.objective')}</span>
                        <p>{project.objective}</p>
                      </div>
                      <div className="pp-case-item">
                        <span>{t('projects.labels.scope')}</span>
                        <p>{project.scope}</p>
                      </div>
                      <div className="pp-case-item">
                        <span>{t('projects.labels.result')}</span>
                        <p>{project.result}</p>
                      </div>
                    </div>

                    <div className="pp-testimonial">
                      <Quote size={24} />
                      <div className="pp-testimonial-copy">
                        <span>{project.feedback.label}</span>
                        <blockquote>{project.feedback.quote}</blockquote>

                        <div className="pp-testimonial-footer">
                          <strong>{project.feedback.author}</strong>
                          <div className="pp-rating">
                            <span className="pp-rating-stars" aria-hidden="true">
                              {Array.from({ length: 5 }).map((_, starIndex) => (
                                <Star
                                  key={`star-${starIndex}`}
                                  size={14}
                                  fill="currentColor"
                                />
                              ))}
                            </span>
                            <em>{project.feedback.rating}</em>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pp-project-actions">
                      <Button
                        variant="primary"
                        className="pp-preview-button"
                        onClick={() => openPreview(project, inlineMode)}
                      >
                        <Eye size={18} />
                        {t('projects.btn_preview')}
                      </Button>

                      <a
                        className="pp-external-link"
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t('projects.btn_external')}
                        <ArrowUpRight size={17} />
                      </a>
                    </div>
                  </div>

                  <div className="pp-browser-shell">
                    <div className="pp-browser-toolbar">
                      <div className="pp-browser-dots" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </div>

                      <div
                        className="pp-inline-switcher"
                        role="group"
                        aria-label={t('projects.preview.inline_device_label')}
                      >
                        {Object.entries(VIEW_MODES).map(([mode, config]) => {
                          const Icon = config.icon;

                          return (
                            <button
                              type="button"
                              key={`${project.id}-${mode}`}
                              className={inlineMode === mode ? 'is-active' : ''}
                              onClick={() => setInlineMode(project.id, mode)}
                              aria-label={t(config.labelKey)}
                              title={t(config.labelKey)}
                            >
                              <Icon size={16} />
                            </button>
                          );
                        })}
                      </div>

                      <div className="pp-browser-address">
                        <Globe2 size={13} />
                        <span>joyhealthcare.vn</span>
                      </div>

                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={t('projects.btn_external')}
                      >
                        <ExternalLink size={15} />
                      </a>
                    </div>

                    <div className="pp-inline-preview-stage">
                      <ResponsiveWebsiteFrame
                        mode={inlineMode}
                        src={project.liveUrl}
                        title={`${project.title} — ${t(
                          VIEW_MODES[inlineMode].labelKey,
                        )}`}
                        variant="inline"
                      />

                      <button
                        type="button"
                        className="pp-preview-cover"
                        onClick={() => openPreview(project, inlineMode)}
                        aria-label={t('projects.btn_preview')}
                      >
                        <span>
                          <Eye size={18} />
                          {t('projects.preview.open_preview')}
                        </span>
                      </button>
                    </div>

                    <div className="pp-frame-note">
                      <CheckCircle2 size={16} />
                      <span>{t('projects.preview.frame_note')}</span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {previewModal}
    </main>
  );
};

export default ProjectsPage;