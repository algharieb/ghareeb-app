import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera } from 'lucide-react';
import { ImageCropper } from './image-cropper';
import { User } from '@/lib/types';
import { storage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface ProfileImageUploaderProps {
  user: User;
  onImageUpdate: (updatedUser: User) => void;
}

export const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({
  user,
  onImageUpdate,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImage(reader.result);
        setIsCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);

    // إعادة تعيين قيمة input لإتاحة اختيار نفس الملف مرة أخرى
    e.target.value = '';
  };

  const handleCropComplete = (croppedImageDataUrl: string) => {
    setIsUploading(true);

    try {
      // هنا نقوم بتحديث الصورة الشخصية للمستخدم في التخزين
      const updatedUser = storage.updateUser({
        ...user,
        profilePicture: croppedImageDataUrl,
      });

      onImageUpdate(updatedUser);

      toast({
        title: "تم تحديث الصورة",
        description: "تم تحديث صورتك الشخصية بنجاح",
      });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الصورة الشخصية",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getUserInitial = () => {
    return user.firstName?.charAt(0) || user.username.charAt(0);
  };

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative group">
        <Avatar className="h-24 w-24 mb-4">
          {user.profilePicture ? (
            <AvatarImage src={user.profilePicture} alt={user.username} />
          ) : (
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {getUserInitial()}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-30 rounded-full">
          <label 
            htmlFor="profile-image-upload" 
            className="w-full h-full flex items-center justify-center cursor-pointer"
          >
            <Camera className="h-8 w-8 text-white" />
            <span className="sr-only">تغيير الصورة الشخصية</span>
          </label>
          <input
            type="file"
            id="profile-image-upload"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>
      </div>

      {selectedImage && (
        <ImageCropper
          open={isCropperOpen}
          onClose={() => setIsCropperOpen(false)}
          onCropComplete={handleCropComplete}
          imageSrc={selectedImage}
        />
      )}
    </div>
  );
};

export default ProfileImageUploader;