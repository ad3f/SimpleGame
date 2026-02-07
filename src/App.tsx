import { useEffect, useMemo, useState } from "react";
import { cn } from "./utils/cn";

// --- Types ---

type AuthMode = "guest" | "registered";

type PlayerProfile = {
  id: string; // username or guest-id
  mode: AuthMode;
  pin?: string; // only for registered users
  createdAt: number;
};

type Difficulty = 1 | 2 | 3;

type GameMode = "vsMachine" | "vsRandom";

type GameResult = "win" | "lose" | "draw";

type SessionStats = {
  id: string;
  startedAt: number;
  endedAt: number;
  difficulty: Difficulty;
  mode: GameMode;
  score: number;
  tokensEarned: number;
  result: GameResult;
};

type MockUserRecord = {
  profile: PlayerProfile;
  totalTokens: number;
  highScore: number;
  sessions: SessionStats[];
};

// --- Constants ---

const LOCAL_KEY_GUEST = "dice-duel-guest-profile-v1";
const LOCAL_KEY_REGISTERED = "dice-duel-registered-users-v1";
const LOCAL_KEY_ACTIVE_USER = "dice-duel-active-user-v1";

const BASE_TOKENS_PER_WIN = 5;

// 100 historical tidbits about dice, probability, and logic games
// Stored as a simple string array for easy toggling & iteration.
const TRIVIA_ITEMS: string[] = [
  "Ancient Egyptians used carved knucklebones as early dice over 5,000 years ago.",
  "The oldest known dice were found in a backgammon-like game at the Burnt City in Iran.",
  "Six-sided dice are called cubes, but ancient cultures also used 4, 8, 12, and 20-sided dice.",
  "The word 'dice' comes from the Latin 'datum', meaning 'something which is given or played'.",
  "Romans used dice not only for games but also for making decisions and divination.",
  "Loaded dice have been found in archaeological sites, proving cheating is as old as gaming.",
  "In medieval Europe, dice games were so common that some rulers tried to ban them.",
  "Craps is one of the most famous casino dice games, evolving from a game called Hazard.",
  "Probability theory historically grew out of attempts to analyze gambling with dice.",
  "Blaise Pascal and Pierre de Fermat laid foundations of probability while studying dice games.",
  "The sum of two six-sided dice is most likely to be 7, with six different combinations.",
  "There are 36 possible outcomes when rolling two six-sided dice.",
  "Board games like Monopoly rely heavily on the randomness of dice for movement.",
  "Backgammon is one of the oldest known board games to use dice strategically.",
  "Role-playing games like Dungeons & Dragons popularized many different types of dice.",
  "In some cultures, dice were believed to reveal the will of the gods.",
  "Dominoes evolved partly from dice concepts, mapping pips to tiles.",
  "Mathematician Girolamo Cardano wrote one of the first books on probability via dice.",
  "Fair dice must approximate a perfect cube with uniform mass distribution.",
  "Casino dice are precision-machined and often use sharp edges to reduce bias.",
  "The standard die opposite faces add up to seven: 1-6, 2-5, and 3-4.",
  "Some board games use custom dice with icons instead of numbers for special actions.",
  "Many modern 'roll and write' games rely on dice for fast, replayable puzzles.",
  "Yahtzee is a popular dice game where players roll combinations like poker hands.",
  "Dice towers are devices that randomize dice rolls using internal ramps.",
  "Speed dice games often reward both quick thinking and risk management.",
  "Digital dice simulations rely on pseudo-random number generators.",
  "Cryptographically secure random generators make digital dice harder to predict.",
  "Logic puzzle games often mix randomness with deterministic problem-solving.",
  "Expected value calculations help players decide when to reroll in dice games.",
  "Push-your-luck games challenge players to balance risk and reward with dice.",
  "Dice have been made from bone, stone, wood, metal, and modern plastics.",
  "Some ancient dice were not cubic but elongated, acting more like random sticks.",
  "Balanced dice are tumble-tested to ensure fairness in casinos.",
  "Dice notation like '2d6+1' describes rolling two six-sided dice plus one.",
  "Dice diplomacy is a concept where random outcomes influence negotiation dynamics.",
  "Probability tables for dice help designers tune difficulty in games.",
  "In some war games, dice represent the fog of war and battlefield chaos.",
  "Euro-style board games sometimes reduce dice randomness with mitigation systems.",
  "Dice combat systems often trade simplicity for swingy, dramatic outcomes.",
  "Some games use custom dice with multiple success symbols on a single face.",
  "Dice pools let players roll many dice at once and count certain results.",
  "In cooperative games, dice can represent shared threats or collective resources.",
  "Speed dice puzzles appear in educational math games to teach arithmetic.",
  "Randomness from dice can prevent 'solvable' patterns and keep games fresh.",
  "Deterministic logic puzzles usually avoid dice to focus on pure reasoning.",
  "Digital board games sometimes animate physics-based dice on screen.",
  "Dice etiquette in tabletop games includes rolling where everyone can see.",
  "Transparency in casino dice helps reveal any tampering or loaded weights.",
  "Using trays or towers helps prevent dice from scattering off the table.",
  "Game designers test thousands of simulated dice rolls to balance mechanics.",
  "House rules often change how dice can be rerolled or modified in games.",
  "Some party games use giant foam dice to make actions obvious from a distance.",
  "Educational dice sets might show fractions, words, or chemical symbols.",
  "Probability curves from dice shape how often extreme results appear.",
  "A single d6 has a uniform distribution, while two dice create a bell curve.",
  "Dice drafting games let players choose from shared rolls as resources.",
  "Some abstract strategy games secretly use dice to break ties.",
  "Push-your-luck dice games date back to early pub and tavern gambling.",
  "Logic and deduction games sometimes hide dice results behind screens.",
  "Hidden information from dice can create bluffing opportunities.",
  "Digital dice skins and particles add flair without changing probabilities.",
  "Dice minis and tokens often share iconography for a coherent game UI.",
  "Probability literacy helps players recognize when luck balances out.",
  "Dice are a gateway to teaching randomness and statistics in classrooms.",
  "Evenly rounded dice edges reduce how often they stop on corners.",
  "Many players ritualize dice rolling for fun superstition.",
  "Dice trays protect game components from heavy throws.",
  "Some games synchronize dice and timers for real-time challenges.",
  "In roguelike video games, dice-like randomness governs loot and encounters.",
  "Designers often simulate millions of dice rolls when tuning digital games.",
  "Dice-driven logic puzzles can teach conditional probability.",
  "Variance from dice keeps each match distinct in competitive games.",
  "Dice icons are widely recognized UI metaphors for 'random' or 'chance'.",
  "Tap-to-roll dice interactions are popular on touch devices.",
  "Haptic feedback in mobile dice games simulates table impacts.",
  "Procedural generation in games is sometimes explained with dice analogies.",
  "Dice limits in rules prevent players from hoarding extreme advantages.",
  "Random turn order with dice can keep players engaged in long games.",
  "Co-op dice puzzles encourage communication and shared planning.",
  "Accessible dice games use large pips and high-contrast faces.",
  "Color-coded dice in games map to different abilities or effects.",
  "Non-cubic dice use carefully calculated geometry to stay fair.",
  "Loaded dice in fiction symbolize cheating and unfair systems.",
  "Narrative games sometimes use 'story dice' with pictograms.",
  "Children's math games often begin with simple dice counting.",
  "Dice can model Bernoulli trials and binomial distributions.",
  "Designers may swap dice for cards when they want less swingy randomness.",
  "Dice and logic combine in games where players must optimize limited rolls.",
  "Modern board games sometimes offer 'dice mitigation' tokens.",
  "Some social deduction games use dice to secretly assign roles.",
  "Dice auctions let players bid based on rolled values.",
  "Pattern-building dice games challenge spatial reasoning.",
  "Push-your-luck games often track 'bust' states with dice faces.",
  "Dice iconography in digital UIs must read clearly at small sizes.",
  "Many game engines ship with ready-made dice physics prefabs.",
  "Dice themes are popular in casual mobile games and web mini-games.",
  "Matching dice faces was an ancestor of modern tile-matching puzzles.",
  "Designers study how players emotionally respond to lucky or unlucky dice.",
  "Balancing skill versus luck is central to good dice-based game design.",
  "Replayable daily dice puzzles keep players returning in short sessions.",
  "Tournament rules may specify how and where to roll dice.",
  "Digital dice logs sometimes show full roll histories for transparency.",
  "Logic training apps reimagine dice as abstract probability blocks.",
  "Even simple dice duels can become deep with layered scoring rules.",
  "Hybrid games mix deterministic puzzles with optional dice challenges.",
  "Dice have remained iconic symbols of games and chance across cultures.",
  "From ancient bones to modern apps, dice keep connecting math and play.",
];

