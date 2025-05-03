import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/storage';
import { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { useLocation } from 'wouter';
import { storage } from '@/lib/storage';
import ProfileImageUploader from '@/components/profile/profile-image-uploader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [userData, setUserData] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setUserData({ ...user });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (userData) {
      setUserData({
        ...userData,
        [name]: value,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    setIsSubmitting(true);
    try {
      // تحديث معلومات المستخدم في التخزين
      const updatedUser = storage.updateUser(userData);

      toast({
        title: "تم التحديث",
        description: "تم تحديث الملف الشخصي بنجاح",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الملف الشخصي",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpdate = (updatedUser: User) => {
    setUserData(updatedUser);
  };

  const handleBack = () => {
    if (user?.role === 'admin') {
      setLocation('/admin');
    } else {
      setLocation('/chat');
    }
  };

  if (!user || !userData) return null;

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col">
      <header className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={handleBack} className="ml-2">
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">الملف الشخصي</h1>
      </header>

      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center">
          <CardTitle>إعدادات الملف الشخصي</CardTitle>
          <CardDescription>قم بتعديل معلوماتك الشخصية وصورتك</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-6 flex justify-center">
            <ProfileImageUploader 
              user={userData}
              onImageUpdate={handleImageUpdate}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">الاسم الأول</Label>
              <Input
                id="firstName"
                name="firstName"
                value={userData.firstName || ''}
                onChange={handleInputChange}
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">الاسم الأخير</Label>
              <Input
                id="lastName"
                name="lastName"
                value={userData.lastName || ''}
                onChange={handleInputChange}
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={userData.email || ''}
                onChange={handleInputChange}
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                name="username"
                value={userData.username}
                onChange={handleInputChange}
                dir="rtl"
                disabled
              />
              <p className="text-xs text-muted-foreground">لا يمكن تغيير اسم المستخدم</p>
            </div>
            
            <CardFooter className="px-0 pb-0 pt-4">
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                <Save className="ml-2 h-4 w-4" />
                حفظ التغييرات
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;