import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/storage";
import { useLocation } from "wouter";
import DashboardStats from "@/components/admin/dashboard-stats";
import BroadcastForm from "@/components/admin/broadcast-form";
import HostManagement from "@/components/admin/host-management";
import FinancialNotifications from "@/components/admin/financial-notifications";
import type { User as UserType, ChatContact, FormattedMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, MessageCircle, Database, Settings, Bell, Users, LayoutDashboard, MoreVertical, Camera, Ban, Trash2, ImageIcon, Smile, ChevronLeft, UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { storage } from "@/lib/storage";
import ChatStats from "@/components/admin/chat-stats";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Admin: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const isMobile = useMobile();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mainTab, setMainTab] = useState("dashboard");
  const [showContactsList, setShowContactsList] = useState(true);
  const [, setLocation] = useLocation();
  
  // للمحادثات
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ChatContact[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // جلب المضيفين وتحديثهم دوريًا
  useEffect(() => {
    if (user && user.role === "admin") {
      refreshUsersList();
      updateContactsList();
      
      const interval = setInterval(() => {
        refreshUsersList();
        updateContactsList();
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [user]);
  
  // فلترة جهات الاتصال عند تغيير مصطلح البحث
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
  
  // تحديث قائمة المستخدمين من API
  const refreshUsersList = async () => {
    try {
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const users = await response.json();
        storage.saveUsers(users);
        console.log("تم تحديث قائمة المستخدمين:", users.length);
      }
    } catch (error) {
      console.error('Error refreshing users list:', error);
    }
  };
  
  // تحديث قائمة جهات الاتصال مع عدد الرسائل غير المقروءة
  const updateContactsList = () => {
    if (!user) return;
    
    // إضافة طباعة للتحقق من المضيفين الموجودين
    const allUsers = storage.getUsers();
    console.log("إجمالي المستخدمين:", allUsers.length);
    
    const hostUsers = allUsers.filter(u => u.role === 'host');
    console.log("المضيفين:", hostUsers.length);
    
    const contactList: ChatContact[] = [];
    
    if (hostUsers.length === 0) {
      console.log("لا يوجد مضيفين!");
      // إضافة مضيف افتراضي للاختبار إذا لم يكن هناك مضيفين
      if (process.env.NODE_ENV === 'development') {
        // هذا فقط للتطوير - وليس للإنتاج
        console.log("إضافة مضيفين من البيانات الافتراضية");
        
        // سنستمر في استخدام المضيفين الموجودين بالفعل من seed.ts
      }
    }
    
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
    
    console.log("قائمة جهات الاتصال:", contactList.length);
    
    setContacts(contactList);
    setFilteredContacts(contactList);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // الدولة للمضيف المحدد وواجهة المحادثة المفتوحة
  const [selectedHost, setSelectedHost] = useState<UserType | null>(null);
  const [chatMessages, setChatMessages] = useState<FormattedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const handleContactSelect = (contact: UserType) => {
    console.log("تم اختيار المضيف:", contact.username);
    setSelectedHost(contact);
    // إخفاء قائمة جهات الاتصال بعد اختيار جهة اتصال واحدة على الشاشات الصغيرة والمتوسطة
    setShowContactsList(false);
    
    // جلب الرسائل بين المستخدم الحالي والمضيف المحدد
    if (user) {
      const messages = storage.getMessagesByUsers(user.id, contact.id);
      setChatMessages(messages);
      
      // تحديث حالة قراءة الرسائل غير المقروءة
      if (messages.some(msg => !msg.isRead && msg.senderId === contact.id)) {
        storage.updateMessageReadStatus(contact.id, user.id);
        // تحديث القائمة بعد تحديث حالة القراءة
        updateContactsList();
      }
    }
  };
  
  // إرسال رسالة جديدة
  const sendMessage = () => {
    if (!newMessage.trim() || !selectedHost || !user) return;
    
    // إضافة الرسالة الجديدة
    const message = storage.addMessage({
      senderId: user.id,
      receiverId: selectedHost.id,
      content: newMessage,
      contentType: 'text',
      isRead: false
    });
    
    // تحديث واجهة المحادثة
    setChatMessages([...chatMessages, message]);
    setNewMessage('');
    
    // تحديث قائمة جهات الاتصال
    updateContactsList();
    
    // محاكاة استلام الرسالة (تغيير من صح واحد رمادي إلى صحين رماديين)
    setTimeout(() => {
      // في الواقع هذا سيتم على الخادم عند استلام الرسالة
      // هنا نحاكي فقط لأغراض العرض
      const updatedMessages = chatMessages.map(msg => {
        if (msg.id === message.id) {
          return { ...msg, isDelivered: true };
        }
        return msg;
      });
      setChatMessages([...updatedMessages, message]);
    }, 1000);
  };
  
  const formatLastActive = (user: UserType): string => {
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
  
  // إعادة قائمة جهات الاتصال بعد الانتهاء من المحادثة
  const handleBackToContacts = () => {
    setSelectedHost(null);
    setShowContactsList(true);
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
  
  if (!user || user.role !== "admin") return null;
  
  return (
    <div className="h-screen flex flex-col">
      {/* Admin Header */}
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
          <h1 className="text-lg md:text-xl font-bold text-primary">تطبيق الغريب</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {!isMobile ? (
            <Tabs 
              defaultValue="dashboard" 
              className="w-auto"
              value={mainTab}
              onValueChange={setMainTab}
            >
              <TabsList>
                <TabsTrigger value="dashboard" className="flex items-center">
                  <LayoutDashboard className="ml-1 h-4 w-4" />
                  لوحة التحكم
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center">
                  <MessageCircle className="ml-1 h-4 w-4" />
                  المحادثات
                  {contacts.reduce((count, contact) => count + contact.unreadCount, 0) > 0 && (
                    <span className="bg-primary text-white rounded-full text-xs w-5 h-5 flex items-center justify-center mr-1">
                      {contacts.reduce((count, contact) => count + contact.unreadCount, 0)}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
            <>
              <Button 
                variant={mainTab === "dashboard" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setMainTab("dashboard")}
                className="px-2"
              >
                <LayoutDashboard className="h-4 w-4" />
              </Button>
              <Button 
                variant={mainTab === "chat" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setMainTab("chat")}
                className="px-2 relative"
              >
                <MessageCircle className="h-4 w-4" />
                {contacts.reduce((count, contact) => count + contact.unreadCount, 0) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white rounded-full text-xs min-w-4 h-4 flex items-center justify-center">
                    {contacts.reduce((count, contact) => count + contact.unreadCount, 0)}
                  </span>
                )}
              </Button>
            </>
          )}
          
          <Button variant="ghost" size="icon" onClick={() => setLocation('/profile')}>
            <UserIcon className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>
      
      <Tabs 
        value={mainTab} 
        onValueChange={setMainTab}
        className="w-full flex-1 flex flex-col overflow-hidden"
      >
        <TabsContent
          value="dashboard"
          className="flex-1 flex overflow-hidden data-[state=active]:flex data-[state=inactive]:hidden"
        >
          {/* Admin Sidebar */}
          <aside
            className={`
              ${isSidebarOpen ? "block" : "hidden"}
              ${isMobile ? "absolute z-10 w-full h-[calc(100%-64px)]" : "relative"}
              md:block w-full md:w-64 bg-card md:flex flex-col overflow-hidden
            `}
          >
            {/* Admin Profile */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div 
                  className="w-12 h-12 rounded-full bg-primary flex items-center justify-center overflow-hidden cursor-pointer relative group"
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
                  {user.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt="صورة المدير" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="material-icons text-white">admin_panel_settings</span>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">الوكيل (المدير)</h3>
                  <p className="text-xs text-muted-foreground">لوحة التحكم</p>
                </div>
              </div>
            </div>
            
            {/* Admin Navigation */}
            <nav className="p-2">
              <ul>
                <li>
                  <a
                    href="#dashboard"
                    className={`flex items-center space-x-2 space-x-reverse p-3 rounded-lg mb-1 ${
                      activeTab === "dashboard" 
                        ? "bg-muted" 
                        : "hover:bg-muted"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("dashboard");
                      if (isMobile) setIsSidebarOpen(false);
                    }}
                  >
                    <span className="material-icons">dashboard</span>
                    <span>الرئيسية</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#users"
                    className={`flex items-center space-x-2 space-x-reverse p-3 rounded-lg mb-1 ${
                      activeTab === "users" 
                        ? "bg-muted" 
                        : "hover:bg-muted"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("users");
                      if (isMobile) setIsSidebarOpen(false);
                    }}
                  >
                    <span className="material-icons">people</span>
                    <span>إدارة المضيفين</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#broadcast"
                    className={`flex items-center space-x-2 space-x-reverse p-3 rounded-lg mb-1 ${
                      activeTab === "broadcast" 
                        ? "bg-muted" 
                        : "hover:bg-muted"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("broadcast");
                      if (isMobile) setIsSidebarOpen(false);
                    }}
                  >
                    <span className="material-icons">campaign</span>
                    <span>إرسال إعلان</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#financial"
                    className={`flex items-center space-x-2 space-x-reverse p-3 rounded-lg mb-1 ${
                      activeTab === "financial" 
                        ? "bg-muted" 
                        : "hover:bg-muted"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("financial");
                      if (isMobile) setIsSidebarOpen(false);
                    }}
                  >
                    <span className="material-icons">payments</span>
                    <span>الإشعارات المالية</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#chat"
                    className={`flex items-center space-x-2 space-x-reverse p-3 rounded-lg mb-1 ${
                      activeTab === "chat" 
                        ? "bg-muted" 
                        : "hover:bg-muted"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setMainTab("chat");
                    }}
                  >
                    <MessageCircle className="ml-2 h-5 w-5" />
                    <span>إحصائيات المحادثات</span>
                    {contacts.reduce((count, contact) => count + contact.unreadCount, 0) > 0 && (
                      <span className="bg-primary text-white rounded-full text-xs w-5 h-5 flex items-center justify-center mr-1">
                        {contacts.reduce((count, contact) => count + contact.unreadCount, 0)}
                      </span>
                    )}
                  </a>
                </li>
                <li>
                  <a
                    href="#profile"
                    className={`flex items-center space-x-2 space-x-reverse p-3 rounded-lg mb-1 hover:bg-muted`}
                    onClick={(e) => {
                      e.preventDefault();
                      setLocation('/profile');
                    }}
                  >
                    <UserIcon className="h-5 w-5 ml-2" />
                    <span>الملف الشخصي</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#settings"
                    className={`flex items-center space-x-2 space-x-reverse p-3 rounded-lg mb-1 ${
                      activeTab === "settings" 
                        ? "bg-muted" 
                        : "hover:bg-muted"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("settings");
                      if (isMobile) setIsSidebarOpen(false);
                    }}
                  >
                    <span className="material-icons">settings</span>
                    <span>إعدادات</span>
                  </a>
                </li>
              </ul>
            </nav>
            
            <div className="mt-auto p-4 border-t border-border">
              <a
                href="https://wa.me/905378221375"
                className="bg-[#25D366] text-white py-2 px-4 rounded-lg text-sm flex items-center justify-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="material-icons text-sm ml-1">support_agent</span>
                الدعم الفني
              </a>
            </div>
          </aside>
          
          {/* Admin Main Content */}
          <main className="flex-1 flex flex-col bg-background overflow-y-auto">
            {/* Content area */}
            <div className="p-4">
              {activeTab === "dashboard" && (
                <>
                  <h2 className="text-xl font-bold mb-4">لوحة التحكم</h2>
                  <DashboardStats />
                  <BroadcastForm />
                  <HostManagement />
                  <FinancialNotifications />
                </>
              )}
              
              {activeTab === "users" && (
                <>
                  <h2 className="text-xl font-bold mb-4">إدارة المضيفين</h2>
                  <HostManagement />
                </>
              )}
              
              {activeTab === "broadcast" && (
                <>
                  <h2 className="text-xl font-bold mb-4">إرسال إعلان</h2>
                  <BroadcastForm />
                </>
              )}
              
              {activeTab === "financial" && (
                <>
                  <h2 className="text-xl font-bold mb-4">الإشعارات المالية</h2>
                  <FinancialNotifications />
                </>
              )}
              
              {activeTab === "settings" && (
                <div className="bg-card p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold mb-4">إعدادات التطبيق</h2>
                  <p className="text-muted-foreground">
                    يتم تخزين جميع بيانات التطبيق محلياً على المتصفح باستخدام LocalStorage.
                  </p>
                </div>
              )}
            </div>
          </main>
        </TabsContent>
        
        <TabsContent 
          value="chat"
          className="flex-1 flex overflow-hidden data-[state=active]:flex data-[state=inactive]:hidden"
        >
          <div className="flex-1 flex overflow-hidden">
            {/* القسم الجانبي - إحصائيات المحادثات */}
            <div className="hidden md:flex md:w-64 p-2 bg-card">
              <ChatStats />
            </div>
            
            {/* القسم الرئيسي - المحادثة المفتوحة */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {selectedHost ? (
                // واجهة المحادثة مع المضيف المحدد - تملأ الشاشة بالكامل عند إخفاء قائمة جهات الاتصال
                <div className="flex flex-col h-full w-full">
                  {/* رأس المحادثة */}
                  <div className="p-3 bg-card border-b border-border flex items-center justify-between">
                    <div className="flex items-center">
                      <button 
                        className="text-muted-foreground hover:text-foreground ml-2"
                        onClick={handleBackToContacts}
                      >
                        <span className="material-icons">arrow_back</span>
                      </button>
                      <Avatar className="h-10 w-10 ml-3">
                        {selectedHost.profilePicture ? (
                          <AvatarImage src={selectedHost.profilePicture} alt={selectedHost.username} />
                        ) : (
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {selectedHost.firstName?.charAt(0) || selectedHost.username.charAt(0)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <h3 className="font-medium">
                          {selectedHost.firstName && selectedHost.lastName 
                            ? `${selectedHost.firstName} ${selectedHost.lastName}`
                            : selectedHost.username}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {selectedHost.isOnline ? "متصل الآن" : formatLastActive(selectedHost)}
                        </p>
                      </div>
                    </div>
                    
                    {/* قائمة الخيارات (النقاط الثلاث) */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            // عرض نافذة تأكيد الحظر
                            if (window.confirm(`هل أنت متأكد من حظر ${selectedHost.firstName || selectedHost.username}؟`)) {
                              if (user) {
                                // استدعاء دالة الحظر
                                storage.blockUser(user.id, selectedHost.id);
                                toast({
                                  title: "تم الحظر",
                                  description: `تم حظر ${selectedHost.firstName || selectedHost.username} بنجاح.`,
                                });
                                // رجوع إلى قائمة جهات الاتصال
                                handleBackToContacts();
                                // تحديث قائمة جهات الاتصال
                                updateContactsList();
                              }
                            }
                          }}
                        >
                          <Ban className="ml-2 h-4 w-4" />
                          <span>حظر</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            // عرض نافذة تأكيد حذف المحادثة
                            if (window.confirm("هل أنت متأكد من حذف جميع الرسائل؟ لا يمكن التراجع عن هذا الإجراء.")) {
                              // حذف جميع الرسائل بين المستخدم الحالي والمضيف المحدد
                              if (user) {
                                storage.deleteMessagesBetweenUsers(user.id, selectedHost.id);
                                setChatMessages([]);
                                toast({
                                  title: "تم الحذف",
                                  description: "تم حذف جميع الرسائل بنجاح.",
                                });
                              }
                            }
                          }}
                        >
                          <Trash2 className="ml-2 h-4 w-4" />
                          <span>حذف المحادثة</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* محتوى المحادثة */}
                  <div className="flex-1 p-4 overflow-y-auto bg-background">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <p>لا توجد رسائل بعد</p>
                          <p className="text-sm mt-2">ابدأ محادثة مع {selectedHost.firstName || selectedHost.username}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatMessages.map(message => (
                          <div 
                            key={message.id}
                            className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`max-w-[70%] p-3 rounded-lg ${
                                message.senderId === user?.id 
                                  ? 'bg-purple-600 text-white rounded-br-none' 
                                  : 'bg-yellow-400 text-gray-900 rounded-bl-none'
                              }`}
                            >
                              {message.contentType === "text" && (
                                <p dir="auto">{message.content}</p>
                              )}
                              
                              {message.contentType === "image" && message.mediaUrl && (
                                <div className="mb-2">
                                  <img 
                                    src={message.mediaUrl} 
                                    alt="صورة" 
                                    className="max-w-full rounded-lg max-h-[240px] object-contain"
                                    onError={(e) => {
                                      console.error("خطأ في تحميل الصورة:", message.mediaUrl);
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYuNSA3LjVDNi41IDYuMTE5MyA3LjYxOTMgNSA5IDVDMTAuMzgwNyA1IDExLjUgNi4xMTkzIDExLjUgNy41QzExLjUgOC44ODA3IDEwLjM4MDcgMTAgOSAxMEM3LjYxOTMgMTAgNi41IDguODgwNyA2LjUgNy41WiIgZmlsbD0iI2NjYyIgLz4KPHBhdGggZD0iTTIgNkMxLjQ0NzcyIDYgMSA2LjQ0NzcyIDEgN1YxNkMxIDE3LjY1NjkgMi4zNDMxNSAxOSA0IDE5SDE5LjVDMjAuMzI4NCAxOSAyMSAxOC4zMjg0IDIxIDE3LjVWOVYzLjVDMjEgMy4yMjM4NiAyMC43NzYxIDMgMjAuNSAzSDE5IiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTMgN0wyMSAxNSIgc3Ryb2tlPSIjY2NjIiBzdHJva2Utd2lkdGg9IjIiLz4KPHBhdGggZD0iTTYgMTVMMTIgMTBMMTkgMTkiIHN0cm9rZT0iI2NjYyIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPgo=" 
                                      e.currentTarget.alt = "خطأ في تحميل الصورة";
                                    }}
                                  />
                                </div>
                              )}
                              
                              {message.contentType === "video" && message.mediaUrl && (
                                <div className="mb-2">
                                  <video 
                                    src={message.mediaUrl} 
                                    controls 
                                    className="max-w-full rounded-lg max-h-[240px]"
                                  />
                                </div>
                              )}
                              
                              {message.contentType === "audio" && message.mediaUrl && (
                                <div className="mb-2">
                                  <audio 
                                    src={message.mediaUrl} 
                                    controls 
                                    className="max-w-full"
                                  />
                                </div>
                              )}
                              
                              {message.contentType === "financial" && (
                                <div className="bg-background/10 p-2 rounded mb-2">
                                  <p className="font-bold text-sm mb-1">{message.metadata?.title || "إشعار مالي"}</p>
                                  <p dir="auto">{message.content}</p>
                                  <p className="text-sm mt-1">المبلغ: {message.metadata?.amount} $</p>
                                </div>
                              )}
                              
                              {message.contentType === "sticker" && message.mediaUrl && (
                                <div className="flex justify-center mb-2">
                                  <img 
                                    src={message.mediaUrl} 
                                    alt="ملصق" 
                                    className="max-w-[120px] max-h-[120px] object-contain"
                                    onError={(e) => {
                                      console.error("خطأ في تحميل الملصق:", message.mediaUrl);
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUgN0M1IDUuODk1NDMgNS44OTU0MyA1IDcgNUgxN0MxOC4xMDQ2IDUgMTkgNS44OTU0MyAxOSA3VjE3QzE5IDE4LjEwNDYgMTguMTA0NiAxOSAxNyAxOUg3QzUuODk1NDMgMTkgNSAxOC4xMDQ2IDUgMTdWN1oiIGZpbGw9IiNjY2MiLz4KPHBhdGggZD0iTTcgNy42NjY2N0M3IDcuMjk4NDggNy4yOTg0OCA3IDcuNjY2NjcgN0gxMi42NjY3QzEzLjAzNDkgNyAxMy4zMzMzIDcuMjk4NDggMTMuMzMzMyA3LjY2NjY3QzEzLjMzMzMgOC4wMzQ4NiAxMy4wMzQ5IDguMzMzMzMgMTIuNjY2NyA4LjMzMzMzSDcuNjY2NjdDNy4yOTg0OCA4LjMzMzMzIDcgOC4wMzQ4NiA3IDcuNjY2NjdaIiBmaWxsPSIjZGRkIi8+CjxwYXRoIGQ9Ik04LjMzMzMzIDEwLjY2NjdDOC4zMzMzMyAxMC4yOTg1IDguNjMxODEgMTAgOSAxMEgxMUM5LjM2ODE5IDEwIDkuNjY2NjcgMTAuMjk4NSA5LjY2NjY3IDEwLjY2NjdDOS42NjY2NyAxMS4wMzQ5IDkuMzY4MTkgMTEuMzMzMyA5IDExLjMzMzNIOUM4LjYzMTgxIDExLjMzMzMgOC4zMzMzMyAxMS4wMzQ5IDguMzMzMzMgMTAuNjY2N1oiIGZpbGw9IiNkZGQiLz4KPHBhdGggZD0iTTkgMTMuNjY2N0M5IDEzLjI5ODUgOS4yOTg0OCAxMyA5LjY2NjY3IDEzSDEzLjY2NjdDMTQuMDM0OSAxMyAxNC4zMzMzIDEzLjI5ODUgMTQuMzMzMyAxMy42NjY3QzE0LjMzMzMgMTQuMDM0OSAxNC4wMzQ5IDE0LjMzMzMgMTMuNjY2NyAxNC4zMzMzSDkuNjY2NjdDOS4yOTg0OCAxNC4zMzMzIDkgMTQuMDM0OSA5IDEzLjY2NjdaIiBmaWxsPSIjZGRkIi8+CjxwYXRoIGQ9Ik03LjY2NjY3IDE2QzcuMjk4NDggMTYgNyAxNi4yOTg1IDcgMTYuNjY2N0M3IDE3LjAzNDkgNy4yOTg0OCAxNy4zMzMzIDcuNjY2NjcgMTcuMzMzM0gxNy42NjY3QzE4LjAzNDkgMTcuMzMzMyAxOC4zMzMzIDE3LjAzNDkgMTguMzMzMyAxNi42NjY3QzE4LjMzMzMgMTYuMjk4NSAxOC4wMzQ5IDE2IDE3LjY2NjcgMTZINy42NjY2N1oiIGZpbGw9IiNkZGQiLz4KPC9zdmc+Cg==";
                                      e.currentTarget.alt = "خطأ في تحميل الملصق";
                                    }}
                                  />
                                </div>
                              )}
                              
                              <div className={`text-xs mt-1 text-right ${
                                message.senderId === user?.id 
                                  ? 'text-white/80' 
                                  : 'text-gray-900/80'
                              }`}>
                                {format(new Date(message.timestamp), "HH:mm", { locale: arSA })}
                                {message.senderId === user?.id && (
                                  <span className="mr-1" dir="ltr">
                                    {message.isRead ? (
                                      // صحين أزرقين للمقروءة
                                      <span className="text-blue-600">✓✓</span>
                                    ) : message.isDelivered ? (
                                      // صحين رماديين للمستلمة
                                      <span className="text-gray-500">✓✓</span>
                                    ) : (
                                      // صح واحد رمادي للمرسلة
                                      <span className="text-gray-500">✓</span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* حقل إدخال الرسالة */}
                  <div className="p-3 bg-card border-t border-border">
                    <div className="flex flex-col">
                      <div className="flex mb-2">
                        {/* زر إرفاق صورة */}
                        <input
                          type="file"
                          id="image-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                // إرسال الصورة كرسالة
                                if (user && selectedHost && reader.result) {
                                  const mediaUrl = reader.result.toString();
                                  const message = storage.addMessage({
                                    senderId: user.id,
                                    receiverId: selectedHost.id,
                                    contentType: "image",
                                    mediaUrl,
                                    isRead: false,
                                  });
                                  
                                  // إضافة الرسالة إلى المحادثة الحالية
                                  setChatMessages(prev => [...prev, message]);
                                  
                                  // تحديث رسائل المحادثة
                                  updateContactsList();
                                  
                                  // تمرير إلى نهاية المحادثة
                                  setTimeout(() => {
                                    const chatContainer = document.querySelector(".chat-messages");
                                    if (chatContainer) {
                                      chatContainer.scrollTop = chatContainer.scrollHeight;
                                    }
                                  }, 100);
                                }
                              };
                              reader.readAsDataURL(file);
                              // إعادة تعيين قيمة input لإتاحة اختيار نفس الملف مرة أخرى
                              e.target.value = '';
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="px-2"
                          onClick={() => document.getElementById('image-upload')?.click()}
                        >
                          <ImageIcon className="h-5 w-5" />
                        </Button>
                        
                        {/* زر إرسال ملصق */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="px-2">
                              <Smile className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 grid grid-cols-3 gap-2 p-2">
                            {/* قائمة بالملصقات المتاحة - مجرد أمثلة، يمكن تخصيصها */}
                            {[
                              "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f600.svg", // 😀
                              "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f604.svg", // 😄
                              "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f601.svg", // 😁
                              "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f602.svg", // 😂
                              "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f606.svg", // 😆
                              "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f609.svg", // 😉
                              "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f618.svg", // 😘
                              "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f61a.svg", // 😚
                              "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f60e.svg", // 😎
                            ].map((stickerUrl, index) => (
                              <Button
                                key={index}
                                variant="ghost"
                                className="h-12 w-12 p-0"
                                onClick={() => {
                                  // إرسال الملصق كرسالة
                                  if (user && selectedHost) {
                                    const message = storage.addMessage({
                                      senderId: user.id,
                                      receiverId: selectedHost.id,
                                      contentType: "sticker",
                                      mediaUrl: stickerUrl,
                                      isRead: false,
                                    });
                                    
                                    // إضافة الرسالة إلى المحادثة الحالية
                                    setChatMessages(prev => [...prev, message]);
                                    
                                    // تحديث رسائل المحادثة
                                    updateContactsList();
                                    
                                    // تمرير إلى نهاية المحادثة
                                    setTimeout(() => {
                                      const chatContainer = document.querySelector(".chat-messages");
                                      if (chatContainer) {
                                        chatContainer.scrollTop = chatContainer.scrollHeight;
                                      }
                                    }, 100);
                                  }
                                }}
                              >
                                <img src={stickerUrl} alt="ملصق" className="h-8 w-8" />
                              </Button>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="flex">
                        <Input
                          type="text"
                          placeholder="اكتب رسالة..."
                          className="flex-1 ml-2"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                          dir="rtl"
                        />
                        <Button 
                          size="icon" 
                          className="bg-primary text-primary-foreground"
                          onClick={sendMessage}
                        >
                          <span className="material-icons">send</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // عرض رسالة اختيار عندما لا يتم تحديد أي مضيف
                <div className="flex-1 flex items-center justify-center bg-background">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <MessageCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">اختر محادثة</h3>
                    <p className="text-muted-foreground">اختر مضيف من القائمة لبدء محادثة</p>
                    <div className="md:hidden mt-4">
                      <ChatStats />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* القسم الأيمن - الدردشات (يظهر فقط إذا كانت showContactsList صحيحة أو لم يتم تحديد مضيف) */}
            <div className={`w-1/2 md:w-96 border-r border-border bg-card flex flex-col overflow-hidden ${!(showContactsList || !selectedHost) ? 'hidden' : ''}`}>
              <div className="p-4 border-b border-border">
                <h2 className="text-lg font-bold mb-2">الدردشات</h2>
                {/* بحث */}
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
              
              {/* قائمة المضيفين - محتوى قابل للتمرير */}
              <div className="flex-1 overflow-y-auto">
                {/* رسالة في حالة عدم وجود مضيفين */}
                {filteredContacts.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    {searchTerm
                      ? "لا توجد نتائج مطابقة للبحث"
                      : "لا يوجد مضيفين متاحين حالياً"}
                  </div>
                )}
                
                {/* عرض المضيفين */}
                <div className="flex flex-col w-full">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.user.id}
                      className={`p-3 border-b border-border hover:bg-muted cursor-pointer ${
                        selectedHost?.id === contact.user.id ? "bg-muted" : ""
                      }`}
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
                              {contact.user.firstName && contact.user.lastName 
                                ? `${contact.user.firstName} ${contact.user.lastName}`
                                : contact.user.username}
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
