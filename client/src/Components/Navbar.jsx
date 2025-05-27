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

  const tabs = useMemo(() => [
    { 
      path: '/', 
      icon: <Home className="w-6 h-6" />, 
      filledIcon: <Home className="w-6 h-6 fill-current" />,
      color: '#3B82F6'
    },
    { 
      path: '/cart', 
      icon: <ShoppingCart className="w-6 h-6" />, 
      filledIcon: <ShoppingCart className="w-6 h-6 fill-current" />,
      color: '#10B981'
    },
    { 
      path: '/categories', 
      icon: <TbCategory className="w-6 h-6" />, 
      filledIcon: <TbCategory className="w-6 h-6 fill-current" />,
      isModal: true,
      color: '#8B5CF6'
    },
    { 
      path: '/wishlist', 
      icon: <Heart className="w-6 h-6" />, 
      filledIcon: <Heart className="w-6 h-6 fill-current" />,
      color: '#EF4440'
    },
    { 
      path: '/dashboard', 
      icon: <User className="w-6 h-6" />, 
      filledIcon: <User className="w-6 h-6 fill-current" />,
      color: '#F97316'
    },
  ], []);

  // Update active index based on current path or modal state
  useEffect(() => {
    const currentIndex = tabs.findIndex((tab) => tab.path === location.pathname);
    setActiveIndex(isCategoryModalOpen ? 2 : currentIndex !== -1 ? currentIndex : -1);
  }, [location.pathname, isCategoryModalOpen, tabs]);

  // Create ripple effect
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

  // Handle tab click with haptic feedback simulation
  const handleTabClick = useCallback(
    (tab, index) => {
      const protectedRoutes = ['/cart', '/wishlist', '/dashboard'];
      const token = localStorage.getItem('token');

      // Create ripple effect
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
      <div className="fixed bottom-0 left-0 w-full flex justify-center z-40">
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
                  {/* Ripple effect */}
                  {hasRipple && (
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-0 opacity-20 rounded-full animate-ping" 
                        style={{
                          backgroundColor: tab.color,
                          animationDuration: '0.6s'
                        }} 
                      />
                    </div>
                  )}

                  {/* Icon with filled state and animations */}
                  <div
                    className={`
                      relative z-10 transition-all duration-300 ease-out transform
                      ${isActive 
                        ? 'scale-125 -translate-y-1' 
                        : 'text-gray-400 hover:text-gray-600 hover:scale-110 active:scale-95'
                      }
                    `}
                    style={{
                      color: isActive ? tab.color : undefined,
                      filter: isActive ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' : undefined
                    }}
                  >
                    <div 
                      className={`transition-transform duration-200 ${isActive ? 'animate-bounce' : ''}`}
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

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes gentlePulse {
          0%, 100% {
            opacity: 0.15;
            transform: scale(1);
          }
          50% {
            opacity: 0.25;
            transform: scale(1.05);
          }
        }

        @keyframes bounceIn {
          0% {
            transform: scale(0.3) translateY(-4px);
            opacity: 0;
          }
          50% {
            transform: scale(1.05) translateY(-4px);
          }
          70% {
            transform: scale(0.9) translateY(-4px);
          }
          100% {
            transform: scale(1) translateY(-4px);
            opacity: 1;
          }
        }

        .animate-bounceIn {
          animation: bounceIn 0.5s ease-out;
        }

        /* Enhanced hover effects */
        .group:hover .group-hover\\:scale-105 {
          transform: scale(1.05);
        }

        .group:active .active\\:scale-95 {
          transform: scale(0.95);
        }

        /* Smooth backdrop blur for better performance */
        .backdrop-blur-xl {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
      `}</style>
    </>
  );
};

export default React.memo(BottomNavbar);