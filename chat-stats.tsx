import React, { useState, useEffect } from "react";
import { storage } from "@/lib/storage";
import { User, Message } from "@/lib/types";
import { ArrowRight, MessageCircle, Users, Clock } from "lucide-react";

const ChatStats: React.FC = () => {
  const [hosts, setHosts] = useState<User[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [activeHosts, setActiveHosts] = useState(0);
  
  useEffect(() => {
    // جلب المضيفين
    const hostUsers = storage.getUsers().filter(u => u.role === "host");
    setHosts(hostUsers);
    
    // حساب المضيفين النشطين
    const active = hostUsers.filter(host => host.isOnline).length;
    setActiveHosts(active);
    
    // جلب جميع الرسائل
    const adminUser = storage.getUserByUsername("admin");
    if (adminUser) {
      const allMessages: Message[] = [];
      let unread = 0;
      
      // جمع جميع الرسائل وحساب غير المقروءة
      hostUsers.forEach(host => {
        const messages = storage.getMessagesByUsers(adminUser.id, host.id);
        allMessages.push(...messages);
        
        // حساب الرسائل غير المقروءة المرسلة للمدير
        const hostToAdminUnread = messages.filter(
          msg => msg.senderId === host.id && !msg.isRead
        ).length;
        
        unread += hostToAdminUnread;
      });
      
      setTotalMessages(allMessages.length);
      setUnreadMessages(unread);
    }
  }, []);
  
  return (
    <div className="bg-card p-3 rounded-lg shadow-md h-full">
      <h3 className="text-base font-bold mb-2">إحصائيات</h3>
      
      <div className="flex flex-col gap-2">
        <div className="bg-background p-2 rounded-lg flex items-center">
          <div className="ml-2 bg-green-500/10 w-8 h-8 rounded-full flex items-center justify-center">
            <ArrowRight className="h-4 w-4 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">المتصلين</p>
            <p className="text-lg font-bold">{activeHosts}</p>
          </div>
        </div>
        
        <div className="bg-background p-2 rounded-lg flex items-center">
          <div className="ml-2 bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">المضيفين</p>
            <p className="text-lg font-bold">{hosts.length}</p>
          </div>
        </div>
        
        <div className="bg-background p-2 rounded-lg flex items-center">
          <div className="ml-2 bg-red-500/10 w-8 h-8 rounded-full flex items-center justify-center">
            <Clock className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">غير مقروءة</p>
            <p className="text-lg font-bold">{unreadMessages}</p>
          </div>
        </div>
        
        <div className="bg-background p-2 rounded-lg flex items-center">
          <div className="ml-2 bg-blue-500/10 w-8 h-8 rounded-full flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">الرسائل</p>
            <p className="text-lg font-bold">{totalMessages}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatStats;