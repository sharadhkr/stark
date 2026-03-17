import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEdit, FaUser } from 'react-icons/fa';
import ProfileForm from './ProfileForm';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const Profile = ({ seller, setSeller, loading }) => {
  const [showProfileForm, setShowProfileForm] = useState(false);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="bg-blue-50 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
    >
      {loading ? (
        <div className="text-center text-gray-600 animate-pulse text-lg">Loading profile...</div>
      ) : (
        seller && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {seller.profilePicture ? (
                <img
                  src={seller.profilePicture}
                  alt={seller.name}
                  className="w-20 h-20 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-2xl">
                  <FaUser />
                </div>
              )}
              <div className="text-center sm:text-left space-y-1">
                <h3 className="text-xl font-semibold text-gray-800">{seller.name}</h3>
                <p className="text-sm text-gray-600">Shop: {seller.shopName}</p>
                <p className="text-sm text-gray-600">Phone: {seller.phoneNumber}</p>
                <p className="text-sm text-gray-600">Address: {seller.address}</p>
                <p className="text-sm text-gray-600">Payment ID: {seller.paymentId || 'Not set'}</p>
                <p className="text-sm text-gray-600">Aadhar ID: {seller.aadharId || 'Not set'}</p>
                <p className="text-sm text-gray-600">
                  Status:{' '}
                  <span
                    className={
                      seller.status === 'enabled'
                        ? 'text-emerald-600'
                        : seller.status === 'pending'
                        ? 'text-amber-600'
                        : 'text-red-600'
                    }
                  >
                    {seller.status}
                  </span>
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-medium text-gray-700">Payment Details</h4>
              <p className="text-sm text-gray-600">
                Bank Account:{' '}
                {seller.paymentDetails?.bankAccount?.accountNumber
                  ? `${seller.paymentDetails.bankAccount.accountNumber} (IFSC: ${seller.paymentDetails.bankAccount.ifscCode})`
                  : 'Not set'}
              </p>
              <p className="text-sm text-gray-600">
                UPI ID: {seller.paymentDetails?.upiId || 'Not set'}
              </p>
              <p className="text-sm text-gray-600">
                Razorpay Account: {seller.paymentDetails?.razorpayAccountId || 'Not set'}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-medium text-gray-700">Revenue Breakdown</h4>
              <p className="text-sm text-gray-600">
                Total Revenue: ₹{seller.revenue?.total.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">
                Online Payments: ₹{seller.revenue?.online.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">COD Payments: ₹{seller.revenue?.cod.toFixed(2)}</p>
              <p className="text-sm text-gray-600">
                Pending COD: ₹{seller.revenue?.pendingCod.toFixed(2)}
              </p>
            </div>
            <motion.button
              onClick={() => setShowProfileForm(true)}
              whileHover={{ scale: 1.05 }}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all duration-200 shadow-sm mx-auto sm:mx-0"
              aria-label="Edit profile"
            >
              <FaEdit /> Edit Profile
            </motion.button>
          </div>
        )
      )}
      {showProfileForm && (
        <ProfileForm seller={seller} setSeller={setSeller} onClose={() => setShowProfileForm(false)} />
      )}
    </motion.div>
  );
};

export default Profile;