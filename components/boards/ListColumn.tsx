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
          className="bg-neu-base rounded-[2rem] w-80 flex-shrink-0 flex flex-col max-h-full mr-6 shadow-neu-convex pb-2"
        >
          <div
            {...provided.dragHandleProps}
            className="px-6 py-5 font-bold text-gray-700 flex justify-between items-center cursor-grab text-lg tracking-wide border-b border-gray-300/30"
          >
            {list.name}
          </div>

          <Droppable droppableId={list.id} type="card">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-1 overflow-y-auto px-4 py-4 min-h-[50px] transition-colors duration-200 ${
                  snapshot.isDraggingOver ? "bg-neu-dark/10 rounded-[1.5rem]" : ""
                }`}
              >
                {cards.map((card, idx) => (
                  <TaskCard key={card.id} card={card} index={idx} onClick={onCardClick} />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <div className="px-4 pb-4">
            {isAdding ? (
              <form onSubmit={handleAddSubmit} className="bg-neu-base p-4 rounded-[1.5rem] shadow-neu-concave">
                <textarea
                  autoFocus
                  className="w-full text-sm resize-none bg-transparent focus:outline-none text-gray-700 font-medium"
                  placeholder="Enter a title for this card..."
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  rows={2}
                />
                <div className="flex items-center justify-between mt-3 px-1">
                  <button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs px-5 py-2 rounded-full font-bold uppercase tracking-wider shadow-neu-convex active:shadow-neu-pressed transition-all">
                    Add card
                  </button>
                  <button type="button" onClick={() => setIsAdding(false)} className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:shadow-neu-concave transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center justify-center text-gray-500 text-sm hover:text-gray-700 hover:shadow-neu-concave w-full py-3 rounded-full font-bold transition-all uppercase tracking-widest mt-2"
              >
                <Plus className="w-5 h-5 mr-2" /> Add a card
              </button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
