import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from '../axios';
import { FaImages, FaSpinner, FaTrash, FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';
import useAdminAuth from '../../hooks/useAdminAuth';

const AdminAds = ({ ads = {}, setAds, loading }) => {
  const { isAdmin, error, checkAdmin } = useAdminAuth();
  const [uploading, setUploading] = useState({ single: false, double: false, triple: false });
  const [selectedFiles, setSelectedFiles] = useState({ single: [], double: [], triple: [] });
  const [deleting, setDeleting] = useState({ single: [], double: [], triple: [] });
  const [toggling, setToggling] = useState({ single: [], double: [], triple: [] });
  const [imagePreviews, setImagePreviews] = useState({ single: [], double: [], triple: [] });
  const [sectionErrors, setSectionErrors] = useState({ single: '', double: '', triple: '' });
  const fileInputRefs = {
    single: useRef(null),
    double: useRef(null),
    triple: useRef(null),
  };

  // Normalize ads data to handle case variations and missing properties
  const normalizedAds = useMemo(() => ({
    singleadd: ads.singleadd || ads.singleAdd || { images: [] },
    doubleadd: ads.doubleadd || ads.doubleAdd || { images: [] },
    tripleadd: ads.tripleadd || ads.tripleAdd || { images: [] },
  }), [ads]);

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      Object.values(imagePreviews).flat().forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  // Normalize image URL
  const normalizeImageUrl = (image) => {
    if (!image) return 'https://via.placeholder.com/150?text=Image+Not+Found';
    if (typeof image === 'string') return image.replace(/^http:/, 'https:');
    if (image.url) return image.url.replace(/^http:/, 'https:');
    return 'https://via.placeholder.com/150?text=Image+Not+Found';
  };

  // Handle file selection
  const handleFileChange = (type, e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) {
      toast.error('No files selected');
      return;
    }

    const invalidFiles = files.filter((file) => file.size > 5 * 1024 * 1024); // 5MB limit
    if (invalidFiles.length > 0) {
      toast.error('Some files exceed 5MB limit');
      return;
    }

    // Revoke previous preview URLs
    imagePreviews[type].forEach((url) => URL.revokeObjectURL(url));

    setSelectedFiles((prev) => ({ ...prev, [type]: files }));
    setImagePreviews((prev) => ({
      ...prev,
      [type]: files.map((file) => URL.createObjectURL(file)),
    }));
    setSectionErrors((prev) => ({ ...prev, [type]: '' }));
  };

  // Clear selected files
  const handleClearSelection = (type) => {
    imagePreviews[type].forEach((url) => URL.revokeObjectURL(url));
    setSelectedFiles((prev) => ({ ...prev, [type]: [] }));
    setImagePreviews((prev) => ({ ...prev, [type]: [] }));
    if (fileInputRefs[type].current) {
      fileInputRefs[type].current.value = '';
    }
    toast.success(`Cleared selected files for ${type} ad`);
  };

  // Handle image upload
  const handleUpload = async (type) => {
    if (!selectedFiles[type].length) {
      toast.error('Please select at least one image');
      return;
    }

    setUploading((prev) => ({ ...prev, [type]: true }));
    try {
      const formData = new FormData();
      selectedFiles[type].forEach((file) => formData.append('images', file));

      const token = localStorage.getItem('adminToken');
      const res = await axios.post(`/api/admin/auth/ads/${type}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setAds((prev) => ({
        ...prev,
        [`${type}add`]: res.data[`${type}add`] || res.data[`${type}Add`] || { images: [] },
      }));
      handleClearSelection(type);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} ad images added successfully`);
    } catch (error) {
      const errorMsg = error.response?.data?.message || `Failed to add ${type} ad images`;
      setSectionErrors((prev) => ({ ...prev, [type]: errorMsg }));
      toast.error(errorMsg);
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  // Handle image deletion
  const handleDelete = async (type, index) => {
    if (!window.confirm(`Are you sure you want to delete this ${type} ad image?`)) return;

    setDeleting((prev) => ({ ...prev, [type]: [...prev[type], index] }));
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.delete(`/api/admin/auth/ads/${type}/image/${index}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAds((prev) => ({
        ...prev,
        [`${type}add`]: res.data[`${type}add`] || res.data[`${type}Add`] || { images: [] },
      }));
      toast.success(`Image removed from ${type} ad`);
    } catch (error) {
      const errorMsg = error.response?.data?.message || `Failed to delete ${type} ad image`;
      setSectionErrors((prev) => ({ ...prev, [type]: errorMsg }));
      toast.error(errorMsg);
    } finally {
      setDeleting((prev) => ({
        ...prev,
        [type]: prev[type].filter((i) => i !== index),
      }));
    }
  };

  // Handle image toggle (enable/disable)
  const handleToggleDisable = async (type, index) => {
    setToggling((prev) => ({ ...prev, [type]: [...prev[type], index] }));
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.patch(`/api/admin/auth/ads/${type}/image/${index}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAds((prev) => ({
        ...prev,
        [`${type}add`]: res.data[`${type}add`] || res.data[`${type}Add`] || { images: [] },
      }));
      toast.success(`Image ${res.data[`${type}add`].images[index].disabled ? 'disabled' : 'enabled'} for ${type} ad`);
    } catch (error) {
      const errorMsg = error.response?.data?.message || `Failed to toggle ${type} ad image`;
      setSectionErrors((prev) => ({ ...prev, [type]: errorMsg }));
      toast.error(errorMsg);
    } finally {
      setToggling((prev) => ({
        ...prev,
        [type]: prev[type].filter((i) => i !== index),
      }));
    }
  };

  // Render ad section
  const renderAdSection = (type, title) => (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="bg-white p-6 rounded-2xl shadow-md mb-6"
    >
      <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
      {sectionErrors[type] && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {sectionErrors[type]}
          <button
            onClick={() => setSectionErrors((prev) => ({ ...prev, [type]: '' }))}
            className="ml-2 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600">Current Images</h4>
        {normalizedAds[`${type}add`]?.images?.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
            {normalizedAds[`${type}add`].images.map((image, index) => {
              const url = normalizeImageUrl(image);
              return (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`${title} ${index + 1}`}
                    className={`w-full h-32 object-cover rounded-lg ${image.disabled ? 'opacity-50' : ''}`}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
                    }}
                  />
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleToggleDisable(type, index)}
                      disabled={toggling[type].includes(index)}
                      className={`p-2 rounded-full text-white ${
                        image.disabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
                      } ${toggling[type].includes(index) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      aria-label={image.disabled ? `Enable ${title} image ${index + 1}` : `Disable ${title} image ${index + 1}`}
                      title={image.disabled ? 'Enable Image' : 'Disable Image'}
                    >
                      {toggling[type].includes(index) ? (
                        <FaSpinner className="animate-spin" size={14} />
                      ) : image.disabled ? (
                        <FaEye size={14} />
                      ) : (
                        <FaEyeSlash size={14} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(type, index)}
                      disabled={deleting[type].includes(index)}
                      className={`p-2 bg-red-600 text-white rounded-full ${
                        deleting[type].includes(index) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
                      }`}
                      aria-label={`Delete ${title} image ${index + 1}`}
                      title="Delete Image"
                    >
                      {deleting[type].includes(index) ? (
                        <FaSpinner className="animate-spin" size={14} />
                      ) : (
                        <FaTrash size={14} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No images uploaded for {title}</p>
        )}
      </div>
      <div className="mb-4">
        <label htmlFor={`${type}-upload`} className="block text-sm font-medium text-gray-700 mb-2">
          Upload New Images
        </label>
        <input
          id={`${type}-upload`}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/jpg"
          onChange={(e) => handleFileChange(type, e)}
          ref={fileInputRefs[type]}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={uploading[type]}
        />
        {selectedFiles[type].length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-600">
                {selectedFiles[type].length} file(s) selected
              </p>
              <button
                onClick={() => handleClearSelection(type)}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <FaTimes size={14} />
                Clear Selection
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {imagePreviews[type].map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                    loading="lazy"
                  />
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {selectedFiles[type][index].name} (
                    {(selectedFiles[type][index].size / 1024).toFixed(2)} KB)
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <button
        onClick={() => handleUpload(type)}
        disabled={uploading[type] || !selectedFiles[type].length}
        className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${
          uploading[type] || !selectedFiles[type].length
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
        aria-label={`Add images to ${title}`}
      >
        {uploading[type] ? <FaSpinner className="animate-spin" /> : <FaImages />}
        Add Images
      </button>
    </motion.div>
  );

  if (isAdmin === null || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-blue-600 text-4xl" />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-2xl shadow-md">
        <h3 className="text-lg font-semibold text-red-700">Unable to Access Ads</h3>
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
    <div>
      {renderAdSection('single', 'Single Ad')}
      {renderAdSection('double', 'Double Ad')}
      {renderAdSection('triple', 'Triple Ad')}
    </div>
  );
};

export default AdminAds;