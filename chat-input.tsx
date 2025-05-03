import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Mic, Paperclip, Send, Smile, X } from "lucide-react";
import StickersPicker from "./stickers-picker";

interface ChatInputProps {
  onSendMessage: (content: string, contentType: string, mediaUrl?: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [attachment, setAttachment] = useState<{ type: string; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingTimer = useRef<number | null>(null);
  
  const handleSend = () => {
    if (message.trim() || attachment) {
      if (attachment) {
        onSendMessage(message, attachment.type, attachment.url);
      } else {
        onSendMessage(message, "text");
      }
      setMessage("");
      setAttachment(null);
    }
  };
  
  // دالة للتعامل مع اختيار الملصقات
  const handleStickerSelect = (sticker: string) => {
    onSendMessage(sticker, "sticker");
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
  
  const handleOpenFileSelector = () => {
    fileInputRef.current?.click();
  };
  
  // بدء التسجيل عند الضغط المستمر
  const startRecording = () => {
    setIsRecording(true);
    setRecordingStartTime(Date.now());
    setRecordingDuration(0);
    
    // بدء تايمر لتحديث مدة التسجيل
    recordingTimer.current = window.setInterval(() => {
      if (recordingStartTime) {
        const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
        setRecordingDuration(duration);
      }
    }, 1000);
  };
  
  // إيقاف التسجيل وإرسال الرسالة الصوتية
  const stopRecording = () => {
    if (isRecording) {
      // إيقاف التايمر
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      
      // حساب مدة التسجيل
      const duration = recordingStartTime ? Math.floor((Date.now() - recordingStartTime) / 1000) : 0;
      
      // تجاهل التسجيلات القصيرة جدًا (أقل من نصف ثانية)
      if (duration < 1) {
        setIsRecording(false);
        setRecordingStartTime(null);
        setRecordingDuration(0);
        return;
      }
      
      // في التطبيق الحقيقي، سنقوم بمعالجة الصوت المسجل
      // هنا نقوم بإنشاء معلومات عن التسجيل الصوتي
      const audioMessage = `🎤 رسالة صوتية (${duration} ثانية)`;
      
      // استخدام نوع المحتوى "audio" وإضافة معلومات إضافية
      onSendMessage(audioMessage, "audio", undefined);
      
      // إعادة ضبط حالة التسجيل
      setIsRecording(false);
      setRecordingStartTime(null);
      setRecordingDuration(0);
    }
  };
  
  // عند الضغط على زر الميكروفون
  const handleMicPress = () => {
    startRecording();
  };
  
  // عند رفع الإصبع عن زر الميكروفون
  const handleMicRelease = () => {
    stopRecording();
  };
  
  return (
    <div className="bg-card p-3">
      {attachment && (
        <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
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
      
      <TooltipProvider>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleOpenFileSelector} variant="ghost" size="icon">
                <Paperclip />
              </Button>
            </TooltipTrigger>
            <TooltipContent>إرفاق ملف</TooltipContent>
          </Tooltip>
          
          <div className="flex-1 bg-background rounded-full px-4 py-2 flex items-center">
            <Input 
              type="text" 
              placeholder="اكتب رسالة..." 
              className="bg-transparent border-none focus:outline-none w-full text-sm"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              dir="rtl"
            />
            <StickersPicker onSelectSticker={handleStickerSelect}>
              <Button variant="ghost" size="icon">
                <Smile className="text-muted-foreground" />
              </Button>
            </StickersPicker>
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onMouseDown={handleMicPress}
                onMouseUp={handleMicRelease}
                onMouseLeave={handleMicRelease} // في حالة قام المستخدم بسحب المؤشر خارج الزر
                onTouchStart={handleMicPress} // دعم الهواتف المحمولة
                onTouchEnd={handleMicRelease} // دعم الهواتف المحمولة
                className={isRecording ? "text-red-500" : ""}
              >
                <Mic />
                {isRecording && <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs px-1">{recordingDuration}s</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isRecording ? "حرر للإرسال" : "اضغط للتسجيل"}
            </TooltipContent>
          </Tooltip>
          
          <Button
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
            onClick={handleSend}
            disabled={!message.trim() && !attachment}
          >
            <Send className="text-white h-5 w-5" />
          </Button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      </TooltipProvider>
    </div>
  );
};

export default ChatInput;
