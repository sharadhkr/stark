import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// Mock category data (replace with API call in production)
const categories = [
  {
    id: 'men',
    name: 'Men',
    subcategories: [
      {
        name: 'T-Shirts',
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c',
        path: '/men/tshirts',
      },
      {
        name: 'Jeans',
        image: 'https://images.unsplash.com/photo-1602293589930-45aad59ba4d2',
        path: '/men/jeans',
      },
      {
        name: 'Coats',
        image: 'https://images.unsplash.com/photo-1571513721938-8f5b83b31b8f',
        path: '/men/coats',
      },
      {
        name: 'Shirts',
        image: 'https://images.unsplash.com/photo-1598032895397-b94724487df0',
        path: '/men/shirts',
      },
    ],
  },
  {
    id: 'women',
    name: 'Women',
    subcategories: [
      {
        name: 'Lehenga',
        image: 'https://images.unsplash.com/photo-1593459309898-9e62f3c6e8c2',
        path: '/women/lehenga',
      },
      {
        name: 'Saree',
        image: 'https://images.unsplash.com/photo-1583394778066-9d6c7b0c87f2',
        path: '/women/saree',
      },
      {
        name: 'Kurtas',
        image: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b',
        path: '/women/kurtas',
      },
      {
        name: 'Dresses',
        image: 'https://images.unsplash.com/photo-1588117472013-59bb28a56358',
        path: '/women/dresses',
      },
    ],
  },
  {
    id: 'kids',
    name: 'Kids',
    subcategories: [
      {
        name: 'Boys Clothing',
        image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9',
        path: '/kids/boys-clothing',
      },
      {
        name: 'Girls Clothing',
        image: 'https://images.unsplash.com/photo-1560221328-12fe60f83ab8',
        path: '/kids/girls-clothing',
      },
      {
        name: 'Accessories',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
        path: '/kids/accessories',
      },
    ],
  },
  {
    id: 'top-for-you',
    name: 'Top for You',
    subcategories: [
      {
        name: 'Trending T-Shirts',
        image: 'https://images.unsplash.com/photo-1593032465173-34bdfd27a8db',
        path: '/top-for-you/trending-tshirts',
      },
      {
        name: 'Ethnic Wear',
        image: 'https://images.unsplash.com/photo-1593459309898-9e62f3c6e8c2',
        path: '/top-for-you/ethnic-wear',
      },
      {
        name: 'Sneakers',
        image: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3',
        path: '/top-for-you/sneakers',
      },
    ],
  },
];

const CategoryModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id);

  const handleNavigate = (path) => {
    navigate(path);
    onClose(); // Close the modal after navigation
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed inset-x-0 bottom-0 h-[92vh] bg-violet-50/80 backdrop-blur-md rounded-t-3xl shadow-[0px_-10px_20px_rgba(0,0,0,0.1)] z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-violet-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Shop by Category
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 p-2 rounded-full bg-violet-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col md:flex-row overflow-y-auto">
          {/* Categories Sidebar */}
          <div className="w-full md:w-1/3 bg-violet-100 p-4 border-b md:border-b-0 md:border-r border-violet-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Categories
            </h3>
            <div className="flex flex-wrap md:flex-col gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`text-left px-3 py-2 rounded-md transition-all ${
                    selectedCategory === category.id
                      ? 'bg-violet-300 text-violet-800 font-medium'
                      : 'text-gray-700 hover:bg-violet-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategories */}
          <div className="flex-1 p-4 overflow-y-auto">
            {categories.map(
              (category) =>
                selectedCategory === category.id && (
                  <div key={category.id} className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {category.name}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {category.subcategories.map((sub) => (
                        <motion.div
                          key={sub.name}
                          whileHover={{ scale: 1.05 }}
                          className="bg-white rounded-2xl overflow-hidden cursor-pointer"
                          onClick={() => handleNavigate(sub.path)}
                        >
                          <img
                            src={sub.image}
                            alt={sub.name}
                            className="w-full h-20 object-cover"
                          />
                          <div className="p-2 text-center">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {sub.name}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CategoryModal;