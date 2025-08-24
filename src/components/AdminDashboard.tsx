import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, MessageSquare, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface Complaint {
  id: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'pending' | 'resolved';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  admin_reply?: string;
  replied_at?: string;
  replied_by?: string;
}

interface Statistics {
  total_users: number;
  total_complaints: number;
  pending_complaints: number;
  resolved_complaints: number;
}

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total_users: 0,
    total_complaints: 0,
    pending_complaints: 0,
    resolved_complaints: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [reply, setReply] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch complaints
      const { data: complaintsData, error: complaintsError } = await supabase
        .from('admin_complaints_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (complaintsError) throw complaintsError;

      // Fetch statistics
      const { data: statsData, error: statsError } = await supabase
        .from('user_statistics')
        .select('*')
        .single();

      if (statsError) throw statsError;

      setComplaints(complaintsData || []);
      setStatistics(statsData || {
        total_users: 0,
        total_complaints: 0,
        pending_complaints: 0,
        resolved_complaints: 0
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (complaintId: string) => {
    if (!reply.trim()) return;

    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          admin_reply: reply,
          status: 'resolved',
          replied_at: new Date().toISOString(),
          replied_by: 'admin' // This should be the actual admin ID
        })
        .eq('id', complaintId);

      if (error) throw error;

      setReply('');
      setSelectedComplaint(null);
      fetchData();
    } catch (error) {
      console.error('Error replying to complaint:', error);
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    if (filter === 'all') return true;
    return complaint.status === filter;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'normal': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_users}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Complaints</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_complaints}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.pending_complaints}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.resolved_complaints}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex space-x-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === 'all'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All Complaints
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('resolved')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === 'resolved'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Resolved
              </button>
            </div>
          </div>
        </div>

        {/* Complaints List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Complaints</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredComplaints.map((complaint) => (
              <div key={complaint.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        complaint.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {complaint.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{complaint.subject}</h3>
                    <p className="text-gray-600 mb-2">{complaint.message}</p>
                    <div className="text-sm text-gray-500">
                      <p>From: {complaint.email} | {complaint.phone}</p>
                      <p>Created: {new Date(complaint.created_at).toLocaleString()}</p>
                    </div>
                    {complaint.admin_reply && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">Admin Reply:</p>
                        <p className="text-blue-800">{complaint.admin_reply}</p>
                        <p className="text-xs text-blue-600 mt-2">
                          Replied: {complaint.replied_at ? new Date(complaint.replied_at).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>
                  {complaint.status === 'pending' && (
                    <button
                      onClick={() => setSelectedComplaint(complaint)}
                      className="ml-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
                    >
                      Reply
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reply Modal */}
        {selectedComplaint && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Reply to: {selectedComplaint.subject}
                </h3>
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{selectedComplaint.message}</p>
                </div>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply here..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => {
                      setSelectedComplaint(null);
                      setReply('');
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReply(selectedComplaint.id)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Send Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}