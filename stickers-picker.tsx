import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// قائمة الملصقات المنظمة حسب الفئة
const STICKERS = {
  emotions: [
    { id: "emotion-1", url: "😀", label: "وجه مبتسم" },
    { id: "emotion-2", url: "😂", label: "وجه يضحك مع دموع" },
    { id: "emotion-3", url: "😍", label: "وجه مع قلوب" },
    { id: "emotion-4", url: "😎", label: "وجه بنظارات شمسية" },
    { id: "emotion-5", url: "🤔", label: "وجه مفكر" },
    { id: "emotion-6", url: "😊", label: "وجه مبتسم" },
    { id: "emotion-7", url: "🙂", label: "وجه سعيد" },
    { id: "emotion-8", url: "😋", label: "وجه متلذذ" },
  ],
  gestures: [
    { id: "gesture-1", url: "👍", label: "إعجاب" },
    { id: "gesture-2", url: "👎", label: "عدم إعجاب" },
    { id: "gesture-3", url: "👏", label: "تصفيق" },
    { id: "gesture-4", url: "🙏", label: "الرجاء" },
    { id: "gesture-5", url: "💪", label: "قوي" },
    { id: "gesture-6", url: "🤝", label: "مصافحة" },
    { id: "gesture-7", url: "✌️", label: "سلام" },
    { id: "gesture-8", url: "👌", label: "ممتاز" },
  ],
  objects: [
    { id: "object-1", url: "💰", label: "أموال" },
    { id: "object-2", url: "🎁", label: "هدية" },
    { id: "object-3", url: "📱", label: "هاتف" },
    { id: "object-4", url: "💻", label: "حاسوب" },
    { id: "object-5", url: "🎵", label: "موسيقى" },
    { id: "object-6", url: "🎬", label: "سينما" },
    { id: "object-7", url: "📸", label: "كاميرا" },
    { id: "object-8", url: "🚗", label: "سيارة" },
  ],
  symbols: [
    { id: "symbol-1", url: "❤️", label: "قلب" },
    { id: "symbol-2", url: "💯", label: "100" },
    { id: "symbol-3", url: "✅", label: "صح" },
    { id: "symbol-4", url: "❌", label: "خطأ" },
    { id: "symbol-5", url: "⭐", label: "نجمة" },
    { id: "symbol-6", url: "🔥", label: "نار" },
    { id: "symbol-7", url: "💤", label: "نوم" },
    { id: "symbol-8", url: "💫", label: "دوار" },
  ]
};

interface StickersPickerProps {
  onSelectSticker: (sticker: string) => void;
  children: React.ReactNode;
}

const StickersPicker: React.FC<StickersPickerProps> = ({ onSelectSticker, children }) => {
  const [activeTab, setActiveTab] = useState<string>("emotions");

  const handleStickerClick = (sticker: string) => {
    onSelectSticker(sticker);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Tabs defaultValue="emotions" value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-border px-3">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger value="emotions" className="data-[state=active]:bg-muted rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4">
                <span className="text-xl">😀</span>
              </TabsTrigger>
              <TabsTrigger value="gestures" className="data-[state=active]:bg-muted rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4">
                <span className="text-xl">👍</span>
              </TabsTrigger>
              <TabsTrigger value="objects" className="data-[state=active]:bg-muted rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4">
                <span className="text-xl">🎁</span>
              </TabsTrigger>
              <TabsTrigger value="symbols" className="data-[state=active]:bg-muted rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4">
                <span className="text-xl">❤️</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="p-4">
            <TabsContent value="emotions" className="m-0">
              <div className="grid grid-cols-4 gap-2">
                {STICKERS.emotions.map(sticker => (
                  <Button
                    key={sticker.id}
                    variant="ghost"
                    className="h-12 text-2xl hover:bg-muted"
                    onClick={() => handleStickerClick(sticker.url)}
                    title={sticker.label}
                  >
                    {sticker.url}
                  </Button>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="gestures" className="m-0">
              <div className="grid grid-cols-4 gap-2">
                {STICKERS.gestures.map(sticker => (
                  <Button
                    key={sticker.id}
                    variant="ghost"
                    className="h-12 text-2xl hover:bg-muted"
                    onClick={() => handleStickerClick(sticker.url)}
                    title={sticker.label}
                  >
                    {sticker.url}
                  </Button>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="objects" className="m-0">
              <div className="grid grid-cols-4 gap-2">
                {STICKERS.objects.map(sticker => (
                  <Button
                    key={sticker.id}
                    variant="ghost"
                    className="h-12 text-2xl hover:bg-muted"
                    onClick={() => handleStickerClick(sticker.url)}
                    title={sticker.label}
                  >
                    {sticker.url}
                  </Button>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="symbols" className="m-0">
              <div className="grid grid-cols-4 gap-2">
                {STICKERS.symbols.map(sticker => (
                  <Button
                    key={sticker.id}
                    variant="ghost"
                    className="h-12 text-2xl hover:bg-muted"
                    onClick={() => handleStickerClick(sticker.url)}
                    title={sticker.label}
                  >
                    {sticker.url}
                  </Button>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

export default StickersPicker;