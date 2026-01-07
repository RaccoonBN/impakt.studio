import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Heart, X, Plus, Minus, ArrowRight } from 'lucide-react';
import './EcommerceDemo.css';

const EcommerceDemo = () => {
  const { t } = useTranslation();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const products = [
    { id: 1, name: "Premium Wool Blazer", price: "2.450.000", tag: "NEW" },
    { id: 2, name: "Silk Essential Shirt", price: "1.250.000", tag: "BEST SELLER" },
    { id: 3, name: "Tailored Linen Trousers", price: "1.850.000", tag: "" },
    { id: 4, name: "Minimal Leather Boots", price: "3.200.000", tag: "LIMITED" }
  ];

  return (
    <div className="ed-root">
      {/* ANNOUNCEMENT BAR */}
      <div className="ed-announcement">
        {t('projects.demo_ecommerce.promo')}
      </div>

      {/* NAVIGATION */}
      <nav className="ed-nav">
        <div className="ed-nav-left">
          <a href="#">BỘ SƯU TẬP</a>
          <a href="#">CHIẾN DỊCH</a>
        </div>
        
        <div className="ed-logo">MODERN.</div>

        <div className="ed-nav-right">
          <Search size={20} className="ed-icon" />
          <div className="ed-cart-trigger" onClick={() => setIsCartOpen(true)}>
            <ShoppingBag size={20} />
            <span className="ed-cart-count">3</span>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="ed-hero">
        <div className="ed-hero-image">
          {/* Placeholder for Hero Image */}
        </div>
        <motion.div 
          className="ed-hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span>AUTUMN / WINTER 2026</span>
          <h1>THE SILENCE OF <br/> MINIMALISM</h1>
          <button className="ed-btn-dark">KHÁM PHÁ NGAY</button>
        </motion.div>
      </section>

      {/* PRODUCT GRID */}
      <section className="ed-products">
        <div className="ed-section-title">
          <h2>SẢN PHẨM MỚI</h2>
          <p>Thiết kế tinh tế trong từng đường kim mũi chỉ</p>
        </div>

        <div className="ed-grid">
          {products.map((product) => (
            <motion.div key={product.id} className="ed-item">
              <div className="ed-item-media">
                <div className="ed-img-placeholder"></div>
                {product.tag && <span className="ed-item-tag">{product.tag}</span>}
                <button className="ed-quick-add">
                  {t('projects.demo_ecommerce.add_to_cart')}
                </button>
              </div>
              <div className="ed-item-info">
                <h3>{product.name}</h3>
                <p>{product.price}{t('projects.demo_ecommerce.currency')}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* MINI CART SIDEBAR */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              className="ed-cart-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
            />
            <motion.div 
              className="ed-cart-sidebar"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.4 }}
            >
              <div className="ed-cart-header">
                <h3>GIỎ HÀNG (3)</h3>
                <X onClick={() => setIsCartOpen(false)} className="ed-close" />
              </div>

              <div className="ed-cart-items">
                {/* Sample Cart Item */}
                <div className="ed-cart-item">
                  <div className="ed-cart-img"></div>
                  <div className="ed-cart-details">
                    <h4>Premium Wool Blazer</h4>
                    <p>Size: M | Color: Black</p>
                    <div className="ed-cart-qty">
                      <div className="qty-btns"><Minus size={12}/> <span>1</span> <Plus size={12}/></div>
                      <b>2.450.000đ</b>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ed-cart-footer">
                <div className="ed-total">
                  <span>TỔNG CỘNG</span>
                  <b>6.150.000đ</b>
                </div>
                <button className="ed-checkout-btn">THANH TOÁN NGAY</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <footer className="ed-footer">
        <div className="ed-footer-grid">
          <div className="ed-f-info">
            <h3>MODERN.</h3>
            <p>Trải nghiệm mua sắm thời trang cao cấp trực tuyến.</p>
          </div>
          <div className="ed-f-links">
            <h4>HỖ TRỢ</h4>
            <a href="#">Vận chuyển</a>
            <a href="#">Đổi trả</a>
          </div>
          <div className="ed-f-newsletter">
            <h4>NEWSLETTER</h4>
            <div className="ed-input-group">
              <input type="text" placeholder="Email của bạn" />
              <ArrowRight size={18} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EcommerceDemo;