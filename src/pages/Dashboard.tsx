import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, TrendingUp, DollarSign, MapPin, FileText } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { insuranceClaims } from "@/data/mockData";
import { useRiskZones, useParametricTriggers } from "@/hooks/useRealTimeData";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { riskZones, loading: loadingRisk } = useRiskZones();
  const { triggers: parametricTriggers, loading: loadingTriggers } = useParametricTriggers();
  
  const loading = loadingRisk || loadingTriggers;
  
  if (loading) {
    return (
      <div className="space-y-6 pb-20 md:pb-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  const approvedClaims = insuranceClaims.filter(c => c.claim_status === "Approved").length;
  const pendingClaims = insuranceClaims.filter(c => c.claim_status === "Pending" || c.claim_status === "Under Review").length;
  const totalClaimAmount = insuranceClaims.reduce((sum, c) => sum + c.claim_amount_usd, 0);
  const activeTriggers = parametricTriggers.filter(t => t.triggered).length;

  const riskDistribution = [
    { name: "High Risk", value: riskZones.filter(z => z.risk_score >= 70).length, color: "hsl(var(--destructive))" },
    { name: "Medium Risk", value: riskZones.filter(z => z.risk_score >= 50 && z.risk_score < 70).length, color: "hsl(var(--warning))" },
    { name: "Low Risk", value: riskZones.filter(z => z.risk_score < 50).length, color: "hsl(var(--success))" },
  ];

  const claimsByDisaster = insuranceClaims.reduce((acc, claim) => {
    const existing = acc.find(item => item.type === claim.disaster_type);
    if (existing) {
      existing.count++;
      existing.amount += claim.claim_amount_usd;
    } else {
      acc.push({ type: claim.disaster_type, count: 1, amount: claim.claim_amount_usd });
    }
    return acc;
  }, [] as { type: string; count: number; amount: number }[]);

  if (loading) {
    return (
      <div className="space-y-6 pb-20 md:pb-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Real-time insights from Earth observation and AI analytics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Locations</p>
              <p className="text-3xl font-bold text-foreground mt-2">{riskZones.length}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-info/10 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-info" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-sm text-muted-foreground">Risk monitoring active</span>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Claims</p>
              <p className="text-3xl font-bold text-foreground mt-2">{insuranceClaims.length}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-muted-foreground">{approvedClaims} approved</span>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Claims Value</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                ${(totalClaimAmount / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-success" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Across {insuranceClaims.length} policies</span>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Triggers</p>
              <p className="text-3xl font-bold text-foreground mt-2">{activeTriggers}/{parametricTriggers.length}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Parametric conditions</span>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Risk Score Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={riskZones}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="location_name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem'
                }}
              />
              <Bar dataKey="risk_score" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Risk Category Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {riskDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Claims by Disaster Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={claimsByDisaster}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem'
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Claims Activity</h3>
          <div className="space-y-3">
            {insuranceClaims.slice(0, 4).map((claim) => (
              <div key={claim.claim_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{claim.location_name}</p>
                  <p className="text-xs text-muted-foreground">{claim.disaster_type} - {claim.date_filed}</p>
                </div>
                <Badge
                  variant={
                    claim.claim_status === "Approved" ? "default" :
                    claim.claim_status === "Rejected" ? "destructive" :
                    "secondary"
                  }
                >
                  {claim.claim_status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
