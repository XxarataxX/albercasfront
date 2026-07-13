import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// const API_BASE_URL = 'http://192.168.80.130:3000/api';

export default function PoolScreen() {
  const { poolId } = useParams();
  const [pool, setPool] = useState(null);
  const [instructors, setInstructors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const tipos = [
    { l: "P", c: "bg-purple-100 text-purple-700", t: "Clase privada" },
    { l: "C", c: "bg-amber-100 text-amber-700", t: "Clase suelta" },
    { l: "R", c: "bg-indigo-100 text-indigo-700", t: "Reposición" },
    { l: "F", c: "bg-blue-100 text-blue-700", t: "Clase fija" },
  ];

  const slotStatuses = {
    disponible: { icon: 'check_circle', color: 'text-green-500', label: 'Disponible' },
    reservado: { icon: 'schedule', color: 'text-yellow-500', label: 'Reservado' },
    confirmado: { icon: 'check_circle', color: 'text-blue-500', label: 'Confirmado' },
    no_vino: { icon: 'cancel', color: 'text-red-500', label: 'No vino' },
    cancelado: { icon: 'cancel', color: 'text-gray-500', label: 'Cancelado' },
  };

  useEffect(() => {
    fetchPoolData();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchPoolData, 30000);
    return () => clearInterval(interval);
  }, [poolId]);

  const fetchPoolData = async () => {
    try {
      setLoading(true);
      
      // Obtener información de la alberca
      const poolRes = await axios.get(`${API_BASE_URL}/pools/${poolId}`);
      setPool(poolRes.data);
      
      // Obtener instructores de esta alberca
      const instructorsRes = await axios.get(`${API_BASE_URL}/instructors`, {
        params: { poolId, activo: 'true' }
      });
      setInstructors(instructorsRes.data);
      
      // Obtener slots para hoy
      const today = new Date().toLocaleDateString('en-CA').split('T')[0];
      const slotsPromises = instructorsRes.data.map(instructor => 
        axios.get(`${API_BASE_URL}/instructors/${instructor.id}/slots`, {
          params: { fecha: today }
        })
      );
      
      const slotsResponses = await Promise.all(slotsPromises);
      const allSlots = slotsResponses.flatMap(res => res.data);
      setSlots(allSlots);
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showAlert('Error al cargar datos de la alberca');
    } finally {
      setLoading(false);
    }
  };

  const getInstructorSlots = (instructorId) => {
    return slots.filter(slot => slot.instructorId === instructorId);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getSlotForTime = (instructorId, timeIndex) => {
    const instructorSlots = getInstructorSlots(instructorId);
    // Aquí deberías implementar la lógica para mapear slots a tiempos específicos
    // Por ahora, retornamos un slot basado en el índice como ejemplo
    return instructorSlots[timeIndex % instructorSlots.length];
  };

  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  if (loading) {
    return (
      <div className="bg-slate-50 text-slate-800 h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-lg">Cargando pantalla de alberca...</p>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="bg-slate-50 text-slate-800 h-screen flex flex-col items-center justify-center">
        <p className="text-xl text-red-500">Alberca no encontrada</p>
        <a href="/" className="mt-4 text-blue-500 hover:underline">Volver al dashboard</a>
      </div>
    );
  }

  return (
    <>
      <script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
      />

      <div className="bg-slate-50 text-slate-800 h-screen flex flex-col font-[Inter]">

        {/* HEADER */}
        <header className="bg-white border-b shadow-sm p-4">
          <div className="flex justify-between items-center max-w-[1920px] mx-auto">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                A{poolId}
              </div>
              <div className="text-sm text-slate-500">
                {currentDate.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrevDay}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Día anterior"
                >
                  <span className="material-icons">chevron_left</span>
                </button>
                <button 
                  onClick={handleToday}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                >
                  Hoy
                </button>
                <button 
                  onClick={handleNextDay}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Día siguiente"
                >
                  <span className="material-icons">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-4 text-xs text-slate-600">
                {tipos.map((x) => (
                  <div key={x.l} className="flex items-center gap-1">
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${x.c}`}
                    >
                      {x.l}
                    </span>
                    <span>{x.t}</span>
                  </div>
                ))}
              </div>

              <div className="text-blue-600 font-extrabold text-3xl tracking-wide">
                {pool.nombre}
              </div>

            </div>
          </div>
        </header>

        {/* TABLA */}
        <main className="flex-1 overflow-auto p-4">
          <div className="min-w-[1200px] mx-auto bg-white rounded-xl shadow border overflow-hidden">
            {/* ENCABEZADOS */}
            <div className="grid grid-cols-[90px_repeat(5,1fr)] border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-center border-r text-slate-400">
                <span className="material-icons-round">schedule</span>
              </div>

              {instructors.map((instructor) => (
                <div key={instructor.id} className="p-3 text-center border-r last:border-r-0">
                  <div className="font-bold text-lg">{instructor.nombre}</div>
                  <div className="text-xs text-slate-400">
                    Instructor
                  </div>
                </div>
              ))}
            </div>

            {/* FILAS - Ejemplo con horarios fijos */}
            {Array.from({ length: 12 }).map((_, timeIndex) => {
              const hour = 6 + Math.floor(timeIndex / 2);
              const minute = timeIndex % 2 === 0 ? '00' : '30';
              const timeString = `${hour.toString().padStart(2, '0')}:${minute}`;
              
              return (
                <div key={timeIndex} className="grid grid-cols-[90px_repeat(5,1fr)] border-b hover:bg-slate-50">
                  <div className="flex items-center justify-center font-mono text-slate-500 bg-slate-50 border-r">
                    {timeString}
                  </div>

                  {instructors.map((instructor) => {
                    const slot = getSlotForTime(instructor.id, timeIndex);
                    
                    return (
                      <div
                        key={instructor.id}
                        className="border-r last:border-r-0 text-sm px-3 py-4 flex items-center"
                      >
                        {slot ? (
                          <div className="flex items-center w-full">
                            <div className="flex-1">
                              <span className="font-semibold text-base truncate">
                                {slot.student?.nombre || 'Disponible'}
                              </span>
                              {slot.notas && (
                                <div className="text-xs text-gray-500 truncate">
                                  {slot.notas}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 ml-auto">
                              {slot.classType && (
                                <span
                                  className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${
                                    tipos.find(t => t.l === slot.classType)?.c || 'bg-gray-100 text-gray-700'
                                  }`}
                                  title={tipos.find(t => t.l === slot.classType)?.t || slot.classType}
                                >
                                  {slot.classType}
                                </span>
                              )}

                              {slot.status && slotStatuses[slot.status] && (
                                <span
                                  className={`material-icons-round text-[22px] ${slotStatuses[slot.status].color}`}
                                  title={slotStatuses[slot.status].label}
                                >
                                  {slotStatuses[slot.status].icon}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-full">
                            <img
                              src="/ola.png"
                              alt="Disponible"
                              className="h-12 opacity-70"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </main>

        {/* FOOTER */}
        <footer className="bg-white border-t p-3 text-center text-sm text-slate-500">
          <div className="max-w-[1920px] mx-auto">
            Sistema de Natación - Pantalla en tiempo real • {pool.nombre} • 
            Actualizado: {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} • 
            <button 
              onClick={fetchPoolData}
              className="ml-2 text-blue-500 hover:text-blue-700 flex items-center gap-1"
            >
              <span className="material-icons text-sm">refresh</span>
              Actualizar
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}