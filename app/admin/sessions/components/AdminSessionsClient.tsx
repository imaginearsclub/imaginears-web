'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/common';
import { clientLog } from '@/lib/client-logger';
import { ViewSessionsModal } from './ViewSessionsModal';
import {
  type User,
  type SessionStats,
  type SortBy,
  KeyMetrics,
  SearchBar,
  Filters,
  ActionButtons,
  SortButtons,
  UsersTable,
  SessionsSummary,
} from './SessionsOverviewComponents';

// ==================== Types ====================

interface AdminSessionsClientProps {
  initialUsers: User[];
  totalActiveSessions: number;
  suspiciousSessions: number;
  uniqueActiveUsers: number;
}

// ==================== Utility Functions ====================

function filterUsers(users: User[], searchQuery: string, filterRole: string, filterRisk: string): User[] {
  return users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower);
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    const riskScore = user.riskScore || 0;
    const matchesRisk = filterRisk === 'all' ||
      (filterRisk === 'high' && (user.suspiciousSessions > 0 || riskScore >= 50)) ||
      (filterRisk === 'low' && user.suspiciousSessions === 0 && riskScore < 50);
    
    return matchesSearch && matchesRole && matchesRisk;
  });
}

function sortUsers(users: User[], sortBy: SortBy): User[] {
  return [...users].sort((a, b) => {
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
}

function exportToCSV(users: User[]) {
  const headers = ['User', 'Email', 'Role', 'Active Sessions', 'Suspicious', 'Risk Score', 'Last Login'];
  const rows = users.map(u => [
    u.name || '',
    u.email || '',
    u.role,
    u.activeSessions,
    u.suspiciousSessions,
    u.riskScore || 0,
    u.lastLogin ? new Date(u.lastLogin).toISOString() : ''
  ]);
  
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  a.href = url;
  a.download = `admin-sessions-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function bulkRevokeSuspicious(
  onRefresh: () => Promise<void>,
  setRefreshing: (_value: boolean) => void // eslint-disable-line no-unused-vars
): Promise<void> {
  if (!confirm('Are you sure you want to revoke ALL suspicious sessions? This will log out affected users.')) {
    return;
  }
  
  setRefreshing(true);
  try {
    const response = await fetch('/api/admin/sessions/bulk-revoke-suspicious', {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to revoke suspicious sessions');
    }
    
    const result = await response.json();
    
    if (result.success) {
      clientLog.warn('Admin Sessions: Bulk revoked suspicious sessions', {
        revokedCount: result.revokedCount,
        affectedUsers: result.affectedUsers,
      });
      
      alert(`Successfully revoked ${result.revokedCount} suspicious sessions affecting ${result.affectedUsers} users`);
      await onRefresh();
    } else {
      throw new Error(result.message || 'Failed to revoke sessions');
    }
  } catch (error) {
    clientLog.error('Admin Sessions: Failed to bulk revoke', { error });
    alert('Failed to revoke suspicious sessions. Please try again.');
  } finally {
    setRefreshing(false);
  }
}

// ==================== Action Bar Component ====================

function ActionBar({
  searchQuery,
  setSearchQuery,
  filterRole,
  setFilterRole,
  filterRisk,
  setFilterRisk,
  sortBy,
  setSortBy,
  refreshing,
  onRefresh,
  onExport,
  onBulkRevoke,
  suspiciousCount,
}: {
  searchQuery: string;
  setSearchQuery: (_q: string) => void; // eslint-disable-line no-unused-vars
  filterRole: string;
  setFilterRole: (_r: string) => void; // eslint-disable-line no-unused-vars
  filterRisk: string;
  setFilterRisk: (_r: string) => void; // eslint-disable-line no-unused-vars
  sortBy: SortBy;
  setSortBy: (_s: SortBy) => void; // eslint-disable-line no-unused-vars
  refreshing: boolean;
  onRefresh: () => void;
  onExport: () => void;
  onBulkRevoke: () => void;
  suspiciousCount: number;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex items-center gap-3 flex-1 w-full lg:w-auto">
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            <Filters 
              filterRole={filterRole} 
              setFilterRole={setFilterRole}
              filterRisk={filterRisk}
              setFilterRisk={setFilterRisk}
            />
          </div>
          <ActionButtons
            refreshing={refreshing}
            suspiciousCount={suspiciousCount}
            onRefresh={onRefresh}
            onExport={onExport}
            onBulkRevoke={onBulkRevoke}
          />
        </div>
        <SortButtons sortBy={sortBy} setSortBy={setSortBy} />
      </CardContent>
    </Card>
  );
}

// ==================== Main Component ====================

export function AdminSessionsClient({
  initialUsers,
  totalActiveSessions: initialActive,
  suspiciousSessions: initialSuspicious,
  uniqueActiveUsers: initialUnique,
}: AdminSessionsClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('risk');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const [stats, setStats] = useState<SessionStats>({
    activeSessions: initialActive,
    suspiciousSessions: initialSuspicious,
    activeUsers: initialUnique,
  });

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/admin/sessions/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch session stats');
      }
      
      const data = await response.json();
      
      setUsers(data.users);
      setStats(data.stats);
      
      clientLog.info('Admin Sessions: Data refreshed', {
        userCount: data.users.length,
        activeSessions: data.stats.activeSessions,
      });
    } catch (error) {
      clientLog.error('Admin Sessions: Failed to refresh', { error });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const filtered = filterUsers(users, searchQuery, filterRole, filterRisk);
  const filteredUsers = sortUsers(filtered, sortBy);

  const handleBulkRevoke = () => bulkRevokeSuspicious(refreshData, setRefreshing);
  const handleExport = () => exportToCSV(filteredUsers);

  return (
    <div className="space-y-6">
      <KeyMetrics stats={stats} />
      
      <ActionBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterRole={filterRole}
        setFilterRole={setFilterRole}
        filterRisk={filterRisk}
        setFilterRisk={setFilterRisk}
        sortBy={sortBy}
        setSortBy={setSortBy}
        refreshing={refreshing}
        onRefresh={refreshData}
        onExport={handleExport}
        onBulkRevoke={handleBulkRevoke}
        suspiciousCount={stats.suspiciousSessions}
      />

      <UsersTable
        filteredUsers={filteredUsers}
        totalUsers={users.length}
        onViewSessions={setSelectedUserId}
      />

      <SessionsSummary stats={stats} />

      <ViewSessionsModal
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
}
