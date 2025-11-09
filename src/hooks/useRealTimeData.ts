import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RiskZone {
  id: number;
  location_name: string;
  latitude: number;
  longitude: number;
  flood_risk: number;
  wildfire_risk: number;
  storm_risk: number;
  vegetation_dryness: number;
  avg_temp_c: number;
  sea_level_rise_m: number;
  historical_events: number;
  risk_score: number;
  elevation?: number;
  current_weather?: {
    temperature: number;
    humidity: number;
    precipitation: number;
    wind_speed: number;
  };
}

export interface ParametricTrigger {
  trigger_id: string;
  parameter: string;
  threshold: number;
  current_value: number;
  triggered: boolean;
  location_name: string;
  date_checked: string;
}

const DEFAULT_LOCATIONS = [
  { id: 1, name: "Miami, FL", latitude: 25.7617, longitude: -80.1918 },
  { id: 2, name: "Los Angeles, CA", latitude: 34.0522, longitude: -118.2437 },
  { id: 3, name: "Houston, TX", latitude: 29.7604, longitude: -95.3698 },
  { id: 4, name: "New York, NY", latitude: 40.7128, longitude: -74.006 },
  { id: 5, name: "Denver, CO", latitude: 39.7392, longitude: -104.9903 },
  { id: 6, name: "San Francisco, CA", latitude: 37.7749, longitude: -122.4194 },
];

export function useRiskZones() {
  const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRiskData() {
      try {
        setLoading(true);
        const zones: RiskZone[] = [];

        for (const location of DEFAULT_LOCATIONS) {
          try {
            const { data, error: funcError } = await supabase.functions.invoke('fetch-risk-data', {
              body: {
                latitude: location.latitude,
                longitude: location.longitude,
                location_name: location.name,
              },
            });

            if (funcError) throw funcError;
            if (data) {
              zones.push({ id: location.id, ...data });
            }
          } catch (err) {
            console.error(`Error fetching data for ${location.name}:`, err);
          }
        }

        setRiskZones(zones);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch risk data');
        console.error('Error fetching risk zones:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRiskData();
  }, []);

  return { riskZones, loading, error };
}

export function useParametricTriggers() {
  const [triggers, setTriggers] = useState<ParametricTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTriggers() {
      try {
        setLoading(true);
        const { data, error: funcError } = await supabase.functions.invoke('fetch-weather-triggers', {
          body: {},
        });

        if (funcError) throw funcError;
        if (data?.triggers) {
          setTriggers(data.triggers);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch trigger data');
        console.error('Error fetching triggers:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTriggers();
  }, []);

  return { triggers, loading, error };
}

export async function analyzeDamage(params: {
  location_name: string;
  disaster_type: string;
  latitude: number;
  longitude: number;
}) {
  const { data, error } = await supabase.functions.invoke('analyze-damage', {
    body: params,
  });

  if (error) throw error;
  return data;
}
