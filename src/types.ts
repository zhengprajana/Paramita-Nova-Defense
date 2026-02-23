export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST',
}

export interface Point {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
}

export interface EnemyRocket extends Entity {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1
  speed: number;
}

export interface PlayerMissile extends Entity {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1
  speed: number;
}

export interface Explosion extends Entity {
  radius: number;
  maxRadius: number;
  growthRate: number;
  isExpanding: boolean;
}

export interface Battery {
  id: number;
  x: number;
  y: number;
  ammo: number;
  maxAmmo: number;
  isDestroyed: boolean;
}

export interface City {
  id: number;
  x: number;
  y: number;
  isDestroyed: boolean;
}
