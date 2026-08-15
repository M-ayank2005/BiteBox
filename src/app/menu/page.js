"use client";

import React, { useState, useEffect, useRef } from "react";
import { GoogleGenAI } from "@google/genai";
import { useDarkMode } from "../DarkModeContext";
import { 
  Utensils, 
  Sparkles, 
  Refrigerator, 
  Activity, 
  Plus, 
  Check, 
  Clock, 
  Flame, 
  HeartPulse, 
  Scale, 
  ChevronRight,
  RotateCcw,
  BookOpen
} from "lucide-react";
import loader from "@/Components/loader";

export default function MenuPage() {
  const [activeTab, setActiveTab] = useState("planner"); // "planner" | "fridge" | "tracker"
  const { darkMode } = useDarkMode();

  // ==========================================
  // TAB 1: AI MEAL PLANNER STATE
  // ==========================================
  const [goal, setGoal] = useState("Weight Loss");
  const [dietStyle, setDietStyle] = useState("Balanced");
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);

  const healthConditionsList = [
    { id: "diabetes", label: "Diabetic Friendly (Low GI)" },
    { id: "hypertension", label: "Low Sodium (Heart Health)" },
    { id: "gluten", label: "Gluten-Free (Celiac)" },
    { id: "lactose", label: "Lactose-Free" },
    { id: "pcos", label: "PCOS Friendly" }
  ];

  const toggleCondition = (id) => {
    setSelectedConditions(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // ==========================================
  // TAB 2: AI FRIDGE CHEF STATE
  // ==========================================
  const [ingredients, setIngredients] = useState([]);
  const [ingredientInput, setIngredientInput] = useState("");
  const [maxPrepTime, setMaxPrepTime] = useState("30");
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const [fridgeRecipes, setFridgeRecipes] = useState(null);

  const quickIngredients = ["Eggs", "Spinach", "Chicken Breast", "Oats", "Tomatoes", "Rice", "Avocado", "Garlic", "Salmon", "Broccoli"];

  const addIngredient = (item) => {
    const trimmed = item.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients(prev => [...prev, trimmed]);
      setIngredientInput("");
    }
  };

  const removeIngredient = (item) => {
    setIngredients(prev => prev.filter(i => i !== item));
  };

  // ==========================================
  // TAB 3: CALORIE & MACRO TRACKER STATE
  // ==========================================
  const [dailyLog, setDailyLog] = useState([]);
  const [customMeal, setCustomMeal] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });

  // Load saved daily log from localStorage
  useEffect(() => {
    const savedLog = localStorage.getItem("bitebox_daily_log");
    if (savedLog) {
      try {
        setDailyLog(JSON.parse(savedLog));
      } catch (e) {
        console.error("Error loading daily log:", e);
      }
    }
  }, []);

  // Save daily log to localStorage
  useEffect(() => {
    localStorage.setItem("bitebox_daily_log", JSON.stringify(dailyLog));
  }, [dailyLog]);

  const totalConsumed = dailyLog.reduce((acc, meal) => ({
    calories: acc.calories + (Number(meal.calories) || 0),
    protein: acc.protein + (Number(meal.protein) || 0),
    carbs: acc.carbs + (Number(meal.carbs) || 0),
    fat: acc.fat + (Number(meal.fat) || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const logMealItem = (name, calories, protein, carbs, fat) => {
    const newMeal = {
      id: Date.now(),
      name,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setDailyLog(prev => [newMeal, ...prev]);
  };

  const handleAddCustomMeal = (e) => {
    e.preventDefault();
    if (!customMeal.name.trim() || !customMeal.calories) return;
    logMealItem(customMeal.name, customMeal.calories, customMeal.protein, customMeal.carbs, customMeal.fat);
    setCustomMeal({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  };

  const clearDailyLog = () => {
    if (confirm("Reset today's logged meals?")) {
      setDailyLog([]);
    }
  };

  // ==========================================
  // GEMINI AI INTEGRATION
  // ==========================================
  const aiRef = useRef(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (apiKey) {
      aiRef.current = new GoogleGenAI({ apiKey });
    }
  }, []);

  const handleGenerateMealPlan = async () => {
    if (!aiRef.current) {
      alert("AI Service is initializing or API key is missing.");
      return;
    }

    setIsGeneratingPlan(true);
    setGeneratedPlan(null);

    const conditionsText = selectedConditions.length > 0 
      ? healthConditionsList.filter(c => selectedConditions.includes(c.id)).map(c => c.label).join(", ")
      : "None";

    const prompt = `Return a JSON response (and ONLY JSON, no markdown formatting outside) for a daily meal plan tailored to:
Goal: ${goal}
Dietary Preference: ${dietStyle}
Health Concerns/Restrictions: ${conditionsText}
Daily Calorie Target: ${calorieTarget} kcal

Respond strictly in this exact JSON structure:
{
  "summary": "Brief 1-sentence overview of the diet strategy",
  "totalTargetCalories": ${calorieTarget},
  "meals": [
    {
      "type": "Breakfast",
      "name": "Meal Name",
      "description": "Short description",
      "calories": 450,
      "protein": 30,
      "carbs": 45,
      "fat": 15,
      "prepTime": "15 mins"
    },
    {
      "type": "Lunch",
      "name": "Meal Name",
      "description": "Short description",
      "calories": 600,
      "protein": 40,
      "carbs": 60,
      "fat": 20,
      "prepTime": "20 mins"
    },
    {
      "type": "Dinner",
      "name": "Meal Name",
      "description": "Short description",
      "calories": 650,
      "protein": 45,
      "carbs": 55,
      "fat": 22,
      "prepTime": "25 mins"
    },
    {
      "type": "Snack",
      "name": "Meal Name",
      "description": "Short description",
      "calories": 300,
      "protein": 15,
      "carbs": 25,
      "fat": 10,
      "prepTime": "5 mins"
    }
  ]
}`;

    try {
      const response = await aiRef.current.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      let jsonText = response.text || "";
      jsonText = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();

      const parsedData = JSON.parse(jsonText);
      setGeneratedPlan(parsedData);
    } catch (e) {
      console.error("AI Meal Plan generation error:", e);
      alert("Failed to generate AI plan. Please try again.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleGenerateFridgeRecipes = async () => {
    if (ingredients.length === 0) {
      alert("Please add at least 2 ingredients first!");
      return;
    }

    if (!aiRef.current) {
      alert("AI Service is initializing or API key is missing.");
      return;
    }

    setIsGeneratingRecipes(true);
    setFridgeRecipes(null);

    const prompt = `Return ONLY JSON (no markdown wrapping) for 2 creative recipes using these available ingredients: ${ingredients.join(", ")}.
Max Prep Time: ${maxPrepTime} mins.

Respond strictly in this exact JSON structure:
{
  "recipes": [
    {
      "title": "Recipe Title",
      "description": "Short appetizing description",
      "prepTime": "20 mins",
      "calories": 420,
      "protein": 28,
      "carbs": 35,
      "fat": 14,
      "ingredients": ["1 cup ingredient", "2 tbsp ingredient"],
      "instructions": ["Step 1 description", "Step 2 description", "Step 3 description"]
    }
  ]
}`;

    try {
      const response = await aiRef.current.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      let jsonText = response.text || "";
      jsonText = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();

      const parsedData = JSON.parse(jsonText);
      setFridgeRecipes(parsedData.recipes || []);
    } catch (e) {
      console.error("AI Fridge Chef error:", e);
      alert("Failed to generate recipes. Please try again.");
    } finally {
      setIsGeneratingRecipes(false);
    }
  };

  return (
    <main className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Apple Water Glass Hero Banner */}
        <div className="glass-panel text-center p-8 sm:p-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase px-4 py-1.5 rounded-full border border-amber-500/20">
            BiteBox AI Nutrition & Health Companion
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Smart Dietitian & Meal Hub</h1>
          <p className="text-slate-600 dark:text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto">
            Personalized AI meal plans tailored to your health goals, Fridge Chef recipe generator, and daily macro tracking.
          </p>

          {/* Navigation Tab Pills */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              onClick={() => setActiveTab("planner")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition ${
                activeTab === "planner"
                  ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md"
                  : "bg-white/60 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60"
              }`}
            >
              <Utensils className="w-4 h-4" /> AI Meal Planner
            </button>

            <button
              onClick={() => setActiveTab("fridge")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition ${
                activeTab === "fridge"
                  ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md"
                  : "bg-white/60 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60"
              }`}
            >
              <Refrigerator className="w-4 h-4" /> AI Fridge Chef
            </button>

            <button
              onClick={() => setActiveTab("tracker")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition ${
                activeTab === "tracker"
                  ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md"
                  : "bg-white/60 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60"
              }`}
            >
              <Activity className="w-4 h-4" /> Calorie & Macro Tracker
            </button>
          </div>
        </div>

        {/* ========================================================
            TAB 1: AI MEAL PLANNER
           ======================================================== */}
        {activeTab === "planner" && (
          <div className="space-y-8">
            <div className={`p-8 rounded-3xl border shadow-xl ${
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-yellow-500">
                <Sparkles className="w-6 h-6" /> Configure Your Health & Fitness Profile
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Fitness Goal */}
                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-yellow-500" /> Fitness Goal
                  </label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className={`w-full p-3 rounded-xl border font-medium ${
                      darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                    }`}
                  >
                    <option value="Weight Loss">Weight Loss & Lean Body</option>
                    <option value="Muscle Gain">Muscle Gain & Hypertrophy</option>
                    <option value="Maintenance">Weight Maintenance & Vitality</option>
                    <option value="Heart Health">Heart Health & Energy</option>
                  </select>
                </div>

                {/* Dietary Style */}
                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-yellow-500" /> Dietary Style
                  </label>
                  <select
                    value={dietStyle}
                    onChange={(e) => setDietStyle(e.target.value)}
                    className={`w-full p-3 rounded-xl border font-medium ${
                      darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                    }`}
                  >
                    <option value="Balanced">Standard Balanced</option>
                    <option value="Keto">Keto (High Fat, Ultra Low Carb)</option>
                    <option value="Low Carb">Low Carb / High Protein</option>
                    <option value="Vegan">100% Plant-Based Vegan</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Mediterranean">Mediterranean Diet</option>
                  </select>
                </div>

                {/* Daily Calorie Target Slider */}
                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" /> Daily Target Calories
                    </span>
                    <span className="font-bold text-yellow-500">{calorieTarget} kcal</span>
                  </label>
                  <input
                    type="range"
                    min="1200"
                    max="4000"
                    step="50"
                    value={calorieTarget}
                    onChange={(e) => setCalorieTarget(Number(e.target.value))}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1,200 kcal</span>
                    <span>2,500 kcal</span>
                    <span>4,000 kcal</span>
                  </div>
                </div>
              </div>

              {/* Health Conditions / Restrictions */}
              <div className="space-y-3 mb-8">
                <label className="block text-sm font-semibold flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-red-500" /> Health Conditions & Medical Dietary Needs
                </label>
                <div className="flex flex-wrap gap-2">
                  {healthConditionsList.map((cond) => {
                    const isSelected = selectedConditions.includes(cond.id);
                    return (
                      <button
                        key={cond.id}
                        type="button"
                        onClick={() => toggleCondition(cond.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                          isSelected
                            ? "bg-yellow-500 text-white border-yellow-500 shadow-md"
                            : `${darkMode ? "bg-gray-700 border-gray-600 text-gray-300" : "bg-gray-100 border-gray-300 text-gray-700"} hover:border-yellow-500`
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        {cond.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleGenerateMealPlan}
                disabled={isGeneratingPlan}
                className={`w-full py-4 rounded-2xl font-extrabold text-lg text-white bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 shadow-lg hover:shadow-xl transition transform active:scale-98 flex items-center justify-center gap-3 ${
                  isGeneratingPlan ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isGeneratingPlan ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    <span>Gemini AI is crafting your meal plan...</span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" /> Generate Personalized AI Meal Plan
                  </>
                )}
              </button>
            </div>

            {/* Generated AI Plan Display */}
            {generatedPlan && (
              <div className="space-y-6 animate-fadeIn">
                <div className={`p-6 rounded-2xl border ${
                  darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                }`}>
                  <h3 className="text-xl font-bold text-yellow-500 mb-1">AI Nutrition Plan Overview</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{generatedPlan.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {generatedPlan.meals.map((meal, index) => (
                    <div
                      key={index}
                      className={`p-6 rounded-2xl border flex flex-col justify-between space-y-4 shadow-lg ${
                        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold uppercase px-3 py-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-full">
                            {meal.type}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {meal.prepTime}
                          </span>
                        </div>

                        <h4 className="text-lg font-bold mb-1">{meal.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{meal.description}</p>

                        <div className="bg-gray-100 dark:bg-gray-700/50 p-3 rounded-xl space-y-1 text-xs">
                          <div className="flex justify-between font-bold text-yellow-500">
                            <span>Calories</span>
                            <span>{meal.calories} kcal</span>
                          </div>
                          <div className="flex justify-between text-gray-600 dark:text-gray-300">
                            <span>Protein / Carbs / Fat</span>
                            <span>{meal.protein}g / {meal.carbs}g / {meal.fat}g</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => logMealItem(meal.name, meal.calories, meal.protein, meal.carbs, meal.fat)}
                        className="w-full py-2.5 rounded-xl font-bold text-xs bg-yellow-500 hover:bg-yellow-600 text-white transition flex items-center justify-center gap-1.5 shadow"
                      >
                        <Plus className="w-4 h-4" /> Add to Daily Macro Log
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: AI FRIDGE CHEF ("Cook with what you have")
           ======================================================== */}
        {activeTab === "fridge" && (
          <div className="space-y-8">
            <div className={`p-8 rounded-3xl border shadow-xl ${
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-yellow-500">
                <Refrigerator className="w-6 h-6" /> What&apos;s in Your Fridge?
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Add available ingredients and let Gemini AI craft custom step-by-step recipes on the spot!
              </p>

              {/* Ingredient Input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIngredient(ingredientInput))}
                  placeholder="Type an ingredient (e.g. Chicken, Spinach, Cheese)..."
                  className={`flex-1 p-3.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                  }`}
                />
                <button
                  onClick={() => addIngredient(ingredientInput)}
                  className="px-6 py-3.5 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl transition shadow"
                >
                  Add
                </button>
              </div>

              {/* Selected Ingredient Chips */}
              {ingredients.length > 0 && (
                <div className="mb-6">
                  <span className="text-xs font-semibold text-gray-400 block mb-2">Your Ingredients ({ingredients.length}):</span>
                  <div className="flex flex-wrap gap-2">
                    {ingredients.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-3.5 py-1.5 rounded-full bg-yellow-500 text-white text-xs font-bold flex items-center gap-2 shadow"
                      >
                        {item}
                        <button onClick={() => removeIngredient(item)} className="hover:text-red-200 font-extrabold text-sm">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Suggestions */}
              <div className="mb-6">
                <span className="text-xs font-semibold text-gray-400 block mb-2">Quick Add Common Items:</span>
                <div className="flex flex-wrap gap-2">
                  {quickIngredients.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => addIngredient(item)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition border ${
                        ingredients.includes(item)
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : `${darkMode ? "bg-gray-700 border-gray-600 text-gray-300" : "bg-gray-100 border-gray-200 text-gray-700"} hover:border-yellow-500`
                      }`}
                      disabled={ingredients.includes(item)}
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Prep Time Selector */}
              <div className="mb-8">
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" /> Max Cooking Prep Time
                </label>
                <select
                  value={maxPrepTime}
                  onChange={(e) => setMaxPrepTime(e.target.value)}
                  className={`w-full sm:w-64 p-3 rounded-xl border font-medium ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                  }`}
                >
                  <option value="15">Quick & Easy (under 15 mins)</option>
                  <option value="30">Standard Prep (under 30 mins)</option>
                  <option value="45">Gourmet Prep (under 45 mins)</option>
                </select>
              </div>

              {/* Action Button */}
              <button
                onClick={handleGenerateFridgeRecipes}
                disabled={isGeneratingRecipes || ingredients.length === 0}
                className={`w-full py-4 rounded-2xl font-extrabold text-lg text-white bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 shadow-lg hover:shadow-xl transition transform active:scale-98 flex items-center justify-center gap-3 ${
                  isGeneratingRecipes || ingredients.length === 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isGeneratingRecipes ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    <span>Gemini AI is creating recipes...</span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" /> Generate Custom AI Recipes
                  </>
                )}
              </button>
            </div>

            {/* Generated Recipes */}
            {fridgeRecipes && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
                {fridgeRecipes.map((recipe, index) => (
                  <div
                    key={index}
                    className={`p-6 sm:p-8 rounded-3xl border shadow-xl flex flex-col justify-between space-y-6 ${
                      darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-2xl font-extrabold text-yellow-500">{recipe.title}</h3>
                        <span className="text-xs font-bold bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-3 py-1 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {recipe.prepTime}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-300">{recipe.description}</p>

                      {/* Macros Bar */}
                      <div className="bg-gray-100 dark:bg-gray-700/50 p-3 rounded-xl flex justify-between text-xs font-bold">
                        <span className="text-orange-500">{recipe.calories} kcal</span>
                        <span>Protein: {recipe.protein}g</span>
                        <span>Carbs: {recipe.carbs}g</span>
                        <span>Fat: {recipe.fat}g</span>
                      </div>

                      {/* Ingredients list */}
                      <div>
                        <h4 className="font-bold text-sm mb-2 text-yellow-500">Needed Ingredients:</h4>
                        <ul className="list-disc list-inside text-xs space-y-1 text-gray-600 dark:text-gray-300">
                          {recipe.ingredients.map((ing, i) => (
                            <li key={i}>{ing}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Instructions */}
                      <div>
                        <h4 className="font-bold text-sm mb-2 text-yellow-500">Cooking Steps:</h4>
                        <ol className="list-decimal list-inside text-xs space-y-1.5 text-gray-600 dark:text-gray-300">
                          {recipe.instructions.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    </div>

                    <button
                      onClick={() => logMealItem(recipe.title, recipe.calories, recipe.protein, recipe.carbs, recipe.fat)}
                      className="w-full py-3 rounded-xl font-bold text-xs bg-yellow-500 hover:bg-yellow-600 text-white transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <Plus className="w-4 h-4" /> Add to Daily Macro Log
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: CALORIE & MACRO TRACKER
           ======================================================== */}
        {activeTab === "tracker" && (
          <div className="space-y-8">
            {/* Visual Macro Progress Dashboard */}
            <div className={`p-8 rounded-3xl border shadow-xl ${
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2 text-yellow-500">
                    <Activity className="w-6 h-6" /> Daily Calorie & Macro Dashboard
                  </h2>
                  <p className="text-xs text-gray-400">Track your daily intake vs. your target goals</p>
                </div>

                <button
                  onClick={clearDailyLog}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 transition font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Today&apos;s Log
                </button>
              </div>

              {/* Progress Gauges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Calories */}
                <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white p-5 rounded-2xl shadow-lg space-y-2">
                  <span className="text-xs font-extrabold uppercase opacity-80">Calories Consumed</span>
                  <div className="text-3xl font-black">{totalConsumed.calories} <span className="text-sm font-normal opacity-80">/ {calorieTarget} kcal</span></div>
                  <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-white h-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (totalConsumed.calories / calorieTarget) * 100)}%` }} 
                    />
                  </div>
                </div>

                {/* Protein */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-5 rounded-2xl shadow-lg space-y-2">
                  <span className="text-xs font-extrabold uppercase opacity-80">Protein</span>
                  <div className="text-3xl font-black">{totalConsumed.protein}g</div>
                  <div className="text-xs opacity-80">Muscle building & repair</div>
                </div>

                {/* Carbs */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-5 rounded-2xl shadow-lg space-y-2">
                  <span className="text-xs font-extrabold uppercase opacity-80">Carbohydrates</span>
                  <div className="text-3xl font-black">{totalConsumed.carbs}g</div>
                  <div className="text-xs opacity-80">Primary energy source</div>
                </div>

                {/* Fat */}
                <div className="bg-gradient-to-br from-pink-600 to-rose-600 text-white p-5 rounded-2xl shadow-lg space-y-2">
                  <span className="text-xs font-extrabold uppercase opacity-80">Healthy Fats</span>
                  <div className="text-3xl font-black">{totalConsumed.fat}g</div>
                  <div className="text-xs opacity-80">Hormone & brain health</div>
                </div>
              </div>

              {/* Add Custom Meal Form */}
              <div className="border-t pt-6 dark:border-gray-700">
                <h3 className="font-bold text-lg mb-4 text-yellow-500">Quick Log a Custom Meal</h3>
                <form onSubmit={handleAddCustomMeal} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                  <input
                    type="text"
                    placeholder="Meal name (e.g. Protein Smoothie)"
                    value={customMeal.name}
                    onChange={(e) => setCustomMeal(prev => ({ ...prev, name: e.target.value }))}
                    className={`sm:col-span-2 p-3 rounded-xl border text-sm ${
                      darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                    }`}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Calories (kcal)"
                    value={customMeal.calories}
                    onChange={(e) => setCustomMeal(prev => ({ ...prev, calories: e.target.value }))}
                    className={`p-3 rounded-xl border text-sm ${
                      darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                    }`}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Protein (g)"
                    value={customMeal.protein}
                    onChange={(e) => setCustomMeal(prev => ({ ...prev, protein: e.target.value }))}
                    className={`p-3 rounded-xl border text-sm ${
                      darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                    }`}
                  />
                  <input
                    type="number"
                    placeholder="Carbs (g)"
                    value={customMeal.carbs}
                    onChange={(e) => setCustomMeal(prev => ({ ...prev, carbs: e.target.value }))}
                    className={`p-3 rounded-xl border text-sm ${
                      darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                    }`}
                  />
                  <button
                    type="submit"
                    className="p-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-1 text-sm"
                  >
                    <Plus className="w-4 h-4" /> Log Meal
                  </button>
                </form>
              </div>
            </div>

            {/* Today's Logged Meals */}
            <div className={`p-8 rounded-3xl border shadow-xl ${
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}>
              <h3 className="text-xl font-bold mb-4 text-yellow-500">Today&apos;s Logged Meals ({dailyLog.length})</h3>

              {dailyLog.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  No meals logged today yet. Log custom meals or click &quot;Add to Daily Macro Log&quot; from AI generated meal plans!
                </div>
              ) : (
                <div className="space-y-3">
                  {dailyLog.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
                        darkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div>
                        <h4 className="font-bold text-base">{item.name}</h4>
                        <span className="text-xs text-gray-400">Logged at {item.timestamp}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="font-extrabold text-orange-500 block">{item.calories} kcal</span>
                          <span className="text-xs text-gray-400">
                            P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
