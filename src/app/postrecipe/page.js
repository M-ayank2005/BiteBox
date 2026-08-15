'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { UserAuth } from "../context/AuthContext";
import { useRouter } from 'next/navigation'; 
import { useDarkMode } from '../DarkModeContext';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to prevent SSR window issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const PostRecipePage = () => {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState('');
  const [coverImage, setImageUrl] = useState('');
  const [youtube, setYoutube] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = UserAuth();
  const router = useRouter();
  const { darkMode } = useDarkMode();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Rich Text Editor Modules & Toolbar Configuration
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['blockquote', 'code-block'],
      ['clean']
    ]
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'align',
    'blockquote', 'code-block'
  ];

  const handlePost = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || content === '<p><br></p>' || !coverImage.trim() || !category.trim()) {
      alert('Please fill out all required fields!');
      return;
    }

    if (!user) {
      alert('You must be logged in to post a recipe.');
      router.push('/LoginPage');
      return;
    }

    setLoading(true);
    try {
      const userDetails = {
        username: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        email: user.email || 'Not Available',
      };

      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_API}/api/recipes`, {
        title,
        content, // Clean HTML content string
        coverImage,
        youtube,
        category,
        ...userDetails,
      });

      alert('Recipe posted successfully!');
      router.push('/recipes');
    } catch (error) {
      console.error('Error posting recipe:', error);
      alert('Failed to post recipe: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className={`min-h-screen py-10 px-4 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'
    }`}>
      <div className={`max-w-4xl mx-auto p-8 rounded-2xl shadow-xl border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h1 className="text-3xl font-extrabold mb-8 text-center text-yellow-500 tracking-tight">
          Create & Share Your Recipe
        </h1>

        <form onSubmit={handlePost} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-2">Recipe Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Creamy Tuscan Garlic Chicken"
              className={`w-full text-lg px-4 py-3 rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            />
          </div>

          {/* Cover Image URL */}
          <div>
            <label className="block text-sm font-semibold mb-2">Cover Image URL *</label>
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className={`w-full text-base px-4 py-3 rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            />
          </div>

          {/* Youtube URL & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">YouTube Video Link (Optional)</label>
              <input
                type="url"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className={`w-full text-base px-4 py-3 rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full text-base px-4 py-3 rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              >
                <option value="" disabled>Select a Category</option>
                <option value="Appetizer">🥗 Appetizer</option>
                <option value="Main Course">🍽️ Main Course</option>
                <option value="Dessert">🍰 Dessert</option>
                <option value="Breakfast">🍳 Breakfast</option>
                <option value="Lunch">🥪 Lunch</option>
                <option value="Dinner">🍖 Dinner</option>
                <option value="Snack">🍿 Snack</option>
                <option value="Beverage">🥤 Beverage</option>
                <option value="Salad">🥬 Salad</option>
                <option value="Soup">🥣 Soup</option>
              </select>
            </div>
          </div>

          {/* Rich Text Editor */}
          <div>
            <label className="block text-sm font-semibold mb-2">Recipe Instructions & Ingredients *</label>
            <div className={`rounded-xl overflow-hidden border ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
            }`}>
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                placeholder="Write ingredients, step-by-step cooking instructions, prep time..."
                className="min-h-[250px] dark:text-white"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 text-center">
            <button
              type="submit"
              disabled={loading}
              className={`w-full sm:w-auto px-10 py-3 rounded-full font-bold text-white bg-yellow-500 hover:bg-yellow-600 shadow-lg hover:shadow-xl transition transform active:scale-95 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Posting Recipe...' : 'Publish Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostRecipePage;
