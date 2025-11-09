import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, CheckCircle, XCircle, Clock, DollarSign, Loader2 } from "lucide-react";
import { insuranceClaims } from "@/data/mockData";
import { toast } from "sonner";
import { analyzeDamage } from "@/hooks/useRealTimeData";

export default function Claims() {
  const [selectedClaim, setSelectedClaim] = useState(insuranceClaims[0]);
  const [preImage, setPreImage] = useState<File | null>(null);
  const [postImage, setPostImage] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [newClaimData, setNewClaimData] = useState({
    location: "",
    latitude: 25.7617,
    longitude: -80.1918,
    disasterType: "",
  });

  const handleImageUpload = (type: 'pre' | 'post') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'pre') setPreImage(file);
      else setPostImage(file);
    }
  };

  const handleAnalyze = async () => {
    if (!preImage || !postImage) {
      toast.error("Please upload both pre and post-disaster images");
      return;
    }

    if (!newClaimData.location || !newClaimData.disasterType) {
      toast.error("Please select location and disaster type");
      return;
    }

    setAnalyzing(true);
    toast.info("Analyzing damage using AI...");

    try {
      const result = await analyzeDamage({
        location_name: newClaimData.location,
        disaster_type: newClaimData.disasterType,
        latitude: newClaimData.latitude,
        longitude: newClaimData.longitude,
      });

      const damagePercent = Math.round(result.damage_score * 100);
      const message = result.auto_approved
        ? `✅ Damage analysis complete! Estimated damage: ${damagePercent}% - Claim auto-approved for $${result.claim_amount_usd.toLocaleString()}`
        : `⚠️ Damage analysis complete! Estimated damage: ${damagePercent}% - Claim status: ${result.claim_status}`;

      toast.success(message, {
        description: `Confidence: ${result.analysis.confidence}% | Weather conditions analyzed`
      });
    } catch (error) {
      toast.error("Failed to analyze damage. Please try again.");
      console.error("Error analyzing damage:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "Rejected":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Claims Management</h2>
        <p className="text-muted-foreground mt-1">Automated damage detection and claim processing</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 p-4">
          <h3 className="font-semibold mb-4">All Claims</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {insuranceClaims.map((claim) => (
              <button
                key={claim.claim_id}
                onClick={() => setSelectedClaim(claim)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  selectedClaim.claim_id === claim.claim_id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-sm">{claim.claim_id}</span>
                  {getStatusIcon(claim.claim_status)}
                </div>
                <p className="text-xs opacity-90">{claim.location_name}</p>
                <p className="text-xs opacity-75 mt-1">{claim.disaster_type}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold">{selectedClaim.claim_id}</h3>
              <p className="text-sm text-muted-foreground mt-1">Policy: {selectedClaim.policy_id}</p>
            </div>
            <Badge
              variant={
                selectedClaim.claim_status === "Approved" ? "default" :
                selectedClaim.claim_status === "Rejected" ? "destructive" :
                "secondary"
              }
              className="text-base px-4 py-1"
            >
              {selectedClaim.claim_status}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-semibold mt-1">{selectedClaim.location_name}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Disaster Type</p>
              <p className="font-semibold mt-1">{selectedClaim.disaster_type}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Claim Amount</p>
              <p className="font-semibold mt-1 flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {selectedClaim.claim_amount_usd.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Damage Score</p>
              <p className="font-semibold mt-1">{(selectedClaim.damage_score * 100).toFixed(0)}%</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 mb-6">
            <div className="flex items-center gap-2 mb-2">
              {selectedClaim.auto_approved ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <FileText className="h-5 w-5 text-info" />
              )}
              <p className="font-medium">
                {selectedClaim.auto_approved ? "Auto-Approved by AI" : "Manual Review Required"}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Filed on {selectedClaim.date_filed}. 
              {selectedClaim.auto_approved 
                ? " Damage threshold exceeded, claim automatically processed."
                : " Awaiting human verification for final approval."}
            </p>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-semibold mb-4">Upload New Claim Images</h4>
            
            <div className="grid gap-4 md:grid-cols-2 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Select
                  value={newClaimData.location}
                  onValueChange={(value) => {
                    const locations: Record<string, { lat: number; lon: number }> = {
                      "Miami, FL": { lat: 25.7617, lon: -80.1918 },
                      "Los Angeles, CA": { lat: 34.0522, lon: -118.2437 },
                      "Houston, TX": { lat: 29.7604, lon: -95.3698 },
                      "New York, NY": { lat: 40.7128, lon: -74.006 },
                      "Denver, CO": { lat: 39.7392, lon: -104.9903 },
                      "San Francisco, CA": { lat: 37.7749, lon: -122.4194 },
                    };
                    setNewClaimData({
                      ...newClaimData,
                      location: value,
                      latitude: locations[value]?.lat || 0,
                      longitude: locations[value]?.lon || 0,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Miami, FL">Miami, FL</SelectItem>
                    <SelectItem value="Los Angeles, CA">Los Angeles, CA</SelectItem>
                    <SelectItem value="Houston, TX">Houston, TX</SelectItem>
                    <SelectItem value="New York, NY">New York, NY</SelectItem>
                    <SelectItem value="Denver, CO">Denver, CO</SelectItem>
                    <SelectItem value="San Francisco, CA">San Francisco, CA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Disaster Type</label>
                <Select
                  value={newClaimData.disasterType}
                  onValueChange={(value) => setNewClaimData({ ...newClaimData, disasterType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select disaster type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Flood">Flood</SelectItem>
                    <SelectItem value="Wildfire">Wildfire</SelectItem>
                    <SelectItem value="Storm">Storm</SelectItem>
                    <SelectItem value="Hurricane">Hurricane</SelectItem>
                    <SelectItem value="Earthquake">Earthquake</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Pre-Disaster Image</label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload('pre')}
                    className="hidden"
                    id="pre-image"
                  />
                  <label htmlFor="pre-image" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {preImage ? preImage.name : "Click to upload"}
                    </p>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Post-Disaster Image</label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload('post')}
                    className="hidden"
                    id="post-image"
                  />
                  <label htmlFor="post-image" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {postImage ? postImage.name : "Click to upload"}
                    </p>
                  </label>
                </div>
              </div>
            </div>
            <Button 
              className="w-full mt-4" 
              onClick={handleAnalyze}
              disabled={!preImage || !postImage || analyzing}
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing Damage...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Analyze Damage with AI
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
