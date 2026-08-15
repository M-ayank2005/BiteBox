"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/legacy/image";
import { UserAuth } from "../context/AuthContext";
import { Heart, Search, X, Filter, Sparkles, Clock, Flame, Utensils, RefreshCw } from "lucide-react";
import Loader from "@/Components/loader";
import { useDarkMode } from "../DarkModeContext";

const RecipesPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedHealthFilter, setSelectedHealthFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { user } = UserAuth();
  const { darkMode } = useDarkMode();

  const categories = [
    "All",
    "Appetizer",
    "Main Course",
    "Dessert",
    "Breakfast",
    "Lunch",
    "Dinner",
    "Snack",
    "Beverage",
    "Salad",
    "Soup"
  ];

  const healthFilters = [
    { id: "All", label: "All Recipes" },
    { id: "protein", label: "High Protein" },
    { id: "keto", label: "Keto / Low Carb" },
    { id: "diabetic", label: "Diabetic Friendly" },
    { id: "sodium", label: "Low Sodium" },
    { id: "vegan", label: "Vegan" },
    { id: "quick", label: "Under 20 Mins" }
  ];

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:5000";
        const response = await axios.get(`${backendUrl}/api/recipes?limit=100`);
        setRecipes(response.data || []);
      } catch (error) {
        console.error("Error fetching recipes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  // Multi-Filter Logic: Category + Health Filter + Search Query
  const filteredRecipes = useMemo(() => {
    let filtered = recipes;

    // Filter by Category
    if (selectedCategory !== "All") {
      filtered = filtered.filter((recipe) => recipe.category === selectedCategory);
    }

    // Filter by Health & Dietary Tag
    if (selectedHealthFilter !== "All") {
      filtered = filtered.filter((recipe) => {
        const textToSearch = `${recipe.title} ${recipe.category} ${recipe.content || ''}`.toLowerCase();
        switch (selectedHealthFilter) {
          case "protein":
            return textToSearch.includes("protein") || textToSearch.includes("chicken") || textToSearch.includes("egg") || textToSearch.includes("steak") || textToSearch.includes("tofu");
          case "keto":
            return textToSearch.includes("keto") || textToSearch.includes("low carb") || textToSearch.includes("avocado") || textToSearch.includes("cheese");
          case "diabetic":
            return textToSearch.includes("diabetic") || textToSearch.includes("low gi") || textToSearch.includes("sugar-free");
          case "sodium":
            return textToSearch.includes("low sodium") || textToSearch.includes("heart") || textToSearch.includes("fresh");
          case "vegan":
            return textToSearch.includes("vegan") || textToSearch.includes("plant") || textToSearch.includes("salad") || textToSearch.includes("veggie");
          case "quick":
            return textToSearch.includes("15") || textToSearch.includes("20") || textToSearch.includes("quick") || textToSearch.includes("fast");
          default:
            return true;
        }
      });
    }

    // Filter by Search Query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((recipe) =>
        recipe.title.toLowerCase().includes(query) ||
        (recipe.category && recipe.category.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [recipes, selectedCategory, selectedHealthFilter, searchQuery]);

  // Search Suggestions
  const searchSuggestions = useMemo(() => {
    if (searchQuery.trim() === "" || !showSuggestions) return [];
    const query = searchQuery.toLowerCase();
    return recipes
      .filter((recipe) => recipe.title.toLowerCase().includes(query))
      .slice(0, 5)
      .map((recipe) => recipe.title);
  }, [recipes, searchQuery, showSuggestions]);

  const handleRecipeClick = (recipe) => {
    router.push(`/view?id=${encodeURIComponent(recipe._id)}`);
  };

  const handleRemixRecipe = (recipe) => {
    if (!user) {
      alert("Please login to remix recipes!");
      router.push("/LoginPage");
      return;
    }
    // Route to postrecipe with remix prepopulated
    router.push(`/postrecipe?remixId=${encodeURIComponent(recipe._id)}&title=${encodeURIComponent("Remix of " + recipe.title)}`);
  };

  const handlePostRecipeClick = () => {
    if (user) {
      router.push("/postrecipe");
    } else {
      alert("Only Registered Users can Post :)");
      router.push("/LoginPage");
    }
  };

  const likeClick = async (e, recipeId) => {
    e.stopPropagation();

    if (!user) {
      alert("Please login to like recipes");
      return;
    }

    const userId = user.email;
    const recipe = recipes.find((r) => r._id === recipeId);
    if (!recipe) return;

    const alreadyLiked = Array.isArray(recipe.likes) && recipe.likes.some((like) => like.userId === userId);

    if (alreadyLiked) {
      alert("You have already liked this recipe!");
      return;
    }

    // Optimistic UI update
    setRecipes((prev) =>
      prev.map((r) =>
        r._id === recipeId ? { ...r, likes: [...(r.likes || []), { userId }] } : r
      )
    );

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:5000";
      const response = await axios.put(`${backendUrl}/api/recipes/${recipeId}/like`, { userId });

      setRecipes((prev) =>
        prev.map((r) => (r._id === recipeId ? { ...r, likes: response.data.likes } : r))
      );
    } catch (error) {
      console.error("Error liking recipe:", error);
    }
  };

  return (
    <div className="min-h-screen py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Apple Water Glass Header */}
        <div className="glass-panel flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 p-6 sm:p-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500 mb-2">
              <Utensils className="w-4 h-4" /> Recipe Explorer & Community Remixes
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">Discover Delicious Recipes</h1>
            <p className="text-slate-600 dark:text-zinc-400 text-sm sm:text-base mt-2">Search, filter by dietary requirements, or remix community recipes.</p>
          </div>

          <button
            onClick={handlePostRecipeClick}
            className="glass-button-accent w-full sm:w-auto px-6 py-3 rounded-full text-sm flex items-center justify-center gap-1.5"
          >
            + Post New Recipe
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search by recipe name, ingredient, or keyword..."
              className={`w-full pl-12 pr-10 py-3.5 rounded-full border text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-yellow-500 transition shadow-sm ${
                darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"
              }`}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-4 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className={`absolute z-20 w-full mt-2 rounded-2xl shadow-xl border overflow-hidden ${
              darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"
            }`}>
              {searchSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => { setSearchQuery(suggestion); setShowSuggestions(false); }}
                  className="px-5 py-3 hover:bg-yellow-500/10 cursor-pointer text-sm font-medium border-b border-gray-100 dark:border-gray-700/50 last:border-b-0"
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Health & Dietary Multi-Filter Tabs */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-yellow-500 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Health & Dietary Filters
          </span>
          <div className="flex flex-wrap gap-2">
            {healthFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedHealthFilter(filter.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                  selectedHealthFilter === filter.id
                    ? "bg-amber-500 text-white border-amber-500 shadow-md"
                    : `${darkMode ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-white border-gray-300 text-gray-700"} hover:border-amber-500`
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5" /> Meal Category
          </span>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                  selectedCategory === category
                    ? "bg-amber-600 text-white shadow"
                    : `${darkMode ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 border-b pb-3 dark:border-zinc-800">
          <span>Showing <strong>{filteredRecipes.length}</strong> recipes</span>
          {(selectedCategory !== "All" || selectedHealthFilter !== "All" || searchQuery) && (
            <button
              onClick={() => { setSelectedCategory("All"); setSelectedHealthFilter("All"); setSearchQuery(""); }}
              className="text-amber-500 hover:underline font-bold"
            >
              Reset Filters
            </button>
          )}
        </div>

        {loading && (
          <div className="w-full py-16 flex items-center justify-center">
            <Loader />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRecipes.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <h3 className="text-xl font-bold">No recipes found matching your filters</h3>
            <p className="text-sm text-gray-500">Try clearing your search query or selecting another dietary tag.</p>
          </div>
        )}

        {/* Recipe Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe._id}
              onClick={() => handleRecipeClick(recipe)}
              className={`group cursor-pointer rounded-3xl overflow-hidden shadow-lg border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl flex flex-col justify-between ${
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}
            >
              <div>
                {/* Cover Image */}
                <div className="relative w-full h-52 bg-black">
                  <Image
                    src={recipe.coverImage || "/placeholder-recipe.jpg"}
                    alt={recipe.title}
                    layout="fill"
                    objectFit="cover"
                    className="group-hover:opacity-90 transition"
                  />
                  <span className="absolute top-3 left-3 bg-yellow-500 text-white font-bold text-[10px] uppercase px-3 py-1 rounded-full shadow">
                    {recipe.category || "Recipe"}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-xl font-bold line-clamp-1 group-hover:text-yellow-500 transition">{recipe.title}</h2>

                    {/* Like Button */}
                    <button
                      onClick={(e) => likeClick(e, recipe._id)}
                      className="flex items-center gap-1 text-sm font-semibold text-pink-500 hover:scale-110 transition"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          Array.isArray(recipe.likes) && recipe.likes.some((l) => l.userId === user?.email)
                            ? "fill-current text-pink-500"
                            : "text-gray-400"
                        }`}
                      />
                      <span>{recipe.likes ? recipe.likes.length : 0}</span>
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {recipe.username ? `By Chef ${recipe.username}` : "BiteBox Community Recipe"}
                  </p>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-6 pt-0 flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleRecipeClick(recipe); }}
                  className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-xs rounded-xl transition shadow"
                >
                  View Recipe
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); handleRemixRecipe(recipe); }}
                  className="px-3.5 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-gray-700 dark:text-gray-200 hover:text-yellow-600 font-bold text-xs rounded-xl transition flex items-center gap-1"
                  title="Remix this recipe"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Remix
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecipesPage;
