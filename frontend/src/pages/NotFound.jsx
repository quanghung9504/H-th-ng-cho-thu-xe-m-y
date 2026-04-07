import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Bike } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', textAlign: 'center', padding: '2rem' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '3rem' }}>
           <Bike size={120} color="var(--accent-primary)" style={{ opacity: 0.1 }} />
           <h1 style={{ fontSize: '10rem', fontWeight: '900', margin: 0, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', letterSpacing: '-5px' }}>
              <span className="text-gradient">404</span>
           </h1>
        </div>
        
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Bạn đi lạc rồi!</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '500px', margin: '0 auto 3rem' }}>
           Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển sang một cung đường khác.
        </p>

        <div className="flex-center" style={{ gap: '1.5rem' }}>
           <button 
             onClick={() => window.history.back()} 
             className="btn btn-secondary" 
             style={{ padding: '1rem 2rem' }}
           >
              <ArrowLeft size={20} /> Quay lại
           </button>
           <Link to="/" className="btn btn-primary" style={{ padding: '1rem 2rem' }}>
              <Home size={20} /> Về trang chủ
           </Link>
        </div>
      </motion.div>
      
      {/* Decorative background elements */}
      <div style={{ position: 'absolute', top: '20%', left: '10%', width: '300px', height: '300px', background: 'var(--accent-primary)', filter: 'blur(150px)', opacity: 0.05, zIndex: -1 }}></div>
      <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: '300px', height: '300px', background: 'var(--accent-secondary)', filter: 'blur(150px)', opacity: 0.05, zIndex: -1 }}></div>
    </div>
  );
}
