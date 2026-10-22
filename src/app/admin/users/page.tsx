'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import {
  Users,
  Search,
  Download,
  Calendar,
  Ticket,
  Mail,
  Shield,
  Loader2,
  ArrowLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';

export default function AdminUsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) router.push('/admin/login');
        return res.json();
      })
      .then((data) => {
        if (!data.authenticated || data.user.role !== 'admin') {
          router.push('/admin/login');
        } else {
          setCurrentUser(data.user);
          loadUsers();
        }
      })
      .catch(() => router.push('/admin/login'));
  }, [router]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportUsers = () => {
    window.open('/api/admin/export?type=users', '_blank');
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (userId === currentUser?.id) {
      alert('You cannot delete your own active administrator account.');
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete user "${email}" and all their tickets? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch {
      alert('Network error while deleting user');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#060a12] text-white flex flex-col font-sans">
      <Navbar user={currentUser} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Command Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <Users className="w-7 h-7 text-sky-400" />
              <span>Registered Users Directory</span>
            </h1>
          </div>

          <button
            onClick={handleExportUsers}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Export Users (.xlsx)</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, or user ID..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
          />
        </div>

        {/* Users Table (Desktop) / DataCards (Mobile) */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">User / Email</th>
                    <th className="py-3.5 px-4 font-semibold">Role</th>
                    <th className="py-3.5 px-4 font-semibold">Tickets</th>
                    <th className="py-3.5 px-4 font-semibold">Signed Up</th>
                    <th className="py-3.5 px-4 font-semibold">Last Login</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-sans font-bold text-white text-sm">
                          {u.full_name || 'Anonymous User'}
                        </div>
                        <div className="text-slate-400 text-xs flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            u.role === 'admin'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-amber-400 text-sm">
                          {u.ticket_count}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        {formatDate(u.created_at)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        {formatDate(u.last_login_at)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <Link
                            href={`/admin/tickets?userId=${u.id}`}
                            className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 transition font-mono text-xs"
                          >
                            <span>View Tickets</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                          {u.id !== currentUser?.id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500 hover:text-white text-slate-400 transition cursor-pointer"
                              title="Delete user account and all tickets"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile DataCards Pattern */}
            <div className="md:hidden space-y-3">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        {u.full_name || 'Anonymous User'}
                      </h4>
                      <p className="text-xs font-mono text-slate-400">{u.email}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                        u.role === 'admin'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-mono border-y border-slate-800 py-2">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Tickets</span>
                      <span className="font-bold text-amber-400">{u.ticket_count}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Joined</span>
                      <span className="text-slate-300">{formatDate(u.created_at)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Login</span>
                      <span className="text-slate-300">{formatDate(u.last_login_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/tickets?userId=${u.id}`}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <span>Inspect User's Tickets</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    {u.id !== currentUser?.id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        className="p-2 rounded-xl bg-red-950/60 border border-red-500/30 text-red-400 hover:bg-red-900 transition cursor-pointer"
                        title="Delete user account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
