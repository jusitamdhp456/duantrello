"use client";

import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import ListColumn from "./ListColumn";
import CardModal from "./CardModal";
import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { createList, createCard, updateCardPosition, updateListPosition } from "@/app/actions/boards";

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
      await updateListPosition(draggableId, destination.index * 1024, boardId);
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

      await updateCardPosition(draggableId, destListId, destination.index * 1024, boardId);
    }
  };

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const position = lists.length * 1024;
    const newList = await createList(newListName, boardId, position);
    setLists([...lists, newList]);
    setNewListName("");
    setIsAddingList(false);
  };

  const handleAddCard = async (title: string, listId: string) => {
    const listCards = cards.filter((c) => c.list_id === listId);
    const position = listCards.length * 1024;
    const newCard = await createCard(title, listId, position);
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
            <div className="w-72 flex-shrink-0">
              {isAddingList ? (
                <form onSubmit={handleAddList} className="bg-white p-2 rounded shadow-sm border border-gray-200">
                  <input
                    autoFocus
                    className="w-full text-sm p-2 mb-2 border border-gray-200 rounded focus:outline-none"
                    placeholder="Enter list title..."
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                  />
                  <div className="flex items-center justify-between">
                    <button type="submit" className="bg-black text-white text-xs px-3 py-1.5 rounded font-medium">
                      Add list
                    </button>
                    <button type="button" onClick={() => setIsAddingList(false)} className="p-1 text-gray-500 hover:text-black">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingList(true)}
                  className="flex items-center bg-black/5 hover:bg-black/10 text-gray-800 text-sm w-full p-3 rounded-lg font-medium transition"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add another list
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
