"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useDarkMode } from "../DarkModeContext";
import loader from "@/Components/loader";
import { 
  Heart, 
  User as UserIcon, 
  Calendar, 
  ChefHat, 
  ShoppingCart, 
  Users, 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Clock, 
  CheckSquare, 
  Square,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { UserAuth } from "../context/AuthContext";
import Image from "next/legacy/image";

// Scale numerical values in ingredient strings (e.g. "2 cups flour" -> "4 cups flour")
const scaleIngredientText = (text, multiplier) => {
  if (multiplier === 1) return text;
  return text.replace(/\b(\d+(?:\.\d+)?|\d+\/\d+)\b/g, (match) => {
    if (match.includes("/")) {
      const [num, den] = match.split("/").map(Number);
      const val = (num / den) * multiplier;
      return Number.isInteger(val) ? val.toString() : val.toFixed(1);
    }
    const num = Number(match);
    if (isNaN(num)) return match;
    const scaled = num * multiplier;
    return Number.isInteger(scaled) ? scaled.toString() : scaled.toFixed(1);
  });
};

// Universal Content Renderer
const ContentRenderer = ({ content, servingMultiplier = 1 }) => {
  if (!content) return null;

  // Check if content is legacy Draft.js JSON string
  if (typeof content === "string" && content.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.blocks)) {
        return (
          <div className="space-y-4">
            {parsed.blocks.map((block, index) => {
              if (!block.text) return <br key={index} />;
              const scaledText = scaleIngredientText(block.text, servingMultiplier);

              switch (block.type) {
                case "header-one":
                  return <h1 key={index} className="text-3xl font-bold mt-4 mb-2 text-yellow-500">{scaledText}</h1>;
                case "header-two":
                  return <h2 key={index} className="text-2xl font-semibold mt-3 mb-2 text-yellow-500">{scaledText}</h2>;
                case "header-three":
                  return <h3 key={index} className="text-xl font-medium mt-2 mb-1 text-yellow-500">{scaledText}</h3>;
                case "blockquote":
                  return <blockquote key={index} className="border-l-4 border-yellow-500 italic pl-4 my-3 text-gray-600 dark:text-gray-300">{scaledText}</blockquote>;
                case "code-block":
                  return <pre key={index} className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm font-mono my-3">{scaledText}</pre>;
                case "unordered-list-item":
                  return <li key={index} className="ml-6 list-disc mb-1">{scaledText}</li>;
                case "ordered-list-item":
                  return <li key={index} className="ml-6 list-decimal mb-1">{scaledText}</li>;
                default:
                  return <p key={index} className="mb-3 leading-relaxed">{scaledText}</p>;
              }
            })}
          </div>
        );
      }
    } catch (e) {
      console.warn("Legacy content JSON parse attempt skipped:", e);
    }
  }

  // Standard HTML string output (ReactQuill & standard rich text)
  const scaledHtml = scaleIngredientText(content, servingMultiplier);
  return (
    <div 
      className="prose prose-lg dark:prose-invert max-w-none prose-yellow"
      dangerouslySetInnerHTML={{ __html: scaledHtml }} 
    />
  );
};

