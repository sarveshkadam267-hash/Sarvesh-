import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { audio } from '../utils/audio';
import { Trophy, Timer, Zap, AlertCircle, Play, Sparkles, ChevronRight } from 'lucide-react';

interface BubbleShooterProps {
  opponentName: string;
  opponentLevel: number;
  opponentAvatar: string;
  entryFee: number;
  prizePool: number;
  onGameOver: (userScore: number, opponentScore: number, won: boolean) => void;
}

// Grid dimensions
const ROWS = 9;
const COLS = 8;
const BUBBLE_RADIUS = 16;
const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;
const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 440;

const COLORS = {
  red: '#ff4444',
  blue: '#3b82f6',
  yellow: '#eab308',
  green: '#22c55e',
  purple: '#a855f7',
  pink: '#ec4899',
};

const DARK_COLORS = {
  red: '#991b1b',
  blue: '#1e40af',
  yellow: '#854d0e',
  green: '#166534',
  purple: '#6b21a8',
  pink: '#9d174d',
};

type ColorName = keyof typeof COLORS;
const COLOR_KEYS = Object.keys(COLORS) as ColorName[];

interface GridBubble {
  color: ColorName;
  row: number;
  col: number;
}

interface FlyingBubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: ColorName;
}

interface FallingBubble {
  x: number;
  y: number;
  color: ColorName;
  vy: number;
  vx: number;
  alpha: number;
}

interface Particle {
  x: number;
  y: number;
  color: ColorName;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
}

