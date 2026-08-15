'use client'
import React, { useState, useEffect } from 'react';
import { useDarkMode } from '../../DarkModeContext'; // Import the dark mode hook
import { UserAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import axios from 'axios';

function CreatePost() {
  const [title, setTitle] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");


  const { darkMode, toggleDarkMode } = useDarkMode();
  const { user } = UserAuth();
  const router = useRouter();


  const handlePost = async () => {

    // Validate input fields
    if (!title.trim() || content.trim() === '') {
      alert('All fields are required!');
      return;
    }
    
    setLoading(true);
    try {
      console.log(user.displayName);
      const userDetails = {
        username: user.displayName,
        userId: user.uid
        
      };
      
      console.log("UserDetails object:", userDetails); 
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_API}/api/posts/`, {
        title,
        content,
        thumbnail,
        ...userDetails,
      });

      alert('Your Post has been posted successfully!');
      setTitle('');
      setThumbnail('');
      setContent('');
      router.push('/post');
    } catch (error) {
        console.error("Error posting recipe:", error.response?.data || error.message);
        alert("Failed to post recipe: " + (error.response?.data?.error || "Unknown error"));
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className={`min-h-screen pb-12 transition-colors duration-300 ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="container pt-24 mx-auto max-w-4xl px-4">
          <div className="glass-panel p-8 rounded-3xl shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold">Create Your Post</h1>
        </div>

        {/* Title Input */}
        <div className="mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl font-semibold glass-input px-4 py-3 focus:ring-2 focus:ring-amber-500 transition placeholder-slate-400"
            placeholder="Post Title"
            required
          />
        </div>

        {/* Image URL Input */}
        <div className="mb-4">
          <input
            type="url"
            value={thumbnail}
            onChange={(e) => setThumbnail(e.target.value)}
            className="w-full text-lg glass-input px-4 py-3 focus:ring-2 focus:ring-amber-500 transition placeholder-slate-400"
            placeholder="Image URL (Optional)"
            required
          />
        </div>

        {/* Category Dropdown */}
        {/* <div className="mb-6">
        <div className="relative">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="appearance-none w-full text-lg px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white dark:bg-gray-800 cursor-pointer"
            required
          >
            <option value="" disabled>Select a Category</option>
            <option value="CookingTips">🍳 Cooking Tips & Techniques</option>
            <option value="IngredientSubstitutions">🔄 Ingredient Substitutions</option>
            <option value="FoodReviews">⭐ Food Reviews</option>
            <option value="KitchenGadgets">🔧 Kitchen Gadgets & Tools</option>
            <option value="RestaurantRecommendations">🍽️ Restaurant Recommendations</option>
            <option value="FoodStories">📖 Food Stories & Memories</option>
            <option value="FoodPhotography">📸 Food Photography & Styling</option>
            <option value="TrendingTopics">📈 Trending Food Topics</option>
            <option value="AskChef">👨‍🍳 Ask a Chef</option>
            <option value="Other">💬 Other (General Talks)</option>
          </select>
          <div className="pointer-events-none absolute right-4 top-1/2 transform -translate-y-1/2">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div> */}

        {/* Text Editor */}
        <div
          className="mb-4"
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter Your Thoughts Here..."
            className="min-h-[300px] w-full glass-input p-4 resize-none focus:ring-2 focus:ring-amber-500 transition"
          />

        </div>

        {/* Submit Button */}
        <div className="mt-6 text-center">
          <button
            onClick={handlePost}
            disabled={loading}
            className={`px-8 py-3 font-bold rounded-full shadow-md text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-300 dark:focus:ring-amber-600 transition transform hover:scale-105 active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''
              }`}
          >
            {loading ? 'Posting...' : 'Create Post'}
          </button>
        </div>
      </div>
      </div>
    )
  }

  export default CreatePost