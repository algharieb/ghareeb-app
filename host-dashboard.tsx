import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/storage";
import { storage } from "@/lib/storage";
import { User, Notification } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, MessageCircle, User as UserIcon, Bell, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hashPassword } from "@/lib/encryption";

const HostDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const isMobile = useMobile();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    password: "",
    confirmPassword: "",
  });
  
  useEffect(() => {
    if (user) {
      const userNotifications = storage.getNotifications().filter(
        n => n.userId === user.id || n.userId === 0
      );
      setNotifications(userNotifications);
      
      const unread = userNotifications.filter(n => !n.isRead).length;
      setUnreadNotifications(unread);
    }
  }, [user]);
  
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
  
  const formatNotificationTime = (timestamp: string): string => {
    const notificationDate = new Date(timestamp);
    return formatDistanceToNow(notificationDate, { 
      locale: arSA, 
      addSuffix: true 
    });
  };
  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSaveProfile = () => {
    if (!user) return;
    
    // تحقق من تطابق كلمات المرور إذا تم إدخالها
    if (profileData.password && profileData.password !== profileData.confirmPassword) {
      toast({
        title: "خطأ في كلمة المرور",
        description: "كلمات المرور غير متطابقة",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const updatedUser = {
        ...user,
        firstName: profileData.firstName || user.firstName,
        lastName: profileData.lastName || user.lastName,
        email: profileData.email || user.email,
        // تحديث كلمة المرور فقط إذا تم إدخالها
        password: profileData.password 
          ? hashPassword(profileData.password)
          : user.password
      };
      
      storage.updateUser(updatedUser);
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات الملف الشخصي بنجاح",
      });
      
      setIsEditProfileOpen(false);
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث البيانات",
        variant: "destructive"
      });
    }
  };
  
  const handleOpenChat = () => {
    window.location.href = '/chat';
  };
  
  const markAllNotificationsAsRead = () => {
    if (!user) return;
    
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      isRead: true
    }));
    
    storage.saveNotifications(updatedNotifications);
    setNotifications(updatedNotifications);
    setUnreadNotifications(0);
    
    toast({
      title: "تم التحديث",
      description: "تم تحديث جميع الإشعارات كمقروءة",
    });
  };
  
  if (!user || user.role !== "host") return null;
  
  return (
    <div className="h-screen flex flex-col">
      {/* Host Header */}
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
          <h1 className="text-xl font-bold text-primary">تطبيق الغريب - لوحة المضيف</h1>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => setActiveTab("notifications")}
          >
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Host Sidebar */}
        <aside
          className={`
            ${isSidebarOpen ? "block" : "hidden"}
            ${isMobile ? "absolute z-10 w-full h-[calc(100%-64px)]" : "relative"}
            md:block w-full md:w-64 bg-card md:flex flex-col overflow-hidden
          `}
        >
          {/* Host Profile */}
          <div className="p-4 border-b border-border flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center overflow-hidden">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={`${user.firstName || user.username}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="h-6 w-6 text-white" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold">{`${user.firstName || ""} ${user.lastName || ""}`}</h3>
              <p className="text-xs opacity-75">{user.username}</p>
            </div>
          </div>
          
          {/* Host Navigation */}
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
                  <UserIcon className="ml-2 h-5 w-5" />
                  <span>الملف الشخصي</span>
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
                    setActiveTab("chat");
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                >
                  <MessageCircle className="ml-2 h-5 w-5" />
                  <span>المحادثات</span>
                </a>
              </li>
              <li>
                <a
                  href="#notifications"
                  className={`flex items-center space-x-2 space-x-reverse p-3 rounded-lg mb-1 ${
                    activeTab === "notifications" 
                      ? "bg-muted" 
                      : "hover:bg-muted"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("notifications");
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                >
                  <Bell className="ml-2 h-5 w-5" />
                  <span>الإشعارات</span>
                  {unreadNotifications > 0 && (
                    <span className="mr-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {unreadNotifications}
                    </span>
                  )}
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
                  <Settings className="ml-2 h-5 w-5" />
                  <span>الإعدادات</span>
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
        
        {/* Host Main Content */}
        <main className="flex-1 flex flex-col bg-background overflow-y-auto">
          {/* Content area */}
          <div className="p-4">
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="bg-card p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">الملف الشخصي</h2>
                    <Button 
                      onClick={() => setIsEditProfileOpen(true)}
                      className="bg-primary hover:bg-secondary transition-colors"
                    >
                      تعديل الملف الشخصي
                    </Button>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 mx-auto rounded-full bg-muted overflow-hidden">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={`${user.firstName || user.username}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <UserIcon className="h-16 w-16 text-primary" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">{`${user.firstName || ""} ${user.lastName || ""}`}</h3>
                        <p className="text-muted-foreground">{user.username}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                          <p>{user.email || "غير محدد"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">الدور</p>
                          <p>مضيف</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">الحالة</p>
                          <div className="flex items-center">
                            <span className={`w-2 h-2 rounded-full ${user.isOnline ? "bg-green-500" : "bg-gray-400"} ml-2`}></span>
                            <span>{user.isOnline ? "متصل" : "غير متصل"}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">تاريخ الانضمام</p>
                          <p>{new Date(user.createdAt).toLocaleDateString("ar-SA")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold mb-4">إحصائيات سريعة</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">الإشعارات</p>
                      <p className="text-2xl font-bold">{notifications.length}</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">غير مقروءة</p>
                      <p className="text-2xl font-bold">{unreadNotifications}</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">آخر تسجيل دخول</p>
                      <p className="text-2xl font-bold">{new Date(user.lastSeen).toLocaleDateString("ar-SA")}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === "chat" && (
              <div className="bg-card p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">المحادثات</h2>
                <p className="text-muted-foreground mb-4">
                  يمكنك التواصل مع المدير وباقي المضيفين من خلال المحادثات.
                </p>
                <Button 
                  onClick={handleOpenChat}
                  className="bg-primary hover:bg-secondary transition-colors"
                >
                  <MessageCircle className="ml-2 h-5 w-5" />
                  فتح المحادثات
                </Button>
              </div>
            )}
            
            {activeTab === "notifications" && (
              <div className="bg-card p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">الإشعارات</h2>
                  {unreadNotifications > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={markAllNotificationsAsRead}
                    >
                      تحديد الكل كمقروء
                    </Button>
                  )}
                </div>
                
                {notifications.length === 0 ? (
                  <div className="text-center py-10">
                    <Bell className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">لا توجد إشعارات</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map(notification => (
                        <div 
                          key={notification.id} 
                          className={`p-4 rounded-lg ${notification.isRead ? "bg-muted" : "bg-primary/10 border border-primary/20"}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold">{notification.title}</h3>
                              <p className="text-sm mt-1">{notification.content}</p>
                              
                              {notification.type === "financial" && notification.metadata && (
                                <div className="mt-2 p-2 bg-muted rounded border border-border">
                                  <p className="font-bold">المبلغ: {notification.metadata.amount} دولار</p>
                                  {notification.metadata.attachmentUrl && (
                                    <a 
                                      href={notification.metadata.attachmentUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-primary block mt-1"
                                    >
                                      عرض المرفق
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatNotificationTime(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === "settings" && (
              <div className="bg-card p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">الإعدادات</h2>
                <p className="text-muted-foreground">
                  يتم تخزين جميع بيانات التطبيق محلياً على المتصفح باستخدام LocalStorage.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>تعديل الملف الشخصي</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">الاسم الأول</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleProfileChange}
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">الاسم الأخير</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleProfileChange}
                  dir="rtl"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={profileData.email}
                onChange={handleProfileChange}
                dir="rtl"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور الجديدة (اتركها فارغة للإبقاء على كلمة المرور الحالية)</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={profileData.password}
                onChange={handleProfileChange}
                dir="rtl"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={profileData.confirmPassword}
                onChange={handleProfileChange}
                dir="rtl"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditProfileOpen(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleSaveProfile}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HostDashboard;