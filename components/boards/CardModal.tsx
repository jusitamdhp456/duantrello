"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface CardModalProps {
  card: any;
  onClose: () => void;
}

export default function CardModal({ card, onClose }: CardModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  if (!card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      ></div>
      <div className="relative bg-gray-50 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col z-10">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-bold text-gray-900">{card.title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                <textarea 
                  className="w-full bg-white border border-gray-200 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-black min-h-[100px]"
                  placeholder="Add a more detailed description..."
                  defaultValue={card.description || ""}
                />
                <button className="mt-2 bg-black text-white px-4 py-2 rounded-md text-sm font-medium">
                  Save
                </button>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Activity</h3>
                <div className="flex items-start space-x-3 mt-4">
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0"></div>
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="Write a comment..." 
                      className="w-full bg-white border border-gray-200 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Add to card</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 bg-white border border-gray-200 rounded-md text-sm hover:bg-gray-100 transition">
                    Labels
                  </button>
                  <button className="w-full text-left px-3 py-2 bg-white border border-gray-200 rounded-md text-sm hover:bg-gray-100 transition">
                    Checklist
                  </button>
                  <button className="w-full text-left px-3 py-2 bg-white border border-gray-200 rounded-md text-sm hover:bg-gray-100 transition">
                    Media Attachment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
