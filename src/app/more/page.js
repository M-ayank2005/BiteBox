'use client';
import React from "react";
import { useDarkMode } from "../DarkModeContext";
import { useRouter } from "next/navigation";
import { ChefHat, Users, Video, ArrowRight } from "lucide-react";
import Footer from "@/Components/Footer";

const FeaturesPage = () => {
  const { darkMode } = useDarkMode();
  const router = useRouter();

  const features = [
    {
      title: "Recipe Community",
      description: "Share your culinary creations, ask questions, and connect with fellow food enthusiasts. Get inspired by diverse recipes from around the world and engage in meaningful discussions about cooking techniques, ingredients, and food culture.",
      icon: <Users className="w-12 h-12" />,
      image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGNvbW11bml0eXxlbnwwfHwwfHx8MA%3D%3D",
      link: "/post"
    },
    {
      title: "Live Cooking Streams",
      description: "Stream your cooking sessions live, interact with viewers in real-time, and showcase your culinary expertise. Share tips, answer questions, and build your cooking community through engaging live demonstrations.",
      icon: <Video className="w-12 h-12" />,
      image: "https://images.unsplash.com/photo-1582581720432-de83a98176ab?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c3RyZWFtaW5nJTIwZm9vZHxlbnwwfHwwfHx8MA%3D%3D",
      link: "/streams"
    }
  ];

  return (
    <>
    <div className={`min-h-screen pb-24 px-7 transition-colors duration-300 ${darkMode ? "bg-zinc-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="text-center">
            <ChefHat className="w-16 h-16 mx-auto mb-8 text-amber-500" />
            <h1 className="text-4xl md:text-6xl font-bold mb-3 ">
              Discover Our Features
            </h1>
            <p className="text-xl md:text-2xl opacity-80 max-w-3xl mx-auto">
              Connect, share, and cook with food enthusiasts from around the world
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="space-y-32">
          {features.map((feature, index) => (
            <div key={feature.title} className="grid md:grid-cols-2 gap-12 items-center glass-panel p-8 sm:p-12">
              <div className={`space-y-6 ${index % 2 === 1 ? "md:order-2" : ""}`}>
                <div className="inline-block p-4 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-500 shadow-sm">
                  {feature.icon}
                </div>
                <h2 className="text-3xl font-bold">{feature.title}</h2>
                <p className="text-lg opacity-80">
                  {feature.description}
                </p>
                <button 
                  onClick={() => router.push(feature.link)}
                  className="group flex items-center gap-2 px-8 py-3.5 rounded-full font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all transform active:scale-95"
                >
                  Explore
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              <div className={`${index % 2 === 1 ? "md:order-1" : ""}`}>
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform">
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 ${darkMode ? "bg-gradient-to-br from-amber-500/20" : "bg-gradient-to-br from-amber-500/10"}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
        <Footer />
  </>
  );
};

export default FeaturesPage;