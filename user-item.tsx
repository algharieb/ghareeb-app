import React from "react";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import { User, FormattedMessage, OnlineStatus } from "@/lib/types";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserItemProps {
  user: User;
  lastMessage?: FormattedMessage;
  unreadCount: number;
  isActive: boolean;
  onClick: () => void;
}

const UserItem: React.FC<UserItemProps> = ({ 
  user, 
  lastMessage, 
  unreadCount, 
  isActive, 
  onClick 
}) => {
  const getOnlineStatus = (user: User): OnlineStatus => {
    if (user.isOnline) return OnlineStatus.ONLINE;
    
    const lastSeenDate = new Date(user.lastSeen);
    const hoursDiff = (Date.now() - lastSeenDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff < 1) return OnlineStatus.AWAY;
    return OnlineStatus.OFFLINE;
  };
  
  const getStatusIndicatorClass = (status: OnlineStatus): string => {
    switch (status) {
      case OnlineStatus.ONLINE:
        return "online-indicator";
      case OnlineStatus.AWAY:
        return "away-indicator";
      case OnlineStatus.OFFLINE:
        return "offline-indicator";
    }
  };
  
  const getStatusText = (user: User): string => {
    if (user.isOnline) return "متصل الآن";
    
    const lastSeenDate = new Date(user.lastSeen);
    return `آخر ظهور ${formatDistanceToNow(lastSeenDate, { locale: arSA, addSuffix: true })}`;
  };
  
  const status = getOnlineStatus(user);
  
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleBlockUser = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`حظر المستخدم: ${user.username}`);
    // تنفيذ وظيفة الحظر هنا
  };

  const handleDeleteChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`مسح محادثة مع المستخدم: ${user.username}`);
    // تنفيذ وظيفة مسح المحادثة هنا
  };

  const handleMuteNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`كتم إشعارات المستخدم: ${user.username}`);
    // تنفيذ وظيفة كتم الإشعارات هنا
  };

  const handleAddShortcut = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`إضافة اختصار للمستخدم: ${user.username}`);
    // تنفيذ وظيفة إضافة اختصار هنا
  };

  return (
    <div 
      className={`p-3 hover:bg-muted flex items-center space-x-3 space-x-reverse border-b border-border ${isActive ? 'bg-muted' : ''}`}
    >
      <div className="relative" onClick={onClick}>
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          {user.profilePicture ? (
            <img 
              src={user.profilePicture} 
              alt={`${user.firstName || user.username}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="material-icons text-2xl">
              {user.role === "admin" ? "admin_panel_settings" : "person"}
            </span>
          )}
        </div>
        <span className={getStatusIndicatorClass(status)}></span>
      </div>
      
      <div className="flex-1" onClick={onClick}>
        <h3 className="font-bold">
          {user.role === "admin" 
            ? "المدير" 
            : `${user.firstName || ""} ${user.lastName || ""}`}
        </h3>
        <p className="text-xs text-muted-foreground truncate max-w-[160px]">
          {lastMessage?.content || getStatusText(user)}
        </p>
      </div>
      
      <div className="flex items-center">
        <div className="flex flex-col items-end mr-2" onClick={onClick}>
          {lastMessage?.timestamp && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(lastMessage.timestamp), { 
                locale: arSA, 
                addSuffix: false
              })}
            </span>
          )}
          
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mt-1">
              {unreadCount}
            </span>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={handleMenuClick}>
            <button className="p-1 hover:bg-muted rounded-full focus:outline-none">
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleBlockUser}>
              حظر المستخدم
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDeleteChat}>
              مسح المحادثة
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleMuteNotifications}>
              كتم الإشعارات
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAddShortcut}>
              إضافة اختصار
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default UserItem;
