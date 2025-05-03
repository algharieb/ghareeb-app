import React, { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Login: React.FC = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم المستخدم وكلمة المرور",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const user = await login(username, password);
      
      if (!user) {
        toast({
          title: "فشل تسجيل الدخول",
          description: "اسم المستخدم أو كلمة المرور غير صحيحة",
          variant: "destructive",
        });
      } else {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً بك ${user.firstName || user.username}`,
        });
        
        // توجيه المستخدم إلى الصفحة المناسبة
        if (user.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/chat";
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "خطأ في تسجيل الدخول",
        description: "حدث خطأ أثناء محاولة تسجيل الدخول، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Login Header */}
      <div className="bg-card py-6 px-4 text-center">
        <h1 className="text-2xl font-bold text-primary">تطبيق الغريب</h1>
        <p className="text-sm opacity-75">منصة التواصل الخاصة بالمضيفين</p>
      </div>
      
      {/* Login Form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-8 max-w-md mx-auto w-full">
        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="text-center mb-8">
              <div className="w-24 h-24 rounded-full bg-primary mx-auto flex items-center justify-center">
                <span className="material-icons text-4xl">person</span>
              </div>
              <h2 className="mt-4 text-xl">تسجيل الدخول</h2>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">اسم المستخدم</label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-background border border-border p-3 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="أدخل اسم المستخدم أو المعرف"
                  dir="rtl"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1">كلمة المرور</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-border p-3 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="أدخل كلمة المرور"
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
                    جاري تسجيل الدخول...
                  </>
                ) : "دخول"}
              </Button>
              
              <div className="text-center mt-4">
                <p className="text-sm">
                  ليس لديك حساب؟ 
                  <Link href="/signup" className="text-primary hover:underline mr-1">
                    إنشاء حساب جديد
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

export default Login;
