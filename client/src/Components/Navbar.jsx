import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, User, ShoppingCart, Heart } from 'lucide-react';
import { TbCategory } from 'react-icons/tb';
import AIAssistantModal from './AIAssistantModal';

const BottomNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const tabs = [
    { path: '/', icon: <Home className="w-6 h-6" />, label: 'Home' },
    { path: '/cart', icon: <ShoppingCart className="w-6 h-6" />, label: 'Cart' },
    { path: '/categories', icon: <TbCategory className="w-6 h-6" />, label: 'Category', isModal: true },
    { path: '/wishlist', icon: <Heart className="w-6 h-6" />, label: 'Wishlist' },
    { path: '/dashboard', icon: <User className="w-6 h-6" />, label: 'Profile' },
  ];

  // Update active index based on current path or modal state
  useEffect(() => {
    const currentIndex = tabs.findIndex((tab) => tab.path === location.pathname);
    setActiveIndex(isCategoryModalOpen ? 2 : currentIndex !== -1 ? currentIndex : -1);
  }, [location.pathname, isCategoryModalOpen]);

  // Handle tab click (navigation or modal)
  const handleTabClick = useCallback(
    (tab, index) => {
      const protectedRoutes = ['/cart', '/wishlist', '/dashboard'];
      const token = localStorage.getItem('token');

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
    [navigate, location.pathname]
  );

  return (
    <>
      <div className="fixed bottom-4 left-0 w-full flex justify-center z-50 px-4">
        <div className="relative w-[380px] max-w-md h-20 bg-violet-50/80 backdrop-blur-md rounded-3xl shadow-2xl px-4 flex justify-between items-center overflow-visible border border-violet-300">
          {tabs.map((tab, index) => {
            const isActive = index === activeIndex;

            return (
              <div
                key={tab.path}
                onClick={() => handleTabClick(tab, index)}
                className="relative w-16 h-full flex flex-col items-center justify-end mb-3 cursor-pointer group transition-all duration-300"
                role="button"
                tabIndex={0}
                aria-label={tab.label}
                onKeyDown={(e) => e.key === 'Enter' && handleTabClick(tab, index)}
              >
                <div
                  className={`relative z-10 p-2 rounded-full transition-all duration-300 transform ${
                    isActive
                      ? 'bg-violet-200 text-violet-700 scale-110 translate-y-[-8px] shadow-md'
                      : 'text-gray-500 hover:text-violet-700 hover:bg-violet-100'
                  }`}
                >
                  {tab.icon}
                </div>
                <span
                  className={`text-xs mt-0 font-medium transition-all duration-300 ${
                    isActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 group-hover:opacity-80'
                  }`}
                >
                  {tab.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Modal */}
      <AIAssistantModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          const currentIndex = tabs.findIndex((tab) => tab.path === location.pathname);
          setActiveIndex(currentIndex !== -1 ? currentIndex : -1);
        }}
      />
    </>
  );
};

export default React.memo(BottomNavbar);
