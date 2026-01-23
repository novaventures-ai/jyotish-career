import { describe, expect, it } from "vitest";
import {
  generateBirthChart,
  generateFullChartData,
  ZODIAC_SIGNS,
  NAKSHATRAS,
  PLANETS
} from "./calculations";

describe("Astrological Calculations", () => {
  // Test birth data
  const testBirthData = {
    date: "1990-05-15",
    time: "10:30",
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 5.5
  };

  describe("generateBirthChart", () => {
    it("should generate a valid D1 chart with all planets", () => {
      const chart = generateBirthChart(testBirthData);
      
      expect(chart).toBeDefined();
      expect(chart.planets).toBeDefined();
      expect(chart.planets.length).toBeGreaterThanOrEqual(9); // 9 Vedic planets
      
      // Check that all main planets are present
      const planetNames = chart.planets.map(p => p.planet);
      expect(planetNames).toContain("Sun");
      expect(planetNames).toContain("Moon");
      expect(planetNames).toContain("Mars");
      expect(planetNames).toContain("Mercury");
      expect(planetNames).toContain("Jupiter");
      expect(planetNames).toContain("Venus");
      expect(planetNames).toContain("Saturn");
      expect(planetNames).toContain("Rahu");
      expect(planetNames).toContain("Ketu");
    });

    it("should calculate valid zodiac signs for planets", () => {
      const chart = generateBirthChart(testBirthData);
      
      chart.planets.forEach(planet => {
        expect(ZODIAC_SIGNS).toContain(planet.sign);
        expect(planet.house).toBeGreaterThanOrEqual(1);
        expect(planet.house).toBeLessThanOrEqual(12);
      });
    });

    it("should calculate valid nakshatra for Moon", () => {
      const chart = generateBirthChart(testBirthData);
      const moon = chart.planets.find(p => p.planet === "Moon");
      
      expect(moon).toBeDefined();
      expect(moon?.nakshatra).toBeDefined();
      expect(NAKSHATRAS).toContain(moon?.nakshatra);
    });

    it("should include Ascendant information", () => {
      const chart = generateBirthChart(testBirthData);
      
      expect(chart.ascendant).toBeDefined();
      expect(ZODIAC_SIGNS).toContain(chart.ascendant.sign);
      expect(chart.ascendant.degree).toBeGreaterThanOrEqual(0);
      expect(chart.ascendant.degree).toBeLessThan(30);
    });
  });

  describe("generateFullChartData", () => {
    it("should generate all divisional charts", () => {
      const fullData = generateFullChartData(testBirthData);
      
      expect(fullData).toBeDefined();
      expect(fullData.d1).toBeDefined();
      expect(fullData.d2).toBeDefined();
      expect(fullData.d9).toBeDefined();
      expect(fullData.d10).toBeDefined();
      expect(fullData.d24).toBeDefined();
    });

    it("should include Dasha information", () => {
      const fullData = generateFullChartData(testBirthData);
      
      expect(fullData.dashas).toBeDefined();
      expect(fullData.currentDasha).toBeDefined();
    });

    it("should detect yogas", () => {
      const fullData = generateFullChartData(testBirthData);
      
      expect(fullData.yogas).toBeDefined();
      expect(Array.isArray(fullData.yogas)).toBe(true);
    });

    it("should have valid D9 Navamsa chart", () => {
      const fullData = generateFullChartData(testBirthData);
      
      expect(fullData.d9).toBeDefined();
      expect(fullData.d9.planets).toBeDefined();
      expect(fullData.d9.planets.length).toBe(9);
    });

    it("should have valid D10 Dasamsa chart for career", () => {
      const fullData = generateFullChartData(testBirthData);
      
      expect(fullData.d10).toBeDefined();
      expect(fullData.d10.planets).toBeDefined();
      expect(fullData.d10.planets.length).toBe(9);
    });
  });

  describe("Constants", () => {
    it("should have 12 zodiac signs", () => {
      expect(ZODIAC_SIGNS.length).toBe(12);
    });

    it("should have 27 nakshatras", () => {
      expect(NAKSHATRAS.length).toBe(27);
    });

    it("should have 9 Vedic planets", () => {
      expect(PLANETS.length).toBe(9);
    });
  });
});
