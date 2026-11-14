"use client";
import React, { useState, useEffect, useRef } from "react";
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

interface HissatsuMove {
  name: string;
  rank: "C" | "B" | "A" | "S";
  type: string;
}

interface CharacterAttendance {
  totalPractice: number;
  weeklyPracticeStatus: string;
  trainingPoints: number;
  hissatsuList: HissatsuMove[];
}

interface Character {
  id: number;
  name: string;
  number: string;
  year: string;
  school: string;
  schoolName: string;
  position: string;
  element: string;
  isChampion: boolean;
  image: string;
  stats: CharacterStats;
  attendanceBack: CharacterAttendance;
  isSaved?: boolean;
}

// ฟังก์ชันช่วยเทียบชื่อโรงเรียนให้เป็นมาตรฐานเดียวกัน (Normalize)
const normalizeSchool = (val: string) => {
  if (!val) return "";
  const lower = val.toLowerCase();
  if (lower.includes("zakkaze")) return "zakkaze";
  if (lower.includes("sanrin")) return "sanrin";
  if (lower.includes("katsuen")) return "katsuen";
  if (lower.includes("gokuyou")) return "gokuyou";
  return lower;
};

// Component กราฟ Radar Chart 6 เหลี่ยมแบบ Real-time (หัวข้อ STATS)
const StatsRadarChart = ({ stats }: { stats: CharacterStats }) => {
  const size = 150;
  const center = size / 2;
  const radius = 38;
  const maxStat = 50;

  const currentMax = Math.max(
    maxStat,
    stats.shoot,
    stats.control,
    stats.speed,
    stats.defence,
    stats.power,
    stats.catch
  );

  const axes = [
    { label: "SHOOT", value: stats.shoot, angle: -90 },
    { label: "CONTROL", value: stats.control, angle: -30 },
    { label: "SPEED", value: stats.speed, angle: 30 },
    { label: "DEFENCE", value: stats.defence, angle: 90 },
    { label: "POWER", value: stats.power, angle: 150 },
    { label: "CATCH", value: stats.catch, angle: 210 },
  ];

  const getCoordinates = (angleDeg: number, r: number) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      x: center + r * Math.cos(angleRad),
      y: center + r * Math.sin(angleRad),
    };
  };

  const gridLevels = [0.33, 0.66, 1];

  const dataPoints = axes.map((axis) => {
    const ratio = Math.min(Math.max(axis.value, 0) / currentMax, 1);
    return getCoordinates(axis.angle, radius * ratio);
  });

  const polygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="w-full bg-white border border-[#00008B]/30 p-2 flex flex-col items-center justify-between rounded-none shadow-2xs">
      <span className="text-[7.5px] font-bold text-[#00008B] tracking-wider uppercase mb-1">
        STATS
      </span>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-auto max-h-[110px]"
      >
        {gridLevels.map((level, idx) => {
          const pts = axes
            .map((a) => {
              const coord = getCoordinates(a.angle, radius * level);
              return `${coord.x},${coord.y}`;
            })
            .join(" ");
          return (
            <polygon
              key={idx}
              points={pts}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="1"
              strokeDasharray={level < 1 ? "2,2" : "none"}
            />
          );
        })}

        {axes.map((axis, idx) => {
          const end = getCoordinates(axis.angle, radius);
          return (
            <line
              key={idx}
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          );
        })}

        <polygon
          points={polygonPoints}
          fill="rgba(0, 0, 139, 0.25)"
          stroke="#00008B"
          strokeWidth="2"
          className="transition-all duration-200 ease-out"
        />

        {dataPoints.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r="2"
            fill="#00008B"
            className="transition-all duration-200 ease-out"
          />
        ))}

        {axes.map((axis, idx) => {
          const labelPos = getCoordinates(axis.angle, radius + 16);
          return (
            <text
              key={idx}
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[7.5px] font-bold fill-slate-700"
            >
              {axis.label}
            </text>
          );
        })}
      </svg>
      <span className="text-[6.5px] font-bold text-slate-400 tracking-widest uppercase mt-1">
        ATTRIBUTES
      </span>
    </div>
  );
};

// Component ปฏิทิน Real-time เลื่อนเดือนได้เรื่อยๆ
const RealTimeCalendar = () => {
  const [today, setToday] = useState<Date | null>(null);
  const [viewDate, setViewDate] = useState<Date | null>(null);

  useEffect(() => {
    const now = new Date();
    setToday(now);
    setViewDate(now);

    const timer = setInterval(() => {
      setToday(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  if (!today || !viewDate) {
    return (
      <div className="border border-slate-300 p-3 bg-white text-center text-[10px] text-slate-400 rounded-none">
        LOADING CALENDAR...
      </div>
    );
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayRaw = new Date(year, month, 1).getDay();
  const startDayOffset = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const handleResetToday = () => {
    const now = new Date();
    setToday(now);
    setViewDate(now);
  };

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < startDayOffset; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const formattedMonth = String(month + 1).padStart(2, "0");

  return (
    <div className="border border-slate-300 p-3 bg-white text-center space-y-2 select-none rounded-none">
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="px-1.5 py-0.5 text-[10px] font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer rounded-none"
          title="เดือนก่อนหน้า"
        >
          &lt;
        </button>
        <button
          type="button"
          onClick={handleResetToday}
          className="font-bold text-[#00008B] hover:underline text-xs cursor-pointer"
          title="กลับไปวันปัจจุบัน"
        >
          {year}.{formattedMonth}
        </button>
        <button
          type="button"
          onClick={handleNextMonth}
          className="px-1.5 py-0.5 text-[10px] font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer rounded-none"
          title="เดือนถัดไป"
        >
          &gt;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[10px] font-bold text-slate-600">
        <span className="text-rose-600">M</span>
        <span>T</span>
        <span>W</span>
        <span>TH</span>
        <span>F</span>
        <span>S</span>
        <span className="text-rose-600">S</span>

        {calendarCells.map((day, idx) => {
          if (day === null) return <span key={idx}></span>;

          const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();

          const isSunday = idx % 7 === 6;

          return (
            <span
              key={idx}
              className={`py-0.5 ${
                isToday
                  ? "bg-[#00008B] text-white font-bold"
                  : isSunday
                  ? "text-rose-600"
                  : "text-slate-700"
              }`}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// Custom School Dropdown Component with Logos
const SchoolSelectDropdown = ({
  schools,
  value,
  onChange,
}: {
  schools: School[];
  value: string;
  onChange: (val: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedSchoolObj = schools.find((s) => s.key === value) || schools[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative text-xs" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border-2 border-[#00008B]/40 rounded-none p-2 bg-white/95 flex items-center justify-between cursor-pointer select-none font-bold shadow-2xs"
      >
        <div className="flex items-center gap-2 truncate">
          <img
            src={selectedSchoolObj.logo}
            alt={selectedSchoolObj.name}
            className="w-5 h-5 object-contain"
          />
          <span className="truncate">{selectedSchoolObj.name}</span>
        </div>
        <span className="text-[10px] text-slate-500">▼</span>
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border-2 border-[#00008B]/40 rounded-none shadow-lg max-h-48 overflow-y-auto">
          {schools.map((sch) => (
            <div
              key={sch.key}
              onClick={() => {
                onChange(sch.key);
                setIsOpen(false);
              }}
              className={`flex items-center gap-2 px-2.5 py-2 hover:bg-pink-50 cursor-pointer font-bold ${
                sch.key === value ? "bg-blue-50 text-[#00008B]" : "text-slate-800"
              }`}
            >
              <img src={sch.logo} alt={sch.name} className="w-5 h-5 object-contain" />
              <span className="truncate">{sch.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const [activeMenu, setActiveMenu] = useState<string>("dashboard");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // สถานะตรวจสอบการล็อกอินของผู้ใช้ผ่าน Cookie
  const [user, setUser] = useState<{ discord_id: string; username: string; school: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const currentUser = {
    role: "MEMBER",
    school: user?.school || "",
  };

  const [flippedCards, setFlippedCards] = useState<{ [key: number]: boolean }>({});

  const toggleFlip = (charId: number) => {
    setFlippedCards(prev => ({ ...prev, [charId]: !prev[charId] }));
  };

  // สร้างลิงก์ Discord OAuth2 แบบ Dynamic (รองรับทั้ง Localhost และ Vercel อัตโนมัติ)
  const [discordLoginUrl, setDiscordLoginUrl] = useState<string>("#");

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '154643511134244605';
    const redirectUri = `${window.location.origin}/api/auth/discord/callback`;
    setDiscordLoginUrl(
      `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`
    );
  }, []);

  const [schoolsData] = useState<School[]>([
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
      badge: "Katsuen",
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

  const [myCharacters, setMyCharacters] = useState<Character[]>([
    {
      id: 1,
      name: "ENDOU MAMORU",
      number: "01",
      year: "3",
      school: "Zakkaze",
      schoolName: "ZAKKAZE GAKUEN",
      position: "GK",
      element: "Fire",
      isChampion: true,
      image: "https://via.placeholder.com/150",
      stats: { shoot: 25, control: 20, speed: 10, defence: 1, power: 3, catch: 1 },
      attendanceBack: {
        totalPractice: 5,
        weeklyPracticeStatus: "NOT YET",
        trainingPoints: 3,
        hissatsuList: [
          { name: "God Hand", rank: "B", type: "GoalKeeper" },
          { name: "Fire Tornado", rank: "A", type: "Shoot" }
        ],
      },
      isSaved: true,
    },
  ]);

  const [selectedCharId, setSelectedCharId] = useState<number>(1);
  const [characters, setCharacters] = useState<Character[]>([]);

  const [newHissatsuName, setNewHissatsuName] = useState<string>("");
  const [newHissatsuRank, setNewHissatsuRank] = useState<"C" | "B" | "A" | "S">("C");
  const [newHissatsuType, setNewHissatsuType] = useState<string>("Shoot");

  const schoolMapping: { [key: string]: string } = {
    "Zakkaze": "ZAKKAZE GAKUEN",
    "Sanrin": "SANRIN JUNIOR HIGH SCHOOL",
    "Katsuen": "KATSUEN ACADEMY",
    "Gokuyou": "GOKUYOU",
  };

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const { data, error } = await supabase.from("players").select("*");
        if (error) {
          setCharacters(myCharacters);
        } else if (data && data.length > 0) {
          const formattedData: Character[] = data.map((p: any, index: number) => ({
            id: p.id ?? (index + 1),
            name: p.name ?? "UNKNOWN",
            number: p.number ?? "01",
            year: p.year ?? "01",
            school: p.school ?? "Zakkaze",
            schoolName: p.school_name ?? schoolMapping[p.school] ?? "ZAKKAZE GAKUEN",
            position: p.position ?? "MF",
            element: p.element ?? "Fire",
            isChampion: false,
            image: p.image ?? "https://via.placeholder.com/150",
            stats: {
              shoot: p.shoot ?? 10,
              control: p.control ?? 10,
              speed: p.speed ?? 10,
              defence: p.defence ?? 10,
              power: p.power ?? 10,
              catch: p.catch ?? 10,
            },
            attendanceBack: {
              totalPractice: p.total_practice ?? 0,
              weeklyPracticeStatus: p.weekly_practice_status ?? "NOT YET",
              trainingPoints: p.training_points ?? 3,
              hissatsuList: p.hissatsu_list ?? [{ name: "God Hand", rank: "B", type: "GoalKeeper" }],
            },
            isSaved: true,
          }));
          setCharacters(formattedData);
        } else {
          setCharacters(myCharacters);
        }
      } catch (err) {
        setCharacters(myCharacters);
      }
    }
    fetchPlayers();
  }, []);

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

  const handleStatChange = (charId: number, statKey: keyof CharacterStats, delta: number) => {
    const updateStatsLogic = (c: Character) => {
      if (c.id === charId) {
        const currentVal = c.stats[statKey];
        const currentWeeklyPoints = c.attendanceBack.trainingPoints;

        if (!c.isSaved) {
          return {
            ...c,
            stats: { ...c.stats, [statKey]: Math.max(0, currentVal + delta) }
          };
        }

        if (delta > 0 && currentWeeklyPoints > 0) {
          return {
            ...c,
            stats: { ...c.stats, [statKey]: currentVal + 1 },
            attendanceBack: { ...c.attendanceBack, trainingPoints: currentWeeklyPoints - 1 }
          };
        } else if (delta < 0 && currentVal > 0) {
          return {
            ...c,
            stats: { ...c.stats, [statKey]: currentVal - 1 },
            attendanceBack: { ...c.attendanceBack, trainingPoints: currentWeeklyPoints + 1 }
          };
        }
      }
      return c;
    };

    setMyCharacters(prev => prev.map(updateStatsLogic));
    setCharacters(prev => prev.map(updateStatsLogic));
  };

  const handleDirectStatInput = (statKey: keyof CharacterStats, value: number) => {
    setMyCharacters(prev => prev.map(c => {
      if (c.id === selectedCharId && !c.isSaved) {
        return {
          ...c,
          stats: { ...c.stats, [statKey]: Math.max(0, value) }
        };
      }
      return c;
    }));
    setCharacters(prev => prev.map(c => {
      if (c.id === selectedCharId && !c.isSaved) {
        return {
          ...c,
          stats: { ...c.stats, [statKey]: Math.max(0, value) }
        };
      }
      return c;
    }));
  };

  const handleAddHissatsu = () => {
    if (!newHissatsuName.trim()) return;
    const newMove: HissatsuMove = { 
      name: newHissatsuName.trim(), 
      rank: newHissatsuRank, 
      type: newHissatsuType 
    };

    const updateHissatsuLogic = (c: Character) => {
      if (c.id === selectedCharId) {
        const updatedList = [...c.attendanceBack.hissatsuList, newMove];
        return {
          ...c,
          attendanceBack: {
            ...c.attendanceBack,
            hissatsuList: updatedList
          }
        };
      }
      return c;
    };

    setMyCharacters(prev => prev.map(updateHissatsuLogic));
    setCharacters(prev => prev.map(updateHissatsuLogic));
    setNewHissatsuName("");
  };

  const handleRemoveHissatsu = (index: number) => {
    const removeHissatsuLogic = (c: Character) => {
      if (c.id === selectedCharId) {
        const updatedList = c.attendanceBack.hissatsuList.filter((_, i) => i !== index);
        return {
          ...c,
          attendanceBack: {
            ...c.attendanceBack,
            hissatsuList: updatedList
          }
        };
      }
      return c;
    };

    setMyCharacters(prev => prev.map(removeHissatsuLogic));
    setCharacters(prev => prev.map(removeHissatsuLogic));
  };

  const handleCreateNewCharacter = () => {
    if (myCharacters.length >= 4) {
      alert("สร้างตัวละครครบกำหนดแล้ว (สูงสุด 4 ตัวละคร)");
      return;
    }

    const newId = Date.now();
    const newChar: Character = {
      id: newId,
      name: "NEW PLAYER",
      number: "10",
      year: "1",
      school: "Zakkaze",
      schoolName: "ZAKKAZE GAKUEN",
      position: "FW",
      element: "Fire",
      isChampion: false,
      image: "https://via.placeholder.com/150",
      stats: { shoot: 10, control: 10, speed: 10, defence: 10, power: 10, catch: 10 },
      attendanceBack: {
        totalPractice: 0,
        weeklyPracticeStatus: "NOT YET",
        trainingPoints: 0,
        hissatsuList: [{ name: "Shoot Command", rank: "C", type: "Shoot" }],
      },
      isSaved: false,
    };

    setMyCharacters(prev => [...prev, newChar]);
    setSelectedCharId(newId);
    setCharacters(prev => [...prev, newChar]);
  };

  const activeChar = myCharacters.find(c => c.id === selectedCharId) || myCharacters[0];

  const handleUpdateBasicInfo = (field: string, value: any) => {
    if (field === "school") {
      const fullSchoolName = schoolMapping[value] || value;
      setMyCharacters(prev => prev.map(c => c.id === selectedCharId ? { ...c, school: value, schoolName: fullSchoolName } : c));
      setCharacters(prev => prev.map(c => c.id === selectedCharId ? { ...c, school: value, schoolName: fullSchoolName } : c));
    } else {
      setMyCharacters(prev => prev.map(c => c.id === selectedCharId ? { ...c, [field]: value } : c));
      setCharacters(prev => prev.map(c => c.id === selectedCharId ? { ...c, [field]: value } : c));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpdateBasicInfo("image", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCharacter = () => {
    setMyCharacters(prev => prev.map(c => c.id === selectedCharId ? { ...c, isSaved: true } : c));
    setCharacters(prev => prev.map(c => c.id === selectedCharId ? { ...c, isSaved: true } : c));
    alert("บันทึกข้อมูลตัวละครลงเว็บไซต์เรียบร้อย");
  };

  // กรองตัวละครเฉพาะโรงเรียนที่ตรงกับผู้ใช้
  const filteredChars = characters.filter(c => {
    if (currentUser.role !== "STAFF" && currentUser.school) {
      if (normalizeSchool(c.school) !== normalizeSchool(currentUser.school)) {
        return false;
      }
    }
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.position.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getRankBadgeStyle = (rank: string) => {
    switch (rank) {
      case "S": return "bg-rose-600 text-white font-black rounded-none";
      case "A": return "bg-amber-500 text-slate-900 font-black rounded-none";
      case "B": return "bg-blue-600 text-white font-black rounded-none";
      default: return "bg-slate-700 text-white font-bold rounded-none";
    }
  };

  const getHissatsuTypeBadgeStyle = (type: string) => {
    switch (type?.toLowerCase()) {
      case "shoot": return "bg-red-600 text-white";
      case "offence": return "bg-emerald-700 text-white";
      case "defence": return "bg-blue-700 text-white";
      case "goalkeeper": return "bg-slate-300 text-slate-800";
      case "long shot": return "bg-lime-400 text-slate-900";
      case "counter shot": return "bg-purple-700 text-white";
      default: return "bg-slate-700 text-white";
    }
  };

  const formatCheckinStatus = (status: string) => {
    const upper = status.toUpperCase();
    if (upper.includes("DONE") || upper.includes("CHECKED") || upper.includes("COMPLETE")) {
      return { text: "DONE", colorClass: "text-emerald-700" };
    }
    return { text: "NOT YET", colorClass: "text-amber-600" };
  };

  const getElementColorClass = (element: string) => {
    const el = element.toLowerCase();
    if (el.includes("fire")) return "text-rose-600";
    if (el.includes("mountain")) return "text-amber-800";
    if (el.includes("wind")) return "text-sky-500";
    if (el.includes("forest")) return "text-emerald-600";
    return "text-cyan-600";
  };

  return (
    <div className="min-h-screen bg-[#e9e9e9] text-slate-800 p-2 md:p-6 flex justify-center items-start">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        body, * {
          font-family: 'Inter', sans-serif !important;
          letter-spacing: -0.01em;
        }

        .cute-grid-paper {
          background-color: #ffffff;
          background-image:
            linear-gradient(to right, rgba(148, 163, 184, 0.22) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.22) 1px, transparent 1px);
          background-size: 22px 22px;
        }

        .pink-gingham {
          background-color: #fce7f3;
          background-image:
            linear-gradient(90deg, rgba(244, 114, 182, 0.28) 50%, transparent 50%),
            linear-gradient(rgba(244, 114, 182, 0.28) 50%, transparent 50%);
          background-size: 14px 14px;
        }

        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }

        .animate-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 16s linear infinite;
        }
      `}</style>

      <div className="w-full max-w-6xl bg-white border border-slate-300 p-4 shadow-sm space-y-4 rounded-none">
        
        {/* TOP NAV MENU */}
        <div className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-200 pb-2">
          <div className="text-[10px] text-slate-400 font-medium">
            INAZUMA ELEVEN NEW FRONTIER COMMUNITY PORTAL
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-700">
                  👤 {user.username} ({user.school})
                </span>
                <a
                  href="/api/auth/logout"
                  className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 text-[10px] font-bold rounded-none flex items-center gap-1 transition shadow-2xs"
                >
                  LOGOUT
                </a>
              </div>
            ) : (
              <a
                href={discordLoginUrl}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-2.5 py-1 text-[10px] font-bold rounded-none flex items-center gap-1 transition shadow-2xs"
              >
                LOGIN DISCORD
              </a>
            )}
          </div>
        </div>

        {/* ANNOUNCEMENT BAR */}
        <div className="bg-[#00008B] border border-slate-300 p-2 flex items-center text-white overflow-hidden relative rounded-none">
          <span className="bg-yellow-400 text-slate-900 font-bold px-2 py-0.5 text-xs uppercase tracking-wider border border-yellow-500 z-10 shrink-0 mr-3 rounded-none">
            📢 ANNOUNCEMENT
          </span>
          <div className="overflow-hidden w-full relative flex items-center">
            <div className="animate-marquee text-xs font-bold text-yellow-300">
              ⚡ ยินดีต้อนรับเข้าสู่ INAZUMA ELEVEN NEW FRONTIER
            </div>
          </div>
        </div>

        {/* HERO LOGO HEADER SECTION */}
        <div className="bg-[#00008B] border border-slate-300 p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-4 relative rounded-none">
          <div className="w-64 h-64 md:w-80 md:h-80 relative z-10">
            <img 
              src="https://oyftdgottzfzjtfbsibe.supabase.co/storage/v1/object/public/art%20commu/log%20pci7.png" 
              alt="Community Logo" 
              className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" 
            />
          </div>
        </div>

        {/* NAVER BLOG 3-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
          
          {/* LEFT SIDEBAR */}
          <aside className="md:col-span-2 space-y-4 text-xs">
            <div className="border border-slate-300 p-3 bg-slate-50 space-y-2 text-center rounded-none">
              <div className="w-full aspect-square bg-white border border-slate-200 p-2 flex items-center justify-center rounded-none">
                <img 
                  src="https://oyftdgottzfzjtfbsibe.supabase.co/storage/v1/object/public/art%20commu/log%20pci1.png" 
                  alt="Profile Widget" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div>
                <p className="font-bold text-xs text-[#00008B]">INAZUMA ELEVEN NEW FRONTIER</p>
                <p className="text-[9px] text-slate-500 mt-1 leading-tight">
                  If you encounter any issues, please contact @staff in the 📥﹢ask-staff channel on discord
                </p>
              </div>
            </div>

            {/* Quick Links (World Setting & Discord) - Minimal & Compact */}
            <div className="space-y-1.5">
              <a 
                href="https://docs.google.com/document/d/1c-dnaAZzWS6d5uZ0msO-us4nKw-G8ie8deLjh9Kq1FY/edit?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-[#00008B] hover:bg-blue-900 text-white font-bold py-1.5 px-2 text-center text-[10px] uppercase tracking-wider rounded-full transition shadow-2xs"
              >
                WORLD SETTING
              </a>
              <a 
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-[#00008B] hover:bg-blue-900 text-white font-bold py-1.5 px-2 text-center text-[10px] uppercase tracking-wider rounded-full transition shadow-2xs"
              >
                DISCORD
              </a>
            </div>

            {/* Real-Time Mini Calendar Widget */}
            <RealTimeCalendar />
          </aside>

          {/* CENTER MAIN CONTENT */}
          <main className="md:col-span-10 space-y-4">
            
            {/* Nav Header Switcher */}
            <div className="flex justify-between items-center border-b border-slate-300 pb-2 text-xs">
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveMenu("dashboard")}
                  className={`px-3 py-1 font-bold border border-slate-300 rounded-none ${activeMenu === "dashboard" ? "bg-[#00008B] text-white" : "bg-white text-slate-700"}`}
                >
                  HOME
                </button>
                {user && (
                  <>
                    <button 
                      onClick={() => setActiveMenu("directory")}
                      className={`px-3 py-1 font-bold border border-slate-300 rounded-none ${activeMenu === "directory" ? "bg-[#00008B] text-white" : "bg-white text-slate-700"}`}
                    >
                      MEMBERS
                    </button>
                    <button 
                      onClick={() => setActiveMenu("profile")}
                      className={`px-3 py-1 font-bold border border-slate-300 rounded-none ${activeMenu === "profile" ? "bg-[#00008B] text-white" : "bg-white text-slate-700"}`}
                    >
                      ⚙️ MY PROFILE ({myCharacters.length}/4)
                    </button>
                  </>
                )}
              </div>
              
              {user && activeMenu === "directory" && (
                <input 
                  type="text" 
                  placeholder="SEARCH..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-slate-300 px-2 py-1 text-[11px] w-32 focus:outline-none rounded-none"
                />
              )}
            </div>

            {/* DASHBOARD TAB */}
            {activeMenu === "dashboard" && (
              <div className="space-y-4">
                <div className="border border-slate-300 bg-white rounded-none">
                  <div className="bg-[#00008B] text-white px-3 py-1.5 font-bold text-xs flex justify-between border-b border-slate-300">
                    <span>📅 UPCOMING MATCH SCHEDULE</span>
                    <span className="text-yellow-300 text-[10px]">COMING SOON</span>
                  </div>
                  <div className="p-6 text-center text-slate-500">
                    <div className="text-2xl mb-1">⏳</div>
                    <p className="font-bold text-xs text-slate-700 uppercase">COMING SOON</p>
                    <p className="text-[10px]">โปรแกรมการแข่งขันและตารางนัดถัดไปของ Season 2 จะประกาศเร็วๆ นี้!</p>
                  </div>
                </div>

                <div className="border border-slate-300 bg-white rounded-none">
                  <div className="bg-[#00008B] text-white px-3 py-1.5 font-bold text-xs flex justify-between border-b border-slate-300">
                    <span>SEASON 1 RESULTS</span>
                    <span className="text-yellow-300 text-[10px]">LATEST SCORES</span>
                  </div>

                  <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recentMatches.map((match) => (
                      <div key={match.id} className="border border-slate-200 bg-slate-50 p-2 space-y-2 text-xs rounded-none">
                        <div className="bg-[#00008B] text-white px-2 py-1 flex justify-between items-center text-[10px] font-bold rounded-none">
                          <span>{match.matchday}</span>
                          <span className="bg-yellow-400 text-slate-900 font-bold px-1.5 py-0.2 border border-yellow-500 rounded-none">
                            {match.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between font-bold pt-1">
                          <div className="flex items-center gap-1.5">
                            <img src={match.teamA.logo} alt="" className="w-5 h-5 object-contain" />
                            <span className="text-[11px] text-[#00008B] truncate">{match.teamA.name}</span>
                          </div>
                          <div className="bg-[#00008B] text-white px-2 py-0.5 text-xs font-bold border border-slate-300 rounded-none">
                            {match.teamA.score} - {match.teamB.score}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-[#00008B] truncate">{match.teamB.name}</span>
                            <img src={match.teamB.logo} alt="" className="w-5 h-5 object-contain" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-300 bg-white rounded-none">
                  <div className="bg-[#00008B] text-white px-3 py-1.5 font-bold text-xs flex justify-between border-b border-slate-300">
                    <span>🏆 LIVE MATCH STANDINGS</span>
                    <span className="text-yellow-300 text-[10px]">SEASON 1</span>
                  </div>

                  <div className="p-3 overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-300 text-[10px] text-slate-500 font-bold">
                          <th className="p-1">SCHOOL</th>
                          <th className="p-1 text-center">MP</th>
                          <th className="p-1 text-center">W</th>
                          <th className="p-1 text-center">L</th>
                          <th className="p-1 text-center">D</th>
                          <th className="p-1 text-right">PTS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-bold">
                        {sortedSchools.map((s, idx) => (
                          <tr key={idx} className={s.isChampion ? 'bg-amber-50' : ''}>
                            <td className="p-1 flex items-center gap-1.5">
                              <img src={s.logo} alt="" className="w-4 h-4 object-contain" />
                              <span className="text-[11px] text-[#00008B]">{s.name}</span>
                              {s.key === "Zakkaze" && (
                                <span className="bg-amber-400 text-slate-900 text-[8px] px-1.5 py-0.2 font-black border border-black ml-1 rounded-none">
                                  👑 CHAMPION
                                </span>
                              )}
                            </td>
                            <td className="p-1 text-center">{s.matches}</td>
                            <td className="p-1 text-center text-emerald-600">{s.wins}</td>
                            <td className="p-1 text-center text-rose-600">{s.losses}</td>
                            <td className="p-1 text-center text-amber-600">{s.draws}</td>
                            <td className="p-1 text-right font-black text-[#00008B]">{(s as any).points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* DIRECTORY TAB (MEMBERS) - แสดงเฉพาะตัวละครของโรงเรียนตนเอง */}
            {user && activeMenu === "directory" && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-2.5 text-xs font-bold text-[#00008B] flex justify-between items-center rounded-none">
                  <span>🛡️ โรงเรียนสังกัดของคุณ: {user.school}</span>
                  <span className="text-[10px] text-slate-500">แสดงเฉพาะสมาชิกในสังกัดเท่านั้น</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredChars.length === 0 ? (
                    <div className="col-span-full border border-slate-300 bg-white p-8 text-center text-slate-500 text-xs rounded-none">
                      📭 ไม่พบข้อมูลตัวละครของโรงเรียนคุณในระบบ
                    </div>
                  ) : (
                    filteredChars.map((char) => {
                      const isFlipped = !!flippedCards[char.id];
                      const checkinInfo = formatCheckinStatus(char.attendanceBack.weeklyPracticeStatus);
                      const elementColorClass = getElementColorClass(char.element);
                      return (
                        <div key={char.id} className="border border-slate-300 bg-white p-3 space-y-3 rounded-none">
                          <div className="bg-[#00008B] text-white px-3 py-1 flex justify-between items-center text-xs font-bold border-b border-slate-300 rounded-none">
                            <span>CHARACTER PROFILE</span>
                            <span className="text-yellow-300">#NO. {char.number}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                            <div className="sm:col-span-5 space-y-2">
                              <div className="w-full aspect-[4/5] bg-slate-100 border border-slate-200 p-1 flex items-center justify-center overflow-hidden relative rounded-none">
                                {!isFlipped ? (
                                  <img src={char.image} alt={char.name} className="w-full h-full object-cover" />
                                ) : (
                                  <StatsRadarChart stats={char.stats} />
                                )}
                              </div>

                              <button
                                onClick={() => toggleFlip(char.id)}
                                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-1 px-2 border border-slate-400 text-[10px] flex items-center justify-center gap-1 cursor-pointer rounded-none"
                              >
                                🔄 FLIP
                              </button>
                              
                              <div className="grid grid-cols-2 gap-1 text-[10px] text-center font-bold uppercase">
                                <div className="bg-slate-100 border border-slate-200 p-1 rounded-none overflow-hidden">
                                  <span className="text-slate-400 block text-[7.5px]">POSITION</span>
                                  <span className="text-[#00008B] font-black text-[9px] truncate block">{char.position.toUpperCase()}</span>
                                </div>
                                <div className="bg-slate-100 border border-slate-200 p-1 rounded-none overflow-hidden">
                                  <span className="text-slate-400 block text-[7.5px]">ELEMENT</span>
                                  <span className={`font-black text-[9px] truncate block ${elementColorClass}`}>{char.element.toUpperCase()}</span>
                                </div>
                              </div>

                              <div className="border border-slate-200 bg-slate-50 p-1.5 text-center uppercase rounded-none">
                                <span className="text-[9px] text-slate-400 block font-bold">WEEKLY CHECKIN</span>
                                <span className={`text-[10px] font-black ${checkinInfo.colorClass}`}>{checkinInfo.text}</span>
                              </div>
                            </div>

                            <div className="sm:col-span-7 flex flex-col space-y-2">
                              <div className="pt-0">
                                <span className="text-[9px] font-bold text-[#00008B] block">NAME / SURNAME</span>
                                <h4 className="text-base font-black text-[#00008B] leading-tight mb-0.5 uppercase">{char.name}</h4>
                                <div className="flex items-center gap-2 text-[10px]">
                                  <span className="bg-yellow-200 px-1.5 py-0.2 font-bold border border-yellow-300 rounded-none">{char.year}</span>
                                  <span className="font-bold text-slate-700 uppercase">{char.schoolName}</span>
                                </div>
                              </div>

                              <div className="border border-slate-200 p-2 bg-slate-50 space-y-1 text-[10px] rounded-none">
                                <p className="font-bold text-[#00008B] border-b border-slate-200 pb-1 flex justify-between items-center">
                                  <span>STATUS</span>
                                </p>
                                <div className="grid grid-cols-2 gap-1.5 pt-1">
                                  {[
                                    { label: "SHOOT", key: "shoot" },
                                    { label: "CONTROL", key: "control" },
                                    { label: "SPEED", key: "speed" },
                                    { label: "DEFENCE", key: "defence" },
                                    { label: "POWER", key: "power" },
                                    { label: "CATCH", key: "catch" },
                                  ].map((s) => (
                                    <div key={s.key} className="flex justify-between items-center bg-white border border-slate-200 px-2 py-1 rounded-none">
                                      <span className="font-bold text-slate-600 text-[8px] tracking-tight">{s.label}</span>
                                      <span className="text-[#00008B] font-bold text-[9px]">{char.stats[s.key as keyof CharacterStats]}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* HISSATSU */}
                              <div className="border border-slate-200 p-2 bg-slate-50 space-y-1.5 text-[10px] rounded-none">
                                <p className="font-bold text-[#00008B]">HISSATSU</p>
                                <div className="flex flex-col gap-1.5">
                                  {char.attendanceBack.hissatsuList.map((m, i) => (
                                    <div key={i} className="flex items-center justify-between bg-white border border-blue-200 rounded-none px-3 py-1 shadow-2xs">
                                      <div className="flex items-center gap-1.5 truncate">
                                        <span className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-none ${getHissatsuTypeBadgeStyle(m.type)}`}>
                                          {m.type || "SHOOT"}
                                        </span>
                                        <span className="font-bold text-slate-800 text-[10px] truncate">{m.name}</span>
                                      </div>
                                      <span className={`px-2.5 py-0.5 text-[9px] uppercase shadow-2xs ${getRankBadgeStyle(m.rank)}`}>
                                        {m.rank}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                            </div>
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* MY PROFILE TAB - แสดงเฉพาะเมื่อล็อกอินแล้ว */}
            {user && activeMenu === "profile" && (
              <div className="space-y-4">
                
                {/* Selector Header */}
                <div className="border-2 border-[#00008B]/30 bg-white rounded-none p-3 flex flex-wrap justify-between items-center gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-[#00008B]">📓 SELECT OC:</span>
                    <select 
                      value={selectedCharId}
                      onChange={(e) => setSelectedCharId(Number(e.target.value))}
                      className="bg-slate-50 text-slate-900 border border-[#00008B]/30 rounded-none font-bold px-2.5 py-1 text-xs focus:outline-none"
                    >
                      {myCharacters.map((char) => (
                        <option key={char.id} value={char.id}>
                          {char.number} {char.name} {char.isSaved ? "✅" : "📝"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button 
                    onClick={handleCreateNewCharacter}
                    disabled={myCharacters.length >= 4}
                    className="bg-yellow-300 hover:bg-yellow-200 disabled:opacity-50 text-slate-900 font-bold px-3.5 py-1.5 rounded-none border-2 border-yellow-400 text-xs shadow-2xs transition cursor-pointer"
                  >
                    + สร้างตัวละครใหม่ ({myCharacters.length}/4)
                  </button>
                </div>

                {activeChar && (() => {
                  const checkinInfo = formatCheckinStatus(activeChar.attendanceBack.weeklyPracticeStatus);
                  const elementColorClass = getElementColorClass(activeChar.element);
                  return (
                    <div className="space-y-4">
                      
                      {/* CUTE NOTEBOOK */}
                      <div className="relative bg-[#00008B] p-2.5 md:p-3.5 rounded-none shadow-md mr-2">
                        
                        <div className="hidden sm:flex flex-col gap-2 absolute -right-2.5 top-10 z-0">
                          <div className="w-4 h-10 bg-emerald-300 rounded-none border border-emerald-400 shadow-xs"></div>
                          <div className="w-4 h-10 bg-amber-300 rounded-none border border-amber-400 shadow-xs"></div>
                        </div>

                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 rounded-none overflow-hidden bg-white shadow-inner">
                          
                          <div className="hidden lg:flex flex-col justify-evenly items-center absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-12 pink-gingham border-x border-pink-200 z-20 pointer-events-none py-6">
                            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-[#00008B]/40"></div>
                            {[...Array(7)].map((_, idx) => (
                              <div key={idx} className="relative flex items-center justify-between w-9">
                                <span className="w-2.5 h-2.5 rounded-none bg-[#00008B] shadow-inner"></span>
                                <span className="w-2.5 h-2.5 rounded-none bg-[#00008B] shadow-inner"></span>
                                <div className="absolute left-1 right-1 h-1.5 bg-white shadow-xs border border-slate-200"></div>
                              </div>
                            ))}
                          </div>

                          {/* LEFT PAGE */}
                          <div className="lg:col-span-6 cute-grid-paper p-4 lg:pr-9 space-y-3 relative flex flex-col justify-between">
                            <div className="space-y-3">
                              <div className="bg-[#00008B] text-white px-3.5 py-1.5 rounded-none flex justify-between items-center text-xs font-bold shadow-2xs">
                                <span>CHARACTER PROFILE</span>
                                <span className="text-yellow-300">#NO. {activeChar.number}</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                                <div className="sm:col-span-5 space-y-2">
                                  <div className="w-full aspect-[4/5] bg-white/90 border-2 border-[#00008B]/30 rounded-none p-1 flex items-center justify-center overflow-hidden relative shadow-2xs">
                                    <img src={activeChar.image} alt={activeChar.name} className="w-full h-full object-cover rounded-none" />
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-1 text-[10px] text-center font-bold uppercase">
                                    <div className="bg-white/90 border border-[#00008B]/25 rounded-none p-1 overflow-hidden">
                                      <span className="text-slate-400 block text-[7.5px]">POSITION</span>
                                      <span className="text-[#00008B] font-black text-[9px] truncate block">{activeChar.position.toUpperCase()}</span>
                                    </div>
                                    <div className="bg-white/90 border border-[#00008B]/25 rounded-none p-1 overflow-hidden">
                                      <span className="text-slate-400 block text-[7.5px]">ELEMENT</span>
                                      <span className={`font-black text-[9px] truncate block ${elementColorClass}`}>{activeChar.element.toUpperCase()}</span>
                                    </div>
                                  </div>

                                  <div className="border border-[#00008B]/25 bg-white/90 rounded-none p-1.5 text-center uppercase">
                                    <span className="text-[7.5px] text-slate-400 block font-bold">WEEKLY CHECKIN</span>
                                    <span className={`text-[9.5px] font-black ${checkinInfo.colorClass}`}>{checkinInfo.text}</span>
                                  </div>
                                </div>

                                <div className="sm:col-span-7 flex flex-col space-y-2">
                                  <div className="bg-white/80 rounded-none p-2 border border-[#00008B]/20">
                                    <span className="text-[8.5px] font-bold text-[#00008B] block">NAME / SURNAME</span>
                                    <h4 className="text-sm font-black text-[#00008B] leading-tight mb-1 uppercase truncate">{activeChar.name}</h4>
                                    <div className="flex items-center gap-2 text-[9.5px]">
                                      <span className="bg-yellow-200 px-1.5 py-0.5 rounded-none font-bold border border-yellow-300">{activeChar.year}</span>
                                      <span className="font-bold text-slate-700 uppercase truncate">{activeChar.schoolName}</span>
                                    </div>
                                  </div>

                                  <div className="border border-[#00008B]/25 rounded-none p-2 bg-white/90 space-y-1 text-[9px]">
                                    <div className="font-bold text-[#00008B] border-b border-slate-200 pb-1 flex justify-between items-center text-[9px]">
                                      <span>STATUS</span>
                                      {activeChar.isSaved ? (
                                        <span className="text-[8px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-none border border-amber-300">
                                          TP: {activeChar.attendanceBack.trainingPoints}
                                        </span>
                                      ) : (
                                        <span className="text-[7.5px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded-none border border-emerald-200">
                                          ✏️ ตรวจสอบ
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-1 pt-0.5">
                                      {[
                                        { label: "SHOOT", key: "shoot" },
                                        { label: "CONTROL", key: "control" },
                                        { label: "SPEED", key: "speed" },
                                        { label: "DEFENCE", key: "defence" },
                                        { label: "POWER", key: "power" },
                                        { label: "CATCH", key: "catch" },
                                      ].map((s) => (
                                        <div key={s.key} className="flex items-center justify-between bg-slate-50 border border-slate-200 px-1 py-0.5 rounded-none w-full box-border">
                                          <span className="font-bold text-slate-700 text-[7.5px] tracking-tight truncate shrink-0 max-w-[42px] mr-1">{s.label}</span>
                                          <div className="flex items-center gap-0.5 shrink-0">
                                            {activeChar.isSaved ? (
                                              <>
                                                <span className="text-[#00008B] font-black text-[9px] w-3.5 text-center shrink-0">{activeChar.stats[s.key as keyof CharacterStats]}</span>
                                                <div className="flex items-center gap-0.5 shrink-0">
                                                  <button 
                                                    onClick={() => handleStatChange(activeChar.id, s.key as keyof CharacterStats, -1)}
                                                    className="w-4 h-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-none text-[8px] flex items-center justify-center cursor-pointer leading-none shrink-0"
                                                  >
                                                    -
                                                  </button>
                                                  <button 
                                                    onClick={() => handleStatChange(activeChar.id, s.key as keyof CharacterStats, 1)}
                                                    disabled={activeChar.attendanceBack.trainingPoints <= 0}
                                                    className="w-4 h-4 bg-yellow-300 hover:bg-yellow-200 disabled:opacity-30 text-slate-900 font-bold rounded-none text-[8px] flex items-center justify-center cursor-pointer leading-none shrink-0"
                                                  >
                                                    +
                                                  </button>
                                                </div>
                                              </>
                                            ) : (
                                              <input 
                                                type="number"
                                                min="0"
                                                value={activeChar.stats[s.key as keyof CharacterStats]}
                                                onChange={(e) => handleDirectStatInput(s.key as keyof CharacterStats, Number(e.target.value))}
                                                className="w-8 text-center border border-slate-300 rounded-none text-[9px] font-bold p-0 bg-white"
                                              />
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="border border-[#00008B]/25 rounded-none p-2 bg-white/90 space-y-1.5 text-[9.5px]">
                                    <p className="font-bold text-[#00008B]">HISSATSU</p>
                                    <div className="flex flex-col gap-1">
                                      {activeChar.attendanceBack.hissatsuList.map((m, i) => (
                                        <div key={i} className="flex items-center justify-between bg-slate-50 border border-blue-200 rounded-none px-2 py-0.5">
                                          <div className="flex items-center gap-1.5 truncate">
                                            <span className={`px-2 py-0.5 text-[7.5px] font-bold uppercase rounded-none ${getHissatsuTypeBadgeStyle(m.type)}`}>
                                              {m.type || "SHOOT"}
                                            </span>
                                            <span className="font-bold text-slate-800 text-[9px] truncate max-w-[90px]">{m.name}</span>
                                          </div>
                                          <span className={`px-2 py-0.5 text-[8.5px] uppercase rounded-none ${getRankBadgeStyle(m.rank)}`}>
                                            {m.rank}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                </div>
                              </div>

                              <div className="pt-1">
                                <StatsRadarChart stats={activeChar.stats} />
                              </div>

                            </div>
                          </div>

                          {/* RIGHT PAGE: ฟอร์มแก้ไข */}
                          <div className="lg:col-span-6 cute-grid-paper p-4 lg:pl-9 space-y-3 text-xs flex flex-col justify-between border-t-4 lg:border-t-0 border-pink-200 relative">
                            <div className="space-y-3">
                              <p className="font-bold text-[#00008B] border-b-2 border-dashed border-[#00008B]/25 pb-1.5 flex justify-between items-center pr-2">
                                <span>✏️ แก้ไขข้อมูลตัวละคร</span>
                                {activeChar.isSaved && (
                                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-none text-[9.5px]">
                                    บันทึกแล้ว ✅
                                  </span>
                                )}
                              </p>

                              <div>
                                <label className="block text-[9.5px] text-slate-600 font-bold mb-1">NAME / SURNAME</label>
                                <input 
                                  type="text" 
                                  value={activeChar.name}
                                  onChange={(e) => handleUpdateBasicInfo("name", e.target.value)}
                                  className="w-full border-2 border-[#00008B]/30 rounded-none p-2 text-xs font-bold uppercase bg-white/95 focus:outline-none focus:border-[#00008B]"
                                />
                              </div>

                              <div>
                                <label className="block text-[9.5px] text-slate-600 font-bold mb-1">SCHOOL (โรงเรียนสังกัด)</label>
                                <SchoolSelectDropdown
                                  schools={schoolsData}
                                  value={activeChar.school}
                                  onChange={(val) => handleUpdateBasicInfo("school", val)}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[9.5px] text-slate-600 font-bold mb-1">JERSEY NUMBER</label>
                                  <input 
                                    type="text" 
                                    value={activeChar.number}
                                    onChange={(e) => handleUpdateBasicInfo("number", e.target.value)}
                                    className="w-full border-2 border-[#00008B]/30 rounded-none p-2 text-xs font-bold bg-white/95 focus:outline-none focus:border-[#00008B]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9.5px] text-slate-600 font-bold mb-1">YEAR / GRADE</label>
                                  <input 
                                    type="text" 
                                    value={activeChar.year}
                                    onChange={(e) => handleUpdateBasicInfo("year", e.target.value)}
                                    className="w-full border-2 border-[#00008B]/30 rounded-none p-2 text-xs font-bold bg-white/95 focus:outline-none focus:border-[#00008B]"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[9.5px] text-slate-600 font-bold mb-1">POSITION</label>
                                  <select 
                                    value={activeChar.position}
                                    onChange={(e) => handleUpdateBasicInfo("position", e.target.value)}
                                    className="w-full border-2 border-[#00008B]/30 rounded-none p-2 text-xs font-bold bg-white/95 uppercase focus:outline-none focus:border-[#00008B]"
                                  >
                                    <option value="FW">FW</option>
                                    <option value="MF">MF</option>
                                    <option value="DF">DF</option>
                                    <option value="GK">GK</option>
                                    <option value="Manager">MANAGER</option>
                                    <option value="Coordinator">COORDINATOR</option>
                                    <option value="Coach">COACH</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[9.5px] text-slate-600 font-bold mb-1">ELEMENT</label>
                                  <select 
                                    value={activeChar.element}
                                    onChange={(e) => handleUpdateBasicInfo("element", e.target.value)}
                                    className="w-full border-2 border-[#00008B]/30 rounded-none p-2 text-xs font-bold bg-white/95 uppercase focus:outline-none focus:border-[#00008B]"
                                  >
                                    <option value="Fire">FIRE</option>
                                    <option value="Mountain">MOUNTAIN</option>
                                    <option value="Wind">WIND</option>
                                    <option value="Forest">FOREST</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[9.5px] text-slate-600 font-bold mb-1">IMAGE UPLOAD</label>
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  className="w-full border-2 border-[#00008B]/30 rounded-none p-1 text-xs bg-white/95 file:mr-2 file:py-1 file:px-3 file:rounded-none file:border-0 file:text-xs file:font-bold file:bg-[#00008B] file:text-white hover:file:bg-blue-900 cursor-pointer"
                                />
                              </div>

                              <div className="border-2 border-pink-200 rounded-none p-2.5 bg-pink-50/60 space-y-2">
                                <p className="font-bold text-[#00008B] text-[9.5px]">✨ HISSATSU</p>
                                <div className="flex gap-1 items-center flex-wrap">
                                  <input 
                                    type="text" 
                                    placeholder="ชื่อท่าไม้ตาย..." 
                                    value={newHissatsuName}
                                    onChange={(e) => setNewHissatsuName(e.target.value)}
                                    className="flex-1 min-w-[90px] border border-pink-300 rounded-none p-1.5 text-xs bg-white focus:outline-none"
                                  />
                                  <select 
                                    value={newHissatsuType}
                                    onChange={(e) => setNewHissatsuType(e.target.value)}
                                    className="border border-pink-300 rounded-none p-1.5 text-[10px] font-bold bg-white uppercase"
                                  >
                                    <option value="Shoot">SHOOT</option>
                                    <option value="Offence">OFFENCE</option>
                                    <option value="Defence">DEFENCE</option>
                                    <option value="GoalKeeper">GOALKEEPER</option>
                                    <option value="Long Shot">LONG SHOT</option>
                                    <option value="Counter Shot">COUNTER SHOT</option>
                                  </select>
                                  <select 
                                    value={newHissatsuRank}
                                    onChange={(e) => setNewHissatsuRank(e.target.value as any)}
                                    className="border border-pink-300 rounded-none p-1.5 text-xs font-bold bg-white w-11"
                                  >
                                    <option value="C">C</option>
                                    <option value="B">B</option>
                                    <option value="A">A</option>
                                    <option value="S">S</option>
                                  </select>
                                  <button 
                                    type="button"
                                    onClick={handleAddHissatsu}
                                    className="bg-yellow-300 hover:bg-yellow-200 text-slate-900 font-bold px-2 py-1.5 rounded-none border border-yellow-400 text-xs cursor-pointer shrink-0"
                                  >
                                    + เพิ่ม
                                  </button>
                                </div>

                                <div className="flex flex-col gap-1.5 pt-1">
                                  {activeChar.attendanceBack.hissatsuList.map((m, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white border border-pink-200 rounded-none px-2 py-1 shadow-2xs">
                                      <div className="flex items-center gap-1.5 truncate">
                                        <span className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-none ${getHissatsuTypeBadgeStyle(m.type)}`}>
                                          {m.type || "SHOOT"}
                                        </span>
                                        <span className="font-bold text-slate-800 text-[9.5px] truncate max-w-[110px]">{m.name}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 text-[8.5px] uppercase rounded-none ${getRankBadgeStyle(m.rank)}`}>
                                          {m.rank}
                                        </span>
                                        <button 
                                          onClick={() => handleRemoveHissatsu(idx)}
                                          className="text-rose-500 font-black hover:text-rose-700 text-xs px-1 cursor-pointer"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                            </div>

                            <div className="pt-2">
                              <button 
                                onClick={handleSaveCharacter}
                                className="w-full bg-[#00008B] hover:bg-blue-900 text-white font-bold py-2.5 px-4 rounded-none flex items-center justify-center gap-2 shadow-sm text-xs transition cursor-pointer"
                              >
                                💾 บันทึกข้อมูลตัวละคร
                              </button>
                            </div>

                          </div>

                        </div>
                      </div>

                    </div>
                  );
                })()}

              </div>
            )}

          </main>

        </div>

        {/* FOOTER */}
        <div className="text-center text-[10px] text-slate-500 pt-4 border-t border-slate-200 font-bold">
          POWERED BY NAVER BLOG STYLE | INAZUMA ELEVEN NEW FRONTIER © ALL RIGHTS RESERVED
        </div>

      </div>
    </div>
  );
}