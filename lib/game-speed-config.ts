// 游戏速度相关配置，统一管理

export const GAME_SPEED_CONFIG = {
  fruit: {
    move: 0.16, // 水果上升速度
    rotate: 5 / 3, // 水果旋转速度
    spawnInterval: 2000, // 生成间隔(ms)
    maxFruits: 3,
    speedMultiplier: {
      slow: 0.2,    // 水果游戏慢速
      normal: 1,  // 水果游戏中速
      fast: 1.8,      // 水果游戏快速
    },
  },
  monster: {
    move: 2, // 怪物下落速度
    rotate: 0, // 怪物无旋转
    spawnInterval: 2000, // 生成间隔(ms)
    maxMonsters: 3,
    speedMultiplier: {
      slow: 0.4,    // 怪物游戏慢速
      normal: 1.5,  // 怪物游戏中速
      fast: 3,      // 怪物游戏快速
    },
  },
  space: {
    move: 1 / 3, // 陨石下落速度(原速1, 现为1/3)
    rotate: 0, // 陨石无旋转
    spawnInterval: 2000, // 生成间隔(ms)
    maxAsteroids: 3,
    speedMultiplier: {
      slow: 0.2,    // 太空游戏慢速
      normal: 0.8,  // 太空游戏中速
      fast: 2,      // 太空游戏快速
    },
  },
}