export default function BubbleShooter({
  opponentName,
  opponentLevel,
  opponentAvatar,
  entryFee,
  prizePool,
  onGameOver,
}: BubbleShooterProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Game states
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const isPlayingRef = useRef(false);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    hasStartedRef.current = hasStarted;
  }, [hasStarted]);
  const [userScore, setUserScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute limit!
  const [isGameOverTriggered, setIsGameOverTriggered] = useState(false);

  // Core gameplay states
  const gridRef = useRef<(ColorName | null)[][]>([]);
  const currentBubbleRef = useRef<ColorName>('red');
  const nextBubbleRef = useRef<ColorName>('blue');
  const flyingBubbleRef = useRef<FlyingBubble | null>(null);
  const fallingBubblesRef = useRef<FallingBubble[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  
  // Angle of launcher
  const angleRef = useRef<number>(-Math.PI / 2);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: CANVAS_WIDTH / 2, y: 0 });

  // Score popups list
  const [scorePopups, setScorePopups] = useState<{ id: string; text: string; x: number; y: number }[]>([]);

  // Initialize bubble grid
  const initializeGrid = () => {
    const tempGrid: (ColorName | null)[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: (ColorName | null)[] = [];
      for (let c = 0; c < COLS; c++) {
        // Stagger rows: even rows have COLS, odd rows have COLS (or we can stagger coordinates)
        if (r < 4) {
          const randColor = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
          row.push(randColor);
        } else {
          row.push(null);
        }
      }
      tempGrid.push(row);
    }
    gridRef.current = tempGrid;
    currentBubbleRef.current = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
    nextBubbleRef.current = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
    setUserScore(0);
    setOpponentScore(0);
    setTimeLeft(60);
    setIsGameOverTriggered(false);
    fallingBubblesRef.current = [];
    particlesRef.current = [];
    flyingBubbleRef.current = null;
  };

  // Get bubble centers based on grid indices with row staggering
  const getBubbleCoords = (row: number, col: number) => {
    // Stagger odd rows to the right by half a radius
    const xOffset = (row % 2 === 1) ? BUBBLE_RADIUS : 0;
    const x = col * BUBBLE_DIAMETER + BUBBLE_RADIUS + xOffset;
    // Staggered vertical step is smaller than diameter: sqrt(3)/2 * diameter ≈ 27.7
    const y = row * 28 + BUBBLE_RADIUS;
    return { x, y };
  };

  // Swap current and next bubbles
  const handleSwapBubbles = () => {
    if (flyingBubbleRef.current) return;
    const temp = currentBubbleRef.current;
    currentBubbleRef.current = nextBubbleRef.current;
    nextBubbleRef.current = temp;
    audio.playThud();
  };

  // Launch bubble
  const handleLaunchBubble = () => {
    if (!isPlaying || flyingBubbleRef.current) return;

    audio.playWhoosh();
    
    const speed = 10;
    const vx = Math.cos(angleRef.current) * speed;
    const vy = Math.sin(angleRef.current) * speed;

    flyingBubbleRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 35,
      vx,
      vy,
      color: currentBubbleRef.current,
    };

    // Roll next colors
    currentBubbleRef.current = nextBubbleRef.current;
    nextBubbleRef.current = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
  };

  // Trigger game start
  const handleStartGame = () => {
    initializeGrid();
    setHasStarted(true);
    setIsPlaying(true);
    audio.playCoin();
  };

  // Timer effect
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsPlaying(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying]);

  // Simulated Opponent score climber
  useEffect(() => {
    if (!isPlaying) return;

    // Scale opponent growth based on entryFee difficulty
    let averageOpponentScore = 200; // Practice
    if (entryFee >= 50) {
      averageOpponentScore = 1200; // Master
    } else if (entryFee >= 20) {
      averageOpponentScore = 750; // Pro
    } else if (entryFee >= 5) {
      averageOpponentScore = 400; // Beginner
    }

    // Interval to increase score
    const scoreInterval = setInterval(() => {
      // Stagger increments every 3 seconds on average
      const randomIncrement = Math.floor((averageOpponentScore / 20) + Math.random() * (averageOpponentScore / 15));
      setOpponentScore((prev) => prev + randomIncrement);
    }, 3000);

    return () => clearInterval(scoreInterval);
  }, [isPlaying, entryFee]);

  // Handle Game Over Finalization
  useEffect(() => {
    if (timeLeft === 0 && !isPlaying && hasStarted && !isGameOverTriggered) {
      setIsGameOverTriggered(true);
      const won = userScore > opponentScore;
      if (won) {
        audio.playWin();
      } else {
        audio.playLose();
      }
      setTimeout(() => {
        onGameOver(userScore, opponentScore, won);
      }, 1500);
    }
  }, [timeLeft, isPlaying, userScore, opponentScore, hasStarted, isGameOverTriggered]);

  // Floating score popups helper
  const addScorePopup = (text: string, x: number, y: number) => {
    const id = Math.random().toString();
    setScorePopups((prev) => [...prev, { id, text, x, y }]);
    setTimeout(() => {
      setScorePopups((prev) => prev.filter((p) => p.id !== id));
    }, 1200);
  };

  // Create POP burst particles
  const createExplosion = (x: number, y: number, color: ColorName) => {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const pAngle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      particlesRef.current.push({
        x,
        y,
        color,
        vx: Math.cos(pAngle) * speed,
        vy: Math.sin(pAngle) * speed,
        radius: 2 + Math.random() * 3,
        alpha: 1,
        life: 30 + Math.floor(Math.random() * 20),
      });
    }
  };

  // Grid matching & flood fill helpers
  const getNeighbors = (row: number, col: number) => {
    const neighbors: { r: number; c: number }[] = [];
    const isStaggered = (row % 2 === 1);

    // Grid coordinates surrounding cell
    const directions = isStaggered
      ? [
          { r: -1, c: 0 }, { r: -1, c: 1 },
          { r: 0, c: -1 }, { r: 0, c: 1 },
          { r: 1, c: 0 }, { r: 1, c: 1 }
        ]
      : [
          { r: -1, c: -1 }, { r: -1, c: 0 },
          { r: 0, c: -1 }, { r: 0, c: 1 },
          { r: 1, c: -1 }, { r: 1, c: 0 }
        ];

    for (const d of directions) {
      const nr = row + d.r;
      const nc = col + d.c;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        neighbors.push({ r: nr, c: nc });
      }
    }
    return neighbors;
  };

  // Breadth-first search for matching colors
  const findMatches = (startRow: number, startCol: number, targetColor: ColorName) => {
    const matched: { r: number; c: number }[] = [];
    const queue: { r: number; c: number }[] = [{ r: startRow, c: startCol }];
    const visited = new Set<string>();
    visited.add(`${startRow},${startCol}`);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      matched.push(curr);

      const neighbors = getNeighbors(curr.r, curr.c);
      for (const n of neighbors) {
        const bubble = gridRef.current[n.r][n.c];
        const key = `${n.r},${n.c}`;
        if (bubble === targetColor && !visited.has(key)) {
          visited.add(key);
          queue.push({ r: n.r, c: n.c });
        }
      }
    }

    return matched;
  };

  // Check and drop floating (unsupported) bubbles
  const dropFloatingBubbles = () => {
    const connected = new Set<string>();
    const queue: { r: number; c: number }[] = [];

    // All active top row bubbles are connected to ceiling
    for (let c = 0; c < COLS; c++) {
      if (gridRef.current[0][c] !== null) {
        queue.push({ r: 0, c });
        connected.add(`0,${c}`);
      }
    }

    // Flood fill from ceiling to find all supported bubbles
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const neighbors = getNeighbors(curr.r, curr.c);
      for (const n of neighbors) {
        const key = `${n.r},${n.c}`;
        if (gridRef.current[n.r][n.c] !== null && !connected.has(key)) {
          connected.add(key);
          queue.push({ r: n.r, c: n.c });
        }
      }
    }

    // Any bubble in the grid that was NOT visited is floating
    const floating: { r: number; c: number; color: ColorName }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = gridRef.current[r][c];
        if (color !== null && !connected.has(`${r},${c}`)) {
          floating.push({ r, c, color });
          gridRef.current[r][c] = null; // remove from grid
        }
      }
    }

    if (floating.length > 0) {
      audio.playSplat();
      // Add bonus score for drops
      const dropPoints = floating.length * 20;
      setUserScore((prev) => prev + dropPoints);
      
      const { x, y } = getBubbleCoords(floating[0].r, floating[0].c);
      addScorePopup(`+${dropPoints} DROP BONUS!`, x, y - 10);

      // Add falling visual entities
      floating.forEach((f) => {
        const coords = getBubbleCoords(f.r, f.c);
        fallingBubblesRef.current.push({
          x: coords.x,
          y: coords.y,
          color: f.color,
          vy: 2 + Math.random() * 3,
          vx: (Math.random() - 0.5) * 3,
          alpha: 1,
        });
        createExplosion(coords.x, coords.y, f.color);
      });
    }
  };

  // Grid collision snap
  const snapToGrid = (color: ColorName, x: number, y: number) => {
    let closestRow = -1;
    let closestCol = -1;
    let minDist = Infinity;

    // Scan grid slots to find the closest available coordinate
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (gridRef.current[r][c] === null) {
          const slotCoords = getBubbleCoords(r, c);
          const dx = slotCoords.x - x;
          const dy = slotCoords.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) {
            minDist = dist;
            closestRow = r;
            closestCol = c;
          }
        }
      }
    }

    if (closestRow !== -1 && closestCol !== -1) {
      gridRef.current[closestRow][closestCol] = color;
      audio.playThud();

      // Check matches
      const matches = findMatches(closestRow, closestCol, color);
      
      if (matches.length >= 3) {
        audio.playSplat();
        const scoreGain = matches.length * 10;
        setUserScore((prev) => prev + scoreGain);
        
        const coords = getBubbleCoords(closestRow, closestCol);
        addScorePopup(`+${scoreGain}`, coords.x, coords.y - 15);

        // Pop them
        matches.forEach((m) => {
          const poppedColor = gridRef.current[m.r][m.c];
          if (poppedColor) {
            const poppedCoords = getBubbleCoords(m.r, m.c);
            createExplosion(poppedCoords.x, poppedCoords.y, poppedColor);
          }
          gridRef.current[m.r][m.c] = null;
        });

        // Drop any decoupled floating bubbles
        dropFloatingBubbles();
      }

      // Check if grid is entirely cleared
      let isGridEmpty = true;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (gridRef.current[r][c] !== null) {
            isGridEmpty = false;
            break;
          }
        }
      }

      if (isGridEmpty) {
        // Clear screen bonus & regenerate
        setUserScore((prev) => prev + 200);
        addScorePopup('+200 BOARD CLEARED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        
        // Populate new rows
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < COLS; c++) {
            gridRef.current[r][c] = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
          }
        }
      }

      // Check game-over: if any bubbles are too low, reset the board with a score penalty!
      let reachedBottom = false;
      for (let c = 0; c < COLS; c++) {
        if (gridRef.current[ROWS - 2][c] !== null) {
          reachedBottom = true;
          break;
        }
      }

      if (reachedBottom) {
        audio.playThud();
        setUserScore((prev) => Math.max(0, prev - 50));
        addScorePopup('-50 OVERFLOW PENALTY!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        
        // Re-generate fresh grid
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            gridRef.current[r][c] = r < 4 ? COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)] : null;
          }
        }
      }
    }
  };

  const [isAiming, setIsAiming] = useState(false);
  const isAimingRef = useRef(false);

  const updateAim = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    // Scale client coords to match the internal 320x440 canvas dimensions
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    mousePosRef.current = { x, y };
  };

  // Track cursor position for launcher angle (desktop mousemove)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    updateAim(e.clientX, e.clientY);
  };

  // Touch handlers for mobile (Drag-to-aim, release-to-shoot)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPlaying) return;
    isAimingRef.current = true;
    setIsAiming(true);
    if (e.touches.length > 0) {
      updateAim(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPlaying || !isAimingRef.current) return;
    if (e.touches.length > 0) {
      updateAim(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPlaying || !isAimingRef.current) return;
    isAimingRef.current = false;
    setIsAiming(false);
    handleLaunchBubble();
  };

  // Physics and Drawing Loop
  useEffect(() => {
    if (!hasStarted) return;

    let animFrame: number;
    
    const tick = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        // If canvas is temporarily null, do not break the loop. Continue on the next frame!
        animFrame = requestAnimationFrame(tick);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animFrame = requestAnimationFrame(tick);
        return;
      }

      // Handle Device Pixel Ratio (DPR) Scaling for super-crisp text & vector graphics
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== CANVAS_WIDTH * dpr || canvas.height !== CANVAS_HEIGHT * dpr) {
        canvas.width = CANVAS_WIDTH * dpr;
        canvas.height = CANVAS_HEIGHT * dpr;
      }

      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      // Clear canvas with high-contrast slate-dark background
      ctx.fillStyle = '#080d1a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Render outer decorative grid neon borders
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Render laser threshold alert bar
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, (ROWS - 2) * 28 + BUBBLE_RADIUS);
      ctx.lineTo(CANVAS_WIDTH, (ROWS - 2) * 28 + BUBBLE_RADIUS);
      ctx.stroke();
      ctx.setLineDash([]);

      // 1. Calculate launcher angle based on mouse/drag position
      const launcherX = CANVAS_WIDTH / 2;
      const launcherY = CANVAS_HEIGHT - 35;
      const dx = mousePosRef.current.x - launcherX;
      // Clamp angle so bubble cannot shoot backwards or flat horizontal
      const dy = Math.min(-40, mousePosRef.current.y - launcherY);
      angleRef.current = Math.atan2(dy, dx);

      // 2. Draw static bubble grid
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const colorName = gridRef.current[r][c];
          if (colorName) {
            const { x, y } = getBubbleCoords(r, c);
            
            // Render beautiful 3D glossy gradient bubble
            const gradient = ctx.createRadialGradient(x - 4, y - 4, 1, x, y, BUBBLE_RADIUS);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.25, COLORS[colorName]);
            gradient.addColorStop(0.85, DARK_COLORS[colorName]);
            gradient.addColorStop(1, 'rgba(0,0,0,0.4)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, BUBBLE_RADIUS - 1, 0, Math.PI * 2);
            ctx.fill();

            // Bubble highlight glow rim
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // 3. Draw dotted aim assistance line if no bubble is currently flying
      if (isPlayingRef.current && !flyingBubbleRef.current) {
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 5]);
        
        let laserX = launcherX;
        let laserY = launcherY;
        let laserVx = Math.cos(angleRef.current) * 8;
        let laserVy = Math.sin(angleRef.current) * 8;

        ctx.beginPath();
        ctx.moveTo(laserX, laserY);

        // Trace trajectory with reflection bouncing
        for (let step = 0; step < 50; step++) {
          laserX += laserVx;
          laserY += laserVy;

          // Wall collision
          if (laserX <= BUBBLE_RADIUS) {
            laserX = BUBBLE_RADIUS;
            laserVx = -laserVx;
          } else if (laserX >= CANVAS_WIDTH - BUBBLE_RADIUS) {
            laserX = CANVAS_WIDTH - BUBBLE_RADIUS;
            laserVx = -laserVx;
          }

          // Ceiling snap stop
          if (laserY <= BUBBLE_RADIUS) {
            ctx.lineTo(laserX, laserY);
            break;
          }

          // Scan overlap with other bubbles to terminate laser
          let overlap = false;
          for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
              if (gridRef.current[r][c] !== null) {
                const coords = getBubbleCoords(r, c);
                const dX = coords.x - laserX;
                const dY = coords.y - laserY;
                if (Math.sqrt(dX * dX + dY * dY) < BUBBLE_DIAMETER - 2) {
                  overlap = true;
                  break;
                }
              }
            }
            if (overlap) break;
          }

          if (overlap) {
            ctx.lineTo(laserX, laserY);
            break;
          }

          // Draw step
          if (step % 2 === 0) {
            ctx.lineTo(laserX, laserY);
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 4. Update and draw currently flying bubble
      const flying = flyingBubbleRef.current;
      if (flying) {
        flying.x += flying.vx;
        flying.y += flying.vy;

        // Side walls bounce
        if (flying.x <= BUBBLE_RADIUS) {
          flying.x = BUBBLE_RADIUS;
          flying.vx = -flying.vx;
          audio.playThud();
        } else if (flying.x >= CANVAS_WIDTH - BUBBLE_RADIUS) {
          flying.x = CANVAS_WIDTH - BUBBLE_RADIUS;
          flying.vx = -flying.vx;
          audio.playThud();
        }

        // Ceiling collision
        let collided = false;
        if (flying.y <= BUBBLE_RADIUS) {
          collided = true;
        } else {
          // Check collision with other bubbles
          for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
              if (gridRef.current[r][c] !== null) {
                const coords = getBubbleCoords(r, c);
                const dx = coords.x - flying.x;
                const dy = coords.y - flying.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < BUBBLE_DIAMETER - 4) {
                  collided = true;
                  break;
                }
              }
            }
            if (collided) break;
          }
        }

        if (collided) {
          const color = flying.color;
          const x = flying.x;
          const y = flying.y;
          flyingBubbleRef.current = null;
          snapToGrid(color, x, y);
        } else {
          // Render flying bubble
          const radGrad = ctx.createRadialGradient(flying.x - 4, flying.y - 4, 1, flying.x, flying.y, BUBBLE_RADIUS);
          radGrad.addColorStop(0, '#ffffff');
          radGrad.addColorStop(0.25, COLORS[flying.color]);
          radGrad.addColorStop(0.85, DARK_COLORS[flying.color]);
          radGrad.addColorStop(1, 'rgba(0,0,0,0.4)');

          ctx.fillStyle = radGrad;
          ctx.beginPath();
          ctx.arc(flying.x, flying.y, BUBBLE_RADIUS, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. Update and draw falling disconnected bubbles
      fallingBubblesRef.current = fallingBubblesRef.current.filter((fb) => {
        fb.y += fb.vy;
        fb.x += fb.vx;
        fb.vy += 0.25; // gravity acceleration
        fb.alpha -= 0.025; // fade out

        if (fb.alpha <= 0 || fb.y > CANVAS_HEIGHT) return false;

        ctx.save();
        ctx.globalAlpha = fb.alpha;
        const radGrad = ctx.createRadialGradient(fb.x - 4, fb.y - 4, 1, fb.x, fb.y, BUBBLE_RADIUS);
        radGrad.addColorStop(0, '#ffffff');
        radGrad.addColorStop(0.25, COLORS[fb.color]);
        radGrad.addColorStop(0.85, DARK_COLORS[fb.color]);
        radGrad.addColorStop(1, 'rgba(0,0,0,0.4)');

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(fb.x, fb.y, BUBBLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return true;
      });

      // 6. Update and draw explosions particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.alpha = Math.max(0, p.life / 40);

        if (p.life <= 0) return false;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = COLORS[p.color];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return true;
      });

      // 7. Draw launcher station bottom bar
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(launcherX, CANVAS_HEIGHT, 40, Math.PI, 0);
      ctx.fill();

      // Launcher mechanical tube
      ctx.save();
      ctx.translate(launcherX, launcherY);
      ctx.rotate(angleRef.current + Math.PI / 2);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-6, -30, 12, 30);
      // Launcher head ring
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.strokeRect(-8, -32, 16, 6);
      ctx.restore();

      // Show loaded bubble inside launcher
      if (isPlayingRef.current && !flyingBubbleRef.current) {
        const radGrad = ctx.createRadialGradient(launcherX - 4, launcherY - 4, 1, launcherX, launcherY, BUBBLE_RADIUS);
        radGrad.addColorStop(0, '#ffffff');
        radGrad.addColorStop(0.25, COLORS[currentBubbleRef.current]);
        radGrad.addColorStop(0.85, DARK_COLORS[currentBubbleRef.current]);
        radGrad.addColorStop(1, 'rgba(0,0,0,0.4)');

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(launcherX, launcherY, BUBBLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }

      // Next bubble preview circle
      if (isPlayingRef.current) {
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(45, CANVAS_HEIGHT - 25, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const previewGrad = ctx.createRadialGradient(45 - 2, CANVAS_HEIGHT - 25 - 2, 1, 45, CANVAS_HEIGHT - 25, 12);
        previewGrad.addColorStop(0, '#ffffff');
        previewGrad.addColorStop(0.25, COLORS[nextBubbleRef.current]);
        previewGrad.addColorStop(0.85, DARK_COLORS[nextBubbleRef.current]);
        previewGrad.addColorStop(1, 'rgba(0,0,0,0.4)');

        ctx.fillStyle = previewGrad;
        ctx.beginPath();
        ctx.arc(45, CANVAS_HEIGHT - 25, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NEXT', 45, CANVAS_HEIGHT - 50);
      }

      animFrame = requestAnimationFrame(tick);
    };

    tick();

    return () => cancelAnimationFrame(animFrame);
  }, [hasStarted]);

  return (
    <div className="w-full h-full bg-[#030712] text-white flex flex-col justify-between p-4 relative font-sans select-none overflow-y-auto rounded-2xl border border-slate-800" id="bubble-shooter-game-room">
      
      {/* 1. COMPETE SCORE HEADER BOARD */}
      <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-2xl border border-white/5 shadow-xl relative" id="compete-header-board">
        {/* User Card */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-emerald-500 flex items-center justify-center text-lg shadow-inner relative">
            🦊
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-[8px] font-black font-mono text-slate-950 px-1 rounded-full border border-slate-950">YOU</span>
          </div>
          <div className="text-left">
            <span className="text-[9px] font-bold text-gray-400 font-mono uppercase block leading-none">Your Score</span>
            <span className="text-base font-black text-white font-mono leading-none tracking-tight">{userScore}</span>
          </div>
        </div>

        {/* 1-Minute Timer in Center */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 bg-black/60 px-2.5 py-1 rounded-full border border-white/10">
            <Timer className={`w-3.5 h-3.5 ${timeLeft <= 15 ? 'text-rose-500 animate-pulse' : 'text-amber-400'}`} />
            <span className={`text-xs font-black font-mono ${timeLeft <= 15 ? 'text-rose-400 font-bold animate-pulse' : 'text-amber-300'}`}>
              0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>
          <span className="text-[7.5px] font-mono text-gray-500 uppercase mt-1 tracking-wider">1 MINUTE RUSH</span>
        </div>

        {/* Opponent Card */}
        <div className="flex items-center gap-2 flex-row-reverse text-right">
          <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-rose-500 flex items-center justify-center text-lg shadow-inner relative">
            {opponentAvatar}
            <span className="absolute -bottom-1 -left-1 bg-rose-500 text-[8px] font-black font-mono text-white px-1 rounded-full border border-slate-950">OPP</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-bold text-gray-400 font-mono uppercase block leading-none">{opponentName}</span>
            <span className="text-base font-black text-rose-400 font-mono leading-none tracking-tight">{opponentScore}</span>
          </div>
        </div>

        {/* Live Leader pointer bar */}
        <div className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2 bg-slate-950 px-2.5 py-0.5 rounded-full border border-white/5 text-[7px] font-mono tracking-widest text-center flex items-center gap-1 shadow-md">
          {userScore > opponentScore ? (
            <span className="text-emerald-400 font-black">🔥 YOU ARE LEADING!</span>
          ) : userScore < opponentScore ? (
            <span className="text-rose-400 font-black">⚠️ OPPONENT LEADING!</span>
          ) : (
            <span className="text-gray-400 font-black">⚡ TIE SCORE</span>
          )}
        </div>
      </div>

      {/* 2. GAMEPLAY MAIN CONTAINER SCREEN */}
      <div className="flex-1 my-4 flex items-center justify-center relative min-h-[300px]">
        <AnimatePresence mode="wait">
          {!hasStarted ? (
            /* INTRO SCREEN */
            <motion.div
              key="intro"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-slate-950/90 rounded-2xl border border-white/5 flex flex-col items-center justify-center p-6 text-center z-10"
              id="game-intro-screen"
            >
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-lg border border-purple-400 mb-4 animate-bounce">
                <Sparkles className="w-9 h-9 text-white stroke-[2]" />
              </div>

              <h2 className="text-lg font-black text-white uppercase tracking-wider font-mono">
                Neon Bubble Shooter
              </h2>
              <p className="text-[10px] text-gray-400 max-w-[240px] leading-relaxed mt-1 font-sans">
                Pop colorful bubble groups of 3 or more before the timer ends! Drop hanging bubbles for maximum score multipliers.
              </p>

              {/* Stake bracket warning */}
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 flex flex-col gap-0.5 mt-4 w-full max-w-[240px] text-left">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-gray-500">Entry Stakes:</span>
                  <span className="text-yellow-400 font-bold">₹{entryFee} Cash</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-gray-500">Winner Takes:</span>
                  <span className="text-emerald-400 font-black">₹{prizePool} Cash</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono border-t border-white/5 pt-1 mt-1">
                  <span className="text-gray-500">Format:</span>
                  <span className="text-cyan-400 font-bold">60-Second Rush</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartGame}
                className="mt-6 px-6 py-2.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-black tracking-widest text-xs hover:from-yellow-400 hover:to-amber-400 shadow-lg cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                START CHALLENGE
              </button>
            </motion.div>
          ) : (
            /* GAME CANVAS & PLAYING VIEW */
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative w-full max-w-[320px] aspect-[320/440] rounded-2xl overflow-hidden border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)] bg-[#080d1a]"
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onMouseMove={handleMouseMove}
                onClick={handleLaunchBubble}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="w-full h-full cursor-crosshair block touch-none"
              />

              {/* DYNAMIC SCORES POPUPS */}
              {scorePopups.map((pop) => (
                <div
                  key={pop.id}
                  style={{ left: `${(pop.x / CANVAS_WIDTH) * 100}%`, top: `${(pop.y / CANVAS_HEIGHT) * 100}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-glow-green text-emerald-400 font-black text-xs font-mono pointer-events-none animate-float-fade"
                >
                  {pop.text}
                </div>
              ))}

              {/* Swap Button helper overlay inside game view */}
              {isPlaying && (
                <button
                  type="button"
                  onClick={handleSwapBubbles}
                  className="absolute bottom-3 right-3 bg-slate-900/90 border border-white/10 hover:border-white/20 p-2 rounded-xl text-[9px] font-mono font-bold text-gray-300 flex items-center gap-1 shadow-md hover:bg-slate-800 cursor-pointer active:scale-95 z-20"
                >
                  🔄 SWAP
                </button>
              )}
              
              {/* Tap to Shoot assistance banner */}
              {isPlaying && !flyingBubbleRef.current && (
                <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 text-[7.5px] font-mono text-yellow-400/40 pointer-events-none uppercase tracking-widest bg-black/40 px-3 py-0.5 rounded-full">
                  🖱️ Tap screen to shoot
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. FOOTER STATS INFO PANEL */}
      <div className="w-full bg-slate-950/60 p-3 rounded-2xl border border-white/5 text-center flex flex-col items-center gap-1" id="playing-instructions-footer">
        <div className="flex items-center gap-1 text-[9px] font-mono text-gray-400 uppercase">
          <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Tap to shoot • Left/Right boundaries bounce</span>
        </div>
        <p className="text-[8px] text-gray-500 leading-normal max-w-[280px]">
          If the bubble stack reaches the red laser boundary line, a <strong className="text-rose-400">-50 point penalty</strong> will trigger, clearing the grid to keep your streak alive. Good luck!
        </p>
      </div>
    </div>
  );
}
