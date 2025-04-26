import React, { useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react';
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
import { toast } from 'sonner';
import axios from '../axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../@/components/ui/dialog';
import { Card, CardContent } from '../../../@/components/ui/card';
import { Loader2, Save, Edit, Trash2 } from 'lucide-react';
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

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

const rippleEffect = {
  initial: { scale: 0, opacity: 0.4 },
  animate: { scale: 4, opacity: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

const dropPulse = {
  initial: { scale: 1, opacity: 0.3 },
  animate: { scale: 1.1, opacity: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};

// Sortable item component
const SortableItem = React.memo(
  ({ id, name, displayName, index, isMainBox, onRemove, onEditProps, isDragging, isOverId }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = useMemo(
      () => ({
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 0.1s ease, margin 0.1s ease',
        marginBottom: isOverId === id ? '28px' : '8px',
      }),
      [transform, transition, isOverId, id]
    );

    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: isDragging ? 0.3 : 1,
          y: 0,
          scale: isDragging ? 0.9 : 1,
          boxShadow: isDragging
            ? '0 10px 20px rgba(0,0,0,0.2)'
            : '0 6px 12px rgba(0,0,0,0.1)',
          rotate: isDragging ? 4 : 0,
          filter: isDragging ? 'drop-shadow(0 0 6px rgba(79,70,229,0.4))' : 'none',
        }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`relative p-5 m-2 rounded-xl flex items-center justify-between touch-none bg-gradient-to-r ${
          isMainBox
            ? 'from-emerald-200 to-emerald-300 text-emerald-900'
            : 'from-indigo-200 to-indigo-300 text-indigo-900'
        } hover:shadow-md transition-shadow duration-200 cursor-grab active:cursor-grabbing`}
        role="button"
        aria-label={`Drag ${displayName} component`}
        title={displayName}
        onTouchStart={() => {
          if ('vibrate' in navigator) navigator.vibrate(50);
        }}
      >
        {isDragging && (
          <motion.div
            className="absolute inset-0 bg-indigo-400 opacity-15 rounded-xl"
            variants={rippleEffect}
            initial="initial"
            animate="animate"
          />
        )}
        <span className="text-sm font-semibold select-none">{displayName}</span>
        {isMainBox && (
          <div className="flex gap-2">
            {name === 'CategorySectionn' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditProps(index);
                }}
                className="p-2 bg-yellow-400 text-white rounded-full hover:bg-yellow-500 hover:scale-105 transition-transform duration-200"
                aria-label="Edit category properties"
                title="Edit category properties"
              >
                <Edit size={16} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
              className="p-2 bg-red-400 text-white rounded-full hover:bg-red-500 hover:scale-105 transition-transform duration-200"
              aria-label="Remove component"
              title="Remove component"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )}
        {isOverId === id && (
          <motion.div
            className="absolute inset-0 border-2 border-indigo-600 bg-gradient-to-r from-indigo-100 to-indigo-200 opacity-50 rounded-xl"
            variants={dropPulse}
            initial="initial"
            animate="animate"
          />
        )}
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.id === nextProps.id &&
      prevProps.name === nextProps.name &&
      prevProps.displayName === nextProps.displayName &&
      prevProps.index === nextProps.index &&
      prevProps.isMainBox === nextProps.isMainBox &&
      prevProps.isDragging === nextProps.isDragging &&
      prevProps.isOverId === nextProps.isOverId &&
      prevProps.onRemove === nextProps.onRemove &&
      prevProps.onEditProps === nextProps.onEditProps
    );
  }
);

// Droppable box component
const DroppableBox = ({ id, children, title, isMainBox }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <Card
      ref={setNodeRef}
      className={`flex-1 p-4 bg-white rounded-2xl shadow-lg border-2 ${
        isOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100'
      } min-h-[calc(100vh-200px)] max-h-[calc(100vh-200px)] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 touch-none`}
    >
      <CardContent className="p-0">
        <h4 className="text-sm font-semibold text-gray-800 mb-3 sticky top-0 bg-white z-10 p-2 rounded-t-2xl">
          {title}
        </h4>
        {children}
      </CardContent>
    </Card>
  );
};

