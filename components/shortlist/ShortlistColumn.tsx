"use client";

import { Droppable } from "@hello-pangea/dnd";
import { ShortlistCard } from "./ShortlistCard";
import { Badge } from "@/components/ui/badge";

interface ShortlistColumnProps {
  id: string;
  title: string;
  items: any[];
  onDelete: (id: string) => void;
}

export function ShortlistColumn({ id, title, items, onDelete }: ShortlistColumnProps) {
  return (
    <div className="flex-1 min-w-[300px] flex flex-col h-full">
      <div className="flex justify-between items-center mb-6 px-2">
        <h3 className="text-sm font-bold font-mono tracking-widest text-muted-foreground uppercase">
          {title}
        </h3>
        <Badge variant="secondary" className="bg-white/5 text-primary border border-white/10 font-mono">
          {items.length}
        </Badge>
      </div>

      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`flex-1 min-h-[500px] rounded-3xl transition-colors duration-200 p-2 ${
              snapshot.isDraggingOver ? "bg-primary/5" : "bg-transparent"
            }`}
          >
            {items.map((item, index) => (
              <ShortlistCard 
                key={item.id} 
                id={item.id} 
                index={index} 
                item={item} 
                onDelete={onDelete}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
