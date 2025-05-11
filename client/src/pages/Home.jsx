import React, { useState, useEffect, useCallback, useMemo, useContext, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import debounce from 'lodash.debounce';
import logo from '../assets/slogooo.webp';
import axios from '../useraxios';

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

// Data Context
import { DataContext } from '../App';

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

const Home = React.memo(() => {
  const { cache, updateCache, isDataStale } = useContext(DataContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(cache.products.data || []);
  const [selectedGender, setSelectedGender] = useState('all');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const location = useLocation();

  // Memoize cache keys to stabilize hasValidCache
  const cacheKeys = useMemo(() => ({
    layout: cache.layout.data.length > 0 && !isDataStale(cache.layout.timestamp),
    products: cache.products.data.length > 0 && !isDataStale(cache.products.timestamp),
  }), [cache.layout, cache.products, isDataStale]);

  // Check for valid cache
  const hasValidCache = useMemo(
    () => cacheKeys.layout && cacheKeys.products,
    [cacheKeys]
  );

  // Initialize filteredProducts
  useEffect(() => {
    if (cache.products.data.length > 0 && !filteredProducts.length && !searchQuery) {
      setFilteredProducts(cache.products.data);
    }
  }, [cache.products.data, filteredProducts.length, searchQuery]);

  // Fetch data with prioritization
  const fetchData = useCallback(async () => {
    if (hasValidCache) return;
    setLoading(true);

    const criticalEndpoints = [
      { key: 'layout', url: '/api/admin/auth/layout', params: {}, field: 'components' },
      { key: 'products', url: '/api/user/auth/products', params: { limit: 20 }, field: 'products' },
    ];

    const secondaryEndpoints = [
      { key: 'sellers', url: '/api/user/auth/sellers', params: { limit: 5 }, field: 'sellers' },
      { key: 'categories', url: '/api/categories', params: { limit: 8 }, field: 'categories' },
      { key: 'comboOffers', url: '/api/admin/auth/combo-offers/active', params: { limit: 3 }, field: 'comboOffers' },
      { key: 'sponsoredProducts', url: '/api/user/auth/sponsored', params: { limit: 5 }, field: 'products' },
      { key: 'ads', url: '/api/admin/auth/ads', params: {}, field: 'ads' },
    ];

    // Fetch critical endpoints first
    const criticalPromises = criticalEndpoints
      .filter(({ key }) => !cache[key].data.length || isDataStale(cache[key].timestamp))
      .map(({ url, params }) =>
        axios.get(url, { params }).catch((err) => ({
          error: err,
          data: {},
        }))
      );

    try {
      const criticalResults = await Promise.all(criticalPromises);
      let resultIndex = 0;

      criticalEndpoints.forEach(({ key, field }) => {
        if (!cache[key].data.length || isDataStale(cache[key].timestamp)) {
          const res = criticalResults[resultIndex];
          if (res.error) {
            setErrors((prev) => ({ ...prev, [key]: res.error.message }));
            toast.error(`Failed to fetch ${key}`);
          } else {
            const data = res.data[field] || res.data.layout?.[field] || [];
            updateCache(key, data);
          }
          resultIndex++;
        }
      });

      // Fetch secondary endpoints in background
      const secondaryPromises = secondaryEndpoints
        .filter(({ key }) => !cache[key].data.length || isDataStale(cache[key].timestamp))
        .map(({ url, params }) =>
          axios.get(url, { params }).catch((err) => ({
            error: err,
            data: {},
          }))
        );

      if (secondaryPromises.length > 0) {
        const secondaryResults = await Promise.all(secondaryPromises);
        resultIndex = 0;

        secondaryEndpoints.forEach(({ key, field }) => {
          if (!cache[key].data.length || isDataStale(cache[key].timestamp)) {
            const res = secondaryResults[resultIndex];
            if (res.error) {
              setErrors((prev) => ({ ...prev, [key]: res.error.message }));
            } else {
              const data = res.data[field] || res.data.layout?.[field] || [];
              updateCache(key, data);
            }
            resultIndex++;
          }
        });
      }
    } catch (error) {
      setErrors((prev) => ({ ...prev, general: error.message }));
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [cache, isDataStale, updateCache, hasValidCache]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounced server-side search
  const handleSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setFilteredProducts(cache.products.data);
        return;
      }
      try {
        const res = await axios.get('/api/user/auth/products', {
          params: { q: query, limit: 5 },
        });
        const filtered = res.data.products || [];
        setFilteredProducts(filtered);
        toast.success(`Found ${filtered.length} results for "${query}"`);
      } catch (error) {
        console.error('Search Error:', error);
        toast.error('Failed to search products');
        setFilteredProducts(cache.products.data);
      }
    }, 300),
    [cache.products.data]
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
          <div key={index} className="text-center text-red-500 py-4">
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
              placeholder={props.placeholder || 'Search on strak for strips...'}
            />
          );

        case 'CategorySection':
          return <Component key={index} categories={cache.categories.data} {...props} />;

        case 'SellerSection':
          return <Component key={index} sellers={cache.sellers.data} {...props} />;

        case 'ProductSection':
          return (
            <Component
              key={index}
              products={cache.products.data}
              filteredProducts={filteredProducts}
              setFilteredProducts={setFilteredProducts}
              onGenderChange={(gender) => {
                setSelectedGender(gender);
                if (gender === 'all') {
                  setFilteredProducts(cache.products.data);
                } else {
                  const normalizedGender = (g) => {
                    const lower = g?.toLowerCase()?.trim() || 'unknown';
                    if (['male', 'men', 'man'].includes(lower)) return 'men';
                    if (['female', 'women', 'woman'].includes(lower)) return 'women';
                    if (['kid', 'kids', 'child', 'children', 'kidz'].includes(lower)) return 'kids';
                    return 'unknown';
                  };
                  const filtered = cache.products.data
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
          const category = cache.categories.data.find(
            (cat) =>
              cat._id === props.categoryId ||
              (props.categoryName && cat.name.toLowerCase() === props.categoryName.toLowerCase())
          );
          if (!category) {
            return (
              <p key={index} className="text-center text-gray-500 py-8">
                Category {props.categoryName || 'unknown'} not available
              </p>
            );
          }
          return <Component key={index} category={category} {...props} />;

        case 'ComboOfferSection':
          return <Component key={index} comboOffers={cache.comboOffers.data} {...props} />;

        case 'SponsoredSection':
          return <Component key={index} sponsoredProducts={cache.sponsoredProducts.data} {...props} />;

        case 'SingleAdd':
          return (
            <Component
              key={index}
              images={cache.ads.data.find((ad) => ad.type === 'Single Ad')?.images || []}
              {...props}
            />
          );

        case 'DoubleAdd':
          return (
            <Component
              key={index}
              images={cache.ads.data.find((ad) => ad.type === 'Double Ad')?.images || []}
              {...props}
            />
          );

        case 'TripleAdd':
          return (
            <Component
              key={index}
              images={cache.ads.data.find((ad) => ad.type === 'Triple Ad')?.images || []}
              {...props}
            />
          );

        case 'RecentlyViewedSection':
        case 'TrendingSection':
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
      <div className="text-center flex flex-col min-h-screen justify-center items-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-lg mt-4">Loading...</p>
      </div>
    ),
    []
  );

  // Default layout
  const defaultLayout = useMemo(
    () => [
      { name: 'SearchBar', props: {} },
      { name: 'ProductSection', props: {} },
      { name: 'TripleAdd', props: {} },
      { name: 'CategorySection', props: {} },
      { name: 'SponsoredSection', props: {} },
    ],
    []
  );

  // Memoized layout rendering
  const renderedLayout = useMemo(() => {
    if (loading) return <Suspense fallback={LoadingUI}>{LoadingUI}</Suspense>;

    if (errors.layout) {
      return (
        <div className="text-center py-8 text-red-500">
          <p>Failed to load: {errors.layout}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    const effectiveLayout = cache.layout.data.length ? cache.layout.data : defaultLayout;
    return (
      <Suspense fallback={LoadingUI}>
        {effectiveLayout.map((component, index) => renderComponent(component, index))}
      </Suspense>
    );
  }, [cache.layout.data, loading, errors, renderComponent, LoadingUI, defaultLayout]);

  return (
    <div className="min-h-screen bg-gray-100/80">
      <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
      <main className="container mx-auto px-1">{renderedLayout}</main>
    </div>
  );
});

export default Home;