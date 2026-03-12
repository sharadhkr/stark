// components/HorizontalProductRow.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';           // ← assuming react-router
import { IoChevronForward } from 'react-icons/io5';

interface Product {
  _id: string;
  name: string;
  price: number;
  image?: string;
  // slug?: string;        // optional – better for routing
  // discountPrice?: number;
}

interface HorizontalProductRowProps {
  title: string;
  products: Product[];          // ← better to pass products as prop
  category?: string;            // optional – can be used for "View All" link
  loading?: boolean;
  error?: string | null;
  onSeeAll?: () => void;
}

const HorizontalProductRow: React.FC<HorizontalProductRowProps> = ({
  title,
  products = [],
  category,
  loading = false,
  error = null,
  onSeeAll,
}) => {
  // Optional: you can generate a "see all" link if you have category slug
  const seeAllLink = category ? `/category/${category}` : undefined;

  if (loading) {
    return (
      <section className="py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array(5).fill(0).map((_, i) => (
            <div
              key={i}
              className="min-w-[180px] sm:min-w-[220px] flex-shrink-0 animate-pulse"
            >
              <div className="w-full h-44 bg-gray-200 rounded-xl" />
              <div className="h-4 bg-gray-200 rounded mt-3 w-4/5" />
              <div className="h-4 bg-gray-200 rounded mt-2 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
        <p className="text-red-600">Failed to load products: {error}</p>
      </section>
    );
  }

  if (products.length === 0) {
    return null; // or show "No products found"
  }

  return (
    <section className="py-6 md:py-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
          {title}
        </h2>

        {(seeAllLink || onSeeAll) && (
          <Link
            to={seeAllLink || '#'}
            onClick={onSeeAll}
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-sm md:text-base group"
          >
            View All
            <IoChevronForward
              className="transition-transform group-hover:translate-x-1"
              size={18}
            />
          </Link>
        )}
      </div>

      <div className="relative">
        <div
          className={`
            flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto pb-4 scrollbar-thin
            scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400
            snap-x snap-mandatory scroll-smooth
          `}
        >
          {products.map((product) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4 }}
              className="min-w-[180px] sm:min-w-[200px] md:min-w-[220px] flex-shrink-0 snap-start"
            >
              <Link
                to={`/product/${product._id}`} // ← adjust according to your routing
                className="block group"
              >
                <div className="relative overflow-hidden rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                  <img
                    src={product.image || 'https://placehold.co/300x300?text=No+Image'}
                    alt={product.name}
                    className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                <div className="mt-3 px-1">
                  <h3 className="text-sm md:text-base font-medium text-gray-800 line-clamp-2 group-hover:text-indigo-700 transition-colors">
                    {product.name}
                  </h3>

                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-base md:text-lg font-semibold text-gray-900">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    {/* {product.discountPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                    )} */}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HorizontalProductRow;