import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bar, Doughnut } from 'react-chartjs-2';
import { FaUsers, FaStore, FaBox, FaList, FaShoppingCart, FaSpinner } from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import useAdminAuth from '../../hooks/useAdminAuth';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const AdminOverview = ({ sellers = [], products = [], users = [], categories = [], orders = [], setActiveSection, loading }) => {
  const { isAdmin, error, checkAdmin } = useAdminAuth();

  // Memoize chart data to prevent unnecessary recalculations
  const overviewChartData = useMemo(() => ({
    labels: ['Sellers', 'Products', 'Users', 'Categories', 'Orders'],
    datasets: [
      {
        label: 'Count',
        data: [sellers.length, products.length, users.length, categories.length, orders.length],
        backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#FF5722'],
        borderColor: ['#388E3C', '#1976D2', '#F57C00', '#7B1FA2', '#D84315'],
        borderRadius: 8,
      },
    ],
  }), [sellers, products, users, categories, orders]);

  const statusChartData = useMemo(() => ({
    labels: ['Enabled Sellers', 'Disabled Sellers'],
    datasets: [
      {
        data: [
          sellers.filter((s) => s.status === 'enabled').length,
          sellers.filter((s) => s.status === 'disabled').length,
        ],
        backgroundColor: ['#4CAF50', '#F44336'],
        borderWidth: 1,
      },
    ],
  }), [sellers]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 14 } } },
      title: { display: true, text: 'Dashboard Overview', font: { size: 18, weight: '600' } },
      tooltip: { enabled: true },
    },
    scales: { y: { beginAtZero: true, title: { display: true, text: 'Count' } } },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 14 } } },
      title: { display: true, text: 'Seller Status', font: { size: 18, weight: '600' } },
      tooltip: { enabled: true },
    },
  };

  // Validate props
  const isValidData = Array.isArray(sellers) && Array.isArray(products) && Array.isArray(users) &&
                     Array.isArray(categories) && Array.isArray(orders);
  if (!isValidData) {
    console.error('Invalid data props:', { sellers, products, users, categories, orders });
    return (
      <div className="text-red-600 p-6 bg-red-50 rounded-2xl shadow-md">
        Error: Invalid dashboard data. Please try refreshing the page.
      </div>
    );
  }

  // Render loading state
  if (isAdmin === null || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-blue-600 text-4xl" />
      </div>
    );
  }

  // Render access denied state
  if (isAdmin === false) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-2xl shadow-md">
        <h3 className="text-lg font-semibold text-red-700">Unable to Access Overview</h3>
        <p className="text-sm text-red-600 mb-4">{error || 'Please try again later.'}</p>
        <motion.button
          onClick={checkAdmin}
          whileHover={{ scale: 1.05 }}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-200"
        >
          Retry
        </motion.button>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
      <motion.div
        variants={fadeIn}
        className="bg-blue-50 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
      >
        <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { icon: FaStore, title: 'Sellers', value: sellers.length, section: 'sellers', color: 'text-green-600' },
            { icon: FaBox, title: 'Products', value: products.length, section: 'products', color: 'text-blue-600' },
            { icon: FaUsers, title: 'Users', value: users.length, section: 'users', color: 'text-orange-600' },
            { icon: FaList, title: 'Categories', value: categories.length, section: 'categories', color: 'text-purple-600' },
            { icon: FaShoppingCart, title: 'Orders', value: orders.length, section: 'orders', color: 'text-red-600' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveSection(stat.section)}
              className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-3 hover:shadow-md transition-all duration-200 cursor-pointer relative group"
              aria-label={`View ${stat.title} section`}
              title={`View ${stat.title}`}
            >
              <stat.icon className={`text-2xl ${stat.color}`} />
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-xl font-bold text-gray-800">{stat.value}</p>
              </div>
              <span className="absolute hidden group-hover:block bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded-md">
                {stat.title}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          variants={fadeIn}
          className="bg-blue-50 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
          role="region"
          aria-label="Overview bar chart"
        >
          <Bar data={overviewChartData} options={chartOptions} />
        </motion.div>
        <motion.div
          variants={fadeIn}
          className="bg-blue-50 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
          role="region"
          aria-label="Seller status doughnut chart"
        >
          <Doughnut data={statusChartData} options={doughnutOptions} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminOverview;