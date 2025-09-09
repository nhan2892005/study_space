"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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
      setImages((prev) => [...prev, ...filesArray]);

      filesArray.forEach((file) => {
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
    if (!content.trim() && images.length === 0) return;

    setIsSubmitting(true);
    try {
      // First, upload images to Cloudinary
      let imageUrls: string[] = [];
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((image) => formData.append("images", image));

        const uploadResponse = await fetch("/api/uploads/cloudinary", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload images");
        }

        const uploadResult = await uploadResponse.json();
        imageUrls = uploadResult.urls;
      }

      // Then create the post with image URLs
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          images: imageUrls,
        }),
      });

      if (!response.ok) throw new Error("Failed to create post");

      // Clear form
      setContent("");
      setImages([]);
      setImagePreviewUrls([]);

      // <-- IMPORTANT: refresh server data (re-run server component data fetching)
      router.refresh();
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-start gap-4">
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || "User"}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
        )}

        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 
                       focus:border-blue-500 dark:focus:border-blue-500 focus:ring-0 
                       bg-transparent dark:bg-gray-900 dark:text-white resize-none
                       transition-all duration-200 ease-in-out"
              rows={3}
            />

            {imagePreviewUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={url}
                      alt={`Preview ${index + 1}`}
                      width={200}
                      height={200}
                      className="rounded-lg object-cover w-full h-32"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 rounded-full opacity-0 
                               group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="flex items-center gap-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">Add Photos</span>
                </div>
              </label>

              <button
                type="submit"
                disabled={isSubmitting || (!content.trim() && images.length === 0)}
                className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 ease-in-out
                         transform hover:scale-105 active:scale-95"
              >
                {isSubmitting ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
