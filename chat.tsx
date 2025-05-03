import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/storage";
import { storage } from "@/lib/storage";
import { User, Message, FormattedMessage, ChatContact } from "@/lib/types";
import UserItem from "@/components/chat/user-item";
import MessageBubble from "@/components/chat/message-bubble";
import ChatInput from "@/components/chat/chat-input";
import ChatStats from "@/components/admin/chat-stats";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { Menu, LogOut, ArrowRight, ArrowLeft, MoreVertical, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Chat: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const isMobile = useMobile();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [activeContact, setActiveContact] = useState<User | null>(null);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [messages, setMessages] = useState<FormattedMessage[]>([]);
  
  // Init contact list
  useEffect(() => {
    if (user) {
      const contactList: ChatContact[] = [];
      
      // إذا كان المستخدم هو المدير، قم بتحميل جميع المضيفين
      if (user.role === 'admin') {
        // جلب جميع المضيفين للمدير
        const hostUsers = storage.getUsers().filter(u => u.role === 'host');
        
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
        
        // التحقق مما إذا كان هناك معرف مضيف محدد من لوحة التحكم
        const selectedHostId = localStorage.getItem('selectedHostId');
        if (selectedHostId && !activeContact) {
          const selectedHost = hostUsers.find(host => host.id.toString() === selectedHostId);
          if (selectedHost) {
            setActiveContact(selectedHost);
            updateMessages(selectedHost.id);
            markMessagesAsRead(selectedHost.id);
            // إزالة المعرف من التخزين المحلي بعد الاستخدام
            localStorage.removeItem('selectedHostId');
          } else if (hostUsers.length > 0) {
            // إذا لم يتم العثور على المضيف المحدد، استخدم المضيف الأول
            setActiveContact(hostUsers[0]);
            updateMessages(hostUsers[0].id);
            markMessagesAsRead(hostUsers[0].id);
          }
        } else if (hostUsers.length > 0 && !activeContact) {
          // إذا لم يكن هناك معرف مضيف محدد وليس هناك جهة اتصال نشطة
          setActiveContact(hostUsers[0]);
          updateMessages(hostUsers[0].id);
          markMessagesAsRead(hostUsers[0].id);
        }
      } else {
        // إذا كان المستخدم مضيفًا، قم بإضافة المدير لقائمة جهات الاتصال
        const adminUser = storage.getUserByUsername("admin");
        
        if (adminUser) {
          const adminMessages = storage.getMessagesByUsers(
            user.id, 
            adminUser.id
          );
          
          const lastMessage = adminMessages.length > 0 
            ? adminMessages[adminMessages.length - 1] 
            : undefined;
            
          const unreadCount = adminMessages.filter(
            msg => msg.senderId === adminUser.id && !msg.isRead
          ).length;
          
          contactList.push({
            user: adminUser,
            lastMessage,
            unreadCount
          });
          
          // إذا لم تكن هناك جهة اتصال نشطة، قم بتعيين المدير كجهة نشطة
          if (!activeContact) {
            setActiveContact(adminUser);
            updateMessages(adminUser.id);
            markMessagesAsRead(adminUser.id);
          }
        }
        
        // إضافة المضيفين الآخرين إلى جهات الاتصال
        const otherHosts = storage.getUsers().filter(u => u.role === 'host' && u.id !== user.id);
        
        otherHosts.forEach(hostUser => {
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
      }
      
      setContacts(contactList);
    }
  }, [user, activeContact]);
  
  // Poll for new messages and update contacts list
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        // Refresh the users list from API for admins to see new hosts
        if (user.role === 'admin') {
          refreshUsersList();
        }
        
        // Always update contacts to see new messages and hosts
        updateContacts();
        
        // Only update messages if there's an active contact
        if (activeContact) {
          updateMessages(activeContact.id);
        }
      }
    }, 3000); // every 3 seconds
    
    return () => clearInterval(interval);
  }, [user, activeContact]);
  
  // Refresh users list from API
  const refreshUsersList = async () => {
    try {
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const users = await response.json();
        // تخزين المستخدمين المحدثين في التخزين المحلي
        storage.saveUsers(users);
      }
    } catch (error) {
      console.error('Error refreshing users list:', error);
    }
  };
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // إضافة معالجة زر الرجوع في متصفح الهاتف
  useEffect(() => {
    const handleBackButton = (e: PopStateEvent) => {
      if (activeContact && isMobile && !isSidebarOpen) {
        e.preventDefault();
        // إظهار قائمة جهات الاتصال بدلاً من الخروج من التطبيق
        setIsSidebarOpen(true);
        // لا نحتاج إلى إعادة تعيين جهة الاتصال النشطة إلى null لأننا نريد الاحتفاظ بالمحادثة الحالية
        
        // إضافة حالة جديدة إلى تاريخ المتصفح لمنع المتصفح من الخروج من التطبيق
        window.history.pushState(null, "", window.location.pathname);
        return;
      }
    };
    
    // إضافة حالة إلى تاريخ المتصفح عند فتح محادثة
    if (activeContact && isMobile && !isSidebarOpen) {
      window.history.pushState(null, "", window.location.pathname);
    }
    
    window.addEventListener("popstate", handleBackButton);
    
    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [activeContact, isMobile, isSidebarOpen]);
  
  const updateContacts = () => {
    if (!user) return;
    
    const contactList: ChatContact[] = [];
    
    // إذا كان المستخدم هو المدير، قم بتحديث جميع المضيفين
    if (user.role === 'admin') {
      const hostUsers = storage.getUsers().filter(u => u.role === 'host');
      
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
    } else { // إذا كان المستخدم مضيفًا
      // إضافة المدير إلى جهات الاتصال
      const adminUser = storage.getUserByUsername("admin");
      if (adminUser) {
        const adminMessages = storage.getMessagesByUsers(
          user.id, 
          adminUser.id
        );
        
        const lastMessage = adminMessages.length > 0 
          ? adminMessages[adminMessages.length - 1] 
          : undefined;
          
        const unreadCount = adminMessages.filter(
          msg => msg.senderId === adminUser.id && !msg.isRead
        ).length;
        
        contactList.push({
          user: adminUser,
          lastMessage,
          unreadCount
        });
      }
      
      // إضافة المضيفين الآخرين إلى جهات الاتصال
      const otherHosts = storage.getUsers().filter(u => u.role === 'host' && u.id !== user.id);
      
      otherHosts.forEach(hostUser => {
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
    }
    
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
  
  const updateMessages = (contactId: number) => {
    if (!user) return;
    
    const fetchedMessages = storage.getMessagesByUsers(user.id, contactId);
    const formattedMessages: FormattedMessage[] = fetchedMessages.map(msg => {
      const messageDate = new Date(msg.timestamp);
      return {
        ...msg,
        formattedTime: format(messageDate, "HH:mm", { locale: arSA })
      };
    });
    
    setMessages(formattedMessages);
  };
  
  const markMessagesAsRead = (senderId: number) => {
    if (!user) return;
    storage.updateMessageReadStatus(senderId, user.id);
    updateContacts();
  };
  
  const handleContactSelect = (contact: User) => {
    setActiveContact(contact);
    updateMessages(contact.id);
    markMessagesAsRead(contact.id);
    
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };
  
  const handleSendMessage = (content: string, contentType: string, mediaUrl?: string) => {
    if (!user || !activeContact) return;
    
    const newMessage = storage.addMessage({
      senderId: user.id,
      receiverId: activeContact.id,
      content,
      contentType,
      mediaUrl,
      isRead: false
    });
    
    // Update messages with the new one
    updateMessages(activeContact.id);
    updateContacts();
    
    // محاكاة استلام الرسالة (تغيير من صح واحد رمادي إلى صحين رماديين)
    setTimeout(() => {
      // في الواقع هذا سيتم على الخادم عند استلام الرسالة
      // هنا نحاكي فقط لأغراض العرض
      storage.updateMessageDeliveryStatus(newMessage.id);
      updateMessages(activeContact.id);
    }, 1000);
  };
  
  const handleLogout = () => {
    logout();
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك بنجاح"
    });
  };
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Group messages by date
  const groupedMessages: { [date: string]: FormattedMessage[] } = {};
  messages.forEach(message => {
    const messageDate = new Date(message.timestamp);
    const dateKey = format(messageDate, "yyyy-MM-dd");
    
    if (!groupedMessages[dateKey]) {
      groupedMessages[dateKey] = [];
    }
    groupedMessages[dateKey].push(message);
  });
  
  // Format date headers
  const formatDateHeader = (dateKey: string) => {
    const messageDate = new Date(dateKey);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateKey === format(today, "yyyy-MM-dd")) {
      return "اليوم";
    } else if (dateKey === format(yesterday, "yyyy-MM-dd")) {
      return "أمس";
    } else {
      return format(messageDate, "dd MMMM yyyy", { locale: arSA });
    }
  };
  
  if (!user) return null;
  
  return (
    <div className="h-screen flex flex-col">
      {user?.role === "admin" && (
        <div className="p-4 bg-background">
          <ChatStats />
        </div>
      )}
      {/* Chat Header */}
      <header className="bg-card py-3 px-4 flex items-center justify-between shadow-md">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden ml-2"
            onClick={toggleSidebar}
          >
            <Menu />
          </Button>
          <h1 className="text-xl font-bold text-primary">تطبيق الغريب</h1>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          {user?.role === 'admin' && (
            <Button 
              variant="ghost" 
              size="sm"
              className="mr-2 flex items-center"
              onClick={() => window.location.href = '/admin'}
            >
              <ArrowLeft className="ml-1 h-4 w-4" />
              <span>عودة للوحة التحكم</span>
            </Button>
          )}
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
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Contacts List */}
        <aside
          className={`
            ${isSidebarOpen ? "block" : "hidden"}
            ${isMobile ? "absolute z-10 w-full h-[calc(100%-64px)]" : "relative"}
            md:block w-full md:w-80 bg-card md:flex flex-col overflow-hidden
          `}
        >
          {/* User Profile */}
          <div className="p-4 border-b border-border flex items-center space-x-3 space-x-reverse">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={`${user.firstName || user.username}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-icons text-2xl">person</span>
                )}
              </div>
              <span className="online-indicator"></span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold">{`${user.firstName || ""} ${user.lastName || ""}`}</h3>
              <p className="text-xs opacity-75">متصل الآن</p>
            </div>
            <Button variant="ghost" size="icon">
              <span className="material-icons">more_vert</span>
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="p-3 border-b border-border">
            <div className="bg-background rounded-full flex items-center px-3 py-1">
              <span className="material-icons text-muted-foreground ml-2">search</span>
              <input
                type="text"
                placeholder="بحث..."
                className="bg-transparent border-none focus:outline-none w-full text-sm py-1"
                dir="rtl"
              />
            </div>
          </div>
          
          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto">
            {contacts.map(contact => (
              <UserItem
                key={contact.user.id}
                user={contact.user}
                lastMessage={contact.lastMessage}
                unreadCount={contact.unreadCount}
                isActive={activeContact?.id === contact.user.id}
                onClick={() => handleContactSelect(contact.user)}
              />
            ))}
          </div>
        </aside>
        
        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-background">
          {activeContact ? (
            <>
              {/* Chat Partner Info */}
              <div className="bg-card p-3 flex items-center justify-between shadow-md">
                <div className="flex items-center">
                  {isMobile && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsSidebarOpen(true)}
                      className="ml-2"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  )}
                  <div className="relative ml-3">
                    <div 
                      className="w-10 h-10 rounded-full bg-primary flex items-center justify-center overflow-hidden cursor-pointer relative group"
                      onClick={() => {
                        // إضافة محدد التحديد للصورة الشخصية
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              const result = reader.result as string;
                              // تحديث الصورة الشخصية في التخزين المحلي
                              if (user) {
                                const updatedUser = { ...user, profilePicture: result };
                                storage.updateUser(updatedUser);
                                
                                // تحديث واجهة المستخدم
                                window.location.reload();
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        };
                        input.click();
                      }}
                    >
                      {activeContact.profilePicture ? (
                        <img
                          src={activeContact.profilePicture}
                          alt={`${activeContact.firstName || activeContact.username}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="material-icons">
                          {activeContact.role === "admin" ? "admin_panel_settings" : "person"}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <span className={activeContact.isOnline ? "online-indicator" : "offline-indicator"}></span>
                  </div>
                  <div>
                    <h3 className="font-bold">
                      {activeContact.role === "admin"
                        ? "المدير"
                        : `${activeContact.firstName || ""} ${activeContact.lastName || ""}`}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {activeContact.isOnline ? "متصل الآن" : "غير متصل"}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => console.log(`حظر المستخدم: ${activeContact.username}`)}>
                      حظر المستخدم
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => console.log(`مسح المحادثة مع: ${activeContact.username}`)}>
                      مسح المحادثة
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => console.log(`كتم إشعارات: ${activeContact.username}`)}>
                      كتم الإشعارات
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => console.log(`إضافة اختصار: ${activeContact.username}`)}>
                      إضافة اختصار
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {Object.keys(groupedMessages).map(dateKey => (
                  <div key={dateKey}>
                    {/* Date Header */}
                    <div className="text-center mb-4">
                      <span className="bg-card px-3 py-1 rounded-full text-xs text-muted-foreground">
                        {formatDateHeader(dateKey)}
                      </span>
                    </div>
                    
                    {/* Messages for this date */}
                    <div className="space-y-4">
                      {groupedMessages[dateKey].map(message => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          currentUser={user}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                
                {/* Empty state */}
                {messages.length === 0 && (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <span className="material-icons text-3xl">chat</span>
                    </div>
                    <p className="text-muted-foreground">
                      لا توجد رسائل بعد. ابدأ محادثة جديدة!
                    </p>
                  </div>
                )}
                
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input Area */}
              <ChatInput onSendMessage={handleSendMessage} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <span className="material-icons text-3xl">chat</span>
                </div>
                <h3 className="text-xl font-bold mb-2">اختر محادثة</h3>
                <p className="text-muted-foreground">اختر جهة اتصال من القائمة الجانبية لبدء المحادثة</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Chat;
