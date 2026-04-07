import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { 
  Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, 
  History, ShieldCheck, Zap, ChevronRight,
  Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Wallet() {
  const { user, setUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('DEPOSIT');
  const [depositStep, setDepositStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingTxId, setPendingTxId] = useState(null);

  // QR countdown
  const [countdown, setCountdown] = useState(600);
  const [qrExpired, setQrExpired] = useState(false);

  useEffect(() => {
    if (socket && user) {
      const eventName = `payment_success_${user._id}`;
      socket.on(eventName, (data) => {
        toast.success(data.message);
        setShowModal(false);
        setAmount('');
        fetchData();
      });
      return () => socket.off(eventName);
    }
  }, [socket, user]);

  useEffect(() => {
    fetchData();
  }, []);

  // Countdown timer khi hiển thị QR
  useEffect(() => {
    if (depositStep !== 2 || !pendingTxId) return;
    setCountdown(600);
    setQrExpired(false);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); setQrExpired(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [depositStep, pendingTxId]);

  const formatCountdown = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  // Tạo URL thanh toán để điện thoại mở khi quét QR
  // Dùng VITE_APP_URL (IP máy tính trong mạng LAN) từ .env.local
  const getPaymentUrl = (txId) => {
    const base = import.meta.env.VITE_APP_URL ||
      `${window.location.protocol}//${window.location.hostname}:${window.location.port || '5173'}`;
    return `${base}/simulate-payment/${txId}`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, transRes] = await Promise.all([
        api.get('/users/profile'),
        api.get('/transactions/wallet/history')
      ]);
      setUser(userRes.user);
      setTransactions(transRes.transactions);
    } catch (err) {
      toast.error('Không thể tải thông tin ví');
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const handleDeposit = async () => {
    if (!amount || amount < 10000) return toast.error('Số tiền nạp tối thiểu là 10,000đ');
    setModalType('DEPOSIT');
    setDepositStep(1);
    setShowModal(true);
  };

  const handleWithdraw = async () => {
    if (!amount || amount < 50000) return toast.error('Số tiền rút tối thiểu là 50,000đ');
    if (amount > user.walletBalance) return toast.error('Số dư không đủ để thực hiện yêu cầu');
    setModalType('WITHDRAW');
    setShowModal(true);
  };

  const submitWithdraw = async () => {
    try {
      setIsProcessing(true);
      await api.post('/transactions/wallet/withdraw', { amount: Number(amount) });
      toast.success('Yêu cầu rút tiền đã được gửi! Đang chờ Admin xử lý.');
      setShowModal(false);
      setAmount('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Yêu cầu thất bại');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (qrExpired) {
      // Tạo lại QR mới
      setDepositStep(1);
      setQrExpired(false);
      return;
    }
    try {
      setIsProcessing(true);
      await api.post(`/transactions/wallet/process-payment/${pendingTxId}`);
      toast.success('🎉 Nạp tiền thành công!');
      setShowModal(false);
      setAmount('');
      setDepositStep(1);
      fetchData();
    } catch (e) {
      toast.error('Giao dịch thất bại');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch(type) {
      case 'DEPOSIT': return <Plus size={18} color="var(--success)" />;
      case 'PAY': return <ArrowUpRight size={18} color="var(--danger)" />;
      case 'REFUND': return <ArrowDownLeft size={18} color="var(--success)" />;
      case 'WITHDRAW': return <Banknote size={18} color="var(--danger)" />;
      case 'RECEIVE': return <Zap size={18} color="var(--success)" />;
      default: return <History size={18} />;
    }
  };

  const getTransactionLabel = (type) => {
    const labels = {
      DEPOSIT: 'Nạp tiền vào ví',
      PAY: 'Thanh toán thuê xe',
      REFUND: 'Hoàn tiền thuê xe',
      WITHDRAW: 'Rút tiền về ngân hàng',
      RECEIVE: 'Tiền bán suất cọc'
    };
    return labels[type] || 'Giao dịch khác';
  };

  const PAYMENT_METHODS = [
    { id: 'momo', name: 'MoMo', color: '#ae2070', icon: 'https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png' },
    { id: 'vnpay', name: 'VNPay', color: '#005baa', icon: 'https://vnpay.vn/wp-content/uploads/2020/07/Logo-VNPAYIPN.png' }
  ];

  return (
    <div className="container" style={{ paddingTop: '5rem', paddingBottom: '8rem', background: 'var(--bg-primary)' }}>
      <div className="grid-2" style={{ gap: '5rem', alignItems: 'start' }}>
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '3rem', color: 'var(--text-primary)', letterSpacing: '-1.5px' }}>Ví Tiền <span className="text-gradient">Của Tôi</span></h1>
          
          <div className="glass-card" style={{ background: 'white', border: '1px solid #e2e8f0', padding: '3rem', borderRadius: '32px', position: 'relative', overflow: 'hidden', marginBottom: '3.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.04)' }}>
            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '300px', height: '300px', background: 'var(--accent-primary)', filter: 'blur(120px)', opacity: 0.05 }}></div>
            <div className="flex-between" style={{ marginBottom: '4rem' }}>
              <div className="flex-center" style={{ gap: '1rem' }}>
                <div style={{ width: '50px', height: '50px', background: 'var(--accent-primary)', borderRadius: '14px', boxShadow: '0 8px 15px rgba(79, 70, 229, 0.2)' }} className="flex-center">
                  <WalletIcon color="white" size={24} />
                </div>
                <span style={{ fontWeight: '800', fontSize: '1.2rem', letterSpacing: '0.5px', color: 'var(--text-primary)' }}>RIDE FREEDOM PLATINUM</span>
              </div>
              <ShieldCheck size={32} color="var(--accent-primary)" style={{ opacity: 0.3 }} />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.8rem', fontWeight: 'bold' }}>Số dư khả dụng</p>
            <h2 style={{ fontSize: '4.5rem', fontWeight: '900', margin: 0, letterSpacing: '-3px', color: 'var(--text-primary)' }}>
              {(user?.walletBalance ?? 0).toLocaleString()} <small style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>VNĐ</small>
            </h2>
          </div>

          <div className="glass-card" style={{ padding: '3rem', background: 'white', border: '1px solid #f1f5f9' }}>
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label" style={{ color: '#64748b', fontWeight: '600', marginBottom: '0.8rem', display: 'block' }}>Nhập số tiền giao dịch (VNĐ)</label>
              <input
                type="number" className="form-input" placeholder="Nhập số tiền..." value={amount} onChange={(e) => setAmount(e.target.value)}
                style={{ fontSize: '1.3rem', padding: '1.2rem', fontWeight: '700' }}
              />
            </div>
            <div className="grid-2" style={{ gap: '1.5rem' }}>
              <button onClick={handleDeposit} className="btn btn-primary" style={{ padding: '1.4rem', fontSize: '1rem', borderRadius: '16px' }}>
                Nạp tiền ngay <ArrowDownLeft size={18} style={{ marginLeft: '8px' }} />
              </button>
              <button onClick={handleWithdraw} className="btn btn-secondary" style={{ padding: '1.4rem', fontSize: '1rem', borderRadius: '16px', background: '#f8fafc', borderColor: '#e2e8f0' }}>
                Rút tiền mặt <ArrowUpRight size={18} style={{ marginLeft: '8px' }} />
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <h3 style={{ marginBottom: '3rem', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', color: '#1e293b' }}><History color="var(--accent-primary)" /> Lịch sử biến động</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {transactions.length === 0 ? (
              <div className="glass-card flex-center" style={{ padding: '5rem', flexDirection: 'column', color: 'var(--text-muted)', background: 'white' }}>
                <History size={48} style={{ marginBottom: '1.5rem', opacity: 0.1 }} />
                <p>Chưa có giao dịch nào.</p>
              </div>
            ) : (
              transactions.map((t, index) => (
                <motion.div key={t._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="glass-card"
                  style={{ padding: '1.5rem 2rem', background: 'white', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
                  <div className="flex-between">
                    <div className="flex-center" style={{ gap: '1.5rem' }}>
                      <div style={{ width: '45px', height: '45px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }} className="flex-center">{getTransactionIcon(t.type)}</div>
                      <div>
                        <p style={{ fontWeight: '700', color: '#1e293b' }}>{getTransactionLabel(t.type)}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: '900', fontSize: '1.2rem', color: ['DEPOSIT', 'REFUND', 'RECEIVE'].includes(t.type) ? 'var(--success)' : 'var(--danger)' }}>
                        {['DEPOSIT', 'REFUND', 'RECEIVE'].includes(t.type) ? '+' : '-'}{t.amount.toLocaleString()}đ
                      </p>
                      <span className={`badge badge-${t.status === 'SUCCESS' ? 'success' : t.status === 'PENDING' ? 'warning' : 'error'}`} style={{ fontSize: '0.65rem' }}>{t.status}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="flex-center" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(255,255,255,0.85)', zIndex: 1000, backdropFilter: 'blur(12px)' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="glass-card"
              style={{ width: '90%', maxWidth: '460px', padding: '2.5rem', position: 'relative', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 50px 100px -20px rgba(0,0,0,0.15)', maxHeight: '92vh', overflowY: 'auto' }}
            >
              <button onClick={() => { setShowModal(false); setDepositStep(1); }} style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', width: '32px', height: '32px', borderRadius: '50%', fontWeight: '700', fontSize: '1rem' }}>✕</button>

              {modalType === 'DEPOSIT' ? (
                depositStep === 1 ? (
                  /* BƯỚC 1: Chọn phương thức */
                  <>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                      <h2 style={{ fontSize: '1.6rem', color: '#0f172a', fontWeight: '900' }}>Chọn phương thức nạp</h2>
                      <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.3rem' }}>Số tiền: <strong style={{ color: '#0f172a' }}>{Number(amount).toLocaleString()}đ</strong></p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                      {PAYMENT_METHODS.map(method => (
                        <button key={method.id}
                          onClick={async () => {
                            setSelectedMethod(method);
                            try {
                              setIsProcessing(true);
                              const res = await api.post('/transactions/wallet/initiate-mock', { amount: Number(amount), paymentMethod: method.name });
                              setPendingTxId(res.transactionId);
                              setDepositStep(2);
                            } catch(err) { toast.error('Khởi tạo thất bại'); }
                            finally { setIsProcessing(false); }
                          }}
                          disabled={isProcessing}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.4rem 1.8rem', borderRadius: '18px', border: '2px solid #f1f5f9', background: '#fafafa', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = method.color; e.currentTarget.style.background = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.background = '#fafafa'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                            <div style={{ width: '52px', height: '52px', background: 'white', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
                              <img src={method.icon} style={{ width: '36px', objectFit: 'contain' }} alt={method.name} />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                              <p style={{ fontWeight: '800', fontSize: '1.1rem', color: '#1e293b', margin: 0 }}>{method.name} Pay</p>
                              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0, fontWeight: '600' }}>Quét QR · Không cần IP</p>
                            </div>
                          </div>
                          <ChevronRight size={20} color="#cbd5e1" />
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  /* BƯỚC 2: QR Code Premium */
                  <div style={{ textAlign: 'center' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
                      <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' }}>
                        <img src={selectedMethod?.icon} style={{ width: '28px', objectFit: 'contain' }} alt="" />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontWeight: '900', fontSize: '1rem', color: '#0f172a', margin: 0 }}>{selectedMethod?.name} Pay</p>
                        <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600', margin: 0 }}>Quét mã để thanh toán</p>
                      </div>
                    </div>

                    {/* Số tiền */}
                    <div style={{ background: `linear-gradient(135deg, ${selectedMethod?.color}12, ${selectedMethod?.color}08)`, borderRadius: '16px', padding: '0.9rem 1.8rem', marginBottom: '1rem', border: `1px solid ${selectedMethod?.color}20` }}>
                      <p style={{ fontSize: '0.7rem', color: selectedMethod?.color, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.2rem' }}>Số tiền nạp</p>
                      <p style={{ fontSize: '2rem', fontWeight: '900', color: selectedMethod?.color, letterSpacing: '-1px', margin: 0 }}>{Number(amount).toLocaleString()}<span style={{ fontSize: '0.85rem', marginLeft: '3px' }}>đ</span></p>
                    </div>

                    {/* Timer */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                      <div style={{
                        background: qrExpired ? '#fee2e2' : countdown < 60 ? '#fef3c7' : '#f0fdf4',
                        color: qrExpired ? '#dc2626' : countdown < 60 ? '#d97706' : '#16a34a',
                        padding: '0.3rem 1rem', borderRadius: '999px', fontWeight: '800', fontSize: '0.85rem',
                        border: `1px solid ${qrExpired ? '#fca5a5' : countdown < 60 ? '#fcd34d' : '#86efac'}`
                      }}>
                        {qrExpired ? '⏰ QR đã hết hạn' : `⏱ Hết hạn sau ${formatCountdown(countdown)}`}
                      </div>
                    </div>

                    {/* QR Code */}
                    {!qrExpired ? (
                      <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.2rem' }}>
                        <div style={{
                          background: 'white', borderRadius: '24px', padding: '16px',
                          border: `2px solid ${selectedMethod?.color}30`,
                          boxShadow: `0 20px 60px ${selectedMethod?.color}20, 0 4px 20px rgba(0,0,0,0.06)`
                        }}>
                          {/* Góc khung */}
                          {[
                            { top: 6, left: 6, borderTop: `3px solid ${selectedMethod?.color}`, borderLeft: `3px solid ${selectedMethod?.color}` },
                            { top: 6, right: 6, borderTop: `3px solid ${selectedMethod?.color}`, borderRight: `3px solid ${selectedMethod?.color}` },
                            { bottom: 6, left: 6, borderBottom: `3px solid ${selectedMethod?.color}`, borderLeft: `3px solid ${selectedMethod?.color}` },
                            { bottom: 6, right: 6, borderBottom: `3px solid ${selectedMethod?.color}`, borderRight: `3px solid ${selectedMethod?.color}` },
                          ].map((s, i) => (
                            <div key={i} style={{ position: 'absolute', width: '20px', height: '20px', borderRadius: '3px', ...s }} />
                          ))}

                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&ecc=H&data=${encodeURIComponent(getPaymentUrl(pendingTxId))}`}
                            style={{ width: '200px', height: '200px', display: 'block', borderRadius: '8px' }}
                            alt="QR thanh toán"
                            onError={(e) => { e.target.src = `https://quickchart.io/qr?text=${encodeURIComponent(getPaymentUrl(pendingTxId))}&size=200`; }}
                          />

                          {/* Logo giữa QR */}
                          <div style={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                            width: '40px', height: '40px', background: 'white', borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)', border: '2px solid #f1f5f9'
                          }}>
                            <img src={selectedMethod?.icon} style={{ width: '26px', objectFit: 'contain' }} alt="" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '2rem', marginBottom: '1.2rem', background: '#fef2f2', borderRadius: '18px', border: '1px dashed #fca5a5' }}>
                        <p style={{ fontSize: '2.2rem', margin: '0 0 0.4rem' }}>⏰</p>
                        <p style={{ color: '#dc2626', fontWeight: '700', margin: 0 }}>Mã QR đã hết hạn</p>
                      </div>
                    )}

                    {/* Hướng dẫn */}
                    <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '0.9rem 1.2rem', marginBottom: '1.2rem', textAlign: 'left', border: '1px solid #f1f5f9' }}>
                      {[
                        `Mở app ${selectedMethod?.name} → Chọn "Quét mã"`,
                        'Hướng camera vào QR bên trên',
                        'Xác nhận thanh toán trên điện thoại rồi bấm nút bên dưới'
                      ].map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start', marginBottom: i < 2 ? '0.5rem' : 0 }}>
                          <div style={{ width: '20px', height: '20px', background: selectedMethod?.color || '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'white', fontWeight: '900', flexShrink: 0, marginTop: '2px' }}>{i+1}</div>
                          <p style={{ fontSize: '0.83rem', color: '#475569', margin: 0, fontWeight: '600', lineHeight: '1.5' }}>{step}</p>
                        </div>
                      ))}
                    </div>

                    {/* Nút xác nhận */}
                    <button
                      onClick={handleConfirmPayment}
                      disabled={isProcessing}
                      style={{
                        width: '100%', padding: '1.1rem', borderRadius: '14px', border: 'none',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        background: qrExpired ? '#e2e8f0' : `linear-gradient(135deg, ${selectedMethod?.color}, ${selectedMethod?.color}cc)`,
                        color: qrExpired ? '#94a3b8' : 'white', fontSize: '1rem', fontWeight: '900',
                        boxShadow: qrExpired ? 'none' : `0 10px 25px ${selectedMethod?.color}40`, letterSpacing: '0.5px',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isProcessing ? '⏳ Đang xử lý...' : qrExpired ? '🔄 Tạo lại QR mới' : '✅ Đã thanh toán — Xác nhận'}
                    </button>

                    <p style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '0.6rem', fontWeight: '600' }}>
                      🔒 QR mã hóa thông tin giao dịch · Hoạt động với mọi IP · PCI-DSS
                    </p>
                  </div>
                )
              ) : (
                /* RÚT TIỀN */
                <>
                  <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '2rem', color: '#0f172a' }}>Rút tiền mặt</h2>
                  <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '20px', marginBottom: '2.5rem', border: '1px solid #f1f5f9' }}>
                    <div className="flex-between" style={{ marginBottom: '1rem' }}>
                      <span>Số tiền rút</span>
                      <strong style={{ fontSize: '1.2rem' }}>{Number(amount).toLocaleString()}đ</strong>
                    </div>
                    <div className="flex-between" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <span>Số dư còn lại</span>
                      <span>{(user.walletBalance - amount).toLocaleString()}đ</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: '2.5rem' }}>
                    <label className="form-label">Chọn ngân hàng nhận tiền</label>
                    <select className="form-input" style={{ marginTop: '0.8rem' }}>
                      <option>Vietcombank (***892)</option>
                      <option>MB Bank (***441)</option>
                      <option>Techcombank (***566)</option>
                    </select>
                  </div>
                  <button onClick={submitWithdraw} disabled={isProcessing} className="btn btn-primary" style={{ width: '100%', padding: '1.4rem', borderRadius: '16px' }}>
                    {isProcessing ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN RÚT TIỀN'}
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
