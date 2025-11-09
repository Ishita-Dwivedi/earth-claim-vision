import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle, Flame, Droplets, Wind, Thermometer, Loader2 } from "lucide-react";
import { fetchRiskForLocation } from "@/hooks/useRealTimeData";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

export default function RiskScoring() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchRiskForLocation(searchQuery);
      
      if (result) {
        setSearchResults(prev => {
          // Add to results if not already there
          const exists = prev.find((r: any) => r.id === result.id);
          if (exists) return prev;
          return [result, ...prev].slice(0, 10); // Keep last 10 searches
        });
        setSelectedLocation(result);
      }
    } catch (err) {
      setError('Location not found. Try searching for a city, state, or country.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { label: "High Risk", color: "destructive" as const };
    if (score >= 50) return { label: "Medium Risk", color: "secondary" as const };
    return { label: "Low Risk", color: "default" as const };
  };

  const radarData = selectedLocation ? [
    { factor: "Flood", value: selectedLocation.flood_risk * 100 },
    { factor: "Wildfire", value: selectedLocation.wildfire_risk * 100 },
    { factor: "Storm", value: selectedLocation.storm_risk * 100 },
    { factor: "Vegetation", value: selectedLocation.vegetation_dryness * 100 },
  ] : [];


  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Risk Scoring Dashboard</h2>
        <p className="text-muted-foreground mt-1">AI-powered risk assessment using satellite and climate data</p>
      </div>

      <Card className="p-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search any location worldwide (e.g., Tokyo, Paris, Miami, FL)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
              disabled={loading}
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Search
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Recent Searches:</p>
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {searchResults.map((location) => (
                <button
                  key={location.id}
                  onClick={() => setSelectedLocation(location)}
                  className={`p-3 rounded-lg text-left transition-all ${
                    selectedLocation?.id === location.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{location.location_name}</span>
                    <Badge variant={selectedLocation?.id === location.id ? "secondary" : "outline"}>
                      Score: {location.risk_score}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {searchResults.length === 0 && !loading && (
          <div className="mt-4 text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Search for any location on Earth to view climate risk metrics</p>
            <p className="text-xs mt-1">Data includes real-time weather, historical disasters, and AI risk assessment</p>
          </div>
        )}
      </Card>

      {selectedLocation && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold">{selectedLocation.location_name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedLocation.latitude.toFixed(4)}°N, {Math.abs(selectedLocation.longitude).toFixed(4)}°W
                </p>
              </div>
              <Badge variant={getRiskLevel(selectedLocation.risk_score).color} className="text-lg px-4 py-2">
                {selectedLocation.risk_score}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-info/10 flex items-center justify-center">
                    <Droplets className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Flood Risk</p>
                    <p className="text-xs text-muted-foreground">Sea level: +{selectedLocation.sea_level_rise_m}m</p>
                  </div>
                </div>
                <span className="text-xl font-bold">{(selectedLocation.flood_risk * 100).toFixed(0)}%</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Flame className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Wildfire Risk</p>
                    <p className="text-xs text-muted-foreground">Vegetation dryness: {(selectedLocation.vegetation_dryness * 100).toFixed(0)}%</p>
                  </div>
                </div>
                <span className="text-xl font-bold">{(selectedLocation.wildfire_risk * 100).toFixed(0)}%</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                    <Wind className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Storm Risk</p>
                    <p className="text-xs text-muted-foreground">Historical events: {selectedLocation.historical_events}</p>
                  </div>
                </div>
                <span className="text-xl font-bold">{(selectedLocation.storm_risk * 100).toFixed(0)}%</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                    <Thermometer className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Average Temperature</p>
                    <p className="text-xs text-muted-foreground">Climate baseline</p>
                  </div>
                </div>
                <span className="text-xl font-bold">{selectedLocation.avg_temp_c}°C</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Risk Factor Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="factor" tick={{ fill: 'hsl(var(--foreground))' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Risk Level" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>

            <div className="mt-6 p-4 rounded-lg bg-muted/50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="font-medium text-sm">AI Assessment + NOAA Historical Data</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This location shows {getRiskLevel(selectedLocation.risk_score).label.toLowerCase()} based on 
                    {selectedLocation.historical_events} estimated historical disaster events and current climate indicators.
                    {selectedLocation.flood_risk > 0.7 && " Significant flood risk detected."}
                    {selectedLocation.wildfire_risk > 0.7 && " High wildfire probability."}
                    {selectedLocation.storm_risk > 0.7 && " Elevated storm activity expected."}
                  </p>
                  {selectedLocation.storm_event_types && selectedLocation.storm_event_types.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="text-xs font-medium">Event Types:</span>
                      {selectedLocation.storm_event_types.map((type: string) => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
