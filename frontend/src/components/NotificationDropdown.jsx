import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Info, AlertTriangle, XCircle, ShoppingCart, Wallet, Shield, Users, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function NotificationDropdown({ isAdmin = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const endpoint = isAdmin ? '/api/notifications/admin' : '/api/notifications';
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        // Limit to 50 in UI
        const notifs = response.data.notifications.slice(0, 50);
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleNewNotif = (event) => {
      const newNotif = event.detail;
      setNotifications(prev => [newNotif, ...prev].slice(0, 50));
      setUnreadCount(prev => prev + 1);
    };

    window.addEventListener('new-notif-received', handleNewNotif);
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);

    return () => {
      window.removeEventListener('new-notif-received', handleNewNotif);
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(interval);
    };
  }, [isAdmin]);

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleClick = async (notif) => {
    if (!notif.isRead) await markAsRead(notif._id);
    setIsOpen(false);
    
    // Navigate to relevant admin page based on type
    if (isAdmin) {
      switch (notif.type) {
        case 'ORDER': navigate('/admin/orders'); break;
        case 'VERIFY': navigate('/admin/kyc'); break;
        case 'DEPOSIT_LISTING': navigate('/admin/marketplace'); break;
        case 'WALLET': navigate('/admin/stats'); break;
        case 'SYSTEM': navigate('/admin/users'); break;
        default: break;
      }
    }
  };

  const getTypeIcon = (type, status) => {
    const iconSize = 16;
    const iconStyle = { flexShrink: 0 };
    switch (type) {
      case 'ORDER': return <ShoppingCart size={iconSize} color="#6366f1" style={iconStyle} />;
      case 'VERIFY': return <Shield size={iconSize} color="#f59e0b" style={iconStyle} />;
      case 'DEPOSIT_LISTING': return <Tag size={iconSize} color="#10b981" style={iconStyle} />;
      case 'WALLET': return <Wallet size={iconSize} color="#3b82f6" style={iconStyle} />;
      case 'SYSTEM': return <Users size={iconSize} color="#8b5cf6" style={iconStyle} />;
      default:
        if (status === 'success') return <Check size={iconSize} color="var(--success)" style={iconStyle} />;
        if (status === 'error') return <XCircle size={iconSize} color="var(--danger)" style={iconStyle} />;
        if (status === 'warning') return <AlertTriangle size={iconSize} color="var(--warning)" style={iconStyle} />;
        return <Info size={iconSize} color="var(--accent-primary)" style={iconStyle} />;
    }
  };

  const getTypeBadge = (type) => {
    const badges = {
      ORDER: { label: 'Đơn hàng', color: '#6366f1' },
      VERIFY: { label: 'KYC', color: '#f59e0b' },
      DEPOSIT_LISTING: { label: 'Săn cọc', color: '#10b981' },
      WALLET: { label: 'Tài chính', color: '#3b82f6' },
      SYSTEM: { label: 'Hệ thống', color: '#8b5cf6' },
    };
    return badges[type] || { label: 'Thông báo', color: '#999' };
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="notification-dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        id="admin-notification-bell"
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }}
        style={{ 
          background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
          padding: '8px', borderRadius: '50%', color: 'var(--text-primary)',
          transition: '0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <motion.div
          animate={unreadCount > 0 ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 5 }}
        >
          <Bell size={22} />
        </motion.div>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{ 
              position: 'absolute', top: '2px', right: '2px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white', fontSize: '10px', fontWeight: '800',
              borderRadius: '50%', minWidth: '18px', height: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 2px white, 0 2px 8px rgba(239,68,68,0.5)'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{ 
              position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: '380px',
              background: 'white', borderRadius: '16px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.18)', 
              zIndex: 1001, overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.06)'
            }}
          >
            {/* Header */}
            <div style={{ 
              padding: '1.2rem 1.5rem', 
              background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#1a1a2e' }}>
                  🔔 Thông báo
                </h3>
                {unreadCount > 0 && (
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#6366f1' }}>
                    {unreadCount} chưa đọc
                  </p>
                )}
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  style={{ 
                    border: '1px solid #e0e0ff', background: 'white', color: '#6366f1',
                    fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                    padding: '5px 10px', borderRadius: '8px', transition: '0.2s'
                  }}
                >
                  Đọc tất cả
                </button>
              )}
            </div>

            {/* Notification List */}
            <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#bbb' }}>
                  <Bell size={48} strokeWidth={1} style={{ opacity: 0.3, marginBottom: '0.8rem' }} />
                  <p style={{ fontSize: '0.9rem' }}>Không có thông báo nào</p>
                </div>
              ) : (
                notifications.map((notif, index) => {
                  const badge = getTypeBadge(notif.type);
                  return (
                    <motion.div 
                      key={notif._id || index}
                      onClick={() => handleClick(notif)}
                      whileHover={{ backgroundColor: 'rgba(99,102,241,0.04)' }}
                      style={{ 
                        padding: '1rem 1.5rem',
                        borderBottom: '1px solid rgba(0,0,0,0.04)',
                        background: notif.isRead ? 'transparent' : 'rgba(99,102,241,0.04)',
                        transition: '0.2s', cursor: 'pointer', display: 'flex', gap: '0.9rem',
                        alignItems: 'flex-start'
                      }}
                    >
                      {/* Icon Circle */}
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: `${badge.color}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: '2px'
                      }}>
                        {getTypeIcon(notif.type, notif.status)}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '3px' }}>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase',
                            letterSpacing: '0.05em', color: badge.color,
                            background: `${badge.color}15`, padding: '2px 7px', borderRadius: '20px'
                          }}>{badge.label}</span>
                        </div>
                        <p style={{ 
                          margin: 0, fontSize: '0.87rem', fontWeight: notif.isRead ? '500' : '700',
                          color: '#1a1a2e', lineHeight: '1.4',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {notif.title}
                        </p>
                        <p style={{ margin: '3px 0 5px', fontSize: '0.8rem', color: '#666', lineHeight: '1.3',
                          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {notif.message}
                        </p>
                        <span style={{ fontSize: '0.72rem', color: '#aaa', fontWeight: '500' }}>
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>

                      {/* Unread dot */}
                      {!notif.isRead && (
                        <div style={{ 
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: '#6366f1', flexShrink: 0, marginTop: '8px'
                        }} />
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div style={{ 
                padding: '0.8rem', textAlign: 'center',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                background: '#fafbff'
              }}>
                <span style={{ fontSize: '0.75rem', color: '#aaa' }}>
                  Hiển thị {notifications.length} thông báo gần nhất
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
