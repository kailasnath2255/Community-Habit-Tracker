'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Check, AlertCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { uploadCompletionImage } from '@/app/actions/storage';

interface ImageUploadModalProps {
  habitLogId: string;
  userId: string;
  habitName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ImageUploadModal({
  habitLogId,
  userId,
  habitName,
  isOpen,
  onClose,
  onSuccess,
}: ImageUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setUploadError(null);

    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP, GIF)');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setUploadError('Image must be less than 10MB');
      return;
    }

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !preview) return;

    try {
      setIsUploading(true);
      setUploadError(null);

      console.log('Starting upload for:', { habitLogId, userId, fileSize: file.size, fileType: file.type });

      const result = await uploadCompletionImage(habitLogId, preview, userId);

      if (result.success) {
        toast.success('Image uploaded! 🎉');
        setFile(null);
        setPreview(null);
        onSuccess?.();
        setTimeout(() => onClose(), 1000);
      } else {
        const errorMsg = result.error || 'Failed to upload image';
        console.error('Upload error:', errorMsg);
        setUploadError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Upload failed - please try again';
      console.error('Upload exception:', error);
      setUploadError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkip = () => {
    setFile(null);
    setPreview(null);
    setUploadError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleSkip}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Great! 🎉</h2>
              <p className="text-muted-foreground text-sm mt-1">
                You completed <strong>{habitName}</strong>
              </p>
            </div>

            {/* Upload Area */}
            {!preview ? (
              <div className="mb-6">
                <label className="block">
                  <div className="border-2 border-dashed border-white/20 hover:border-primary/50 rounded-xl p-8 text-center cursor-pointer transition bg-white/5 hover:bg-white/10">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                      className="hidden"
                    />
                    <Upload className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="font-medium text-white mb-1">Add a photo (optional)</p>
                    <p className="text-xs text-muted-foreground">
                      Drag or click to select • Max 10MB
                    </p>
                  </div>
                </label>

                {uploadError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-sm text-red-400"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{uploadError}</span>
                  </motion.div>
                )}
              </div>
            ) : (
              /* Preview */
              <div className="mb-6">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-3 border border-white/10">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>

                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    setUploadError(null);
                  }}
                  className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition"
                >
                  Choose different image
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {preview ? (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/50 transition font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Share Photo
                    </>
                  )}
                </motion.button>
              ) : (
                <button
                  onClick={handleSkip}
                  className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/50 transition font-medium text-white flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Skip for now
                </button>
              )}
            </div>

            {/* Footer */}
            <p className="text-xs text-muted-foreground text-center mt-4">
              {preview
                ? 'Your photo will appear on the community feed'
                : 'You can add a photo to share your progress'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
