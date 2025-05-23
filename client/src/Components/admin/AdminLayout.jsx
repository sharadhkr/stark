import React, { useState, useEffect, useCallback, useMemo } from 'react';

import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner, FaSave, FaEdit, FaTrash, FaGripVertical, FaHome } from 'react-icons/fa';

// Mock useAdminAuth hook (replace with your actual implementation)
const useAdminAuth = () => ({
  isAdmin: true,
  error: null,
  checkAdmin: () => { },
});

// Mock axios (replace with your actual axios instance)
const axios = {
  get: async (url, config) => {
    // Simulate API response with sample layout data
    console.log(`Fetching layout from ${url} with headers:`, config.headers);
    return {
      data: {
        components: [
          { name: 'SearchBar', props: {} },
          { name: 'CategorySectionn', props: { categoryId: 'cat1', categoryName: 'Electronics' } },
        ],
      },
    };
  },
  post: async (url, data, config) => {
    // Simulate successful save
    console.log(`Saving layout to ${url} with data:`, data, 'headers:', config.headers);
    return { data: { success: true } };
  },
};

// Static component definitions
const availableComponents = [
  { id: 'search-bar', name: 'SearchBar', displayName: 'Search Bar' },
  { id: 'topbox', name: 'Topbox', displayName: 'Top Box' },
  { id: 'recently-viewed-section', name: 'RecentlyViewedSection', displayName: 'Recently Viewed' },
  { id: 'sponsored-section', name: 'SponsoredSection', displayName: 'Sponsored Products' },
  { id: 'combo-offer-section', name: 'ComboOfferSection', displayName: 'Combo Offers' },
  { id: 'single-add', name: 'SingleAdd', displayName: 'Single Ad' },
  { id: 'category-section', name: 'CategorySection', displayName: 'Category Section' },
  { id: 'seller-section', name: 'SellerSection', displayName: 'Seller Section' },
  { id: 'triple-add', name: 'TripleAdd', displayName: 'Triple Ad' },
  { id: 'double-add', name: 'DoubleAdd', displayName: 'Double Ad' },
  { id: 'category-sectionn', name: 'CategorySectionn', displayName: 'Specific Category' },
  { id: 'trending-section', name: 'TrendingSection', displayName: 'Trending Products' },
  { id: 'product-section', name: 'ProductSection', displayName: 'Product Section' },
];

// Memoized available components
const memoizedAvailableComponents = availableComponents;

// Sortable item component
const SortableItem = React.memo(
  ({ id, name, displayName, index, isMainBox, onRemove, onEditProps }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition: transition || 'transform 0.15s ease, opacity 0.15s ease',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      touchAction: 'none',
      zIndex: isDragging ? 1000 : 1,
      opacity: isDragging ? 0.7 : 1,
    };

    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        {...attributes}
        initial={{ opacity: 0, y: 8 }}
        animate={{
          opacity: isDragging ? 0.7 : 1,
          y: 0,
          scale: isDragging ? 1.03 : 1,
          boxShadow: isDragging
            ? '0 6px 20px rgba(0,0,0,0.15)'
            : '0 1px 6px rgba(0,0,0,0.08)',
        }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ type: 'spring', stiffness: 800, damping: 15 }}
        className={`px-2 my-2 rounded-xl flex items-center gap-2 touch-none border select-none h-10 bg-gradient-to-r ${isMainBox
          ? 'from-green-100 to-green-100 text-gray-600  border-green-300'
          : 'from-gray-200 to-gray-200 text-gray-700  border-gray-400'
          } ${isMainBox ? 'justify-between' : 'cursor-grab'}`}
        role="button"
        aria-label={`Drag ${displayName} component`}
        onTouchStart={() => 'vibrate' in navigator && navigator.vibrate(15)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !isMainBox) listeners?.onMouseDown?.(e);
          if (e.key === 'Escape') listeners?.onMouseUp?.(e);
        }}
      >
        <FaGripVertical
          className="text-gray-600 text-sm cursor-grab touch-none"
          {...listeners}
          aria-hidden="true"
        />
        <span className="flex-1 text-xs font-medium select-none truncate">{displayName}</span>
        {isMainBox && (
          <div className="flex gap-1">
            {name === 'CategorySectionn' && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onEditProps(index)}
                className="p-1 bg-yellow-400 text-white rounded-full hover:bg-yellow-500 transition-colors"
                aria-label={`Edit properties for ${displayName}`}
                title="Edit Properties"
              >
                <FaEdit size={10} />
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onRemove(index)}
              className="p-1 bg-red-400 text-white rounded-full hover:bg-red-500 transition-colors"
              aria-label={`Remove ${displayName} from layout`}
              title="Remove Component"
            >
              <FaTrash size={10} />
            </motion.button>
          </div>
        )}
      </motion.div>
    );
  },
  (prev, next) => prev.id === next.id && prev.isMainBox === next.isMainBox
);

