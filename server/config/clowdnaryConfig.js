// const cloudinary = require('cloudinary').v2;
// require('dotenv').config();

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const uploadToCloudinary = (fileBuffer) => {
//   return new Promise((resolve, reject) => {
//     cloudinary.uploader.upload_stream(
//       { resource_type: 'image', folder: 'agrotrade_products' }, // Optional folder
//       (error, result) => {
//         if (error) {
//           reject(error);
//         } else {
//           resolve({
//             url: result.secure_url,
//             public_id: result.public_id,
//           });
//         }
//       }
//     ).end(fileBuffer);
//   });
// };

// module.exports = { uploadToCloudinary };


// config/clowdnaryConfig.js
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload to Cloudinary
const uploadToCloudinary = async (buffer) => {
  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });
    return result;
  } catch (error) {
    throw new Error('Failed to upload to Cloudinary: ' + error.message);
  }
};

// Delete from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== 'ok') {
      throw new Error('Failed to delete from Cloudinary');
    }
    return result;
  } catch (error) {
    console.error('Cloudinary Deletion Error:', error);
    throw new Error('Failed to delete from Cloudinary: ' + error.message);
  }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };