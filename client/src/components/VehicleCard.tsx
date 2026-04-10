import { Vehicle } from '../types';

interface VehicleCardProps {
  vehicle: Vehicle;
  selected: boolean;
  onSelect: () => void;
}

export default function VehicleCard({ vehicle, selected, onSelect }: VehicleCardProps) {
  const getFuelIcon = () => {
    if (vehicle.fuel_type === '纯电动') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
    );
  };

  const isRedFlag = vehicle.description && vehicle.description.includes('限领导使用');

  return (
    <div
      onClick={onSelect}
      className={`
        cursor-pointer rounded-xl p-5 transition-all duration-200
        ${selected 
          ? 'bg-blue-50 border-2 border-primary-500 shadow-md' 
          : 'bg-white border-2 border-slate-200 hover:border-primary-300 hover:shadow-md'
        }
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`
            px-2 py-1 rounded text-xs font-medium
            ${vehicle.fuel_type === '纯电动' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-amber-100 text-amber-700'
            }
          `}>
            {vehicle.fuel_type}
          </span>
          {isRedFlag && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
              领导专用
            </span>
          )}
        </div>
        {getFuelIcon()}
      </div>
      
      <h3 className="text-lg font-semibold text-slate-800 mb-1">{vehicle.name}</h3>
      <p className="text-2xl font-bold text-primary-700 mb-2">{vehicle.plate_number}</p>
      <p className="text-sm text-slate-500 mb-2">{vehicle.type}</p>
      
      {vehicle.description && (
        <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded mt-2">
          {vehicle.description}
        </p>
      )}
    </div>
  );
}
