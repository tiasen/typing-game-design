"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/language-context";
import { getAudioManager } from "@/lib/audio";

interface FroggerGameProps {
  onBack: () => void;
}

const EN_WORDS = [
  "frog",
  "river",
  "jump",
  "log",
  "leaf",
  "safe",
  "water",
  "duck",
  "fish",
  "lily",
];

const ZH_WORDS = [
  "青蛙",
  "小河",
  "木头",
  "荷叶",
  "安全",
  "过河",
  "小鱼",
  "小鸭",
  "跳跃",
  "水面",
];

export function FroggerGame({ onBack }: FroggerGameProps) {
  const { t, language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 500;
  type RiverRow = 1 | 2 | 3;

  interface LilyPad {
    id: number;
    row: RiverRow;
    x: number; // 0-100, 百分比位置
    speed: number; // 每秒移动的百分比速度
    word: string;
    isTarget: boolean;
  }
  const [frogRow, setFrogRow] = useState(0); // 0 底部岸边，4 顶部岸边
  const [currentWord, setCurrentWord] = useState("");
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [totalTyped, setTotalTyped] = useState(0);
  const [errors, setErrors] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
    const [pads, setPads] = useState<LilyPad[]>([]);
    const [nextPadId, setNextPadId] = useState(0);
    const [frogX, setFrogX] = useState(() => CANVAS_WIDTH / 2);

  const wordPool = language === "zh" ? ZH_WORDS : EN_WORDS;

  const randomWord = () => {
    return wordPool[Math.floor(Math.random() * wordPool.length)];
  };

  const resetGame = () => {
    setFrogRow(0);
    setFrogX(CANVAS_WIDTH / 2);
    setScore(0);
    setTimeLeft(60);
    setIsComplete(false);
    setTotalTyped(0);
    setErrors(0);
    setCombo(0);
    setMaxCombo(0);
    setWpm(0);
    setAccuracy(100);
    setStartTime(null);
    setInput("");

    // 初始化荷叶（本地生成完整列表后一次性设置 state，避免竞态）
    const rows: RiverRow[] = [1, 2, 3];
    let created: LilyPad[] = [];
    let idCounter = 0;

    rows.forEach((row) => {
      const count = 3;
      for (let i = 0; i < count; i++) {
        const baseX = 20 + i * 30 + (Math.random() * 10 - 5); // 3 片分布在河面
        const dir = Math.random() < 0.5 ? -1 : 1;
        const speed = dir * (3 + Math.random() * 4); // 3-7 %/s
        created.push({
          id: idCounter++,
          row,
          x: baseX,
          speed,
          word: randomWord(),
          isTarget: false,
        });
      }
    });

    // 为第 1 行指定一个目标荷叶，并设置 currentWord
    const row1Pads = created.filter((p) => p.row === 1);
    if (row1Pads.length > 0) {
      const targetPad = row1Pads[Math.floor(Math.random() * row1Pads.length)];
      const nextWord = randomWord();

      created = created.map((p) => {
        if (p.row !== 1) return p;
        if (p.id === targetPad.id) {
          return {
            ...p,
            isTarget: true,
            word: nextWord,
          };
        }

        // 其它荷叶显示不同的随机词，尽量避免和目标一样
        let otherWord = randomWord();
        let tries = 0;
        while (otherWord === nextWord && tries < 3) {
          otherWord = randomWord();
          tries++;
        }

        return {
          ...p,
          isTarget: false,
          word: otherWord,
        };
      });

      setCurrentWord(nextWord);
    } else {
      // 理论上不会发生，没有第 1 行时退回到一个占位词
      setCurrentWord("");
    }

    setNextPadId(idCounter);
    setPads(created);
  };

  const setTargetForRow = (row: RiverRow) => {
    let nextWord = currentWord;
    setPads((prev) => {
      const rowPads = prev.filter((p) => p.row === row);
      if (rowPads.length === 0) return prev;
      const targetPad = rowPads[Math.floor(Math.random() * rowPads.length)];
      nextWord = randomWord();

      return prev.map((p) => {
        if (p.row !== row) return p;
        if (p.id === targetPad.id) {
          return {
            ...p,
            isTarget: true,
            word: nextWord,
          };
        }

        // 其它荷叶显示不同的随机词，尽量避免和目标一样
        let otherWord = randomWord();
        let tries = 0;
        while (otherWord === nextWord && tries < 3) {
          otherWord = randomWord();
          tries++;
        }

        return {
          ...p,
          isTarget: false,
          word: otherWord,
        };
      });
    });

    setCurrentWord(nextWord);
  };

  const handleStart = () => {
    resetGame();
    setIsPlaying(true);
    setStartTime(Date.now());
    const audioManager = getAudioManager();
    audioManager.playSuccess();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };
  // 使用 canvas 绘制场景并让荷叶漂移
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const BANK_HEIGHT = 80;

    const draw = (ctx: CanvasRenderingContext2D, padsToDraw: LilyPad[]) => {
      // 清空画布
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 背景天空
      const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGradient.addColorStop(0, "#e0f2fe");
      skyGradient.addColorStop(1, "#a7f3d0");
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 顶部和底部岸边
      ctx.fillStyle = "#bbf7d0";
      ctx.fillRect(0, 0, CANVAS_WIDTH, BANK_HEIGHT);
      ctx.fillRect(0, CANVAS_HEIGHT - BANK_HEIGHT, CANVAS_WIDTH, BANK_HEIGHT);

      // 岸边文字
      ctx.fillStyle = "#166534";
      ctx.font = "24px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        language === "zh" ? "安全岸边" : "Safe Bank",
        CANVAS_WIDTH / 2,
        BANK_HEIGHT / 2,
      );
      ctx.fillText(
        language === "zh" ? "起点" : "Start",
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT - BANK_HEIGHT / 2,
      );

      // 河流区域
      const riverTop = BANK_HEIGHT;
      const riverBottom = CANVAS_HEIGHT - BANK_HEIGHT;
      const riverHeight = riverBottom - riverTop;
      const riverGradient = ctx.createLinearGradient(0, riverTop, 0, riverBottom);
      riverGradient.addColorStop(0, "#38bdf8");
      riverGradient.addColorStop(1, "#0ea5e9");
      ctx.fillStyle = riverGradient;
      ctx.fillRect(0, riverTop, CANVAS_WIDTH, riverHeight);

      // 每一行对应的 Y 位置
      const rowGap = riverHeight / 4;
      const rowYs: Record<RiverRow, number> = {
        1: riverBottom - rowGap,
        2: riverBottom - rowGap * 2,
        3: riverBottom - rowGap * 3,
      };

      // 画荷叶
      padsToDraw.forEach((pad) => {
        const centerY = rowYs[pad.row];
        const centerX = (pad.x / 100) * CANVAS_WIDTH;
        const radiusX = 55;
        const radiusY = 26;

        ctx.save();
        ctx.translate(centerX, centerY);

        // 荷叶底色
        ctx.beginPath();
        ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.fillStyle = pad.isTarget ? "#22c55e" : "#16a34a";
        ctx.fill();

        // 高光和边缘
        ctx.strokeStyle = pad.isTarget ? "#bbf7d0" : "#14532d";
        ctx.lineWidth = pad.isTarget ? 3 : 2;
        ctx.stroke();

        // 叶脉
        ctx.strokeStyle = "#15803d";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(radiusX * 0.8, 0);
        ctx.stroke();

        // 文字
        ctx.fillStyle = "#ecfdf5";
        ctx.font = "16px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pad.word, 0, 0);

        ctx.restore();
      });

      // 青蛙位置：0 底部岸边，1~3 河流木头，4 顶部岸边
      const frogYPositions = [
        CANVAS_HEIGHT - BANK_HEIGHT / 2,
        rowYs[1],
        rowYs[2],
        rowYs[3],
        BANK_HEIGHT / 2,
      ];
      const clampedRow = Math.max(0, Math.min(4, frogRow));
      const frogY = frogYPositions[clampedRow];

      // 阴影
      if (clampedRow > 0 && clampedRow < 4) {
        ctx.fillStyle = "rgba(15, 118, 110, 0.18)";
        ctx.beginPath();
        ctx.ellipse(frogX, frogY + 26, 50, 16, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 青蛙
      ctx.font = "64px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🐸", frogX, frogY);
    };

    const step = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationId = requestAnimationFrame(step);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationId = requestAnimationFrame(step);
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      let padsSnapshot = pads;
      if (isPlaying && !isComplete) {
        // 让荷叶水平漂移
        setPads((prev) => {
          const updated = prev.map((pad) => {
            let newX = pad.x + pad.speed * dt;
            if (newX < 0) newX = 100 + newX;
            if (newX > 100) newX = newX - 100;
            return { ...pad, x: newX };
          });
          padsSnapshot = updated;
          return updated;
        });
      }

      draw(ctx, padsSnapshot);
      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationId);
  }, [pads, frogRow, frogX, language, isPlaying, isComplete, CANVAS_WIDTH, CANVAS_HEIGHT]);

  // 倒计时
  useEffect(() => {
    if (!isPlaying || isComplete) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsPlaying(false);
          setIsComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, isComplete]);

  // 结束时计算 WPM / 准确率
  useEffect(() => {
    if (!isComplete || startTime === null) return;
    const elapsedMinutes = Math.max((Date.now() - startTime) / 1000 / 60, 1 / 60);
    const calculatedWpm = Math.round(totalTyped / 5 / elapsedMinutes);
    const calculatedAccuracy =
      totalTyped > 0 ? Math.round(((totalTyped - errors) / totalTyped) * 100) : 100;
    setWpm(calculatedWpm);
    setAccuracy(calculatedAccuracy);
    const audioManager = getAudioManager();
    audioManager.playComplete();
  }, [isComplete, startTime, totalTyped, errors]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    if (!isPlaying || isComplete) return;

    e.preventDefault();
    const value = input.trim();
    if (!currentWord) return;

    const audioManager = getAudioManager();

    // 成功：完整输入了当前目标单词
    if (value === currentWord) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);

      const baseScore = currentWord.length * 10;
      const comboBonus = newCombo * 2;
      setScore((prev) => prev + baseScore + comboBonus);
      setTotalTyped((prev) => prev + currentWord.length);

      audioManager.playSuccess();

      setFrogRow((prevRow) => {
        const nextRow = Math.min(prevRow + 1, 4);

        // 跳到对应行的目标荷叶 X 位置
        if (nextRow >= 1 && nextRow <= 3) {
          const row = nextRow as RiverRow;
          setPads((prev) => {
            const targetPad = prev.find((p) => p.row === row && p.isTarget);
            if (targetPad) {
              setFrogX((targetPad.x / 100) * CANVAS_WIDTH);
            }
            return prev;
          });

          // 为下一行设置新的目标荷叶
          const nextTargetRow = ((nextRow + 1) as RiverRow | 4) as number;
          if (nextTargetRow >= 1 && nextTargetRow <= 3) {
            setTargetForRow(nextTargetRow as RiverRow);
          }
        } else if (nextRow === 4) {
          setFrogX(CANVAS_WIDTH / 2);
        }

        if (nextRow >= 4) {
          // 到达终点
          setIsPlaying(false);
          setIsComplete(true);
        }
        return nextRow;
      });

      setInput("");
      return;
    }

    // 失败：按下回车但没有打对
    if (value.length > 0) {
      audioManager.playError();
      setErrors((prev) => prev + 1);
      setCombo(0);
      setTotalTyped((prev) => prev + value.length);
      setInput("");
    }
  };

  if (!isPlaying && !isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-sky-100 via-emerald-100 to-blue-100">
        <Card className="max-w-md w-full border-4 border-primary/20 shadow-2xl rounded-3xl animate-bounce-in">
          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
              <div className="text-7xl mb-4 animate-float">🐸</div>
              <h2 className="text-3xl font-bold text-foreground mb-2">{t("froggerTyping")}</h2>
              <p className="text-lg text-muted-foreground">{t("froggerDesc")}</p>
            </div>
            <div className="bg-muted/30 rounded-2xl p-4 space-y-2">
              <p className="text-center font-medium">{t("howToPlay")}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("froggerInstructions")}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={handleStart} className="w-full h-12 text-lg rounded-2xl shadow-lg">
                {t("startGame")}
              </Button>
              <Button
                onClick={onBack}
                variant="outline"
                className="w-full h-12 text-lg rounded-2xl border-2 bg-transparent"
              >
                {t("back")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-sky-100 via-emerald-100 to-blue-100">
        <Card className="max-w-md w-full border-4 border-accent/50 shadow-2xl rounded-3xl animate-bounce-in">
          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
              <div className="text-7xl mb-4 animate-float">🏆</div>
              <h2 className="text-3xl font-bold text-foreground mb-2">{t("gameOver")}</h2>
              <p className="text-lg text-muted-foreground">{t("greatJob")}</p>
            </div>
            <div className="space-y-3 bg-muted/30 rounded-2xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">{t("score")}:</span>
                <span className="text-2xl font-bold text-primary">{score}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">{t("speed")}:</span>
                <span className="text-2xl font-bold text-accent">{wpm} {t("wpm")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">{t("accuracy")}:</span>
                <span className="text-2xl font-bold text-secondary">{accuracy}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Combo:</span>
                <span className="text-2xl font-bold text-emerald-500">{maxCombo}x</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={handleStart} className="w-full h-12 text-lg rounded-2xl shadow-lg">
                {t("playAgain")}
              </Button>
              <Button
                onClick={onBack}
                variant="outline"
                className="w-full h-12 text-lg rounded-2xl border-2 bg-transparent"
              >
                {t("back")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 游戏进行中界面
  return (
    <div className="min-h-screen flex flex-col p-6 bg-gradient-to-b from-sky-100 via-emerald-100 to-blue-100">
      {/* 顶部信息条 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="text-4xl">🐸</div>
          <div>
            <p className="text-sm text-muted-foreground">{t("score")}</p>
            <p className="text-2xl font-bold text-primary">{score}</p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">{t("timeLeft")}</p>
          <p className="text-3xl font-bold text-destructive">{timeLeft}s</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Combo</p>
          <p className="text-2xl font-bold text-emerald-600">{combo}x</p>
        </div>
      </div>

      {/* 河流区域（Canvas） */}
      <div className="flex-1 flex items-center justify-center bg-card/50 rounded-3xl border-4 border-primary/20 p-8 overflow-hidden min-h-[400px]">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            background: "#fff",
            borderRadius: 24,
            border: "2px solid #e5e7eb",
            width: 800,
            height: 500,
            display: "block",
          }}
        />
      </div>

      {/* 输入区 */}
      <div className="mt-6">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          className="w-full h-16 text-2xl text-center rounded-2xl border-4 border-emerald-400 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-200 transition-all bg-white/90"
          placeholder={language === "zh" ? "在这里输入单词..." : "Type the word here..."}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          onBlur={() => {
            setTimeout(() => {
              inputRef.current?.focus();
            }, 100);
          }}
        />
      </div>
    </div>
  );
}
