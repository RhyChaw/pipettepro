'use client';

import { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../utils/firebaseConfig';
import ImageCropper from '../components/ImageCropper';

export default function ProfilePage() {
  const { user, userProfile, updateUserProfile, loading } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.profilePictureUrl) {
      const url = userProfile.profilePictureUrl;
      console.log('Setting profile image URL from userProfile:', url);
      
      // Check if the URL points to a HEIC file (won't display in browsers)
      if (url.includes('.heic') || url.includes('.heif') || url.toLowerCase().includes('heic')) {
        console.warn('Profile picture is HEIC format, which browsers cannot display');
        setUploadError('Your current profile picture is in HEIC format, which browsers cannot display. Please upload a new image in JPEG or PNG format.');
        setProfileImageUrl(null);
      } else {
        setProfileImageUrl(url);
      }
    } else {
      setProfileImageUrl(null);
    }
  }, [userProfile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.email) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file');
      return;
    }

    // Check for unsupported formats (HEIC, HEIF)
    const fileName = file.name.toLowerCase();
    const unsupportedFormats = ['.heic', '.heif'];
    const isUnsupported = unsupportedFormats.some(format => fileName.endsWith(format));
    
    if (isUnsupported || file.type === 'image/heic' || file.type === 'image/heif') {
      setUploadError('HEIC/HEIF format is not supported. Please convert your image to JPEG or PNG before uploading.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB');
      return;
    }

    // Read file and show cropper
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageToCrop(result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCroppedImage = async (croppedBlob: Blob) => {
    if (!user?.email) return;

    try {
      setUploading(true);
      setUploadError('');
      setUploadSuccess(false);
      setShowCropper(false);

      // Create a reference to the file in Firebase Storage
      const sanitizedEmail = user.email.replace(/[@.]/g, '_');
      const storageRef = ref(storage, `profiles/${sanitizedEmail}`);
      
      // Upload the cropped image
      await uploadBytes(storageRef, croppedBlob, {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000',
      });
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update Firestore with the new profile picture URL
      await updateDoc(doc(db, 'students', user.email), {
        profilePictureUrl: downloadURL,
      });
      
      // Update local state
      setProfileImageUrl(downloadURL);
      await updateUserProfile({
        profilePictureUrl: downloadURL,
      });
      
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadError(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      setImageToCrop(null);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-slate-700 text-xl">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !userProfile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-slate-700 text-xl">Please sign in to view your profile</div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate highest level (default to 1 if not set)
  const highestLevel = userProfile.highestLevel || 1;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-xl p-8 shadow-md border border-slate-200">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Profile Picture Section - Column Layout */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div 
                  onClick={handleImageClick}
                  className="relative w-32 h-32 rounded-full overflow-hidden cursor-pointer border-4 border-slate-300 shadow-lg hover:border-blue-500 transition-all duration-300 hover:scale-105 bg-slate-200"
                >
                  {profileImageUrl ? (
                    <>
                      <img
                        src={profileImageUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Image failed to load:', profileImageUrl);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          // Show fallback
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'w-full h-full flex items-center justify-center absolute inset-0 bg-slate-200 text-slate-500 text-4xl font-medium';
                            fallback.textContent = userProfile?.name?.charAt(0).toUpperCase() || 'U';
                            parent.appendChild(fallback);
                          }
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', profileImageUrl);
                        }}
                      />
                      {/* Fallback that shows if image fails */}
                      <div className="w-full h-full flex items-center justify-center absolute inset-0 pointer-events-none bg-slate-200 text-slate-500 text-4xl font-medium" style={{ display: profileImageUrl ? 'none' : 'flex' }}>
                        {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-500 text-4xl font-medium">
                      {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none z-10">
                    <span className="text-white font-semibold text-sm">Click to upload</span>
                  </div>
                </div>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {uploadSuccess && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold animate-fade-in">
                    ✓ Uploaded!
                  </div>
                )}
              </div>
              
              {/* Upload/Edit Button - Below Profile Picture in Column */}
              <div className="flex flex-col gap-2 mt-4">
                {profileImageUrl ? (
                  <>
                    <button
                      onClick={() => {
                        setImageToCrop(profileImageUrl);
                        setShowCropper(true);
                      }}
                      className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors text-sm"
                    >
                      Edit Picture
                    </button>
                    <button
                      onClick={handleImageClick}
                      className="px-6 py-2 bg-white border-2 border-slate-300 text-slate-900 font-medium rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors text-sm"
                    >
                      Upload New Picture
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleImageClick}
                    className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors text-sm"
                  >
                    Upload Picture
                  </button>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
                {userProfile.name || 'User'}
              </h1>
              <p className="text-xl text-slate-600 mb-6">{user?.email}</p>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pipette Experience */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 mb-1">Pipette Experience</p>
                  <p className="text-xl font-bold text-slate-900">
                    {userProfile['pipette experience'] || 'Not set'}
                  </p>
                </div>

                {/* Highest Level */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 mb-1">Highest Level</p>
                  <p className="text-xl font-bold text-blue-600">Level {highestLevel}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Error Message */}
          {uploadError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">
              {uploadError}
            </div>
          )}
        </div>

        {/* Profile Details Card */}
        <div className="bg-white rounded-xl p-8 shadow-md border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Profile Information</h2>
          
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-slate-700 font-semibold mb-2 text-lg">Name</label>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-slate-900 text-xl">{userProfile.name || 'Not set'}</p>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-slate-700 font-semibold mb-2 text-lg">Email</label>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-slate-900 text-xl">{user?.email}</p>
              </div>
            </div>

            {/* Pipette Experience */}
            <div>
              <label className="block text-slate-700 font-semibold mb-2 text-lg">Pipette Experience</label>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-slate-900 text-xl">{userProfile['pipette experience'] || 'Not set'}</p>
              </div>
            </div>

            {/* Highest Level */}
            <div>
              <label className="block text-slate-700 font-semibold mb-2 text-lg">Highest Level Achieved</label>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center border-2 border-blue-700">
                    <span className="text-2xl font-bold text-white">{highestLevel}</span>
                  </div>
                  <div>
                    <p className="text-slate-900 text-xl font-bold">Level {highestLevel}</p>
                    <p className="text-slate-600 text-sm">Keep practicing to level up!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Instructions */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h3 className="text-slate-900 font-semibold mb-2">Profile Picture</h3>
          <p className="text-slate-700 text-sm">
            Click on your profile picture or use the button above to upload a new image. Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB.
            <br />
            <span className="text-amber-700 text-xs mt-2 block">
              Note: HEIC/HEIF files are not supported. Please convert to JPEG or PNG first.
            </span>
          </p>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {showCropper && imageToCrop && (
        <ImageCropper
          imageSrc={imageToCrop}
          onCrop={handleCroppedImage}
          onCancel={() => {
            setShowCropper(false);
            setImageToCrop(null);
          }}
          aspectRatio={1}
        />
      )}
    </DashboardLayout>
  );
}
