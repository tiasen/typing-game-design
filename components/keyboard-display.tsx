"use client"

import { keyboardLayout, fingerColors, getFingerForKey, type FingerType } from "@/lib/keyboard-layout"
import { useLanguage } from "@/lib/language-context"
import { getTranslation, translations } from "@/lib/i18n"

interface KeyboardDisplayProps {
  currentKey?: string
}

type TranslationKey = keyof typeof translations.en

const fingerKeyMap: Record<FingerType, TranslationKey> = {
  "left-pinky": "leftPinky",
  "left-ring": "leftRing",
  "left-middle": "leftMiddle",
  "left-index": "leftIndex",
  "right-index": "rightIndex",
  "right-middle": "rightMiddle",
  "right-ring": "rightRing",
  "right-pinky": "rightPinky",
  thumb: "thumb",
}

export function KeyboardDisplay({ currentKey }: KeyboardDisplayProps) {
  const { language } = useLanguage()
  const currentFinger = currentKey ? getFingerForKey(currentKey) : null

  return (
    <div className="space-y-3">
      {/* 保持固定高度避免 CLS，使用 opacity 控制显示 */}
      <div
        className={`text-center p-3 bg-muted/50 rounded-xl border-2 border-primary/20 transition-opacity duration-200 ${
          currentKey && currentFinger ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <p className="text-xs text-muted-foreground mb-1">{getTranslation(language, "useFinger")}:</p>
        <div className="flex items-center justify-center gap-2">
          <div className={`w-6 h-6 rounded-full ${currentFinger ? fingerColors[currentFinger] : ""} shadow-lg`} />
          <p className="text-base font-bold text-foreground">
            {currentFinger ? getTranslation(language, fingerKeyMap[currentFinger]) : ""}
          </p>
        </div>
      </div>

      <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 border-2 border-primary/20 shadow-xl">
        <div className="space-y-1.5">
          {keyboardLayout.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1">
              {row.map((keyInfo) => {
                const isActive = currentKey?.toLowerCase() === keyInfo.key.toLowerCase()
                const isHomeRow = rowIndex === 2 && (keyInfo.key === "f" || keyInfo.key === "j")

                return (
                  <div
                    key={keyInfo.key}
                    className={`
                      relative w-9 h-9 rounded-lg flex items-center justify-center
                      font-mono font-bold text-sm transition-all duration-200
                      ${fingerColors[keyInfo.finger]} bg-opacity-40
                      ${isActive ? "ring-4 ring-primary scale-110 bg-opacity-100 shadow-2xl animate-pulse" : ""}
                      ${isHomeRow ? "border-2 border-primary/50" : "border border-gray-300/30"}
                    `}
                  >
                    <span className={isActive ? "text-white" : "text-foreground"}>
                      {keyInfo.display || keyInfo.key.toUpperCase()}
                    </span>
                    {isHomeRow && <div className="absolute bottom-0.5 w-1.5 h-0.5 bg-primary/70 rounded-full" />}
                  </div>
                )
              })}
            </div>
          ))}

          {/* Spacebar */}
          <div className="flex justify-center pt-1">
            <div
              className={`
                w-48 h-9 rounded-lg flex items-center justify-center
                font-mono font-bold text-sm transition-all duration-200
                ${fingerColors.thumb} bg-opacity-40 border border-gray-300/30
                ${currentKey === " " ? "ring-4 ring-primary scale-105 bg-opacity-100 shadow-2xl" : ""}
              `}
            >
              <span className={currentKey === " " ? "text-white" : "text-foreground"}>SPACE</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-primary/20">
          <p className="text-xs text-center text-muted-foreground mb-2">{getTranslation(language, "fingerColors")}:</p>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {(Object.keys(fingerColors) as FingerType[])
              .filter((f) => f !== "thumb")
              .map((finger) => (
                <div key={finger} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full ${fingerColors[finger]} shadow`} />
                  <span className="text-muted-foreground text-xs truncate">
                    {getTranslation(language, fingerKeyMap[finger])}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
