"use client";

import { Draggable } from "@hello-pangea/dnd";

interface TaskCardProps {
  card: any;
  index: number;
  onClick: (card: any) => void;
}

export default function TaskCard({ card, index, onClick }: TaskCardProps) {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(card)}
          className={`px-5 py-4 mb-4 bg-neu-base rounded-2xl cursor-pointer hover:shadow-neu-concave transition-all duration-200 border-none ${
            snapshot.isDragging ? "shadow-neu-concave ring-1 ring-blue-400/30" : "shadow-neu-convex"
          }`}
          style={{ ...provided.draggableProps.style }}
        >
          <p className="text-sm text-gray-700 font-medium leading-relaxed">{card.title}</p>
        </div>
      )}
    </Draggable>
  );
}
