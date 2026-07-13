import { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { instructorService, slotService } from '../services/api';

// Importar CRUDs
import PoolsCRUD from '../components/cruds/PoolsCRUD';
import InstructorsCRUD from '../components/cruds/InstructorsCRUD';
import StudentsCRUD from '../components/cruds/StudentsCRUD';
import TimeBlocksCRUD from '../components/cruds/TimeBlocksCRUD';
import RecurringSlotsCRUD from '../components/cruds/RecurringSlotsCRUD';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('pools');
  const [stats, setStats] = useState({
    loading: true,
    totalInstructors: 0,
    activeInstructors: 0,
    todaySlots: 0,
    todayConfirmed: 0
  });

  const tables = [
    { id: 'pools', name: 'Albercas', icon: '🏊', description: 'Administración de piscinas' },
    { id: 'instructors', name: 'Instructores', icon: '👨‍🏫', description: 'Gestión de maestros' },
    { id: 'students', name: 'Estudiantes', icon: '👨‍🎓', description: 'Administración de alumnos' },
    { id: 'timeblocks', name: 'Bloques Horarios', icon: '⏱️', description: 'Configuración de horarios' },
    { id: 'slots', name: 'Horarios', icon: '🕒', description: 'Crear slots recurrentes' },
  ];

  // Cargar estadísticas
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));
      
      const today = new Date().toLocaleDateString('en-CA').split('T')[0];
      
      // Hacer peticiones en paralelo
      const [instructorsRes, slotsRes] = await Promise.all([
        instructorService.getAll(),
        slotService.getAll({ fecha: today })
      ]);
      
      // Procesar datos
      const totalInstructors = instructorsRes.data.length;
      const activeInstructors = instructorsRes.data.filter(i => i.activo).length;
      const todaySlots = slotsRes.data.length;
      const todayConfirmed = slotsRes.data.filter(s => s.status === 'confirmado').length;
      
      setStats({
        loading: false,
        totalInstructors,
        activeInstructors,
        todaySlots,
        todayConfirmed
      });
      
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const renderCRUD = () => {
    switch (activeTab) {
      case 'pools': return <PoolsCRUD />;
      case 'instructors': return <InstructorsCRUD />;
      case 'students': return <StudentsCRUD />;
      case 'timeblocks': return <TimeBlocksCRUD />;
      case 'slots': return <RecurringSlotsCRUD />;
      default: return <InstructorsCRUD />;
    }
  };

  const activeTable = tables.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar 
          tables={tables} 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-3xl">{activeTable?.icon}</span>
              {activeTable?.name}
            </h1>
            <p className="text-gray-600">{activeTable?.description}</p>
          </div>

          {/* Solo 2 cuadros de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Total Instructores */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Total Instructores</h3>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="material-icons text-blue-600">people</span>
                </div>
              </div>
              {stats.loading ? (
                <div className="h-12 flex items-center">
                  <div className="animate-pulse bg-gray-200 h-10 w-24 rounded"></div>
                </div>
              ) : (
                <>
                  <p className="text-4xl font-bold text-blue-600">{stats.totalInstructors}</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Activos</span>
                      <span className="font-medium text-green-600">{stats.activeInstructors}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${stats.totalInstructors > 0 ? 
                            (stats.activeInstructors / stats.totalInstructors) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {stats.totalInstructors - stats.activeInstructors} instructores inactivos
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Clases Hoy */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Clases Hoy</h3>
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <span className="material-icons text-emerald-600">calendar_today</span>
                </div>
              </div>
              {stats.loading ? (
                <div className="h-12 flex items-center">
                  <div className="animate-pulse bg-gray-200 h-10 w-24 rounded"></div>
                </div>
              ) : (
                <>
                  <p className="text-4xl font-bold text-emerald-600">{stats.todaySlots}</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Confirmadas</span>
                      <span className="font-medium text-blue-600">{stats.todayConfirmed}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${stats.todaySlots > 0 ? 
                            (stats.todayConfirmed / stats.todaySlots) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {stats.todaySlots - stats.todayConfirmed} clases pendientes de confirmar
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CRUD Componente */}
          {renderCRUD()}
        </main>
      </div>
    </div>
  );
}