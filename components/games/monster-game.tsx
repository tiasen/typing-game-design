"use client";

import type React from "react";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Stage } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { getAudioManager } from "@/lib/audio";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import { generateStageContent } from "@/lib/content-generator";
import { GAME_SPEED_CONFIG } from "@/lib/game-speed-config";

interface Monster {
  id: number;
  word: string;
  position: number;
  health: number;
  x: number; // 固定的水平位置
}

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

interface MonsterGameProps {
  stage: Stage;
  userId: string;
  userName: string;
  onBack: () => void;
}

export function MonsterGame({
  stage,
  userId,
  userName,
  onBack,
}: MonsterGameProps) {
  // 所有 hooks 必须在组件顶部声明
  const { t, gameSpeed } = useLanguage();
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [totalTyped, setTotalTyped] = useState(0);
  const [errors, setErrors] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [nextMonsterId, setNextMonsterId] = useState(0);
  const [practiceContent] = useState(() => generateStageContent(stage.id));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 500;

  const spawnMonster = useCallback(() => {
    const word =
      practiceContent[Math.floor(Math.random() * practiceContent.length)];
    const newMonster: Monster = {
      id: nextMonsterId,
      word,
      position: 0,
      health: word.length,
      x: Math.random() * 70, // 生成时确定固定的水平位置
    };
    setNextMonsterId((prev) => prev + 1);
    setMonsters((prev) => [...prev, newMonster]);
  }, [practiceContent, nextMonsterId]);

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

  const getSpeedMultiplier = () => {
    return GAME_SPEED_CONFIG.monster.speedMultiplier[gameSpeed] ?? GAME_SPEED_CONFIG.monster.speedMultiplier.normal;
  };
  const speedMultiplier = getSpeedMultiplier();

  // 移除 setInterval 怪物移动逻辑，全部由 requestAnimationFrame 控制

  useEffect(() => {
    if (!isPlaying || isComplete) return;
    const maxMonsters = GAME_SPEED_CONFIG.monster.maxMonsters;
    const interval = GAME_SPEED_CONFIG.monster.spawnInterval / speedMultiplier;
    const spawnInterval = setInterval(() => {
      if (monsters.length < maxMonsters) {
        spawnMonster();
      }
    }, interval);
    return () => clearInterval(spawnInterval);
  }, [isPlaying, isComplete, monsters.length, spawnMonster, speedMultiplier]);

  const handleStart = () => {
    setIsPlaying(true);
    setMonsters([]);
    setScore(0);
    setTimeLeft(60);
    setTotalTyped(0);
    setErrors(0);
    setCombo(0);
    setMaxCombo(0);
    setIsComplete(false);
    spawnMonster();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    const audioManager = getAudioManager();

    // Find monster whose word starts with current input
    const matchingMonster = monsters.find((m) => m.word.startsWith(value));

    // If input exactly matches a monster word -> defeat monster
    if (matchingMonster && value === matchingMonster.word) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);

      // Base score: 10 points per character
      const baseScore = matchingMonster.word.length * 10;
      // Combo bonus: 3 points per combo count (Monster game slightly harder)
      const comboBonus = newCombo * 3;
      // Speed multiplier bonus based on game speed
      const speedBonus = Math.floor(baseScore * (speedMultiplier - 1));

      setScore((prev) => prev + baseScore + comboBonus + speedBonus);
      setTotalTyped((prev) => prev + matchingMonster.word.length);

      audioManager.playSuccess();

      // 计算怪物在canvas上的中心坐标
      const x = (matchingMonster.x / 100) * CANVAS_WIDTH;
      const y = ((matchingMonster.position * 10) / 100) * CANVAS_HEIGHT + 40;
      const explosionParticles: Particle[] = ["💥", "⭐", "✨", "💫", "🌟"].map(
        (emoji, i) => ({
          id: Date.now() + i,
          x,
          y,
          emoji,
        })
      );
      setParticles((prev) => [...prev, ...explosionParticles]);
      setTimeout(() => {
        setParticles((prev) =>
          prev.filter((p) => !explosionParticles.find((ep) => ep.id === p.id))
        );
      }, 1000);

      // Remove defeated monster and maybe spawn a new one
      setMonsters((prev) => prev.filter((m) => m.id !== matchingMonster.id));
      setInput("");
      if (monsters.length <= 1) {
        spawnMonster();
      }
    } else if (!matchingMonster && value.length > 0) {
      // No monster matches this input -> error
      audioManager.playError();
      setErrors((prev) => prev + 1);
      setCombo(0);
      // Small score penalty, not below 0
      setScore((prev) => Math.max(0, prev - 5));
      setInput("");
    }
  };

  const saveScore = useCallback(async () => {
    const timeElapsed = (60 - timeLeft) / 60;
    const calculatedWpm = Math.round(totalTyped / 5 / timeElapsed);
    const calculatedAccuracy =
      totalTyped > 0
        ? Math.round(((totalTyped - errors) / totalTyped) * 100)
        : 100;

    setWpm(calculatedWpm);
    setAccuracy(calculatedAccuracy);

    const supabase = createClient();
    await supabase.from("game_scores").insert({
      user_id: userId,
      stage_id: stage.id,
      game_type: "monster",
      wpm: calculatedWpm,
      accuracy: calculatedAccuracy,
      score,
      duration: 60 - timeLeft,
    });

    const audioManager = getAudioManager();
    audioManager.playComplete();
  }, [userId, stage.id, score, timeLeft, totalTyped, errors]);

  useEffect(() => {
    if (isComplete && !isPlaying) {
      saveScore();
    }
  }, [isComplete, isPlaying, saveScore]);

  // 动画循环：怪物移动、粒子动画
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();
    function animate(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      // 怪物移动和边界检测
      if (isPlaying && !isComplete) {
        setMonsters((prev) => {
          // 移动怪物
          let updated = prev.map((monster) => ({
            ...monster,
            position: monster.position + dt * GAME_SPEED_CONFIG.monster.move * speedMultiplier,
          }));
          // 移除到达底部的怪物
          updated = updated.filter(
            (m) => ((m.position * 10) / 100) * CANVAS_HEIGHT + 40 < CANVAS_HEIGHT - 56
          );
          return updated;
        });
        // 粒子动画
        setParticles((prev) =>
          prev.map((p) => ({ ...p, y: p.y - 40 * dt })).filter((p) => p.y > 0)
        );
      }
      // 绘制
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          monsters.forEach((monster) => {
            ctx.font = "48px serif";
            ctx.textAlign = "center";
            ctx.fillText(
              "👾",
              (monster.x / 100) * CANVAS_WIDTH,
              ((monster.position * 10) / 100) * CANVAS_HEIGHT + 40
            );
            ctx.font = "20px monospace";
            ctx.fillStyle = "#333";
            ctx.fillText(
              monster.word,
              (monster.x / 100) * CANVAS_WIDTH,
              ((monster.position * 10) / 100) * CANVAS_HEIGHT + 80
            );
          });
          particles.forEach((particle) => {
            ctx.font = "32px serif";
            ctx.fillText(particle.emoji, particle.x, particle.y);
          });
          ctx.font = "56px serif";
          ctx.fillText("🛡️", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
        }
      }
      animationId = requestAnimationFrame(animate);
    }
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, isComplete, speedMultiplier, monsters, particles, CANVAS_HEIGHT]);

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-4 border-accent/50 shadow-2xl rounded-3xl animate-bounce-in">
          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
              <div className="text-7xl mb-4 animate-float">🏆</div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {t("gameOver")}
              </h2>
              <p className="text-xl text-muted-foreground">
                {t("greatJob")}, {userName}!
              </p>
            </div>
            <div className="space-y-3 bg-muted/30 rounded-2xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">{t("score")}:</span>
                <span className="text-2xl font-bold text-primary">{score}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">{t("speed")}:</span>
                <span className="text-2xl font-bold text-accent">
                  {wpm} {t("wpm")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">{t("accuracy")}:</span>
                <span className="text-2xl font-bold text-secondary">
                  {accuracy}%
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleStart}
                className="w-full h-12 text-lg rounded-2xl shadow-lg"
              >
                {t("playAgain")}
              </Button>
              <Button
                onClick={onBack}
                variant="outline"
                className="w-full h-12 text-lg rounded-2xl border-2 bg-transparent"
              >
                {t("chooseDifferentGame")}
              </Button>
              <Button
                variant="ghost"
                className="w-full h-12 text-lg rounded-2xl"
                asChild
              >
                <Link href="/dashboard">{t("backToDashboard")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isPlaying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-4 border-primary/20 shadow-2xl rounded-3xl animate-bounce-in">
          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
              <div className="text-7xl mb-4 animate-wiggle">👾</div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {t("monsterTyping")}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t("monsterDesc")}
              </p>
            </div>
            <div className="bg-muted/30 rounded-2xl p-4 space-y-2">
              <p className="text-center font-medium">{t("howToPlay")}</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Type the words shown on monsters</li>
                <li>• Complete words to defeat them</li>
                <li>• Don't let monsters reach you!</li>
                <li>• You have 60 seconds</li>
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleStart}
                className="w-full h-12 text-lg rounded-2xl shadow-lg"
              >
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

  // Canvas相关变量已在顶部声明，无需重复声明

  return (
    <div className="min-h-screen flex flex-col p-6">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="text-4xl">👾</div>
          <div>
            <p className="text-sm text-muted-foreground">{t("score")}</p>
            <p className="text-2xl font-bold text-primary">{score}</p>
          </div>
        </div>

        {/* Combo Display */}
         <div className={`flex flex-col items-center transition-all duration-300 ${combo > 1 ? 'opacity-100 scale-110' : 'opacity-0 scale-90'}`}>
          <span className="text-sm font-bold text-purple-500 uppercase tracking-widest">Combo</span>
          <span className="text-4xl font-black text-purple-600 drop-shadow-md">{combo}x</span>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">{t("timeLeft")}</p>
          <p className="text-3xl font-bold text-destructive">{timeLeft}s</p>
        </div>
      </div>

      {/* Canvas Game Area */}
      <div className="flex-1 flex items-center justify-center bg-card/50 rounded-3xl border-4 border-primary/20 p-8 overflow-hidden min-h-[400px]">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            background: "#fff",
            borderRadius: 24,
            border: "2px solid #eee",
            width: 800,
            height: 500,
            display: "block",
          }}
        />
      </div>

      {/* Input Area */}
      <div className="mt-6">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          className="w-full h-16 text-2xl text-center rounded-2xl border-4 border-primary/30 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all"
          placeholder="Type here..."
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
