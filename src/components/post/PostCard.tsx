import { Post } from '@/types/user';
import Image from 'next/image';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-4">
      {/* Author Info */}
      <div className="flex items-center mb-4">
        {post.author.image ? (
          <Image
            src={post.author.image}
            alt={post.author.name}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
        )}
        <div className="ml-3">
          <p className="font-medium text-gray-900 dark:text-white">
            {post.author.name}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(post.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
          {post.content}
        </p>
        {post.images && post.images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {post.images.map((image, index) => (
              <Image
                key={index}
                src={image}
                alt="Post image"
                width={300}
                height={200}
                className="rounded-lg object-cover"
              />
            ))}
          </div>
        )}
      </div>

      {/* Reactions */}
      <div className="flex items-center gap-4 mb-4">
        <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500">
          <span>👍</span>
          <span>{post.reactions.like}</span>
        </button>
        <button className="flex items-center gap-1 text-gray-500 hover:text-red-500">
          <span>❤️</span>
          <span>{post.reactions.heart}</span>
        </button>
        <button className="flex items-center gap-1 text-gray-500 hover:text-yellow-500">
          <span>😄</span>
          <span>{post.reactions.haha}</span>
        </button>
        <button className="flex items-center gap-1 text-gray-500 hover:text-yellow-500">
          <span>😢</span>
          <span>{post.reactions.sad}</span>
        </button>
        <button className="flex items-center gap-1 text-gray-500 hover:text-green-500">
          <span>🎉</span>
          <span>{post.reactions.congrats}</span>
        </button>
      </div>

      {/* Comments */}
      <div className="border-t dark:border-gray-700 pt-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Comments ({post.comments.length})
        </h3>
        {post.comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 mb-3">
            {comment.author.image ? (
              <Image
                src={comment.author.image}
                alt={comment.author.name}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {comment.author.name}
              </p>
              <p className="text-sm text-gray-800 dark:text-gray-200">
                {comment.content}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date(comment.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
        
        {/* Comment Input */}
        <div className="mt-4">
          <textarea
            placeholder="Write a comment..."
            className="w-full px-3 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            rows={2}
          />
          <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Comment
          </button>
        </div>
      </div>
    </div>
  );
}
