import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { motion } from 'framer-motion';
import { FaSpinner, FaSave, FaEdit, FaTrash, FaGripVertical } from 'react-icons/fa';
import useAdminAuth from '../../hooks/useAdminAuth';

// Static component definitions with fixed IDs
const initialAvailableComponents = [
  { id: 'search-bar', name: 'SearchBar' },
  { id: 'topbox', name: 'Topbox' },
  { id: 'recently-viewed-section', name: 'RecentlyViewedSection' },
  { id: 'sponsored-section', name: 'SponsoredSection' },
  { id: 'combo-offer-section', name: 'ComboOfferSection' },
  { id: 'single-add', name: 'SingleAdd' },
  { id: 'category-section', name: 'CategorySection' },
  { id: 'seller-section', name: 'SellerSection' },
  { id: 'triple-add', name: 'TripleAdd' },
  { id: 'double-add', name: 'DoubleAdd' },
  { id: 'category-sectionn', name: 'CategorySectionn' },
  { id: 'trending-section', name: 'TrendingSection' },
  { id: 'product-section', name: 'ProductSection' },
];

const SortableItem = ({ id, name, index, isMainBox, onRemove, onEditProps }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`p-3 mb-2 rounded-lg shadow-sm flex items-center gap-2 ${
        isMainBox ? 'bg-green-50 text-green-800' : 'bg-blue-50 text-blue-800'
      } ${isMainBox ? 'justify-between' : ''}`}
      role="button"
      aria-label={`Drag ${name} component`}
    >
      <FaGripVertical className="cursor-move text-gray-500" {...listeners} />
      <span className="flex-1">{name}</span>
      {isMainBox && (
        <div className="flex gap-2">
          {name === 'CategorySectionn' && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => onEditProps(index)}
              className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-all duration-200"
              aria-label={`Edit properties for ${name}`}
              title="Edit Properties"
            >
              <FaEdit size={14} />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={() => onRemove(index)}
            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200"
            aria-label={`Remove ${name} from layout`}
            title="Remove Component"
          >
            <FaTrash size={14} />
          </motion.button>
        </div>
      )}
    </div>
  );
};

