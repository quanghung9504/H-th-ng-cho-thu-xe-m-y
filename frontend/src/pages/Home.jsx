import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Bike, Shield, Zap, Search, ArrowRight, Star, TrendingDown, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Home() {
  const navigate = useNavigate();
  const [featuredVehicles, setFeaturedVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Using the generated AI Hero image
  const heroImage = "hero_motorbike_neon_1775322140611.png";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catRes, vehRes] = await Promise.all([
          api.get('/fleet/categories'),
          api.get('/fleet/vehicles', { params: { sort: '-avgRating' } })
        ]);
        setCategories(catRes.categories.slice(0, 4));
        setFeaturedVehicles(vehRes.vehicles.slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div style={{ overflowX: 'hidden', background: 'var(--bg-primary)' }}>
      {/* Cinematic Hero Section - Light Luxury */}
      <section style={{ 
         position: 'relative', 
         height: '95vh', 
         display: 'flex', 
         alignItems: 'center', 
         justifyContent: 'center',
         overflow: 'hidden',
         background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}>
         {/* Decorative Background Elements */}
         <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 0.4 }}
           style={{ 
             position: 'absolute', top: '-10%', right: '-5%', width: '600px', height: '600px',
             background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
             filter: 'blur(100px)',
             zIndex: 1
           }}
         />
         
         <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
            <motion.div
               variants={containerVariants}
               initial="hidden"
               animate="visible"
            >
               <motion.span 
                 variants={itemVariants}
                 className="badge" 
                 style={{ 
                    padding: '0.8rem 2.5rem', 
                    background: 'white', 
                    color: 'var(--accent-primary)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                    marginBottom: '2.5rem',
                    border: 'none',
                    fontSize: '0.8rem'
                 }}
               >
                  💎 Nền tảng thuê xe máy số 1 Việt Nam
               </motion.span>
               
               <motion.h1 
                 variants={itemVariants}
                 style={{ 
                    fontSize: 'clamp(3.5rem, 8vw, 6.5rem)', fontWeight: '900', 
                    marginBottom: '2rem', lineHeight: '1', letterSpacing: '-3px',
                    color: 'var(--text-primary)'
                 }}
               >
                 Tự do <span className="text-gradient">Cung đường</span>,<br/>
                 Bản lĩnh <span className="text-gradient">Cầm lái</span>.
               </motion.h1>

               <motion.p 
                 variants={itemVariants}
                 style={{ 
                    color: 'var(--text-secondary)', fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', 
                    maxWidth: '850px', margin: '0 auto 4rem', lineHeight: '1.6',
                    fontWeight: '500'
                 }}
               >
                 Ride Freedom mang đến trải nghiệm thuê xe máy hạng sang, 
                 thủ tục xác thực 1-chạm và thị trường "Săn cọc" độc bản. 
                 Nâng tầm hành trình của bạn lên đẳng cấp thượng lưu.
               </motion.p>

               <motion.div 
                 variants={itemVariants}
                 className="flex-center" style={{ gap: '1.5rem' }}
               >
                  <Link to="/fleet" className="btn btn-primary" style={{ padding: '1.4rem 4rem', fontSize: '1.1rem', borderRadius: '16px' }}>
                    <Search size={22} /> Khám phá ngay
                  </Link>
                  <Link to="/marketplace" className="btn btn-secondary" style={{ padding: '1.4rem 4rem', fontSize: '1.1rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    Săn cọc tiết kiệm
                  </Link>
               </motion.div>
            </motion.div>
         </div>

         {/* Scroll Indicator */}
         <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ position: 'absolute', bottom: '3rem', left: '50%', transform: 'translateX(-50%)', zIndex: 2, color: 'var(--text-muted)' }}
         >
            <div style={{ width: '28px', height: '45px', border: '2px solid #cbd5e1', borderRadius: '20px', display: 'flex', justifyContent: 'center', padding: '10px' }}>
               <motion.div style={{ width: '4px', height: '10px', background: 'var(--accent-primary)', borderRadius: '2px' }} />
            </div>
         </motion.div>
      </section>

      {/* Stats/Badge strip - Light Theme */}
      <div style={{ borderBottom: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0', padding: '2rem 0', background: 'white' }}>
         <div className="container" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'nowrap', overflowX: 'auto', gap: '3rem' }}>
            {[
              "5000+ Khách hàng tin dùng", 
              "Xác thực CCCD tự động", 
              "Thanh toán VNPay an toàn", 
              "Hoàn cọc 100% đúng hạn"
            ].map((text, i) => (
              <div key={i} className="flex-center" style={{ gap: '1rem', whiteSpace: 'nowrap' }}>
                 <CheckCircle2 color="var(--success)" size={20} /> 
                 <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#1e293b' }}>{text}</span>
              </div>
            ))}
         </div>
      </div>

      {/* Featured Fleet Section */}
      <section className="container" style={{ padding: '8rem 0 4rem' }}>
        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="flex-between" style={{ marginBottom: '4rem' }}
        >
          <div>
             <h2 className="text-gradient" style={{ fontSize: '3rem' }}>Xe được yêu thích nhất</h2>
             <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem' }}>Những mẫu xe có lượt đánh giá và trải nghiệm tốt nhất từ cộng đồng</p>
          </div>
          <Link to="/fleet" style={{ color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', letterSpacing: '1px' }}>
            XEM CHI TIẾT ĐỘI XE <ArrowRight size={18} />
          </Link>
        </motion.div>

        {loading ? (
           <div className="grid-3" style={{ gap: '3rem' }}>
              {[1, 2, 3].map(i => <div key={i} className="glass-card skeleton" style={{ height: '450px', background: 'white' }}></div>)}
           </div>
        ) : (
          <div className="grid-3" style={{ gap: '3rem' }}>
            {featuredVehicles.map((v, index) => (
              <motion.div 
                key={v._id} 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card" 
                style={{ background: 'white', padding: '1.2rem', overflow: 'hidden', border: '1px solid #f1f5f9' }}
                whileHover={{ y: -15, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)' }}
              >
                <div style={{ position: 'relative' }}>
                   <img 
                     src={v.images?.[0] || 'featured_sh_mode_luxury_1775322188322.png'} 
                     style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '15px', marginBottom: '1.5rem' }} 
                   />
                   <div style={{ position: 'absolute', top: 15, right: 15, background: 'rgba(255, 255, 255, 0.9)', padding: '0.5rem 1rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem', backdropFilter: 'blur(10px)', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                      <Star size={16} color="#FFD700" fill="#FFD700" />
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#1e293b' }}>{v.avgRating || 5.0}</span>
                   </div>
                </div>
                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                  <span className="badge" style={{ background: '#f8fafc', color: 'var(--accent-primary)', border: '1px solid #e2e8f0' }}>{v.categoryId?.name}</span>
                  <span style={{ fontWeight: '900', color: 'var(--accent-primary)', fontSize: '1.5rem' }}>
                    {(v.pricePerDay || 0).toLocaleString()} <small style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>VNĐ/N</small>
                  </span>
                </div>
                <h3 style={{ fontSize: '1.5rem', color: '#0f172a' }}>{v.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.8rem', lineHeight: '1.6' }}>
                  {v.brand} • {v.specs?.engine || '125cc'} • {v.specs?.year || '2023'}
                </p>
                <Link to={`/vehicle/${v._id}`} className="btn btn-secondary" style={{ width: '100%', marginTop: '2rem', textDecoration: 'none', justifyContent: 'center', padding: '1.1rem', borderRadius: '14px' }}>
                  Xem chi tiết
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Why Choose Us - Advanced UI */}
      <section style={{ background: 'white', padding: '8rem 0', borderTop: '1px solid #f1f5f9' }}>
         <div className="container">
            <h2 className="text-center text-gradient" style={{ fontSize: '3rem', marginBottom: '6rem' }}>Đế chế Ride Freedom</h2>
            <div className="grid-3" style={{ gap: '3rem' }}>
               {[
                 { icon: <Zap color="var(--accent-primary)" size={40} />, title: "Xác thực 1-chạm", desc: "Tích hợp công nghệ OCR tự động nhận diện CCCD. Mọi thủ tục diễn ra trong chưa đầy 2 phút.", color: "rgba(79, 70, 229, 0.05)" },
                 { icon: <TrendingDown color="var(--accent-secondary)" size={40} />, title: "Sân chơi Tiết kiệm", desc: "Tính năng Săn cọc độc bản giúp bạn sở hữu suất thuê xe sang trọng với chi phí thấp hơn 40%.", color: "rgba(14, 165, 233, 0.05)" },
                 { icon: <Shield color="var(--success)" size={40} />, title: "Minh bạch Tuyệt đối", desc: "Bảo mật thanh toán qua VNPay. Lịch sử ví điện tử ghi nhận từng biến động nhỏ nhất của dòng tiền.", color: "rgba(16, 185, 129, 0.05)" }
               ].map((item, i) => (
                 <motion.div key={i} whileHover={{ y: -10 }} className="glass-card" style={{ background: 'white', border: '1px solid #f1f5f9', padding: '4rem 3rem', textAlign: 'center' }}>
                    <div className="flex-center" style={{ width: '80px', height: '80px', background: item.color, borderRadius: '24px', margin: '0 auto 2.5rem', transform: 'rotate(15deg)', border: '1px solid rgba(0, 0, 0, 0.03)' }}>
                      <div style={{ transform: 'rotate(-15deg)' }}>{item.icon}</div>
                    </div>
                    <h3 style={{ color: '#0f172a' }}>{item.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '1.5rem', lineHeight: '1.8' }}>{item.desc}</p>
                 </motion.div>
               ))}
            </div>
         </div>
      </section>
    </div>
  );
}
