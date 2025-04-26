// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import { Toaster, toast } from 'react-hot-toast';
// import debounce from 'lodash.debounce';
// import SearchBar from '../Components/home/SearchBar';
// import CategorySection from '../Components/home/CategorySection';
// import SellerSection from '../Components/home/SellerSection';
// import ProductSection from '../Components/home/ProductSection';
// import Topbox from '../Components/home/Topbox';
// import SingleAdd from '../Components/home/SingleAdd';
// import DoubleAdd from '../Components/home/DoubleAdd';
// import TripleAdd from '../Components/home/TripleAdd';
// import CategorySectionn from '../Components/home/CategorySectionn';
// import ComboOfferSection from '../Components/home/ComboOfferSection';
// import TrendingSection from '../Components/home/TrendingSection';
// import SponsoredSection from '../Components/home/SponsoredSection';
// import RecentlyViewedSection from '../Components/home/RecentlyViewedSection';
// import axios from '../useraxios';
// import logo from '../assets/slogooo.png';
// import Loding from '../assets/loadingg.mp4'
// // Map component names to React components
// const componentMap = {
//   SearchBar,
//   Topbox,
//   RecentlyViewedSection,
//   SponsoredSection,
//   ComboOfferSection,
//   SingleAdd,
//   CategorySection,
//   SellerSection,
//   TripleAdd,
//   DoubleAdd,
//   CategorySectionn,
//   TrendingSection,
//   ProductSection,
// };

// const Home = () => {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [products, setProducts] = useState([]);
//   const [filteredProducts, setFilteredProducts] = useState([]);
//   const [sellers, setSellers] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [comboOffers, setComboOffers] = useState([]);
//   const [sponsoredProducts, setSponsoredProducts] = useState([]);
//   const [layout, setLayout] = useState([]);
//   const [loading, setLoading] = useState({
//     products: true,
//     sellers: true,
//     categories: true,
//     layout: true,
//     comboOffers: true,
//     sponsoredProducts: true,
//   });
//   const [errors, setErrors] = useState({});

//   // Debounced search handler
//   const handleSearch = useCallback(
//     debounce((query) => {
//       if (!query.trim()) {
//         setFilteredProducts(products);
//         toast.error('Please enter a search term');
//         return;
//       }
//       const filtered = products.filter((product) =>
//         product.name.toLowerCase().includes(query.toLowerCase())
//       );
//       setFilteredProducts(filtered);
//       toast.success(`Showing ${filtered.length} results for: ${query}`);
//     }, 300),
//     [products]
//   );

//   // Handle search input change
//   const handleSearchChange = (e) => {
//     const query = e.target.value;
//     setSearchQuery(query);
//     handleSearch(query);
//   };

//   // Fetch all necessary data
//   useEffect(() => {
//     let isMounted = true;

//     const fetchData = async () => {
//       try {
//         const [
//           productsRes,
//           sellersRes,
//           categoriesRes,
//           layoutRes,
//           comboOffersRes,
//           sponsoredProductsRes,
//         ] = await Promise.all([
//           axios.get('/api/user/auth/products').catch((err) => ({
//             error: err,
//             data: { products: [] },
//           })),
//           axios.get('/api/user/auth/sellers').catch((err) => ({
//             error: err,
//             data: { sellers: [] },
//           })),
//           axios.get('/api/categories').catch((err) => ({
//             error: err,
//             data: { categories: [] },
//           })),
//           axios.get('/api/admin/auth/layout').catch((err) => ({
//             error: err,
//             data: { components: [] },
//           })),
//           axios.get('/api/admin/auth/combo-offers/active').catch((err) => ({
//             error: err,
//             data: { comboOffers: [] },
//           })),
//           axios.get('/api/user/auth/sponsored').catch((err) => ({
//             error: err,
//             data: { products: [] },
//           })),
//         ]);

//         if (!isMounted) return;

//         // Process products
//         if (productsRes.error) {
//           setErrors((prev) => ({ ...prev, products: productsRes.error.message }));
//           toast.error('Failed to fetch products');
//         } else {
//           setProducts(productsRes.data.products || []);
//           setFilteredProducts(productsRes.data.products || []);
//         }

//         // Process sellers
//         if (sellersRes.error) {
//           setErrors((prev) => ({ ...prev, sellers: sellersRes.error.message }));
//           toast.error('Failed to fetch sellers');
//         } else {
//           setSellers(sellersRes.data.sellers || []);
//         }

//         // Process categories
//         if (categoriesRes.error) {
//           setErrors((prev) => ({ ...prev, categories: categoriesRes.error.message }));
//           toast.error('Failed to fetch categories');
//         } else {
//           setCategories(categoriesRes.data.categories || []);
//         }

//         // Process layout
//         if (layoutRes.error) {
//           setErrors((prev) => ({ ...prev, layout: layoutRes.error.message }));
//           toast.error('Failed to fetch layout');
//         } else {
//           const components = layoutRes.data.layout?.components || layoutRes.data.components || [];
//           setLayout(components);
//         }

