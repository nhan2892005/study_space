"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function CreatePost() {
  const { data: session } = useSession();
  const router = useRouter();

  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // Validate file size and type
      const validFiles = filesArray.filter(file => {
        const maxSize = 10 * 1024 * 1024; // 10MB for images
        if (file.size > maxSize) {
          toast.error(`Image ${file.name} is too large (max 10MB)`);
          return false;
        }
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not a valid image file`);
          return false;
        }
        return true;
      });

      setImages((prev) => [...prev, ...validFiles]);

      // Create preview URLs
      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviewUrls((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) {
      toast.error("Please add some content or images");
      return;
    }

    setIsSubmitting(true);
    try {
      // First, upload images to Cloudinary if any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((image) => formData.append("files", image));

        const uploadResponse = await fetch("/api/uploads/cloudinary", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || "Failed to upload images");
        }

        const uploadResult = await uploadResponse.json();
        
        // The updated API returns both urls array and files array with detailed info
        imageUrls = uploadResult.urls || [];
        
        if (!imageUrls || imageUrls.length === 0) {
          throw new Error("No image URLs returned from upload");
        }

        toast.success(`Successfully uploaded ${imageUrls.length} image(s)`);
      }

      // Then create the post with image URLs
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          images: imageUrls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create post");
      }

      // Success! Clear form and show success message
      toast.success("Post created successfully!");
      setContent("");
      setImages([]);
      setImagePreviewUrls([]);

      // Refresh server data
      router.refresh();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!session) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
      <div className="flex items-start gap-4">
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || "User"}
            width={48}
            height={48}
            className="rounded-full ring-2 ring-gray-100 dark:ring-gray-700"
          />
        ) : (
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {session.user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        )}

        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`What's on your mind, ${session.user?.name?.split(' ')[0] || 'there'}?`}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 
                         focus:border-blue-500 dark:focus:border-blue-500 focus:ring-0 
                         bg-transparent dark:bg-gray-900 dark:text-white resize-none
                         transition-all duration-200 ease-in-out placeholder-gray-400 dark:placeholder-gray-500"
                rows={3}
                maxLength={2000}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {content.length}/2000
              </div>
            </div>

            {/* Image Previews */}
            {imagePreviewUrls.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Selected Images ({imagePreviewUrls.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setImages([]);
                      setImagePreviewUrls([]);
                    }}
                    className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <Image
                          src={url}
                          alt={`Preview ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full 
                                 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                 shadow-lg transform hover:scale-110"
                        title="Remove image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {images[index] && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-2 rounded-b-lg">
                          <div className="truncate" title={images[index].name}>
                            {images[index].name}
                          </div>
                          <div className="text-gray-300">
                            {formatFileSize(images[index].size)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <label className="cursor-pointer group">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:text-blue-500 
                                dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20
                                transition-all duration-200 group-hover:scale-105">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium">Add Photos</span>
                  </div>
                </label>

                {/* Image count indicator */}
                {images.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                    </svg>
                    <span>{images.length} image{images.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || (!content.trim() && images.length === 0)}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500
                         transition-all duration-200 ease-in-out
                         transform hover:scale-105 active:scale-95 hover:shadow-lg
                         flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    Posting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Post
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}