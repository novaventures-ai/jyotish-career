import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface GuestBirthData {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone: string;
  timezoneOffset?: number;
  profileName: string;
  ayanamsa: string;
}

export interface GuestChartData {
  birthData: GuestBirthData;
  chartData: any; // The generated chart data
  createdAt: number;
}

interface GuestChartContextType {
  guestChart: GuestChartData | null;
  setGuestChart: (data: GuestChartData | null) => void;
  clearGuestChart: () => void;
  hasGuestChart: boolean;
}

const GuestChartContext = createContext<GuestChartContextType | undefined>(undefined);

const GUEST_CHART_KEY = 'jyotish_guest_chart';

export function GuestChartProvider({ children }: { children: ReactNode }) {
  const [guestChart, setGuestChartState] = useState<GuestChartData | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(GUEST_CHART_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if data is less than 24 hours old
        if (parsed.createdAt && Date.now() - parsed.createdAt < 24 * 60 * 60 * 1000) {
          setGuestChartState(parsed);
        } else {
          localStorage.removeItem(GUEST_CHART_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to load guest chart from localStorage:', e);
    }
  }, []);

  const setGuestChart = (data: GuestChartData | null) => {
    setGuestChartState(data);
    if (data) {
      try {
        localStorage.setItem(GUEST_CHART_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn('LocalStorage quota exceeded, trying to save slim version...');
        try {
          // Create a slim version for localStorage persistence (strip deep dashas)
          const slimData = JSON.parse(JSON.stringify(data));
          if (slimData.chartData && slimData.chartData.dashas) {
            slimData.chartData.dashas.forEach((maha: any) => {
              if (maha.subPeriods) {
                maha.subPeriods.forEach((antar: any) => {
                  // Keep Antar dashas but remove anything deeper
                  if (antar.subPeriods) delete antar.subPeriods;
                });
              }
            });
          }
          localStorage.setItem(GUEST_CHART_KEY, JSON.stringify(slimData));
        } catch (e2) {
          console.error('Failed to save even slim version to localStorage:', e2);
          // Just keep in memory, don't crash
        }
      }
    } else {
      localStorage.removeItem(GUEST_CHART_KEY);
    }
  };

  const clearGuestChart = () => {
    setGuestChartState(null);
    localStorage.removeItem(GUEST_CHART_KEY);
  };

  return (
    <GuestChartContext.Provider
      value={{
        guestChart,
        setGuestChart,
        clearGuestChart,
        hasGuestChart: guestChart !== null,
      }}
    >
      {children}
    </GuestChartContext.Provider>
  );
}

export function useGuestChart() {
  const context = useContext(GuestChartContext);
  if (context === undefined) {
    throw new Error('useGuestChart must be used within a GuestChartProvider');
  }
  return context;
}
