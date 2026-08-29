import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { api } from '../api.js';

const NAV = {
  farmer: [
    { to: '/farmer', label: 'My Listings' },
    { to: '/farmer/orders', label: 'Orders' },
    { to: '/pools', label: 'Bulk Pools' },
    { to: '/prices', label: 'Market Prices' },
  ],
  buyer: [
    { to: '/marketplace', label: 'Marketplace' },
    { to: '/pools', label: 'Bulk Pools' },
    { to: '/buyer/orders', label: 'My Orders' },
    { to: '/prices', label: 'Market Prices' },
  ],
  admin: [
    { to: '/admin', label: 'Overview' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/listings', label: 'Listings' },
    { to: '/admin/orders', label: 'Orders' },
    { to: '/pools', label: 'Bulk Pools' },
  ],
};

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const { cartCount } = useCart();
  const [count, setCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = React.useRef(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!token) return;
    api.get('/notifications', token)
      .then(({ notifications }) => {
        setCount(notifications.filter(n => !n.read).length);
      })
      .catch(() => {});
  }, [token, location.pathname]);

  useEffect(() => {
    const handler = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 20);
      // Hide when scrolling down past 80px, show when scrolling up
      if (currentY > 80) {
        setVisible(currentY < lastScrollY.current);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentY;
    };
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = user ? NAV[user.role] || [] : [{ to: '/marketplace', label: 'Marketplace' }, { to: '/prices', label: 'Market Prices' }];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-500 ${scrolled ? 'bg-black/95 border-white/10 shadow-glow' : 'bg-black/10 border-transparent'} backdrop-blur-2xl ${visible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3.5">
        <Link to="/" className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-white/5 border border-white/10 text-sm font-semibold tracking-tight text-emerald shadow-glow">
            AC
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-ink">AgriConnect Ghana</p>
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Premium agricultural commerce</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-3">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`nav-link-underline rounded-full px-4 py-2 text-sm font-medium transition ${location.pathname === l.to ? 'text-ink' : 'text-muted hover:text-ink'}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {user.role === 'buyer' && (
                <button
                  onClick={() => navigate('/cart')}
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-muted transition hover:border-emerald/40 hover:text-ink"
                  title="Cart"
                >
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald text-[10px] font-bold text-black">{cartCount}</span>
                  )}
                </button>
              )}
              <button
                onClick={() => navigate('/notifications')}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-muted transition hover:border-emerald/40 hover:text-ink"
                title="Notifications"
              >
                <Bell size={20} />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald text-[10px] font-bold text-black">{count}</span>
                )}
              </button>
              <div className="hidden sm:flex flex-col text-right leading-tight">
                <span className="text-sm font-semibold text-ink">{user.name}</span>
                <span className="text-[11px] uppercase tracking-[0.22em] text-emerald">{user.role}</span>
              </div>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted transition hover:border-white/20 hover:text-ink"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:text-ink">
                Log in
              </Link>
              <Link to="/register" className="inline-flex items-center rounded-full bg-emerald text-black px-4 py-2 text-sm font-semibold shadow-glow transition hover:brightness-110">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
