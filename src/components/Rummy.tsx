import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { audio } from '../utils/audio';

interface RummyProps {
  opponentName: string;
  opponentLevel: number;
  opponentAvatar: string;
  entryFee: number;
  prizePool: number;
  onGameOver: (userScore: number, opponentScore: number, won: boolean) => void;
}

export interface PlayingCard {
  id: string;
  suit: 'C' | 'D' | 'H' | 'S'; // Clubs, Diamonds, Hearts, Spades
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  value: number; // Numeric value for sorting and sequences (A=1, 2=2... K=13)
  scoreValue: number; // Deadwood score (A=1, numbered=face value, J/Q/K=10)
}

// Helpers for Rummy combinations
const SUIT_EMOJIS = {
  C: '♣',
  D: '♦',
  H: '♥',
  S: '♠',
};

const SUIT_COLORS = {
  C: 'text-emerald-400',
  D: 'text-blue-400',
  H: 'text-rose-500',
  S: 'text-slate-300',
};

const RANK_VALUES: Record<PlayingCard['rank'], { val: number; score: number }> = {
  'A': { val: 1, score: 1 },
  '2': { val: 2, score: 2 },
  '3': { val: 3, score: 3 },
  '4': { val: 4, score: 4 },
  '5': { val: 5, score: 5 },
  '6': { val: 6, score: 6 },
  '7': { val: 7, score: 7 },
  '8': { val: 8, score: 8 },
  '9': { val: 9, score: 9 },
  '10': { val: 10, score: 10 },
  'J': { val: 11, score: 10 },
  'Q': { val: 12, score: 10 },
  'K': { val: 13, score: 10 },
};

// Generates a proper shuffled deck
function createDeck(): PlayingCard[] {
  const suits: PlayingCard['suit'][] = ['C', 'D', 'H', 'S'];
  const ranks: PlayingCard['rank'][] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: PlayingCard[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        id: `${rank}-${suit}-${Math.random().toString(36).substr(2, 4)}`,
        suit,
        rank,
        value: RANK_VALUES[rank].val,
        scoreValue: RANK_VALUES[rank].score,
      });
    }
  }

  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }

  return deck;
}

// Checks if a collection of cards forms a valid Set (same rank, different suits)
function isSet(cards: PlayingCard[]): boolean {
  if (cards.length < 3 || cards.length > 4) return false;
  const rank = cards[0].rank;
  const suits = new Set<string>();
  
  for (const card of cards) {
    if (card.rank !== rank) return false;
    suits.add(card.suit);
  }
  return suits.size === cards.length;
}

// Checks if a collection of cards forms a valid Sequence/Run (same suit, consecutive ranks)
function isSequence(cards: PlayingCard[]): boolean {
  if (cards.length < 3) return false;
  const suit = cards[0].suit;
  
  const sorted = [...cards].sort((a, b) => a.value - b.value);
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].suit !== suit) return false;
    if (i > 0 && sorted[i].value !== sorted[i - 1].value + 1) return false;
  }
  return true;
}

// Backtracking Rummy Analyzer: Groups a hand of 7 or 8 cards optimally to minimize deadwood
// Returns the active melds and the remaining deadwood cards
export function analyzeHand(hand: PlayingCard[]): { melds: PlayingCard[][]; deadwood: PlayingCard[]; score: number } {
  const n = hand.length;
  let bestScore = Infinity;
  let bestMelds: PlayingCard[][] = [];
  let bestDeadwood: PlayingCard[] = [...hand];

  // Helper to generate all subsets
  const getSubsetsOfSize = (arr: PlayingCard[], size: number): PlayingCard[][] => {
    const results: PlayingCard[][] = [];
    const helper = (start: number, combo: PlayingCard[]) => {
      if (combo.length === size) {
        results.push([...combo]);
        return;
      }
      for (let i = start; i < arr.length; i++) {
        combo.push(arr[i]);
        helper(i + 1, combo);
        combo.pop();
      }
    };
    helper(0, []);
    return results;
  };

  // Precompile candidate sets and runs of size 3 and 4
  const candidateMelds: PlayingCard[][] = [];
  const items3 = getSubsetsOfSize(hand, 3);
  for (const item of items3) {
    if (isSet(item) || isSequence(item)) {
      candidateMelds.push(item);
    }
  }
  const items4 = getSubsetsOfSize(hand, 4);
  for (const item of items4) {
    if (isSet(item) || isSequence(item)) {
      candidateMelds.push(item);
    }
  }

  // Backtracking search to find mutually exclusive combinations of candidates
  const search = (index: number, currentMelds: PlayingCard[][], usedIds: Set<string>) => {
    // Calculate deadwood
    const unusedCards = hand.filter(c => !usedIds.has(c.id));
    const deadwoodScore = unusedCards.reduce((acc, c) => acc + c.scoreValue, 0);

    if (deadwoodScore < bestScore) {
      bestScore = deadwoodScore;
      bestMelds = JSON.parse(JSON.stringify(currentMelds));
      bestDeadwood = [...unusedCards];
    }

    for (let i = index; i < candidateMelds.length; i++) {
      const meld = candidateMelds[i];
      // Check overlap
      const hasOverlap = meld.some(c => usedIds.has(c.id));
      if (!hasOverlap) {
        const nextUsed = new Set(usedIds);
        meld.forEach(c => nextUsed.add(c.id));
        currentMelds.push(meld);
        
        search(i + 1, currentMelds, nextUsed);
        
        currentMelds.pop();
      }
    }
  };

  search(0, [], new Set());

  return {
    melds: bestMelds,
    deadwood: bestDeadwood,
    score: bestScore,
  };
}

