const Redis = require('ioredis');

let redis = null;

try {
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      reconnectOnError: () => true
    });

    redis.on('connect', () => console.log('✅ Redis connected'));
    redis.on('error', (err) => {
      console.warn('⚠️ Redis error:', err.message);
    });
  } else {
    console.warn('⚠️ REDIS_URL not set. Redis is disabled.');
  }
} catch (error) {
  console.error('❌ Failed to initialize Redis:', error.message);
}

// Safe wrappers
const getCache = async (key) => {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn('Redis GET failed:', e.message);
    return null;
  }
};

const setCache = async (key, ttl, value) => {
  if (!redis) return;
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (e) {
    console.warn('Redis SET failed:', e.message);
  }
};

module.exports = { redis, getCache, setCache };
