import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // 1. Nếu không có user, ngắt kết nối hiện tại (nếu có)
    if (!user) {
      if (socketRef.current) {
        console.log('[Socket] User logged out, disconnecting...');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    // 2. Nếu đã có kết nối cho User này rồi thì không tạo mới (tránh bị trùng khi React re-render)
    if (socketRef.current?.connected && socketRef.current?.userId === user._id) {
      return;
    }

    // 3. Khởi tạo URL backend động (hỗ trợ cả localhost và IP mạng nội bộ)
    const backendUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:5000'
      : `http://${window.location.hostname}:5000`;

    console.log(`[Socket] Connecting to ${backendUrl} for ${user.role}...`);

    const newSocket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      // Quan trọng: giúp xử lý tốt khi mở nhiều tab
      closeOnBeforeunload: true
    });

    newSocket.userId = user._id; // Lưu ID để đối soát
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log(`[Socket] Connected! ID: ${newSocket.id}`);
      if (user.role === 'ADMIN') {
        newSocket.emit('join_admin_room');
      }
    });

    const playNotificationSound = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        // Tạo âm thanh "tinh tinh" sang trọng (2 nốt)
        const playBeep = (frequency, startTime, duration) => {
          const oscillator = ctx.createOscillator();
          const gainNode = ctx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(frequency, startTime);
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        };

        const now = ctx.currentTime;
        playBeep(880, now, 0.25);       // Nốt A5
        playBeep(1320, now + 0.18, 0.3); // Nốt E6
      } catch (e) {}
    };

    const handleNotification = (data) => {
      const { title, message, status } = data;

      // Phát âm thanh thông báo
      playNotificationSound();

      const toastOptions = {
        duration: 5000,
        style: {
          borderRadius: '12px',
          background: '#fff',
          color: 'var(--text-primary)',
          border: `1px solid ${getStatusColor(status)}`,
          padding: '1rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }
      };

      if (status === 'success') toast.success(`${title}: ${message}`, toastOptions);
      else if (status === 'error') toast.error(`${title}: ${message}`, toastOptions);
      else toast(`${title}: ${message}`, toastOptions);

      // Bắn sự kiện để các component khác (như Dropdown) cập nhật
      window.dispatchEvent(new CustomEvent('new-notif-received', { detail: data }));
    };

    newSocket.on('new_notification', handleNotification);
    newSocket.on(`notification_${user._id}`, handleNotification);

    newSocket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    const getStatusColor = (status) => {
      switch (status) {
        case 'success': return 'var(--success)';
        case 'error': return 'var(--danger)';
        case 'warning': return 'var(--warning)';
        default: return 'var(--accent-primary)';
      }
    };

    // Cleanup: Chỉ gỡ bỏ các sự kiện nghe, không đóng socket chính ở đây 
    // để tránh việc "kết nối - ngắt kết nối" liên tục khi dùng React Strict Mode
    return () => {
      if (newSocket) {
        newSocket.off('new_notification', handleNotification);
        newSocket.off(`notification_${user._id}`, handleNotification);
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