export default function Rummy({
  opponentName,
  opponentLevel,
  opponentAvatar,
  entryFee,
  prizePool,
  onGameOver,
}: RummyProps) {
  // Game state
  const [deck, setDeck] = useState<PlayingCard[]>([]);
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [opponentHand, setOpponentHand] = useState<PlayingCard[]>([]);
  const [discardPile, setDiscardPile] = useState<PlayingCard[]>([]);
  
  // Game turns and timing
  // 'lobby' -> matchmaking -> active gameplay loop
  // phases: 'setup' | 'player-draw' | 'player-discard' | 'opponent-turn' | 'game-over'
  const [phase, setPhase] = useState<'setup' | 'player-draw' | 'player-discard' | 'opponent-turn' | 'game-over'>('setup');
  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [maxTurns] = useState<number>(5); // 5 rounds of high stakes speed Rummy
  const [statusMessage, setStatusMessage] = useState('Dealing Cards...');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Card currently being drawn/rearranged indices for swapping
  const [swapSourceId, setSwapSourceId] = useState<string | null>(null);

  // Opponent AI log updates for immersion
  const [opponentLog, setOpponentLog] = useState<string>('Deciding initial tactics...');

  // Analyzer results
  const playerAnalysis = useMemo(() => {
    return analyzeHand(playerHand);
  }, [playerHand]);

  const opponentAnalysis = useMemo(() => {
    return analyzeHand(opponentHand);
  }, [opponentHand]);

  // Initial deal
  useEffect(() => {
    const newDeck = createDeck();
    const pHand = newDeck.splice(0, 7);
    const oHand = newDeck.splice(0, 7);
    const initialDiscard = newDeck.splice(0, 1);

    audio.playWhoosh();
    setDeck(newDeck);
    setPlayerHand(pHand);
    setOpponentHand(oHand);
    setDiscardPile(initialDiscard);
    setPhase('player-draw');
    setStatusMessage('YOUR TURN: Draw a card from DECK or DISCARD pile!');
  }, []);

  // Action: Draw from the main deck
  const drawFromDeck = () => {
    if (phase !== 'player-draw') return;
    if (deck.length === 0) {
      handleOutOfCards();
      return;
    }

    audio.playWhoosh();
    const nextDeck = [...deck];
    const drawn = nextDeck.pop()!;
    
    setDeck(nextDeck);
    setPlayerHand((prev) => [...prev, drawn]);
    setSelectedCardId(drawn.id); // auto-select the drawn card
    setPhase('player-discard');
    setStatusMessage('Select a card from your hand and click DISCARD to complete your turn!');
  };

  // Action: Draw from the discard pile
  const drawFromDiscard = () => {
    if (phase !== 'player-draw') return;
    if (discardPile.length === 0) return;

    audio.playWhoosh();
    const nextDiscard = [...discardPile];
    const drawn = nextDiscard.pop()!;

    setDiscardPile(nextDiscard);
    setPlayerHand((prev) => [...prev, drawn]);
    setSelectedCardId(drawn.id);
    setPhase('player-discard');
    setStatusMessage('Select a card from your hand and click DISCARD to complete your turn!');
  };

  // Action: Rearrange click - Swap position of two local cards in Hand
  const handleCardClick = (cardId: string) => {
    if (phase === 'game-over') return;

    audio.playThud();
    if (!swapSourceId) {
      setSwapSourceId(cardId);
      setSelectedCardId(cardId);
    } else {
      if (swapSourceId === cardId) {
        // Unselect
        setSwapSourceId(null);
        setSelectedCardId(null);
      } else {
        // Swap slots
        const indexA = playerHand.findIndex(c => c.id === swapSourceId);
        const indexB = playerHand.findIndex(c => c.id === cardId);
        
        if (indexA !== -1 && indexB !== -1) {
          const nextHand = [...playerHand];
          const temp = nextHand[indexA];
          nextHand[indexA] = nextHand[indexB];
          nextHand[indexB] = temp;
          setPlayerHand(nextHand);
        }
        setSwapSourceId(null);
        setSelectedCardId(cardId);
      }
    }
  };

  // Action: Discard card
  const discardCard = () => {
    if (phase !== 'player-discard' || !selectedCardId) return;

    audio.playWhoosh();
    const nextHand = playerHand.filter(c => c.id !== selectedCardId);
    const discardedCard = playerHand.find(c => c.id === selectedCardId)!;

    setDiscardPile((prev) => [...prev, discardedCard]);
    setPlayerHand(nextHand);
    setSelectedCardId(null);
    setSwapSourceId(null);

    // Fast check if user got 0 Deadwood! Auto-Declare perfect score
    const updatedAnalysis = analyzeHand(nextHand);
    if (updatedAnalysis.score === 0) {
      setStatusMessage('🎉 PERFECT RUMMY! You have 0 Deadwood!');
      triggerGameDeclare(nextHand, opponentHand);
      return;
    }

    // Move to AI Opponent phase
    setPhase('opponent-turn');
    setStatusMessage(`${opponentName} is calculating combinations...`);
    triggerOpponentTurn();
  };

  // Opponent smart AI mechanics
  const triggerOpponentTurn = () => {
    setTimeout(() => {
      if (phase === 'game-over') return;

      // 1. Decides which card to draw
      const topDiscard = discardPile[discardPile.length - 1];
      const withDiscardHand = [...opponentHand, topDiscard];
      const testScoreWithDiscard = analyzeHand(withDiscardHand).score;
      const testScoreWithout = analyzeHand(opponentHand).score;

      let drawnCard: PlayingCard;
      let nextDeck = [...deck];
      let nextDiscard = [...discardPile];

      audio.playWhoosh();

      // If drawn discard improves deadwood score, draw it; otherwise draw from deck
      if (testScoreWithDiscard < testScoreWithout && topDiscard) {
        drawnCard = nextDiscard.pop()!;
        setDiscardPile(nextDiscard);
        setOpponentLog(`Drew ${drawnCard.rank}${SUIT_EMOJIS[drawnCard.suit]} from DISCARD!`);
      } else {
        if (nextDeck.length === 0) {
          handleOutOfCards();
          return;
        }
        drawnCard = nextDeck.pop()!;
        setDeck(nextDeck);
        setOpponentLog(`Drew a mystery card from the DECK.`);
      }

      const tempOpponentHand = [...opponentHand, drawnCard];

      // 2. Decides which card to discard
      setTimeout(() => {
        // Find optimal discard candidates (the one that minimizes overall deadwood score)
        let optimalDiscardIndex = 0;
        let lowestLocalScore = Infinity;

        for (let i = 0; i < tempOpponentHand.length; i++) {
          const subset = tempOpponentHand.filter((_, idx) => idx !== i);
          const score = analyzeHand(subset).score;
          if (score < lowestLocalScore) {
            lowestLocalScore = score;
            optimalDiscardIndex = i;
          }
        }

        const AItoBeDiscarded = tempOpponentHand[optimalDiscardIndex];
        const nextOpponentHand = tempOpponentHand.filter((_, idx) => idx !== optimalDiscardIndex);

        setDiscardPile((prev) => [...prev, AItoBeDiscarded]);
        setOpponentHand(nextOpponentHand);
        setOpponentLog(`Discarded ${AItoBeDiscarded.rank}${SUIT_EMOJIS[AItoBeDiscarded.suit]}. Deadwood Optimized.`);

        // 3. Evaluate next stage
        setTimeout(() => {
          // If AI achieved 0 Deadwood (Perfect Rummy) or reached low score under 7 on final rounds, it automatically declares!
          const aiFinalAnalysis = analyzeHand(nextOpponentHand);
          
          if (aiFinalAnalysis.score === 0 || (currentTurn >= maxTurns && aiFinalAnalysis.score < 12)) {
            setStatusMessage(`🏆 Rival ${opponentName} Declared hand!`);
            triggerGameDeclare(playerHand, nextOpponentHand);
            return;
          }

          // Check if round limit reached
          if (currentTurn >= maxTurns) {
            setStatusMessage('⚠️ Maximum duel rounds completed! Initiating showdown.');
            triggerGameDeclare(playerHand, nextOpponentHand);
          } else {
            setCurrentTurn((prev) => prev + 1);
            setPhase('player-draw');
            setStatusMessage(`ROUND ${currentTurn + 1}: Draw from piles to optimize combinations!`);
          }
        }, 1200);

      }, 1500);

    }, 1800);
  };

  // Declare manually button triggering Showdown!
  const handleDeclare = () => {
    if (phase !== 'player-discard') return;
    audio.playWin();
    setStatusMessage('Showdown initiated! Declaring Rummy Melds...');
    triggerGameDeclare(playerHand, opponentHand);
  };

  // Out of cards safety trigger
  const handleOutOfCards = () => {
    setStatusMessage('🎴 Draw pile exhausted! Showdown triggered.');
    triggerGameDeclare(playerHand, opponentHand);
  };

  // Declare Calculations & Finish callback
  const triggerGameDeclare = (finalPlayerHand: PlayingCard[], finalOppHand: PlayingCard[]) => {
    setPhase('game-over');

    const finalPlayerAnalysis = analyzeHand(finalPlayerHand);
    const finalOppAnalysis = analyzeHand(finalOppHand);

    // WINNER CALCULATION:
    // Rummy rules: Player with the LOWER deadwood score is the winner because they got closest to valid sets and sequences!
    // If scores are tied, player with more melds or lower level wins.
    const userDeadwood = finalPlayerAnalysis.score;
    const oppDeadwood = finalOppAnalysis.score;

    const playerWon = userDeadwood < oppDeadwood;

    if (playerWon) {
      audio.playWin();
      setStatusMessage(`🏆 YOU WIN! Lower Deadwood (My ${userDeadwood} vs Opp ${oppDeadwood})!`);
    } else {
      audio.playLose();
      setStatusMessage(`💀 Rival Won! Lower Deadwood (My ${userDeadwood} vs Opp ${oppDeadwood})!`);
    }

    // Pass results to main state machine
    setTimeout(() => {
      // Scale: score is representation of victory
      onGameOver(userDeadwood === 0 ? 100 : Math.max(5, 50 - userDeadwood), oppDeadwood === 0 ? 100 : Math.max(5, 50 - oppDeadwood), playerWon);
    }, 4500);
  };

  return (
    <div 
      className="w-full h-full flex flex-col justify-between py-5 px-3 font-sans select-none relative" 
      id="rummy-board"
      style={{ 
        backgroundImage: "url('/src/assets/images/rummy_table_new_1782630723054.jpg')", 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark vignette overlay to keep the visual hierarchy high contrast and easy on the eyes */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 pointer-events-none rounded-2xl" />
      
      {/* 1. MATCH HEADER DETAILS */}
      <div className="flex justify-between items-center bg-black/60 p-2.5 rounded-2xl border border-emerald-500/10 shadow-lg flex-shrink-0">
        
        {/* User Card */}
        <div className="flex items-center gap-1.5 max-w-[35%]">
          <span className="text-xl p-1 bg-emerald-900/40 rounded-xl border border-emerald-500/20">🦊</span>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black truncate text-emerald-400">YOU (Gamer)</span>
            {phase !== 'game-over' && (
              <span className="text-[8.5px] text-yellow-400 font-mono font-bold leading-none mt-0.5">
                Deadwood: {playerAnalysis.score} pts
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Center Lobby Indicator */}
        <div className="text-center bg-slate-950/70 border border-emerald-500/20 rounded-xl px-2.5 py-1 min-w-[125px]">
          <div className="flex justify-between items-center gap-2">
            <span className="text-[8px] uppercase font-bold text-gray-400 font-mono">ROUND {currentTurn}/{maxTurns}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          </div>
          <span className="text-[9.5px] font-mono font-bold text-yellow-300 block mt-0.5">
            Stake: ₹ {Math.floor(prizePool * 1.5)}
          </span>
        </div>

        {/* Adversary Card */}
        <div className="flex items-center gap-1.5 max-w-[35%] text-right justify-end">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black truncate text-rose-400 uppercase">{opponentName.split(' ')[0]}</span>
            {phase === 'game-over' ? (
              <span className="text-[8px] text-yellow-400 font-mono font-bold leading-none mt-0.5">
                Deadwood: {opponentAnalysis.score}
              </span>
            ) : (
              <span className="text-[8.5px] text-gray-400 font-mono">LVL {opponentLevel} rival</span>
            )}
          </div>
          <span className="text-xl p-1 bg-rose-950/40 rounded-xl border border-rose-500/20">{opponentAvatar}</span>
        </div>

      </div>

      {/* 2. LIVE ACTION STATUS & LOG BANNER */}
      <div className="text-center my-3 flex flex-col gap-1.5 flex-shrink-0">
        <div className="inline-block bg-emerald-950/70 border border-emerald-500/20 px-3.5 py-1.5 rounded-full shadow-inner max-w-full">
          <span className="text-[10.5px] font-semibold text-emerald-100 tracking-wide">
            {statusMessage}
          </span>
        </div>

        {/* AI Action log trace ticker */}
        <div className="inline-flex items-center justify-center gap-2 py-1 px-3 bg-black/45 rounded-lg border border-white/5 opacity-80 self-center max-w-[90%] truncate">
          <span className="text-[8px] text-yellow-400 font-black font-mono">RIVAL LOG ➔</span>
          <span className="text-[8.5px] text-gray-300 font-mono italic">{opponentLog}</span>
        </div>
      </div>

      {/* 3. OPPONENT CARDS RENDER */}
      <div className="flex justify-center -gap-4 relative h-16 items-center flex-shrink-0 overflow-hidden bg-black/15 py-1 rounded-xl border border-dashed border-white/5 mx-2">
        <span className="absolute left-2.5 top-1.5 text-[7px] text-gray-500 font-black uppercase tracking-wider font-mono">Opponent's Hand Layout</span>
        {opponentHand.map((card, idx) => (
          <div
            key={card.id || idx}
            className="w-8 h-12 rounded bg-gradient-to-b from-[#162a1b] to-[#081309] border border-emerald-900/40 shadow-md flex items-center justify-center -ml-1 flex-shrink-0 relative"
          >
            {/* Show face up when game is over */}
            {phase === 'game-over' ? (
              <div className="flex flex-col items-center justify-between h-full p-1 w-full text-[10px] bg-white text-slate-900 rounded">
                <span className="font-extrabold leading-none text-left w-full">{card.rank}</span>
                <span className={`text-base leading-none ${SUIT_COLORS[card.suit]}`}>{SUIT_EMOJIS[card.suit]}</span>
              </div>
            ) : (
              <div className="text-[10px] text-emerald-600/30 font-black">WZ</div>
            )}
          </div>
        ))}
      </div>

      {/* 4. CENTRAL COMBINATION WORKSPACE: DRAW CARD CLAY PILES & DISCARD ROW */}
      <div className="flex-1 flex flex-col justify-center items-center gap-4 py-3">
        
        <div className="flex items-center justify-center gap-8 w-full max-w-xs">
          
          {/* A. DRAW DECK FACEDOWN PILE */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wide font-mono">Draw Deck</span>
            <button
              onClick={drawFromDeck}
              disabled={phase !== 'player-draw'}
              className={`w-18 h-26 rounded-2xl relative border-2 bg-gradient-to-tr from-[#111827] to-[#1f2937] flex flex-col justify-between items-center p-2.5 shadow-xl transition-all ${
                phase === 'player-draw'
                  ? 'border-yellow-400 hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(234,179,8,0.3)]'
                  : 'border-slate-800 opacity-60'
              }`}
              id="draw-deck-btn"
            >
              <div className="text-[9px] text-gray-500 font-mono font-bold">WZ</div>
              <div className="w-9 h-9 rounded-full bg-slate-950 flex items-center justify-center text-lg shadow-inner">
                🎴
              </div>
              <span className="text-[8px] font-mono font-extrabold text-blue-400 tracking-wider">
                {deck.length} LEFT
              </span>
            </button>
          </div>

          {/* B. DISCARD FACE UP PILE */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wide font-mono font-sans">Discard Pile</span>
            {discardPile.length > 0 ? (
              <button
                onClick={drawFromDiscard}
                disabled={phase !== 'player-draw'}
                className={`w-18 h-26 rounded-2xl relative border-2 bg-white text-slate-900 flex flex-col justify-between p-2 shadow-xl transition-all ${
                  phase === 'player-draw'
                    ? 'border-emerald-400 hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                    : 'border-slate-300'
                }`}
                id="draw-discard-btn"
              >
                {/* Top card description */}
                {(() => {
                  const topCard = discardPile[discardPile.length - 1];
                  return (
                    <div className="h-full w-full flex flex-col justify-between">
                      <span className="text-xs font-black tracking-tight leading-none text-left">
                        {topCard.rank}
                      </span>
                      <div className="my-auto text-center flex flex-col items-center">
                        <span className={`text-3xl leading-none ${SUIT_COLORS[topCard.suit]}`}>
                          {SUIT_EMOJIS[topCard.suit]}
                        </span>
                      </div>
                      <span className="text-[8px] font-mono font-bold text-gray-400 text-center uppercase tracking-wide">
                        DRAW TOP
                      </span>
                    </div>
                  );
                })()}
              </button>
            ) : (
              <div className="w-18 h-26 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center text-center">
                <span className="text-[8px] text-gray-600 uppercase font-bold">Empty</span>
              </div>
            )}
          </div>

        </div>

        {/* Melds Quick status board */}
        {phase !== 'game-over' && (
          <div className="text-center">
            {playerAnalysis.melds.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-1.5 px-3 py-1 bg-emerald-950/40 rounded-full border border-emerald-500/20 max-w-full">
                <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest leading-none">AUTO MELDS FOUND:</span>
                {playerAnalysis.melds.map((meld, mIdx) => (
                  <span
                    key={mIdx}
                    className="text-[8.5px] bg-slate-950 border border-white/10 text-yellow-300 px-2 py-0.5 rounded font-mono font-bold uppercase"
                  >
                    Meld {mIdx + 1} ({meld.length} Cards)
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[8.5px] text-slate-400 font-sans italic">
                Rearrange hand to align Sets (K♣, K♥, K♦) or Runs (3♣, 4♣, 5♣)
              </span>
            )}
          </div>
        )}

      </div>

      {/* 5. USER HAND CARDS CAROUSEL LIST */}
      <div className="flex flex-col bg-slate-950/60 border border-white/5 p-3 rounded-2xl shadow-inner gap-2">
        
        {/* Hand headers & Swap controls explanation */}
        <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase tracking-wide px-1">
          <div className="flex items-center gap-1">
            <span>🖱️ Click card to swap position</span>
            {swapSourceId && (
              <span className="text-yellow-400 font-extrabold animate-pulse">(Select another card to swap!)</span>
            )}
          </div>
          <span className="font-mono font-bold text-gray-300">Hand (Drag-Swap enabled)</span>
        </div>

        {/* User cards row */}
        <div className="flex justify-center -gap-1 pb-1 pt-0.5 overflow-x-auto select-none min-h-[110px]" id="player-carrying-hand">
          {playerHand.map((card) => {
            const isSelected = selectedCardId === card.id;
            const isPartofMeld = playerAnalysis.melds.some(meld => meld.some(c => c.id === card.id));
            const meldIndex = playerAnalysis.melds.findIndex(meld => meld.some(mCard => mCard.id === card.id));

            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`w-13 h-20 rounded-xl bg-white border-2 flex flex-col justify-between p-2 flex-shrink-0 transition-all duration-200 cursor-pointer select-none -ml-1 first:ml-0 ${
                  isSelected
                    ? 'border-yellow-400 -translate-y-3.5 shadow-[0_10px_20px_rgba(245,158,11,0.35)]'
                    : isPartofMeld
                    ? 'border-emerald-500 shadow-[0_4px_10px_rgba(16,185,129,0.15)] bg-emerald-50/98'
                    : 'border-slate-300 hover:-translate-y-1'
                }`}
              >
                {/* Score value / Card Number */}
                <span className="text-[10px] font-black leading-none text-slate-900 text-left">
                  {card.rank}
                </span>

                {/* Card Emblem */}
                <div className="text-center my-auto flex flex-col items-center select-none">
                  <span className={`text-2xl leading-none select-none ${SUIT_COLORS[card.suit]}`}>
                    {SUIT_EMOJIS[card.suit]}
                  </span>
                </div>

                {/* Subtitle / Meld index marker */}
                {isPartofMeld ? (
                  <span className="text-[7.5px] font-black text-center text-emerald-600 uppercase font-mono tracking-tight leading-none">
                    Meld {meldIndex + 1}
                  </span>
                ) : (
                  <span className="text-[7.5px] font-mono text-center text-slate-400 font-bold leading-none">
                    {card.scoreValue} pts
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 6. GAME CONTROL ROW BUTTON ACTION CONTROLLERS */}
        <div className="flex gap-2.5 mt-1">
          
          {/* Discard Selected Button */}
          <button
            onClick={discardCard}
            disabled={phase !== 'player-discard' || !selectedCardId}
            className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-[11px] tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 ${
              phase === 'player-discard' && selectedCardId
                ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer active:scale-95 shadow-md border border-red-500'
                : 'bg-slate-800 text-gray-500 cursor-not-allowed border border-slate-700'
            }`}
            id="discard-card-action-btn"
          >
            🗑️ Discard Card
          </button>

          {/* Declare / Meld hand button */}
          <button
            onClick={handleDeclare}
            disabled={phase !== 'player-discard'}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-[11.5px] tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 ${
              phase === 'player-discard'
                ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 hover:from-yellow-400 hover:to-amber-400 cursor-pointer active:scale-95 shadow-[0_0_12px_rgba(245,158,11,0.25)] border border-yellow-300'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
            id="declare-rummy-match-btn"
          >
            🏆 DECLARE SHOW
          </button>

        </div>

      </div>

    </div>
  );
}
