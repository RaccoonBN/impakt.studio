import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', // primary hoặc secondary
  className = '', 
  onClick, 
  type = 'button',
  href,
  ...props 
}) => {
  const classNames = `btn btn-${variant} ${className}`;

  // Nếu có href thì render thẻ a (hoặc Link nếu dùng react-router)
  if (href) {
    return (
      <a href={href} className={classNames} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classNames} onClick={onClick} {...props}>
      {children}
    </button>
  );
};

export default Button;