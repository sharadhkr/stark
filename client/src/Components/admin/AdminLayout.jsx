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
  initial: { scale: 0, opacity: 0.3 },
  animate: { scale: 3, opacity: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};

const dropPulse = {
  initial: { scale: 1, opacity: 0.2 },
  animate: { scale: 1.05, opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } },
};

// Sortable item component
const SortableItem = React.memo(
  ({ id, name, displayName, index, isMainBox, onRemove, onEditProps, isDragging, isOverId }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = useMemo(
      () => ({
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 0.08s ease, margin 0.08s ease',
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
          opacity: isDragging ? 0.2 : 1,
          y: 0,
          scale: isDragging ? 0.9 : 1,
          boxShadow: isDragging ? '0 4px 8px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.1)',
        }}
        whileHover={{ scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`relative p-6 m-2 rounded-xl flex items-center justify-between touch-none bg-gradient-to-r ${
          isMainBox
            ? 'from-emerald-100 to-emerald-200 text-emerald-900'
            : 'from-indigo-100 to-indigo-200 text-indigo-900'
        } hover:shadow-sm transition-shadow duration-150 cursor-grab active:cursor-grabbing min-h-[60px] bg-indigo-200/50 active:bg-indigo-200/80`}
        role="button"
        aria-label={`Drag ${displayName} component`}
        title={displayName}
        onTouchStart={() => {
          if ('vibrate' in navigator) navigator.vibrate(30);
        }}
      >
        {isDragging && (
          <motion.div
            className="absolute inset-0 bg-indigo-300 opacity-10 rounded-xl"
            variants={rippleEffect}
            initial="initial"
            animate="animate"
          />
        )}
        <span className="text-base font-semibold select-none">{displayName}</span>
        {isMainBox && (
          <div className="flex gap-3">
            {name === 'CategorySectionn' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditProps(index);
                }}
                className="p-3 bg-yellow-400 text-white rounded-full hover:bg-yellow-500 hover:scale-105 transition-transform duration-150"
                aria-label="Edit category properties"
                title="Edit category properties"
              >
                <Edit size={18} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
              className="p-3 bg-red-400 text-white rounded-full hover:bg-red-500 hover:scale-105 transition-transform duration-150"
              aria-label="Remove component"
              title="Remove component"
            >
              <Trash2 size={18} />
            </Button>
          </div>
        )}
        {isOverId === id && (
          <motion.div
            className="absolute inset-0 border-2 border-indigo-600 bg-gradient-to-r from-indigo-100 to-indigo-200 opacity-40 rounded-xl"
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
      className={`flex-1 p-4 bg-white rounded-2xl shadow-md border-2 ${
        isOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100'
      } min-h-[calc(100vh-250px)] max-h-[calc(100vh-250px)] overflow-y-auto overflow-x-hidden overscroll-y-none overscroll-x-none scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 touch-none`}
    >
      <CardContent className="p-0">
        <h4 className="text-base font-semibold text-gray-800 mb-3 sticky top-0 bg-white z-10 p-2 rounded-t-2xl">
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
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
    }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    className={`p-6 m-2 rounded-xl flex items-center justify-between touch-none bg-gradient-to-r ${
      isMainBox
        ? 'from-emerald-100 to-emerald-200 text-emerald-900'
        : 'from-indigo-100 to-indigo-200 text-indigo-900'
    } shadow-md z-50 min-h-[60px]`}
  >
    <span className="text-base font-semibold select-none">{displayName}</span>
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
    useSensor(TouchSensor, { activationConstraint: { delay: 30, tolerance: 3 } })
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
    if ('vibrate' in navigator) navigator.vibrate(30);
    document.body.style.touchAction = 'none'; // Prevent scrolling
  }, []);

  // Handle drag over
  const handleDragOver = useCallback(
    debounce((event) => {
      const { over } = event;
      setOverId(over?.id || null);
    }, 150),
    [debounce]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      setActiveId(null);
      setOverId(null);
      document.body.style.touchAction = ''; // Restore scrolling

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
        if ('vibrate' in navigator) navigator.vibrate(30);
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
        if ('vibrate' in navigator) navigator.vibrate(30);
      } else if (isActiveInMain && mainBoxComponents.some((comp) => comp.id === over.id)) {
        const oldIndex = mainBoxComponents.findIndex((comp) => comp.id === active.id);
        const newIndex = mainBoxComponents.findIndex((comp) => comp.id === over.id);
        if (oldIndex !== newIndex) {
          setMainBoxComponents((prev) => arrayMove(prev, oldIndex, newIndex));
          toast.success('Component reordered');
          if ('vibrate' in navigator) navigator.vibrate(30);
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
        className="p-6 bg-red-50 rounded-2xl shadow-md text-center border border-red-300"
      >
        <p className="text-red-700 font-medium text-base">Error: Invalid categories data</p>
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
        className="p-6 bg-red-50 rounded-2xl shadow-md text-center border border-red-300"
      >
        <h3 className="text-lg font-semibold text-red-800">Access Denied</h3>
        <p className="text-base text-red-700 mb-4">{error || 'Please try again'}</p>
        <Button
          onClick={checkAdmin}
          className="bg-indigo-500 hover:bg-indigo-600 text-white text-base py-3 px-6 hover:scale-105 transition-transform duration-150"
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
      className="p-4 bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl shadow-xl max-w-full mx-auto"
    >
      <div className="flex flex-col items-center mb-6 gap-4">
        <h3 className="text-lg font-bold text-gray-800">Manage Homepage Layout</h3>
        <Button
          onClick={saveLayout}
          disabled={isLoading}
          className="bg-indigo-500 hover:bg-indigo-600 text-white text-base py-3 px-6 flex items-center gap-2 hover:scale-105 transition-transform duration-150 sticky bottom-4 z-20 md:static"
          aria-label="Save homepage layout"
          title="Save homepage layout"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Save size={18} />
          )}
          Save Layout
        </Button>
      </div>
      {layoutError && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-700 bg-red-50 p-4 rounded-lg mb-6 text-base border border-red-300"
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
        <div className="flex flex-col md:flex-row gap-4">
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
              {mainBoxComponents.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-500 py-8 text-base"
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
          transition={{ type: 'spring', stiffness: 600, damping: 25 }}
        >
          <DialogContent className="sm:max-w-[90vw] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg">Edit Specific Category Properties</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="categoryId"
                  className="block text-base font-medium text-gray-700 mb-2"
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
                    className="w-full rounded-lg text-base py-3"
                    aria-label="Select category"
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {memoizedCategories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id} className="text-base py-2">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!editingProps?.props.categoryId && (
                  <p className="text-red-500 text-sm mt-1">Category is required</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingProps(null)}
                className="rounded-lg text-base py-3 px-6 hover:scale-105 transition-transform duration-150"
                title="Cancel editing"
              >
                Cancel
              </Button>
              <Button
                onClick={saveProps}
                disabled={!editingProps?.props.categoryId}
                className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-base py-3 px-6 hover:scale-105 transition-transform duration-150"
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