const RecipeContent = () => {
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [id, setId] = useState(null);
  const { darkMode } = useDarkMode();
  const { user } = UserAuth();

  // Serving Portion Scaler (Default 2 Servings)
  const [servings, setServings] = useState(2);
  const baseServings = 2;
  const servingMultiplier = servings / baseServings;

  // Interactive Cook Mode & Shopping List State
  const [isCookModeOpen, setIsCookModeOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [shoppingListAdded, setShoppingListAdded] = useState(false);

  // Kitchen Countdown Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Extract YouTube ID
  const extractYouTubeId = (url) => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/\n\s]*\/\S+\/|\S+\/|\S+\/v=|v\/|e(?:mbed)?\/|watch\?v=|embed\/v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get("id");
    if (queryId) {
      setId(queryId);
    } else {
      setError("Missing recipe ID parameter");
    }
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchRecipe = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:5000";
        const response = await axios.get(`${backendUrl}/api/recipes/${encodeURIComponent(id)}`);
        setRecipe(response.data);
        
        if (user && Array.isArray(response.data.likes)) {
          const alreadyLiked = response.data.likes.some((like) => like.userId === user.email);
          setIsLiked(alreadyLiked);
        }
      } catch (err) {
        setError("Unable to load recipe details");
        console.error("Error fetching recipe details:", err);
      }
    };

    fetchRecipe();
  }, [id, user]);

  // Kitchen Timer Countdown Effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      playTimerChime();
      alert("⏰ Kitchen Timer Complete!");
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  // Web Audio API Chime Sound
  const playTimerChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.2); // A5 note
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.log("Audio play suppressed:", e);
    }
  };

  const handleLike = async () => {
    if (!user || !recipe) {
      alert("Please log in to like this recipe!");
      return;
    }

    if (isLiked) {
      alert("You have already liked this recipe!");
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:5000";
      await axios.put(`${backendUrl}/api/recipes/${recipe._id}/like`, { userId: user.email });

      setRecipe((prev) => ({
        ...prev,
        likes: [...(prev.likes || []), { userId: user.email }]
      }));
      setIsLiked(true);
    } catch (err) {
      console.error("Error liking recipe:", err);
    }
  };

  // Save recipe ingredients to Shopping List in LocalStorage
  const handleAddToShoppingList = () => {
    if (!recipe) return;

    try {
      const existingList = JSON.parse(localStorage.getItem("bitebox_shopping_list") || "[]");
      
      const newItems = {
        id: recipe._id,
        recipeTitle: recipe.title,
        servings: servings,
        content: scaleIngredientText(recipe.content || "", servingMultiplier),
        addedAt: new Date().toLocaleDateString()
      };

      const updatedList = [newItems, ...existingList.filter(item => item.id !== recipe._id)];
      localStorage.setItem("bitebox_shopping_list", JSON.stringify(updatedList));

      setShoppingListAdded(true);
      setTimeout(() => setShoppingListAdded(false), 3000);
    } catch (e) {
      console.error("Shopping list save error:", e);
    }
  };

  // Helper to extract step list from recipe content (handling legacy JSON & HTML)
  const extractSteps = () => {
    if (!recipe || !recipe.content) return ["Read recipe instructions carefully."];
    
    // Case 1: Legacy Draft.js JSON string
    if (typeof recipe.content === "string" && recipe.content.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(recipe.content);
        if (parsed && Array.isArray(parsed.blocks)) {
          const blockTexts = parsed.blocks
            .map((b) => (b.text ? b.text.trim() : ""))
            .filter((t) => t.length > 0);
          if (blockTexts.length > 0) return blockTexts;
        }
      } catch (e) {
        console.warn("Legacy JSON step parsing skipped:", e);
      }
    }

    // Case 2: Clean HTML tags for step array
    const plainText = recipe.content.replace(/<[^>]+>/g, "\n");
    const lines = plainText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    return lines.length > 0 ? lines : [plainText];
  };

  const stepsList = extractSteps();

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      }`}>
        <p className="text-red-500 text-xl font-semibold">{error}</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {loader()}
      </div>
    );
  }

  const youtubeId = extractYouTubeId(recipe.youtube);
  const createdDate = recipe.createdAt ? new Date(recipe.createdAt) : new Date();
  const formattedDate = createdDate instanceof Date && !isNaN(createdDate)
    ? format(createdDate, "MMMM dd, yyyy")
    : "Date not available";

  const formatTimerTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`min-h-screen py-12 px-4 transition-colors duration-300 ${
      darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
    }`}>
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-2xl rounded-3xl overflow-hidden border dark:border-gray-700">
        {/* Cover Image Header */}
        <div className="relative h-[380px] sm:h-[450px] w-full">
          <Image
            src={recipe.coverImage || "/placeholder-recipe.jpg"}
            alt={recipe.title}
            layout="fill"
            objectFit="cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 space-y-2">
            <span className="inline-block px-3.5 py-1.5 bg-yellow-500 text-white text-xs font-bold uppercase rounded-full shadow">
              {recipe.category || "Recipe"}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-md">
              {recipe.title}
            </h1>
          </div>
        </div>

        {/* Action Controls & Interactive Toolbar */}
        <div className="p-6 sm:p-10 space-y-8">
          {/* Top Bar: Metadata & Like */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b dark:border-gray-700">
            <div className="space-y-1 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              {recipe.username && (
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-yellow-500" />
                  <span>Created by <strong className="text-gray-900 dark:text-white">{recipe.username}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Posted on {formattedDate}</span>
              </div>
            </div>

            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold transition-all shadow-sm ${
                isLiked
                  ? "bg-pink-100 dark:bg-pink-900/40 text-pink-500"
                  : "bg-gray-100 dark:bg-gray-700 hover:bg-pink-50 text-gray-700 dark:text-gray-200"
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? "fill-current text-pink-500" : ""}`} />
              <span>{recipe.likes ? recipe.likes.length : 0} Likes</span>
            </button>
          </div>

          {/* Interactive Tools Panel: Serving Scaler, Cook Mode, Shopping List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/30">
            {/* Serving Scaler */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400 flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Scale Recipe Servings
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 4, 6, 8].map((qty) => (
                  <button
                    key={qty}
                    onClick={() => setServings(qty)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                      servings === qty
                        ? "bg-yellow-500 text-white shadow"
                        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-yellow-100"
                    }`}
                  >
                    {qty}x
                  </button>
                ))}
              </div>
            </div>

            {/* Launch Cook Mode Button */}
            <div className="flex items-center justify-center">
              <button
                onClick={() => setIsCookModeOpen(true)}
                className="w-full py-3.5 px-6 rounded-xl font-extrabold text-sm bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg hover:shadow-xl transition transform active:scale-98 flex items-center justify-center gap-2"
              >
                <ChefHat className="w-5 h-5" /> Start Interactive Cook Mode
              </button>
            </div>

            {/* Export to Shopping List */}
            <div className="flex items-center justify-center">
              <button
                onClick={handleAddToShoppingList}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 border shadow-sm ${
                  shoppingListAdded
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:border-yellow-500"
                }`}
              >
                {shoppingListAdded ? (
                  <>
                    <Check className="w-4 h-4" /> Added to Shopping List!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 text-yellow-500" /> Save to Shopping List
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Scaled Ingredients & Instructions Content */}
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center border-b pb-2 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-yellow-500">
                Ingredients & Directions ({servings} Servings)
              </h2>
              {servingMultiplier !== 1 && (
                <span className="text-xs font-bold bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-3 py-1 rounded-full">
                  Scaled {servingMultiplier}x
                </span>
              )}
            </div>

            <ContentRenderer content={recipe.content} servingMultiplier={servingMultiplier} />
          </div>

          {/* YouTube Video Section */}
          {youtubeId && (
            <div className="pt-6 border-t dark:border-gray-700">
              <h2 className="text-2xl font-bold text-yellow-500 mb-4">Watch Recipe Video</h2>
              <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg border dark:border-gray-700">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={recipe.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          FULL-SCREEN INTERACTIVE COOK MODE OVERLAY
         ======================================================== */}
      {isCookModeOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 text-white flex flex-col justify-between p-4 sm:p-8 backdrop-blur-md animate-fadeIn">
          {/* Cook Mode Header */}
          <div className="flex justify-between items-center border-b border-gray-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white shadow">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-extrabold line-clamp-1">{recipe.title}</h2>
                <p className="text-xs text-yellow-400 font-semibold">Cooking Assistant • Step {currentStepIndex + 1} of {stepsList.length}</p>
              </div>
            </div>

            <button
              onClick={() => setIsCookModeOpen(false)}
              className="p-3 bg-gray-800 hover:bg-gray-700 rounded-full transition text-gray-300 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Cook Mode Body */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-auto py-6 max-w-6xl mx-auto w-full">
            {/* Step Navigation & Big Text Display */}
            <div className="lg:col-span-2 space-y-6 flex flex-col justify-center">
              <div className="bg-gray-900/90 border border-gray-800 p-8 sm:p-12 rounded-3xl shadow-2xl min-h-[250px] flex flex-col justify-center space-y-4">
                <span className="text-xs font-bold tracking-widest text-yellow-500 uppercase">
                  Instruction Step #{currentStepIndex + 1}
                </span>
                <p className="text-xl sm:text-3xl font-medium leading-relaxed">
                  {scaleIngredientText(stepsList[currentStepIndex] || "", servingMultiplier)}
                </p>
              </div>

              {/* Prev / Next Controls */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentStepIndex === 0}
                  className={`px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 transition ${
                    currentStepIndex === 0 ? "bg-gray-800 text-gray-600 cursor-not-allowed" : "bg-gray-800 hover:bg-gray-700 text-white"
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" /> Previous Step
                </button>

                <span className="text-sm font-bold text-gray-400">
                  {currentStepIndex + 1} / {stepsList.length}
                </span>

                <button
                  onClick={() => setCurrentStepIndex(prev => Math.min(stepsList.length - 1, prev + 1))}
                  disabled={currentStepIndex === stepsList.length - 1}
                  className={`px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 transition ${
                    currentStepIndex === stepsList.length - 1 ? "bg-gray-800 text-gray-600 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg"
                  }`}
                >
                  Next Step <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sidebar: Kitchen Countdown Timer */}
            <div className="bg-gray-900/90 border border-gray-800 p-6 rounded-3xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-yellow-500 flex items-center gap-2">
                  <Clock className="w-5 h-5" /> Kitchen Timer
                </h3>

                {/* Big Timer Display */}
                <div className="bg-black/60 p-6 rounded-2xl text-center border border-gray-800">
                  <span className="font-mono text-5xl font-extrabold tracking-wider text-yellow-400">
                    {formatTimerTime(timerSeconds)}
                  </span>
                </div>

                {/* Timer Quick Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setTimerSeconds(60)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs font-bold">1 Min</button>
                  <button onClick={() => setTimerSeconds(300)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs font-bold">5 Mins</button>
                  <button onClick={() => setTimerSeconds(600)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs font-bold">10 Mins</button>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  disabled={timerSeconds === 0}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
                    isTimerRunning ? "bg-red-600 hover:bg-red-700 text-white" : "bg-yellow-500 hover:bg-yellow-600 text-white"
                  }`}
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isTimerRunning ? "Pause" : "Start"}
                </button>

                <button
                  onClick={() => { setIsTimerRunning(false); setTimerSeconds(0); }}
                  className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 hover:text-white transition"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Cook Mode Footer Bar */}
          <div className="border-t border-gray-800 pt-4 text-center text-xs text-gray-500">
            Use keyboard arrow keys or buttons to navigate cooking steps. Click X to exit Cook Mode.
          </div>
        </div>
      )}
    </div>
  );
};

export default function RecipeDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">{loader()}</div>}>
      <RecipeContent />
    </Suspense>
  );
}
