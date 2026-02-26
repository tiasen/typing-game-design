"use client"

import { motion, AnimatePresence } from "framer-motion"

interface ProgressMascotProps {
  progress: number // 0 to 100
}

export function ProgressMascot({ progress }: ProgressMascotProps) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  return (
    <div className="relative w-full h-24 mb-6 mx-auto max-w-4xl">
      {/* Track Background - Grass/Road */}
      <div className="absolute inset-x-0 bottom-0 h-4 bg-green-200/60 rounded-full overflow-hidden">
          {/* Dashed line */}
         <div className="w-full h-full border-t-2 border-green-400/50 border-dashed mt-1.5"></div>
      </div>

      {/* Goal Flag */}
      <div className="absolute right-0 bottom-2 text-3xl z-10 transform translate-x-1/2">
        🏁
      </div>

      {/* Mascot Container */}
      <motion.div 
        className="absolute bottom-2 will-change-transform z-20"
        style={{ left: `${clampedProgress}%` }}
        initial={{ x: "-50%" }}
        animate={{ 
          x: "-50%",
          left: `${clampedProgress}%` 
        }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="relative mb-1">
          {/* The Mascot */}
          <motion.div
            animate={{ 
              y: [0, -8, 0],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 0.6,
              ease: "easeInOut"
            }}
            className="text-5xl filter drop-shadow-lg transform -scale-x-100 cursor-help"
            title="Keep going!"
          >
            🐰
          </motion.div>
          
          {/* Speech Bubble for Encouragement */}
          <AnimatePresence>
          {clampedProgress > 5 && clampedProgress < 95 && (
            <motion.div
              initial={{ opacity: 0, scale: 0, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0 }}
              key={Math.floor(clampedProgress / 20)} // Change message every 20%
              className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-2xl text-xs font-bold border-2 border-primary shadow-sm whitespace-nowrap z-30"
            >
              {getEncouragement(clampedProgress)}
              {/* Arrow */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b-2 border-r-2 border-primary rotate-45 transform"></div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </motion.div>
      
      {/* Progress Fill behind the mascot */}
      <div 
        className="absolute left-0 bottom-0 h-4 bg-green-400/30 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${clampedProgress}%` }}
      />
    </div>
  )
}

function getEncouragement(progress: number): string {
  if (progress < 20) return "Go! Go! 🚀"
  if (progress < 40) return "Good job! 👍"
  if (progress < 60) return "Keep it up! 🔥"
  if (progress < 80) return "Almost there! 🏃"
  return "Final sprint! ⚡"
}
