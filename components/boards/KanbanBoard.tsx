"use client";

import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import ListColumn from "./ListColumn";
import CardModal from "./CardModal";
import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { createList, createCard, updateCardPosition, updateListPosition } from "@/app/actions/boards";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface KanbanBoardProps {
  boardId: string;
  initialLists: any[];
  initialCards: any[];
}

export default function KanbanBoard({ boardId, initialLists, initialCards }: KanbanBoardProps) {
  const [lists, setLists] = useState(initialLists);
  const [cards, setCards] = useState(initialCards);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [selectedCard, setSelectedCard] = useState<any>(null);
  // Hack to fix hydration issues with react-beautiful-dnd
  const [isBrowser, setIsBrowser] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setIsBrowser(true);
    setLists(initialLists);
    setCards(initialCards);
  }, [initialLists, initialCards]);

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    if (type === "list") {
      const newLists = Array.from(lists);
      const [removed] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, removed);

      // Re-calculate positions
      const updatedLists = newLists.map((l, idx) => ({ ...l, position: idx * 1024 }));
      setLists(updatedLists);

      // Save to db
      await updateListPosition(draggableId, destination.index * 1024);
      return;
    }

    if (type === "card") {
      const sourceListId = source.droppableId;
      const destListId = destination.droppableId;

      const sourceCards = cards.filter((c) => c.list_id === sourceListId).sort((a, b) => a.position - b.position);
      const destCards = sourceListId === destListId ? sourceCards : cards.filter((c) => c.list_id === destListId).sort((a, b) => a.position - b.position);

      const [movedCard] = sourceCards.splice(source.index, 1);
      destCards.splice(destination.index, 0, movedCard);
      movedCard.list_id = destListId;

      // Simple re-position logic:
      const updatedDestCards = destCards.map((c, idx) => ({ ...c, position: idx * 1024 }));
      
      const newAllCards = cards.filter(c => c.list_id !== sourceListId && c.list_id !== destListId)
        .concat(sourceListId === destListId ? updatedDestCards : [...sourceCards, ...updatedDestCards]);
      
      setCards(newAllCards);

      await updateCardPosition(draggableId, destListId, destination.index * 1024);
    }
  };

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const newList = await createList(boardId, newListName);
    setLists([...lists, newList]);
    setNewListName("");
    setIsAddingList(false);
  };

  const handleAddCard = async (title: string, listId: string) => {
    const newCard = await createCard(listId, title, boardId);
    setCards([...cards, newCard]);
  };

  if (!isBrowser) return null;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="board" type="list" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex items-start h-[calc(100vh-160px)] overflow-x-auto pb-4"
          >
            {lists.sort((a, b) => a.position - b.position).map((list, index) => {
              const listCards = cards
                .filter((c) => c.list_id === list.id)
                .sort((a, b) => a.position - b.position);
              return (
                <ListColumn
                  key={list.id}
                  list={list}
                  cards={listCards}
                  index={index}
                  onAddCard={handleAddCard}
                  onCardClick={(card) => setSelectedCard(card)}
                />
              );
            })}
            {provided.placeholder}

            {/* Add List Button */}
            <div className="w-72 flex-shrink-0 ml-4">
              {isAddingList ? (
                <form onSubmit={handleAddList} className="bg-neu-base p-4 rounded-[1.5rem] shadow-neu-convex border-none">
                  <input
                    autoFocus
                    className="w-full text-sm p-3 mb-4 bg-neu-base shadow-neu-concave rounded-xl focus:outline-none border-none text-gray-700 font-medium"
                    placeholder={t("enter_list_title")}
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                  />
                  <div className="flex items-center justify-between px-1">
                    <button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs px-5 py-2 rounded-full font-bold uppercase tracking-wider shadow-neu-convex active:shadow-neu-pressed transition-all">
                      {t("add_list")}
                    </button>
                    <button type="button" onClick={() => setIsAddingList(false)} className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:shadow-neu-concave transition-all">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingList(true)}
                  className="flex items-center justify-center bg-neu-base shadow-neu-convex hover:shadow-neu-concave text-gray-500 text-sm w-full p-4 rounded-[1.5rem] font-bold transition-all duration-200 uppercase tracking-widest"
                >
                  <Plus className="w-5 h-5 mr-2" /> {t("add_another_list")}
                </button>
              )}
            </div>
          </div>
        )}
      </Droppable>

      {selectedCard && (
        <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </DragDropContext>
  );
}
