/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Target, Trophy, AlertTriangle, RefreshCw, Globe } from 'lucide-react';
import { GameStatus, EnemyRocket, PlayerMissile, Explosion, Battery, City, Point } from './types';

const WIN_SCORE = 1000;
const POINTS_PER_KILL = 20;
const EXPLOSION_MAX_RADIUS = 350;
const EXPLOSION_GROWTH_RATE = 5.0;
const ROCKET_SPEED_MIN = 0.00025;
const ROCKET_SPEED_MAX = 0.00075;
const MISSILE_SPEED = 0.02;

export default function App() {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [score, setScore] = useState(0);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  
  // Game entities refs to avoid re-renders during game loop
  const rocketsRef = useRef<EnemyRocket[]>([]);
  const missilesRef = useRef<PlayerMissile[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const scoreRef = useRef(0);
  const batteriesRef = useRef<Battery[]>([]);
  const citiesRef = useRef<City[]>([]);

  const t = {
    zh: {
      title: "波罗蜜新星防御",
      start: "开始游戏",
      win: "任务成功",
      lose: "防线崩溃",
      restart: "再玩一次",
      score: "得分",
      target: "目标",
      ammo: "弹药",
      instructions: "点击屏幕拦截敌方火箭。保护城市和炮台。",
      winMsg: "你成功保卫了星系！",
      loseMsg: "所有炮台已被摧毁，城市沦陷。"
    },
    en: {
      title: "Paramita Nova Defense",
      start: "Start Game",
      win: "Mission Success",
      lose: "Defense Collapsed",
      restart: "Play Again",
      score: "Score",
      target: "Target",
      ammo: "Ammo",
      instructions: "Click to intercept enemy rockets. Protect cities and batteries.",
      winMsg: "You successfully defended the galaxy!",
      loseMsg: "All batteries destroyed. The cities have fallen."
    }
  }[language];

  const initGame = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const initialBatteries: Battery[] = [
      { id: 0, x: width * 0.1, y: height - 40, ammo: 20, maxAmmo: 20, isDestroyed: false },
      { id: 1, x: width * 0.5, y: height - 40, ammo: 40, maxAmmo: 40, isDestroyed: false },
      { id: 2, x: width * 0.9, y: height - 40, ammo: 20, maxAmmo: 20, isDestroyed: false },
    ];

    const initialCities: City[] = [
      { id: 0, x: width * 0.25, y: height - 30, isDestroyed: false },
      { id: 1, x: width * 0.35, y: height - 30, isDestroyed: false },
      { id: 2, x: width * 0.45, y: height - 30, isDestroyed: false },
      { id: 3, x: width * 0.55, y: height - 30, isDestroyed: false },
      { id: 4, x: width * 0.65, y: height - 30, isDestroyed: false },
      { id: 5, x: width * 0.75, y: height - 30, isDestroyed: false },
    ];

    setBatteries(initialBatteries);
    setCities(initialCities);
    setScore(0);
    scoreRef.current = 0;
    batteriesRef.current = initialBatteries;
    citiesRef.current = initialCities;
    rocketsRef.current = [];
    missilesRef.current = [];
    explosionsRef.current = [];
  }, []);

  const spawnRocket = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Target either a city or a battery
    const targets = [...citiesRef.current, ...batteriesRef.current].filter(t => !t.isDestroyed);
    if (targets.length === 0) return;

    const target = targets[Math.floor(Math.random() * targets.length)];
    
    const rocket: EnemyRocket = {
      id: Math.random().toString(36).substr(2, 9),
      startX: Math.random() * width,
      startY: 0,
      targetX: target.x,
      targetY: target.y,
      x: 0,
      y: 0,
      progress: 0,
      speed: ROCKET_SPEED_MIN + Math.random() * (ROCKET_SPEED_MAX - ROCKET_SPEED_MIN)
    };
    
    rocketsRef.current.push(rocket);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (status !== GameStatus.PLAYING) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Find closest battery with ammo
    let bestBattery: Battery | null = null;
    let minDist = Infinity;

    batteriesRef.current.forEach(b => {
      if (!b.isDestroyed && b.ammo > 0) {
        const dist = Math.abs(b.x - x);
        if (dist < minDist) {
          minDist = dist;
          bestBattery = b;
        }
      }
    });

    if (bestBattery) {
      // Fire missile
      const batteryIndex = batteriesRef.current.findIndex(b => b.id === (bestBattery as Battery).id);
      const updatedBatteries = [...batteriesRef.current];
      updatedBatteries[batteryIndex].ammo -= 1;
      batteriesRef.current = updatedBatteries;
      setBatteries(updatedBatteries);

      const missile: PlayerMissile = {
        id: Math.random().toString(36).substr(2, 9),
        startX: (bestBattery as Battery).x,
        startY: (bestBattery as Battery).y,
        targetX: x,
        targetY: y,
        x: (bestBattery as Battery).x,
        y: (bestBattery as Battery).y,
        progress: 0,
        speed: MISSILE_SPEED
      };
      missilesRef.current.push(missile);
    }
  };

  const update = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;

    // 1. Update Rockets
    rocketsRef.current = rocketsRef.current.filter(rocket => {
      rocket.progress += rocket.speed;
      rocket.x = rocket.startX + (rocket.targetX - rocket.startX) * rocket.progress;
      rocket.y = rocket.startY + (rocket.targetY - rocket.startY) * rocket.progress;

      if (rocket.progress >= 1) {
        // Hit target
        const hitCity = citiesRef.current.find(c => Math.abs(c.x - rocket.targetX) < 5 && !c.isDestroyed);
        if (hitCity) {
          hitCity.isDestroyed = true;
          setCities([...citiesRef.current]);
        }
        const hitBattery = batteriesRef.current.find(b => Math.abs(b.x - rocket.targetX) < 5 && !b.isDestroyed);
        if (hitBattery) {
          hitBattery.isDestroyed = true;
          setBatteries([...batteriesRef.current]);
        }
        
        // Create impact explosion
        explosionsRef.current.push({
          id: Math.random().toString(36).substr(2, 9),
          x: rocket.targetX,
          y: rocket.targetY,
          radius: 2,
          maxRadius: 20,
          growthRate: 1.5,
          isExpanding: true
        });

        return false;
      }
      return true;
    });

    // 2. Update Player Missiles
    missilesRef.current = missilesRef.current.filter(missile => {
      missile.progress += missile.speed;
      missile.x = missile.startX + (missile.targetX - missile.startX) * missile.progress;
      missile.y = missile.startY + (missile.targetY - missile.startY) * missile.progress;

      if (missile.progress >= 1) {
        // Create explosion
        explosionsRef.current.push({
          id: Math.random().toString(36).substr(2, 9),
          x: missile.targetX,
          y: missile.targetY,
          radius: 2,
          maxRadius: EXPLOSION_MAX_RADIUS,
          growthRate: EXPLOSION_GROWTH_RATE,
          isExpanding: true
        });
        return false;
      }
      return true;
    });

    // 3. Update Explosions
    explosionsRef.current = explosionsRef.current.filter(exp => {
      if (exp.isExpanding) {
        exp.radius += exp.growthRate;
        if (exp.radius >= exp.maxRadius) {
          exp.isExpanding = false;
        }
      } else {
        exp.radius -= exp.growthRate * 0.5;
      }
      return exp.radius > 0;
    });

    // 4. Collision Detection (Explosions vs Rockets)
    explosionsRef.current.forEach(exp => {
      rocketsRef.current = rocketsRef.current.filter(rocket => {
        const dx = rocket.x - exp.x;
        const dy = rocket.y - exp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < exp.radius) {
          scoreRef.current += POINTS_PER_KILL;
          setScore(scoreRef.current);
          
          // Chain reaction explosion
          explosionsRef.current.push({
            id: Math.random().toString(36).substr(2, 9),
            x: rocket.x,
            y: rocket.y,
            radius: 2,
            maxRadius: EXPLOSION_MAX_RADIUS * 0.8,
            growthRate: EXPLOSION_GROWTH_RATE,
            isExpanding: true
          });
          return false;
        }
        return true;
      });
    });

    // 5. Spawn logic
    if (Math.random() < 0.0075 + (scoreRef.current / 10000)) {
      spawnRocket();
    }

    // 6. Win/Loss Check
    if (scoreRef.current >= WIN_SCORE) {
      setStatus(GameStatus.WON);
    }
    if (batteriesRef.current.every(b => b.isDestroyed)) {
      setStatus(GameStatus.LOST);
    }
  }, [status, spawnRocket]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    // Draw Mountains (Background)
    ctx.fillStyle = '#111114';
    ctx.beginPath();
    ctx.moveTo(0, height - 20);
    ctx.lineTo(width * 0.1, height - 150);
    ctx.lineTo(width * 0.2, height - 80);
    ctx.lineTo(width * 0.35, height - 220);
    ctx.lineTo(width * 0.5, height - 100);
    ctx.lineTo(width * 0.65, height - 180);
    ctx.lineTo(width * 0.8, height - 60);
    ctx.lineTo(width * 0.9, height - 140);
    ctx.lineTo(width, height - 20);
    ctx.fill();

    ctx.fillStyle = '#1a1a1e';
    ctx.beginPath();
    ctx.moveTo(0, height - 20);
    ctx.lineTo(width * 0.15, height - 100);
    ctx.lineTo(width * 0.3, height - 50);
    ctx.lineTo(width * 0.45, height - 120);
    ctx.lineTo(width * 0.6, height - 70);
    ctx.lineTo(width * 0.75, height - 110);
    ctx.lineTo(width * 0.9, height - 40);
    ctx.lineTo(width, height - 20);
    ctx.fill();

    // Draw Ground
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, height - 20, width, 20);

    // Draw Cities
    citiesRef.current.forEach(city => {
      if (!city.isDestroyed) {
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(city.x - 15, height - 35, 30, 15);
        // Windows
        ctx.fillStyle = '#fde047';
        ctx.fillRect(city.x - 10, height - 30, 4, 4);
        ctx.fillRect(city.x + 6, height - 30, 4, 4);
      } else {
        ctx.fillStyle = '#451a03';
        ctx.fillRect(city.x - 15, height - 25, 30, 5);
      }
    });

    // Draw Batteries
    batteriesRef.current.forEach(b => {
      if (!b.isDestroyed) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#10b981';
        ctx.fillStyle = '#065f46'; // Darker base
        // Tower Base
        ctx.fillRect(b.x - 15, height - 60, 30, 40);
        
        ctx.fillStyle = '#10b981'; // Lighter top
        // Tower Top
        ctx.fillRect(b.x - 20, height - 70, 40, 12);
        
        // Gun Barrel
        ctx.fillRect(b.x - 4, height - 85, 8, 15);
        
        ctx.shadowBlur = 0;
        
        // Ammo indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(b.ammo.toString(), b.x, height - 95);
      } else {
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(b.x - 20, height - 25, 40, 5);
      }
    });

    // Draw Rockets
    rocketsRef.current.forEach(r => {
      // Calculate angle for orientation
      const angle = Math.atan2(r.targetY - r.startY, r.targetX - r.startX);
      
      // Rocket Trail (Smoke)
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
      ctx.lineWidth = 4;
      ctx.setLineDash([5, 15]);
      ctx.beginPath();
      ctx.moveTo(r.startX, r.startY);
      ctx.lineTo(r.x, r.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(angle);

      // Exhaust Flame
      const flameSize = 40 + Math.random() * 20;
      const gradient = ctx.createLinearGradient(-flameSize, 0, 0, 0);
      gradient.addColorStop(0, 'rgba(255, 68, 68, 0)');
      gradient.addColorStop(0.5, '#f97316');
      gradient.addColorStop(1, '#fde047');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-flameSize, -12);
      ctx.lineTo(-flameSize * 0.8, 0);
      ctx.lineTo(-flameSize, 12);
      ctx.closePath();
      ctx.fill();

      // Missile Body (Cylinder)
      ctx.fillStyle = '#4b5563'; // Dark gray metal
      ctx.fillRect(-60, -15, 75, 30);
      
      // Nose Cone
      ctx.fillStyle = '#ef4444'; // Red tip
      ctx.beginPath();
      ctx.moveTo(15, -15);
      ctx.lineTo(60, 0);
      ctx.lineTo(15, 15);
      ctx.closePath();
      ctx.fill();

      // Fins
      ctx.fillStyle = '#1f2937';
      // Top Fin
      ctx.beginPath();
      ctx.moveTo(-60, -15);
      ctx.lineTo(-80, -35);
      ctx.lineTo(-30, -15);
      ctx.fill();
      // Bottom Fin
      ctx.beginPath();
      ctx.moveTo(-60, 15);
      ctx.lineTo(-80, 35);
      ctx.lineTo(-30, 15);
      ctx.fill();

      // Highlights for "3D" look
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-60, -8);
      ctx.lineTo(15, -8);
      ctx.stroke();

      ctx.restore();
    });

    // Draw Player Missiles
    missilesRef.current.forEach(m => {
      // Calculate angle for orientation
      const angle = Math.atan2(m.targetY - m.startY, m.targetX - m.startX);

      // Missile Trail Glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#60a5fa';
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.4)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(m.startX, m.startY);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();

      // Target X with Glow
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#60a5fa';
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m.targetX - 6, m.targetY - 6);
      ctx.lineTo(m.targetX + 6, m.targetY + 6);
      ctx.moveTo(m.targetX + 6, m.targetY - 6);
      ctx.lineTo(m.targetX - 6, m.targetY + 6);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(angle);

      // Interceptor Body
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-15, -4, 20, 8);
      
      // Interceptor Tip
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.moveTo(5, -4);
      ctx.lineTo(15, 0);
      ctx.lineTo(5, 4);
      ctx.closePath();
      ctx.fill();

      // Small Blue Glow at back
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#60a5fa';
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.arc(-15, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
    });

    // Draw Explosions
    explosionsRef.current.forEach(e => {
      const gradient = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.4, '#fde047');
      gradient.addColorStop(0.7, '#f97316');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
    });

  }, []);

  const gameLoop = useCallback(() => {
    update();
    draw();
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [update, draw]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      requestRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      draw(); // Final draw for static screens
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [status, gameLoop, draw]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        initGame();
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [initGame]);

  const startGame = () => {
    initGame();
    setStatus(GameStatus.PLAYING);
  };

  return (
    <div className="game-container font-sans">
      <canvas
        ref={canvasRef}
        onMouseDown={handleCanvasClick}
        onTouchStart={handleCanvasClick}
        className="w-full h-full"
      />

      {/* HUD */}
      {status === GameStatus.PLAYING && (
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-4 shadow-2xl">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Target className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{t.score}</p>
              <p className="text-2xl font-display font-bold text-white leading-none">{score}</p>
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-4 shadow-2xl">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{t.target}</p>
              <p className="text-2xl font-display font-bold text-white leading-none">{WIN_SCORE}</p>
            </div>
          </div>
        </div>
      )}

      {/* Language Toggle */}
      <button 
        onClick={() => setLanguage(l => l === 'zh' ? 'en' : 'zh')}
        className="absolute bottom-6 right-6 bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full transition-all border border-white/10 z-50"
      >
        <Globe className="w-5 h-5" />
      </button>

      {/* Menus */}
      <AnimatePresence>
        {status !== GameStatus.PLAYING && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 z-40"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-[2.5rem] p-10 text-center shadow-2xl"
            >
              {status === GameStatus.START && (
                <>
                  <div className="w-20 h-20 bg-blue-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <Target className="w-10 h-10 text-blue-400" />
                  </div>
                  <h1 className="text-4xl font-display font-bold mb-4 tracking-tight">{t.title}</h1>
                  <p className="text-zinc-400 mb-10 leading-relaxed">{t.instructions}</p>
                  <button
                    onClick={startGame}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                  >
                    {t.start}
                  </button>
                </>
              )}

              {status === GameStatus.WON && (
                <>
                  <div className="w-20 h-20 bg-yellow-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <Trophy className="w-10 h-10 text-yellow-400" />
                  </div>
                  <h1 className="text-4xl font-display font-bold mb-4 text-yellow-400">{t.win}</h1>
                  <p className="text-zinc-400 mb-4">{t.winMsg}</p>
                  <div className="bg-white/5 rounded-2xl p-6 mb-10">
                    <p className="text-sm text-zinc-500 uppercase tracking-widest mb-1">{t.score}</p>
                    <p className="text-5xl font-display font-bold">{score}</p>
                  </div>
                  <button
                    onClick={startGame}
                    className="w-full bg-white text-black font-bold py-5 rounded-2xl transition-all hover:bg-zinc-200 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    {t.restart}
                  </button>
                </>
              )}

              {status === GameStatus.LOST && (
                <>
                  <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <AlertTriangle className="w-10 h-10 text-red-400" />
                  </div>
                  <h1 className="text-4xl font-display font-bold mb-4 text-red-500">{t.lose}</h1>
                  <p className="text-zinc-400 mb-10">{t.loseMsg}</p>
                  <button
                    onClick={startGame}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-5 rounded-2xl transition-all active:scale-95"
                  >
                    {t.restart}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
