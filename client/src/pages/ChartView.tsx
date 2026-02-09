import React, { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useGuestChart } from "@/contexts/GuestChartContext";
import { ExportButton } from "@/components/ExportButton";

import {
  Star,
  ArrowLeft,
  Info,
  Save,
  RotateCcw,
  Plus,
  Briefcase
} from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ZODIAC_SYMBOLS: Record<string, string> = {
  "Aries": "♈", "Taurus": "♉", "Gemini": "♊", "Cancer": "♋",
  "Leo": "♌", "Virgo": "♍", "Libra": "♎", "Scorpio": "♏",
  "Sagittarius": "♐", "Capricorn": "♑", "Aquarius": "♒", "Pisces": "♓"
};

const ZODIAC_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

const PLANET_ABBREVIATIONS: Record<string, string> = {
  "Sun": "Su", "Moon": "Mo", "Mars": "Ma", "Mercury": "Me",
  "Jupiter": "Ju", "Venus": "Ve", "Saturn": "Sa", "Rahu": "Ra", "Ketu": "Ke"
};

const PLANET_COLORS: Record<string, string> = {
  Sun: "text-amber-500",
  Moon: "text-slate-400",
  Mars: "text-red-500",
  Mercury: "text-emerald-500",
  Jupiter: "text-yellow-500",
  Venus: "text-pink-400",
  Saturn: "text-indigo-500",
  Rahu: "text-slate-600",
  Ketu: "text-orange-500"
};

interface PlanetPosition {
  planet: string;
  sign: string;
  signIndex: number;
  degree: number;
  minute: number;
  second?: number;
  nakshatra: string;
  nakshatraPada: number;
  house: number;
  isRetrograde: boolean;
}

const VARGA_CHARTS = [
  { id: "d1", name: "D1 Rashi", label: "Birth Chart", desc: "Main birth chart showing overall life patterns" },
  { id: "d2", name: "D2 Hora", label: "Hora Chart", desc: "Wealth, family resources, and financial stability" },
  { id: "d3", name: "D3 Drekkana", label: "Drekkana Chart", desc: "Siblings, energetic nature, and initiative" },
  { id: "d4", name: "D4 Chaturthamsa", label: "Chaturthamsa Chart", desc: "Property, home, assets, and happiness" },
  { id: "d7", name: "D7 Saptamsa", label: "Saptamsa Chart", desc: "Children, progeny, and creative output" },
  { id: "d9", name: "D9 Navamsa", label: "Navamsa Chart", desc: "Dharma, marriage, spouse, and underlying strength" },
  { id: "d10", name: "D10 Dasamsa", label: "Dasamsa Chart", desc: "Career, profession, social status, and achievements" },
  { id: "d12", name: "D12 Dwadasamsa", label: "Dwadasamsa Chart", desc: "Parents, ancestry, and hereditary karma" },
  { id: "d16", name: "D16 Shodashamsa", label: "Shodashamsa Chart", desc: "Vehicles, conveyances, and material comforts" },
  { id: "d24", name: "D24 Chaturvimshamsha", label: "Chaturvimshamsha", desc: "Higher education, learning, and knowledge" },
  { id: "d60", name: "D60 Shashtiamsa", label: "Shashtiamsa Chart", desc: "Past life karma and finest nuances of destiny" },
];

const formatDMS = (deg: number, min: number, sec?: number) => {
  return `${deg}° ${min.toString().padStart(2, '0')} ' ${(sec || 0).toString().padStart(2, '0')}"`;
};

// South Indian chart layout (fixed signs)
const SOUTH_INDIAN_LAYOUT = [
  [11, 0, 1, 2],   // Pisces, Aries, Taurus, Gemini
  [10, -1, -1, 3], // Aquarius, (center), (center), Cancer
  [9, -1, -1, 4],  // Capricorn, (center), (center), Leo
  [8, 7, 6, 5]     // Sagittarius, Scorpio, Libra, Virgo
];

// North Indian chart layout (fixed houses)
const NORTH_INDIAN_HOUSES = [
  { row: 0, col: 1, house: 12 },
  { row: 0, col: 2, house: 1 },
  { row: 0, col: 3, house: 2 },
  { row: 1, col: 3, house: 3 },
  { row: 2, col: 3, house: 4 },
  { row: 3, col: 3, house: 5 },
  { row: 3, col: 2, house: 6 },
  { row: 3, col: 1, house: 7 },
  { row: 3, col: 0, house: 8 },
  { row: 2, col: 0, house: 9 },
  { row: 1, col: 0, house: 10 },
  { row: 0, col: 0, house: 11 },
];

