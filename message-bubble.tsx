import React from "react";
import { FormattedMessage, User } from "@/lib/types";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";

interface MessageBubbleProps {
  message: FormattedMessage;
  currentUser: User;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, currentUser }) => {
  const isOwnMessage = message.senderId === currentUser.id;
  const messageTime = message.timestamp 
    ? format(new Date(message.timestamp), "HH:mm", { locale: arSA })
    : "";
  
  const renderMessageContent = () => {
    switch (message.contentType) {
      case "text":
        return <p>{message.content}</p>;
        
      case "image":
        return (
          <div>
            <img 
              src={message.mediaUrl} 
              alt="صورة مرفقة" 
              className="max-w-full h-auto rounded-lg max-h-[240px] object-contain" 
            />
            {message.content && (
              <div className="mt-2">
                <p>{message.content}</p>
              </div>
            )}
          </div>
        );
        
      case "audio":
        return (
          <div className="mb-2">
            <audio 
              src={message.mediaUrl} 
              controls 
              className="max-w-full"
            />
            {message.content && (
              <div className="mt-2">
                <p>{message.content}</p>
              </div>
            )}
          </div>
        );
        
      case "financial":
        return (
          <div className="bg-background/10 p-2 rounded mb-2">
            <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-2">
              <span className="font-bold">{message.metadata?.title || "إشعار مالي"}</span>
              <span className="material-icons">attach_money</span>
            </div>
            <p className="font-bold">المبلغ: ${message.metadata?.amount || 0}</p>
            <p>{message.content}</p>
            <p className="text-xs mt-2">يرجى تأكيد الاستلام.</p>
          </div>
        );
        
      case "sticker":
        return (
          <div className="flex justify-center mb-2">
            <img 
              src={message.mediaUrl} 
              alt="ملصق" 
              className="max-w-[120px] max-h-[120px] object-contain"
            />
          </div>
        );
        
      default:
        return <p>{message.content}</p>;
    }
  };
  
  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[80%]">
        <div className={isOwnMessage ? "bg-purple-600 text-white p-3 rounded-lg rounded-br-none" : "bg-yellow-400 text-gray-900 p-3 rounded-lg rounded-bl-none"}>
          {renderMessageContent()}
        </div>
        <div className={`text-xs ${isOwnMessage ? "ml-2 text-right" : "mr-2"} mt-1 flex items-center ${isOwnMessage ? "justify-end" : "justify-start"}`}>
          <span className="text-muted-foreground">
            {messageTime}
          </span>
          {isOwnMessage && (
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
  );
};

export default MessageBubble;
