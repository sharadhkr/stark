// ✅ NO OTHER CHANGES in logic unless clearly mentioned
// ✅ Removed `jsx` from <style> tag
// ✅ Minor style cleanup

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, User, ShoppingCart, Heart } from 'lucide-react';
import { TbCategory } from 'react-icons/tb';
import AIAssistantModal from './Category';

const BottomNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [ripples, setRipples] = useState({});
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const tabs = useMemo(() => [
    { path: '/', icon: 
    <img className='w-7 h-7 opacity-80' src="	https://img.icons8.com/?size=48&id=OXVih02dFZ53&format=png" alt="" />, filledIcon: 
    <img className='w-7 h-7 opacity-80' src="https://img.icons8.com/?size=48&id=zUlQIRAWidll&format=png" alt="" />, color: '#3B82F6' },
    { path: '/cart', icon: 
    <img className='w-7 h-7 opacity-80' src="	https://img.icons8.com/?size=48&id=ySRi3OLgoOJX&format=png" alt="" />, filledIcon: 
    <img className='w-7 h-7 opacity-80' src="	https://img.icons8.com/?size=48&id=Uwwgm0gp3DTA&format=png" alt="" />, color: '#10B981' },
    { path: '/categories', icon: 
    <img className='w-7 h-7 opacity-80' src="https://img.icons8.com/?size=48&id=TrmgSRmieiWQ&format=png" alt="" />, filledIcon: 
    <img className='w-7 h-7 opacity-80' src="https://img.icons8.com/?size=48&id=xbseVGfaGt5M&format=png" alt="" />, isModal: true, color: '#8B5CF6' },
    { path: '/wishlist', icon: 
    <img className='w-7 h-7 opacity-80' src="	https://img.icons8.com/?size=48&id=feQIjQlsqvSv&format=png" alt="" />, filledIcon: 
    <img className='w-7 h-7 opacity-80' src="https://img.icons8.com/?size=48&id=0Na5Uhhuwejm&format=png" alt="" />, color: '#EF4440' },
    { path: '/dashboard', icon: 
    <img className='w-7 h-7 opacity-80' src="	https://img.icons8.com/?size=48&id=AZazdsitsrgg&format=png" alt="" />, filledIcon: 
    <img className='w-7 h-7 opacity-80' src="https://img.icons8.com/?size=48&id=rGhKliUp2Vji&format=png" alt="" />, color: '#F97316' },
  ], []);

  useEffect(() => {
    const currentIndex = tabs.findIndex((tab) => tab.path === location.pathname);
    setActiveIndex(isCategoryModalOpen ? 2 : currentIndex !== -1 ? currentIndex : -1);
  }, [location.pathname, isCategoryModalOpen, tabs]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) setIsVisible(false);
      else if (currentScrollY < lastScrollY || currentScrollY <= 50) setIsVisible(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const createRipple = useCallback((index) => {
    setRipples(prev => ({ ...prev, [index]: Date.now() }));
    setTimeout(() => {
      setRipples(prev => {
        const newRipples = { ...prev };
        delete newRipples[index];
        return newRipples;
      });
    }, 600);
  }, []);

  const handleTabClick = useCallback(
    (tab, index) => {
      const protectedRoutes = ['/cart', '/wishlist', '/dashboard'];
      const token = localStorage.getItem('token');
      createRipple(index);

      if (protectedRoutes.includes(tab.path) && !token) {
        console.log('No token found, redirecting to login');
        navigate('/login');
        return;
      }

      if (tab.isModal) {
        setIsCategoryModalOpen(true);
        setActiveIndex(2);
      } else if (location.pathname !== tab.path) {
        setIsCategoryModalOpen(false);
        setActiveIndex(index);
        navigate(tab.path);
      }
    },
    [navigate, location.pathname, createRipple]
  );

  return (
    <>
      <div className={`fixed bottom-0 left-0 w-full flex justify-center z-40 transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="relative w-full max-w-md bg-gray-100/90 backdrop-blur-xl rounded-t-2xl shadow-[0px_-10px_32px_rgba(0,0,0,0.12)] border border-gray-200/50 overflow-hidden">
          <div className="relative flex justify-around items-center py-2 px-2">
            {tabs.map((tab, index) => {
              const isActive = index === activeIndex;
              const hasRipple = ripples[index];
              return (
                <div
                  key={tab.path}
                  onClick={() => handleTabClick(tab, index)}
                  className="relative flex items-center justify-center p-3 cursor-pointer group"
                  role="button"
                  tabIndex={0}
                  aria-label={`Navigate to ${tab.path}`}
                  onKeyDown={(e) => e.key === 'Enter' && handleTabClick(tab, index)}
                >
                  {hasRipple && (
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-0 opacity-20 rounded-full animate-ping"
                        style={{ backgroundColor: tab.color, animationDuration: '0.6s' }}
                      />
                    </div>
                  )}

                  <div
                    className={`relative z-10 transition-all duration-300 ease-in-out transform ${isActive
                      ? ''
                      : 'text-gray-400 hover:text-gray-600'
                      }`}
                    style={{
                      color: isActive ? tab.color : undefined,
                      filter: isActive ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' : undefined
                    }}
                  >
                    <div
                      className={`transition-transform duration-200 ${isActive ? 'ease-in-out' : ''}`}
                      style={{
                        animationDuration: isActive ? '0.6s' : '0s',
                        animationIterationCount: '1'
                      }}
                    >
                      {isActive ? tab.filledIcon : tab.icon}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AIAssistantModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          const currentIndex = tabs.findIndex((tab) => tab.path === location.pathname);
          setActiveIndex(currentIndex !== -1 ? currentIndex : -1);
        }}
      />

      {/* ✅ Fixed: Removed `jsx` prop here */}
      <style>{`
        @keyframes gentlePulse {
          0%, 100% {
            opacity: 0.15;
          }
          50% {
            opacity: 0.25;
          }
        }

        @keyframes bounceIn {
          0% { transform: scale(0.3) translateY(-4px); opacity: 0; }
          50% { transform: scale(1.05) translateY(-4px); }
          70% { transform: scale(0.9) translateY(-4px); }
          100% { transform: scale(1) translateY(-4px); opacity: 1; }
        }

        .group:hover .group-hover\\:scale-105 { transform: scale(1.05); }
        .group:active .active\\:scale-95 { transform: scale(0.95); }

        .backdrop-blur-xl {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
      `}</style>
    </>
  );
};

export default React.memo(BottomNavbar);
