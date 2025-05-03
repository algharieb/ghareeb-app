import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface ImageCropperProps {
  open: boolean;
  onClose: () => void;
  onCropComplete: (croppedImageDataUrl: string) => void;
  imageSrc: string;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  open,
  onClose,
  onCropComplete,
  imageSrc,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const onCropChange = (newCrop: { x: number; y: number }) => {
    setCrop(newCrop);
  };

  const onZoomChange = (newZoom: number[]) => {
    setZoom(newZoom[0]);
  };

  const onRotationChange = (newRotation: number[]) => {
    setRotation(newRotation[0]);
  };

  const onCropCompleteCallback = useCallback(
    (
      croppedArea: any, 
      croppedAreaPx: { x: number; y: number; width: number; height: number }
    ) => {
      setCroppedAreaPixels(croppedAreaPx);
    },
    []
  );

  const getCroppedImage = useCallback(async () => {
    try {
      if (!croppedAreaPixels) return;

      const image = new Image();
      image.src = imageSrc;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      // Set canvas dimensions to cropped area dimensions
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Draw the cropped image
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/jpeg');
      onCropComplete(dataUrl);
      onClose();
    } catch (e) {
      console.error('Error creating cropped image:', e);
    }
  }, [croppedAreaPixels, imageSrc, onCropComplete, onClose]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle>اقتصاص الصورة</DialogTitle>
        <div className="relative h-64 bg-muted mt-4 overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteCallback}
          />
        </div>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">تكبير</span>
              <span className="text-sm text-muted-foreground">{zoom.toFixed(1)}x</span>
            </div>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={onZoomChange}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">تدوير</span>
              <span className="text-sm text-muted-foreground">{rotation}°</span>
            </div>
            <Slider
              value={[rotation]}
              min={0}
              max={360}
              step={1}
              onValueChange={onRotationChange}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
          >
            إلغاء
          </Button>
          <Button
            onClick={getCroppedImage}
          >
            تطبيق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropper;