'use client';
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

export const SortableItem: React.FC<SortableItemProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        {...attributes}
        {...listeners}
        title="Drag to reorder"
        className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex cursor-grab items-center justify-center rounded-lg border border-violet-400/25 bg-white/[0.06] p-1.5 text-violet-300/60 transition-all hover:bg-violet-500/20 hover:text-violet-200 active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>
      {children}
    </div>
  );
};
