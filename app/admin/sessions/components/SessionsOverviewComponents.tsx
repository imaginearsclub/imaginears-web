import { 
  Activity, 
  Users, 
  AlertTriangle,
  RefreshCw,
  Search,
  Download,
  Lock,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Tooltip } from '@/components/common';

// ==================== Types ====================

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  activeSessions: number;
  suspiciousSessions: number;
  riskScore?: number;
  lastLogin?: Date;
}

export interface SessionStats {
  activeSessions: number;
  suspiciousSessions: number;
  activeUsers: number;
}

export type SortBy = 'name' | 'sessions' | 'risk';
type ColorVariant = 'blue' | 'green' | 'purple' | 'red' | 'slate';

// ==================== Constants ====================

export const SELECT_CLASS = "px-3 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900";

const RISK_COLORS = {
  70: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  50: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  25: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  0: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  default: 'bg-slate-100 text-slate-700',
} as const;

const STAT_COLORS: Record<ColorVariant, string> = {
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
};

// ==================== Helper Functions ====================

export function getRiskColor(score?: number): string {
  if (!score) return RISK_COLORS.default;
  if (score >= 70) return RISK_COLORS[70];
  if (score >= 50) return RISK_COLORS[50];
  if (score >= 25) return RISK_COLORS[25];
  return RISK_COLORS[0];
}

// ==================== Components ====================

export function StatCard({
  icon: Icon,
  label,
  value,
  color,
  alert,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: ColorVariant;
  alert?: boolean;
}) {
  return (
    <Card className={alert ? 'border-2 border-red-500' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line security/detect-object-injection */}
          <div className={`p-3 rounded-lg ${STAT_COLORS[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {value}
            </div>
             <div className="text-sm text-slate-600 dark:text-slate-400">
              {label}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function KeyMetrics({ stats }: { stats: SessionStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        icon={Activity}
        label="Active Sessions"
        value={stats.activeSessions}
        color="blue"
      />
      <StatCard
        icon={Users}
        label="Active Users"
        value={stats.activeUsers}
        color="green"
      />
      <StatCard
        icon={AlertTriangle}
        label="Suspicious"
        value={stats.suspiciousSessions}
        color={stats.suspiciousSessions > 0 ? 'red' : 'slate'}
        alert={stats.suspiciousSessions > 0}
      />
    </div>
  );
}

export function SearchBar({ 
  searchQuery, 
  setSearchQuery 
}: { 
  searchQuery: string; 
  setSearchQuery: (_q: string) => void; // eslint-disable-line no-unused-vars
}) {
  return (
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
  );
}

export function Filters({
  filterRole,
  setFilterRole,
  filterRisk,
  setFilterRisk,
}: {
  filterRole: string;
  setFilterRole: (_r: string) => void; // eslint-disable-line no-unused-vars
  filterRisk: string;
  setFilterRisk: (_r: string) => void; // eslint-disable-line no-unused-vars
}) {
  return (
    <>
      <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className={SELECT_CLASS}>
        <option value="all">All Roles</option>
        <option value="OWNER">Owner</option>
        <option value="ADMIN">Admin</option>
        <option value="MODERATOR">Moderator</option>
        <option value="STAFF">Staff</option>
        <option value="USER">User</option>
      </select>
      <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} className={SELECT_CLASS}>
        <option value="all">All Risk</option>
        <option value="high">High Risk</option>
        <option value="low">Low Risk</option>
      </select>
    </>
  );
}

export function ActionButtons({
  refreshing,
  suspiciousCount,
  onRefresh,
  onExport,
  onBulkRevoke,
}: {
  refreshing: boolean;
  suspiciousCount: number;
  onRefresh: () => void;
  onExport: () => void;
  onBulkRevoke: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Tooltip content="Refresh data">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </Tooltip>
      <Tooltip content="Export to CSV">
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="w-4 h-4" />
        </Button>
      </Tooltip>
      {suspiciousCount > 0 && (
        <Button variant="danger" size="sm" onClick={onBulkRevoke}>
          <Lock className="w-4 h-4 mr-2" />
          Revoke Suspicious ({suspiciousCount})
        </Button>
      )}
    </div>
  );
}

export function SortButtons({
  sortBy,
  setSortBy,
}: {
  sortBy: SortBy;
  setSortBy: (_s: SortBy) => void; // eslint-disable-line no-unused-vars
}) {
  const sorts: SortBy[] = ['name', 'sessions', 'risk'];
  
  return (
    <div className="flex items-center gap-2 mt-4">
      <span className="text-sm text-slate-600 dark:text-slate-400">Sort by:</span>
      <div className="flex gap-2">
        {sorts.map((sort) => (
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
  );
}

export function UserMetrics({ user }: { user: User }) {
  return (
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
  );
}

export function UserInfo({ user }: { user: User }) {
  return (
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
  );
}

export function UserSessionRow({ 
  user, 
  onViewSessions 
}: { 
  user: User; 
  onViewSessions: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <UserInfo user={user} />
        <UserMetrics user={user} />
        <div className="flex items-center gap-2">
          <Tooltip content="View all sessions">
            <Button variant="outline" size="sm" onClick={onViewSessions}>
              <Eye className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

export function UsersTable({
  filteredUsers,
  totalUsers,
  onViewSessions,
}: {
  filteredUsers: User[];
  totalUsers: number;
  onViewSessions: (_userId: string) => void; // eslint-disable-line no-unused-vars
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            User Sessions ({filteredUsers.length})
          </CardTitle>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Showing {filteredUsers.length} of {totalUsers} users
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <UserSessionRow
              key={user.id}
              user={user}
              onViewSessions={() => onViewSessions(user.id)}
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
  );
}

export function SessionsSummary({ stats }: { stats: SessionStats }) {
  return (
    <div className="text-sm text-slate-600 dark:text-slate-400 text-center">
      Total: {stats.activeSessions} sessions across {stats.activeUsers} users
      {stats.suspiciousSessions > 0 && (
        <span className="ml-2 text-red-600 dark:text-red-400 font-semibold">
          • {stats.suspiciousSessions} suspicious sessions require attention
        </span>
      )}
    </div>
  );
}

