import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, X, Monitor, Smartphone, Tablet, ExternalLink, ArrowRight, Loader2 } from 'lucide-react';
import Button from '../../components/UI/Button';
import './ProjectsPage.css';

const ProjectsPage = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewMode, setViewMode] = useState('desktop');
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  // Dữ liệu dự án kết nối trực tiếp tới các Route Demo
  const projectsData = [
    {
      id: 1,
      title: "Creative Director Portfolio",
      category: "ca-nhan",
      image: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?q=80&w=1000",
      demoUrl: "/demo/portfolio",
      tags: ["Minimal", "Portfolio"]
    },
    {
      id: 2,
      title: "SaaS Business Tech",
      category: "doanh-nghiep",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000",
      demoUrl: "/demo/business",
      tags: ["Software", "Corporate"]
    },
    {
      id: 3,
      title: "Luxury Fashion Store",
      category: "ecommerce",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000",
      demoUrl: "/demo/ecommerce",
      tags: ["E-commerce", "High-end"]
    }
  ];

  const filteredProjects = filter === 'all' 
    ? projectsData 
    : projectsData.filter(p => p.category === filter);

  // Reset loading mỗi khi đổi project hoặc đổi chế độ xem
  useEffect(() => {
    if (selectedProject) setIsIframeLoading(true);
  }, [selectedProject, viewMode]);

  return (
    <div className="projects-root">
      <div className="projects-container">
        {/* HEADER */}
        <header className="projects-header">
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="projects-badge">
            {t('projects.badge')}
          </motion.span>
          <h1 className="projects-title">{t('projects.headline')}</h1>
          <p className="projects-desc">{t('projects.desc')}</p>
        </header>

        {/* FILTER BAR */}
        <div className="projects-filter">
          {['all', 'ca-nhan', 'doanh-nghiep', 'ecommerce'].map((cat) => (
            <button 
              key={cat}
              className={filter === cat ? 'active' : ''}
              onClick={() => setFilter(cat)}
            >
              {t(`projects.filter_${cat === 'all' ? 'all' : cat.replace('-', '_')}`)}
            </button>
          ))}
        </div>

        {/* PROJECTS GRID */}
        <motion.div layout className="projects-grid">
          <AnimatePresence mode='popLayout'>
            {filteredProjects.map((project) => (
              <motion.div 
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="project-card"
              >
                <div className="card-media">
                  <img src={project.image} alt={project.title} />
                  <div className="card-overlay">
                    <button onClick={() => setSelectedProject(project)}>
                      <Eye size={20} /> {t('projects.btn_preview')}
                    </button>
                  </div>
                </div>
                <div className="card-info">
                  <div className="card-tags">
                    {project.tags.map(tag => <span key={tag}>{tag}</span>)}
                  </div>
                  <h3>{project.title}</h3>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* MODAL PREVIEW HỆ THỐNG */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div 
            className="preview-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="preview-toolbar">
              <div className="preview-info">
                <h4>{selectedProject.title}</h4>
              </div>

              <div className="preview-switcher">
                <button className={viewMode === 'desktop' ? 'active' : ''} onClick={() => setViewMode('desktop')}><Monitor size={18} /></button>
                <button className={viewMode === 'tablet' ? 'active' : ''} onClick={() => setViewMode('tablet')}><Tablet size={18} /></button>
                <button className={viewMode === 'mobile' ? 'active' : ''} onClick={() => setViewMode('mobile')}><Smartphone size={18} /></button>
              </div>

              <div className="preview-actions">
                <a href={selectedProject.demoUrl} target="_blank" rel="noreferrer">
                   {t('projects.btn_external')} <ExternalLink size={14} />
                </a>
                <button className="close-btn" onClick={() => setSelectedProject(null)}><X /></button>
              </div>
            </div>

            <div className="preview-body">
              <div className={`iframe-frame ${viewMode}`}>
                {isIframeLoading && (
                  <div className="iframe-loader">
                    <Loader2 className="spinner" />
                  </div>
                )}
                <iframe 
                  src={selectedProject.demoUrl} 
                  onLoad={() => setIsIframeLoading(false)}
                  style={{ opacity: isIframeLoading ? 0 : 1 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectsPage;