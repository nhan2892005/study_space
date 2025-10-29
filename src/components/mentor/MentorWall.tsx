"use client";

import Image from 'next/image';
import React from 'react';
import StarRating from './StarRating'; // Adjust the import path as needed

export default function MentorWall({ mentorData, currentUserEmail }: any) {
  // Mock data for demo
  const mockMentor = {
    user: {
      id: 'mentor1',
      name: 'Nguyen Van Mentor',
      image: 'https://randomuser.me/api/portraits/men/45.jpg',
      role: 'MENTOR',
    },
    posts: [
      { id: 'p1', content: 'Chia sẻ về kỹ năng quản lý thời gian hiệu quả.' },
      { id: 'p2', content: 'Hướng dẫn giải quyết xung đột trong nhóm.' },
      { id: 'p3', content: 'Kinh nghiệm phỏng vấn xin việc ngành IT.' },
    ],
    reviews: [
      {
        id: 'r1',
        reviewer: {
          name: 'Tran Thi B',
          image: 'https://randomuser.me/api/portraits/women/44.jpg',
        },
        rating: 4.8,
        comment: 'Mentor rất nhiệt tình và hỗ trợ tốt!'
      },
      {
        id: 'r2',
        reviewer: {
          name: 'Le Van C',
          image: 'https://randomuser.me/api/portraits/men/65.jpg',
        },
        rating: 4.5,
        comment: 'Giải thích rõ ràng, dễ hiểu.'
      },
      {
        id: 'r3',
        reviewer: {
          name: 'Pham Thi D',
          image: 'https://randomuser.me/api/portraits/women/55.jpg',
        },
        rating: 5.0,
        comment: 'Rất hài lòng với sự hướng dẫn.'
      },
    ],
  };

  const { user, posts, reviews } = mockMentor || mentorData;

  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  async function submitReview() {
    try {
      setSubmitting(true);
      // Simulate API for demo
      await new Promise(res => setTimeout(res, 500));
      alert('Review submitted');
      setComment('');
    } catch (err) {
      console.error(err);
      alert('Failed to submit review');
    } finally { setSubmitting(false); }
  }

  async function handleRequest() {
    try {
      // Simulate API for demo
      await new Promise(res => setTimeout(res, 500));
      alert('Request sent');
    } catch (err) {
      alert('Network error');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center bg-white dark:bg-gray-800 p-6 rounded shadow">
        {user.image ? (
          <Image src={user.image} alt={user.name} width={96} height={96} className="rounded-full" />
        ) : (
          <div className="w-24 h-24 bg-gray-200 rounded-full" />
        )}
        <div>
          <h2 className="text-2xl font-bold">{user.name}</h2>
          <div className="text-sm text-gray-600 dark:text-gray-300">Role: {user.role}</div>
          <div className="mt-3">
            <button onClick={handleRequest} className="px-4 py-2 bg-blue-600 text-white rounded">Đăng ký làm mentor</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Reviews</h3>
          {reviews.length === 0 ? <p>No reviews yet</p> : (
            <div className="space-y-3">
              {reviews.map((r: any) => (
                <div key={r.id} className="border-b pb-2">
                  <div className="flex items-center gap-3">
                    {r.reviewer?.image ? (
                      <Image src={r.reviewer.image} width={40} height={40} className="rounded-full" alt={r.reviewer.name} />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    )}
                    <div>
                      <div className="font-medium">{r.reviewer?.name}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        Rating: <StarRating rating={r.rating} size={16} showScore={true} editable={false} />
                      </div>
                    </div>
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
          {/* If current user is set, show review form so mentees can leave a review for this mentor */}
          {currentUserEmail && (
            <div className="mt-4 border-t pt-4">
              <h4 className="font-medium mb-2">Đánh giá mentor</h4>
              <div className="flex items-center gap-2">
                <label className="text-sm">Sao</label>
                <StarRating rating={rating} editable={true} onChange={setRating} size={24} showScore={true} />
              </div>
              <div className="mt-2">
                <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)} className="w-full p-2 border rounded" placeholder="Viết nhận xét..." />
              </div>
              <div className="mt-2">
                <button onClick={submitReview} disabled={submitting} className="px-3 py-1 bg-green-600 text-white rounded">{submitting ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Posts</h3>
          {posts.length === 0 ? <p>No posts</p> : (
            <div className="space-y-3">
              {posts.map((p: any) => (
                <div key={p.id} className="border-b pb-2">
                  <div className="text-sm text-gray-800 dark:text-gray-200">{p.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}