const DroppableMainBox = ({ children, id }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[400px] bg-white rounded-lg p-4 ${
        isOver ? 'bg-gray-100 border-2 border-blue-300' : 'border border-gray-200'
      }`}
      role="region"
      aria-label="Homepage layout droppable area"
    >
      {children}
    </div>
  );
};

const AdminLayout = ({ categories = [], loading: parentLoading }) => {
  const { isAdmin, error, checkAdmin } = useAdminAuth();
  const [availableComponents] = useState(initialAvailableComponents);
  const [mainBoxComponents, setMainBoxComponents] = useState([]);
  const [editingProps, setEditingProps] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const idCounter = useRef(0);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  // Fetch layout on mount
  useEffect(() => {
    const fetchLayout = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          throw new Error('No admin token found');
        }
        console.log('Fetching layout...');
        const layoutRes = await axios.get('/api/admin/auth/layout', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Layout response:', layoutRes.data);
        const components = (layoutRes.data.components || []).map((comp) => ({
          id: `${comp.name}-${idCounter.current++}`,
          name: comp.name,
          props: comp.props || {},
        }));
        setMainBoxComponents(components);
        console.log('Set mainBoxComponents:', components);
      } catch (error) {
        console.error('Fetch layout error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        toast.error(error.response?.data?.message || 'Failed to fetch layout');
      } finally {
        setIsLoading(false);
      }
    };
    if (isAdmin) {
      fetchLayout();
    }
  }, [isAdmin]);

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      console.log('Drag end - active:', active.id, 'over:', over?.id);

      if (!over) return;

      const isActiveInAvailable = availableComponents.some((comp) => comp.id === active.id);
      const isActiveInMain = mainBoxComponents.some((comp) => comp.id === active.id);

      if (isActiveInAvailable) {
        const component = availableComponents.find((comp) => comp.id === active.id);
        const newComponent = {
          ...component,
          id: `${component.name}-${idCounter.current++}`,
          props: component.name === 'CategorySectionn' ? { categoryId: '', categoryName: '' } : {},
        };

        if (over.id === 'main-droppable') {
          setMainBoxComponents((prev) => [...prev, newComponent]);
          toast.success(`${component.name} added to layout`);
          console.log('Added to main box (droppable):', newComponent);
        } else if (mainBoxComponents.some((comp) => comp.id === over.id)) {
          const overIndex = mainBoxComponents.findIndex((comp) => comp.id === over.id);
          setMainBoxComponents((prev) => [
            ...prev.slice(0, overIndex),
            newComponent,
            ...prev.slice(overIndex),
          ]);
          toast.success(`${component.name} added to layout`);
          console.log('Added to main box at index', overIndex, newComponent);
        }
      } else if (isActiveInMain && mainBoxComponents.some((comp) => comp.id === over.id)) {
        const oldIndex = mainBoxComponents.findIndex((comp) => comp.id === active.id);
        const newIndex = mainBoxComponents.findIndex((comp) => comp.id === over.id);
        if (oldIndex !== newIndex) {
          setMainBoxComponents((prev) => arrayMove(prev, oldIndex, newIndex));
          toast.success('Component reordered');
          console.log('Reordered in main box from index', oldIndex, 'to', newIndex);
        }
      }
    },
    [availableComponents, mainBoxComponents]
  );

  const removeComponent = useCallback((index) => {
    setMainBoxComponents((prev) => [...prev.slice(0, index), ...prev.slice(index + 1)]);
    toast.success('Component removed from layout');
    console.log('Removed component at index', index);
  }, []);

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
      toast.error('Please select a category');
      return;
    }
    setMainBoxComponents((prev) => {
      const newMainBox = [...prev];
      newMainBox[editingProps.index].props = editingProps.props;
      return newMainBox;
    });
    setEditingProps(null);
    toast.success('Props saved');
    console.log('Saved props for index', editingProps.index);
  }, [editingProps]);

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
      console.log('Saving layout:', layout);
      const response = await axios.post('/api/admin/auth/layout', layout, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Layout saved successfully');
      console.log('Saved layout response:', response.data);
    } catch (error) {
      console.error('Save layout error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(error.response?.data?.message || 'Failed to save layout');
    } finally {
      setIsLoading(false);
    }
  }, [mainBoxComponents]);

  // Memoize categories to prevent unnecessary re-renders
  const memoizedCategories = useMemo(() => categories, [categories]);

  // Validate props
  if (!Array.isArray(categories)) {
    console.error('Invalid categories prop:', categories);
    return (
      <div className="text-red-600 p-6 bg-red-50 rounded-2xl shadow-md">
        Error: Invalid categories data. Please try refreshing the page.
      </div>
    );
  }

  // Render loading state
  if (isAdmin === null || parentLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-blue-600 text-4xl" />
      </div>
    );
  }

  // Render access denied state
  if (isAdmin === false) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-2xl shadow-md">
        <h3 className="text-lg font-semibold text-red-700">Unable to Access Layout Editor</h3>
        <p className="text-sm text-red-600 mb-4">{error || 'Please try again later.'}</p>
        <motion.button
          onClick={checkAdmin}
          whileHover={{ scale: 1.05 }}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-200"
        >
          Retry
        </motion.button>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="bg-white p-6 rounded-2xl shadow-lg"
    >
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Manage Homepage Layout</h3>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Available Components */}
          <div className="w-full lg:w-1/3 bg-gray-50 p-4 rounded-lg shadow-sm">
            <h4 className="text-md font-medium text-gray-600 mb-2">Available Components</h4>
            <div className="min-h-[300px] bg-white rounded-lg p-2 border border-gray-200">
              <SortableContext
                items={availableComponents.map((comp) => comp.id)}
                strategy={verticalListSortingStrategy}
              >
                {availableComponents.map((comp, index) => (
                  <SortableItem
                    key={comp.id}
                    id={comp.id}
                    name={comp.name}
                    index={index}
                    isMainBox={false}
                  />
                ))}
              </SortableContext>
            </div>
          </div>

          {/* Main Layout Box */}
          <div className="w-full lg:w-2/3 bg-gray-50 p-4 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
              <h4 className="text-md font-medium text-gray-600">Homepage Layout</h4>
              <motion.button
                onClick={saveLayout}
                whileHover={{ scale: 1.05 }}
                disabled={isLoading}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                aria-label="Save homepage layout"
              >
                {isLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                Save Layout
              </motion.button>
            </div>
            <SortableContext
              items={mainBoxComponents.map((comp) => comp.id)}
              strategy={verticalListSortingStrategy}
            >
              <DroppableMainBox id="main-droppable">
                {mainBoxComponents.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    Drag components here to build the layout
                  </p>
                ) : (
                  mainBoxComponents.map((comp, index) => (
                    <SortableItem
                      key={comp.id}
                      id={comp.id}
                      name={comp.name}
                      index={index}
                      isMainBox={true}
                      onRemove={removeComponent}
                      onEditProps={editProps}
                    />
                  ))
                )}
              </DroppableMainBox>
            </SortableContext>
          </div>
        </div>
      </DndContext>

      {/* Props Editor Modal */}
      {editingProps && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md"
          >
            <h4 className="text-lg font-semibold text-gray-700 mb-4">
              Edit Props for CategorySectionn
            </h4>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Category *
              </label>
              <select
                name="categoryId"
                value={editingProps.props.categoryId || ''}
                onChange={updateProps}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all duration-200"
                required
                aria-label="Select category"
              >
                <option value="">Select a category</option>
                {memoizedCategories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-4">
              <motion.button
                onClick={() => setEditingProps(null)}
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200"
                aria-label="Cancel editing props"
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={saveProps}
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200"
                aria-label="Save props"
              >
                Save
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminLayout;