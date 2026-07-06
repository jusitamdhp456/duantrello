"use client";

import { Droppable, Draggable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface ListColumnProps {
  list: any;
  cards: any[];
  index: number;
  onAddCard: (title: string, listId: string) => Promise<void>;
  onCardClick: (card: any) => void;
  activeRole?: string;
}

export default function ListColumn({ list, cards, index, onAddCard, onCardClick, activeRole }: ListColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const { t } = useLanguage();

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

          {activeRole !== 'guest' && (
            <div className="px-4 pb-4">
              {isAdding ? (
                <form onSubmit={handleAddSubmit} className="bg-neu-base p-3 rounded-[1.5rem] shadow-neu-convex mt-2">
                  <textarea
                    autoFocus
                    className="w-full text-sm p-3 bg-neu-base shadow-neu-concave rounded-xl focus:outline-none border-none text-gray-700 resize-none font-medium mb-3"
                    placeholder={t("enter_card_title")}
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    rows={2}
                  />
                  <div className="flex items-center justify-between px-1">
                    <button type="submit" className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs px-5 py-2 rounded-full font-bold uppercase tracking-wider shadow-neu-convex active:shadow-neu-pressed transition-all">
                      {t("add_card")}
                    </button>
                    <button type="button" onClick={() => setIsAdding(false)} className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:shadow-neu-concave transition-all">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAdding(true)}
                  className="flex items-center text-gray-500 hover:text-gray-700 hover:bg-neu-base hover:shadow-neu-concave p-3 rounded-[1.5rem] w-full text-sm font-bold transition-all duration-200 mt-2 uppercase tracking-widest"
                >
                  <Plus className="w-5 h-5 mr-2" /> {t("add_a_card")}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
