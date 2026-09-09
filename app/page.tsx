"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";

interface School {
  name: string;
  badge: string;
  key: string;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  isChampion: boolean;
  logo: string;
}

interface MatchTeam {
  name: string;
  score: number;
  logo: string;
}

interface RecentMatch {
  id: number;
  matchday: string;
  teamA: MatchTeam;
  teamB: MatchTeam;
  status: string;
}

interface CharacterStats {
  shoot: number;
  control: number;
  speed: number;
  defence: number;
  power: number;
  catch: number;
}

interface CharacterAttendance {
  matchesPlayed: number;
  eventsJoined: number;
  weeklyPractice: string;
  bonusPointsAdded: string;
  bioNote?: string;
}

interface Character {
  id: number;
  name: string;
  year: string;
  school: string;
  schoolName: string;
  position: string;
  element: string;
  isChampion: boolean;
  image: string;
  stats: CharacterStats;
  attendanceBack: CharacterAttendance;
}

export default function Home() {
  const [activeMenu, setActiveMenu] = useState<string>("dashboard");
  const [selectedSchool, setSelectedSchool] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  const toggleCardFlip = (id: number) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const { data, error } = await supabase.from("players").select("*");
        if (error) {
          console.error("Error fetching players:", error);
        } else if (data) {
          const formattedData: Character[] = data.map((p: any, index: number) => ({
            id: p.id ?? (index + 1),
            name: p.name ?? "UNKNOWN",
            year: p.year ?? "01",
            school: p.school ?? "Katsuen",
            schoolName: p.school_name ?? p.school ?? "ACADEMY",
            position: p.position ?? "MF",
            element: p.element ?? "FIRE",
            isChampion: false,
            image: p.image ?? "https://via.placeholder.com/150",
            stats: {
              shoot: p.shoot ?? 0,
              control: p.control ?? 0,
              speed: p.speed ?? 0,
              defence: p.defence ?? 0,
              power: p.power ?? 0,
              catch: p.catch ?? 0,
            },
            attendanceBack: {
              matchesPlayed: p.matches_played ?? 0,
              eventsJoined: p.events_joined ?? 0,
              weeklyPractice: p.weekly_practice ?? "1 ครั้ง / สัปดาห์",
              bonusPointsAdded: p.bonus_points ?? "+0 แต้ม",
            },
          }));
          setCharacters(formattedData);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayers();
  }, []);

  const [schoolsData, setSchoolsData] = useState<School[]>([
    { 
      name: "ZAKKAZE GAKUEN", 
      badge: "ZAKKAZE", 
      key: "Zakkaze", 
      matches: 5, wins: 4, losses: 0, draws: 1, isChampion: true,
      logo: "https://oyftdgottzfzjtfbsibe.supabase.co/storage/v1/object/public/logos/Zakkaze%20Gakuen.png" 
    },
    { 
      name: "SANRIN JUNIOR HIGH SCHOOL", 
      badge: "SANRIN", 
      key: "Sanrin", 
      matches: 5, wins: 2, losses: 3, draws: 0, isChampion: false,
      logo: "https://oyftdgottzfzjtfbsibe.supabase.co/storage/v1/object/public/logos/Sanrin%20Junior%20Highschool.png" 
    },
    { 
      name: "KATSUEN ACADEMY", 
      badge: "KATSUEN", 
      key: "Katsuen", 
      matches: 5, wins: 1, losses: 1, draws: 3, isChampion: false,
      logo: "https://oyftdgottzfzjtfbsibe.supabase.co/storage/v1/object/public/logos/Katsuen%20Academy.png" 
    },
    { 
      name: "GOKUYOU", 
      badge: "GOKUYOU", 
      key: "Gokuyou", 
      matches: 5, wins: 0, losses: 3, draws: 2, isChampion: false,
      logo: "https://oyftdgottzfzjtfbsibe.supabase.co/storage/v1/object/public/logos/Gokuyou.png" 
    },
  ]);

  const recentMatches: RecentMatch[] = [
    {
      id: 1,
      matchday: "MATCHDAY 5 (FINAL ROUND)",
      teamA: { name: "ZAKKAZE GAKUEN", score: 3, logo: schoolsData[0].logo },
      teamB: { name: "SANRIN JUNIOR HIGH", score: 1, logo: schoolsData[1].logo },
      status: "FINISHED"
    },
    {
      id: 2,
      matchday: "MATCHDAY 5",
      teamA: { name: "KATSUEN ACADEMY", score: 2, logo: schoolsData[2].logo },
      teamB: { name: "GOKUYOU", score: 2, logo: schoolsData[3].logo },
      status: "FINISHED"
    }
  ];

  const sortedSchools = [...schoolsData].map(school => ({
    ...school,
    points: (school.wins * 3) + (school.draws * 1)
  })).sort((a, b) => b.points - a.points);

  const [unlockedTeams, setUnlockedTeams] = useState<Record<string, boolean>>({
    Zakkaze: false,
    Sanrin: false,
    Katsuen: false,
    Gokuyou: false
  });

  const [passwordInputs, setPasswordInputs] = useState<Record<string, string>>({
    Zakkaze: "",
    Sanrin: "",
    Katsuen: "",
    Gokuyou: ""
  });

  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({
    Zakkaze: "",
    Sanrin: "",
    Katsuen: "",
    Gokuyou: ""
  });

  const [homeGlobalPassword, setHomeGlobalPassword] = useState<string>("");
  const [homeErrorMessage, setHomeErrorMessage] = useState<string>("");

  const correctPasswords: Record<string, string> = {
    Zakkaze: "zakkaze000",
    Sanrin: "sanrin123",
    Katsuen: "katsuen001",
    Gokuyou: "gokuyou989"
  };

  const handleUnlock = (schoolKey: string) => {
    if (passwordInputs[schoolKey] === correctPasswords[schoolKey]) {
      setUnlockedTeams(prev => ({ ...prev, [schoolKey]: true }));
      setErrorMessages(prev => ({ ...prev, [schoolKey]: "" }));
    } else {
      setErrorMessages(prev => ({ ...prev, [schoolKey]: "❌ รหัสผ่านไม่ถูกต้อง" }));
    }
  };

  const handleHomeGlobalUnlock = () => {
    const matchedEntry = Object.entries(correctPasswords).find(
      ([, pwd]) => pwd === homeGlobalPassword.trim()
    );

    if (matchedEntry) {
      const schoolKey = matchedEntry[0];
      setUnlockedTeams(prev => ({ ...prev, [schoolKey]: true }));
      setSelectedSchool(schoolKey);
      setActiveMenu("directory");
      setHomeGlobalPassword("");
      setHomeErrorMessage("");
    } else {
      setHomeErrorMessage("❌ รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
    }
  };

  const filteredChars = characters.filter(c => {
    const isUnlocked = unlockedTeams[c.school];
    if (!isUnlocked) return false;

    const matchesSchool = selectedSchool === "All" || c.school === selectedSchool;
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.position.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSchool && matchesSearch;
  });

  const getSchoolTheme = (schoolKey: string) => {
    switch (schoolKey) {
      case "Zakkaze":
        return {
          bg: "bg-[#E0F2FE]",
          headerBg: "bg-[#0284C7]",
          border: "border-[#7DD3FC]",
          accent: "text-[#0284C7]",
          radarColor: "#0284C7"
        };
      case "Sanrin":
        return {
          bg: "bg-[#DCFCE7]",
          headerBg: "bg-[#16A34A]",
          border: "border-[#86EFAC]",
          accent: "text-[#16A34A]",
          radarColor: "#16A34A"
        };
      case "Katsuen":
        return {
          bg: "bg-[#FDECEC]",
          headerBg: "bg-[#9E0B0F]",
          border: "border-[#D4A3A3]",
          accent: "text-[#9E0B0F]",
          radarColor: "#8B0000"
        };
      case "Gokuyou":
        return {
          bg: "bg-[#F1F5F9]",
          headerBg: "bg-[#0F172A]",
          border: "border-[#CBD5E1]",
          accent: "text-[#0F172A]",
          radarColor: "#0F172A"
        };
      default:
        return {
          bg: "bg-[#FDECEC]",
          headerBg: "bg-[#9E0B0F]",
          border: "border-[#D4A3A3]",
          accent: "text-[#9E0B0F]",
          radarColor: "#8B0000"
        };
    }
  };

  const renderRadarPolygon = (stats: CharacterStats, radarColor: string) => {
    const minVal = 0;
    const maxVal = 25;
    const size = 110;
    const center = size / 2;
    const radius = 42;

    const keys: (keyof CharacterStats)[] = ['shoot', 'control', 'speed', 'defence', 'power', 'catch'];
    
    const points = keys.map((key, i) => {
      const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
      const rawVal = Math.min(Math.max(stats[key], minVal), maxVal);
      const normalizedVal = (rawVal - minVal) / (maxVal - minVal);
      const r = normalizedVal * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={size} height={size} className="mx-auto overflow-visible">
        {[0.33, 0.66, 1].map((scale, idx) => {
          const polyPoints = keys.map((_, i) => {
            const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
            const r = radius * scale;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          }).join(' ');
          return (
            <polygon 
              key={idx} 
              points={polyPoints} 
              fill="none" 
              stroke="#94A3B8" 
              strokeWidth="0.8" 
              strokeDasharray={idx < 2 ? "2 2" : "none"}
              opacity="0.6"
            />
          );
        })}
        {keys.map((_, i) => {
          const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
          const x2 = center + radius * Math.cos(angle);
          const y2 = center + radius * Math.sin(angle);
          return <line key={i} x1={center} y1={center} x2={x2} y2={y2} stroke="#94A3B8" strokeWidth="0.8" opacity="0.5" />;
        })}
        <polygon 
          points={points} 
          fill={`${radarColor}40`} 
          stroke={radarColor} 
          strokeWidth="1.5" 
        />
        {keys.map((key, i) => {
          const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
          const rawVal = Math.min(Math.max(stats[key], minVal), maxVal);
          const normalizedVal = (rawVal - minVal) / (maxVal - minVal);
          const r = normalizedVal * radius;
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          return <circle key={i} cx={x} cy={y} r="2" fill={radarColor} />;
        })}
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-[#000033] text-slate-100 font-sans p-4 md:p-6 flex justify-center items-start">
      
      <style jsx global>{`
        @keyframes marqueeLoop {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes flashLightningSlow {
          0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 10px rgba(250, 204, 21, 0.6)); }
          50% { opacity: 0.4; transform: scale(1.15) rotate(-3deg); filter: drop-shadow(0 0 25px rgba(250, 204, 21, 0.9)); }
        }
        .animate-mega-flash-slow {
          animation: flashLightningSlow 2s infinite ease-in-out;
        }
      `}</style>

      <div className="w-full max-w-7xl bg-[#F8F9FC] text-slate-900 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
        
        {/* SIDEBAR */}
        <aside className="md:col-span-3 bg-[#00008B] text-white p-6 flex flex-col justify-between space-y-8">
          <div className="space-y-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center font-black text-xl">
                <img 
                  src="https://oyftdgottzfzjtfbsibe.supabase.co/storage/v1/object/public/art%20commu/log%20pci1.png" 
                  alt="Sidebar Logo" 
                  className="w-8 h-8 object-contain" 
                />
              </div>
              <div>
                <span className="font-black text-sm tracking-wider block leading-tight">INAZUMA ELEVEN</span>
                <span className="text-[10px] text-white/60 font-bold tracking-widest uppercase">NEW FRONTIER</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-3">MENU</p>
              
              <button 
                onClick={() => setActiveMenu("dashboard")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-black transition uppercase ${
                  activeMenu === "dashboard" ? "bg-white text-[#00008B] shadow-lg" : "text-white/80 hover:bg-white/10"
                }`}
              >
                <span className="text-3xl animate-mega-flash-slow inline-block text-amber-400">⚡</span>
                <span>HOME</span>
              </button>

              {Object.values(unlockedTeams).some(Boolean) && (
                <button 
                  onClick={() => setActiveMenu("directory")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-black transition uppercase ${
                    activeMenu === "directory" ? "bg-white text-[#00008B] shadow-lg" : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  <span className="text-3xl animate-mega-flash-slow inline-block text-amber-400">⚡</span>
                  <span>PLAYER DIRECTORY</span>
                </button>
              )}

              <button 
                onClick={() => setActiveMenu("manual")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-black transition uppercase ${
                  activeMenu === "manual" ? "bg-white text-[#00008B] shadow-lg" : "text-white/80 hover:bg-white/10"
                }`}
              >
                <span className="text-3xl animate-mega-flash-slow inline-block text-amber-400">⚡</span>
                <span>COMPETITION MANUAL</span>
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <a 
              href="https://discord.com" 
              target="_blank" 
              rel="noreferrer"
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 p-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition uppercase"
            >
              <span>💬</span> DISCORD COMMUNITY
            </a>
            <div className="text-[10px] text-white/40 text-center font-bold tracking-widest uppercase">
              @STAFF #INZ_NF
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="md:col-span-9 p-6 md:p-10 flex flex-col justify-between space-y-8 bg-[#F4F5F9]">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white px-5 py-3 rounded-full shadow-sm border border-slate-200/60">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                <img 
                  src="https://oyftdgottzfzjtfbsibe.supabase.co/storage/v1/object/public/art%20commu/log%20pci1.png" 
                  alt="Dashboard Logo" 
                  className="w-8 h-8 object-contain" 
                />
              </div>
              <div className="truncate">
                <span className="text-xs md:text-sm font-black text-[#00008B] uppercase tracking-wide truncate block">
                  {activeMenu === 'dashboard' && "INAZUMA ELEVEN NEW FRONTIER SS2"}
                  {activeMenu === 'directory' && "PLAYER DIRECTORY"}
                  {activeMenu === 'manual' && "COMPETITION MANUAL"}
                </span>
              </div>
            </div>

            {activeMenu === 'directory' && (
              <div className="w-full md:w-auto flex items-center gap-2 bg-[#F4F5F9] px-4 py-1.5 rounded-full border border-slate-200">
                <span className="text-slate-400 text-xs">🔍</span>
                <input 
                  type="text" 
                  placeholder="SEARCH PLAYER..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-48 bg-transparent text-xs font-medium text-slate-800 focus:outline-none uppercase"
                />
              </div>
            )}
          </div>

          <div className="space-y-6 flex-1">
            
            {activeMenu === 'dashboard' && (
              <div className="space-y-6">
                
                <div className="bg-[#00008B] text-white rounded-2xl p-3 shadow-sm flex items-center overflow-hidden border border-blue-900/40 relative">
                  <div className="bg-amber-400 text-slate-900 text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-sm z-20 flex-shrink-0 animate-pulse">
                    <span>📢</span> ANNOUNCEMENT
                  </div>
                  <div className="overflow-hidden whitespace-nowrap relative w-full ml-3">
                    <div className="inline-block animate-[marqueeLoop_25s_linear_infinite] text-xs font-bold tracking-wide uppercase text-white/90">
                      <span className="mx-24">⚡ ยินดีต้อนรับสู่ Inazuma Eleven New Frontier Season 2 !</span>
                      <span className="mx-24">⚡ ยินดีกับ HAKUKYO จากทีม ZAKKAZE สำหรับใบแดงใบแรกของมู !</span>
                      <span className="mx-24">⚡ ยินดีกับ HAKUKYO จากทีม ZAKKAZE กับ HAT TRICK ในแมทซ์สุดท้ายของการแข่งขัน !</span>
                    </div>
                  </div>
                </div>

                {/* HERO BANNER - โลโก้หลัก log pci7.png ตามคำขอก่อนหน้า */}
                <div className="bg-[#00008B] text-white p-10 md:p-16 rounded-3xl shadow-lg relative overflow-hidden flex flex-col items-center text-center space-y-6">
                  <div className="absolute right-[-30px] bottom-[-40px] text-white/10 pointer-events-none select-none z-0">
                    <svg width="250" height="250" viewBox="0 0 200 200" fill="currentColor">
                      <polygon points="110,0 20,90 90,90 60,200 180,80 110,80" />
                    </svg>
                  </div>

                  <div className="w-72 h-72 md:w-96 md:h-96 relative z-10 drop-shadow-2xl">
                    <img 
                      src="https://oyftdgottzfzjtfbsibe.supabase.co/storage/v1/object/public/art%20commu/log%20pci7.png" 
                      alt="Community Logo" 
                      className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]" 
                    />
                  </div>

                  <div className="relative z-10 space-y-4 max-w-lg">
                    <div className="space-y-3">
                      <span className="bg-amber-400 text-slate-900 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-sm inline-block">
                        COMMUNITY OC ROLEPLAY
                      </span>
                      <p className="text-white/80 text-xs md:text-sm font-medium leading-relaxed normal-case block pt-1">
                        กรอกรหัสผ่านประจำทีมของคุณเพื่อปลดล็อกและเข้าดูข้อมูลตัวละครในการแข่งขัน
                      </p>
                    </div>

                    <div className="bg-white/10 p-4 rounded-2xl border border-white/20 w-full max-w-md mx-auto space-y-3 backdrop-blur-sm mt-4">
                      <div className="text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
                        <span>🔐</span> ENTER TEAM PASSWORD
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="password"
                          placeholder="INPUT TEAM PASSWORD..."
                          value={homeGlobalPassword}
                          onChange={(e) => setHomeGlobalPassword(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleHomeGlobalUnlock(); }}
                          className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-xs px-4 py-2.5 rounded-xl font-bold focus:outline-none text-center"
                        />
                        <button 
                          onClick={handleHomeGlobalUnlock}
                          className="bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black px-5 py-2.5 rounded-xl transition shadow flex-shrink-0 uppercase"
                        >
                          SUBMIT
                        </button>
                      </div>
                      {homeErrorMessage && (
                        <p className="text-[10px] text-rose-300 font-bold">{homeErrorMessage}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
                  <div className="bg-[#00008B] text-white px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-wider">📅 UPCOMING MATCH SCHEDULE</h3>
                    <span className="text-[10px] text-amber-300 font-bold uppercase tracking-widest animate-pulse">COMING SOON</span>
                  </div>

                  <div className="p-8 text-center space-y-3 bg-[#F8F9FC]">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl mx-auto flex items-center justify-center text-xl font-black shadow-sm animate-bounce">
                      ⏳
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-[#00008B] uppercase tracking-wide">COMING SOON</h4>
                      <p className="text-xs text-slate-500 font-medium normal-case max-w-md mx-auto">
                        โปรแกรมการแข่งขันและตารางนัดถัดไปของ Season 2 จะประกาศให้ทราบเร็วๆ นี้!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
                  <div className="bg-[#00008B] text-white px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-wider">⚽ SEASON 1 RESULTS</h3>
                    <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">LATEST SCORES</span>
                  </div>

                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentMatches.map((match) => (
                      <div key={match.id} className="bg-[#F8F9FC] border border-slate-200/85 rounded-2xl p-4 space-y-3 shadow-sm">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <span>{match.matchday}</span>
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">{match.status}</span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100 p-1">
                              <img src={match.teamA.logo} alt={match.teamA.name} className="w-full h-full object-contain" />
                            </div>
                            <span className="text-xs font-black text-[#00008B] truncate">{match.teamA.name}</span>
                          </div>

                          <div className="bg-[#00008B] text-white px-3 py-1.5 rounded-xl font-black text-sm tracking-widest flex items-center gap-2 shadow-sm flex-shrink-0">
                            <span>{match.teamA.score}</span>
                            <span className="text-white/40">-</span>
                            <span>{match.teamB.score}</span>
                          </div>

                          <div className="flex items-center justify-end gap-2 flex-1 min-w-0 text-right">
                            <span className="text-xs font-black text-[#00008B] truncate">{match.teamB.name}</span>
                            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100 p-1">
                              <img src={match.teamB.logo} alt={match.teamB.name} className="w-full h-full object-contain" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
                  <div className="bg-[#00008B] text-white px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-wider">🏆 LIVE MATCH STANDINGS</h3>
                    <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">SEASON 1</span>
                  </div>

                  <div className="p-3 md:p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse table-auto">
                        <thead>
                          <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase">
                            <th className="py-1 px-3 w-[55%]">SCHOOL</th>
                            <th className="py-1 px-1 text-center w-[9%]">MP</th>
                            <th className="py-1 px-1 text-center w-[9%]">W</th>
                            <th className="py-1 px-1 text-center w-[9%]">L</th>
                            <th className="py-1 px-1 text-center w-[9%]">D</th>
                            <th className="py-1 px-3 text-right w-[9%]">PTS</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs font-bold divide-y divide-slate-100 uppercase">
                          {sortedSchools.map((s, idx) => (
                            <tr key={idx} className={`transition ${s.isChampion ? 'bg-amber-50/60 font-black' : 'hover:bg-slate-50'}`}>
                              <td className="py-2 px-3 flex items-center gap-2">
                                <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                                  <img src={s.logo} alt={s.name} className="w-full h-full object-contain drop-shadow-sm" />
                                </div>
                                <span className="text-[#00008B] truncate">{s.name}</span>
                                {s.isChampion && (
                                  <span className="bg-amber-400 text-slate-900 text-[8px] px-2 py-0.5 rounded-md font-black shadow-sm animate-pulse ring-1 ring-amber-300">
                                    👑 CHAMPION
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-1 text-center text-slate-600">{s.matches}</td>
                              <td className="py-2 px-1 text-center text-emerald-600">{s.wins}</td>
                              <td className="py-2 px-1 text-center text-rose-500">{s.losses}</td>
                              <td className="py-2 px-1 text-center text-amber-600">{s.draws}</td>
                              <td className="py-2 px-3 text-right text-sm font-black text-[#00008B]">{(s as any).points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {activeMenu === 'directory' && (
              <div className="space-y-6">
                
                {/* TEAM CONTROL */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase text-[#00008B] tracking-wider">TEAM CONTROL</h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">ENTER PASSWORD TO UNLOCK STATS</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {sortedSchools.map((school) => {
                      const isUnlocked = unlockedTeams[school.key];

                      return (
                        <div 
                          key={school.key} 
                          className={`p-5 rounded-2xl border flex flex-col items-center text-center space-y-4 uppercase transition-all shadow-sm ${
                            school.isChampion ? 'bg-amber-50/40 border-amber-300' : 'bg-[#F8F5F9] border-slate-200'
                          }`}
                        >
                          <div className="w-20 h-20 flex items-center justify-center">
                            <img src={school.logo} alt={school.name} className="w-full h-full object-contain" />
                          </div>

                          <div className="space-y-1 w-full">
                            <h4 className="text-xs font-black text-[#00008B] tracking-wide line-clamp-1">
                              {school.name} {school.isChampion && '👑'}
                            </h4>
                            <span className={`text-[10px] font-bold block ${isUnlocked ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {isUnlocked ? '🔓 UNLOCKED' : '🔒 LOCKED'}
                            </span>
                          </div>

                          <div className="w-full space-y-2 mt-auto">
                            {!isUnlocked ? (
                              <>
                                <input 
                                  type="password" 
                                  placeholder="TEAM PASSWORD"
                                  value={passwordInputs[school.key]}
                                  onChange={(e) => setPasswordInputs({ ...passwordInputs, [school.key]: e.target.value })}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 text-center font-bold"
                                />
                                <button 
                                  onClick={() => handleUnlock(school.key)}
                                  className="w-full bg-[#00008B] hover:bg-blue-900 text-white font-black text-xs py-2 rounded-xl shadow uppercase transition"
                                >
                                  UNLOCK
                                </button>
                                {errorMessages[school.key] && (
                                  <p className="text-[10px] text-rose-500 font-bold normal-case">{errorMessages[school.key]}</p>
                                )}
                              </>
                            ) : (
                              <button 
                                onClick={() => {
                                  setUnlockedTeams(prev => ({ ...prev, [school.key]: false }));
                                  const stillHasUnlocked = Object.entries(unlockedTeams).some(([k, val]) => k !== school.key && val);
                                  if (!stillHasUnlocked) {
                                    setActiveMenu("dashboard");
                                    setSelectedSchool("All");
                                  } else {
                                    setSelectedSchool("All");
                                  }
                                }}
                                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-2 rounded-xl uppercase transition"
                              >
                                LOG OUT
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 uppercase">
                  {Object.values(unlockedTeams).filter(Boolean).length > 1 && (
                    <button
                      onClick={() => setSelectedSchool("All")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm uppercase ${
                        selectedSchool === "All"
                          ? "bg-[#00008B] text-white"
                          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      SHOW ALL
                    </button>
                  )}

                  {sortedSchools
                    .filter(school => unlockedTeams[school.key])
                    .map((school) => (
                      <button
                        key={school.key}
                        onClick={() => setSelectedSchool(school.key)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm uppercase ${
                          selectedSchool === school.key
                            ? "bg-[#00008B] text-white"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        {school.isChampion ? `👑 ${school.name}` : school.name}
                      </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 uppercase">
                  {filteredChars.length === 0 ? (
                    <div className="col-span-full bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
                      <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl mx-auto flex items-center justify-center text-xl font-black">
                        📭
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-[#00008B] uppercase tracking-wide">NO CHARACTERS FOUND</h4>
                        <p className="text-xs text-slate-500 font-medium normal-case">
                          ไม่พบข้อมูลตัวละคร หรือยังไม่ได้ปลดล็อกรหัสผ่านของโรงเรียนนี้
                        </p>
                      </div>
                    </div>
                  ) : (
                    filteredChars.map((char) => {
                      const teamUnlocked = unlockedTeams[char.school];
                      const isFlipped = !!flippedCards[char.id];
                      const theme = getSchoolTheme(char.school);

                      return (
                        <div key={char.id} className={`w-full max-w-[450px] mx-auto ${theme.bg} border ${theme.border} shadow-lg overflow-hidden relative transition-all duration-300`}>
                          
                          <div className={`${theme.headerBg} text-white px-4 py-3 flex justify-between items-center shadow-md`}>
                            <span className="text-[12px] font-black tracking-widest uppercase">
                              {isFlipped ? "ACTIVITY LOG" : "INAZUMA ID CARD"}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold tracking-widest text-amber-300">#INZ_NF</span>
                              {teamUnlocked && (
                                <button 
                                  onClick={() => toggleCardFlip(char.id)}
                                  className="bg-amber-400 hover:bg-amber-300 text-slate-900 text-[9px] font-black px-2.5 py-1 rounded transition shadow uppercase flex items-center gap-1"
                                >
                                  <span>🔄</span> {isFlipped ? "VIEW FRONT" : "FLIP CARD"}
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="p-4 space-y-3">
                            {!isFlipped ? (
                              <div className="flex gap-4">
                                <div className="w-[140px] flex-shrink-0 flex flex-col gap-2">
                                  <div className={`w-full aspect-[4/5] bg-white border ${theme.border} p-1.5 shadow-sm`}>
                                    <img src={char.image} alt={char.name} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <div className={`bg-white border ${theme.border} p-1.5 text-center shadow-sm`}>
                                      <span className="text-[7px] font-bold text-slate-400 block mb-0.5 tracking-wider">POSITION</span>
                                      <span className={`text-[10px] font-black ${theme.accent} block truncate`}>{char.position}</span>
                                    </div>
                                    <div className={`bg-white border ${theme.border} p-1.5 text-center shadow-sm`}>
                                      <span className="text-[7px] font-bold text-slate-400 block mb-0.5 tracking-wider">ELEMENT</span>
                                      <span className="text-[10px] font-black text-[#0088CC] block truncate">{char.element}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex-1 flex flex-col justify-between">
                                  <div className="mb-2 pb-2 border-b border-slate-300/60">
                                    <span className={`text-[8px] font-black ${theme.accent} block tracking-widest mb-0.5`}>NAME / SURNAME</span>
                                    <h4 className={`text-[18px] font-black ${theme.accent} leading-tight mb-2 tracking-wide`}>{char.name}</h4>
                                    <div className="flex items-center gap-2">
                                      <span className="bg-[#FFF4B3] text-slate-800 text-[10px] px-1.5 py-0.5 font-bold border border-[#FDE047] leading-none">
                                        {char.year}
                                      </span>
                                      <span className="text-[10px] font-black text-[#334155]">{char.schoolName}</span>
                                    </div>
                                  </div>

                                  <div className={`bg-white border ${theme.border} p-3 shadow-sm flex-1 flex flex-col justify-center relative`}>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[80px] opacity-[0.03] pointer-events-none">
                                      ⚽
                                    </div>
                                    
                                    <div className="space-y-1.5 relative z-10">
                                      <div className="flex justify-between text-[11px] font-bold items-center">
                                        <span className="text-[#334155]">SHOOT</span>
                                        <span className="text-orange-500 font-black">{char.stats.shoot}</span>
                                      </div>
                                      <div className="flex justify-between text-[11px] font-bold items-center">
                                        <span className="text-[#334155]">CONTROL</span>
                                        <span className="text-blue-500 font-black">{char.stats.control}</span>
                                      </div>
                                      <div className="flex justify-between text-[11px] font-bold items-center">
                                        <span className="text-[#334155]">SPEED</span>
                                        <span className="text-green-600 font-black">{char.stats.speed}</span>
                                      </div>
                                      <div className="flex justify-between text-[11px] font-bold items-center">
                                        <span className="text-[#334155]">DEFENCE</span>
                                        <span className="text-purple-600 font-black">{char.stats.defence}</span>
                                      </div>
                                      <div className="flex justify-between text-[11px] font-bold items-center">
                                        <span className="text-[#334155]">POWER</span>
                                        <span className="text-orange-600 font-black">{char.stats.power}</span>
                                      </div>
                                      <div className="flex justify-between text-[11px] font-bold items-center">
                                        <span className="text-[#334155]">CATCH</span>
                                        <span className="text-pink-500 font-black">{char.stats.catch}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className={`bg-white border ${theme.border} p-4 rounded-xl shadow-inner space-y-3`}>
                                <div className="grid grid-cols-12 gap-3 items-center">
                                  <div className="col-span-7 space-y-2.5">
                                    <div className={`${theme.bg} border ${theme.border} p-3 rounded-xl space-y-2 shadow-sm`}>
                                      <span className={`text-[9px] font-black ${theme.accent} uppercase tracking-wider block`}>ACTIVITY LOG</span>
                                      <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold text-slate-700">
                                        <div>MATCHES PLAYED: <span className={`${theme.accent} font-black block`}>{char.attendanceBack.matchesPlayed}</span></div>
                                        <div>EVENTS JOINED: <span className={`${theme.accent} font-black block`}>{char.attendanceBack.eventsJoined}</span></div>
                                        <div className="col-span-2">WEEKLY PRACTICE : <span className={`${theme.accent} font-black`}>{char.attendanceBack.weeklyPractice}</span></div>
                                      </div>
                                    </div>

                                    <div className="flex justify-between items-center bg-white border border-slate-300 px-3 py-2 rounded-xl text-[9px] font-black text-slate-600">
                                      <span>BONUS POINTS :</span>
                                      <span className="text-emerald-600">{char.attendanceBack.bonusPointsAdded}</span>
                                    </div>
                                  </div>

                                  <div className={`col-span-5 flex flex-col items-center justify-center ${theme.bg} border ${theme.border} p-2 rounded-xl shadow-inner`}>
                                    <span className={`text-[8px] font-black ${theme.accent} uppercase tracking-widest mb-1`}>STATS RADAR</span>
                                    {renderRadarPolygon(char.stats, theme.radarColor)}
                                    <span className="text-[7px] font-bold text-slate-400 mt-1 uppercase">ATTRIBUTES</span>
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            )}

            {activeMenu === 'manual' && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 space-y-4">
                <h3 className="text-xs font-black uppercase text-[#00008B] tracking-wider">COMPETITION MANUAL</h3>
                <p className="text-xs text-slate-600 font-medium normal-case">
                  คู่มือการแข่งขัน กฎกติกา และรายละเอียดระบบการแข่งขันทั้งหมดของซีซันนี้จะแสดงที่นี่
                </p>
              </div>
            )}

          </div>

          <div className="text-center pt-4 border-t border-slate-200 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            INAZUMA ELEVEN NEW FRONTIER © ALL RIGHTS RESERVED
          </div>

        </main>
      </div>
    </div>
  );
}
