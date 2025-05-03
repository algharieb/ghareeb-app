import React, { useState, useRef } from "react";
import { storage } from "@/lib/storage";
import { useAuth } from "@/lib/storage";
import { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Paperclip, X } from "lucide-react";

const FinancialNotifications: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hosts, setHosts] = useState<User[]>(
    storage.getUsers().filter(u => u.role === "host")
  );
  const [selectedHost, setSelectedHost] = useState<string>("all");
  const [amount, setAmount] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [attachment, setAttachment] = useState<{ type: string; url: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSendFinancialNotification = () => {
    if (!user || !amount || !details) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال المبلغ والتفاصيل",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const recipientId = selectedHost === "all" ? null : parseInt(selectedHost);
      const amountNumber = parseFloat(amount);
      
      if (isNaN(amountNumber)) {
        throw new Error("المبلغ غير صالح");
      }
      
      storage.sendFinancialNotification(
        user.id,
        recipientId,
        "إشعار حوالة مالية",
        details,
        amountNumber,
        attachment?.url
      );
      
      toast({
        title: "تم الإرسال",
        description: "تم إرسال الإشعار المالي بنجاح",
      });
      
      setAmount("");
      setDetails("");
      setAttachment(null);
    } catch (error) {
      console.error("Financial notification error:", error);
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال الإشعار المالي",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, we would upload the file to a server
      // Here we'll create a local object URL for demo purposes
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith("image/") ? "image" : "file";
      setAttachment({ type, url });
    }
  };
  
  return (
    <div className="bg-card p-4 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-bold mb-3 flex items-center">
        <span className="material-icons ml-1">payments</span>
        إشعارات مالية
      </h3>
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3 mb-3">
          <div className="flex-1">
            <Label className="block text-sm mb-1">المستلم</Label>
            <Select value={selectedHost} onValueChange={setSelectedHost}>
              <SelectTrigger className="w-full bg-background border border-border p-3 rounded-lg focus:outline-none focus:border-primary">
                <SelectValue placeholder="اختر المضيف" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">جميع المضيفين</SelectItem>
                {hosts.map(host => (
                  <SelectItem key={host.id} value={host.id.toString()}>
                    {host.firstName || host.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label className="block text-sm mb-1">المبلغ</Label>
            <Input
              type="number"
              className="w-full bg-background border border-border p-3 rounded-lg focus:outline-none focus:border-primary"
              placeholder="أدخل قيمة المبلغ"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              dir="rtl"
            />
          </div>
        </div>
        
        <div>
          <Label className="block text-sm mb-1">التفاصيل</Label>
          <Textarea
            className="w-full bg-background border border-border p-3 rounded-lg focus:outline-none focus:border-primary"
            placeholder="اكتب تفاصيل الحوالة المالية..."
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            dir="rtl"
          />
        </div>
        
        {attachment && (
          <div className="p-2 bg-muted rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <span className="material-icons ml-2">
                {attachment.type === "image" ? "image" : "attach_file"}
              </span>
              <span className="text-sm truncate">
                {attachment.type === "image" ? "صورة" : "ملف مرفق"}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setAttachment(null)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="mr-2"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={handleSendFinancialNotification}
            disabled={!amount || !details || isLoading}
            className="bg-primary hover:bg-secondary transition-colors py-2 px-4 rounded-lg font-bold mr-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الإرسال...
              </>
            ) : "إرسال إشعار مالي"}
          </Button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
};

export default FinancialNotifications;
