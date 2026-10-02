'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, Image as ImageIcon, X, Loader2, Link2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { uploadClinicImage, type StorageCategory } from '@/actions/storage';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  category?: StorageCategory;
  label?: string;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  category = 'products',
  label = 'Image',
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be under 10MB');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Uploading image to Cloudinary...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const res = await uploadClinicImage(formData);

      if (res.success && res.url) {
        onChange(res.url);
        toast.success(
          res.provider === 'cloudinary'
            ? 'Uploaded to Cloudinary successfully!'
            : 'Image uploaded successfully!',
          { id: toastId }
        );
      } else {
        toast.error(res.error || 'Failed to upload image', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error uploading file', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {label}
        </Label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 cursor-pointer font-medium"
        >
          <Link2 className="h-3 w-3" />
          {showUrlInput ? 'Hide link field' : 'Or paste URL'}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {value ? (
        /* Image Preview Box */
        <div className="relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-card p-2 flex items-center gap-3">
          <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 border border-gray-200 dark:border-gray-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Uploaded preview"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
              Image uploaded
            </p>
            <p className="text-[10px] text-gray-400 font-mono truncate max-w-xs">{value}</p>
            <div className="flex items-center gap-2 mt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="h-6 px-2 text-[11px] rounded-lg"
              >
                {isUploading ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <UploadCloud className="h-3 w-3 mr-1" />
                )}
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange('')}
                className="h-6 px-2 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
              >
                <X className="h-3 w-3 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Dropzone / Upload Box */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            'group relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center',
            isDragging
              ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
              : 'border-gray-200 dark:border-gray-800 hover:border-rose-400 bg-gray-50/40 hover:bg-rose-50/20 dark:bg-card',
            isUploading && 'pointer-events-none opacity-60'
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center py-2">
              <Loader2 className="h-7 w-7 text-rose-600 animate-spin mb-1.5" />
              <p className="text-xs font-semibold text-rose-600">Uploading to Cloudinary...</p>
              <p className="text-[10px] text-gray-400">Optimizing and storing image</p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-1">
              <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <UploadCloud className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                Click to upload picture from computer or phone
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                PNG, JPG, or WebP up to 10MB (Cloudinary automatic)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Optional Direct URL Input */}
      {showUrlInput && (
        <div className="pt-1.5">
          <Input
            type="url"
            placeholder="https://res.cloudinary.com/... or image link"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 text-xs font-mono"
          />
        </div>
      )}
    </div>
  );
}
