import { useState } from 'react';
import { Reservation, Vehicle } from '../types';
import { api } from '../services/api';

interface ReservationListProps {
  reservations: Reservation[];
  vehicles: Vehicle[];
  isAdmin: boolean;
  adminToken: string | null;
  onUpdate: () => void;
}

export default function ReservationList({ reservations, vehicles, isAdmin, adminToken, onUpdate }: ReservationListProps) {
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [vehicleFilter, setVehicleFilter] = useState<number | 'all'>('all');

  const filteredReservations = reservations.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (vehicleFilter !== 'all' && r.vehicle_id !== vehicleFilter) return false;
    return true;
  });

  const handleStatusChange = async (id: number, status: string) => {
    if (!adminToken) return;
    await api.reservations.updateStatus(id, status, adminToken);
    onUpdate();
  };

  const handleDelete = async (id: number) => {
    if (!adminToken) return;
    if (!confirm('确定要删除这条预约记录吗？')) return;
    await api.reservations.delete(id, adminToken);
    onUpdate();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { bg: 'bg-green-100', text: 'text-green-700', label: '已批准' };
      case 'pending':
        return { bg: 'bg-amber-100', text: 'text-amber-700', label: '待审批' };
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-700', label: '已拒绝' };
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-700', label: '未知' };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-semibold text-slate-800">预约记录</h2>
        
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="all">全部车辆</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.plate_number}</option>
            ))}
          </select>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="all">全部状态</option>
            <option value="approved">已批准</option>
            <option value="pending">待审批</option>
            <option value="rejected">已拒绝</option>
          </select>
        </div>
      </div>

      {filteredReservations.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>暂无预约记录</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">日期</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">车辆</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">时间</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">申请人</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">原因</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">状态</th>
                {isAdmin && <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">操作</th>}
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map(r => {
                const statusBadge = getStatusBadge(r.status);
                return (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-800">{formatDate(r.date)}</td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-slate-800">{r.plate_number}</div>
                      <div className="text-xs text-slate-500">{r.vehicle_name}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-800">
                      {r.start_time} - {r.end_time}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-slate-800">{r.person_name}</div>
                      <div className="text-xs text-slate-500">{r.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 max-w-xs truncate" title={r.reason}>
                      {r.reason}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {r.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(r.id, 'approved')}
                                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                              >
                                批准
                              </button>
                              <button
                                onClick={() => handleStatusChange(r.id, 'rejected')}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                              >
                                拒绝
                              </button>
                            </>
                          )}
                          {r.status === 'approved' && (
                            <button
                              onClick={() => handleStatusChange(r.id, 'pending')}
                              className="px-2 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
                            >
                              撤回
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="px-2 py-1 text-xs bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
