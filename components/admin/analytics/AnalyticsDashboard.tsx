"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common";
import { Badge } from "@/components/common/Badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/common";
import { Spinner } from "@/components/common/Spinner";
import { Tooltip } from "@/components/common/Tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/common";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Users,
  Eye,
  Calendar,
  Download,
  Gamepad2,
  MousePointer,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { MinecraftSyncPanel } from "./MinecraftSyncPanel";
import { PlayerAnalyticsTable } from "./PlayerAnalyticsTable";

interface AnalyticsOverview {
  period: string;
  startDate: string;
  endDate: string;
  pageViews: Array<{ date: string; views: number }>;
  uniqueVisitors: number;
  topPages: Array<{ path: string; views: number }>;
  deviceBreakdown: Array<{ deviceType: string; count: number }>;
  activePlayers: number;
}

interface PlayerAnalytics {
  activePlayers: Array<{
    id: string;
    minecraftName: string | null;
    totalWebVisits: number;
    totalMinecraftTime: number;
    totalMinecraftJoins: number;
    overallEngagement: number;
    lastActiveAt: string;
  }>;
  retention: Record<
    string,
    { total: number; active: number; retention: number }
  >;
  topPlayers: Array<{
    minecraftName: string | null;
    totalMinecraftTime: number;
    totalMinecraftJoins: number;
  }>;
}

interface EventAnalytics {
  topEvents: Array<{
    eventId: string;
    eventTitle: string;
    category: string;
    startAt: string;
    totalViews: number;
    uniqueVisitors: number;
    totalClicks: number;
    favoriteCount: number;
  }>;
}

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<string>("week");
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [playerData, setPlayerData] = useState<PlayerAnalytics | null>(null);
  const [eventData, setEventData] = useState<EventAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const [overviewRes, playersRes, eventsRes] = await Promise.all([
        fetch(`/api/analytics/overview?period=${period}`),
        fetch("/api/analytics/players?days=30"),
        fetch("/api/analytics/events?limit=10"),
      ]);

      if (overviewRes.ok) setOverview(await overviewRes.json());
      if (playersRes.ok) setPlayerData(await playersRes.json());
      if (eventsRes.ok) setEventData(await eventsRes.json());
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(format: "csv" | "excel" | "pdf", type: "players" | "sync-history") {
    setExporting(true);
    try {
      const days = period === "today" ? 1 : period === "week" ? 7 : period === "month" ? 30 : period === "quarter" ? 90 : 365;
      const response = await fetch(`/api/admin/export/${type}?format=${format}&days=${days}`);
      
      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Get the filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `export-${type}-${Date.now()}.${format === "excel" ? "xlsx" : format}`;

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `export-${Date.now()}.${format === "excel" ? "xlsx" : format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  const totalPageViews = overview?.pageViews.reduce((sum, day) => sum + day.views, 0) || 0;

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="quarter">Last 90 Days</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <Tooltip content={exporting ? "Exporting..." : "Export Analytics Data"} side="top">
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={exporting}>
                <Download className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
              Export Players Data
            </div>
            <DropdownMenuItem onClick={() => handleExport("csv", "players")}>
              <FileText className="w-4 h-4 mr-2" />
              CSV Format
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("excel", "players")}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel Format
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("pdf", "players")}>
              <FileText className="w-4 h-4 mr-2" />
              PDF Format
            </DropdownMenuItem>
            <div className="my-1 h-px bg-border" />
            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
              Export Sync History
            </div>
            <DropdownMenuItem onClick={() => handleExport("csv", "sync-history")}>
              <FileText className="w-4 h-4 mr-2" />
              CSV Format
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("excel", "sync-history")}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel Format
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("pdf", "sync-history")}>
              <FileText className="w-4 h-4 mr-2" />
              PDF Format
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="web">Web Traffic</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Overview Tab */}
      {activeTab === "overview" && overview && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Page Views
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {totalPageViews.toLocaleString()}
                  </p>
                </div>
                <Eye className="w-8 h-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Unique Visitors
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {overview.uniqueVisitors.toLocaleString()}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Players
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {overview.activePlayers.toLocaleString()}
                  </p>
                </div>
                <Gamepad2 className="w-8 h-8 text-purple-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Avg. Daily Views
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {Math.round(totalPageViews / overview.pageViews.length).toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Page Views Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Page Views Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={overview.pageViews}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorViews)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Device Breakdown */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Devices</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={overview.deviceBreakdown}
                    dataKey="count"
                    nameKey="deviceType"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {overview.deviceBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.deviceType === "mobile"
                            ? "#3b82f6"
                            : entry.deviceType === "desktop"
                            ? "#10b981"
                            : "#f59e0b"
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Top Pages */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Pages</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={overview.topPages} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis
                    dataKey="path"
                    type="category"
                    width={150}
                    className="text-xs"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="views" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}

      {/* Players Tab */}
      {activeTab === "players" && (
        <div className="space-y-6">
          {/* Minecraft Sync Panel */}
          <MinecraftSyncPanel />

          {!playerData && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-2">
                No player data available yet
              </p>
              <p className="text-sm text-muted-foreground">
                Use the sync panel above to fetch player data from Plan, or check that you have analytics permissions.
              </p>
            </Card>
          )}

          {playerData && (
            <>
              {/* Player Data Table with Search and Filters */}
              <PlayerAnalyticsTable players={playerData.activePlayers} />

              {/* Summary Cards */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Top Players */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Top Players by Playtime</h3>
                  <div className="space-y-4">
                    {playerData.topPlayers.slice(0, 5).map((player, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="default">{index + 1}</Badge>
                          <Gamepad2 className="w-4 h-4 text-purple-500" />
                          <span className="font-medium">{player.minecraftName || "Unknown"}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {Math.round(player.totalMinecraftTime / 60)}h
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {player.totalMinecraftJoins} joins
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Player Retention Chart */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Player Retention</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={Object.entries(playerData.retention).map(([period, data]) => ({
                        period,
                        retention: Math.round(data.retention),
                        active: data.active,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="period" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="retention" fill="#10b981" name="Retention %" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* Events Tab */}
      {activeTab === "events" && eventData && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Events by Views</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={eventData.topEvents}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="eventTitle"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  className="text-xs"
                />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="totalViews" fill="#3b82f6" name="Total Views" />
                <Bar
                  dataKey="uniqueVisitors"
                  fill="#10b981"
                  name="Unique Visitors"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Event List */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Event Performance</h3>
            <div className="space-y-4">
              {eventData.topEvents.map((event) => (
                <div
                  key={event.eventId}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      <div>
                        <h4 className="font-semibold">{event.eventTitle}</h4>
                        <p className="text-sm text-muted-foreground">
                          {event.category} •{" "}
                          {new Date(event.startAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-6 text-right">
                    <div>
                      <p className="font-semibold text-lg">{event.totalViews}</p>
                      <p className="text-xs text-muted-foreground">Views</p>
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{event.uniqueVisitors}</p>
                      <p className="text-xs text-muted-foreground">Visitors</p>
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{event.totalClicks}</p>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Web Traffic Tab */}
      {activeTab === "web" && overview && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Page Views Line Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Daily Page Views</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={overview.pageViews}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Top Pages Table */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Most Visited Pages</h3>
              <div className="space-y-3">
                {overview.topPages.map((page, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="default">{index + 1}</Badge>
                      <MousePointer className="w-4 h-4 text-blue-500" />
                      <code className="text-sm">{page.path}</code>
                    </div>
                    <Badge>{page.views} views</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

