"use client";

import React, { useState, useEffect } from "react";
import Image from "next/legacy/image";
import { useDarkMode } from "../DarkModeContext";
import { UserAuth } from "../context/AuthContext";
import Loader from "@/Components/loader";
import { useRouter } from "next/navigation";
import { 
  Award, 
  ShoppingCart, 
  ChefHat, 
  Radio, 
  Flame, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Square, 
  LogOut, 
  User, 
  Calendar,
  Sparkles,
  Utensils
} from "lucide-react";

function ProfilePage() {
  const { darkMode } = useDarkMode();
  const { user, logOut } = UserAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("shopping"); // "shopping" | "badges" | "macros"
  const [shoppingList, setShoppingList] = useState([]);
  const [customItem, setCustomItem] = useState("");
  const [checkedItems, setCheckedItems] = useState({});
  const [macroLog, setMacroLog] = useState([]);

  // Load saved shopping list & macro logs from localStorage
  useEffect(() => {
    try {
      const savedList = JSON.parse(localStorage.getItem("bitebox_shopping_list") || "[]");
      setShoppingList(savedList);

      const savedMacros = JSON.parse(localStorage.getItem("bitebox_daily_log") || "[]");
      setMacroLog(savedMacros);

      const savedChecked = JSON.parse(localStorage.getItem("bitebox_checked_groceries") || "{}");
      setCheckedItems(savedChecked);
    } catch (e) {
      console.error("Error loading profile storage:", e);
    }
  }, []);

  // Save checked items state to localStorage
  useEffect(() => {
    localStorage.setItem("bitebox_checked_groceries", JSON.stringify(checkedItems));
  }, [checkedItems]);

  const toggleCheckItem = (itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleAddCustomGrocery = (e) => {
    e.preventDefault();
    if (!customItem.trim()) return;

    const newItem = {
      id: "custom_" + Date.now(),
      recipeTitle: "Custom Item",
      content: customItem.trim(),
      addedAt: new Date().toLocaleDateString()
    };

    const updated = [newItem, ...shoppingList];
    setShoppingList(updated);
    localStorage.setItem("bitebox_shopping_list", JSON.stringify(updated));
    setCustomItem("");
  };

  const handleClearShoppingList = () => {
    if (confirm("Clear all items from your shopping list?")) {
      setShoppingList([]);
      setCheckedItems({});
      localStorage.removeItem("bitebox_shopping_list");
      localStorage.removeItem("bitebox_checked_groceries");
    }
  };

  const handleRemoveRecipeFromList = (recipeId) => {
    const updated = shoppingList.filter(item => item.id !== recipeId);
    setShoppingList(updated);
    localStorage.setItem("bitebox_shopping_list", JSON.stringify(updated));
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Earned Community Badges Logic
  const badges = [
    {
      id: "host",
      title: "Master Streamer",
      desc: "Hosted live WebRTC cooking broadcasts",
      icon: Radio,
      color: "bg-red-500",
      earned: true
    },
    {
      id: "chef",
      title: "Nutritional Guru",
      desc: "Created AI meal plans & custom recipes",
      icon: ChefHat,
      color: "bg-amber-500",
      earned: true
    },
    {
      id: "tracker",
      title: "Macro Streak Master",
      desc: "Consistently tracked daily nutrition goals",
      icon: Flame,
      color: "bg-orange-500",
      earned: macroLog.length > 0
    },
    {
      id: "shopper",
      title: "Smart Grocery Shopper",
      desc: "Exported recipe ingredients to shopping list",
      icon: ShoppingCart,
      color: "bg-emerald-500",
      earned: shoppingList.length > 0
    }
  ];

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
    }`}>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Profile Header Card */}
        <div className={`p-8 rounded-3xl border shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}>
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-yellow-500 overflow-hidden shadow-lg flex-shrink-0">
              <Image
                src={user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"}
                alt="Profile Avatar"
                width={112}
                height={112}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold">{user.displayName || "BiteBox Chef"}</h1>
                <span className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs font-bold px-3 py-1 rounded-full border border-yellow-500/30">
                  Pro Chef
                </span>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>

              <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-gray-400 pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-yellow-500" /> Joined {user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "Recently"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm bg-red-600 hover:bg-red-700 text-white transition shadow active:scale-95"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("shopping")}
            className={`pb-4 px-6 font-bold text-sm flex items-center gap-2 border-b-2 transition ${
              activeTab === "shopping"
                ? "border-yellow-500 text-yellow-500"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <ShoppingCart className="w-4 h-4" /> Smart Shopping List ({shoppingList.length})
          </button>

          <button
            onClick={() => setActiveTab("badges")}
            className={`pb-4 px-6 font-bold text-sm flex items-center gap-2 border-b-2 transition ${
              activeTab === "badges"
                ? "border-yellow-500 text-yellow-500"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Award className="w-4 h-4" /> Chef Achievement Badges
          </button>

          <button
            onClick={() => setActiveTab("macros")}
            className={`pb-4 px-6 font-bold text-sm flex items-center gap-2 border-b-2 transition ${
              activeTab === "macros"
                ? "border-yellow-500 text-yellow-500"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Flame className="w-4 h-4" /> Daily Nutrition History
          </button>
        </div>

        {/* ========================================================
            TAB 1: SMART GROCERY SHOPPING LIST
           ======================================================== */}
        {activeTab === "shopping" && (
          <div className="space-y-6">
            <div className={`p-8 rounded-3xl border shadow-xl ${
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2 text-yellow-500">
                    <ShoppingCart className="w-6 h-6" /> Your Smart Grocery List
                  </h2>
                  <p className="text-xs text-gray-400">Exported ingredients from saved recipes & AI meal plans</p>
                </div>

                {shoppingList.length > 0 && (
                  <button
                    onClick={handleClearShoppingList}
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 transition font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear All Items
                  </button>
                )}
              </div>

              {/* Add Custom Grocery Item Form */}
              <form onSubmit={handleAddCustomGrocery} className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={customItem}
                  onChange={(e) => setCustomItem(e.target.value)}
                  placeholder="Add custom item (e.g. 1 Gallon Whole Milk, Olive Oil)..."
                  className={`flex-1 p-3 rounded-xl border text-sm ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                  }`}
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl transition shadow text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </form>

              {/* Shopping List Items */}
              {shoppingList.length === 0 ? (
                <div className="text-center py-12 text-gray-400 space-y-2">
                  <ShoppingCart className="w-12 h-12 mx-auto text-gray-500 mb-2" />
                  <p className="font-bold">Your shopping list is empty!</p>
                  <p className="text-xs">Click "Save to Shopping List" on any recipe page to export ingredients here.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {shoppingList.map((group) => (
                    <div
                      key={group.id}
                      className={`p-6 rounded-2xl border ${
                        darkMode ? "bg-gray-700/40 border-gray-600" : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3 pb-2 border-b dark:border-gray-600">
                        <span className="font-bold text-sm text-yellow-500">{group.recipeTitle}</span>
                        <button
                          onClick={() => handleRemoveRecipeFromList(group.id)}
                          className="text-xs text-red-400 hover:text-red-600 font-semibold"
                        >
                          Remove Section
                        </button>
                      </div>

                      <div 
                        className="prose prose-sm dark:prose-invert max-w-none space-y-2"
                        dangerouslySetInnerHTML={{ __html: group.content }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: CHEF ACHIEVEMENT BADGES
           ======================================================== */}
        {activeTab === "badges" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {badges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.id}
                  className={`p-6 rounded-3xl border shadow-xl flex items-start gap-5 ${
                    darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl ${badge.color} text-white flex items-center justify-center shadow-md flex-shrink-0`}>
                    <Icon className="w-7 h-7" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{badge.title}</h3>
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-green-500/20 text-green-500">
                        UNLOCKED
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{badge.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================
            TAB 3: DAILY NUTRITION HISTORY
           ======================================================== */}
        {activeTab === "macros" && (
          <div className={`p-8 rounded-3xl border shadow-xl ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}>
            <h2 className="text-2xl font-bold mb-4 text-yellow-500 flex items-center gap-2">
              <Flame className="w-6 h-6" /> Daily Macro Log History
            </h2>

            {macroLog.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                No nutrition meals logged yet today. Log meals in the AI Health Hub under `/menu`!
              </div>
            ) : (
              <div className="space-y-3">
                {macroLog.map((meal) => (
                  <div
                    key={meal.id}
                    className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
                      darkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div>
                      <h4 className="font-bold">{meal.name}</h4>
                      <span className="text-xs text-gray-400">Logged at {meal.timestamp}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-orange-500 block">{meal.calories} kcal</span>
                      <span className="text-xs text-gray-400">P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fat}g</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;