function loadGuestProfile(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY_GUEST);
    if (!raw) return null;
    return JSON.parse(raw) as PlayerProfile;
  } catch {
    return null;
  }
}

function saveGuestProfile(profile: PlayerProfile) {
  localStorage.setItem(LOCAL_KEY_GUEST, JSON.stringify(profile));
}

function loadRegisteredUsers(): Record<string, MockUserRecord> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY_REGISTERED);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, MockUserRecord>;
  } catch {
    return {};
  }
}

function saveRegisteredUsers(users: Record<string, MockUserRecord>) {
  localStorage.setItem(LOCAL_KEY_REGISTERED, JSON.stringify(users));
}

function mockBackendLogin(username: string, pin: string): MockUserRecord {
  const users = loadRegisteredUsers();
  const key = username.toLowerCase();
  let record = users[key];
  if (!record) {
    const profile: PlayerProfile = {
      id: username,
      mode: "registered",
      pin,
      createdAt: Date.now(),
    };
    record = {
      profile,
      totalTokens: 0,
      highScore: 0,
      sessions: [],
    };
  } else if (record.profile.pin !== pin) {
    throw new Error("Invalid PIN for existing user");
  }
  users[key] = record;
  saveRegisteredUsers(users);
  localStorage.setItem(LOCAL_KEY_ACTIVE_USER, key);
  return record;
}

