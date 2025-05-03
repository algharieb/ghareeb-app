import React, { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Signup: React.FC = () => {
  const { register } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // يقرأ الملف كـ Data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.username || !formData.password) {
      toast({
        title: "حقول مطلوبة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "كلمات المرور غير متطابقة",
        description: "يرجى التأكد من تطابق كلمات المرور",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.password.length < 6) {
      toast({
        title: "كلمة المرور قصيرة",
        description: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // استخدام الصورة التي تم تحميلها أو استخدام الصورة الافتراضية
      const profilePicture = profileImage || 
        `https://ui-avatars.com/api/?name=${formData.firstName}+${formData.lastName}&background=7E57C2&color=fff`;
      
      const newUser = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email || undefined,
        password: formData.password,
        role: "host",
        isOnline: true,
        profilePicture: profilePicture
      });
      
      if (newUser) {
        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: `مرحباً بك ${newUser.firstName || newUser.username}`,
        });
        
        // توجيه المستخدم مباشرة إلى صفحة الدردشة
        window.location.href = "/chat";
      } else {
        toast({
          title: "فشل إنشاء الحساب",
          description: "ربما يكون اسم المستخدم مستخدماً بالفعل",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "خطأ في التسجيل",
        description: "حدث خطأ أثناء محاولة إنشاء الحساب، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Signup Header */}
      <div className="bg-card py-6 px-4 text-center">
        <h1 className="text-2xl font-bold text-primary">تطبيق الغريب</h1>
        <p className="text-sm opacity-75">إنشاء حساب مضيف جديد</p>
      </div>
      
      {/* Signup Form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-8 max-w-md mx-auto w-full">
        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div 
                className="w-24 h-24 rounded-full mx-auto relative cursor-pointer group"
                onClick={triggerFileInput}
              >
                {profileImage ? (
                  <Avatar className="w-full h-full">
                    <AvatarImage src={profileImage} alt="Profile Picture" className="object-cover" />
                    <AvatarFallback className="bg-secondary">
                      {formData.firstName?.charAt(0)}{formData.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
              <h2 className="mt-4 text-xl">إنشاء حساب جديد</h2>
              <p className="text-sm text-muted-foreground mt-1">اضغط على الدائرة لإضافة صورة شخصية</p>
            </div>
            
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm mb-1">الاسم الأول</label>
                  <Input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full bg-background border border-border p-3 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="الاسم الأول"
                    dir="rtl"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm mb-1">الاسم الأخير</label>
                  <Input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full bg-background border border-border p-3 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="الاسم الأخير"
                    dir="rtl"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm mb-1">اسم المستخدم</label>
                <Input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-background border border-border p-3 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="أدخل اسم المستخدم المرغوب"
                  dir="rtl"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1">البريد الإلكتروني</label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-background border border-border p-3 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="أدخل بريدك الإلكتروني"
                  dir="rtl"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1">كلمة المرور</label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-background border border-border p-3 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="أدخل كلمة المرور"
                  dir="rtl"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1">تأكيد كلمة المرور</label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-background border border-border p-3 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="أدخل كلمة المرور مرة أخرى"
                  dir="rtl"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-secondary transition-colors py-3 rounded-lg font-bold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري إنشاء الحساب...
                  </>
                ) : "إنشاء الحساب"}
              </Button>
              
              <div className="text-center mt-4">
                <p className="text-sm">
                  لديك حساب بالفعل؟ 
                  <Link href="/" className="text-primary hover:underline mr-1">
                    تسجيل الدخول
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      
      {/* Footer */}
      <div className="bg-card py-4 text-center text-sm opacity-75">
        جميع الحقوق محفوظة &copy; {new Date().getFullYear()} تطبيق الغريب
      </div>
    </div>
  );
};

export default Signup;