// Droppable main box component
const DroppableMainBox = React.memo(({ children, id }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[400px] bg-white rounded-md p-3 border-2 ${isOver ? 'border-blue-300 bg-blue-25' : 'border-gray-100'
        } overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-50 touch-none transition-colors duration-200`}
      role="region"
      aria-label="Homepage layout droppable area"
    >
      {children}
    </div>
  );
});

// Debounce utility for state updates
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const AdminLayout = ({ categories = [], loading: parentLoading }) => {
  const { isAdmin, error, checkAdmin } = useAdminAuth();
  const [mainBoxComponents, setMainBoxComponents] = useState([]);
  const [editingProps, setEditingProps] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [layoutError, setLayoutError] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 2 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 30, tolerance: 1 } })
  );

  const fadeIn = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  };

  const generateUniqueId = useCallback((name) => {
    return `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  useEffect(() => {
    const fetchLayout = async () => {
      setIsLoading(true);
      setLayoutError(null);
      try {
        const token = localStorage.getItem('adminToken') || 'mock-token';
        const layoutRes = await axios.get('/api/admin/auth/layout', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const components = (layoutRes.data.layout?.components || layoutRes.data.components || []).map(
          (comp) => ({
            id: generateUniqueId(comp.name),
            name: comp.name,
            props: comp.props || {},
          })
        );
        setMainBoxComponents(components);
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to fetch layout. Using fallback data.';
        console.error('Fetch layout error:', error);
        setLayoutError(message);
        toast.error(message);
        // Fallback to empty layout
        setMainBoxComponents([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAdmin) fetchLayout();
  }, [isAdmin, generateUniqueId]);

  const debouncedSetMainBoxComponents = useCallback(
    debounce((newComponents) => {
      setMainBoxComponents(newComponents);
    }, 50),
    []
  );

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      setActiveId(null);
      if (!over) return;

      const isActiveInAvailable = memoizedAvailableComponents.some((comp) => comp.id === active.id);
      const isActiveInMain = mainBoxComponents.some((comp) => comp.id === active.id);

      if (isActiveInAvailable) {
        const component = memoizedAvailableComponents.find((comp) => comp.id === active.id);
        const newComponent = {
          ...component,
          id: generateUniqueId(component.name),
          props: component.name === 'CategorySectionn' ? { categoryId: '', categoryName: '' } : {},
        };

        if (over.id === 'main-droppable') {
          debouncedSetMainBoxComponents((prev) => [...prev, newComponent]);
          toast.success(`${component.displayName} added to layout`, { duration: 2000 });
          if ('vibrate' in navigator) navigator.vibrate(15);
        } else if (mainBoxComponents.some((comp) => comp.id === over.id)) {
          const overIndex = mainBoxComponents.findIndex((comp) => comp.id === over.id);
          debouncedSetMainBoxComponents((prev) => [
            ...prev.slice(0, overIndex),
            newComponent,
            ...prev.slice(overIndex),
          ]);
          toast.success(`${component.displayName} added to layout`, { duration: 2000 });
          if ('vibrate' in navigator) navigator.vibrate(15);
        }
      } else if (isActiveInMain && mainBoxComponents.some((comp) => comp.id === over.id)) {
        const oldIndex = mainBoxComponents.findIndex((comp) => comp.id === active.id);
        const newIndex = mainBoxComponents.findIndex((comp) => comp.id === over.id);
        if (oldIndex !== newIndex) {
          debouncedSetMainBoxComponents((prev) => arrayMove(prev, oldIndex, newIndex));
          toast.success('Component reordered', { duration: 2000 });
          if ('vibrate' in navigator) navigator.vibrate(15);
        }
      }
    },
    [mainBoxComponents, generateUniqueId, debouncedSetMainBoxComponents]
  );

  const removeComponent = useCallback((index) => {
    debouncedSetMainBoxComponents((prev) => [...prev.slice(0, index), ...prev.slice(index + 1)]);
    toast.success('Component removed from layout', { duration: 2000 });
  }, [debouncedSetMainBoxComponents]);

  const editProps = useCallback(
    (index) => {
      setEditingProps({ index, props: { ...mainBoxComponents[index].props } });
    },
    [mainBoxComponents]
  );

  const updateProps = useCallback(
    (e) => {
      const { name, value } = e.target;
      setEditingProps((prev) => {
        if (name === 'categoryId') {
          const category = categories.find((cat) => cat._id === value);
          return {
            ...prev,
            props: {
              ...prev.props,
              categoryId: value,
              categoryName: category ? category.name : '',
            },
          };
        }
        return {
          ...prev,
          props: { ...prev.props, [name]: value },
        };
      });
    },
    [categories]
  );

  const saveProps = useCallback(() => {
    if (!editingProps.props.categoryId && mainBoxComponents[editingProps.index].name === 'CategorySectionn') {
      toast.error('Please select a category', { duration: 2000 });
      if ('vibrate' in navigator) navigator.vibrate([50, 50, 50]);
      return;
    }
    debouncedSetMainBoxComponents((prev) => {
      const newMainBox = [...prev];
      newMainBox[editingProps.index].props = editingProps.props;
      return newMainBox;
    });
    setEditingProps(null);
    toast.success('Properties saved', { duration: 2000 });
  }, [editingProps, mainBoxComponents, debouncedSetMainBoxComponents]);

  const saveLayout = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || 'mock-token';
      const layout = {
        components: mainBoxComponents.map((comp) => ({
          name: comp.name,
          props: comp.props,
        })),
      };
      await axios.post('/api/admin/auth/layout', layout, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 8000,
      });
      toast.success('Layout saved successfully', { duration: 2000 });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save layout';
      console.error('Save layout error:', error);
      toast.error(message, { duration: 2000 });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [mainBoxComponents]);

  const memoizedCategories = useMemo(() => categories, [categories]);

  // Find the active component for DragOverlay
  const activeComponent = activeId
    ? memoizedAvailableComponents.find((comp) => comp.id === activeId) ||
    mainBoxComponents.find((comp) => comp.id === activeId)
    : null;

  if (!Array.isArray(categories) || categories.length === 0) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="p-4 bg-red-50 rounded-md shadow-sm text-center"
      >
        <p className="text-red-600 font-medium text-xs" id="categories-error">
          Error: No categories available. Please try again.
        </p>
        <motion.button
          onClick={() => window.location.reload()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs"
          aria-label="Retry loading categories"
        >
          Retry
        </motion.button>
      </motion.div>
    );
  }

  if (isAdmin === null || parentLoading || isLoading) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex justify-center items-center h-64"
      >
        <FaSpinner className="animate-spin text-blue-600 text-3xl" aria-label="Loading" />
      </motion.div>
    );
  }

  if (!isAdmin) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="p-4 bg-red-50 rounded-md shadow-sm text-center"
      >
        <h3 className="text-base font-semibold text-red-700">Access Denied</h3>
        <p className="text-xs text-red-600 mb-3" id="access-error">
          {error || 'Please try again later.'}
        </p>
        <motion.button
          onClick={checkAdmin}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs"
          aria-label="Retry authentication"
          aria-describedby="access-error"
        >
          Retry
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="p-4 bg-gray-50 rounded-2xl shadow-2xl max-w-7xl mx-auto"
    >
      <h3 className="text-lg font-semibold w-full mx-auto  text-gray-800 mb-4">Manage Homepage Layout</h3>
      {layoutError && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-600 bg-red-50 p-2 rounded-md mb-4 text-xs"
          id="layout-error"
          role="alert"
        >
          {layoutError}
        </motion.p>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-row gap-4">
          {/* Available Components */}
          <div className="flex-1 max-w-[50%] bg-white p-3 rounded-md shadow-sm">
            <h4 className="text-xs font-medium text-gray-700 mb-3">Available Components</h4>
            <div className="bg-gray-50 rounded-md p-2 border border-gray-100 h-[calc(100vh-240px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-50">
              <SortableContext
                items={memoizedAvailableComponents.map((comp) => comp.id)}
                strategy={verticalListSortingStrategy}
              >
                <AnimatePresence>
                  {memoizedAvailableComponents.map((comp) => (
                    <SortableItem
                      key={comp.id}
                      id={comp.id}
                      name={comp.name}
                      displayName={comp.displayName}
                      index={comp.id}
                      isMainBox={false}
                    />
                  ))}
                </AnimatePresence>
              </SortableContext>
            </div>
          </div>

          {/* Main Layout Box */}
          <div className="flex-1 max-w-[50%] bg-white p-3 rounded-md shadow-sm">
            <div className="flex justify-between items-center mb-3">
              {/* <h4 className="text-xs font-medium text-gray-700">Homepage Layout</h4> */}
              <FaHome className='text-gray-600' />
              <motion.button
                onClick={saveLayout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1 text-xs font-medium ${isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                  } transition-colors`}
                aria-label="Save homepage layout"
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin" aria-hidden="true" />
                ) : (
                  <FaSave aria-hidden="true" />
                )}
                Save Layout
              </motion.button>
            </div>
            <SortableContext
              items={mainBoxComponents.map((comp) => comp.id)}
              strategy={verticalListSortingStrategy}
            >
              <DroppableMainBox id="main-droppable">
                <AnimatePresence>
                  {mainBoxComponents.length === 0 ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center text-gray-500 py-6 text-xs"
                    >
                      Drag components here to build the layout
                    </motion.p>
                  ) : (
                    mainBoxComponents.map((comp, index) => (
                      <SortableItem
                        key={comp.id}
                        id={comp.id}
                        name={comp.name}
                        displayName={
                          memoizedAvailableComponents.find((c) => c.name === comp.name)?.displayName ||
                          comp.name
                        }
                        index={index}
                        isMainBox={true}
                        onRemove={removeComponent}
                        onEditProps={editProps}
                      />
                    ))
                  )}
                </AnimatePresence>
              </DroppableMainBox>
            </SortableContext>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeComponent && (
            <motion.div
              animate={{
                opacity: 0.9,
                scale: 1.03,
                boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
              }}
              transition={{ type: 'spring', stiffness: 800, damping: 15 }}
              className={`p-2 my-1 rounded-xl flex items-center gap-2 touch-none border select-none h-10 bg-gradient-to-r ${mainBoxComponents.some((comp) => comp.id === activeId)
                ? 'from-gray-200 to-gray-200 text-gray-700  border-gray-500'
                : 'from-green-100 to-green-100 text-gray-600  border-green-400'
                } cursor-grab`}
            >
              <FaGripVertical className="text-gray-900 text-sm" aria-hidden="true" />
              <span className="flex-1 text-xs font-medium select-none truncate">
                {activeComponent.displayName || activeComponent.name}
              </span>
            </motion.div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Props Editor Modal */}
      <AnimatePresence>
        {editingProps && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
            aria-modal="true"
            role="dialog"
            onKeyDown={(e) => e.key === 'Escape' && setEditingProps(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="bg-white p-4 rounded-md shadow-xl w-full max-w-sm max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-50"
            >
              <h4 className="text-base font-semibold text-gray-800 mb-3">
                Edit Specific Category Properties
              </h4>
              <div className="mb-3">
                <label
                  htmlFor="categoryId"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Select Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={editingProps.props.categoryId || ''}
                  onChange={updateProps}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-transparent outline-none transition-colors text-xs"
                  required
                  aria-required="true"
                  aria-label="Select category"
                  aria-describedby="category-error"
                >
                  <option value="">Select a category</option>
                  {memoizedCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {!editingProps.props.categoryId && (
                  <p id="category-error" className="text-red-500 text-xs mt-1" role="alert">
                    Category is required
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <motion.button
                  onClick={() => setEditingProps(null)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-xs"
                  aria-label="Cancel editing properties"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={saveProps}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!editingProps.props.categoryId}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium ${!editingProps.props.categoryId
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                    } transition-colors`}
                  aria-label="Save properties"
                >
                  Save
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminLayout;