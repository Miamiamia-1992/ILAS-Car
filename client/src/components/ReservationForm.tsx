import { useState } from 'react';
import { Vehicle } from '../types';
import { api } from '../services/api';

interface ReservationFormProps {
  vehicle: Vehicle;
  date: string;
  startTime: string;
  endTime: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ReservationForm({ vehicle, date, startTime, endTime, onSuccess, onCancel }: ReservationFormProps) {
  const [formData, setFormData] = useState({
    personName: '',
    phone: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.personName.trim() || !formData.phone.trim() || !formData.reason.trim()) {
      setError('请填写完整信息');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await api.reservations.create({
        vehicleId: vehicle.id,
        date,
        startTime,
        endTime,
        personName: formData.personName.trim(),
        phone: formData.phone.trim(),
        reason: formData.reason.trim()
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('预约失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-green-700">预约提交成功</h3>
            <p className="text-sm text-green-600">您的预约请求已提交，等待管理员审批</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">填写预约信息</h2>
      
      <div className="mb-6 p-4 bg-slate-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">车辆：</span>
            <span className="font-medium text-slate-800">{vehicle.name}</span>
          </div>
          <div>
            <span className="text-slate-500">车牌：</span>
            <span className="font-medium text-slate-800">{vehicle.plate_number}</span>
          </div>
          <div>
            <span className="text-slate-500">日期：</span>
            <span className="font-medium text-slate-800">{date}</span>
          </div>
          <div>
            <span className="text-slate-500">时间：</span>
            <span className="font-medium text-slate-800">{startTime} - {endTime}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            姓名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.personName}
            onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            placeholder="请输入您的姓名"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            电话 <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            placeholder="请输入您的联系电话"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            预约原因 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
            rows={3}
            placeholder="请简要说明预约原因"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '提交中...' : '提交预约'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
