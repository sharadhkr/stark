const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary Config Success:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY ? 'set' : 'missing',
  });
} catch (error) {
  console.error('Cloudinary Config Error:', error.message);
  throw new Error('Failed to configure Cloudinary');
}

// Upload to Cloudinary with WebP format
const uploadToCloudinary = async (buffer, options = {}) => {
  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          format: 'webp',
          quality: 'auto',
          fetch_format: 'webp',
          ...options, // Allow custom folder, etc.
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', {
              message: error.message,
              status: error.http_code,
            });
            reject(error);
          } else {
            console.log('Cloudinary Upload Success:', {
              public_id: result.public_id,
              url: result.secure_url,
              format: result.format,
            });
            resolve(result);
          }
        }
      );
      uploadStream.end(buffer);
    });
    return result;
  } catch (error) {
    console.error('Cloudinary Upload Failed:', error);
    throw new Error('Failed to upload to Cloudinary: ' + error.message);
  }
};

// Delete from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== 'ok') {
      console.error('Cloudinary Deletion Failed:', { publicId, result });
      throw new Error('Failed to delete from Cloudinary');
    }
    console.log('Cloudinary Deletion Success:', { publicId });
    return result;
  } catch (error) {
    console.error('Cloudinary Deletion Error:', error);
    throw new Error('Failed to delete from Cloudinary: ' + error.message);
  }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };