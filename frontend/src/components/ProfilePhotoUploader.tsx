import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadProfilePhoto, deleteProfilePhoto } from '../lib/api';
import toast from 'react-hot-toast';
import Button from './ui/Button';

interface ProfilePhotoUploaderProps {
  profilePhotoUrl?: string;
  userName: string;
}

export default function ProfilePhotoUploader({ profilePhotoUrl, userName }: ProfilePhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: uploadProfilePhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['student-requests'] });
      toast.success('Profile photo uploaded successfully!');
      setIsUploading(false);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload photo');
      setIsUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfilePhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['student-requests'] });
      toast.success('Profile photo removed successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove photo');
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    setIsUploading(true);
    uploadMutation.mutate(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const getInitials = () => {
    return userName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const displayUrl = previewUrl || (profilePhotoUrl ? `http://localhost:3000${profilePhotoUrl}` : null);

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={userName}
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
            {getInitials()}
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      <div className="flex flex-col space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          onClick={handleUploadClick}
          disabled={isUploading}
          variant="outline"
          className="text-sm"
        >
          {profilePhotoUrl ? 'Change Photo' : 'Upload Photo'}
        </Button>
        {profilePhotoUrl && (
          <Button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            variant="outline"
            className="text-sm text-red-600 hover:text-red-700"
          >
            Remove Photo
          </Button>
        )}
      </div>
    </div>
  );
}
