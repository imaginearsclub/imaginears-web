'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/common';
import { 
  Activity, 
  Users, 
  AlertTriangle, 
  Shield,
  TrendingUp,
  RefreshCw,
  Search,
  Download,
  Lock,
  Trash2,
  Eye,
  Filter
} from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  activeSessions: number;
  suspiciousSessions: number;
  riskScore?: number;
  lastLogin?: Date;
}

interface AdminSessionsClientProps {
  initialUsers: User[];
  totalActiveSessions: number;
  suspiciousSessions: number;
  recentLogins: number;
  uniqueActiveUsers: number;
}

export function AdminSessionsClient({
  initialUsers,
  totalActiveSessions: initialActive,
  suspiciousSessions: initialSuspicious,
  recentLogins: initialRecent,
  uniqueActiveUsers: initialUnique,
}: AdminSessionsClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'sessions' | 'risk'>('risk');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Live stats
  const [stats, setStats] = useState({
    activeSessions: initialActive,
    suspiciousSessions: initialSuspicious,
    recentLogins: initialRecent,
    activeUsers: initialUnique,
  });

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    try {
      // In production, fetch from API
      // const response = await fetch('/api/admin/sessions/stats');
      // const data = await response.json();
      // setUsers(data.users);
      // setStats(data.stats);
      
      // Simulate refresh for now
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter and sort users
  const filteredUsers = users
    .filter(user => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower);
      
      // Role filter
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      
      // Risk filter
      const matchesRisk = filterRisk === 'all' ||
        (filterRisk === 'high' && (user.suspiciousSessions > 0 || (user.riskScore || 0) >= 50)) ||
        (filterRisk === 'low' && user.suspiciousSessions === 0 && (user.riskScore || 0) < 50);
      
      return matchesSearch && matchesRole && matchesRisk;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || a.email || '').localeCompare(b.name || b.email || '');
        case 'sessions':
          return b.activeSessions - a.activeSessions;
        case 'risk':
          return (b.riskScore || 0) - (a.riskScore || 0);
        default:
          return 0;
      }
    });

  const handleBulkRevokeSuspicious = async () => {
    if (!confirm('Are you sure you want to revoke ALL suspicious sessions? This will log out affected users.')) {
      return;
    }
    
    // Implementation would call API
    console.log('Bulk revoking suspicious sessions...');
  };

  const handleExportData = () => {
    // Generate CSV export
    const csv = [
      ['User', 'Email', 'Role', 'Active Sessions', 'Suspicious', 'Risk Score', 'Last Login'],
      ...filteredUsers.map(u => [
        u.name || '',
        u.email || '',
        u.role,
        u.activeSessions,
        u.suspiciousSessions,
        u.riskScore || 0,
        u.lastLogin ? new Date(u.lastLogin).toISOString() : ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-sessions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Key Metrics with Live Updates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Activity}
          label="Active Sessions"
          value={stats.activeSessions}
          color="blue"
          trend="+12%"
        />
        <StatCard
          icon={Users}
          label="Active Users"
          value={stats.activeUsers}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Logins (24h)"
          value={stats.recentLogins}
          color="purple"
          trend="+8%"
        />
        <StatCard
          icon={AlertTriangle}
          label="Suspicious"
          value={stats.suspiciousSessions}
          color={stats.suspiciousSessions > 0 ? 'red' : 'slate'}
          alert={stats.suspiciousSessions > 0}
        />
      </div>

      {/* Action Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex items-center gap-3 flex-1 w-full lg:w-auto">
              {/* Search */}
              <div className="relative flex-1 lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              {/* Filters */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="all">All Roles</option>
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admin</option>
                <option value="MODERATOR">Moderator</option>
                <option value="STAFF">Staff</option>
                <option value="USER">User</option>
              </select>

              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="px-3 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="all">All Risk</option>
                <option value="high">High Risk</option>
                <option value="low">Low Risk</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>

              {stats.suspiciousSessions > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkRevokeSuspicious}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Revoke Suspicious ({stats.suspiciousSessions})
                </Button>
              )}
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-slate-600 dark:text-slate-400">Sort by:</span>
            <div className="flex gap-2">
              {(['name', 'sessions', 'risk'] as const).map((sort) => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    sortBy === sort
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {sort.charAt(0).toUpperCase() + sort.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              User Sessions ({filteredUsers.length})
            </CardTitle>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <UserSessionRow
                key={user.id}
                user={user}
                onViewSessions={() => setSelectedUserId(user.id)}
              />
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No users found matching your filters
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="text-sm text-slate-600 dark:text-slate-400 text-center">
        Total: {stats.activeSessions} sessions across {stats.activeUsers} users
        {stats.suspiciousSessions > 0 && (
          <span className="ml-2 text-red-600 dark:text-red-400 font-semibold">
            • {stats.suspiciousSessions} suspicious sessions require attention
          </span>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  trend,
  alert,
}: {
  icon: any;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'purple' | 'red' | 'slate';
  trend?: string;
  alert?: boolean;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  };

  return (
    <Card className={alert ? 'border-2 border-red-500' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {value}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
              {label}
              {trend && (
                <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                  {trend}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UserSessionRow({ user, onViewSessions }: { user: User; onViewSessions: () => void }) {
  const getRiskColor = (score?: number) => {
    if (!score) return 'bg-slate-100 text-slate-700';
    if (score >= 70) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    if (score >= 50) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    if (score >= 25) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 dark:text-white">
            {user.name || 'Unknown User'}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {user.email}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              {user.role}
            </span>
            {user.lastLogin && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Last: {new Date(user.lastLogin).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {user.activeSessions}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Sessions
            </div>
          </div>

          {user.suspiciousSessions > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {user.suspiciousSessions}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400">
                Suspicious
              </div>
            </div>
          )}

          {user.riskScore !== undefined && (
            <div className={`px-3 py-2 rounded-lg ${getRiskColor(user.riskScore)}`}>
              <div className="text-lg font-bold">{user.riskScore}</div>
              <div className="text-xs">Risk</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewSessions}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

