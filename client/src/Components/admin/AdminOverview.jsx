import React from 'react';
import { motion } from 'framer-motion';
import { Bar, Doughnut } from 'react-chartjs-2';
import { FaUsers, FaStore, FaBox, FaList, FaShoppingCart } from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const AdminOverview = ({ sellers, products, users, categories, orders, setActiveSection, loading }) => {
  const overviewChartData = {
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
  };

  const statusChartData = {
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
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 14 } } },
      title: { display: true, text: 'Dashboard Overview', font: { size: 18, weight: '600' } },
    },
    scales: { y: { beginAtZero: true } },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 14 } } },
      title: { display: true, text: 'Seller Status', font: { size: 18, weight: '600' } },
    },
  };

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
              onClick={() => setActiveSection(stat.section)}
              className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-3 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <stat.icon className={`text-2xl ${stat.color}`} />
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-xl font-bold text-gray-800">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          variants={fadeIn}
          className="bg-blue-50 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Bar data={overviewChartData} options={chartOptions} />
        </motion.div>
        <motion.div
          variants={fadeIn}
          className="bg-blue-50 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Doughnut data={statusChartData} options={doughnutOptions} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminOverview;