// import React, { useState, useEffect } from 'react';
// import { Toaster } from 'react-hot-toast';
// import SearchBar from '../components/SearchBar';
// import CategorySection from '../components/home/CategorySection';
// import SellerSection from '../components/home/SellerSection';
// import ProductSection from '../components/home/ProductSection';
// import axios from '../useraxios';
// import toast from 'react-hot-toast';
// import Topbox from '../components/home/Topbox';
// import SingleAdd from '../components/home/SingleAdd';
// import DoubleAdd from '../components/home/DoubleAdd';
// import TripleAdd from '../components/home/TripleAdd';
// import CategorySectionn from '../components/home/CategorySectionn';
// import ComboOfferSection from '../Components/home/ComboOfferSection';
// import TrendingSection from '../Components/home/TrendingSection';
// import SponsoredSection from '../Components/home/SponsoredSection';
// import RecentlyViewedSection from '../Components/home/RecentlyViewedSection';

// const Home = () => {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [products, setProducts] = useState([]);
//   const [filteredProducts, setFilteredProducts] = useState([]);
//   const [sellers, setSellers] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const handleSearch = (e) => {
//     e.preventDefault();
//     if (!searchQuery.trim()) {
//       toast.error('Please enter a search term');
//       setFilteredProducts(products);
//       return;
//     }
//     const filtered = products.filter((product) =>
//       product.name.toLowerCase().includes(searchQuery.toLowerCase())
//     );
//     setFilteredProducts(filtered);
//     toast.success(`Showing results for: ${searchQuery}`);
//   };

//   useEffect(() => {
//     let isMounted = true;

//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const productsRes = await axios.get('/api/user/auth/products');
//         if (isMounted) {
//           setProducts(productsRes.data.products || []);
//           setFilteredProducts(productsRes.data.products || []);
//         }

//         const sellersRes = await axios.get('/api/user/auth/sellers');
//         if (isMounted) setSellers(sellersRes.data.sellers || []);

//         const categoriesRes = await axios.get('/api/categories');
//         if (isMounted) setCategories(categoriesRes.data.categories || []);
//       } catch (error) {
//         toast.error('Failed to fetch data: ' + (error.response?.data?.message || error.message));
//       } finally {
//         if (isMounted) setLoading(false);
//       }
//     };

//     fetchData();
//     return () => {
//       isMounted = false;
//     };
//   }, []);

//   // Find the "Jeans" category
//   const jeansCategory = categories.find((cat) => cat.name.toLowerCase() === 'jeans');

//   return (
//     <div className="min-h-screen bg-gray-100/50">
//       <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
//       <main className="">
//         <SearchBar
//           onSearch={handleSearch}
//           searchQuery={searchQuery}
//           setSearchQuery={setSearchQuery}
//           placeholder="go for search ..."
//         />
//         <Topbox />
//         <RecentlyViewedSection />
//         <SponsoredSection />
//         <ComboOfferSection />
//         <SingleAdd />
//         <CategorySection categories={categories} loading={loading} />
//         <SellerSection sellers={sellers} loading={loading} />
//         <TripleAdd />
//         <DoubleAdd />
//         {jeansCategory ? (
//           <CategorySectionn category={jeansCategory} />
//         ) : (
//           <p className="text-center text-gray-500 py-8">Jeans category not available.</p>
//         )}
//         <TrendingSection />
//         <ProductSection
//           products={products}
//           filteredProducts={filteredProducts}
//           setFilteredProducts={setFilteredProducts}
//           loading={loading}
//         />
//       </main>
//     </div>
//   );
// };

// export default Home;

import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import SearchBar from '../components/SearchBar';
import CategorySection from '../components/home/CategorySection';
import SellerSection from '../components/home/SellerSection';
import ProductSection from '../components/home/ProductSection';
import axios from '../useraxios';
import toast from 'react-hot-toast';
import Topbox from '../components/home/Topbox';
import SingleAdd from '../components/home/SingleAdd';
import DoubleAdd from '../components/home/DoubleAdd';
import TripleAdd from '../components/home/TripleAdd';
import CategorySectionn from '../components/home/CategorySectionn';
import ComboOfferSection from '../Components/home/ComboOfferSection';
import TrendingSection from '../Components/home/TrendingSection';
import SponsoredSection from '../Components/home/SponsoredSection';
import RecentlyViewedSection from '../Components/home/RecentlyViewedSection';

// Map component names to React components
const componentMap = {
  SearchBar: SearchBar,
  Topbox: Topbox,
  RecentlyViewedSection: RecentlyViewedSection,
  SponsoredSection: SponsoredSection,
  ComboOfferSection: ComboOfferSection,
  SingleAdd: SingleAdd,
  CategorySection: CategorySection,
  SellerSection: SellerSection,
  TripleAdd: TripleAdd,
  DoubleAdd: DoubleAdd,
  CategorySectionn: CategorySectionn,
  TrendingSection: TrendingSection,
  ProductSection: ProductSection,
};

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [layout, setLayout] = useState([]);
  const [loading, setLoading] = useState(true);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      setFilteredProducts(products);
      return;
    }
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
    toast.success(`Showing results for: ${searchQuery}`);
  };

  // Fetch data (products, sellers, categories, layout)
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch products
        const productsRes = await axios.get('/api/user/auth/products');
        if (isMounted) {
          setProducts(productsRes.data.products || []);
          setFilteredProducts(productsRes.data.products || []);
        }

        // Fetch sellers
        const sellersRes = await axios.get('/api/user/auth/sellers');
        if (isMounted) setSellers(sellersRes.data.sellers || []);

        // Fetch categories
        const categoriesRes = await axios.get('/api/categories');
        if (isMounted) setCategories(categoriesRes.data.categories || []);

        // Fetch layout
        const layoutRes = await axios.get('/api/admin/auth/layout');
        if (isMounted) setLayout(layoutRes.data.components || []);
      } catch (error) {
        toast.error('Failed to fetch data: ' + (error.response?.data?.message || error.message));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Render a single component dynamically
  const renderComponent = (component, index) => {
    const Component = componentMap[component.name];
    if (!Component) {
      return (
        <div key={index} className="text-center text-red-500 py-4">
          Component {component.name} not found
        </div>
      );
    }

    // Prepare props based on component type
    let props = { ...component.props };
    if (component.name === 'SearchBar') {
      props = {
        onSearch: handleSearch,
        searchQuery,
        setSearchQuery,
        placeholder: props.placeholder || 'go for search ...',
      };
    } else if (component.name === 'CategorySection') {
      props = {
        categories,
        loading,
      };
    } else if (component.name === 'SellerSection') {
      props = {
        sellers,
        loading,
      };
    } else if (component.name === 'ProductSection') {
      props = {
        products,
        filteredProducts,
        setFilteredProducts,
        loading,
      };
    } else if (component.name === 'CategorySectionn') {
      const category = categories.find(
        (cat) => cat._id === props.categoryId || cat.name.toLowerCase() === props.categoryName?.toLowerCase()
      );
      if (!category) {
        return (
          <p key={index} className="text-center text-gray-500 py-8">
            Category not available for {props.categoryName || 'unknown'}.
          </p>
        );
      }
      props = { category };
    }

    return <Component key={index} {...props} />;
  };

  return (
    <div className="min-h-screen bg-gray-100/50">
      <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
      <main className="">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          layout.map((component, index) => renderComponent(component, index))
        )}
      </main>
    </div>
  );
};

export default Home;