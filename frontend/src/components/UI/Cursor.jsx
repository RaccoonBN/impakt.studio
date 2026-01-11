import React, { useEffect, useState } from 'react';
import './Cursor.css';

const Cursor = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 1. Kiểm tra nếu là thiết bị cảm ứng
    const checkMobile = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      // Hoặc kiểm tra độ rộng màn hình (tùy chọn)
      const isSmallScreen = window.matchMedia("(max-width: 1024px)").matches;
      
      if (isTouch || isSmallScreen) {
        setIsMobile(true);
        return true;
      }
      return false;
    };

    if (checkMobile()) return; // Nếu là mobile thì thoát luôn, không chạy logic bên dưới

    const onMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    const handleHover = () => setIsHovered(true);
    const handleUnhover = () => setIsHovered(false);

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    const attachEvents = () => {
      const targets = document.querySelectorAll('button, a, .btn, .why-item, .spec-item, .hero-badge');
      targets.forEach(el => {
        el.addEventListener('mouseenter', handleHover);
        el.addEventListener('mouseleave', handleUnhover);
      });
    };

    attachEvents();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, [isVisible]);

  // 2. Không render nếu là mobile hoặc không visible
  if (isMobile || !isVisible) return null;

  return (
    <div 
      className={`cursor-ring ${isHovered ? 'hovered' : ''}`}
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
      }}
    />
  );
};

export default Cursor;