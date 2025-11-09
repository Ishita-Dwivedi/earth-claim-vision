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
    const { location_name, disaster_type, latitude, longitude } = await req.json();
    console.log(`Analyzing damage for ${location_name} - ${disaster_type}`);

    // Fetch current environmental conditions
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation,wind_speed_10m&timezone=auto`
    );
    const weatherData = await weatherResponse.json();
    const current = weatherData.current || {};

    // Calculate damage score based on disaster type and conditions
    let damage_score = 0.5;
    let claim_amount_usd = 50000;
    
    switch (disaster_type.toLowerCase()) {
      case 'flood':
        damage_score = Math.min(0.3 + (current.precipitation || 0) / 100 + Math.random() * 0.4, 1.0);
        claim_amount_usd = Math.round(80000 + (damage_score * 100000));
        break;
      case 'wildfire':
        damage_score = Math.min(0.3 + ((current.temperature_2m || 20) / 50) + Math.random() * 0.3, 1.0);
        claim_amount_usd = Math.round(70000 + (damage_score * 120000));
        break;
      case 'storm':
        damage_score = Math.min(0.4 + ((current.wind_speed_10m || 0) / 100) + Math.random() * 0.3, 1.0);
        claim_amount_usd = Math.round(60000 + (damage_score * 150000));
        break;
      default:
        damage_score = 0.5 + Math.random() * 0.3;
        claim_amount_usd = Math.round(50000 + (damage_score * 100000));
    }

    damage_score = Math.round(damage_score * 100) / 100;
    
    // Auto-approve if damage score is above threshold
    const auto_approved = damage_score >= 0.7;
    const claim_status = auto_approved ? 'Approved' : 
                        damage_score < 0.4 ? 'Rejected' : 
                        'Under Review';

    const result = {
      damage_score,
      claim_amount_usd,
      claim_status,
      auto_approved,
      analysis: {
        temperature: current.temperature_2m,
        precipitation: current.precipitation,
        wind_speed: current.wind_speed_10m,
        confidence: Math.round((0.7 + Math.random() * 0.25) * 100),
      },
      date_analyzed: new Date().toISOString().split('T')[0]
    };

    console.log('Damage analysis complete:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-damage:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
