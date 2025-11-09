import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building, Home, Sprout, AlertTriangle } from "lucide-react";
import { assetsInsured } from "@/data/mockData";
import { useRiskZones } from "@/hooks/useRealTimeData";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function AssetMap() {
  const { riskZones, loading } = useRiskZones();
  const [selectedAsset, setSelectedAsset] = useState(assetsInsured[0]);

  const getAssetIcon = (type: string) => {
    if (type.includes("Residential")) return Home;
    if (type.includes("Commercial")) return Building;
    return Sprout;
  };

  const getRiskForLocation = (locationName: string) => {
    const zone = riskZones.find(z => z.location_name === locationName);
    return zone?.risk_score || 0;
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-20 md:pb-8">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Asset Map</h2>
        <p className="text-muted-foreground mt-1">Insured properties and real-time risk monitoring</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6 bg-gradient-to-br from-primary/5 via-secondary/5 to-info/5">
          <div className="relative h-[500px] rounded-lg overflow-hidden bg-muted/30 border-2 border-border">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full">
                {riskZones.map((zone) => {
                  const asset = assetsInsured.find(a => a.location_name === zone.location_name);
                  const left = ((zone.longitude + 180) / 360) * 100;
                  const top = ((90 - zone.latitude) / 180) * 100;
                  
                  return (
                    <div
                      key={zone.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                      style={{ left: `${left}%`, top: `${top}%` }}
                      onClick={() => asset && setSelectedAsset(asset)}
                    >
                      <div className={`relative ${asset ? 'animate-pulse' : ''}`}>
                        <div className={`h-4 w-4 rounded-full ${
                          zone.risk_score >= 70 
                            ? 'bg-destructive' 
                            : zone.risk_score >= 50 
                            ? 'bg-warning' 
                            : 'bg-success'
                        } ${asset ? 'ring-4 ring-primary/30' : ''}`} />
                        {asset && (
                          <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
                        )}
                      </div>
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border rounded-lg p-2 whitespace-nowrap shadow-lg z-10">
                        <p className="text-xs font-semibold">{zone.location_name}</p>
                        <p className="text-xs text-muted-foreground">Risk: {zone.risk_score}</p>
                        {asset && (
                          <p className="text-xs text-primary">{asset.type}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 border shadow-lg">
                  <h4 className="font-semibold text-sm mb-2">Legend</h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="h-3 w-3 rounded-full bg-destructive" />
                      <span>High Risk (70+)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="h-3 w-3 rounded-full bg-warning" />
                      <span>Medium Risk (50-69)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="h-3 w-3 rounded-full bg-success" />
                      <span>Low Risk (&lt;50)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs pt-1 border-t">
                      <div className="h-3 w-3 rounded-full bg-primary ring-2 ring-primary/30" />
                      <span>Insured Asset</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Insured Assets</h3>
            <div className="space-y-2">
              {assetsInsured.map((asset) => {
                const Icon = getAssetIcon(asset.type);
                const riskScore = getRiskForLocation(asset.location_name);
                
                return (
                  <button
                    key={asset.asset_id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedAsset.asset_id === asset.asset_id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium text-sm">{asset.asset_id}</span>
                    </div>
                    <p className="text-xs opacity-90">{asset.location_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={riskScore >= 70 ? "destructive" : riskScore >= 50 ? "secondary" : "default"} className="text-xs">
                        Risk: {riskScore}
                      </Badge>
                      {!asset.active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {selectedAsset && (
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = getAssetIcon(selectedAsset.type);
                    return (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                    );
                  })()}
                  <div>
                    <h4 className="font-semibold">{selectedAsset.asset_id}</h4>
                    <p className="text-xs text-muted-foreground">{selectedAsset.type}</p>
                  </div>
                </div>
                <Badge variant={selectedAsset.active ? "default" : "secondary"}>
                  {selectedAsset.active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Owner</p>
                  <p className="font-medium mt-1">{selectedAsset.owner}</p>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedAsset.location_name}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Insured Value</p>
                  <p className="font-medium mt-1 text-lg">
                    ${selectedAsset.insured_value_usd.toLocaleString()}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Policy Period</p>
                  <p className="font-medium mt-1 text-sm">
                    {selectedAsset.policy_start_date} to {selectedAsset.policy_end_date}
                  </p>
                </div>

                {(() => {
                  const riskScore = getRiskForLocation(selectedAsset.location_name);
                  if (riskScore >= 70) {
                    return (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <p className="text-sm font-medium text-destructive">High Risk Location</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
