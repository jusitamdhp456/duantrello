"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Clock } from "lucide-react";

interface TaskCardProps {
  card: any;
  index: number;
  onClick: (card: any) => void;
}

export default function TaskCard({ card, index, onClick }: TaskCardProps) {
  const labels = card.cards_labels_map?.map((cl: any) => cl.card_labels) || [];
  const members = card.card_members?.map((cm: any) => cm.profiles) || [];
  
  const isOverdue = card.due_date && new Date(card.due_date) < new Date();

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(card)}
          className={`px-4 py-3 mb-3 bg-neu-base rounded-2xl cursor-pointer hover:shadow-neu-concave transition-all duration-200 border-none ${
            snapshot.isDragging ? "shadow-neu-concave ring-1 ring-blue-400/30" : "shadow-neu-convex"
          }`}
          style={{ ...provided.draggableProps.style }}
        >
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {labels.map((label: any) => (
                <div key={label.id} className="h-2 w-8 rounded-full" style={{ backgroundColor: label.color || '#3b82f6' }} title={label.name} />
              ))}
            </div>
          )}
          
          <p className="text-sm text-gray-700 font-medium leading-snug mb-3">{card.title}</p>
          
          {(card.due_date || members.length > 0) && (
            <div className="flex items-center justify-between text-xs text-gray-400">
              {card.due_date ? (
                <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-500 font-bold' : ''}`}>
                  <Clock className="w-3 h-3" />
                  <span>{new Date(card.due_date).toLocaleDateString()}</span>
                </div>
              ) : <div />}
              
              {members.length > 0 && (
                <div className="flex -space-x-1">
                  {members.map((member: any, i: number) => (
                    <div key={i} className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 border border-white" title={member.full_name}>
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.full_name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        member.full_name?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

