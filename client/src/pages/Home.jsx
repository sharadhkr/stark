import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import debounce from 'lodash.debounce';
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
import axios from '../useraxios';

// Map component names to React components
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
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [comboOffers, setComboOffers] = useState([]);
  const [sponsoredProducts, setSponsoredProducts] = useState([]);
  const [layout, setLayout] = useState([]);
  const [loading, setLoading] = useState({
    products: true,
    sellers: true,
    categories: true,
    layout: true,
    comboOffers: true,
    sponsoredProducts: true,
  });
  const [errors, setErrors] = useState({});

  // Debounced search handler
  const handleSearch = useCallback(
    debounce((query) => {
      if (!query.trim()) {
        setFilteredProducts(products);
        toast.error('Please enter a search term');
        return;
      }
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(filtered);
      toast.success(`Showing ${filtered.length} results for: ${query}`);
    }, 300),
    [products]
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  // Fetch all necessary data
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [
          productsRes,
          sellersRes,
          categoriesRes,
          layoutRes,
          comboOffersRes,
          sponsoredProductsRes,
        ] = await Promise.all([
          axios.get('/api/user/auth/products').catch((err) => ({
            error: err,
            data: { products: [] },
          })),
          axios.get('/api/user/auth/sellers').catch((err) => ({
            error: err,
            data: { sellers: [] },
          })),
          axios.get('/api/categories').catch((err) => ({
            error: err,
            data: { categories: [] },
          })),
          axios.get('/api/admin/auth/layout').catch((err) => ({
            error: err,
            data: { components: [] },
          })),
          axios.get('/api/admin/auth/combo-offers/active').catch((err) => ({
            error: err,
            data: { comboOffers: [] },
          })),
          axios.get('/api/admin/auth/sponsored').catch((err) => ({
            error: err,
            data: { products: [] },
          })),
        ]);

        if (!isMounted) return;

        // Process products
        if (productsRes.error) {
          setErrors((prev) => ({ ...prev, products: productsRes.error.message }));
          toast.error('Failed to fetch products');
        } else {
          setProducts(productsRes.data.products || []);
          setFilteredProducts(productsRes.data.products || []);
        }

        // Process sellers
        if (sellersRes.error) {
          setErrors((prev) => ({ ...prev, sellers: sellersRes.error.message }));
          toast.error('Failed to fetch sellers');
        } else {
          setSellers(sellersRes.data.sellers || []);
        }

        // Process categories
        if (categoriesRes.error) {
          setErrors((prev) => ({ ...prev, categories: categoriesRes.error.message }));
          toast.error('Failed to fetch categories');
        } else {
          setCategories(categoriesRes.data.categories || []);
        }

        // Process layout
        if (layoutRes.error) {
          setErrors((prev) => ({ ...prev, layout: layoutRes.error.message }));
          toast.error('Failed to fetch layout');
        } else {
          const components = layoutRes.data.layout?.components || layoutRes.data.components || [];
          setLayout(components);
        }

        // Process combo offers
        if (comboOffersRes.error) {
          setErrors((prev) => ({ ...prev, comboOffers: comboOffersRes.error.message }));
          toast.error('Failed to fetch combo offers');
        } else {
          setComboOffers(comboOffersRes.data.comboOffers || []);
        }

        // Process sponsored products
        if (sponsoredProductsRes.error) {
          setErrors((prev) => ({
            ...prev,
            sponsoredProducts: sponsoredProductsRes.error.message,
          }));
          toast.error('Failed to fetch sponsored products');
        } else {
          setSponsoredProducts(sponsoredProductsRes.data.products || []);
        }
      } catch (error) {
        if (isMounted) {
          setErrors((prev) => ({ ...prev, general: error.message }));
          toast.error('An unexpected error occurred');
        }
      } finally {
        if (isMounted) {
          setLoading({
            products: false,
            sellers: false,
            categories: false,
            layout: false,
            comboOffers: false,
            sponsoredProducts: false,
          });
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
      handleSearch.cancel(); // Cancel debounced function
    };
  }, [handleSearch]);

  // Render a single component dynamically
  const renderComponent = useCallback(
    (component, index) => {
      const Component = componentMap[component.name];
      if (!Component) {
        console.warn(`Component ${component.name} not found in componentMap`);
        return (
          <div key={index} className="text-center text-red-500 py-4">
            Component {component.name} not found
          </div>
        );
      }

      // Prepare props based on component type
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
              placeholder={props.placeholder || 'Search for products...'}
            />
          );

        case 'CategorySection':
          return (
            <Component
              key={index}
              categories={categories}
              loading={loading.categories}
              {...props}
            />
          );

        case 'SellerSection':
          return (
            <Component key={index} sellers={sellers} loading={loading.sellers} {...props} />
          );

        case 'ProductSection':
          return (
            <Component
              key={index}
              products={products}
              filteredProducts={filteredProducts}
              setFilteredProducts={setFilteredProducts}
              loading={loading.products}
              {...props}
            />
          );

        case 'CategorySectionn':
          const category = categories.find(
            (cat) =>
              cat._id === props.categoryId ||
              (props.categoryName &&
                cat.name.toLowerCase() === props.categoryName.toLowerCase())
          );
          if (!category) {
            console.warn(
              `Category not found for CategorySectionn with props:`,
              props
            );
            return (
              <p key={index} className="text-center text-gray-500 py-8">
                Category {props.categoryName || 'unknown'} not available.
              </p>
            );
          }
          return <Component key={index} category={category} {...props} />;

        case 'ComboOfferSection':
          return (
            <Component
              key={index}
              comboOffers={comboOffers}
              loading={loading.comboOffers}
              {...props}
            />
          );

        case 'SponsoredSection':
          return (
            <Component
              key={index}
              sponsoredProducts={sponsoredProducts}
              loading={loading.sponsoredProducts}
              {...props}
            />
          );

        case 'RecentlyViewedSection':
        case 'TrendingSection':
        case 'Topbox':
        case 'SingleAdd':
        case 'DoubleAdd':
        case 'TripleAdd':
          return <Component key={index} {...props} />;

        default:
          return <Component key={index} {...props} />;
      }
    },
    [
      categories,
      sellers,
      products,
      filteredProducts,
      comboOffers,
      sponsoredProducts,
      searchQuery,
      loading,
      handleSearch,
    ]
  );

  // Memoized layout rendering to prevent unnecessary re-renders
  const renderedLayout = useMemo(() => {
    if (loading.layout) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading layout...</p>
        </div>
      );
    }

    if (errors.layout) {
      return (
        <div className="text-center py-8 text-red-500">
          <p>Failed to load layout: {errors.layout}</p>
        </div>
      );
    }

    if (!layout.length) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No layout components defined.</p>
        </div>
      );
    }

    return layout.map((component, index) => renderComponent(component, index));
  }, [layout, loading.layout, errors.layout, renderComponent]);

  return (
    <div className="min-h-screen bg-gray-100/50">
      <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
      <main className="container mx-auto px-4">{renderedLayout}</main>
    </div>
  );
};

export default Home;