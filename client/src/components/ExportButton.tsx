import React from 'react';
import { Button } from "@/components/ui/button";
import {
    FileSpreadsheet,
    FileText,
    FileJson,
    FileIcon,
    Download,
    ChevronDown
} from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface Yoga {
    name: string;
    category: string;
    strength: string;
    description: string;
    effects: string;
}

interface DashaPeriod {
    planet: string;
    startDate: string; // JSON date string
    endDate: string;   // JSON date string
    level: "mahadasha" | "antardasha" | "pratyantardasha";
    years: number;
    subPeriods?: DashaPeriod[];
}

interface ChartData {
    d1?: { planets: PlanetPosition[]; houses: any[]; ascendant: any };
    yogas?: Yoga[];
    dashas?: DashaPeriod[];
    [key: string]: any; // Allow indexing for other vargas (d2, d9, etc.)
}

interface ExportButtonProps {
    chartData: ChartData;
    birthInfo: {
        profileName: string;
        birthDate: string;
        birthTime: string;
        birthPlace: string;
        ayanamsa?: string | null;
    } | null;
}

// List of all Varga charts to check and export
const VARGA_CHARTS = [
    { id: "d1", name: "D1 Rashi" },
    { id: "d2", name: "D2 Hora" },
    { id: "d3", name: "D3 Drekkana" },
    { id: "d4", name: "D4 Chaturthamsa" },
    { id: "d7", name: "D7 Saptamsa" },
    { id: "d9", name: "D9 Navamsa" },
    { id: "d10", name: "D10 Dasamsa" },
    { id: "d12", name: "D12 Dwadasamsa" },
    { id: "d16", name: "D16 Shodashamsa" },
    { id: "d24", name: "D24 Chaturvimshamsha" },
    { id: "d60", name: "D60 Shashtiamsa" },
];

export function ExportButton({ chartData, birthInfo }: ExportButtonProps) {

    const getBaseFileName = () => {
        const name = birthInfo?.profileName || "Chart";
        return `${name.replace(/[^a-z0-9]/gi, '_')}_Astro_Report`;
    };

    // --- 1. EXCEL EXPORT ---
    const handleExportExcel = () => {
        if (!chartData || !birthInfo) return toast.error("No data to export");

        try {
            const wb = XLSX.utils.book_new();

            // --- Sheet 1: OVERVIEW ---
            const overviewData = [
                ["Jyotish Career - Comprehensive Astrological Report"],
                [""],
                ["Profile Details"],
                ["Name", birthInfo.profileName],
                ["Birth Date", birthInfo.birthDate],
                ["Birth Time", birthInfo.birthTime],
                ["Birth Place", birthInfo.birthPlace],
                ["Ayanamsa", birthInfo.ayanamsa || "Lahiri"],
                [""],
                ["Planetary Summary (D1 Birth Chart)"],
                ["Planet", "Sign", "Degree", "Nakshatra", "House", "Status"],
            ];

            chartData.d1?.planets.forEach(p => {
                overviewData.push([
                    p.planet,
                    p.sign,
                    `${p.degree}° ${p.minute}'`,
                    `${p.nakshatra} (${p.nakshatraPada})`,
                    p.house.toString(),
                    p.isRetrograde ? "Retrograde" : "Direct"
                ]);
            });

            const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
            XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");


            // --- Sheet 2: DASHAS (Major & Minor) ---
            if (chartData.dashas && chartData.dashas.length > 0) {
                const dashaData = [
                    ["Vimshottari Dasha Periods"],
                    [""],
                    ["Mahadasha", "Antardasha", "Start Date", "End Date", "Duration (Years)"]
                ];

                chartData.dashas.forEach(maha => {
                    // Add Mahadasha Header Row
                    dashaData.push([
                        maha.planet,
                        "-",
                        new Date(maha.startDate).toLocaleDateString(),
                        new Date(maha.endDate).toLocaleDateString(),
                        maha.years.toFixed(2)
                    ]);

                    // Add Sub-periods
                    if (maha.subPeriods) {
                        maha.subPeriods.forEach(antar => {
                            dashaData.push([
                                maha.planet,
                                antar.planet,
                                new Date(antar.startDate).toLocaleDateString(),
                                new Date(antar.endDate).toLocaleDateString(),
                                antar.years.toFixed(2)
                            ]);
                        });
                    }
                    // Add separator row
                    dashaData.push([]);
                });

                const wsDashas = XLSX.utils.aoa_to_sheet(dashaData);
                wsDashas['!cols'] = [
                    { wch: 15 }, // Maha
                    { wch: 15 }, // Antar
                    { wch: 15 }, // Start
                    { wch: 15 }, // End
                    { wch: 10 }  // Duration
                ];
                XLSX.utils.book_append_sheet(wb, wsDashas, "Dashas");
            }


            // --- Sheet 3: YOGAS (If available) ---
            if (chartData.yogas && chartData.yogas.length > 0) {
                const yogaData = [
                    ["Planetary Yogas & Special Combinations"],
                    [""],
                    ["Yoga Name", "Category", "Strength", "Description", "Effects"]
                ];

                chartData.yogas.forEach(y => {
                    yogaData.push([
                        y.name,
                        y.category,
                        y.strength,
                        y.description,
                        y.effects
                    ]);
                });

                const wsYogas = XLSX.utils.aoa_to_sheet(yogaData);
                wsYogas['!cols'] = [
                    { wch: 25 }, // Name
                    { wch: 15 }, // Category
                    { wch: 10 }, // Strength
                    { wch: 50 }, // Description
                    { wch: 60 }  // Effects
                ];
                XLSX.utils.book_append_sheet(wb, wsYogas, "Yogas");
            }


            // --- Sheets 4+: ALL VARGA CHARTS ---
            VARGA_CHARTS.forEach(varga => {
                const chart = chartData[varga.id];
                if (chart && chart.planets) {

                    const data = [
                        [`${varga.name} Chart Details`],
                        [""],
                        ["Planet", "Sign", "Degree", "Nakshatra", "House", "Retrograde"],
                    ];

                    chart.planets.forEach((p: PlanetPosition) => {
                        data.push([
                            p.planet,
                            p.sign,
                            `${p.degree}° ${p.minute}'`,
                            `${p.nakshatra} (${p.nakshatraPada})`,
                            p.house.toString(),
                            p.isRetrograde ? "Yes" : "No"
                        ]);
                    });

                    // Add Ascendant
                    if (chart.ascendant) {
                        data.push([]);
                        data.push([
                            "Ascendant",
                            chart.ascendant.sign,
                            `${chart.ascendant.degree}°`,
                            chart.ascendant.nakshatra,
                            "1",
                            "-"
                        ]);
                    }

                    const ws = XLSX.utils.aoa_to_sheet(data);
                    XLSX.utils.book_append_sheet(wb, ws, varga.id.toUpperCase());
                }
            });

            // --- Append House Analysis (D1) if exists ---
            if (chartData.d1?.houses) {
                const houseData = [
                    ["D1 House Analysis - Bhava Chalit"],
                    [""],
                    ["House", "Sign", "Lord"]
                ];
                chartData.d1.houses.forEach((h: any) => {
                    houseData.push([
                        `House ${h.house}`,
                        h.sign,
                        h.lord
                    ]);
                });
                const wsHouses = XLSX.utils.aoa_to_sheet(houseData);
                XLSX.utils.book_append_sheet(wb, wsHouses, "Houses Support");
            }

            XLSX.writeFile(wb, `${getBaseFileName()}.xlsx`);
            toast.success("Excel export successful");

        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Excel export failed");
        }
    };


    // --- 2. JSON EXPORT ---
    const handleExportJSON = () => {
        if (!chartData || !birthInfo) {
            toast.error("No chart data available to export");
            return;
        }
        try {
            const data = {
                profile: birthInfo,
                chartData: chartData,
                generatedAt: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${getBaseFileName()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("JSON export successful");

        } catch (error: any) {
            console.error("JSON Export failed:", error);
            toast.error("Failed to export JSON file");
        }
    };


    // --- 3. TEXT EXPORT ---
    const handleExportText = () => {
        if (!chartData || !birthInfo) {
            toast.error("No chart data available to export");
            return;
        }
        try {
            let txt = `JYOTISH CAREER REPORT\n=====================\n\nPROFILE\n-------\nName: ${birthInfo.profileName}\nDate: ${birthInfo.birthDate}\nTime: ${birthInfo.birthTime}\nPlace: ${birthInfo.birthPlace}\n\n`;

            // Iterate all Vargas (D1, D9, D10 etc.)
            VARGA_CHARTS.forEach(varga => {
                const chart = chartData[varga.id];
                if (chart && chart.planets) {
                    txt += `\n${varga.name.toUpperCase()} CHART DETAILS\n${"-".repeat(varga.name.length + 14)}\n`;
                    txt += `Planet      Sign        Degree\tHouse\n`;
                    chart.planets.forEach((p: PlanetPosition) => {
                        txt += `${p.planet.padEnd(11)} ${p.sign.padEnd(11)} ${Math.floor(p.degree)}° ${p.minute}'\t${p.house}\n`;
                    });
                    if (chart.ascendant) {
                        txt += `Ascendant   ${chart.ascendant.sign.padEnd(11)} ${Math.floor(chart.ascendant.degree)}°      \t1\n`;
                    }
                    txt += "\n";
                }
            });

            // House Analysis
            if (chartData.d1?.houses) {
                txt += `\nD1 HOUSE ANALYSIS (Bhava Chalit)\n--------------------------------\n`;
                txt += `House\tSign\t\tLord\n`;
                chartData.d1.houses.forEach((h: any) => {
                    txt += `House ${h.house}\t${h.sign.padEnd(12)}\t${h.lord}\n`;
                });
                txt += "\n";
            }

            if (chartData.yogas && chartData.yogas.length > 0) {
                txt += `\nSPECIAL YOGAS\n-------------\n`;
                chartData.yogas.forEach(y => {
                    txt += `* ${y.name} (${y.strength}): ${y.description}\n`;
                });
            }

            if (chartData.dashas && chartData.dashas.length > 0) {
                txt += `\nDASHA PERIODS (Major & Minor)\n-----------------------------\n`;
                chartData.dashas.forEach(d => {
                    txt += `[${d.planet} Mahadasha]: ${new Date(d.startDate).toLocaleDateString()} to ${new Date(d.endDate).toLocaleDateString()}\n`;
                    if (d.subPeriods) {
                        d.subPeriods.forEach(sd => {
                            txt += `  - ${d.planet}/${sd.planet}: ${new Date(sd.startDate).toLocaleDateString()} to ${new Date(sd.endDate).toLocaleDateString()}\n`;
                        });
                    }
                    txt += `\n`;
                });
            }

            const blob = new Blob([txt], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${getBaseFileName()}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Text export successful");
        } catch (error: any) {
            console.error("Text Export failed:", error);
            toast.error("Failed to export Text file");
        }
    };


    // --- 4. PDF EXPORT ---
    const handleExportPDF = () => {
        if (!chartData || !birthInfo) {
            toast.error("No chart data available to export");
            return;
        }
        try {
            // @ts-ignore
            const doc = new jsPDF();
            let yPos = 20;

            // Header
            doc.setFontSize(18);
            doc.text("Jyotish Career Report", 14, yPos);
            yPos += 10;

            doc.setFontSize(10);
            doc.text(`Name: ${birthInfo.profileName}`, 14, yPos);
            yPos += 5;
            doc.text(`Birth: ${birthInfo.birthDate} at ${birthInfo.birthTime}`, 14, yPos);
            yPos += 5;
            doc.text(`Place: ${birthInfo.birthPlace}`, 14, yPos);
            yPos += 15;

            // Loop all Vargas
            VARGA_CHARTS.forEach((varga, index) => {
                const chart = chartData[varga.id];
                if (chart && chart.planets) {

                    // Check page space
                    if (yPos > 240) { doc.addPage(); yPos = 20; }

                    doc.setFontSize(14);
                    doc.text(`${varga.name} Chart Details`, 14, yPos);
                    yPos += 5;

                    const rows = chart.planets.map((p: PlanetPosition) => [
                        p.planet, p.sign, `${p.degree}° ${p.minute}'`, p.nakshatra, p.house.toString()
                    ]);

                    if (chart.ascendant) {
                        rows.push(["Ascendant", chart.ascendant.sign, `${chart.ascendant.degree}°`, chart.ascendant.nakshatra, "1"]);
                    }

                    // @ts-ignore
                    autoTable(doc, {
                        startY: yPos,
                        head: [['Planet', 'Sign', 'Degree', 'Nakshatra', 'House']],
                        body: rows,
                        theme: 'striped',
                        headStyles: { fillColor: [41, 128, 185] },
                    });

                    // @ts-ignore
                    yPos = doc.lastAutoTable.finalY + 15;
                }
            });

            // House Analysis
            if (chartData.d1?.houses) {
                if (yPos > 240) { doc.addPage(); yPos = 20; }
                doc.text("D1 House Analysis", 14, yPos);
                yPos += 5;

                const houseRows = chartData.d1.houses.map((h: any) => [
                    `House ${h.house}`, h.sign, h.lord
                ]);

                // @ts-ignore
                autoTable(doc, {
                    startY: yPos,
                    head: [['House', 'Sign', 'Lord']],
                    body: houseRows,
                    theme: 'grid'
                });
                // @ts-ignore
                yPos = doc.lastAutoTable.finalY + 15;
            }

            // Yogas
            if (chartData.yogas && chartData.yogas.length > 0) {
                if (yPos > 240) { doc.addPage(); yPos = 20; }
                doc.text("Key Yogas", 14, yPos);
                yPos += 5;

                const yogaRows = chartData.yogas.map(y => [y.name, y.strength, y.description]);

                // @ts-ignore
                autoTable(doc, {
                    startY: yPos,
                    head: [['Yoga', 'Strength', 'Description']],
                    body: yogaRows,
                });

                // @ts-ignore
                yPos = doc.lastAutoTable.finalY + 15;
            }

            // Dashas
            if (chartData.dashas && chartData.dashas.length > 0) {
                if (yPos > 240) { doc.addPage(); yPos = 20; }

                doc.text("Dasha Timeline (Major Periods)", 14, yPos);
                yPos += 5;

                const dashaRows: any[] = [];
                chartData.dashas.forEach(d => {
                    dashaRows.push([d.planet + " Mahadasha", new Date(d.startDate).toLocaleDateString(), new Date(d.endDate).toLocaleDateString()]);
                });

                // @ts-ignore
                autoTable(doc, {
                    startY: yPos,
                    head: [['Period', 'Start', 'End']],
                    body: dashaRows
                });
            }

            doc.save(`${getBaseFileName()}.pdf`);
            toast.success("PDF export successful");

        } catch (error: any) {
            console.error("PDF Export failed:", error);
            toast.error("Failed to export PDF file");
        }
    };

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export
                    <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white border shadow-md z-[100]">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer flex items-center p-2 hover:bg-slate-100">
                    <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                    Excel (.xlsx)
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer flex items-center p-2 hover:bg-slate-100">
                    <FileText className="w-4 h-4 mr-2 text-red-600" />
                    PDF Report (.pdf)
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleExportJSON} className="cursor-pointer flex items-center p-2 hover:bg-slate-100">
                    <FileJson className="w-4 h-4 mr-2 text-yellow-600" />
                    JSON Data (.json)
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleExportText} className="cursor-pointer flex items-center p-2 hover:bg-slate-100">
                    <FileIcon className="w-4 h-4 mr-2 text-slate-600" />
                    Text File (.txt)
                </DropdownMenuItem>

            </DropdownMenuContent>
        </DropdownMenu>
    );
}