// Drag overlay component
const DragOverlayItem = ({ id, name, displayName, isMainBox }) => (
  <motion.div
    initial={{ scale: 1 }}
    animate={{
      scale: 0.9,
      boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
      rotate: 4,
      filter: 'drop-shadow(0 0 6px rgba(79,70,229,0.4))',
    }}
    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    className={`p-5 m-2 rounded-xl flex items-center justify-between touch-none bg-gradient-to-r ${
      isMainBox
        ? 'from-emerald-200 to-emerald-300 text-emerald-900'
        : 'from-indigo-200 to-indigo-300 text-indigo-900'
    } shadow-md z-50`}
  >
    <span className="text-sm font-semibold select-none">{displayName}</span>
  </motion.div>
);

const AdminLayout = ({ categories = [] }) => {
  const { isAdmin, error, checkAdmin } = useAdminAuth();
  const [mainBoxComponents, setMainBoxComponents] = useState([]);
  const [editingProps, setEditingProps] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [layoutError, setLayoutError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const deferredOverId = useDeferredValue(overId);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 3 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 50, tolerance: 5 } })
  );

  // Generate unique ID
  const generateUniqueId = useCallback((name) => {
    return `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Debounce drag over
  const debounce = useCallback((fn, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    };
  }, []);

  // Fetch layout
  useEffect(() => {
    const fetchLayout = async () => {
      setIsLoading(true);
      setLayoutError(null);
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error('No admin token found');
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

    if (isAdmin) fetchLayout();
  }, [isAdmin, generateUniqueId]);

  // Handle drag start
  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
    if ('vibrate' in navigator) navigator.vibrate(50);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback(
    debounce((event) => {
      const { over } = event;
      setOverId(over?.id || null);
    }, 100),
    [debounce]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      setActiveId(null);
      setOverId(null);

      if (!over) return;

      const isActiveInAvailable = availableComponents.some((comp) => comp.id === active.id);
      const isActiveInMain = mainBoxComponents.some((comp) => comp.id === active.id);

      if (isActiveInAvailable && over.id === 'main-droppable') {
        const component = availableComponents.find((comp) => comp.id === active.id);
        const newComponent = {
          ...component,
          id: generateUniqueId(component.name),
          props: component.name === 'CategorySectionn' ? { categoryId: '', categoryName: '' } : {},
        };
        setMainBoxComponents((prev) => [...prev, newComponent]);
        toast.success(`${component.displayName} added to layout`);
        if ('vibrate' in navigator) navigator.vibrate(50);
      } else if (isActiveInAvailable && mainBoxComponents.some((comp) => comp.id === over.id)) {
        const component = availableComponents.find((comp) => comp.id === active.id);
        const newComponent = {
          ...component,
          id: generateUniqueId(component.name),
          props: component.name === 'CategorySectionn' ? { categoryId: '', categoryName: '' } : {},
        };
        const overIndex = mainBoxComponents.findIndex((comp) => comp.id === over.id);
        setMainBoxComponents((prev) => [
          ...prev.slice(0, overIndex),
          newComponent,
          ...prev.slice(overIndex),
        ]);
        toast.success(`${component.displayName} added to layout`);
        if ('vibrate' in navigator) navigator.vibrate(50);
      } else if (isActiveInMain && mainBoxComponents.some((comp) => comp.id === over.id)) {
        const oldIndex = mainBoxComponents.findIndex((comp) => comp.id === active.id);
        const newIndex = mainBoxComponents.findIndex((comp) => comp.id === over.id);
        if (oldIndex !== newIndex) {
          setMainBoxComponents((prev) => arrayMove(prev, oldIndex, newIndex));
          toast.success('Component reordered');
          if ('vibrate' in navigator) navigator.vibrate(50);
        }
      }
    },
    [mainBoxComponents, generateUniqueId]
  );

  // Remove component
  const removeComponent = useCallback((index) => {
    setMainBoxComponents((prev) => [...prev.slice(0, index), ...prev.slice(index + 1)]);
    toast.success('Component removed');
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
    (value) => {
      setEditingProps((prev) => {
        const category = categories.find((cat) => cat._id === value);
        return {
          ...prev,
          props: {
            categoryId: value,
            categoryName: category ? category.name : prev.props.categoryName,
          },
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
    toast.success('Category properties saved');
  }, [editingProps, mainBoxComponents]);

  // Save layout
  const saveLayout = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No admin token found');
      const layout = {
        components: mainBoxComponents.map((comp) => ({
          name: comp.name,
          props: comp.props,
        })),
      };
      await axios.post('/api/admin/auth/layout', layout, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      toast.success('Layout saved successfully');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save layout';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [mainBoxComponents]);

  // Memoize categories
  const memoizedCategories = useMemo(() => categories, [categories]);

  // Get active component for drag overlay
  const activeComponent = useMemo(() => {
    if (!activeId) return null;
    const available = availableComponents.find((comp) => comp.id === activeId);
    if (available) return { ...available, isMainBox: false };
    const main = mainBoxComponents.find((comp) => comp.id === activeId);
    if (main) return { ...main, isMainBox: true };
    return null;
  }, [activeId, mainBoxComponents]);

  // Validate props
  if (!Array.isArray(categories)) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="p-6 bg-red-50 rounded-2xl shadow-lg text-center border border-red-300"
      >
        <p className="text-red-700 font-medium text-sm">Error: Invalid categories data</p>
      </motion.div>
    );
  }

  // Render loading state
  if (isAdmin === null || isLoading) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex justify-center items-center h-64"
      >
        <Loader2 className="animate-spin text-indigo-500 text-4xl" aria-label="Loading" />
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
        className="p-6 bg-red-50 rounded-2xl shadow-lg text-center border border-red-300"
      >
        <h3 className="text-lg font-semibold text-red-800">Access Denied</h3>
        <p className="text-sm text-red-700 mb-4">{error || 'Please try again'}</p>
        <Button
          onClick={checkAdmin}
          className="bg-indigo-500 hover:bg-indigo-600 text-white hover:scale-105 transition-transform duration-200"
          aria-label="Retry authentication"
          title="Retry authentication"
        >
          Retry
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="p-6 bg-gradient-to-b from-gray-100 to-gray-300 rounded-2xl shadow-2xl max-w-full mx-auto"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h3 className="text-xl font-bold text-gray-800">Manage Homepage Layout</h3>
        <Button
          onClick={saveLayout}
          disabled={isLoading}
          className="bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-2 hover:scale-105 transition-transform duration-200"
          aria-label="Save homepage layout"
          title="Save homepage layout"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Save size={16} />
          )}
          Save Layout
        </Button>
      </div>
      {layoutError && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-700 bg-red-50 p-4 rounded-lg mb-6 text-sm border border-red-300"
        >
          {layoutError}
        </motion.p>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Available Components */}
          <DroppableBox
            id="available-droppable"
            title="Available Components"
            isMainBox={false}
          >
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
                    isDragging={activeId === comp.id}
                    isOverId={deferredOverId}
                  />
                ))}
              </AnimatePresence>
            </SortableContext>
          </DroppableBox>

          {/* Homepage Layout */}
          <DroppableBox
            id="main-droppable"
            title="Homepage Layout"
            isMainBox={true}
          >
            <SortableContext
              items={mainBoxComponents.map((comp) => comp.id)}
              strategy={verticalListSortingStrategy}
            >
              <AnimatePresence>
                {mainBoxComponents.length === 0 ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-gray-500 py-8 text-sm"
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
                      isDragging={activeId === comp.id}
                      isOverId={deferredOverId}
                    />
                  ))
                )}
              </AnimatePresence>
            </SortableContext>
          </DroppableBox>
        </div>
        <DragOverlay>
          {activeComponent && (
            <DragOverlayItem
              id={activeComponent.id}
              name={activeComponent.name}
              displayName={activeComponent.displayName}
              isMainBox={activeComponent.isMainBox}
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Props Editor Dialog */}
      <Dialog open={!!editingProps} onOpenChange={() => setEditingProps(null)}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 600, damping: 30 }}
        >
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Edit Specific Category Properties</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="categoryId"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Select Category <span className="text-red-500">*</span>
                </label>
                <Select
                  value={editingProps?.props.categoryId || ''}
                  onValueChange={updateProps}
                  required
                >
                  <SelectTrigger
                    id="categoryId"
                    className="w-full rounded-lg"
                    aria-label="Select category"
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {memoizedCategories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!editingProps?.props.categoryId && (
                  <p className="text-red-500 text-xs mt-1">Category is required</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingProps(null)}
                className="rounded-lg hover:scale-105 transition-transform duration-200"
                title="Cancel editing"
              >
                Cancel
              </Button>
              <Button
                onClick={saveProps}
                disabled={!editingProps?.props.categoryId}
                className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg hover:scale-105 transition-transform duration-200"
                title="Save category properties"
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </motion.div>
      </Dialog>
    </motion.div>
  );
};

export default React.memo(AdminLayout);