import { Bell, CheckCircle2, MessageCircle, AlertCircle, X, Check } from 'lucide-react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function NotificationsDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'assign_task':
        return <AlertCircle className="text-blue-400" size={16} />;
      case 'review_approved':
        return <CheckCircle2 className="text-green-400" size={16} />;
      case 'review_rejected':
        return <X className="text-red-400" size={16} />;
      case 'comment':
        return <MessageCircle className="text-purple-400" size={16} />;
      default:
        return <Bell className="text-gray-400" size={16} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 md:p-3 rounded-full text-blue-300 hover:text-white hover:bg-white/10 transition-all focus:outline-none"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 md:top-2 right-1 md:right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold border-2 border-[#0D2657] shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 md:w-96 rounded-[1.5rem] shadow-2xl z-50 overflow-hidden border border-white/10"
          style={{ background: 'linear-gradient(135deg, #0D2657, #0D4A8A)', backdropFilter: 'blur(10px)' }}
        >
          <div className="p-3 md:p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold text-white">Thông báo</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllAsRead()}
                className="text-xs text-blue-300 hover:text-white flex items-center gap-1 transition-colors"
              >
                <Check size={12} /> Đánh dấu đã đọc
              </button>
            )}
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto scrollbar-hide">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-blue-300/60 flex flex-col items-center">
                <Bell size={32} className="mb-2 opacity-50" />
                <p className="text-sm">Chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => {
                      if (!notif.is_read) markAsRead(notif.id);
                      if (notif.link_url) window.location.href = notif.link_url;
                    }}
                    className={`p-3 md:p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors flex gap-3 ${!notif.is_read ? 'bg-blue-500/10' : ''}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.is_read ? 'text-white font-semibold' : 'text-blue-100 font-medium'} truncate`}>
                        {notif.title}
                      </p>
                      {notif.message && (
                        <p className="text-xs text-blue-300 mt-1 line-clamp-2">
                          {notif.message}
                        </p>
                      )}
                      <p className="text-[10px] text-blue-400/60 mt-1.5">
                        {new Date(notif.created_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-2 border-t border-white/10 text-center bg-black/10">
            <button 
              onClick={() => setIsOpen(false)}
              className="text-xs text-blue-300 hover:text-white transition-colors py-1"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
