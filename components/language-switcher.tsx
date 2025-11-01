import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage()
  return (
    <div className={`flex gap-2 items-center ${className ?? ""}`}>
      <Button
        onClick={() => setLanguage("en")}
        variant={language === "en" ? "default" : "outline"}
        size="sm"
        className="rounded-full px-3"
        aria-label="Switch to English"
      >
        🇺🇸 EN
      </Button>
      <Button
        onClick={() => setLanguage("zh")}
        variant={language === "zh" ? "default" : "outline"}
        size="sm"
        className="rounded-full px-3"
        aria-label="切换到中文"
      >
        🇨🇳 中文
      </Button>
    </div>
  )
}
