import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from '../axios';
import { FaImages, FaSpinner, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';

const AdminAds = ({ ads, setAds, loading }) => {
  const [uploading, setUploading] = useState({ single: false, double: false, triple: false });
  const [selectedFiles, setSelectedFiles] = useState({ single: [], double: [], triple: [] });
  const [deleting, setDeleting] = useState({ single: [], double: [], triple: [] });
  const [toggling, setToggling] = useState({ single: [], double: [], triple: [] });

  console.log('Ads prop:', ads); // Debug

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const handleFileChange = (type, e) => {
    const files = Array.from(e.target.files);
    console.log(`Selected files for ${type}:`, files); // Debug
    const invalidFiles = files.filter((file) => file.size > 5 * 1024 * 1024); // 5MB limit
    if (invalidFiles.length > 0) {
      toast.error('Some files exceed 5MB limit');
      return;
    }
    if (files.length === 0) {
      toast.error('No files selected');
      return;
    }
    setSelectedFiles((prev) => ({ ...prev, [type]: files }));
  };

  const handleUpload = async (type) => {
    if (!selectedFiles[type].length) {
      toast.error('Please select at least one image');
      return;
    }

    setUploading((prev) => ({ ...prev, [type]: true }));
    try {
      const formData = new FormData();
      selectedFiles[type].forEach((file, index) => {
        formData.append('images', file); // Ensure field name is 'images'
        console.log(`Appending file ${index} for ${type}:`, file.name); // Debug
      });

      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No admin token found');
      }

      console.log(`Uploading ${type} images...`); // Debug
      const res = await axios.post(`/api/admin/auth/ads/${type}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log(`Upload response for ${type}:`, res.data); // Debug
      setAds((prev) => ({
        ...prev,
        [`${type}add`]: res.data[`${type}add`],
      }));
      setSelectedFiles((prev) => ({ ...prev, [type]: [] }));
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} ad images added successfully`);
    } catch (error) {
      console.error(`Error adding ${type} ad images:`, error);
      toast.error(error.response?.data?.message || `Failed to add ${type} ad images`);
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleDelete = async (type, index) => {
    if (!window.confirm(`Are you sure you want to delete this ${type} ad image?`)) {
      return;
    }

    setDeleting((prev) => ({
      ...prev,
      [type]: [...prev[type], index],
    }));
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.delete(`/api/admin/auth/ads/${type}/image/${index}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAds((prev) => ({
        ...prev,
        [`${type}add`]: res.data[`${type}add`],
      }));
      toast.success(`Image removed from ${type} ad`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to delete ${type} ad image`);
      console.error(`Error deleting ${type} ad image:`, error);
    } finally {
      setDeleting((prev) => ({
        ...prev,
        [type]: prev[type].filter((i) => i !== index),
      }));
    }
  };

  const handleToggleDisable = async (type, index) => {
    setToggling((prev) => ({
      ...prev,
      [type]: [...prev[type], index],
    }));
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.patch(`/api/admin/auth/ads/${type}/image/${index}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAds((prev) => ({
        ...prev,
        [`${type}add`]: res.data[`${type}add`],
      }));
      toast.success(`Image ${res.data[`${type}add`].images[index].disabled ? 'disabled' : 'enabled'} for ${type} ad`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to toggle ${type} ad image`);
      console.error(`Error toggling ${type} ad image:`, error);
    } finally {
      setToggling((prev) => ({
        ...prev,
        [type]: prev[type].filter((i) => i !== index),
      }));
    }
  };

  const renderAdSection = (type, title) => (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="bg-white p-6 rounded-2xl shadow-md mb-6"
    >
      <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600">Current Images</h4>
        {ads[`${type}add`]?.images?.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
            {ads[`${type}add`].images.map((image, index) => {
              // Handle malformed image objects
              let url = image.url;
              if (!url && typeof image === 'object') {
                url = Object.keys(image)
                  .filter((key) => !['disabled', '_id'].includes(key))
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map((key) => image[key])
                  .join('');
              }
              if (!url || typeof image !== 'object') {
                console.warn(`Invalid image at ${type}add.images[${index}]:`, image);
                return null;
              }
              return (
                <div key={index} className="relative">
                  <img
                    src={url.replace(/^http:/, 'https:')}
                    alt={`${title} ${index + 1}`}
                    className={`w-full h-32 object-cover rounded-lg ${image.disabled ? 'opacity-50' : ''}`}
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
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
            }).filter(Boolean)}
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
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {selectedFiles[type].length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">{selectedFiles[type].length} file(s) selected</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {selectedFiles[type].map((file, index) => (
                <img
                  key={index}
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                  loading="lazy"
                />
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

  if (!ads || !ads.singleadd || !ads.doubleadd || !ads.tripleadd) {
    console.error('Invalid ads prop:', ads);
    return <div className="text-red-600">Error: Invalid ads data</div>;
  }

  return (
    <div>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-blue-600 text-4xl" />
        </div>
      ) : (
        <>
          {renderAdSection('single', 'Single Ad')}
          {renderAdSection('double', 'Double Ad')}
          {renderAdSection('triple', 'Triple Ad')}
        </>
      )}
    </div>
  );
};

export default AdminAds;