import React, { useState, useRef } from "react";
import { storage } from "@/lib/storage";
import { useAuth } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Paperclip, X } from "lucide-react";

const BroadcastForm: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<{ type: string; url: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleBroadcast = () => {
    if (!user || !message.trim()) return;
    
    setIsLoading(true);
    
    try {
      storage.broadcastMessage(
        user.id,
        message,
        attachment?.type || "text",
        attachment?.url
      );
      
      toast({
        title: "تم الإرسال",
        description: "تم إرسال الإعلان العام بنجاح لجميع المضيفين",
      });
      
      setMessage("");
      setAttachment(null);
    } catch (error) {
      console.error("Broadcast error:", error);
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال الإعلان",
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
        <span className="material-icons ml-1">campaign</span>
        إرسال إعلان عام
      </h3>
      <div className="space-y-3">
        <Textarea 
          className="w-full bg-background border border-border p-3 rounded-lg focus:outline-none focus:border-primary"
          placeholder="اكتب نص الإعلان هنا..."
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          dir="rtl"
        />
        
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
            onClick={handleBroadcast}
            disabled={!message.trim() || isLoading}
            className="bg-primary hover:bg-secondary transition-colors py-2 px-4 rounded-lg font-bold mr-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الإرسال...
              </>
            ) : "إرسال للجميع"}
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

export default BroadcastForm;
