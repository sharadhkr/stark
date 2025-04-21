import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import axios from '../axios';
import { motion } from 'framer-motion';

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
      {...listeners}
      className={`p-2 mb-2 rounded-lg shadow-sm ${
        isMainBox ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
      } ${isMainBox ? 'flex justify-between items-center' : ''}`}
    >
      {name}
      {isMainBox && (
        <div className="flex gap-2">
          {name === 'CategorySectionn' && (
            <button
              onClick={() => onEditProps(index)}
              className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Edit Props
            </button>
          )}
          <button
            onClick={() => onRemove(index)}
            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Remove
          </button>
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
      className={`min-h-[400px] bg-white rounded-lg p-2 ${isOver ? 'bg-gray-100' : ''}`}
    >
      {children}
    </div>
  );
};

const AdminLayout = ({ categories, loading }) => {
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

  useEffect(() => {
    const fetchLayout = async () => {
      setIsLoading(true);
      try {
        const layoutRes = await axios.get('/api/admin/auth/layout');
        const components = (layoutRes.data.components || []).map((comp) => ({
          id: `${comp.name}-${idCounter.current++}`,
          name: comp.name,
          props: comp.props || {},
        }));
        setMainBoxComponents(components);
        console.log('Fetched mainBoxComponents:', components);
      } catch (error) {
        toast.error('Failed to fetch layout: ' + (error.response?.data?.message || error.message));
      } finally {
        setIsLoading(false);
      }
    };
    fetchLayout();
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    console.log('handleDragEnd - active:', active.id, 'over:', over?.id);

    const isActiveInAvailable = availableComponents.some((comp) => comp.id === active.id);
    const isActiveInMain = mainBoxComponents.some((comp) => comp.id === active.id);

    if (isActiveInAvailable && over) {
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
    } else if (isActiveInMain && over && mainBoxComponents.some((comp) => comp.id === over.id)) {
      const oldIndex = mainBoxComponents.findIndex((comp) => comp.id === active.id);
      const newIndex = mainBoxComponents.findIndex((comp) => comp.id === over.id);
      setMainBoxComponents((prev) => arrayMove(prev, oldIndex, newIndex));
      toast.success('Component reordered');
      console.log('Reordered in main box from index', oldIndex, 'to', newIndex);
    }
  }, [availableComponents, mainBoxComponents]);

  const removeComponent = useCallback((index) => {
    setMainBoxComponents((prev) => [...prev.slice(0, index), ...prev.slice(index + 1)]);
    toast.success('Component removed from layout');
    console.log('Removed component at index', index);
  }, []);

  const editProps = useCallback((index) => {
    setEditingProps({ index, props: { ...mainBoxComponents[index].props } });
  }, [mainBoxComponents]);

  const updateProps = useCallback((e) => {
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
  }, [categories]);

  const saveProps = useCallback(() => {
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
    try {
      const layout = {
        components: mainBoxComponents.map((comp) => ({
          name: comp.name,
          props: comp.props,
        })),
      };
      const response = await axios.post('/api/admin/auth/layout', layout);
      toast.success('Layout saved successfully');
      console.log('Saved layout:', response.data);
    } catch (error) {
      toast.error('Failed to save layout: ' + (error.response?.data?.message || error.message));
      console.error('Save layout error:', error);
    }
  }, [mainBoxComponents]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="bg-white p-6 rounded-2xl shadow-lg"
    >
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Manage Homepage Layout</h3>
      {(loading || isLoading) ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-6">
            {/* Available Components */}
            <div className="w-1/3 bg-gray-50 p-4 rounded-lg shadow-sm">
              <h4 className="text-md font-medium text-gray-600 mb-2">Available Components</h4>
              <div className="min-h-[300px] bg-white rounded-lg p-2">
                {availableComponents.map((comp, index) => (
                  <SortableItem
                    key={comp.id}
                    id={comp.id}
                    name={comp.name}
                    index={index}
                    isMainBox={false}
                  />
                ))}
              </div>
            </div>

            {/* Main Layout Box */}
            <div className="w-2/3 bg-gray-50 p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-medium text-gray-600">Homepage Layout</h4>
                <button
                  onClick={saveLayout}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  Save Layout
                </button>
              </div>
              <SortableContext
                items={mainBoxComponents.map((comp) => comp.id)}
                strategy={verticalListSortingStrategy}
              >
                <DroppableMainBox id="main-droppable">
                  {mainBoxComponents.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">Drag components here to build the layout</p>
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
      )}

      {/* Props Editor Modal */}
      {editingProps && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h4 className="text-lg font-semibold mb-4">Edit Props for CategorySectionn</h4>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Category</label>
              <select
                name="categoryId"
                value={editingProps.props.categoryId || ''}
                onChange={updateProps}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingProps(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={saveProps}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminLayout;