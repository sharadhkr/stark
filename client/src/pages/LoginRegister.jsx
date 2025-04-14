// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { useNavigate } from 'react-router-dom'; // Add this import
// import axios from '../axios';
// import toast, { Toaster } from 'react-hot-toast';
// import agroLogo from '../assets/logo.png';

// const countryCodes = [
//   { code: '+91', label: '+91 India' },
//   { code: '+1', label: '🇺🇸 USA' },
//   { code: '+44', label: '🇬🇧 UK' },
//   { code: '+61', label: '🇦🇺 AUS' },
// ];

// const LoginRegister = () => {
//   const [countryCode, setCountryCode] = useState('+91');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [otp, setOtp] = useState(['', '', '', '', '', '']);
//   const [otpSent, setOtpSent] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [token, setToken] = useState('');
//   const otpRefs = useRef([]);
//   const navigate = useNavigate(); // Add this hook

//   const fullPhoneNumber = `${countryCode}${phoneNumber}`;

//   const validatePhoneNumber = (number) => {
//     const num = number.replace(/\D/g, '');
//     if (num.length !== 10) return 'Please enter a valid 10-digit number';
//     if (countryCode === '+91' && !/^[6-9]\d{9}$/.test(num))
//       return 'Invalid India number (must start with 6-9)';
//     if (countryCode === '+1' && !/^\d{10}$/.test(num))
//       return 'Invalid USA number (10 digits)';
//     return '';
//   };

//   const handleApiCall = useCallback(
//     async (callback, successMessage) => {
//       const loadingToast = toast.loading('Processing...');
//       setLoading(true);
//       try {
//         const res = await callback();
//         toast.dismiss(loadingToast);
//         toast.success(res.data.message || successMessage);
//         if (res.data.token) {
//           setToken(res.data.token);
//           localStorage.setItem('token', res.data.token);
//           // Redirect to home page after successful verification
//           if (otpSent) {
//             navigate('/');
//           }
//         }
//         if (!otpSent) setOtpSent(true);
//       } catch (err) {
//         toast.dismiss(loadingToast);
//         toast.error(err.response?.data?.message || 'An error occurred');
//       } finally {
//         setLoading(false);
//       }
//     },
//     [otpSent, navigate] // Add navigate to dependencies
//   );

//   const handleSendOtp = useCallback(() => {
//     const error = validatePhoneNumber(phoneNumber);
//     if (error) return toast.error(error);
//     handleApiCall(() => axios.post('/api/user/auth/send-otp', { phoneNumber: fullPhoneNumber }), 'OTP sent successfully!');
//   }, [phoneNumber, countryCode, handleApiCall, fullPhoneNumber]);

//   const handleVerifyOtp = useCallback(() => {
//     const otpString = otp.join('');
//     if (otpString.length !== 6) return toast.error('Please enter a 6-digit OTP');
//     handleApiCall(() =>
//       axios.post('/api/user/auth/verify-otp', {
//         phoneNumber: fullPhoneNumber,
//         otp: otpString,
//       }), 'OTP verified successfully!'
//     );
//   }, [otp, handleApiCall, fullPhoneNumber]);

//   const handleOtpChange = (index, value) => {
//     const newOtp = [...otp];
//     newOtp[index] = value.replace(/\D/g, '').slice(0, 1);
//     setOtp(newOtp);

//     if (value && index < 5 && otpRefs.current[index + 1]) {
//       otpRefs.current[index + 1].focus();
//     }
//     if (!value && index > 0 && otpRefs.current[index - 1]) {
//       otpRefs.current[index - 1].focus();
//     }
//   };

//   const handleKeyDown = (e, index) => {
//     if (e.key === 'Backspace' && !otp[index] && index > 0) {
//       otpRefs.current[index - 1].focus();
//     }
//   };

//   useEffect(() => {
//     if (otpSent && otpRefs.current[0]) otpRefs.current[0].focus();
//   }, [otpSent]);

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-green-200 to-green-100 px-4">
//       <Toaster position="top-roght" toastOptions={{ className: 'text-sm sm:text-base' }} />
//       <div className="w-full max-w-md sm:max-w-lg bg-white rounded-3xl shadow-xl p-6 sm:p-8 md:p-10 border border-green-200 relative overflow-hidden">
//         {/* Logo */}
//         <div className="flex justify-center mb-2">
//           <img
//             src={agroLogo}
//             alt="AgroTrade Logo"
//             className="h-16 w-16 object-contain drop-shadow-md"
//             onError={(e) => { e.target.style.display = 'none'; }}
//           />
//         </div>

//         {/* Title */}
//         <div className="text-center mb-6">
//           <h1 className="text-3xl font-bold text-green-700 ">AgroTrade Login</h1>
//           <p className="text-sm text-gray-500 mt-1">Sign in using your phone number</p>
//         </div>

//         {/* Form */}
//         <div className="space-y-6">
//           {/* Country + Phone Input */}
//           <div className="flex gap-2">
//             <select
//               className="w-18 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-400"
//               value={countryCode}
//               onChange={(e) => setCountryCode(e.target.value)}
//             >
//               {countryCodes.map((country) => (
//                 <option key={country.code} value={country.code}>
//                   {country.label}
//                 </option>
//               ))}
//             </select>
//             <input
//               type="tel"
//               value={phoneNumber}
//               onChange={(e) => {
//                 const value = e.target.value.replace(/\D/g, '');
//                 if (value.length <= 10) setPhoneNumber(value);
//               }}
//               placeholder="Enter phone number"
//               className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-400"
//             />
//           </div>

//           {/* OTP Fields */}
//           {otpSent && (
//             <div className="flex justify-between">
//               {otp.map((digit, index) => (
//                 <input
//                   key={index}
//                   ref={(el) => (otpRefs.current[index] = el)}
//                   type="text"
//                   value={digit}
//                   onChange={(e) => handleOtpChange(index, e.target.value)}
//                   onKeyDown={(e) => handleKeyDown(e, index)}
//                   maxLength={1}
//                   className="w-10 sm:w-12 h-12 sm:h-14 border border-gray-300 rounded-lg text-center text-xl font-mono focus:ring-2 focus:ring-green-400"
//                   aria-label={`OTP digit ${index + 1}`}
//                 />
//               ))}
//             </div>
//           )}

//           {/* Action Button */}
//           <button
//             onClick={otpSent ? handleVerifyOtp : handleSendOtp}
//             disabled={loading}
//             className={`w-full ${
//               loading
//                 ? 'bg-gray-400 cursor-not-allowed'
//                 : otpSent
//                 ? 'bg-green-600 hover:bg-green-700'
//                 : 'bg-emerald-500 hover:bg-emerald-600'
//             } text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-green-400 ${
//               loading ? 'animate-pulse' : ''
//             }`}
//           >
//             {otpSent ? 'Verify OTP' : 'Send OTP'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default React.memo(LoginRegister);
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../axios';
import toast, { Toaster } from 'react-hot-toast';
import agroLogo from '../assets/logo.png';

const countryCodes = [
  { code: '+91', label: '+91 India' },
  { code: '+1', label: '🇺🇸 USA' },
  { code: '+44', label: '🇬🇧 UK' },
  { code: '+61', label: '🇦🇺 AUS' },
];

const LoginRegister = () => {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef([]);
  const navigate = useNavigate();

  const fullPhoneNumber = `${countryCode}${phoneNumber}`;

  const validatePhoneNumber = (number) => {
    const num = number.replace(/\D/g, '');
    if (num.length < 6 || num.length > 15) return 'Phone number must be 6-15 digits';
    if (countryCode === '+91' && (!/^[6-9]\d{9}$/.test(num) || num.length !== 10))
      return 'Invalid India number (10 digits, starts with 6-9)';
    if (countryCode === '+1' && num.length !== 10)
      return 'Invalid USA number (10 digits)';
    return '';
  };

  const handleApiCall = useCallback(
    async (callback, successMessage) => {
      const loadingToast = toast.loading('Processing...');
      setLoading(true);
      try {
        const res = await callback();
        toast.dismiss(loadingToast);
        toast.success(res.data.message || successMessage);
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
          if (otpSent) {
            try {
              await axios.get('/api/user/auth/profile');
              navigate('/');
            } catch (err) {
              console.error('Profile check failed:', err.response?.data || err.message);
              toast.error('Please complete your profile.');
              navigate('/setup-profile'); // Adjust based on your app
            }
          }
        }
        if (!otpSent) setOtpSent(true);
      } catch (err) {
        toast.dismiss(loadingToast);
        const errorMessage =
          err.response?.status === 404
            ? 'User not found. Please register.'
            : err.response?.status === 401
            ? 'Invalid OTP or session expired.'
            : err.code === 'ECONNABORTED'
            ? 'Request timed out. Check your network.'
            : err.response?.data?.message || 'An error occurred';
        console.error('API Call Error:', {
          url: err.config?.url,
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        });
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [otpSent, navigate]
  );

  const handleSendOtp = useCallback(() => {
    const error = validatePhoneNumber(phoneNumber);
    if (error) return toast.error(error);
    handleApiCall(
      () => axios.post('/api/user/auth/send-otp', { phoneNumber: fullPhoneNumber }),
      'OTP sent successfully!'
    );
  }, [phoneNumber, countryCode, handleApiCall, fullPhoneNumber]);

  const handleVerifyOtp = useCallback(() => {
    const otpString = otp.join('');
    if (otpString.length !== 6) return toast.error('Please enter a 6-digit OTP');
    handleApiCall(
      () =>
        axios.post('/api/user/auth/verify-otp', {
          phoneNumber: fullPhoneNumber,
          otp: otpString,
        }),
      'OTP verified successfully!'
    );
  }, [otp, handleApiCall, fullPhoneNumber]);

  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, '').slice(0, 1);
    setOtp(newOtp);

    if (value && index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1].focus();
    }
    if (!value && index > 0 && otpRefs.current[index - 1]) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (e, index) => {
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('').slice(0, 6);
      setOtp(newOtp);
      otpRefs.current[5]?.focus();
      e.preventDefault();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  useEffect(() => {
    if (otpSent && otpRefs.current[0]) otpRefs.current[0].focus();
  }, [otpSent]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-green-200 to-green-100 px-4">
      <Toaster position="top-right" toastOptions={{ className: 'text-sm sm:text-base' }} />
      <div className="w-full max-w-md sm:max-w-lg bg-white rounded-3xl shadow-xl p-6 sm:p-8 md:p-10 border border-green-200 relative overflow-hidden">
        <div className="flex justify-center mb-2">
          <img
            src={agroLogo}
            alt="AgroTrade Logo"
            className="h-16 w-16 object-contain drop-shadow-md"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-green-700">AgroTrade Login</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in using your phone number</p>
        </div>

        <div className="space-y-6">
          <div className="flex gap-2">
            <select
              className="w-18 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-400"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
            >
              {countryCodes.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.label}
                </option>
              ))}
            </select>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 10) setPhoneNumber(value);
              }}
              placeholder="Enter phone number"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-400"
            />
          </div>

          {otpSent && (
            <div className="flex justify-between">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  type="text"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={(e) => handleOtpPaste(e, index)}
                  maxLength={1}
                  className="w-10 sm:w-12 h-12 sm:h-14 border border-gray-300 rounded-lg text-center text-xl font-mono focus:ring-2 focus:ring-green-400"
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>
          )}

          <button
            onClick={otpSent ? handleVerifyOtp : handleSendOtp}
            disabled={loading}
            className={`w-full ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : otpSent
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-emerald-500 hover:bg-emerald-600'
            } text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-green-400 ${
              loading ? 'animate-pulse' : ''
            }`}
          >
            {otpSent ? 'Verify OTP' : 'Send OTP'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LoginRegister);