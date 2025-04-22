import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import axios from '../axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner, FaSave, FaEdit, FaTrash, FaGripVertical } from 'react-icons/fa';
import useAdminAuth from '../../hooks/useAdminAuth';

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

// Sortable item component
const SortableItem = ({ id, name, displayName, index, isMainBox, onRemove, onEditProps }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 0.2s ease',
    touchAction: 'none', // Improves touch dragging
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`p-4 my-2 rounded-lg shadow-sm flex items-center gap-3 touch-none ${
        isMainBox ? 'bg-green-100 text-green-900' : 'bg-blue-100 text-blue-900'
      } ${isMainBox ? 'justify-between' : 'cursor-move'}`}
      role="button"
      aria-label={`Drag ${displayName} component`}
    >
      <FaGripVertical
        className="text-gray-600 text-lg cursor-move touch-none"
        {...listeners}
        aria-hidden="true"
      />
      <span className="flex-1 text-sm font-medium">{displayName}</span>
      {isMainBox && (
        <div className="flex gap-3">
          {name === 'CategorySectionn' && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onEditProps(index)}
              className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors"
              aria-label={`Edit properties for ${displayName}`}
              title="Edit Properties"
            >
              <FaEdit size={16} />
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onRemove(index)}
            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            aria-label={`Remove ${displayName} from layout`}
            title="Remove Component"
          >
            <FaTrash size={16} />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

// Droppable main box component
const DroppableMainBox = ({ children, id }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] bg-white rounded-lg p-4 border-2 ${
        isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
      } overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100`}
      role="region"
      aria-label="Homepage layout droppable area"
    >
      {children}
    </div>
  );
};

const AdminLayout = ({ categories = [], loading: parentLoading }) => {
  const { isAdmin, error, checkAdmin } = useAdminAuth();
  const [mainBoxComponents, setMainBoxComponents] = useState([]);
  const [editingProps, setEditingProps] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [layoutError, setLayoutError] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    })
  );

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  // Generate unique ID for components
  const generateUniqueId = useCallback((name) => {
    return `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Fetch layout on mount
  useEffect(() => {
    const fetchLayout = async () => {
      setIsLoading(true);
      setLayoutError(null);
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          throw new Error('No admin token found');
        }
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
        const message = error.response?.data?.message || 'Failed to fetch layout';
        setLayoutError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAdmin) {
      fetchLayout();
    }
  }, [isAdmin, generateUniqueId]);

  // Handle drag end
  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over) return;

      const isActiveInAvailable = availableComponents.some((comp) => comp.id === active.id);
      const isActiveInMain = mainBoxComponents.some((comp) => comp.id === active.id);

      if (isActiveInAvailable) {
        const component = availableComponents.find((comp) => comp.id === active.id);
        const newComponent = {
          ...component,
          id: generateUniqueId(component.name),
          props: component.name === 'CategorySectionn' ? { categoryId: '', categoryName: '' } : {},
        };

        if (over.id === 'main-droppable') {
          setMainBoxComponents((prev) => [...prev, newComponent]);
          toast.success(`${component.displayName} added to layout`);
        } else if (mainBoxComponents.some((comp) => comp.id === over.id)) {
          const overIndex = mainBoxComponents.findIndex((comp) => comp.id === over.id);
          setMainBoxComponents((prev) => [
            ...prev.slice(0, overIndex),
            newComponent,
            ...prev.slice(overIndex),
          ]);
          toast.success(`${component.displayName} added to layout`);
        }
      } else if (isActiveInMain && mainBoxComponents.some((comp) => comp.id === over.id)) {
        const oldIndex = mainBoxComponents.findIndex((comp) => comp.id === active.id);
        const newIndex = mainBoxComponents.findIndex((comp) => comp.id === over.id);
        if (oldIndex !== newIndex) {
          setMainBoxComponents((prev) => arrayMove(prev, oldIndex, newIndex));
          toast.success('Component reordered');
        }
      }
    },
    [mainBoxComponents, generateUniqueId]
  );

  // Remove component
  const removeComponent = useCallback((index) => {
    setMainBoxComponents((prev) => [...prev.slice(0, index), ...prev.slice(index + 1)]);
    toast.success('Component removed from layout');
  }, []);

  // Edit props
  const editProps = useCallback(
    (index) => {
      setEditingProps({ index, props: { ...mainBoxComponents[index].props } });
    },
    [mainBoxComponents]
  );

  // Update props
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

  // Save props
  const saveProps = useCallback(() => {
    if (!editingProps.props.categoryId && mainBoxComponents[editingProps.index].name === 'CategorySectionn') {
      toast.error('Please select a category');
      return;
    }
    setMainBoxComponents((prev) => {
      const newMainBox = [...prev];
      newMainBox[editingProps.index].props = editingProps.props;
      return newMainBox;
    });
    setEditingProps(null);
    toast.success('Properties saved');
  }, [editingProps, mainBoxComponents]);

  // Save layout
  const saveLayout = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No admin token found');
      }
      const layout = {
        components: mainBoxComponents.map((comp) => ({
          name: comp.name,
          props: comp.props,
        })),
      };
      const response = await axios.post('/api/admin/auth/layout', layout, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Layout saved successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save layout';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [mainBoxComponents]);

  // Memoize categories
  const memoizedCategories = useMemo(() => categories, [categories]);

  // Validate props
  if (!Array.isArray(categories)) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="p-6 bg-red-50 rounded-2xl shadow-md text-center"
      >
        <p className="text-red-600 font-medium">Error: Invalid categories data. Please refresh the page.</p>
      </motion.div>
    );
  }

  // Render loading state
  if (isAdmin === null || parentLoading || isLoading) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex justify-center items-center h-64"
      >
        <FaSpinner className="animate-spin text-blue-600 text-5xl" aria-label="Loading" />
      </motion.div>
    );
  }

  // Render access denied state
  if (isAdmin === false) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="p-6 bg-red-50 rounded-2xl shadow-md text-center"
      >
        <h3 className="text-lg font-semibold text-red-700">Access Denied</h3>
        <p className="text-sm text-red-600 mb-4">{error || 'Please try again later.'}</p>
        <motion.button
          onClick={checkAdmin}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          aria-label="Retry authentication"
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
      className="p-4 sm:p-6 bg-gray-50 rounded-2xl shadow-lg max-w-4xl mx-auto"
    >
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">Manage Homepage Layout</h3>
      {layoutError && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-600 bg-red-100 p-3 rounded-lg mb-4 text-sm"
        >
          {layoutError}
        </motion.p>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-4">
          {/* Available Components */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="text-md font-medium text-gray-700 mb-3">Available Components</h4>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <SortableContext
                items={availableComponents.map((comp) => comp.id)}
                strategy={verticalListSortingStrategy}
              >
                <AnimatePresence>
                  {availableComponents.map((comp) => (
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
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
              <h4 className="text-md font-medium text-gray-700">Homepage Layout</h4>
              <motion.button
                onClick={saveLayout}
                whileTap={{ scale: 0.95 }}
                disabled={isLoading}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium w-full sm:w-auto ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
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
                      className="text-center text-gray-500 py-6 text-sm"
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
                          availableComponents.find((c) => c.name === comp.name)?.displayName ||
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
      </DndContext>

      {/* Props Editor Modal */}
      <AnimatePresence>
        {editingProps && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            aria-modal="true"
            role="dialog"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            >
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Edit CategorySectionn Properties
              </h4>
              <div className="mb-4">
                <label
                  htmlFor="categoryId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Select Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={editingProps.props.categoryId || ''}
                  onChange={updateProps}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-colors text-sm"
                  required
                  aria-required="true"
                  aria-label="Select category"
                >
                  <option value="">Select a category</option>
                  {memoizedCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {!editingProps.props.categoryId && (
                  <p className="text-red-500 text-xs mt-1">Category is required</p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <motion.button
                  onClick={() => setEditingProps(null)}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors text-sm"
                  aria-label="Cancel editing properties"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={saveProps}
                  whileTap={{ scale: 0.95 }}
                  disabled={!editingProps.props.categoryId}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${
                    !editingProps.props.categoryId
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
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