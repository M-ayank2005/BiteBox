'use client';
import React, { useState } from 'react';
import { useDarkMode } from '../DarkModeContext';
import { UserAuth } from "../context/AuthContext";
import { useRouter } from 'next/navigation';
import axios from 'axios';

const CustomerReviewForm = () => {
  const { darkMode } = useDarkMode();
  const { user } = UserAuth();
  const router = useRouter();
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRatingClick = (index) => {
    setRating(index + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!review || rating === 0) {
      setError('Please provide a review and select a rating.');
      return;
    }

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_API}/api/rating/`, {
        email: user.email,
        review,
        rating,
      });

      if (response.status === 201) {
        setSuccess('Review submitted successfully!');
        setReview('');
        setRating(0);
        setTimeout(() => {
          router.push('/');
        }, 1000);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Failed to submit the review. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md glass-panel p-8 space-y-6">
        <h1 className="text-2xl font-extrabold text-center">Leave a Review</h1>
        <p className="text-sm text-center text-slate-500 dark:text-zinc-400">
          Tell us about your experience with BiteBox
        </p>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {success && <p className="text-green-500 text-sm text-center">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="review" className="block text-sm font-semibold mb-2">
              Your Review
            </label>
            <textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full p-3 rounded-xl glass-input text-sm min-h-[120px] resize-none"
              placeholder="Write your review here..."
            ></textarea>
          </div>

          <div className="text-center">
            <label className="block text-sm font-semibold mb-3">Your Rating</label>
            <div className="flex items-center justify-center gap-2">
              {[...Array(5)].map((_, index) => (
                <svg
                  key={index}
                  onClick={() => handleRatingClick(index)}
                  xmlns="http://www.w3.org/2000/svg"
                  fill={index < rating ? '#f59e0b' : 'none'}
                  stroke={index < rating ? '#f59e0b' : darkMode ? '#6B7280' : '#D1D5DB'}
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  className="w-9 h-9 cursor-pointer hover:scale-110 transition-transform"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.518 4.674a1 1 0 00.95.69h4.908c.969 0 1.371 1.24.588 1.81l-3.973 2.884a1 1 0 00-.364 1.118l1.518 4.674c.3.921-.755 1.688-1.538 1.118l-3.973-2.884a1 1 0 00-1.176 0l-3.973 2.884c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.986 9.1c-.783-.57-.38-1.81.588-1.81h4.908a1 1 0 00.95-.69l1.518-4.674z"
                  />
                </svg>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-full font-bold text-white bg-amber-500 hover:bg-amber-600 transition shadow-sm active:scale-95"
          >
            Submit Review
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerReviewForm;
