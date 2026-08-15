'use client'

import React from 'react'
import Image from "next/legacy/image"
import { useRouter } from "next/navigation";
import { useDarkMode } from '../app/DarkModeContext'

const Card = ({ id, imageSrc, title, description }) => {
  const router = useRouter();
  const { darkMode } = useDarkMode();

  const handleinstructionpage = () => {
    router.push(`/homemenuview?id=${encodeURIComponent(id)}`);
  };

  return (
    <div className="glass-card overflow-hidden flex flex-col justify-between group">
      <div>
        <div className="relative w-full h-48 bg-slate-900">
          <Image
            src={imageSrc}
            alt={title}
            layout="fill"
            objectFit="cover"
            className="group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="p-5 space-y-2">
          <h2 className="text-lg font-bold line-clamp-1 group-hover:text-amber-500 transition">{title}</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="p-5 pt-0">
        <button
          onClick={handleinstructionpage}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-full text-xs transition shadow-sm"
        >
          View Recipe
        </button>
      </div>
    </div>
  )
}

export default Card
