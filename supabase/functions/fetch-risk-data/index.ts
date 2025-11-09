import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, location_name } = await req.json();
    console.log(`Fetching risk data for ${location_name} (${latitude}, ${longitude})`);

    // Fetch elevation data from Open-Elevation API
    const elevationResponse = await fetch(
      `https://api.open-elevation.com/api/v1/lookup?locations=${latitude},${longitude}`
    );
    const elevationData = await elevationResponse.json();
    const elevation = elevationData.results?.[0]?.elevation || 0;

    // Fetch weather and environmental data from Open-Meteo (free API)
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,precipitation_sum&timezone=auto`
    );
    const weatherData = await weatherResponse.json();

    // Calculate risk factors based on real data
    const current = weatherData.current || {};
    const daily = weatherData.daily || {};
    
    const temp = current.temperature_2m || 20;
    const humidity = current.relative_humidity_2m || 50;
    const precipitation = current.precipitation || 0;
    const windSpeed = current.wind_speed_10m || 0;
    
    // Calculate risk scores (0-1 scale)
    // Flood risk: higher with low elevation, high precipitation, proximity to coast
    const isCoastal = Math.abs(latitude) < 45 && elevation < 50;
    const flood_risk = Math.min(
      (isCoastal ? 0.4 : 0.1) + 
      (precipitation > 50 ? 0.3 : precipitation / 166) + 
      (elevation < 10 ? 0.3 : 0),
      1.0
    );

    // Wildfire risk: higher with high temp, low humidity, dry conditions
    const wildfire_risk = Math.min(
      (temp > 30 ? 0.4 : temp / 75) +
      (humidity < 30 ? 0.4 : (100 - humidity) / 250) +
      (precipitation < 10 ? 0.2 : 0),
      1.0
    );

    // Storm risk: based on wind speed and weather patterns
    const storm_risk = Math.min(
      (windSpeed > 50 ? 0.5 : windSpeed / 100) +
      (isCoastal ? 0.3 : 0.1) +
      (precipitation > 30 ? 0.2 : 0),
      1.0
    );

    // Vegetation dryness: based on temperature and humidity
    const vegetation_dryness = Math.min(
      (temp > 25 ? 0.4 : temp / 62.5) +
      (humidity < 40 ? 0.4 : (100 - humidity) / 166) +
      (precipitation < 20 ? 0.2 : 0),
      1.0
    );

    // Calculate overall risk score (0-100)
    const risk_score = Math.round(
      (flood_risk * 25) + 
      (wildfire_risk * 25) + 
      (storm_risk * 25) + 
      (vegetation_dryness * 25)
    );

    // Estimate historical events based on risk factors
    const historical_events = Math.round(
      (flood_risk * 10) + 
      (storm_risk * 10) + 
      (wildfire_risk * 5)
    );

    const riskData = {
      location_name,
      latitude,
      longitude,
      flood_risk: Math.round(flood_risk * 100) / 100,
      wildfire_risk: Math.round(wildfire_risk * 100) / 100,
      storm_risk: Math.round(storm_risk * 100) / 100,
      vegetation_dryness: Math.round(vegetation_dryness * 100) / 100,
      avg_temp_c: Math.round(temp),
      sea_level_rise_m: isCoastal ? Math.round((flood_risk * 0.5) * 100) / 100 : 0,
      historical_events,
      risk_score,
      elevation,
      current_weather: {
        temperature: temp,
        humidity,
        precipitation,
        wind_speed: windSpeed,
      }
    };

    console.log('Risk data calculated:', riskData);

    return new Response(JSON.stringify(riskData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-risk-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
