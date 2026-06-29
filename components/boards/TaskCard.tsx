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
          className={`p-3 mb-2 bg-white rounded shadow-sm border cursor-pointer hover:border-gray-300 transition ${
            snapshot.isDragging ? "border-blue-500 shadow-md" : "border-gray-200"
          }`}
          style={{ ...provided.draggableProps.style }}
        >
          <p className="text-sm text-gray-800">{card.title}</p>
        </div>
      )}
    </Draggable>
  );
}
