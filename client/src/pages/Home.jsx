import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import debounce from 'lodash.debounce';
import axios from '../useraxios';
import logo from '../assets/slogooo.webp';
// import Loding from '../assets/loadingg.mp4';

// Component imports
import SearchBar from '../Components/home/SearchBar';
import CategorySection from '../Components/home/CategorySection';
import SellerSection from '../Components/home/SellerSection';
import ProductSection from '../Components/home/ProductSection';
import Topbox from '../Components/home/Topbox';
import SingleAdd from '../Components/home/SingleAdd';
import DoubleAdd from '../Components/home/DoubleAdd';
import TripleAdd from '../Components/home/TripleAdd';
import CategorySectionn from '../Components/home/CategorySectionn';
import ComboOfferSection from '../Components/home/ComboOfferSection';
import TrendingSection from '../Components/home/TrendingSection';
import SponsoredSection from '../Components/home/SponsoredSection';
import RecentlyViewedSection from '../Components/home/RecentlyViewedSection';

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
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const location = useLocation();
  const fetchRef = useRef(false);
  const isInitialMount = useRef(true);

  // Check for valid cache
  const hasValidCache = useMemo(
    () => cache.layout.data.length > 0 && cache.products.data.length > 0 && !isDataStale(cache.layout.timestamp) && !isDataStale(cache.products.timestamp),
    [cache.layout, cache.products, isDataStale]
  );

  // Initialize filteredProducts
  useEffect(() => {
    if (hasValidCache && !filteredProducts.length) {
      setFilteredProducts(cache.products.data);
    }
    if (isInitialMount.current) {
      setLoading(!hasValidCache);
      isInitialMount.current = false;
    }
  }, [cache.products.data, filteredProducts.length, hasValidCache]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (fetchRef.current || hasValidCache) return;
    fetchRef.current = true;

    const endpoints = [
      { key: 'products', url: '/api/user/auth/products', params: { limit: 20, page: 1 }, field: 'products' },
      { key: 'layout', url: '/api/admin/auth/layout', params: {}, field: 'components' },
      { key: 'sellers', url: '/api/user/auth/sellers', params: { limit: 10 }, field: 'sellers' },
      { key: 'categories', url: '/api/categories', params: { limit: 10 }, field: 'categories' },
      { key: 'comboOffers', url: '/api/admin/auth/combo-offers/active', params: { limit: 5 }, field: 'comboOffers' },
      { key: 'sponsoredProducts', url: '/api/user/auth/sponsored', params: { limit: 10 }, field: 'products' },
      { key: 'ads', url: '/api/admin/auth/ads', params: {}, field: 'ads' },
    ];

    const promises = endpoints
      .filter(({ key }) => !cache[key].data.length || isDataStale(cache[key].timestamp))
      .map(({ url, params }) =>
        axios.get(url, { params }).catch((err) => ({
          error: err,
          data: {},
        }))
      );

    if (promises.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const results = await Promise.all(promises);
      let resultIndex = 0;

      endpoints.forEach(({ key, field }) => {
        if (!cache[key].data.length || isDataStale(cache[key].timestamp)) {
          const res = results[resultIndex];
          if (res.error) {
            setErrors((prev) => ({ ...prev, [key]: res.error.message }));
            toast.error(`Failed to fetch ${key}`);
          } else {
            const data = res.data[field] || res.data.layout?.[field] || [];
            updateCache(key, data);
            if (key === 'products' && !filteredProducts.length) {
              setFilteredProducts(data);
            }
          }
          resultIndex++;
        }
      });
    } catch (error) {
      setErrors((prev) => ({ ...prev, general: error.message }));
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [cache, isDataStale, updateCache, filteredProducts.length, hasValidCache]);

  useEffect(() => {
    fetchData();
    return () => {
      fetchRef.current = false;
    };
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
          params: { q: query, limit: 20 },
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
              {...props}
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
    [cache, filteredProducts, searchQuery, handleSearchChange, handleSearch]
  );

  // Memoized loading UI
  const LoadingUI = useMemo(
    () => (
      <div className="text-center flex flex-col min-h-screen relative justify-center items-center">
        <div className="absolute w-full top-[45%] left-1/2 mix-blend-multiply -translate-x-1/2 -translate-y-1/2">
          {/* <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full m-auto object-cover mix-blend-multiply"
            src={Loding}
            loading="lazy"
          /> */}
        </div>
        <img
          className="drop-shadow-xl w-1/2 opacity-0 relative -z-10"
          src={logo}
          alt="Logo"
          loading="lazy"
        />
        <p className="text-gray-500 text-lg z-10">Stark strips</p>
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
    if (loading) return LoadingUI;

    if (errors.layout || errors.products) {
      return (
        <div className="text-center py-8 text-red-500">
          <p>Failed to load: {errors.layout || errors.products}</p>
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
    return effectiveLayout.map((component, index) => renderComponent(component, index));
  }, [cache.layout.data, loading, errors, renderComponent, LoadingUI, defaultLayout]);

  return (
    <div className="min-h-screen bg-gray-100/80">
      <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
      <main className="container mx-auto px-1">{renderedLayout}</main>
    </div>
  );
});

export default Home;