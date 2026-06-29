"use client";

import { Droppable, Draggable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";
import { useState } from "react";
import { Plus, X } from "lucide-react";

interface ListColumnProps {
  list: any;
  cards: any[];
  index: number;
  onAddCard: (title: string, listId: string) => Promise<void>;
  onCardClick: (card: any) => void;
}

export default function ListColumn({ list, cards, index, onAddCard, onCardClick }: ListColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    await onAddCard(newCardTitle, list.id);
    setNewCardTitle("");
    setIsAdding(false);
  };

  return (
    <Draggable draggableId={list.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="bg-gray-100 rounded-lg w-72 flex-shrink-0 flex flex-col max-h-full mr-4"
        >
          <div
            {...provided.dragHandleProps}
            className="p-3 font-semibold text-gray-700 flex justify-between items-center cursor-grab"
          >
            {list.name}
          </div>

          <Droppable droppableId={list.id} type="card">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-1 overflow-y-auto px-3 py-1 min-h-[10px] ${
                  snapshot.isDraggingOver ? "bg-gray-200" : ""
                }`}
              >
                {cards.map((card, idx) => (
                  <TaskCard key={card.id} card={card} index={idx} onClick={onCardClick} />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <div className="p-3">
            {isAdding ? (
              <form onSubmit={handleAddSubmit} className="bg-white p-2 rounded shadow-sm border border-gray-200">
                <textarea
                  autoFocus
                  className="w-full text-sm resize-none focus:outline-none"
                  placeholder="Enter a title for this card..."
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  rows={2}
                />
                <div className="flex items-center justify-between mt-2">
                  <button type="submit" className="bg-black text-white text-xs px-3 py-1.5 rounded font-medium">
                    Add card
                  </button>
                  <button type="button" onClick={() => setIsAdding(false)} className="p-1 text-gray-500 hover:text-black">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center text-gray-600 text-sm hover:bg-gray-200 w-full p-2 rounded transition"
              >
                <Plus className="w-4 h-4 mr-1" /> Add a card
              </button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
