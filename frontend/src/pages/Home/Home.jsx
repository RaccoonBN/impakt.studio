import React, { useEffect } from 'react';
import Hero from './Hero';
import Service from './Services';
import WhyUs from './WhyUs';
import './Home.css';

const Home = () => {
  useEffect(() => {
    const handleScroll = () => {
      const reveals = document.querySelectorAll('.reveal, .reveal-scale');
      
      reveals.forEach((element) => {
        const windowHeight = window.innerHeight;
        const revealTop = element.getBoundingClientRect().top;
        const revealPoint = 150; // Khoảng cách để kích hoạt hiệu ứng

        if (revealTop < windowHeight - revealPoint) {
          element.classList.add('active');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    // Kích hoạt ngay lần đầu để hiện Hero
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="home-container">
      <Hero />
      <Service />
      <WhyUs />
    </main>
  );
};

export default Home;