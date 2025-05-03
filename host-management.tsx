import React, { useState, useEffect } from "react";
import { storage } from "@/lib/storage";
import { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hashPassword } from "@/lib/encryption";

const HostManagement: React.FC = () => {
  const { toast } = useToast();
  const [hosts, setHosts] = useState<User[]>([]);
  const [hostToDelete, setHostToDelete] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  
  useEffect(() => {
    loadHosts();
  }, []);
  
  const loadHosts = () => {
    const users = storage.getUsers().filter(user => user.role === "host");
    setHosts(users);
  };
  
  const formatLastSeen = (user: User): string => {
    if (user.isOnline) return "الآن";
    
    const lastSeenDate = new Date(user.lastSeen);
    return formatDistanceToNow(lastSeenDate, { 
      locale: arSA, 
      addSuffix: true 
    });
  };
  
  const handleAddHost = () => {
    // This will reset the form data for a new host
    setEditFormData({});
    setIsEditDialogOpen(true);
  };
  
  const handleEditHost = (host: User) => {
    setEditFormData({
      id: host.id,
      username: host.username,
      firstName: host.firstName,
      lastName: host.lastName,
      email: host.email
    });
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteHost = (host: User) => {
    setHostToDelete(host);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteHost = () => {
    if (hostToDelete) {
      storage.deleteUser(hostToDelete.id);
      toast({
        title: "تم الحذف",
        description: `تم حذف المضيف ${hostToDelete.firstName || hostToDelete.username} بنجاح`,
      });
      setIsDeleteDialogOpen(false);
      setHostToDelete(null);
      loadHosts();
    }
  };
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSaveHost = () => {
    try {
      if (editFormData.id) {
        // Update existing host
        const existingHost = storage.getUserById(editFormData.id);
        if (existingHost) {
          const updatedHost = {
            ...existingHost,
            firstName: editFormData.firstName || existingHost.firstName,
            lastName: editFormData.lastName || existingHost.lastName,
            email: editFormData.email || existingHost.email,
            username: editFormData.username || existingHost.username,
            // If password is provided, hash it
            password: editFormData.password 
              ? hashPassword(editFormData.password)
              : existingHost.password
          };
          
          storage.updateUser(updatedHost);
          toast({
            title: "تم التحديث",
            description: `تم تحديث بيانات المضيف ${updatedHost.firstName || updatedHost.username} بنجاح`,
          });
        }
      } else {
        // Create new host
        if (!editFormData.username || !editFormData.password) {
          toast({
            title: "بيانات ناقصة",
            description: "يرجى إدخال اسم المستخدم وكلمة المرور",
            variant: "destructive"
          });
          return;
        }
        
        const currentDate = new Date().toISOString();
        const newHost = storage.addUser({
          username: editFormData.username,
          firstName: editFormData.firstName || undefined,
          lastName: editFormData.lastName || undefined,
          email: editFormData.email || undefined,
          password: hashPassword(editFormData.password),
          role: "host",
          isOnline: false,
          lastSeen: currentDate,
          createdAt: currentDate,
          profilePicture: `https://ui-avatars.com/api/?name=${editFormData.firstName || "Host"}+${editFormData.lastName || ""}&background=7E57C2&color=fff`
        });
        
        toast({
          title: "تم الإضافة",
          description: `تم إضافة المضيف ${newHost.firstName || newHost.username} بنجاح`,
        });
      }
      
      setIsEditDialogOpen(false);
      loadHosts();
    } catch (error) {
      console.error("Host save error:", error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ بيانات المضيف",
        variant: "destructive"
      });
    }
  };
  
  const handleChatWithHost = (host: User) => {
    // توجيه المدير إلى صفحة الدردشة مع المضيف المختار
    // نخزن معلومات المضيف في التخزين المحلي لاستخدامها في صفحة الدردشة
    localStorage.setItem('selectedHostId', host.id.toString());
    
    // انتقال إلى صفحة الدردشة
    window.location.href = '/chat';
  };
  
  return (
    <div className="bg-card p-4 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold flex items-center">
          <span className="material-icons ml-1">people</span>
          إدارة المضيفين
        </h3>
        <Button 
          className="bg-primary hover:bg-secondary transition-colors py-1 px-3 rounded-lg text-sm flex items-center"
          onClick={handleAddHost}
        >
          <span className="material-icons text-sm ml-1">add</span>
          إضافة مضيف
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="py-3 text-right">المضيف</th>
              <th className="py-3 text-right">المعرف</th>
              <th className="py-3 text-right">الحالة</th>
              <th className="py-3 text-right">آخر ظهور</th>
              <th className="py-3 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {hosts.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-muted-foreground">
                  لا يوجد مضيفين. قم بإضافة مضيف جديد.
                </td>
              </tr>
            ) : (
              hosts.map(host => (
                <tr key={host.id} className="border-b border-border hover:bg-background">
                  <td className="py-3 flex items-center">
                    <div className="w-8 h-8 rounded-full bg-muted ml-2 overflow-hidden">
                      {host.profilePicture ? (
                        <img 
                          src={host.profilePicture} 
                          alt={host.firstName || host.username} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="material-icons text-xs flex items-center justify-center h-full">
                          person
                        </span>
                      )}
                    </div>
                    <span>{`${host.firstName || ""} ${host.lastName || ""}`}</span>
                  </td>
                  <td className="py-3">{host.username}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      host.isOnline 
                        ? "bg-green-900/30 text-green-500" 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {host.isOnline ? "نشط" : "غير متصل"}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-muted-foreground">
                    {formatLastSeen(host)}
                  </td>
                  <td className="py-3">
                    <div className="flex space-x-1 space-x-reverse">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-blue-500 hover:text-blue-400"
                        onClick={() => handleChatWithHost(host)}
                      >
                        <span className="material-icons text-sm">chat</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-yellow-500 hover:text-yellow-400"
                        onClick={() => handleEditHost(host)}
                      >
                        <span className="material-icons text-sm">edit</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-400"
                        onClick={() => handleDeleteHost(host)}
                      >
                        <span className="material-icons text-sm">delete</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Edit Host Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>
              {editFormData.id ? "تعديل بيانات المضيف" : "إضافة مضيف جديد"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">الاسم الأول</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={editFormData.firstName || ""}
                  onChange={handleEditFormChange}
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">الاسم الأخير</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={editFormData.lastName || ""}
                  onChange={handleEditFormChange}
                  dir="rtl"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                name="username"
                value={editFormData.username || ""}
                onChange={handleEditFormChange}
                dir="rtl"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={editFormData.email || ""}
                onChange={handleEditFormChange}
                dir="rtl"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">
                {editFormData.id ? "كلمة المرور (اتركها فارغة للإبقاء على كلمة المرور الحالية)" : "كلمة المرور"}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={editFormData.password || ""}
                onChange={handleEditFormChange}
                dir="rtl"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleSaveHost}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا المضيف؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف المضيف {hostToDelete?.firstName || hostToDelete?.username} وجميع بياناته بشكل نهائي.
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteHost}
              className="bg-red-500 hover:bg-red-600"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HostManagement;
