'use client';

import type { ExtendedPost } from '@/types/post';
import { ReactionType } from '@prisma/client';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface PostCardProps {
  post: ExtendedPost;
}

const reactionEmojis = {
  [ReactionType.LIKE]: { emoji: '👍', hoverColor: 'hover:text-blue-500' },
  [ReactionType.HEART]: { emoji: '❤️', hoverColor: 'hover:text-red-500' },
  [ReactionType.HAHA]: { emoji: '😄', hoverColor: 'hover:text-yellow-500' },
  [ReactionType.SAD]: { emoji: '😢', hoverColor: 'hover:text-yellow-500' },
  [ReactionType.CONGRATS]: { emoji: '🎉', hoverColor: 'hover:text-green-500' },
};

export default function PostCard({ post }: PostCardProps) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [localPost, setLocalPost] = useState(post);

  const handleReaction = async (type: ReactionType) => {
    if (!session) {
      toast.error('Please sign in to react to posts');
      return;
    }

    try {
      const response = await fetch(`/api/posts/${post.id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) throw new Error('Failed to react to post');

      // Optimistically update the UI
      const data = await response.json();
      if (data.message === 'Reaction removed') {
        setLocalPost(prev => ({
          ...prev,
          reactions: prev.reactions.filter(
            r => !(r.userId === session.user.id && r.type === type)
          ),
        }));
      } else {
        const existingReactionIndex = localPost.reactions.findIndex(
          r => r.userId === session.user.id
        );

        if (existingReactionIndex !== -1) {
          setLocalPost(prev => ({
            ...prev,
            reactions: prev.reactions.map((r, i) =>
              i === existingReactionIndex ? { ...r, type } : r
            ),
          }));
        } else {
          setLocalPost(prev => ({
            ...prev,
            reactions: [...prev.reactions, data],
          }));
        }
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast.error('Failed to react to post');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error('Please sign in to comment');
      return;
    }
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment }),
      });

      if (!response.ok) throw new Error('Failed to post comment');

      const newComment = await response.json();
      setLocalPost(prev => ({
        ...prev,
        comments: [...prev.comments, newComment],
      }));
      setComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };
  console.log(localPost.comments[0].author.image)
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-4">
      {/* Author Info */}
      <div className="flex items-center mb-4">
        <Image
          src={post.author.image || `https://api.dicebear.com/9.x/adventurer/svg?seed=${post.author.name}`}
          alt={post.author.name || 'User'}
          width={40}
          height={40}
          className="rounded-full"
        />
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
          <div className={`mt-4 grid ${
            post.images.length === 1 ? 'grid-cols-1' : 
            post.images.length === 2 ? 'grid-cols-2' : 
            'grid-cols-2 sm:grid-cols-3'
          } gap-2`}>
            {post.images.map((image, index) => (
              <div key={index} className="relative group aspect-w-16 aspect-h-9">
                <Image
                  src={image}
                  alt={`Post image ${index + 1}`}
                  fill
                  className="rounded-lg object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reactions */}
      <div className="flex items-center gap-4 mb-4">
        {Object.entries(reactionEmojis).map(([type, { emoji, hoverColor }]) => {
          const count = post.reactions.filter(r => r.type === type).length;
          const hasReacted = post.reactions.some(
            r => r.type === type && r.userId === session?.user?.id
          );
          
          return (
            <button
              key={type}
              onClick={() => handleReaction(type as ReactionType)}
              className={`flex items-center gap-1 text-gray-500 ${hoverColor} 
                ${hasReacted ? 'text-blue-500' : ''} transition-colors duration-200`}
            >
              <span className={`transform transition-transform duration-200 
                ${hasReacted ? 'scale-125' : 'scale-100'}`}>
                {emoji}
              </span>
              <span>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Comments */}
      <div className="border-t dark:border-gray-700 pt-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Comments ({localPost.comments.length})
        </h3>
        {localPost.comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 mb-3">
            <Image
              src={comment.author.image !== null ? comment.author.image : `https://api.dicebear.com/9.x/adventurer/svg?seed=${comment.author.name}`}
              alt={comment.author.name || 'User'}
              width={32}
              height={32}
              className="rounded-full"
            />
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
        <form onSubmit={handleComment} className="mt-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={session ? "Write a comment..." : "Please sign in to comment"}
            className="w-full px-3 py-2 border rounded-lg dark:border-gray-700 
                     dark:bg-gray-900 dark:text-white focus:ring-2 
                     focus:ring-blue-500 focus:border-transparent
                     transition-all duration-200"
            rows={2}
            disabled={!session || isSubmitting}
          />
          <button
            type="submit"
            disabled={!session || isSubmitting || !comment.trim()}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg 
                     hover:bg-blue-600 disabled:opacity-50 
                     disabled:cursor-not-allowed transition-all duration-200
                     transform hover:scale-105 active:scale-95"
          >
            {isSubmitting ? 'Posting...' : 'Comment'}
          </button>
        </form>
      </div>
    </div>
  );
}
