import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/storage";
import { User, ChatContact, FormattedMessage } from "@/lib/types";
import { storage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Menu, ArrowLeft } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import ChatStats from "@/components/admin/chat-stats";

const AdminChat: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const isMobile = useMobile();
  
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ChatContact[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHost, setSelectedHost] = useState<User | null>(null);
  
  // Fetch all hosts
  useEffect(() => {
    if (user && user.role === "admin") {
      refreshUsersList();
      updateContactsList();
      
      // Set up interval for updates
      const interval = setInterval(() => {
        refreshUsersList();
        updateContactsList();
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [user]);
  
  // Filter contacts when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredContacts(contacts);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredContacts(
        contacts.filter(contact => 
          contact.user.username.toLowerCase().includes(term) ||
          (contact.user.firstName && contact.user.firstName.toLowerCase().includes(term)) ||
          (contact.user.lastName && contact.user.lastName.toLowerCase().includes(term))
        )
      );
    }
  }, [searchTerm, contacts]);
  
  // Refresh users list from API
  const refreshUsersList = async () => {
    try {
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const users = await response.json();
        storage.saveUsers(users);
      }
    } catch (error) {
      console.error('Error refreshing users list:', error);
    }
  };
  
  // Update contacts list with unread message counts
  const updateContactsList = () => {
    if (!user) return;
    
    const hostUsers = storage.getUsers().filter(u => u.role === 'host');
    const contactList: ChatContact[] = [];
    
    hostUsers.forEach(hostUser => {
      const hostMessages = storage.getMessagesByUsers(
        user.id, 
        hostUser.id
      );
      
      const lastMessage = hostMessages.length > 0 
        ? hostMessages[hostMessages.length - 1] 
        : undefined;
        
      const unreadCount = hostMessages.filter(
        msg => msg.senderId === hostUser.id && !msg.isRead
      ).length;
      
      contactList.push({
        user: hostUser,
        lastMessage,
        unreadCount
      });
    });
    
    // ترتيب جهات الاتصال حسب وجود رسائل غير مقروءة أولاً ثم حسب آخر رسالة
    contactList.sort((a, b) => {
      // ترتيب حسب الرسائل غير المقروءة
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      
      // إذا كان لكليهما نفس حالة القراءة، رتب حسب وقت آخر رسالة
      const aTime = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
      
      return bTime - aTime; // ترتيب تنازلي (الأحدث أولاً)
    });
    
    setContacts(contactList);
  };
  
  const handleContactSelect = (contact: User) => {
    // تخزين معرف المضيف المحدد في التخزين المحلي
    localStorage.setItem('selectedHostId', contact.id.toString());
    // توجيه المستخدم إلى صفحة المحادثة
    window.location.href = '/chat';
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleLogout = () => {
    logout();
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك بنجاح"
    });
  };
  
  const formatLastActive = (user: User): string => {
    if (user.isOnline) return "متصل الآن";
    
    const lastSeen = new Date(user.lastSeen);
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    
    // أقل من يوم
    if (diff < 24 * 60 * 60 * 1000) {
      return `آخر ظهور ${format(lastSeen, "HH:mm", { locale: arSA })}`;
    }
    
    // أقل من أسبوع
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return `آخر ظهور ${format(lastSeen, "EEEE", { locale: arSA })}`;
    }
    
    // أكثر من أسبوع
    return `آخر ظهور ${format(lastSeen, "dd/MM/yyyy", { locale: arSA })}`;
  };
  
  const formatLastMessageContent = (message?: FormattedMessage): string => {
    if (!message) return "لا توجد رسائل";
    
    if (message.contentType === "text") {
      return message.content || "";
    }
    
    if (message.contentType === "image") {
      return "صورة";
    }
    
    if (message.contentType === "audio") {
      return "رسالة صوتية";
    }
    
    if (message.contentType === "sticker") {
      return "ملصق";
    }
    
    if (message.contentType === "financial") {
      return "إشعار مالي";
    }
    
    return "رسالة";
  };
  
  if (!user || user.role !== "admin") return null;
  
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card py-3 px-4 flex items-center justify-between shadow-md">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center"
            onClick={() => window.location.href = '/admin'}
          >
            <ArrowLeft className="ml-1 h-4 w-4" />
            <span>عودة للوحة التحكم</span>
          </Button>
          <h1 className="text-xl font-bold text-primary mr-4">محادثات المضيفين</h1>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <a
            href="https://wa.me/905378221375"
            className="bg-[#25D366] text-white py-1 px-3 rounded-full text-sm flex items-center"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="material-icons text-sm ml-1">support_agent</span>
            الدعم
          </a>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>
      
      <div className="flex-1 flex flex-col">
        {/* إحصائيات الدردشة */}
        <div className="p-4 bg-background">
          <ChatStats />
        </div>
        
        {/* بحث */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <span className="absolute right-3 top-3 text-muted-foreground material-icons">search</span>
            <Input
              type="text"
              placeholder="بحث عن مضيف..."
              className="pr-10 pl-4 py-2 rounded-lg bg-background border border-border"
              value={searchTerm}
              onChange={handleSearchChange}
              dir="rtl"
            />
          </div>
        </div>
        
        {/* قائمة المضيفين */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              {searchTerm
                ? "لا توجد نتائج مطابقة للبحث"
                : "لا يوجد مضيفين متاحين حالياً"}
            </div>
          )}
          
          {filteredContacts.map((contact) => (
            <div
              key={contact.user.id}
              className="p-3 border-b border-border hover:bg-background cursor-pointer"
              onClick={() => handleContactSelect(contact.user)}
            >
              <div className="flex items-start">
                <div className="relative">
                  <Avatar className="h-12 w-12 ml-3">
                    {contact.user.profilePicture ? (
                      <AvatarImage src={contact.user.profilePicture} alt={contact.user.username} />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {contact.user.firstName?.charAt(0) || contact.user.username.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {contact.user.isOnline && (
                    <span className="absolute bottom-0 left-3 h-3 w-3 rounded-full bg-green-500 border-2 border-card"></span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium truncate">
                      {`${contact.user.firstName || ""} ${contact.user.lastName || ""}`}
                      {!contact.user.firstName && !contact.user.lastName && contact.user.username}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {contact.lastMessage ? (
                        format(new Date(contact.lastMessage.timestamp), "HH:mm", { locale: arSA })
                      ) : ""}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-start mt-1">
                    <p className="text-sm text-muted-foreground truncate ml-2">
                      {formatLastMessageContent(contact.lastMessage)}
                    </p>
                    {contact.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center bg-primary text-white rounded-full h-5 min-w-[20px] px-1 text-xs">
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatLastActive(contact.user)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminChat;