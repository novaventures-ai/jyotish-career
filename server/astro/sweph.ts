import SwissEPH from "sweph-wasm";
// @ts-ignore
import initSwisseph from "sweph-wasm/wasm/swisseph";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * High-precision Swiss Ephemeris wrapper for Vedic Astrology
 */
import Module from "module";

const _require = Module.createRequire(import.meta.url);

// ...

export class SwissEphemeris {
    private static instance: any = null;

    public static async getInstance(): Promise<SwissEPH> {
        if (!SwissEphemeris.instance) {
            let wasmBinary: Buffer;

            // Try multiple paths to find the WASM file
            // Try multiple paths to find the WASM file
            console.log('[SwissEph] Init: Starting WASM search...');
            console.log(`[SwissEph] CWD: ${process.cwd()}`);
            console.log(`[SwissEph] __dirname: ${__dirname}`);

            const possiblePaths = [
                // Vercel serverless (bundled): api/swisseph.wasm relative to CWD
                path.join(process.cwd(), 'api', 'swisseph.wasm'),
                // Vercel serverless (alternative): just swisseph.wasm if flattened
                path.join(process.cwd(), 'swisseph.wasm'),
                // Bundled relative to this file (api/_lib/bundled_app.js -> api/swisseph.wasm)
                path.join(__dirname, '..', 'swisseph.wasm'),
                // Local development: resolve from node_modules
                (() => {
                    try {
                        return _require.resolve("sweph-wasm/dist/wasm/swisseph.wasm");
                    } catch {
                        return null;
                    }
                })(),
                // Fallback: relative to this file
                path.join(__dirname, '..', '..', 'node_modules', 'sweph-wasm', 'dist', 'wasm', 'swisseph.wasm'),
            ].filter(Boolean) as string[];

            let wasmPath: string | null = null;
            for (const p of possiblePaths) {
                console.log(`[SwissEph] Checking path: ${p}`);
                if (fs.existsSync(p)) {
                    wasmPath = p;
                    console.log(`[SwissEph] ✅ Found WASM at: ${p}`);
                    break;
                }
            }

            if (!wasmPath) {
                console.error("[SwissEph] WASM file not found in any of these locations:", possiblePaths);
                throw new Error("Swiss Ephemeris WASM file not found");
            }

            wasmBinary = fs.readFileSync(wasmPath);
            const module = await initSwisseph({
                wasmBinary: wasmBinary,
            });

            // @ts-ignore - The constructor is public but not well-typed in the default export
            SwissEphemeris.instance = new SwissEPH(module);
        }
        return SwissEphemeris.instance;
    }

    /**
     * Calculate Julian Day for UTC time
     */
    static async getJulianDay(date: Date): Promise<number> {
        const swe = await this.getInstance();
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth() + 1;
        const day = date.getUTCDate();
        const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

        // In sweph-wasm: swe_julday(year, month, day, hour, gregflag)
        return swe.swe_julday(year, month, day, hour, 1); // 1 = Greg Cal
    }

    /**
     * Calculate Ayanamsa (Sidereal Offset)
     * Default: Lahiri (2)
     */
    static async getAyanamsa(jd: number): Promise<number> {
        const swe = await this.getInstance();
        // In sweph-wasm: swe_set_sid_mode(sid_mode, t0, ayan_t0)
        swe.swe_set_sid_mode(1, 0, 0); // 1 = SE_SIDM_LAHIRI
        return swe.swe_get_ayanamsa_ut(jd);
    }

    /**
     * Get Sidereal Planetary Positions
     */
    static async getPlanetPosition(jd: number, planetId: number): Promise<{
        longitude: number;
        latitude: number;
        distance: number;
        speedLong: number;
        speedLat: number;
        speedDist: number;
    }> {
        const swe = await this.getInstance();

        // Set to Sidereal Mode (Lahiri)
        swe.swe_set_sid_mode(1, 0, 0);

        // Flags: SEFLG_SIDEREAL (65536) + SEFLG_SPEED (256) + SEFLG_SWIEPH (2)
        const flags = 65536 | 256 | 2;

        // In sweph-wasm: swe_calc_ut(tjd_ut, ipl, iflag) -> [lon, lat, dist, lonSpeed, latSpeed, distSpeed]
        const result = swe.swe_calc_ut(jd, planetId, flags);

        return {
            longitude: result[0],
            latitude: result[1],
            distance: result[2],
            speedLong: result[3],
            speedLat: result[4],
            speedDist: result[5],
        };
    }

    /**
     * Calculate Houses and Ascendant
     */
    static async getHouses(jd: number, lat: number, lon: number): Promise<{
        ascendant: number;
        cusps: number[];
    }> {
        const swe = await this.getInstance();

        // Standard Swiss Ephemeris behavior: swe_houses returns Tropical unless customized, 
        // but in WASM/JS bindings, the sidereal flag often doesn't affect house cusps.
        // We manually calculate Sidereal by subtracting Ayanamsa.

        // 1. Get Ayanamsa (Sidereal Mode must be set)
        swe.swe_set_sid_mode(1, 0, 0); // Lahiri
        const ayanamsa = swe.swe_get_ayanamsa_ut(jd);

        // 2. Get Tropical Houses
        // swe_houses(tjd_ut, geolat, geolon, hsys)
        const result = swe.swe_houses(jd, lat, lon, 'W');

        // 3. Convert to Sidereal
        const normalize = (deg: number) => (deg % 360 + 360) % 360;
        const siderealAscendant = normalize(result.ascmc[0] - ayanamsa);

        // We don't rely on cusps from swe_houses for Whole Sign (we calculate them in calculations.ts),
        // but if we did, we would subtract ayanamsa from them too.
        const siderealCusps = Array.from(result.cusps).slice(1).map((c: any) => normalize(c - ayanamsa));

        return {
            ascendant: siderealAscendant,
            cusps: siderealCusps
        };
    }

    /**
     * Map standard planet names to Swiss Ephemeris IDs
     */
    static getPlanetId(name: string): number {
        const mapping: Record<string, number> = {
            "Sun": 0,
            "Moon": 1,
            "Mars": 4,
            "Mercury": 2,
            "Jupiter": 5,
            "Venus": 3,
            "Saturn": 6,
            "Rahu": 10, // Mean North Node
            "Ketu": -1,
            "Uranus": 7,
            "Neptune": 8,
            "Pluto": 9
        };
        return mapping[name] ?? -1;
    }
}