type ChartStyle = "south" | "north" | "table";

function SouthIndianChart({
  planets,
  ascendantSignIndex,
  chartLabel
}: {
  planets: PlanetPosition[],
  ascendantSignIndex: number,
  chartLabel: string
}) {
  const getPlanetsInSign = (signIndex: number) => {
    return planets.filter(p => p.signIndex === signIndex);
  };

  const isAscendantSign = (signIndex: number) => signIndex === ascendantSignIndex;

  return (
    <div className="aspect-square max-w-md mx-auto">
      <div className="grid grid-cols-4 gap-0.5 h-full bg-border rounded-lg overflow-hidden">
        {SOUTH_INDIAN_LAYOUT.flat().map((signIndex, i) => {
          if (signIndex === -1) {
            // Center cells
            return (
              <div key={i} className="bg-card flex items-center justify-center">
                {i === 5 && (
                  <div className="text-center">
                    <Star className="w-8 h-8 text-primary mx-auto mb-1" />
                    <span className="text-xs text-muted-foreground">{chartLabel}</span>
                  </div>
                )}
              </div>
            );
          }

          const signName = ZODIAC_SIGNS[signIndex];
          const signSymbol = ZODIAC_SYMBOLS[signName];
          const planetsInSign = getPlanetsInSign(signIndex);
          const isAsc = isAscendantSign(signIndex);

          return (
            <div
              key={i}
              className={`bg-card p-2 flex flex-col ${isAsc ? "ring-2 ring-primary ring-inset" : ""}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{signSymbol}</span>
                {isAsc && <span className="text-xs text-primary font-bold">ASC</span>}
              </div>
              <div className="flex-1 flex flex-wrap gap-0.5 content-start">
                {planetsInSign.map((planet) => (
                  <Tooltip key={planet.planet}>
                    <TooltipTrigger>
                      <span className={`text-xs font-bold ${PLANET_COLORS[planet.planet]} ${planet.isRetrograde ? "underline" : ""}`}>
                        {PLANET_ABBREVIATIONS[planet.planet]}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{planet.planet} {planet.degree}°{planet.minute}' in {planet.sign}</p>
                      <p className="text-xs text-muted-foreground">
                        {planet.nakshatra} Pada {planet.nakshatraPada}
                        {planet.isRetrograde && " (R)"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground mt-auto">{signName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TRADITIONAL_MODE = {
  bg: "bg-[#fff9e6]", // Cream/Parchment
  border: "border-[#8B0000]", // Dark Red/Brown
  line: "#8B0000",
  text: "text-[#8B0000]",
  font: "font-serif"
};

function HouseTableChart({
  planets,
  ascendantSignIndex,
  chartLabel
}: {
  planets: PlanetPosition[],
  ascendantSignIndex: number,
  chartLabel: string
}) {
  // Create house data
  const houses = Array.from({ length: 12 }, (_, i) => {
    const houseNumber = i + 1;
    const signIndex = (ascendantSignIndex + i) % 12;
    const signName = ZODIAC_SIGNS[signIndex];
    const housePlanets = planets.filter(p => p.house === houseNumber);

    return {
      house: houseNumber,
      sign: signName,
      signSymbol: ZODIAC_SYMBOLS[signName],
      planets: housePlanets
    };
  });

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="text-left py-3 px-4 border border-border font-semibold">House</th>
              <th className="text-left py-3 px-4 border border-border font-semibold">Sign</th>
              <th className="text-left py-3 px-4 border border-border font-semibold">Planets</th>
            </tr>
          </thead>
          <tbody>
            {houses.map((house) => (
              <tr key={house.house} className="hover:bg-muted/50">
                <td className="py-2 px-4 border border-border font-medium">
                  {house.house === 1 ? "1st (Ascendant)" : `${house.house}${house.house === 2 ? 'nd' : house.house === 3 ? 'rd' : 'th'}`}
                </td>
                <td className="py-2 px-4 border border-border">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{house.signSymbol}</span>
                    <span>{house.sign}</span>
                  </span>
                </td>
                <td className="py-2 px-4 border border-border">
                  {house.planets.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {house.planets.map((planet) => (
                        <Tooltip key={planet.planet}>
                          <TooltipTrigger>
                            <span className={`font-semibold ${PLANET_COLORS[planet.planet]} ${planet.isRetrograde ? 'underline' : ''}`}>
                              {planet.planet}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-semibold">{planet.planet}</p>
                            <div className="text-xs space-y-1">
                              <p>{formatDMS(planet.degree, planet.minute, planet.second)} in {ZODIAC_SIGNS[planet.signIndex]}</p>
                              <p>{planet.nakshatra} ({planet.nakshatraPada})</p>
                              {planet.isRetrograde && <p className="text-red-500">Retrograde</p>}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">Empty</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NorthIndianChart({
  planets,
  ascendantSignIndex,
  chartLabel
}: {
  planets: PlanetPosition[],
  ascendantSignIndex: number,
  chartLabel: string
}) {
  const getSignForHouse = (house: number) => {
    return (ascendantSignIndex + house - 1) % 12;
  };

  const getPlanetsInHouse = (house: number) => {
    return planets.filter(p => p.house === house);
  };

  // Traditional Planet Coloring Override
  const TRADITIONAL_PLANET_COLORS: Record<string, string> = {
    "Sun": "text-[#0066cc]", // Blue
    "Moon": "text-[#8B0000]", // Brown/Red
    "Mars": "text-[#CC0000]", // Red
    "Mercury": "text-[#008080]", // Teal
    "Jupiter": "text-[#8B4513]", // Brown
    "Venus": "text-[#0066cc]", // Blue
    "Saturn": "text-[#000080]", // Navy
    "Rahu": "text-[#4a4a4a]",
    "Ketu": "text-[#4a4a4a]"
  };

  // Precise Centroid Coordinates for 12 Houses (400x400 SVG)
  // Standard Anti-Clockwise North Indian System
  const HOUSE_COORDS = [
    { id: 1, x: 200, y: 85, type: 'diamond' },     // Top (Lagna)
    { id: 2, x: 100, y: 35, type: 'triangle' },    // Top-Left (Upper)
    { id: 3, x: 35, y: 100, type: 'triangle' },    // Left-Top (Lower Left Quad)
    { id: 4, x: 100, y: 200, type: 'diamond' },    // Left (Sukh)
    { id: 5, x: 35, y: 300, type: 'triangle' },    // Left-Bottom
    { id: 6, x: 100, y: 365, type: 'triangle' },   // Bottom-Left
    { id: 7, x: 200, y: 315, type: 'diamond' },    // Bottom (Kalatra)
    { id: 8, x: 300, y: 365, type: 'triangle' },   // Bottom-Right
    { id: 9, x: 365, y: 300, type: 'triangle' },   // Right-Bottom
    { id: 10, x: 300, y: 200, type: 'diamond' },   // Right (Karma)
    { id: 11, x: 365, y: 100, type: 'triangle' },  // Right-Top
    { id: 12, x: 300, y: 35, type: 'triangle' }    // Top-Right
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Traditional Title */}
      <h3 className={`text-2xl font-serif text-[#8B0000] mb-2 font-bold`}>
        {chartLabel}
      </h3>

      <div className={`aspect-square w-full max-w-md mx-auto ${TRADITIONAL_MODE.bg} border-4 ${TRADITIONAL_MODE.border} p-1 relative`}>
        {/* Inner thin border */}
        <div className={`w-full h-full border ${TRADITIONAL_MODE.border} relative`}>
          <svg viewBox="0 0 400 400" className="w-full h-full absolute inset-0">
            {/* Outer diamond */}
            <polygon
              points="200,0 400,200 200,400 0,200"
              fill="none"
              stroke={TRADITIONAL_MODE.line}
              strokeWidth="1.5"
            />
            {/* Inner lines creating houses (Diagonals only - NO Cross Lines) */}
            <line x1="0" y1="0" x2="400" y2="400" stroke={TRADITIONAL_MODE.line} strokeWidth="1.5" />
            <line x1="400" y1="0" x2="0" y2="400" stroke={TRADITIONAL_MODE.line} strokeWidth="1.5" />

            {/* Center Om Symbol (Decorative) */}
            <text x="200" y="200" textAnchor="middle" dominantBaseline="middle"
              className="fill-[#d9534f] opacity-20 text-6xl font-serif select-none pointer-events-none">
              ॐ
            </text>

            {/* Render Houses via SVG ForeignObject */}
            {HOUSE_COORDS.map((coord) => {
              const house = coord.id;
              const signIndex = getSignForHouse(house);
              const signNumber = signIndex + 1;
              const planetsInHouse = getPlanetsInHouse(house);

              // Dynamic sizing for ForeignObject
              const size = coord.type === 'diamond' ? 140 : 100;
              const x = coord.x - size / 2;
              const y = coord.y - size / 2;

              // Place numbers in the INNER RING (closest to center)
              let numPosClass = "absolute text-[10px] sm:text-xs font-bold text-[#8B0000]/70";

              if (coord.type === 'diamond') {
                if (house === 1) numPosClass = "absolute bottom-1 right-1/2 font-bold translate-x-1/2";
                else if (house === 4) numPosClass += " right-1 top-1/2 -translate-y-1/2";
                else if (house === 7) numPosClass += " top-1 left-1/2 -translate-x-1/2";
                else if (house === 10) numPosClass += " left-1 top-1/2 -translate-y-1/2";
              } else {
                // Triangles: Place on inner edge (center-facing edge)
                if (house === 2) numPosClass += " bottom-1 left-1/2 -translate-x-1/2";  // Top-Left tri: bottom center
                if (house === 3) numPosClass += " right-1 top-1/2 -translate-y-1/2";    // Left-Top tri: right center
                if (house === 5) numPosClass += " right-1 top-1/2 -translate-y-1/2";    // Left-Bottom tri: right center
                if (house === 6) numPosClass += " top-1 left-1/2 -translate-x-1/2";     // Bottom-Left tri: top center
                if (house === 8) numPosClass += " top-1 left-1/2 -translate-x-1/2";     // Bottom-Right tri: top center
                if (house === 9) numPosClass += " left-1 top-1/2 -translate-y-1/2";     // Right-Bottom tri: left center
                if (house === 11) numPosClass += " left-1 top-1/2 -translate-y-1/2";    // Right-Top tri: left center
                if (house === 12) numPosClass += " bottom-1 left-1/2 -translate-x-1/2"; // Top-Right tri: bottom center
              }

              return (
                <foreignObject key={house} x={x} y={y} width={size} height={size} className="overflow-visible pointer-events-none">
                  <div className={`w-full h-full flex flex-col items-center justify-center text-center pointer-events-auto relative ${TRADITIONAL_MODE.font}`}>
                    <span className={numPosClass}>
                      {signNumber}
                    </span>
                    <div className="flex flex-wrap gap-0.5 justify-center z-10 scale-90 sm:scale-100 origin-center">
                      {planetsInHouse.map((planet) => (
                        <Tooltip key={planet.planet}>
                          <TooltipTrigger>
                            <span className={`text-xs sm:text-sm font-bold leading-none ${TRADITIONAL_PLANET_COLORS[planet.planet]}`}>
                              {planet.planet.substring(0, 2)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-semibold">{planet.planet}</p>
                            <div className="text-xs space-y-1">
                              <p>{formatDMS(planet.degree, planet.minute, planet.second)} in {ZODIAC_SIGNS[planet.signIndex]}</p>
                              <p>{planet.nakshatra} ({planet.nakshatraPada})</p>
                              {planet.isRetrograde && <p className="text-red-500">Retrograde</p>}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                </foreignObject>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

function ChartDisplay({
  planets,
  ascendantSignIndex,
  chartLabel,
  style
}: {
  planets: PlanetPosition[],
  ascendantSignIndex: number,
  chartLabel: string,
  style: ChartStyle
}) {
  if (style === "table") {
    return <HouseTableChart planets={planets} ascendantSignIndex={ascendantSignIndex} chartLabel={chartLabel} />;
  }
  if (style === "north") {
    return <NorthIndianChart planets={planets} ascendantSignIndex={ascendantSignIndex} chartLabel={chartLabel} />;
  }
  return <SouthIndianChart planets={planets} ascendantSignIndex={ascendantSignIndex} chartLabel={chartLabel} />;
}

function PlanetTable({ planets }: { planets: PlanetPosition[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3">Planet</th>
            <th className="text-left py-2 px-3">Sign</th>
            <th className="text-left py-2 px-3">Degree</th>
            <th className="text-left py-2 px-3">Nakshatra</th>
            <th className="text-left py-2 px-3">House</th>
            <th className="text-left py-2 px-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {planets.map((planet) => (
            <tr key={planet.planet} className="border-b border-border/50 hover:bg-muted/50">
              <td className="py-2 px-3">
                <span className={`font-medium ${PLANET_COLORS[planet.planet]}`}>
                  {planet.planet}
                </span>
              </td>
              <td className="py-2 px-3">
                <span className="flex items-center gap-1">
                  {ZODIAC_SYMBOLS[planet.sign]} {planet.sign}
                </span>
              </td>
              <td className="py-2 px-3">
                {formatDMS(planet.degree, planet.minute, planet.second)}
              </td>
              <td className="py-2 px-3">
                {planet.nakshatra} - {planet.nakshatraPada}
              </td>
              <td className="py-2 px-3">
                {planet.house}
              </td>
              <td className="py-2 px-3">
                {planet.isRetrograde && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                    Retrograde
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ChartView() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { guestChart, hasGuestChart, clearGuestChart } = useGuestChart();
  const params = useParams<{ profileId?: string }>();
  const [, setLocation] = useLocation();
  const [chartStyle, setChartStyle] = useState<ChartStyle>("table");

  // For authenticated users - fetch from database
  const { data: profiles, isLoading: profilesLoading } = trpc.profile.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const profileId = params.profileId ? parseInt(params.profileId) : profiles?.[0]?.id;
  const profile = profiles?.find(p => p.id === profileId) || profiles?.[0];

  // Use guest chart if not authenticated, otherwise use saved profile
  // Use guest chart if not authenticated, OR if authenticated but no saved profile chart yet (and we have guest data)
  const chartData = (isAuthenticated && profile?.chartData)
    ? (profile.chartData as any)
    : guestChart?.chartData;

  const birthInfo = isAuthenticated && profile
    ? {
      birthDate: profile.birthDate,
      birthTime: profile.birthTime,
      birthPlace: profile.birthPlace,
      ayanamsa: profile.ayanamsa,
      profileName: profile.profileName
    }
    : guestChart?.birthData
      ? {
        birthDate: guestChart.birthData.birthDate,
        birthTime: guestChart.birthData.birthTime,
        birthPlace: guestChart.birthData.birthPlace,
        ayanamsa: guestChart.birthData.ayanamsa || "lahiri",
        profileName: "Guest Chart"
      }
      : null;

  const isLoading = authLoading || (isAuthenticated && profilesLoading);

  const handleResetChart = () => {
    clearGuestChart();
    setLocation("/onboarding");
  };

  // Create profile mutation for saving guest chart
  const createProfile = trpc.profile.create.useMutation({
    onSuccess: () => {
      toast.success("Chart saved to your profile!");
      utils.profile.list.invalidate(); // Refresh profiles list
      clearGuestChart(); // Clear guest data as it's now saved
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save profile");
    }
  });

  const utils = trpc.useUtils();

  const handleSaveGuestChart = () => {
    if (!guestChart?.birthData) return;

    createProfile.mutate({
      ...guestChart.birthData,
      timezoneOffset: guestChart.birthData.timezoneOffset || 0,
      ayanamsa: guestChart.birthData.ayanamsa as "lahiri" | "raman" | "krishnamurti",
      isPrimary: true // Make this the primary profile
    });
  };

  const handleNewChart = () => {
    setLocation("/onboarding");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Chart Found</h2>
            <p className="text-muted-foreground mb-4">
              Create your birth chart to view your planetary positions.
            </p>
            <Button asChild>
              <Link href="/onboarding">Create Chart</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get correct ascendant sign index for each chart
  const d1AscendantIndex = chartData.d1?.ascendant?.signIndex ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container flex items-center gap-4 h-16">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold">Birth Chart</h1>
            <p className="text-sm text-muted-foreground">{birthInfo?.profileName || "Your Chart"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleResetChart}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <ExportButton chartData={chartData} birthInfo={birthInfo} />
            <Button variant="outline" size="sm" onClick={handleNewChart}>
              <Plus className="w-4 h-4 mr-2" />
              New Chart
            </Button>
            {!isAuthenticated && hasGuestChart && (
              <Button variant="default" size="sm" onClick={() => window.location.href = getLoginUrl()}>
                <Save className="w-4 h-4 mr-2" />
                Sign In to Save
              </Button>
            )}
            {isAuthenticated && hasGuestChart && !profile && (
              <Button variant="default" size="sm" onClick={handleSaveGuestChart} disabled={createProfile.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {createProfile.isPending ? "Saving..." : "Save to Profile"}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Guest mode banner */}
          {hasGuestChart && (!isAuthenticated || !profile) && (
            <Card className="border-amber-500/50 bg-amber-500/10">
              <CardContent className="p-4 flex items-center gap-3">
                <Save className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">unsaved Chart</p>
                  <p className="text-sm text-amber-700">
                    {isAuthenticated ? "You are viewing a guest chart. Save it to your profile to keep it." : "Sign in to save your chart and access it anytime."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chart info and style selector */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  {birthInfo && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Birth Date:</span>{" "}
                        <span className="font-medium">{birthInfo.birthDate}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Birth Time:</span>{" "}
                        <span className="font-medium">{birthInfo.birthTime}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Birth Place:</span>{" "}
                        <span className="font-medium">{birthInfo.birthPlace}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ayanamsa:</span>{" "}
                        <span className="font-medium capitalize">{birthInfo.ayanamsa}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Chart Style:</span>
                  <Select value={chartStyle} onValueChange={(v) => setChartStyle(v as ChartStyle)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="table">Table View</SelectItem>
                      <SelectItem value="south">South Indian</SelectItem>
                      <SelectItem value="north">North Indian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Chart Tabs */}
          <Tabs defaultValue="d1" className="w-full">
            <div className="overflow-x-auto pb-2">
              <TabsList className="w-full justify-start h-auto p-2 bg-muted/50">
                {VARGA_CHARTS.map(varga => (
                  <TabsTrigger key={varga.id} value={varga.id} className="min-w-[60px]">
                    {varga.id.toUpperCase()}
                  </TabsTrigger>
                ))}
                <TabsTrigger value="planets" className="min-w-[100px]">Planets</TabsTrigger>
                <TabsTrigger value="houses" className="min-w-[100px]">Houses</TabsTrigger>
                <TabsTrigger value="yogas" className="min-w-[100px]">Yogas</TabsTrigger>
              </TabsList>
            </div>

            {VARGA_CHARTS.map(varga => {
              const currentChart = (chartData as any)[varga.id];
              const ascendant = currentChart?.ascendant;
              const ascSignIndex = ascendant?.signIndex ?? 0;

              // Formatting for subtitle
              const ascendantInfo = ascendant
                ? `Ascendant: ${ascendant.sign} ${ascendant.nakshatra ? `(${ascendant.nakshatra})` : ''}`
                : "Chart not available";

              return (
                <TabsContent key={varga.id} value={varga.id} className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {varga.name} - {varga.label}
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{varga.desc}</p>
                          </TooltipContent>
                        </Tooltip>
                      </CardTitle>
                      <CardDescription>
                        {ascendantInfo}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {currentChart ? (
                        <ChartDisplay
                          planets={currentChart.planets || []}
                          ascendantSignIndex={ascSignIndex}
                          chartLabel={varga.name}
                          style={chartStyle}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <p>Chart data not available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}


            <TabsContent value="planets" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Planetary Positions</CardTitle>
                  <CardDescription>
                    Detailed positions of all nine planets in your chart
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PlanetTable planets={chartData.d1?.planets || []} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="houses" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>House Analysis</CardTitle>
                  <CardDescription>
                    The twelve houses and their lords
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {chartData.d1?.houses?.map((house: any) => (
                      <div key={house.house} className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">House {house.house}</span>
                          <span className="text-lg">{ZODIAC_SYMBOLS[house.sign]}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{house.sign}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Lord: {house.lord}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="yogas" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Planetary Yogas</CardTitle>
                  <CardDescription>
                    Special planetary combinations and their effects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!chartData.yogas || chartData.yogas.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No major yogas detected in this chart.</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {chartData.yogas.map((yoga: any, idx: number) => (
                        <div key={idx} className="p-4 border border-border rounded-lg bg-card hover:bg-muted/20 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-primary">{yoga.name}</h4>
                              <span className="text-xs text-muted-foreground capitalize">{yoga.category} Yoga</span>
                            </div>
                            {yoga.strength && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${yoga.strength === 'strong' ? 'bg-green-100 text-green-700' :
                                yoga.strength === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                {yoga.strength}
                              </span>
                            )}
                          </div>
                          <p className="text-sm mb-2">{yoga.description}</p>
                          <div className="bg-muted/50 p-2 rounded text-xs">
                            <span className="font-semibold text-muted-foreground">Effects: </span>
                            {yoga.effects}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            {/* Wealth Analysis Tab */}

          </Tabs>
        </div>
      </main>
    </div>
  );
}
