import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, Legend
} from 'recharts';
import { 
  Users, Bike, ClipboardCheck, TrendingUp, 
  AlertCircle, CheckCircle2, Download, ArrowUpRight, ArrowDownRight,
  Package, LayoutDashboard, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const COLORS = ['#00f0ff', '#7000ff', '#00e676', '#ffb300', '#ff5252'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [topVehicles, setTopVehicles] = useState([]);
  const [statusChart, setStatusChart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ovRes, chartRes, topRes, finRes] = await Promise.all([
        api.get('/admin/stats/overview'),
        api.get('/admin/stats/revenue-chart'),
        api.get('/admin/stats/top-vehicles'),
        api.get('/admin/stats/financials')
      ]);

      setStats(ovRes.stats);
      setRevenueData(chartRes.revenueData);
      setTopVehicles(topRes.topVehicles);
      
      // Format status stats for PieChart
      const statusData = finRes.orderStats.map(s => ({
        name: s._id,
        value: s.count
      }));
      setStatusChart(statusData);

    } catch (err) {
      console.error('Fetch stats failed:', err);
      toast.error('Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    // Export combined total revenue for clear reports
    const data = revenueData.map(d => ({ 
      'Ngày': d._id, 
      'Tiền thuê (VNĐ)': d.amount,
      'Phí sàn (VNĐ)': d.platformFee,
      'Tiền cọc mất (VNĐ)': d.forfeited,
      'Tổng cộng (VNĐ)': d.total
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Doanh Thu Thực Tế");
    XLSX.writeFile(workbook, `Bao_Cao_RideFreedom_${new Date().toLocaleDateString()}.xlsx`);
    toast.success('Đã xuất báo cáo thực tế thành công!');
  };

  if (loading || !stats) return (
     <div className="flex-center" style={{ height: '80vh', flexDirection: 'column' }}>
        {loading ? (
          <>
            <div className="spinner"></div>
            <p style={{ marginTop: '2rem', color: 'var(--text-secondary)' }}>Đang tổng hợp dữ liệu Elite...</p>
          </>
        ) : (
          <p style={{ color: 'var(--error)' }}>Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.</p>
        )}
     </div>
  );

  const statCards = [
    { label: 'Doanh thu ròng tháng', value: `${stats.totalRevenueMonth.toLocaleString()}đ`, growth: stats.revenueGrowth, icon: TrendingUp, color: '#00f0ff' },
    { label: 'Đơn mới hôm nay', value: stats.newOrdersToday, icon: ClipboardCheck, color: '#7000ff', badge: 'Mới' },
    { label: 'User mới tháng', value: stats.newUsersMonth, growth: stats.userGrowth, icon: Users, color: '#00e676' },
    { label: 'Xe đang thuê', value: stats.rentingVehicles, icon: Bike, color: '#ffb300' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ paddingBottom: '5rem' }}
    >
      <div className="flex-between" style={{ marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: '900' }}>Hệ thống Quản trị v2.0</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Phân tích chuyên sâu & Điều hành dữ liệu thực.</p>
        </div>
        <div className="flex-center" style={{ gap: '1rem' }}>
           <button onClick={fetchDashboardData} className="btn btn-secondary" style={{ padding: '0.75rem' }}>
              <History size={20} />
           </button>
           <button onClick={exportToExcel} className="btn btn-primary" style={{ gap: '0.8rem' }}>
              <Download size={18} /> Xuất báo cáo
           </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ gap: '1.5rem', marginBottom: '3rem' }}>
        {statCards.map((card, i) => (
          <motion.div 
            key={i}
            className="glass-card" 
            style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}
            whileHover={{ y: -5 }}
          >
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
               <div style={{ padding: '10px', background: `${card.color}15`, borderRadius: '12px' }}>
                  <card.icon color={card.color} size={24} />
               </div>
               {card.growth !== undefined && (
                  <span style={{ 
                     fontSize: '0.8rem', 
                     color: card.growth >= 0 ? '#00e676' : '#ff5252',
                     display: 'flex', alignItems: 'center', gap: '2px',
                     background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '20px'
                  }}>
                     {card.growth >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                     {Math.abs(card.growth)}%
                  </span>
               )}
               {card.badge && <span className="badge" style={{ background: 'var(--accent-primary)', color: 'white' }}>{card.badge}</span>}
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '0.5rem' }}>{card.value}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Stats Area */}
      <div className="grid-3" style={{ gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
        {/* Revenue Chart */}
        <div className="glass-card" style={{ padding: '2.5rem' }}>
           <div className="flex-between" style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                 <TrendingUp size={20} color="var(--accent-primary)" /> Doanh thu 7 ngày qua (Dữ liệu thực)
              </h3>
           </div>
           <div style={{ height: '350px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={revenueData}>
                    <defs>
                       <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorFee" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00e676" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00e676" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorForfeit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff5252" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ff5252" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="_id" stroke="var(--text-secondary)" axisLine={false} tickLine={false} />
                    <YAxis stroke="var(--text-secondary)" axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
                    <Tooltip 
                       contentStyle={{ background: '#0a0a0f', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
                       itemStyle={{ fontSize: '0.8rem' }}
                    />
                    <Legend verticalAlign="top" align="right" height={36}/>
                    <Area name="Tiền thuê" type="monotone" dataKey="amount" stroke="#00f0ff" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={3} />
                    <Area name="Phí sàn" type="monotone" dataKey="platformFee" stroke="#00e676" fillOpacity={1} fill="url(#colorFee)" strokeWidth={3} />
                    <Area name="Tiền cọc mất" type="monotone" dataKey="forfeited" stroke="#ff5252" fillOpacity={1} fill="url(#colorForfeit)" strokeWidth={3} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Status Distribution */}
        <div className="glass-card" style={{ padding: '2.5rem' }}>
           <h3 style={{ marginBottom: '2.5rem' }}>Tỉ lệ Đơn hàng</h3>
           <div style={{ height: '280px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                       data={statusChart}
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                    >
                       {statusChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ background: '#0a0a0f', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                 </PieChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Bottom Area */}
      <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
         {/* Top Vehicles */}
         <div className="glass-card" style={{ padding: '2.5rem' }}>
            <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
               <Bike size={20} color="var(--accent-secondary)" /> Top Xe Phổ Biến
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               {topVehicles.map((v, i) => (
                  <div key={i}>
                     <div className="flex-between" style={{ marginBottom: '0.8rem' }}>
                        <span style={{ fontWeight: '600' }}>{v.vehicle.name}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{v.count} lượt thuê</span>
                     </div>
                     <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                        <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${(v.count / topVehicles[0].count) * 100}%` }}
                           transition={{ duration: 1, delay: i * 0.1 }}
                           style={{ height: '100%', background: COLORS[i % COLORS.length] }}
                        />
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Quick Actions / Pending Requests */}
         <div className="glass-card" style={{ padding: '2.5rem' }}>
            <h3 style={{ marginBottom: '2.5rem' }}>Việc cần xử lý ngay</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
               <div className="flex-between" style={{ padding: '1.2rem', background: 'rgba(255,23,68,0.05)', borderRadius: '16px', border: '1px solid rgba(255,23,68,0.1)' }}>
                  <div className="flex-center" style={{ gap: '1rem' }}>
                     <AlertCircle color="#ff5252" size={20} />
                     <div>
                        <p style={{ fontWeight: '600' }}>Duyệt Hồ sơ KYC</p>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stats.pendingKYC} hồ sơ mới chờ xác minh</span>
                     </div>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#ff5252' }} onClick={() => window.location.href='/admin/kyc'}>Xử lý</button>
               </div>
               
               <div className="flex-between" style={{ padding: '1.2rem', background: 'rgba(112,0,255,0.05)', borderRadius: '16px', border: '1px solid rgba(112,0,255,0.1)' }}>
                  <div className="flex-center" style={{ gap: '1rem' }}>
                     <Package color="#7000ff" size={20} />
                     <div>
                        <p style={{ fontWeight: '600' }}>Duyệt Đơn hàng</p>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stats.pendingOrders} đơn hàng đang chờ duyệt</span>
                     </div>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#7000ff' }} onClick={() => window.location.href='/admin/orders'}>Xét duyệt</button>
               </div>

               <div className="flex-between" style={{ padding: '1.2rem', background: 'rgba(0,230,118,0.05)', borderRadius: '16px', border: '1px solid rgba(0,230,118,0.1)' }}>
                  <div className="flex-center" style={{ gap: '1rem' }}>
                     <CheckCircle2 color="#00e676" size={20} />
                     <div>
                        <p style={{ fontWeight: '600' }}>Bàn giao xe</p>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stats.confirmedOrders} xe đã sẵn sàng bàn giao</span>
                     </div>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#00e676' }} onClick={() => window.location.href='/admin/orders'}>Giao xe</button>
               </div>

               <div className="flex-between" style={{ padding: '1.2rem', background: 'rgba(255,179,0,0.05)', borderRadius: '16px', border: '1px solid rgba(255,179,0,0.1)' }}>
                  <div className="flex-center" style={{ gap: '1rem' }}>
                     <ArrowUpRight color="#ffb300" size={20} />
                     <div>
                        <p style={{ fontWeight: '600' }}>Duyệt bài đăng Chợ</p>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stats.pendingMarketplace} bài đăng đang chờ duyệt</span>
                     </div>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#ffb300' }} onClick={() => window.location.href='/admin/marketplace'}>Xử lý bài</button>
               </div>

               <div className="flex-between" style={{ padding: '1.2rem', background: 'rgba(0,240,255,0.05)', borderRadius: '16px', border: '1px solid rgba(0,240,255,0.1)' }}>
                  <div className="flex-center" style={{ gap: '1rem' }}>
                     <History color="#00f0ff" size={20} />
                     <div>
                        <p style={{ fontWeight: '600' }}>Duyệt rút tiền</p>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stats.pendingWithdrawals} yêu cầu rút tiền mới</span>
                     </div>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#00f0ff' }} onClick={() => window.location.href='/admin/transactions'}>Thanh toán</button>
               </div>
            </div>
         </div>
      </div>
    </motion.div>
  );
}
