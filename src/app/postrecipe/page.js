'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { UserAuth } from "../context/AuthContext";
import { useRouter, useSearchParams } from 'next/navigation'; 
import { useDarkMode } from '../DarkModeContext';
import loader from '@/Components/loader';

// Dynamically import ReactQuill to prevent SSR window/document issues
const ReactQuill = dynamic(
  async () => {
    await import('react-quill-new/dist/quill.snow.css');
    return import('react-quill-new');
  },
  { 
    ssr: false,
    loading: () => <div className="p-6 text-center text-sm text-gray-400">Loading Rich Text Editor...</div>
  }
);

function PostRecipeContent() {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState('');
  const [coverImage, setImageUrl] = useState('');
  const [youtube, setYoutube] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = UserAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { darkMode } = useDarkMode();

  useEffect(() => {
    setMounted(true);
    
    // Check if user is remixing an existing recipe
    const remixTitle = searchParams.get('title');
    if (remixTitle) {
      setTitle(remixTitle);
    }
  }, [searchParams]);

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

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || 'http://localhost:5000';

      await axios.post(`${backendUrl}/api/recipes`, {
        title,
        content,
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

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {loader()}
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto glass-panel p-8 space-y-8">
        <h1 className="text-3xl font-extrabold text-center text-amber-500 tracking-tight">
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
              className="w-full text-lg px-4 py-3 rounded-xl glass-input"
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
              className="w-full text-base px-4 py-3 rounded-xl glass-input"
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
                className="w-full text-base px-4 py-3 rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-base px-4 py-3 rounded-xl glass-input"
                required
              >
                <option value="" disabled>Select a Category</option>
                <option value="Appetizer">Appetizer</option>
                <option value="Main Course">Main Course</option>
                <option value="Dessert">Dessert</option>
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snack">Snack</option>
                <option value="Beverage">Beverage</option>
                <option value="Salad">Salad</option>
                <option value="Soup">Soup</option>
              </select>
            </div>
          </div>

          {/* Rich Text Editor */}
          <div>
            <label className="block text-sm font-semibold mb-2">Recipe Instructions & Ingredients *</label>
            <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
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
              className={`w-full sm:w-auto px-10 py-3.5 rounded-full font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-lg transition active:scale-95 ${
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
}

export default function PostRecipePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">{loader()}</div>}>
      <PostRecipeContent />
    </Suspense>
  );
}
