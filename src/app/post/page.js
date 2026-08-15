'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar, ChevronRight, User, Clock, Heart, Share2 } from "lucide-react";
import { useDarkMode } from "../DarkModeContext";
import Image from "next/legacy/image"

import { UserAuth } from "../context/AuthContext";
import defaultImage from "@/lib/general.png"

const BACKEND_URL = process.env.NEXT_BACKEND_URL || 'http://localhost:5000';

const PostsPage = () => {
  const [posts, setPosts] = useState([]);
  const router = useRouter();
  const { darkMode } = useDarkMode()
  const { user } = UserAuth();
  const [shareSupported, setShareSupported] = useState(false);

  // Check if the Share API is supported
  useEffect(() => {
    if (navigator.share) {
      setShareSupported(true);
    }
  }, []);

  const handleShare = (id) => {
    const currentUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/viewpost/?id=${id}`;

    if (navigator.share) {
      navigator.share({
        title: document.title,
        url: currentUrl,
      })
        .then(() => console.log("Share successful"))
        .catch((error) => console.error("Error sharing:", error));
    } else {
      // Fallback for unsupported browsers
      if (navigator.clipboard) {
        navigator.clipboard.writeText(currentUrl)
          .then(() => alert("URL copied to clipboard."))
          .catch((error) => console.error("Clipboard error:", error));
      } else {
        alert(`Sharing is not supported in your browser. Copy this URL: ${currentUrl}`);
      }
    }
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/api/posts/`);
        const data = await response.json();
        // Sort posts by createdAt in descending order (latest first)
        const sortedPosts = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPosts(sortedPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchPosts();
  }, []);

  const handleCreatePost = () => {
    if(!user){
      alert("For Creating a Post You have to log in :)")
      return
    }
    router.push("/post/createpost");
  };

  const handleViewPost = (postId) => {
    router.push(`/post/viewpost?id=${encodeURIComponent(postId)}`);
  };

  return (
    <div className={`min-h-screen pb-12 transition-colors duration-300 ${darkMode ? "bg-zinc-950 text-zinc-100" : "bg-slate-50 text-slate-900"}`}>
      {/* Header Section */}
      <div className="pt-24 pb-8 mb-6">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex justify-between items-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/50 dark:border-zinc-800/50 shadow-sm">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight">Community Discussions</h1>
              <p className="text-lg opacity-80 font-medium">Share your culinary thoughts with the community</p>
            </div>
              <button
                onClick={handleCreatePost}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg transition-all transform active:scale-95"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Start Discussion</span>
                <span className="sm:hidden">Post</span>
              </button>
          </div>
        </div>
      </div>

      {/* Posts Container */}
      <div className="container mx-auto px-4 mb-6 max-w-5xl">
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post._id}
              onClick={() => handleViewPost(post._id)}
              className="glass-card p-0 transition-all duration-300 cursor-pointer group overflow-hidden hover:scale-[1.01]"
            >
              <div className="p-6">
                <div className="flex gap-6">
                  {/* Left Section - User Info */}
                  <div className="flex-shrink-0 flex flex-col items-center space-y-2 w-20">
                    <Image
                      src={post.thumbnail || defaultImage}
                      alt={post.title || "Default"}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover border-[3px] border-amber-200 dark:border-amber-900/50"
                    />
                    <span className="text-sm font-medium text-center line-clamp-1">
                      {post.author || "Anonymous"}
                    </span>
                  </div>

                  {/* Right Section - Post Content */}
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xl font-semibold group-hover:font-extrabold transition-colors">
                        {post.title}
                      </h2>
                      <ChevronRight
                        className="opacity-40 group-hover:opacity-100 group-hover:text-amber-500 group-hover:translate-x-1 transition-all"
                        size={24}
                      />
                    </div>

                    {/* Post Preview */}
                    <p className="mb-4 line-clamp-2">
                      Click to read more and join the discussion...
                    </p>

                    {/* Post Metadata */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>Posted {new Date(post.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                        {post.category && (
                          <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            {post.category}
                          </span>
                        )}
                      </div>

                      {/* Like and Share Options */}
                      <div className="flex items-center gap-4 px-4 py-2 rounded-full hover:text-gray-100 hover:bg-red-400 transition-all">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering post view
                            handleShare(post._id);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Share2 size={20} />
                          <span>Share</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="text-center py-16 glass-card mt-6">
            <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
              <User size={32} className="text-amber-500" />
            </div>
            <h3 className="text-xl font-bold">No discussions yet</h3>
            <p className="opacity-60 mt-2 mb-6 font-medium">Be the first to start a conversation!</p>
            <button
              onClick={handleCreatePost}
              className="inline-flex items-center gap-2 bg-amber-500 text-white px-8 py-3 rounded-full hover:bg-amber-600 font-bold shadow-md transition-colors transform active:scale-95"
            >
              <Plus size={20} />
              <span>Create First Post</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default PostsPage;