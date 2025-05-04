import axios from '../useraxios';

export const fetchHomeData = async () => {
  try {
    const response = await axios.get('/api/user/auth/homee', {
      params: {
        productsLimit: 10,
        sellersLimit: 5,
        categoriesLimit: 5,
        comboOffersLimit: 5,
        sponsoredProductsLimit: 5,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching home data:', error);
    throw error;
  }
};