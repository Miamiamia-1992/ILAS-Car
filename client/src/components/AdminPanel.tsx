import { useState, useEffect } from 'react';
import { Vehicle, UnavailableDate, Reservation } from '../types';
import { api } from '../services/api';

interface AdminPanelProps {
  token: string;
  vehicles: Vehicle[];
  onClose: () => void;
  onLogout: () => void;
  onUpdate: () => void;
}

export default function AdminPanel({ token, vehicles, onClose, onLogout, onUpdate }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'reservations' | 'unavailable'>('reservations');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [resData, unavailData] = await Promise.all([
      api.reservations.getAll(),
      api.unavailable.getAll(token)
    ]);
    setReservations(resData);
    setUnavailableDates(unavailData);
  };

  const handleStatusChange = async (id: number, status: string) => {
    await api.reservations.updateStatus(id, status, token);
    loadData();
    onUpdate();
  };

  const handleDeleteReservation = async (id: number) => {
    if (!confirm('确定要删除这条预约记录吗？')) return;
    await api.reservations.delete(id, token);
    loadData();
    onUpdate();
  };

  const handleAddUnavailable = async () => {
    if (!selectedVehicle || !selectedDate) {
      setMessage({ type: 'error', text: '请选择车辆和日期' });
      return;
    }

    setLoading(true);
    try {
      const result = await api.unavailable.create(
        { vehicleId: selectedVehicle, date: selectedDate, reason },
        token
      );
      if (result.success) {
        setMessage({ type: 'success', text: '设置成功' });
        setSelectedVehicle(0);
        setSelectedDate('');
        setReason('');
        loadData();
      } else {
        setMessage({ type: 'error', text: '设置失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '设置失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUnavailable = async (id: number) => {
    if (!confirm('确定要取消该日期的限制吗？')) return;
    await api.unavailable.delete(id, token);
    loadData();
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4">
        <div className="bg-primary-800 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-lg font-semibold">管理面板</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-primary-700 hover:bg-primary-600 rounded-lg transition-colors text-sm"
            >
              退出登录
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-primary-700 rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="border-b border-slate-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('reservations')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'reservations'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              预约管理
            </button>
            <button
              onClick={() => setActiveTab('unavailable')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'unavailable'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              车辆禁用管理
            </button>
          </div>
        </div>

        <div className="p-6">
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-600 border border-green-200'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {activeTab === 'reservations' && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">预约记录管理</h3>
              {reservations.length === 0 ? (
                <p className="text-slate-500 text-center py-8">暂无预约记录</p>
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
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map(r => {
                        const statusBadge = getStatusBadge(r.status);
                        return (
                          <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-sm text-slate-800">{r.date}</td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-slate-800">{r.plate_number}</div>
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
                                  onClick={() => handleDeleteReservation(r.id)}
                                  className="px-2 py-1 text-xs bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors"
                                >
                                  删除
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'unavailable' && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">设置车辆不可用日期</h3>
              
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">选择车辆</label>
                    <select
                      value={selectedVehicle}
                      onChange={(e) => setSelectedVehicle(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    >
                      <option value={0}>请选择车辆</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.name} - {v.plate_number}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">选择日期</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">原因（可选）</label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="如：维修、保养等"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddUnavailable}
                  disabled={loading || !selectedVehicle || !selectedDate}
                  className="mt-4 px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '设置中...' : '设置不可用'}
                </button>
              </div>

              <h4 className="text-md font-medium text-slate-700 mb-3">已设置的不可用日期</h4>
              {unavailableDates.length === 0 ? (
                <p className="text-slate-500 text-center py-8">暂无设置的不可用日期</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">车辆</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">日期</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">原因</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unavailableDates.map(d => (
                        <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-sm text-slate-800">
                            {d.vehicle_name} - {d.plate_number}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-800">{d.date}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{d.reason || '-'}</td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleRemoveUnavailable(d.id)}
                              className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                              取消限制
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