//         // Process combo offers
//         if (comboOffersRes.error) {
//           setErrors((prev) => ({ ...prev, comboOffers: comboOffersRes.error.message }));
//           toast.error('Failed to fetch combo offers');
//         } else {
//           setComboOffers(comboOffersRes.data.comboOffers || []);
//         }

//         // Process sponsored products
//         if (sponsoredProductsRes.error) {
//           setErrors((prev) => ({
//             ...prev,
//             sponsoredProducts: sponsoredProductsRes.error.message,
//           }));
//           toast.error('Failed to fetch sponsored products');
//         } else {
//           setSponsoredProducts(sponsoredProductsRes.data.products || []);
//         }
//       } catch (error) {
//         if (isMounted) {
//           setErrors((prev) => ({ ...prev, general: error.message }));
//           toast.error('An unexpected error occurred');
//         }
//       } finally {
//         if (isMounted) {
//           setLoading({
//             products: false,
//             sellers: false,
//             categories: false,
//             layout: false,
//             comboOffers: false,
//             sponsoredProducts: false,
//           });
//         }
//       }
//     };

//     fetchData();
//     return () => {
//       isMounted = false;
//       handleSearch.cancel(); // Cancel debounced function
//     };
//   }, [handleSearch]);

//   // Render a single component dynamically
//   const renderComponent = useCallback(
//     (component, index) => {
//       const Component = componentMap[component.name];
//       if (!Component) {
//         console.warn(`Component ${component.name} not found in componentMap`);
//         return (
//           <div key={index} className="text-center text-red-500 py-4">
//             Component {component.name} not found
//           </div>
//         );
//       }

//       // Prepare props based on component type
//       const props = { ...component.props };

//       switch (component.name) {
//         case 'SearchBar':
//           return (
//             <Component
//               key={index}
//               onSearch={(e) => {
//                 e.preventDefault();
//                 handleSearch(searchQuery);
//               }}
//               searchQuery={searchQuery}
//               setSearchQuery={handleSearchChange}
//               placeholder={props.placeholder || 'Search on strak for strips...'}
//             />
//           );

//         case 'CategorySection':
//           return (
//             <Component
//               key={index}
//               categories={categories}
//               loading={loading.categories}
//               {...props}
//             />
//           );

//         case 'SellerSection':
//           return (
//             <Component key={index} sellers={sellers} loading={loading.sellers} {...props} />
//           );

//         case 'ProductSection':
//           return (
//             <Component
//               key={index}
//               products={products}
//               filteredProducts={filteredProducts}
//               setFilteredProducts={setFilteredProducts}
//               loading={loading.products}
//               {...props}
//             />
//           );

//         case 'CategorySectionn':
//           const category = categories.find(
//             (cat) =>
//               cat._id === props.categoryId ||
//               (props.categoryName &&
//                 cat.name.toLowerCase() === props.categoryName.toLowerCase())
//           );
//           if (!category) {
//             console.warn(
//               `Category not found for CategorySectionn with props:`,
//               props
//             );
//             return (
//               <p key={index} className="text-center text-gray-500 py-8">
//                 Category {props.categoryName || 'unknown'} not available.
//               </p>
//             );
//           }
//           return <Component key={index} category={category} {...props} />;

//         case 'ComboOfferSection':
//           return (
//             <Component
//               key={index}
//               comboOffers={comboOffers}
//               loading={loading.comboOffers}
//               {...props}
//             />
//           );

//         case 'SponsoredSection':
//           return (
//             <Component
//               key={index}
//               sponsoredProducts={sponsoredProducts}
//               loading={loading.sponsoredProducts}
//               {...props}
//             />
//           );

//         case 'RecentlyViewedSection':
//         case 'TrendingSection':
//         case 'Topbox':
//         case 'SingleAdd':
//         case 'DoubleAdd':
//         case 'TripleAdd':
//           return <Component key={index} {...props} />;

//         default:
//           return <Component key={index} {...props} />;
//       }
//     },
//     [
//       categories,
//       sellers,
//       products,
//       filteredProducts,
//       comboOffers,
//       sponsoredProducts,
//       searchQuery,
//       loading,
//       handleSearch,
//     ]
//   );

//   // Memoized layout rendering to prevent unnecessary re-renders
//   const renderedLayout = useMemo(() => {
//     if (loading.layout) {
//       return (
//         <div className="text-center flex flex-col min-h-screen relative justify-center items-center">
//           <div className='absolute w-full top-[45%] left-1/2 mix-blend-multiply -translate-x-1/2 -translate-y-1/2'>
//             <video
//               autoPlay
//               loop
//               muted
//               playsInline
//               className="w-full m-auto object-cover mix-blend-multiply"
//               src={Loding}
//             ></video>
//           </div>
//           <img className="drop-shadow-xl w-1/2 opacity-0 relative -z-10" src={logo} alt="Logo" />
//           <p className="text-gray-500 text-lg z-10">  Stark strips</p>
//         </div>