function mockBackendUpdate(record: MockUserRecord) {
  const users = loadRegisteredUsers();
  const key = record.profile.id.toLowerCase();
  users[key] = record;
  saveRegisteredUsers(users);
}

function loadActiveRegistered(): MockUserRecord | null {
  try {
    const key = localStorage.getItem(LOCAL_KEY_ACTIVE_USER);
    if (!key) return null;
    const users = loadRegisteredUsers();
    return users[key] ?? null;
  } catch {
    return null;
  }
}

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function playLevelCompleteJingle() {
  const url =
    "https://cdn.pixabay.com/download/audio/2022/03/15/audio_5a53b35cb0.mp3?filename=interface-124464.mp3";
  const audio = new Audio(url);
  audio.volume = 0.6;
  audio.play().catch(() => {
    // ignore autoplay restrictions
  });
}

function DiceIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm",
        className
      )}
    >
      <svg
        viewBox="0 0 64 64"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect
          x="8"
          y="8"
          width="48"
          height="48"
          rx="10"
          fill="currentColor"
          className="text-white/0"
        />
        <circle cx="22" cy="22" r="3" />
        <circle cx="42" cy="22" r="3" />
        <circle cx="22" cy="42" r="3" />
        <circle cx="42" cy="42" r="3" />
        <circle cx="32" cy="32" r="3" />
      </svg>
    </span>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "green" | "indigo" | "amber";
}) {
  const colorMap: Record<string, string> = {
    green: "from-emerald-500/10 to-emerald-500/0 border-emerald-500/40 text-emerald-900",
    indigo:
      "from-indigo-500/10 to-indigo-500/0 border-indigo-500/40 text-indigo-900",
    amber:
      "from-amber-400/15 to-amber-400/0 border-amber-400/50 text-amber-900",
  };
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-2xl border bg-gradient-to-br px-4 py-3 text-left shadow-sm",
        accent && colorMap[accent]
      )}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="text-lg font-semibold text-slate-900">{value}</span>
    </div>
  );
}

