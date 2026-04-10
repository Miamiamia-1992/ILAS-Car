import { useState, useEffect } from 'react';
import { Vehicle, Reservation } from './types';
import { api } from './services/api';
import VehicleCard from './components/VehicleCard';
import Calendar from './components/Calendar';
import TimeSlots from './components/TimeSlots';
import ReservationForm from './components/ReservationForm';
import ReservationList from './components/ReservationList';
import AdminModal from './components/AdminModal';
import AdminPanel from './components/AdminPanel';

function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedStart, setSelectedStart] = useState<string>('');
  const [selectedEnd, setSelectedEnd] = useState<string>('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      setAdminToken(savedToken);
    }
  }, []);

  const loadData = async () => {
    const [vehiclesData, reservationsData] = await Promise.all([
      api.vehicles.getAll(),
      api.reservations.getAll()
    ]);
    setVehicles(vehiclesData);
    setReservations(reservationsData);
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setSelectedDate('');
    setSelectedStart('');
    setSelectedEnd('');
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedStart('');
    setSelectedEnd('');
  };

  const handleTimeSelect = (time: string) => {
    if (!selectedStart) {
      setSelectedStart(time);
      setSelectedEnd(time);
    } else if (time === selectedStart) {
      setSelectedStart('');
      setSelectedEnd('');
    } else {
      setSelectedEnd(time);
    }
  };

  const handleReservationSuccess = () => {
    setSelectedStart('');
    setSelectedEnd('');
    loadData();
  };

  const handleLoginSuccess = (token: string) => {
    setAdminToken(token);
    localStorage.setItem('adminToken', token);
    setShowAdminLogin(false);
    setShowAdminPanel(true);
  };

  const handleLogout = () => {
    setAdminToken(null);
    localStorage.removeItem('adminToken');
    setShowAdminPanel(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-primary-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <h1 className="text-xl font-semibold">ILAS 车辆预约系统</h1>
          </div>
          {adminToken && !showAdminPanel && (
            <button
              onClick={() => setShowAdminPanel(true)}
              className="px-4 py-2 bg-primary-700 hover:bg-primary-600 rounded-lg transition-colors"
            >
              管理面板
            </button>
          )}
          {!adminToken && (
            <button
              onClick={() => setShowAdminLogin(true)}
              className="px-4 py-2 bg-primary-700 hover:bg-primary-600 rounded-lg transition-colors"
            >
              管理员登录
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">选择车辆</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map(vehicle => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                selected={selectedVehicle?.id === vehicle.id}
                onSelect={() => handleVehicleSelect(vehicle)}
              />
            ))}
          </div>
        </section>

        {selectedVehicle && (
          <section className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">选择日期</h2>
                <Calendar
                  vehicleId={selectedVehicle.id}
                  reservations={reservations.filter(r => r.vehicle_id === selectedVehicle.id)}
                  selectedDate={selectedDate}
                  onSelectDate={handleDateSelect}
                />
              </div>

              {selectedDate && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-slate-800 mb-4">
                    选择时间 - {selectedDate}
                  </h2>
                  <TimeSlots
                    reservations={reservations.filter(
                      r => r.vehicle_id === selectedVehicle.id && r.date === selectedDate
                    )}
                    selectedStart={selectedStart}
                    selectedEnd={selectedEnd}
                    onSelectTime={handleTimeSelect}
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {selectedVehicle && selectedStart && selectedEnd && (
          <section className="mb-8">
            <ReservationForm
              vehicle={selectedVehicle}
              date={selectedDate}
              startTime={selectedStart}
              endTime={selectedEnd}
              onSuccess={handleReservationSuccess}
              onCancel={() => {
                setSelectedStart('');
                setSelectedEnd('');
              }}
            />
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">预约记录</h2>
          <ReservationList 
            reservations={reservations} 
            vehicles={vehicles}
            isAdmin={!!adminToken}
            adminToken={adminToken}
            onUpdate={loadData}
          />
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-slate-500 text-sm">
          ILAS 车辆预约系统
        </div>
      </footer>

      {showAdminLogin && (
        <AdminModal
          onClose={() => setShowAdminLogin(false)}
          onLogin={handleLoginSuccess}
        />
      )}

      {showAdminPanel && adminToken && (
        <AdminPanel
          token={adminToken}
          vehicles={vehicles}
          onClose={() => setShowAdminPanel(false)}
          onLogout={handleLogout}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}

export default App;
