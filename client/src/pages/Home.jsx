import React, { useState, useEffect, useCallback, useMemo, useContext, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import debounce from 'lodash.debounce';
import axios from '../useraxios';
import { DataContext } from '../App';
import Loading from '../assets/loading.gif';

// Lazy-loaded components
const SearchBar = lazy(() => import('../Components/home/SearchBar'));
const CategorySection = lazy(() => import('../Components/home/CategorySection'));
const SellerSection = lazy(() => import('../Components/home/SellerSection'));
const ProductSection = lazy(() => import('../Components/home/ProductSection'));
const Topbox = lazy(() => import('../Components/home/Topbox'));
const SingleAdd = lazy(() => import('../Components/home/SingleAdd'));
const DoubleAdd = lazy(() => import('../Components/home/DoubleAdd'));
const TripleAdd = lazy(() => import('../Components/home/TripleAdd'));
const CategorySectionn = lazy(() => import('../Components/home/CategorySectionn'));
const ComboOfferSection = lazy(() => import('../Components/home/ComboOfferSection'));
const TrendingSection = lazy(() => import('../Components/home/TrendingSection'));
const SponsoredSection = lazy(() => import('../Components/home/SponsoredSection'));
const RecentlyViewedSection = lazy(() => import('../Components/home/RecentlyViewedSection'));

// Component mapping
const componentMap = {
  SearchBar,
  Topbox,
  RecentlyViewedSection,
  SponsoredSection,
  ComboOfferSection,
  SingleAdd,
  CategorySection,
  SellerSection,
  TripleAdd,
  DoubleAdd,
  CategorySectionn,
  TrendingSection,
  ProductSection,
};

const DEFAULT_IMAGE = 'https://your-server.com/generic-product-placeholder.jpg';

const Home = React.memo(() => {
  const context = useContext(DataContext);
  const { cache = {}, updateCache = () => {}, isDataStale = () => true } = context || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(cache.products?.data || []);
  const [selectedGender, setSelectedGender] = useState('all');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const location = useLocation();

  // Log context for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('DataContext value:', context);
    }
  }, [context]);

  // Memoize cache keys to stabilize hasValidCache
  const cacheKeys = useMemo(() => ({
    layout: cache.layout?.data?.length > 0 && !isDataStale(cache.layout?.timestamp),
    products: cache.products?.data?.length > 0 && !isDataStale(cache.products?.timestamp),
    sellers: cache.sellers?.data?.length > 0 && !isDataStale(cache.sellers?.timestamp),
    categories: cache.categories?.data?.length > 0 && !isDataStale(cache.categories?.timestamp),
    comboOffers: cache.comboOffers?.data?.length > 0 && !isDataStale(cache.comboOffers?.timestamp),
    sponsoredProducts: cache.sponsoredProducts?.data?.length > 0 && !isDataStale(cache.sponsoredProducts?.timestamp),
    singleAds: cache.singleAds?.data?.length > 0 && !isDataStale(cache.singleAds?.timestamp),
    doubleAds: cache.doubleAds?.data?.length > 0 && !isDataStale(cache.doubleAds?.timestamp),
    tripleAds: cache.tripleAds?.data?.length > 0 && !isDataStale(cache.tripleAds?.timestamp),
    trendingProducts: cache.trendingProducts?.data?.length > 0 && !isDataStale(cache.trendingProducts?.timestamp),
    banner: cache.banner?.data && !isDataStale(cache.banner?.timestamp),
    searchSuggestions: cache.searchSuggestions?.data && !isDataStale(cache.searchSuggestions?.timestamp),
    trendingSearches: cache.trendingSearches?.data && !isDataStale(cache.trendingSearches?.timestamp),
  }), [cache, isDataStale]);

  // Check for valid cache
  const hasValidCache = useMemo(
    () => Object.values(cacheKeys).every((valid) => valid),
    [cacheKeys]
  );

  // Initialize filteredProducts
  useEffect(() => {
    if (cache.products?.data?.length > 0 && !filteredProducts.length && !searchQuery) {
      setFilteredProducts(cache.products.data);
    }
  }, [cache.products?.data, filteredProducts.length, searchQuery]);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    if (hasValidCache) return;
    setLoading(true);
    setErrors({});

    try {
      const response = await axios.get('/api/user/auth/initial-data', {
        params: { limit: 20 },
      });
      const data = response.data;

      // Log raw API response in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Raw API response:', data);
      }

      // Update cache with all data
      updateCache('layout', data.layout?.components || []);
      updateCache('products', (data.products || []).map((p) => ({
        ...p,
        image: p.image && p.image !== 'https://via.placeholder.com/150' ? p.image : DEFAULT_IMAGE,
      })));
      updateCache('sellers', data.sellers || []);
      updateCache('categories', data.categories || []);
      updateCache('comboOffers', data.comboOffers || []);
      updateCache('sponsoredProducts', (data.sponsoredProducts || []).map((p) => ({
        ...p,
        image: p.image && p.image !== 'https://via.placeholder.com/150' ? p.image : DEFAULT_IMAGE,
      })));
      updateCache('singleAds', (data.ads?.find((ad) => ad.type === 'Single Ad')?.images || []).map((img) => ({
        ...img,
        url: img.url && img.url !== 'https://via.placeholder.com/150' ? img.url : DEFAULT_IMAGE,
      })));
      updateCache('doubleAds', (data.ads?.find((ad) => ad.type === 'Double Ad')?.images || []).map((img) => ({
        ...img,
        url: img.url && img.url !== 'https://via.placeholder.com/150' ? img.url : DEFAULT_IMAGE,
      })));
      updateCache('tripleAds', (data.ads?.find((ad) => ad.type === 'Triple Ad')?.images || []).map((img) => ({
        ...img,
        url: img.url && img.url !== 'https://via.placeholder.com/150' ? img.url : DEFAULT_IMAGE,
      })));
      updateCache('trendingProducts', (data.trendingProducts || []).map((p) => ({
        ...p,
        image: p.image && p.image !== 'https://via.placeholder.com/150' ? p.image : DEFAULT_IMAGE,
      })));
      updateCache('banner', data.banner || { url: DEFAULT_IMAGE });
      updateCache('searchSuggestions', data.searchSuggestions || {
        recentSearches: [],
        categories: [],
        sellers: [],
        products: [],
      });
      updateCache('trendingSearches', data.trendingSearches || {
        trendingSearches: [],
        topSellers: [],
        topCategories: [],
        topProducts: [],
      });
      updateCache('recentlyViewed', data.recentlyViewed || []);

    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to load homepage data';
      setErrors({ general: errorMsg });
      toast.error(errorMsg);
      if (process.env.NODE_ENV === 'development') {
        console.error('Fetch Initial Data Error:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [hasValidCache, updateCache]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounced server-side search
  const handleSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setFilteredProducts(cache.products?.data || []);
        return;
      }
      try {
        const res = await axios.get('/api/user/auth/products', {
          params: { q: query, limit: 5 },
        });
        const filtered = (res.data.products || []).map((p) => ({
          ...p,
          image: p.image && p.image !== 'https://via.placeholder.com/150' ? p.image : DEFAULT_IMAGE,
        }));
        setFilteredProducts(filtered);
        toast.success(`Found ${filtered.length} results for "${query}"`);
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to search products';
        toast.error(errorMsg);
        setFilteredProducts(cache.products?.data || []);
        if (process.env.NODE_ENV === 'development') {
          console.error('Search Error:', error);
        }
      }
    }, 300),
    [cache.products?.data]
  );

  // Handle search input change
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  }, [handleSearch]);

  // Render components dynamically
  const renderComponent = useCallback(
    (component, index) => {
      const Component = componentMap[component.name];
      if (!Component) {
        return (
          <div key={index} className="text-center text-red-500 py-4" aria-live="polite">
            Component {component.name} not found
          </div>
        );
      }

      const props = { ...component.props };

      switch (component.name) {
        case 'SearchBar':
          return (
            <Component
              key={index}
              onSearch={(e) => {
                e.preventDefault();
                handleSearch(searchQuery);
              }}
              searchQuery={searchQuery}
              setSearchQuery={handleSearchChange}
              placeholder={props.placeholder || 'Search for products, sellers, or categories...'}
            />
          );

        case 'CategorySection':
          return <Component key={index} categories={cache.categories?.data || []} {...props} />;

        case 'SellerSection':
          return <Component key={index} {...props} />;

        case 'ProductSection':
          return (
            <Component
              key={index}
              products={cache.products?.data || []}
              filteredProducts={filteredProducts}
              setFilteredProducts={setFilteredProducts}
              onGenderChange={(gender) => {
                setSelectedGender(gender);
                if (gender === 'all') {
                  setFilteredProducts(cache.products?.data || []);
                } else {
                  const normalizedGender = (g) => {
                    const lower = g?.toLowerCase()?.trim() || 'unknown';
                    if (['male', 'men', 'man'].includes(lower)) return 'men';
                    if (['female', 'women', 'woman'].includes(lower)) return 'women';
                    if (['kid', 'kids', 'child', 'children', 'kidz'].includes(lower)) return 'kids';
                    return 'unknown';
                  };
                  const filtered = (cache.products?.data || [])
                    .filter((product) => normalizedGender(product.gender) === gender)
                    .sort((a, b) => (a.price || 0) - (b.price || 0));
                  const seenIds = new Set();
                  const uniqueFiltered = filtered.filter((product) => {
                    if (!product._id || seenIds.has(product._id)) return false;
                    seenIds.add(product._id);
                    return true;
                  });
                  setFilteredProducts(uniqueFiltered);
                }
              }}
              selectedGender={selectedGender}
            />
          );

        case 'CategorySectionn':
          const category = cache.categories?.data?.find(
            (cat) =>
              cat._id === props.categoryId ||
              (props.categoryName && cat.name.toLowerCase() === props.categoryName.toLowerCase())
          );
          if (!category) {
            return (
              <p key={index} className="text-center text-gray-500 py-8" aria-live="polite">
                Category {props.categoryName || 'unknown'} not available
              </p>
            );
          }
          return <Component key={index} category={category} {...props} />;

        case 'ComboOfferSection':
          return <Component key={index} comboOffers={cache.comboOffers?.data || []} {...props} />;

        case 'SponsoredSection':
          return <Component key={index} {...props} />;

        case 'SingleAdd':
          return <Component key={index} {...props} />;

        case 'DoubleAdd':
          return <Component key={index} {...props} />;

        case 'TripleAdd':
          return <Component key={index} {...props} />;

        case 'RecentlyViewedSection':
          return <Component key={index} recentlyViewed={cache.recentlyViewed?.data || []} {...props} />;

        case 'TrendingSection':
          return <Component key={index} {...props} />;

        case 'Topbox':
          return <Component key={index} {...props} />;

        default:
          return <Component key={index} {...props} />;
      }
    },
    [cache, filteredProducts, searchQuery, handleSearchChange, handleSearch, selectedGender]
  );

  // Memoized loading UI
  const LoadingUI = useMemo(
    () => (
      <div className='fixed inset-0 z-50 bg-gray-100 bg-opacity-75 flex items-center justify-center overflow-hidden'>
        <div className="text-center w-screen h-screen bg-white flex flex-col min-h-screen justify-center overflow-hidden items-center" aria-live="polite">
          <img className='w-[80%]' src={Loading} alt="" />
        </div>
      </div>
    ),
    []
  );

  // Default layout
  const defaultLayout = useMemo(
    () => [
      { name: 'SearchBar', props: {} },
      { name: 'Topbox', props: {} },
      { name: 'RecentlyViewedSection', props: {} },
      { name: 'SponsoredSection', props: {} },
      { name: 'ComboOfferSection', props: {} },
      { name: 'SingleAdd', props: {} },
      { name: 'CategorySection', props: {} },
      { name: 'SellerSection', props: {} },
      { name: 'TripleAdd', props: {} },
      { name: 'DoubleAdd', props: {} },
      { name: 'CategorySectionn', props: { categoryName: 'Featured' } },
      { name: 'TrendingSection', props: {} },
      { name: 'ProductSection', props: {} },
    ],
    []
  );

  // Memoized layout rendering
  const renderedLayout = useMemo(() => {
    if (loading) return <Suspense fallback={LoadingUI}>{LoadingUI}</Suspense>;

    if (errors.general) {
      return (
        <div className="text-center py-8 text-red-500" aria-live="polite">
          <p>{errors.general}</p>
          <button
            onClick={() => fetchData()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            aria-label="Retry loading homepage"
          >
            Retry
          </button>
        </div>
      );
    }

    const effectiveLayout = cache.layout?.data?.length ? cache.layout.data : defaultLayout;
    return (
      <Suspense fallback={LoadingUI}>
        {effectiveLayout.map((component, index) => renderComponent(component, index))}
      </Suspense>
    );
  }, [cache.layout?.data, loading, errors, renderComponent, LoadingUI, defaultLayout, fetchData]);

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
      <main className="container mx-auto">{renderedLayout}</main>
    </div>
  );
});

export default Home;