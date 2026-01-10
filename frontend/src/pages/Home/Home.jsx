import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import Hero from './Hero';
import Service from './Services';
import WhyUs from './WhyUs';
import './Home.css';

const Home = () => {
  const { t } = useTranslation();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Reveal Scroll Logic
    const handleScroll = () => {
      const reveals = document.querySelectorAll('.reveal, .reveal-scale');
      reveals.forEach((el) => {
        const windowHeight = window.innerHeight;
        const revealTop = el.getBoundingClientRect().top;
        if (revealTop < windowHeight - 150) el.classList.add('active');
      });
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    // Popup Logic: Hiện sau 1s, hiển thị 5s rồi đóng
    const showTimer = setTimeout(() => setShowPopup(true), 1000);
    const hideTimer = setTimeout(() => setShowPopup(false), 6500); 

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <main className="home-container">
      {showPopup && (
        <div className="ign-overlay">
          <div className="ign-card">
            <div className="ign-icon-wrapper">
              <div className="ign-pulse" />
              <Bell size={32} className="ign-bell" />
            </div>
            
            <div className="ign-info">
              <h3 className="ign-title">{t('maintenance_popup.title')}</h3>
              <p className="ign-text">{t('maintenance_popup.desc')}</p>
            </div>

            <div className="ign-progress-bar">
              <div className="ign-progress-fill" />
            </div>
          </div>
        </div>
      )}

      <Hero />
      <Service />
      <WhyUs />
    </main>
  );
};

export default Home;