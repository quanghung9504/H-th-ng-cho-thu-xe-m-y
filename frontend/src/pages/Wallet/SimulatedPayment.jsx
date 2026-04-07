import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, XCircle, ChevronLeft, Lock, Zap } from 'lucide-react';

// ============================================================
// TRANG THANH TOÁN TRÊN ĐIỆN THOẠI
// Người dùng quét QR → Trang này mở trên điện thoại
// Xác nhận tại đây → Tiền vào ví trên máy tính ngay lập tức
// ============================================================

export default function SimulatedPayment() {
  const { id } = useParams();
  const [step, setStep] = useState('loading'); // loading | confirm | pin | processing | success | error
  const [transaction, setTransaction] = useState(null);
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [dots, setDots] = useState(0);

  const CORRECT_PIN = '123456'; // PIN demo cố định

  useEffect(() => {
    const fetchTx = async () => {
      try {
        const res = await api.get(`/transactions/wallet/${id}`);
        setTransaction(res.transaction);
        setStep('confirm');
      } catch (err) {
        setStep('error');
      }
    };
    fetchTx();
  }, [id]);

  // Hiệu ứng dots khi đang loading
  useEffect(() => {
    if (step !== 'loading' && step !== 'processing') return;
    const t = setInterval(() => setDots(d => (d + 1) % 4), 400);
    return () => clearInterval(t);
  }, [step]);

  const handlePinInput = (digit) => {
    if (pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 6) {
      setTimeout(() => confirmPayment(newPin), 300);
    }
  };

  const handleDelete = () => setPin(p => p.slice(0, -1));

  const confirmPayment = async (enteredPin) => {
    if (enteredPin !== CORRECT_PIN) {
      setShake(true);
      setTimeout(() => { setShake(false); setPin(''); }, 600);
      return;
    }
    setStep('processing');
    try {
      await api.post(`/transactions/wallet/process-payment/${id}`);
      setStep('success');
    } catch (e) {
      setStep('error');
    }
  };

  // ─── PHÁT HIỆN PHƯƠNG THỨC THANH TOÁN ───────────────────
  const methodName = transaction?.description?.includes('VNPay') ? 'VNPay' : 'MoMo';
  const methodColor = methodName === 'VNPay' ? '#005baa' : '#ae2070';
  const methodIcon = methodName === 'VNPay'
    ? 'https://vnpay.vn/wp-content/uploads/2020/07/Logo-VNPAYIPN.png'
    : 'https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png';

  // ─── NUMPAD ──────────────────────────────────────────────
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  // ─── STYLES CHUNG ────────────────────────────────────────
  const page = {
    minHeight: '100vh',
    background: '#f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    maxWidth: '430px',
    margin: '0 auto',
    position: 'relative',
    overflow: 'hidden'
  };

  // ─── LOADING ─────────────────────────────────────────────
  if (step === 'loading') return (
    <div style={{ ...page, alignItems: 'center', justifyContent: 'center', background: 'white' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: '48px', height: '48px', border: '4px solid #f1f5f9', borderTop: `4px solid ${methodColor}`, borderRadius: '50%', marginBottom: '1.5rem' }} />
      <p style={{ color: '#94a3b8', fontWeight: '600', fontSize: '0.95rem' }}>Đang tải thông tin{'.'.repeat(dots)}</p>
    </div>
  );

  // ─── LỖI ─────────────────────────────────────────────────
  if (step === 'error') return (
    <div style={{ ...page, alignItems: 'center', justifyContent: 'center', background: 'white', padding: '2rem' }}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
        <XCircle size={80} color="#ef4444" strokeWidth={1.5} />
      </motion.div>
      <h2 style={{ marginTop: '1.5rem', color: '#0f172a', fontWeight: '900', fontSize: '1.5rem' }}>Giao dịch không hợp lệ</h2>
      <p style={{ color: '#94a3b8', marginTop: '0.5rem', textAlign: 'center', lineHeight: '1.6' }}>Mã QR đã hết hạn hoặc giao dịch không tồn tại.</p>
    </div>
  );

  // ─── THÀNH CÔNG ───────────────────────────────────────────
  if (step === 'success') return (
    <div style={{ ...page, alignItems: 'center', justifyContent: 'center', background: 'white', padding: '2rem' }}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        style={{ textAlign: 'center' }}
      >
        {/* Vòng tròn thành công động */}
        <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 2rem' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{ width: '120px', height: '120px', background: `linear-gradient(135deg, ${methodColor}, ${methodColor}99)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 20px 60px ${methodColor}40` }}
          >
            <CheckCircle2 color="white" size={56} strokeWidth={2} />
          </motion.div>
          {[...Array(3)].map((_, i) => (
            <motion.div key={i}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.6, ease: 'easeOut' }}
              style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: methodColor, pointerEvents: 'none' }}
            />
          ))}
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px' }}>Thanh công!</h1>
        <p style={{ color: '#64748b', margin: '0.5rem 0 2rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
          Đã nạp <strong style={{ color: methodColor, fontSize: '1.2rem' }}>{transaction?.amount?.toLocaleString()}đ</strong><br />
          vào ví Ride Freedom
        </p>

        {/* Receipt card */}
        <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '1.5rem', border: '1px solid #e2e8f0', textAlign: 'left', marginBottom: '2rem' }}>
          {[
            ['Số tiền', `+${transaction?.amount?.toLocaleString()}đ`],
            ['Phương thức', methodName + ' Pay'],
            ['Thời gian', new Date().toLocaleString('vi-VN')],
            ['Trạng thái', '✅ Thành công'],
          ].map(([label, value], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600' }}>{label}</span>
              <span style={{ color: '#1e293b', fontSize: '0.9rem', fontWeight: '800' }}>{value}</span>
            </div>
          ))}
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600' }}>
          Quay lại máy tính để tiếp tục 💻
        </p>
      </motion.div>
    </div>
  );

  // ─── ĐANG XỬ LÝ ──────────────────────────────────────────
  if (step === 'processing') return (
    <div style={{ ...page, alignItems: 'center', justifyContent: 'center', background: 'white', padding: '2rem' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
        style={{ width: '60px', height: '60px', border: '5px solid #f1f5f9', borderTop: `5px solid ${methodColor}`, borderRadius: '50%', marginBottom: '1.5rem' }} />
      <h3 style={{ color: '#0f172a', fontWeight: '800', fontSize: '1.2rem' }}>Đang xử lý{'.'.repeat(dots)}</h3>
      <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem' }}>Vui lòng không tắt trang</p>
    </div>
  );

  // ─── NHẬP PIN ─────────────────────────────────────────────
  if (step === 'pin') return (
    <div style={{ ...page, background: 'white' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '1.2rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
        <button onClick={() => { setStep('confirm'); setPin(''); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
          <ChevronLeft size={26} color="#64748b" />
        </button>
        <p style={{ flex: 1, textAlign: 'center', fontWeight: '800', fontSize: '1.05rem', color: '#0f172a', marginRight: '42px' }}>
          Nhập mã PIN
        </p>
      </div>

      {/* Logo & Amount */}
      <div style={{ padding: '2.5rem 1.5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', background: 'white', borderRadius: '16px', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' }}>
          <img src={methodIcon} style={{ width: '38px', objectFit: 'contain' }} alt={methodName} />
        </div>
        <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600', margin: '0 0 0.3rem' }}>Số tiền thanh toán</p>
        <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: methodColor, letterSpacing: '-1px', margin: 0 }}>
          {transaction?.amount?.toLocaleString()}<span style={{ fontSize: '1rem' }}>đ</span>
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.4rem', fontWeight: '600' }}>Nạp ví Ride Freedom</p>
      </div>

      {/* PIN Dots */}
      <div style={{ padding: '0.5rem 2rem 2rem', textAlign: 'center' }}>
        <p style={{ color: '#475569', fontWeight: '700', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
          <Lock size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Nhập mã PIN {methodName} để xác nhận
        </p>
        <motion.div
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2.5rem' }}
        >
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              width: '14px', height: '14px', borderRadius: '50%',
              background: i < pin.length ? methodColor : '#e2e8f0',
              transition: 'background 0.15s',
              boxShadow: i < pin.length ? `0 3px 10px ${methodColor}50` : 'none'
            }} />
          ))}
        </motion.div>

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.7rem', maxWidth: '280px', margin: '0 auto' }}>
          {keys.map((k, i) => (
            <button key={i}
              onClick={() => k === '⌫' ? handleDelete() : k !== '' ? handlePinInput(k) : null}
              style={{
                aspectRatio: '1', borderRadius: '50%',
                background: k === '' ? 'transparent' : k === '⌫' ? '#f8fafc' : 'white',
                border: k === '' ? 'none' : '1px solid #f1f5f9',
                fontSize: k === '⌫' ? '1.4rem' : '1.5rem',
                fontWeight: '700', color: '#1e293b',
                cursor: k === '' ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: k && k !== '' ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                transition: 'all 0.15s',
                width: '78px', height: '78px', margin: '0 auto'
              }}
              onMouseDown={e => { if (k) e.currentTarget.style.transform = 'scale(0.92)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {k}
            </button>
          ))}
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: '2rem', fontWeight: '600' }}>
          (Demo) PIN: <strong style={{ color: methodColor }}>123456</strong>
        </p>
      </div>
    </div>
  );

  // ─── XÁC NHẬN THANH TOÁN ─────────────────────────────────
  return (
    <div style={{ ...page }}>
      {/* Status Bar giả lập */}
      <div style={{ background: methodColor, padding: '0.5rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: '700', opacity: 0.9 }}>
          {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <div style={{ background: 'white', borderRadius: '2px', fontSize: '0.65rem', color: methodColor, padding: '0 6px', fontWeight: '800' }}>DEMO</div>
        <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: '700', opacity: 0.9 }}>🔋 100%</span>
      </div>

      {/* App Header */}
      <div style={{ background: methodColor, padding: '1rem 1.2rem 2.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.7rem', marginBottom: '1.2rem' }}>
          <div style={{ width: '38px', height: '38px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={methodIcon} style={{ width: '26px', objectFit: 'contain' }} alt="" />
          </div>
          <span style={{ color: 'white', fontWeight: '900', fontSize: '1.2rem', letterSpacing: '0.3px' }}>{methodName} Pay</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', fontWeight: '600', margin: '0 0 0.8rem' }}>Yêu cầu thanh toán từ</p>
        <h2 style={{ color: 'white', fontSize: '1.3rem', fontWeight: '900', margin: '0 0 0.3rem', letterSpacing: '-0.3px' }}>RIDE FREEDOM MOTORS</h2>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '0.3rem 0.8rem', marginTop: '0.3rem' }}>
          <ShieldCheck size={12} color="white" />
          <span style={{ color: 'white', fontSize: '0.72rem', fontWeight: '700' }}>Đối tác đã xác minh</span>
        </div>
      </div>

      {/* Payment Card */}
      <div style={{ margin: '-1.5rem 1rem 0', background: 'white', borderRadius: '24px', padding: '1.8rem', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', position: 'relative', zIndex: 1 }}>
        {/* Số tiền chính */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.4rem' }}>Số tiền cần thanh toán</p>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-2px', margin: 0 }}>
            {transaction?.amount?.toLocaleString()}
            <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#64748b', marginLeft: '4px' }}>đ</span>
          </h1>
        </div>

        {/* Chi tiết giao dịch */}
        {[
          ['Nguồn tiền', 'Ví ' + methodName],
          ['Mục đích', 'Nạp ví Ride Freedom'],
          ['Mã GD', `#${id?.slice(-8).toUpperCase()}`],
          ['Thời hạn', '10 phút'],
        ].map(([label, value], i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.7rem 0', borderBottom: i < 3 ? '1px dashed #f8fafc' : 'none' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600' }}>{label}</span>
            <span style={{ color: '#1e293b', fontSize: '0.875rem', fontWeight: '800' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Nút xác nhận */}
      <div style={{ padding: '1.5rem 1rem 0.5rem' }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setStep('pin')}
          style={{
            width: '100%', padding: '1.3rem', borderRadius: '18px', border: 'none',
            background: `linear-gradient(135deg, ${methodColor}, ${methodColor}cc)`,
            color: 'white', fontSize: '1.05rem', fontWeight: '900',
            boxShadow: `0 12px 30px ${methodColor}40`, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem'
          }}
        >
          <Zap size={18} fill="white" />
          Xác nhận thanh toán
        </motion.button>

        <button
          style={{ width: '100%', padding: '1rem', marginTop: '0.8rem', borderRadius: '18px', border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer' }}
          onClick={() => window.history.back()}
        >
          Huỷ bỏ
        </button>
      </div>

      {/* Security Footer */}
      <div style={{ padding: '1rem 1.5rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '600' }}>
          <Lock size={12} />
          <span>Bảo mật bởi {methodName} · PCI-DSS · SSL 256-bit</span>
        </div>
      </div>
    </div>
  );
}