//       );
//     }

//     if (errors.layout) {
//       return (
//         <div className="text-center py-8 text-red-500">
//           <p>Failed to load layout: {errors.layout}</p>
//         </div>
//       );
//     }

//     if (!layout.length) {
//       return (
//         <div className="text-center py-8 text-gray-500">
//           <p>No layout components defined.</p>
//         </div>
//       );
//     }

//     return layout.map((component, index) => renderComponent(component, index));
//   }, [layout, loading.layout, errors.layout, renderComponent]);

//   return (
//     <div className="min-h-screen bg-gray-100/80">
//       <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
//       <main className="container mx-auto px-1">{renderedLayout}</main>
//     </div>
//   );
// };

// export default Home;
import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import debounce from 'lodash.debounce';
import axios from '../useraxios';
import logo from '../assets/slogooo.png';
import Loding from '../assets/loadingg.mp4';

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

const useData = () => useContext(DataContext);

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

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const { cache, updateCache, isDataStale } = useData();
  const location = useLocation();
  const isInitialMount = useRef(true);
  const fetchRef = useRef(false);

  // Synchronous cache check
  const hasValidCache = cache.layout.data.length && cache.products.data.length;
  const [loading, setLoading] = useState(!hasValidCache && isInitialMount.current);

  // Initialize filteredProducts and update loading
  useEffect(() => {
    if (hasValidCache) {
      if (!filteredProducts.length) {
        setFilteredProducts(cache.products.data);
      }
      setLoading(false);
    }
    isInitialMount.current = false;
  }, [cache.products.data, filteredProducts.length, hasValidCache]);

  // Fetch data
  useEffect(() => {
    console.log('Home component mounted, pathname:', location.pathname);
    if (fetchRef.current || hasValidCache) return;
    fetchRef.current = true;

    const fetchData = async () => {
      console.log('Fetch triggered at:', new Date().toISOString());
      console.log('Initial Cache:', cache);

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
        console.log('No fetches needed, using cache');
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
              console.error(`Error fetching ${key}:`, res.error);
              setErrors((prev) => ({ ...prev, [key]: res.error.message }));
              toast.error(`Failed to fetch ${key}`);
            } else {
              const data = res.data[field] || res.data.layout?.[field] || [];
              console.log(`Fetched ${key}:`, data);
              updateCache(key, data);
              if (key === 'products' && !filteredProducts.length) {
                setFilteredProducts(data);
              }
            }
            resultIndex++;
          }
        });
      } catch (error) {
        console.error('General fetch error:', error);
        setErrors((prev) => ({ ...prev, general: error.message }));
        toast.error('An unexpected error occurred');
      } finally {
        setLoading(false);
        console.log('Fetch completed, loading set to false');
      }
    };

    fetchData();
    return () => {
      console.log('Home component unmounted');
      fetchRef.current = false;
    };
  }, [cache, isDataStale, updateCache, location.pathname, hasValidCache, filteredProducts.length]);

  // Debug state changes
  const [errors, setErrors] = useState({});
  useEffect(() => {
    console.log('State updated - Cache:', cache);
    console.log('State updated - Loading:', loading);
    console.log('State updated - Errors:', errors);
  }, [cache, loading, errors]);

  // Debounced server-side search
  const handleSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setFilteredProducts(cache.products.data);
        toast.error('Please enter a search term');
        return;
      }
      try {
        const res = await axios.get('/api/user/auth/products', {
          params: { q: query, limit: 20 },
        });
        const filtered = res.data.products || [];
        setFilteredProducts(filtered);
        toast.success(`Showing ${filtered.length} results for "${query}"`);
      } catch (error) {
        console.error('Search Error:', error);
        toast.error('Failed to search products');
        setFilteredProducts(cache.products.data);
      }
    }, 500),
    [cache.products.data]
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  // Render components dynamically
  const renderComponent = useCallback(
    (component, index) => {
      const Component = componentMap[component.name];
      if (!Component) {
        console.warn(`Component ${component.name} not found`);
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
                Category {props.categoryName || 'unknown'} not available.
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
    [cache, filteredProducts, searchQuery, handleSearch]
  );

  // Memoized loading UI
  const LoadingUI = useMemo(
    () => (
      <div className="text-center flex flex-col min-h-screen relative justify-center items-center">
        <div className="absolute w-full top-[45%] left-1/2 mix-blend-multiply -translate-x-1/2 -translate-y-1/2">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full m-auto object-cover mix-blend-multiply"
            src={Loding}
          ></video>
        </div>
        <img
          className="drop-shadow-xl w-1/2 opacity-0 relative -z-10"
          src={logo}
          alt="Logo"
        />
        <p className="text-gray-500 text-lg z-10">Stark strips</p>
      </div>
    ),
    []
  );

  // Default layout if empty
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
    if (loading) {
      return LoadingUI;
    }

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
};

export default Home;