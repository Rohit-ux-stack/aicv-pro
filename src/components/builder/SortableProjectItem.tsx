import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableProjectItemProps {
  id: string;
  children: React.ReactNode;
}

export const SortableProjectItem: React.FC<SortableProjectItemProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative mb-4 bg-white border rounded-lg transition-shadow ${
        isDragging ? 'shadow-lg border-blue-500' : 'shadow-sm border-gray-200'
      }`}
    >
      {/* Drag Handle - Added touch-none to prevent scrolling on mobile while dragging */}
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md cursor-grab active:cursor-grabbing touch-none"
        title="Drag to reorder"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="9" cy="12" r="1"/>
          <circle cx="9" cy="5" r="1"/>
          <circle cx="9" cy="19" r="1"/>
          <circle cx="15" cy="12" r="1"/>
          <circle cx="15" cy="5" r="1"/>
          <circle cx="15" cy="19" r="1"/>
        </svg>
      </div>
      
      {/* Form Content Container */}
      <div className="p-5 pt-10">
        {children}
      </div>
    </div>
  );
};
