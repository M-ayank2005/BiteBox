'use client'

import React, { useState, useEffect } from 'react'
import Navbar from '@/Components/Navbar'
import Footer from '@/Components/Footer'
import Section from '@/Components/Section'
import Card from '@/Components/card'
import { useDarkMode } from './DarkModeContext'
import { useRouter } from 'next/navigation'
import { 
  ChefHat, 
  Utensils, 
  Video, 
  MessageCircle, 
  PenSquare, 
  ShoppingCart, 
  Sparkles, 
  ArrowRight,
  Flame,
  Award
} from 'lucide-react'
import { UserAuth } from './context/AuthContext' 
import recipes from '../lib/Homepagerecipe.json'

export default function Home() {
  const { darkMode } = useDarkMode()
  const router = useRouter()
  const { user } = UserAuth()

  const attributes = [
    'Health-Conscious',
    'Gourmet',
    'Adventurous',
    'Vegan',
    'Sweet-Toothed',
    'Local Foodie',
  ]

  const [currentAttribute, setCurrentAttribute] = useState('')
  const [index, setIndex] = useState(0)
  const [typing, setTyping] = useState(true)
  const [charIndex, setCharIndex] = useState(0)
  const [isPausing, setIsPausing] = useState(false)

  // Show only 3-4 featured recipes on Home page
  const featuredRecipes = recipes.slice(0, 4);

  useEffect(() => {
    let timeout
    if (typing) {
      if (charIndex < attributes[index].length) {
        timeout = setTimeout(() => {
          setCurrentAttribute((prev) => prev + attributes[index][charIndex])
          setCharIndex((prev) => prev + 1)
        }, 100)
      } else {
        setTyping(false)
        setIsPausing(true)
        timeout = setTimeout(() => setIsPausing(false), 1500)
      }
    } else if (!typing && !isPausing) {
      if (charIndex > 0) {
        timeout = setTimeout(() => {
          setCurrentAttribute((prev) => prev.slice(0, -1))
          setCharIndex((prev) => prev - 1)
        }, 80)
      } else {
        setTyping(true)
        setIndex((prevIndex) => (prevIndex + 1) % attributes.length)
      }
    }
    return () => clearTimeout(timeout)
  }, [typing, charIndex, index, isPausing])

  const featureCards = [
    {
      title: 'AI Diet & Health Hub',
      desc: 'Personalized meal plans tailored to health goals, diabetic needs, and macro targets.',
      icon: Flame,
      color: 'bg-amber-500 text-white',
      link: '/menu'
    },
    {
      title: 'AI Fridge Chef',
      desc: 'Cook with what you have! Enter pantry ingredients to get instant recipes.',
      icon: Sparkles,
      color: 'bg-emerald-500 text-white',
      link: '/menu'
    },
    {
      title: 'Live Cooking Streams',
      desc: 'Watch culinary broadcasts or stream your own kitchen sessions live in real-time.',
      icon: Video,
      color: 'bg-red-500 text-white',
      link: '/streams'
    },
    {
      title: 'Recipe Catalog & Remixes',
      desc: 'Explore community recipes with dietary multi-filters or fork your own remix.',
      icon: Utensils,
      color: 'bg-amber-600 text-white',
      link: '/recipes'
    },
    {
      title: 'AI Culinary Assistant',
      desc: 'Chat 24/7 with your personal AI chef for cooking advice and ingredient subs.',
      icon: MessageCircle,
      color: 'bg-indigo-500 text-white',
      link: '/chat'
    },
    {
      title: 'Publish Recipe',
      desc: 'Share your recipes with our rich open-source WYSIWYG formatting editor.',
      icon: PenSquare,
      color: 'bg-blue-500 text-white',
      link: user ? '/postrecipe' : '/LoginPage'
    },
    {
      title: 'Smart Shopping List',
      desc: 'Manage saved grocery items exported from recipes and AI meal plans.',
      icon: ShoppingCart,
      color: 'bg-teal-500 text-white',
      link: '/profile'
    },
    {
      title: 'Chef Profiles & Badges',
      desc: 'Earn community badges for hosting streams, tracking macros, and posting recipes.',
      icon: Award,
      color: 'bg-purple-500 text-white',
      link: '/profile'
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <Navbar />

      {/* Clean Hero Section (No Heavy Gradients) */}
      <div className={`py-16 px-4 sm:px-6 lg:px-8 border-b ${darkMode ? 'bg-gray-800/50 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mx-auto">
            <ChefHat className="w-4 h-4" /> Welcome to BiteBox Community
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            Are You A <span className="text-amber-500">{currentAttribute}</span>
            <span className="animate-pulse">|</span> Foodie?
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Your all-in-one AI culinary hub. Plan healthy meals, cook step-by-step, stream live, and manage smart grocery lists.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button
              onClick={() => router.push('/recipes')}
              className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow transition flex items-center gap-2 text-sm"
            >
              Explore Recipes <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => router.push('/menu')}
              className={`px-6 py-3.5 font-bold rounded-xl border transition text-sm flex items-center gap-2 ${
                darkMode ? 'border-gray-700 bg-gray-800 hover:bg-gray-700 text-white' : 'border-gray-300 bg-white hover:bg-gray-100 text-gray-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" /> AI Diet Planner
            </button>
          </div>
        </div>
      </div>

      {/* Main Features Hub Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold">Explore BiteBox Features</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Everything you need to discover, cook, and connect in one clean platform</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                onClick={() => router.push(card.link)}
                className={`p-6 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-lg hover:border-amber-500/50 ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center shadow-md`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg">{card.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{card.desc}</p>
                </div>

                <div className="pt-4 mt-4 border-t dark:border-gray-700/50 flex items-center text-xs font-bold text-amber-500 group">
                  Open Feature <ArrowRight className="w-3.5 h-3.5 ml-1 transition group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Uncluttered Featured Recipes Section (Only 4 Items) */}
      <div className={`py-16 border-t ${darkMode ? 'bg-gray-800/30 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-extrabold">Featured Recipes</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hand-picked culinary favorites from our community</p>
            </div>

            <button
              onClick={() => router.push('/recipes')}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition shadow flex items-center gap-1.5"
            >
              See All Recipes ({recipes.length}+) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredRecipes.map((recipe) => (
              <Card
                key={recipe.id}
                id={recipe.id}
                imageSrc={recipe.imageLink}
                title={recipe.title}
                description={recipe.instruction.slice(0, 60) + '...'}
              />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