export function App() {
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [guestProfile, setGuestProfile] = useState<PlayerProfile | null>(null);
  const [userRecord, setUserRecord] = useState<MockUserRecord | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");

  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [gameMode, setGameMode] = useState<GameMode>("vsMachine");

  const [playerRoll, setPlayerRoll] = useState<number | null>(null);
  const [opponentRoll, setOpponentRoll] = useState<number | null>(null);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [sessionStart, setSessionStart] = useState<number | null>(null);

  const [showTrivia, setShowTrivia] = useState(false);

  useEffect(() => {
    const active = loadActiveRegistered();
    if (active) {
      setAuthMode("registered");
      setUserRecord(active);
      return;
    }
    const guest = loadGuestProfile();
    if (guest) {
      setAuthMode("guest");
      setGuestProfile(guest);
    }
  }, []);

  const totalTokens = useMemo(() => {
    if (authMode === "registered" && userRecord) return userRecord.totalTokens;
    if (!guestProfile) return 0;
    try {
      const raw = localStorage.getItem(`${LOCAL_KEY_GUEST}-tokens`);
      return raw ? Number(raw) || 0 : 0;
    } catch {
      return 0;
    }
  }, [authMode, userRecord, guestProfile]);

  const highScore = useMemo(() => {
    if (authMode === "registered" && userRecord) return userRecord.highScore;
    if (!guestProfile) return 0;
    try {
      const raw = localStorage.getItem(`${LOCAL_KEY_GUEST}-highscore`);
      return raw ? Number(raw) || 0 : 0;
    } catch {
      return 0;
    }
  }, [authMode, userRecord, guestProfile]);

  const recentSessions: SessionStats[] = useMemo(() => {
    if (authMode === "registered" && userRecord) return userRecord.sessions.slice(-5).reverse();
    if (!guestProfile) return [];
    try {
      const raw = localStorage.getItem(`${LOCAL_KEY_GUEST}-sessions`);
      if (!raw) return [];
      const list = JSON.parse(raw) as SessionStats[];
      return list.slice(-5).reverse();
    } catch {
      return [];
    }
  }, [authMode, userRecord, guestProfile]);

  const handleGuestPlay = () => {
    setAuthError(null);
    if (!guestProfile) {
      const profile: PlayerProfile = {
        id: `guest-${Math.random().toString(36).slice(2, 8)}`,
        mode: "guest",
        createdAt: Date.now(),
      };
      setGuestProfile(profile);
      saveGuestProfile(profile);
    }
    setAuthMode("guest");
  };

  const handleRegisteredLogin = () => {
    setAuthError(null);
    if (!username || pin.length !== 5) {
      setAuthError("Enter a username and a 5-digit PIN.");
      return;
    }
    try {
      const record = mockBackendLogin(username.trim(), pin);
      setUserRecord(record);
      setAuthMode("registered");
    } catch (e) {
      setAuthError((e as Error).message);
    }
  };

  const persistGuestProgress = (tokensDelta: number, newScore: number, session: SessionStats) => {
    if (!guestProfile) return;
    const tokens = totalTokens + tokensDelta;
    const hs = Math.max(highScore, newScore);
    localStorage.setItem(`${LOCAL_KEY_GUEST}-tokens`, String(tokens));
    localStorage.setItem(`${LOCAL_KEY_GUEST}-highscore`, String(hs));
    const raw = localStorage.getItem(`${LOCAL_KEY_GUEST}-sessions`);
    const list: SessionStats[] = raw ? (JSON.parse(raw) as SessionStats[]) : [];
    list.push(session);
    localStorage.setItem(`${LOCAL_KEY_GUEST}-sessions`, JSON.stringify(list));
  };

  const persistRegisteredProgress = (tokensDelta: number, newScore: number, session: SessionStats) => {
    if (!userRecord) return;
    const updated: MockUserRecord = {
      ...userRecord,
      totalTokens: userRecord.totalTokens + tokensDelta,
      highScore: Math.max(userRecord.highScore, newScore),
      sessions: [...userRecord.sessions, session],
    };
    setUserRecord(updated);
    mockBackendUpdate(updated);
  };

  const startSessionIfNeeded = () => {
    if (!sessionStart) {
      setSessionStart(Date.now());
    }
  };

  const levelTargetRounds = difficulty === 1 ? 5 : difficulty === 2 ? 7 : 9;

  const handleRoll = () => {
    if (isRolling) return;
    startSessionIfNeeded();
    setIsRolling(true);
    setTimeout(() => {
      const sides = difficulty === 1 ? 6 : difficulty === 2 ? 8 : 10;
      const player = 1 + Math.floor(Math.random() * sides);
      const opponentBias = gameMode === "vsMachine" && difficulty === 3 ? 1 : 0;
      const opponentBase = 1 + Math.floor(Math.random() * sides);
      const opponent = Math.min(sides, opponentBase + opponentBias);

      let delta = 0;
      let result: GameResult = "draw";
      if (player > opponent) {
        delta = 2;
        result = "win";
      } else if (player < opponent) {
        delta = -1;
        result = "lose";
      }

      setPlayerRoll(player);
      setOpponentRoll(opponent);
      setScore((prev) => prev + delta);
      setRound((prev) => prev + 1);

      const isLevelComplete = round + 1 > levelTargetRounds;

      if (isLevelComplete) {
        const end = Date.now();
        const tokensEarned = score + delta > 0 ? BASE_TOKENS_PER_WIN * difficulty : 0;
        const overallResult: GameResult = score + delta > 0 ? "win" : score + delta === 0 ? "draw" : "lose";
        const session: SessionStats = {
          id: `s-${Date.now()}`,
          startedAt: sessionStart ?? end - 1000,
          endedAt: end,
          difficulty,
          mode: gameMode,
          score: score + delta,
          tokensEarned,
          result: overallResult,
        };

        if (authMode === "registered") {
          persistRegisteredProgress(tokensEarned, score + delta, session);
        } else {
          persistGuestProgress(tokensEarned, score + delta, session);
        }

        setSessionStats(session);
        setSessionStart(null);
        playLevelCompleteJingle();
      }

      setIsRolling(false);
    }, 450);
  };

  const resetLevel = () => {
    setPlayerRoll(null);
    setOpponentRoll(null);
    setRound(1);
    setScore(0);
    setSessionStats(null);
    setSessionStart(null);
  };

  const currentLevelLabel = difficulty === 1 ? "Level 1 · Casual" : difficulty === 2 ? "Level 2 · Thinker" : "Level 3 · Mastermind";

  const canRoll = !sessionStats;

  const topBar = (
    <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white/70 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <DiceIcon />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-500">
            Dice Duel Logic Arena
          </p>
          <p className="text-sm text-slate-600">Quick-fire probability vs. logic duels.</p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs md:text-sm">
        <div className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600 shadow-sm sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {authMode === "registered" && userRecord ? (
            <span>
              Signed in as <span className="font-semibold">{userRecord.profile.id}</span>
            </span>
          ) : (
            <span>Guest session</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowTrivia((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:border-indigo-300 hover:text-indigo-600"
        >
          <span className="hidden sm:inline">History &amp; Tips</span>
          <span className="sm:hidden">Trivia</span>
          <span className="text-[0.65rem] uppercase tracking-[0.18em] text-slate-400">
            {showTrivia ? "Hide" : "Show"}
          </span>
        </button>
      </div>
    </header>
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-950/3">
      {topBar}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 pb-6 pt-4 md:flex-row">
        <section className="flex-1 space-y-4">
          {!authMode && (
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm shadow-slate-200/70">
              <h1 className="mb-1 text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                Jump in as Guest or Save your Arena Legacy
              </h1>
              <p className="mb-4 text-sm text-slate-600">
                Play instantly in guest mode, or create a lightweight username + 5-digit PIN to keep your tokens and high scores on this device.
              </p>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
                <button
                  type="button"
                  onClick={handleGuestPlay}
                  className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-emerald-400/60 bg-gradient-to-br from-emerald-50 via-emerald-50/70 to-white px-4 py-4 text-left shadow-sm shadow-emerald-200/70 transition hover:shadow-md"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-500">
                      Guest Mode
                    </p>
                    <p className="mt-1 text-sm font-medium text-emerald-950">
                      Play instantly. We keep your streak here as long as this browser remembers.
                    </p>
                  </div>
                  <p className="text-xs text-emerald-700">
                    No signup, no email. Best for quick practice runs.
                  </p>
                </button>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Registered Mode (local)
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Create a local arena identity with a username and 5-digit PIN stored via a mock API structure backed by localStorage.
                  </p>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600" htmlFor="username">
                        Username
                      </label>
                      <input
                        id="username"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. logicfox"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600" htmlFor="pin">
                        5-digit PIN
                      </label>
                      <input
                        id="pin"
                        type="password"
                        inputMode="numeric"
                        maxLength={5}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm tracking-[0.4em] text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        value={pin}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, "");
                          if (v.length <= 5) setPin(v);
                        }}
                        placeholder="•••••"
                      />
                    </div>
                  </div>
                  {authError && (
                    <p className="mt-2 text-xs text-rose-600">{authError}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleRegisteredLogin}
                    className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-violet-600"
                  >
                    Save my arena progress
                  </button>
                  <p className="mt-2 text-[0.7rem] text-slate-500">
                    Technical note: credentials and progress are simulated via localStorage-backed mock API objects only on this device.
                  </p>
                </div>
              </div>
            </div>
          )}

          {authMode && (
            <div className="space-y-3">
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200/70">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Main Dashboard
                    </p>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                      Your Arena Snapshot
                    </h2>
                    <p className="text-xs text-slate-600">
                      Track your tokens, peak score, and recent duels at a glance.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs sm:min-w-[280px]">
                    <StatCard label="Tokens" value={totalTokens} accent="amber" />
                    <StatCard label="High Score" value={highScore} accent="indigo" />
                    <StatCard
                      label="Sessions"
                      value={recentSessions.length}
                      accent="green"
                    />
                  </div>
                </div>
                {recentSessions.length > 0 && (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/80">
                    <div className="flex items-center justify-between px-3 py-2 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                      <span>Recent Duels</span>
                      <span>Score · Tokens · Time</span>
                    </div>
                    <ul className="divide-y divide-slate-100 text-xs">
                      {recentSessions.map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center justify-between gap-3 px-3 py-2 text-slate-700"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {s.mode === "vsMachine" ? "Vs. Machine" : "Vs. Random Player"}
                              {" · "}
                              {s.difficulty === 1
                                ? "L1"
                                : s.difficulty === 2
                                ? "L2"
                                : "L3"}
                            </span>
                            <span className="text-[0.7rem] text-slate-500">
                              {s.result.toUpperCase()} · {formatDuration(s.endedAt - s.startedAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[0.75rem]">
                            <span className="rounded-full bg-slate-900 text-white px-2 py-0.5 font-semibold">
                              {s.score}
                            </span>
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">
                              +{s.tokensEarned}T
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-950/[0.03] p-4 shadow-sm shadow-slate-200/70">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-500">
                      Configure Your Duel
                    </p>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                      {currentLevelLabel}
                    </h2>
                    <p className="text-xs text-slate-600">
                      Each level increases dice sides and subtle AI bias. Win more often, earn more tokens.
                    </p>
                  </div>
                  <div className="grid w-full max-w-md grid-cols-2 gap-2 text-xs">
                    <div className="rounded-2xl border border-slate-200 bg-white p-2">
                      <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Level
                      </p>
                      <div className="flex gap-1">
                        {[1, 2, 3].map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => {
                              setDifficulty(lvl as Difficulty);
                              resetLevel();
                            }}
                            className={cn(
                              "flex-1 rounded-xl px-2 py-1.5 text-[0.75rem] font-medium transition",
                              difficulty === lvl
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            )}
                          >
                            L{lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-2">
                      <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Mode
                      </p>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setGameMode("vsMachine");
                            resetLevel();
                          }}
                          className={cn(
                            "flex-1 rounded-xl px-2 py-1.5 text-[0.75rem] font-medium transition",
                            gameMode === "vsMachine"
                              ? "bg-violet-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          )}
                        >
                          Vs. Machine
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGameMode("vsRandom");
                            resetLevel();
                          }}
                          className={cn(
                            "flex-1 rounded-xl px-2 py-1.5 text-[0.75rem] font-medium transition",
                            gameMode === "vsRandom"
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          )}
                        >
                          Vs. Random Player
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)]">
                  <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white/80 p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Duel Board
                      </p>
                      <p className="text-[0.7rem] text-slate-500">
                        Round {round} / {levelTargetRounds}
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="flex flex-col items-center rounded-2xl bg-slate-900 px-3 py-3 text-slate-50">
                        <span className="text-[0.65rem] uppercase tracking-[0.18em] text-slate-400">
                          You
                        </span>
                        <span className="mt-1 text-3xl font-semibold">
                          {playerRoll ?? "–"}
                        </span>
                      </div>
                      <div className="flex flex-col items-center rounded-2xl bg-slate-100 px-3 py-3 text-slate-900">
                        <span className="text-[0.65rem] uppercase tracking-[0.18em] text-slate-500">
                          {gameMode === "vsMachine" ? "Machine" : "Random Player"}
                        </span>
                        <span className="mt-1 text-3xl font-semibold">
                          {opponentRoll ?? "–"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[0.65rem] uppercase tracking-[0.18em] text-slate-500">
                          Score
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-semibold",
                            score > 0
                              ? "bg-emerald-100 text-emerald-800"
                              : score < 0
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-100 text-slate-700"
                          )}
                        >
                          {score}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={resetLevel}
                        className="text-[0.7rem] font-medium text-slate-500 hover:text-slate-800"
                      >
                        Reset level
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={!canRoll}
                      onClick={handleRoll}
                      className={cn(
                        "mt-3 inline-flex items-center justify-center rounded-2xl px-3 py-2 text-sm font-semibold shadow-sm transition",
                        canRoll
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : "cursor-not-allowed bg-slate-200 text-slate-500"
                      )}
                    >
                      {sessionStats
                        ? "Level complete — start a new level"
                        : isRolling
                        ? "Rolling..."
                        : "Roll both dice"}
                    </button>
                  </div>

                  <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white/80 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Game Stat Dashboard
                    </p>
                    {sessionStats ? (
                      <div className="mt-2 space-y-2 text-xs">
                        <p className="text-sm font-semibold text-slate-900">
                          Last Session Summary
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <StatCard
                            label="Score Achieved"
                            value={sessionStats.score}
                            accent={sessionStats.score >= 0 ? "indigo" : "amber"}
                          />
                          <StatCard
                            label="Tokens Won"
                            value={sessionStats.tokensEarned}
                            accent="amber"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <StatCard
                            label="Duration"
                            value={formatDuration(
                              sessionStats.endedAt - sessionStats.startedAt
                            )}
                            accent="green"
                          />
                          <StatCard
                            label="Result"
                            value={sessionStats.result.toUpperCase()}
                            accent={
                              sessionStats.result === "win"
                                ? "green"
                                : sessionStats.result === "lose"
                                ? "amber"
                                : "indigo"
                            }
                          />
                        </div>
                        <p className="mt-1 text-[0.7rem] text-slate-500">
                          Wins award <span className="font-semibold">Tokens</span> based on level difficulty. Lose or draw, and your stats still help train your decision sense.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2 text-xs text-slate-600">
                        <p className="text-sm font-semibold text-slate-900">
                          Play a level to unlock detailed stats.
                        </p>
                        <p>
                          Each level is a short duel of {levelTargetRounds} rounds. Higher levels increase dice sides and slight opponent advantage so you must think carefully about when variance is in your favor.
                        </p>
                        <ul className="list-disc space-y-1 pl-4">
                          <li>
                            <span className="font-medium">Win</span>: earn tokens, boost your high score.
                          </li>
                          <li>
                            <span className="font-medium">Draw</span>: no tokens, but the session still logs.
                          </li>
                          <li>
                            <span className="font-medium">Lose</span>: learn from the probability swings and try again.
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <aside
          className={cn(
            "mt-1 w-full shrink-0 md:mt-0 md:w-80",
            showTrivia ? "block" : "hidden md:block"
          )}
        >
          <div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white/90 p-3 shadow-sm shadow-slate-200/70">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Trivia Module
                </p>
                <p className="text-xs text-slate-600">
                  100 quick bites on dice, probability &amp; logic design.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTrivia(false)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs text-slate-500 hover:bg-slate-100 md:hidden"
                aria-label="Close trivia"
              >
                ×
              </button>
            </div>
            <div className="mt-3 flex-1 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-700">
              <p className="mb-2 text-[0.7rem] text-slate-500">
                Designed to be reference-only: scroll while waiting between duels, but it never blocks your play area.
              </p>
              <ol className="space-y-1 pl-4">
                {TRIVIA_ITEMS.map((t, idx) => (
                  <li key={idx} className="marker:text-slate-400">
                    {t}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}


