"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface ComboDisplayProps {
  combo: number
}

export function ComboDisplay({ combo }: ComboDisplayProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (combo > 1) {
      setShow(true)
    } else {
      setShow(false)
    }
  }, [combo])

  if (!show) return null

  return (
    <AnimatePresence>
      {combo > 1 && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          key={combo} // Re-animate on every combo change
          className="absolute top-4 right-4 z-10 pointer-events-none"
        >
          <div className="flex flex-col items-center">
            <motion.div 
              className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-xl"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, -5, 5, 0]
              }}
              transition={{ duration: 0.2 }}
            >
              {combo}x
            </motion.div>
            <div className="text-lg font-bold text-orange-400 uppercase tracking-widest bg-white/80 px-2 rounded-lg">Combo!</div>
            {combo % 10 === 0 && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: -40, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute top-full mt-2 text-4xl"
              >
                🔥
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
