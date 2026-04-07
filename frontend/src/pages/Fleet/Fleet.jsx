import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { Search, Filter, Star, Tag, ChevronRight, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SkeletonCard = () => (
  <div className="glass-card" style={{ padding: '1rem', height: '420px' }}>
    <div className="skeleton" style={{ width: '100%', height: '220px', borderRadius: '12px', marginBottom: '1.5rem' }}></div>
    <div className="flex-between" style={{ marginBottom: '1rem' }}>
       <div className="skeleton" style={{ width: '60px', height: '20px' }}></div>
       <div className="skeleton" style={{ width: '100px', height: '25px' }}></div>
    </div>
    <div className="skeleton" style={{ width: '80%', height: '30px', marginBottom: '1rem' }}></div>
    <div className="skeleton" style={{ width: '50%', height: '15px', marginBottom: '2rem' }}></div>
    <div className="skeleton" style={{ width: '100%', height: '45px', borderRadius: 'var(--border-radius-pill)' }}></div>
  </div>
);

export default function Fleet() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  
  const [filters, setFilters] = useState({
    name: searchParams.get('name') || '',
    categoryId: searchParams.get('categoryId') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = { page: currentPage, limit: 6 };
        Object.keys(filters).forEach(key => {
          if (filters[key]) params[key] = filters[key];
        });

        const [vRes, cRes] = await Promise.all([
          api.get('/fleet/vehicles', { params }),
          api.get('/fleet/categories')
        ]);
        
        setVehicles(vRes.vehicles);
        setPagination(vRes.pagination);
        setCategories(cRes.categories || []);
      } catch (err) {
        console.error(err);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };
    fetchData();
  }, [filters, currentPage]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(name, value);
    else newParams.delete(name);
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setFilters({ name: '', categoryId: '', brand: '', minPrice: '', maxPrice: '' });
    setSearchParams({});
    setCurrentPage(1);
  };

  const getBikeImage = (v) => {
     if (v.images?.[0] && !v.images[0].includes('placeholder')) return v.images[0];
     if (v.brand === 'Honda' && v.name.includes('Vision')) return 'honda_vision_elegant_white_1775322698498.png';
     if (v.brand === 'Honda' && v.name.includes('SH')) return 'featured_sh_mode_luxury_1775322188322.png';
     if (v.brand === 'Yamaha' && v.name.includes('Exciter')) return 'yamaha_exciter_premium_1775322605719.png';
     if (v.brand === 'Ducati' || v.name.includes('Panigale')) return 'ducati_panigale_red_glory_1775322630660.png';
     return 'hero_motorbike_neon_1775322140611.png';
  };

  return (
    <div className="container" style={{ paddingTop: '5rem', paddingBottom: '8rem' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '5rem', textAlign: 'center' }}>
         <h1 className="text-gradient" style={{ fontSize: '4rem', fontWeight: '900', letterSpacing: '-2px' }}>
           {pagination.total > 0 && vehicles.some(v => v.status === 'RENTING')
             ? `${vehicles.filter(v => v.status === 'RENTING').length} xe đang được thuê`
             : `Đội xe Ride Freedom`}
         </h1>
         <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
           {pagination.total}+ mẫu xe sẵn sàng cho hành trình của bạn
           {vehicles.some(v => v.status === 'RENTING') && (
             <span style={{ marginLeft: '0.8rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '2px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
               • {vehicles.filter(v => v.status === 'RENTING').length} đang cho thuê
             </span>
           )}
         </p>
      </motion.div>

      <div className="grid-4" style={{ gap: '3rem', alignItems: 'start' }}>
        <div style={{ gridColumn: 'span 1' }}>
           <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="glass-card" style={{ padding: '2.5rem', position: 'sticky', top: '120px', background: 'rgba(255,255,255,0.015)' }}>
              <div className="flex-between" style={{ marginBottom: '2.5rem' }}>
                 <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}><Filter size={18} color="var(--accent-primary)" /> Bộ lọc</h3>
                 <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><X size={14} /> Xoá</button>
              </div>
              <div style={{ marginBottom: '2.5rem' }}>
                 <label className="form-label">Loại xe</label>
                 <select name="categoryId" className="form-input" style={{ marginTop: '0.8rem' }} value={filters.categoryId} onChange={handleFilterChange}>
                    <option value="">Tất cả phân khúc</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                 </select>
              </div>
              <div style={{ marginBottom: '2.5rem' }}>
                 <label className="form-label">Giá thuê (VND/ngày)</label>
                 <div className="flex-center" style={{ gap: '0.8rem', marginTop: '0.8rem' }}>
                    <input type="number" name="minPrice" placeholder="Từ" className="form-input" value={filters.minPrice} onChange={handleFilterChange} />
                    <input type="number" name="maxPrice" placeholder="Đến" className="form-input" value={filters.maxPrice} onChange={handleFilterChange} />
                 </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                 <label className="form-label">Thương hiệu</label>
                 <select name="brand" className="form-input" style={{ marginTop: '0.8rem' }} value={filters.brand} onChange={handleFilterChange}>
                    <option value="">Tất cả hãng</option>
                    {['Honda', 'Yamaha', 'Piaggio', 'Ducati', 'Kawasaki', 'Suzuki'].map(b => <option key={b} value={b}>{b}</option>)}
                 </select>
              </div>
           </motion.div>
        </div>

        <div style={{ gridColumn: 'span 3' }}>
           <div className="glass-card flex-center" style={{ padding: '0.8rem 1.5rem', marginBottom: '3rem', borderRadius: 'var(--border-radius-pill)' }}>
              <Search size={22} color="var(--text-secondary)" />
              <input name="name" placeholder="Khám phá mẫu xe ước mơ của bạn..." className="form-input" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }} value={filters.name} onChange={handleFilterChange} />
           </div>

           <div className="grid-3" style={{ gap: '2.5rem' }}>
              <AnimatePresence mode="popLayout">
                 {loading ? (
                    [1,2,3,4,5,6].map(i => <motion.div key={i}><SkeletonCard/></motion.div>)
                 ) : vehicles.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ gridColumn: 'span 3', textAlign: 'center', padding: '5rem' }}>
                       <X size={48} color="var(--text-muted)" style={{ marginBottom: '1.5rem' }} />
                       <h3>Dòng xe này hiện đã "hết hàng"</h3>
                       <p style={{ color: 'var(--text-secondary)' }}>Hãy thử điều chỉnh lại bộ lọc để khám phá thêm nhiều lựa chọn khác.</p>
                    </motion.div>
                 ) : (
                    vehicles.map((v) => {
                      const isRenting = v.status === 'RENTING';
                      return (
                        <motion.div
                          key={v._id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.3 }}
                          className="glass-card"
                          style={{ padding: '1.2rem', position: 'relative', overflow: 'visible' }}
                          whileHover={{ y: -12 }}
                        >
                          {/* Ảnh xe */}
                          <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem', height: '240px' }}>
                            <img
                              src={getBikeImage(v)}
                              alt={v.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isRenting ? 'brightness(0.82)' : 'none', transition: 'filter 0.3s' }}
                            />

                            {/* Badge "Đang cho thuê" - chỉ hiện khi RENTING */}
                            {isRenting && (
                              <div style={{
                                position: 'absolute', top: 12, left: 12, zIndex: 5,
                                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                color: 'white', padding: '0.3rem 0.85rem',
                                borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800',
                                letterSpacing: '0.04em', textTransform: 'uppercase',
                                boxShadow: '0 3px 12px rgba(239,68,68,0.5)',
                                display: 'flex', alignItems: 'center', gap: '6px'
                              }}>
                                <span style={{
                                  width: '6px', height: '6px', borderRadius: '50%',
                                  background: 'white', display: 'inline-block'
                                }}></span>
                                Đang cho thuê
                              </div>
                            )}

                            {/* Rating badge */}
                            <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(5, 5, 8, 0.8)', padding: '0.4rem 0.8rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.4rem', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)' }}>
                              <Star size={14} color="#FFD700" fill="#FFD700" />
                              <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{v.avgRating || 5.0}</span>
                            </div>

                            {/* Category badge */}
                            <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                              <span className="badge" style={{ background: 'var(--accent-gradient)', color: 'white' }}>{v.categoryId?.name}</span>
                            </div>
                          </div>

                          {/* Tên xe & Giá */}
                          <div className="flex-between" style={{ marginBottom: '1.2rem' }}>
                            <h3 style={{ fontSize: '1.3rem', letterSpacing: '-0.5px' }}>{v.name}</h3>
                            <p style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--accent-primary)' }}>
                              {(v.pricePerDay || 0).toLocaleString()} <small style={{ fontSize: '0.65rem' }}>đ/N</small>
                            </p>
                          </div>

                          {/* Thông số */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', marginBottom: '1.8rem' }}>
                            <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              <Tag size={14} /> {v.brand}
                            </div>
                            <div className="flex-center" style={{ justifyContent: 'flex-end', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              <Zap size={14} /> {v.specs?.engine || '125cc'}
                            </div>
                          </div>

                          {/* Button */}
                          <Link
                            to={isRenting ? '#' : `/vehicle/${v._id}`}
                            className={`btn ${isRenting ? 'btn-secondary' : 'btn-primary'}`}
                            style={{
                              width: '100%', textDecoration: 'none', justifyContent: 'center',
                              borderRadius: '14px', pointerEvents: isRenting ? 'none' : 'auto',
                              opacity: isRenting ? 0.65 : 1
                            }}
                          >
                            {isRenting ? '🔴 Đang được thuê' : 'Thuê xe'}
                            {!isRenting && <ChevronRight size={18} />}
                          </Link>
                        </motion.div>
                      );
                    })
                 )}
              </AnimatePresence>
           </div>

           {pagination.pages > 1 && (
              <div className="flex-center" style={{ marginTop: '5rem', gap: '0.8rem' }}>
                 <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn btn-secondary" style={{ padding: '0.8rem 1.5rem', borderRadius: '12px' }}>Trước</button>
                 {[...Array(pagination.pages)].map((_, i) => (
                    <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`btn ${currentPage === i + 1 ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>{i + 1}</button>
                 ))}
                 <button onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))} disabled={currentPage === pagination.pages} className="btn btn-secondary" style={{ padding: '0.8rem 1.5rem', borderRadius: '12px' }}>Sau</button>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
