import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  DollarSign, Download, FileText,
  ArrowUpRight, ShoppingBag, Percent 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export default function FinancialStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState({ startDate: '', endDate: '' });
  const [chartData, setChartData] = useState([]);

  const fetchFinancials = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dates.startDate) params.startDate = dates.startDate;
      if (dates.endDate) params.endDate = dates.endDate;
      const [finRes, chartRes] = await Promise.all([
        api.get('/admin/stats/financials', { params }),
        api.get('/admin/stats/revenue-chart', { params })
      ]);
      setStats(finRes);
      setChartData(chartRes.revenueData);
    } catch (err) {
      toast.error('Không thể tải báo cáo tài chính');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, [dates]);

  // In PDF - chỉ in phần tài chính (ẩn sidebar, nav, biểu đồ)
  const handlePrintPDF = () => {
    const style = document.createElement('style');
    style.id = 'print-override';
    style.innerHTML = `
      @media print {
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body > *:not(.print-target) { display: none !important; }
        .no-print, nav, aside, .admin-sidebar { display: none !important; }
        .print-target { display: block !important; }
        .print-financial-only { display: block !important; page-break-inside: avoid; }
        .print-hide { display: none !important; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => { const el = document.getElementById('print-override'); if (el) el.remove(); }, 1000);
  };

  // Xuất Excel báo cáo chi tiết từng đơn
  const handleExportExcel = async () => {
    try {
      toast.loading('Đang tổng hợp dữ liệu...', { id: 'export' });
      const params = {};
      if (dates.startDate) params.startDate = dates.startDate;
      if (dates.endDate) params.endDate = dates.endDate;
      
      // Lấy đơn hoàn tất trong khoảng thời gian
      const res = await api.get('/admin/orders', { params: { ...params, status: 'COMPLETED', limit: 500 } });
      const completedOrders = res.orders || [];
      
      // Lấy thêm đơn bị hủy (để tính tiền cọc mất)
      const cancelRes = await api.get('/admin/orders', { params: { ...params, status: 'CANCELLED', limit: 500 } });
      const cancelledOrders = (cancelRes.orders || []).filter(o => o.paymentStatus === 'PAID');

      // Sheet 1: Đơn hoàn thành
      const completedRows = completedOrders.map(o => {
        const days = Math.ceil((new Date(o.endDate) - new Date(o.startDate)) / (1000 * 60 * 60 * 24)) || 1;
        const rentalFee = (o.totalAmount || 0) - (o.depositAmount || 0);
        return {
          'Mã đơn': o.orderCode,
          'Khách hàng': o.userId?.fullName || 'N/A',
          'Tên xe': o.vehicleId?.name || 'N/A',
          'Ngày nhận xe': new Date(o.startDate).toLocaleDateString('vi-VN'),
          'Ngày trả xe': new Date(o.endDate).toLocaleDateString('vi-VN'),
          'Số ngày thuê': days,
          'Tiền thuê xe (đ)': rentalFee,
          'Tiền cọc (đ)': o.depositAmount || 0,
          'Tổng thu (đ)': o.totalAmount || 0,
          'Phương thức': o.paymentMethod,
          'Trạng thái': 'Hoàn thành'
        };
      });

      // Sheet 2: Đơn bị hủy (mất cọc)
      const cancelledRows = cancelledOrders.map(o => ({
        'Mã đơn': o.orderCode,
        'Khách hàng': o.userId?.fullName || 'N/A',
        'Tên xe': o.vehicleId?.name || 'N/A',
        'Ngày đặt': new Date(o.createdAt).toLocaleDateString('vi-VN'),
        'Tiền cọc thu được (đ)': o.depositAmount || 0,
        'Ghi chú': 'Hủy sau khi đã thanh toán - Mất cọc'
      }));

      // Sheet 3: Tổng kết
      const summaryRows = [
        { 'Hạng mục': 'Doanh thu thuê xe', 'Số tiền (đ)': stats?.rentalRevenue || 0, 'Ghi chú': 'Từ đơn hoàn thành' },
        { 'Hạng mục': 'Tiền cọc thu từ đơn hủy', 'Số tiền (đ)': stats?.forfeitedDeposits || 0, 'Ghi chú': 'Đơn bị hủy sau thanh toán' },
        { 'Hạng mục': 'Phí sàn Marketplace (10%)', 'Số tiền (đ)': stats?.platformFees || 0, 'Ghi chú': 'Phí chuyển nhượng suất cọc' },
        { 'Hạng mục': '═══ TỔNG CỘNG ═══', 'Số tiền (đ)': stats?.totalCombined || 0, 'Ghi chú': 'Tổng doanh thu nền tảng' }
      ];

      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.json_to_sheet(completedRows);
      const ws2 = XLSX.utils.json_to_sheet(cancelledRows);
      const ws3 = XLSX.utils.json_to_sheet(summaryRows);

      // Column widths
      ws1['!cols'] = [14,20,20,14,14,10,16,14,14,12,14].map(w => ({ wch: w }));
      ws3['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 35 }];

      XLSX.utils.book_append_sheet(wb, ws3, '📊 Tổng kết');
      XLSX.utils.book_append_sheet(wb, ws1, '✅ Đơn hoàn thành');
      XLSX.utils.book_append_sheet(wb, ws2, '❌ Đơn bị hủy (mất cọc)');

      const period = dates.startDate ? `${dates.startDate}_${dates.endDate}` : 'toan_he_thong';
      XLSX.writeFile(wb, `BaoCaoTaiChinh_RideFreedom_${period}.xlsx`);
      toast.success('Đã xuất báo cáo Excel!', { id: 'export' });
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xuất báo cáo', { id: 'export' });
    }
  };

  if (!stats && loading) return <div className="flex-center" style={{ height: '60vh' }}>Đang tải báo cáo...</div>;

  return (
    <div className="print-target">
      <div className="flex-between no-print" style={{ marginBottom: '2.5rem' }}>
        <h1 className="text-gradient">Báo cáo tài chính</h1>
        <div className="flex-center" style={{ gap: '1rem' }}>
           <input 
             type="date" className="form-input" style={{ marginBottom: 0, width: '150px' }}
             value={dates.startDate} onChange={(e) => setDates({...dates, startDate: e.target.value})}
           />
           <span style={{ color: 'var(--text-secondary)' }}>đến</span>
           <input 
             type="date" className="form-input" style={{ marginBottom: 0, width: '150px' }}
             value={dates.endDate} onChange={(e) => setDates({...dates, endDate: e.target.value})}
           />
           <button className="btn btn-secondary" onClick={handlePrintPDF}>
             <FileText size={18} /> In PDF
           </button>
           <button className="btn btn-primary" onClick={handleExportExcel}>
             <Download size={18} /> Xuất báo cáo Excel
           </button>
        </div>
      </div>

      {/* Print header - only visible when printing */}
      <div className="print-financial-only" style={{ display: 'none', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #333' }}>
        <h2 style={{ margin: 0 }}>🏍️ RIDE FREEDOM — BÁO CÁO TÀI CHÍNH</h2>
        <p style={{ margin: '0.5rem 0 0', color: '#666' }}>
          Khoảng thời gian: {dates.startDate ? `${dates.startDate} đến ${dates.endDate}` : 'Toàn bộ hệ thống'} 
          &nbsp;|&nbsp; Xuất lúc: {new Date().toLocaleString('vi-VN')}
        </p>
      </div>

      <div className="grid-4" style={{ gap: '1.2rem', marginBottom: '3rem' }}>
         <div className="glass-card" style={{ padding: '1.8rem', borderLeft: '5px solid var(--accent-primary)', minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p className="form-label" style={{ fontSize: '0.9rem' }}>Doanh thu thuê xe</p>
            <h2 style={{ fontSize: '1.8rem', whiteSpace: 'nowrap' }}>{(stats?.rentalRevenue || 0).toLocaleString()}đ</h2>
            <div className="flex-center" style={{ justifyContent: 'flex-start', color: 'var(--success)', marginTop: '0.8rem', gap: '0.5rem', fontSize: '0.85rem' }}>
               <ShoppingBag size={14} /> <span>Từ đơn hoàn thành</span>
            </div>
         </div>
         <div className="glass-card" style={{ padding: '1.8rem', borderLeft: '5px solid var(--success)', minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p className="form-label" style={{ fontSize: '0.9rem' }}>Phí sàn (Marketplace)</p>
            <h2 style={{ fontSize: '1.8rem', whiteSpace: 'nowrap' }}>{(stats?.platformFees || 0).toLocaleString()}đ</h2>
            <div className="flex-center" style={{ justifyContent: 'flex-start', color: 'var(--accent-primary)', marginTop: '0.8rem', gap: '0.5rem', fontSize: '0.85rem' }}>
               <Percent size={14} /> <span>10% phí transfer</span>
            </div>
         </div>
         <div className="glass-card" style={{ padding: '1.8rem', borderLeft: '5px solid var(--warning)', minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p className="form-label" style={{ fontSize: '0.9rem' }}>Tiền cọc thu được</p>
            <h2 style={{ fontSize: '1.8rem', whiteSpace: 'nowrap' }}>{(stats?.forfeitedDeposits || 0).toLocaleString()}đ</h2>
            <div className="flex-center" style={{ justifyContent: 'flex-start', color: 'var(--error)', marginTop: '0.8rem', gap: '0.5rem', fontSize: '0.85rem' }}>
               <ArrowUpRight size={14} /> <span>Từ đơn hàng bị hủy</span>
            </div>
         </div>
         <div className="glass-card" style={{ padding: '1.8rem', borderLeft: '5px solid #fff', background: 'var(--accent-gradient)', minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p className="form-label" style={{ fontSize: '0.9rem', color: 'white' }}>Tổng doanh thu</p>
            <h2 style={{ fontSize: '1.8rem', color: 'white', whiteSpace: 'nowrap' }}>{(stats?.totalCombined || 0).toLocaleString()}đ</h2>
            <div className="flex-center" style={{ justifyContent: 'flex-start', color: 'white', marginTop: '0.8rem', gap: '0.5rem', fontSize: '0.85rem', opacity: 0.9 }}>
               <DollarSign size={14} /> <span>Lợi nhuận gộp</span>
            </div>
         </div>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem' }}>
         <div className="glass-card" style={{ padding: '2.5rem' }}>
            <h3 style={{ marginBottom: '2rem' }}>Xu hướng tăng trưởng ({dates.startDate ? 'Tùy chỉnh' : '7 ngày'})</h3>
            <div style={{ width: '100%', height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRental" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorForfeited" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--error)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--error)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}tr` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                    formatter={(value) => value.toLocaleString() + 'đ'}
                  />
                  <Legend verticalAlign="top" align="right" height={36}/>
                  <Area name="Tiền thuê" type="monotone" dataKey="rental" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorRental)" strokeWidth={3} />
                  <Area name="Phí sàn" type="monotone" dataKey="fees" stroke="var(--success)" fillOpacity={1} fill="url(#colorFees)" strokeWidth={3} />
                  <Area name="Tiền cọc mất" type="monotone" dataKey="forfeited" stroke="var(--error)" fillOpacity={1} fill="url(#colorForfeited)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

         <div className="glass-card no-print" style={{ padding: '2.5rem' }}>
            <h3 style={{ marginBottom: '2rem' }}>Quy tắc Vận hành & Tài chính</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
               <div style={{ paddingLeft: '1rem', borderLeft: '3px solid var(--accent-primary)' }}>
                  <p style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>✓ Doanh thu thuê xe</p>
                  <p>Tính từ tổng tiền khách trả trừ đi tiền cọc đã hoàn lại khi trả xe thành công.</p>
               </div>
               <div style={{ paddingLeft: '1rem', borderLeft: '3px solid var(--error)' }}>
                  <p style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>✓ Doanh thu từ tiền cọc</p>
                  <p>Phát sinh khi khách hàng chủ động hủy đơn hoặc vi phạm chính sách dẫn đến mất cọc.</p>
               </div>
               <div style={{ paddingLeft: '1rem', borderLeft: '3px solid var(--success)' }}>
                  <p style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>✓ Phí sàn Marketplace</p>
                  <p>10% giá trị mỗi giao dịch trao đổi cọc thành công trên sàn Marketplace.</p>
               </div>
               <div style={{ paddingLeft: '1rem', borderLeft: '3px solid var(--warning)' }}>
                  <p style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>✓ Xuất báo cáo Excel</p>
                  <p>Bấm "Xuất báo cáo Excel" để tải file chi tiết từng giao dịch (ngày thuê, phí cọc, tiền thuê, tổng cộng).</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
