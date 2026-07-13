import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function PoolScreenView() {
  const { poolId } = useParams();
  const [hora, setHora] = useState('');
  const [pool, setPool] = useState(null);
  const [instructors, setInstructors] = useState([]);
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showCurrentTimeOnly, setShowCurrentTimeOnly] = useState(false);
  const [currentTurn, setCurrentTurn] = useState('matutino1');
  const tableRef = useRef(null);
  const [rowHeight, setRowHeight] = useState('small');

  const rowHeightClasses = {
    small: 'min-h-[60px] md:min-h-[70px]',
    medium: 'min-h-[80px] md:min-h-[100px]',
    large: 'min-h-[100px] md:min-h-[130px]'
  };

  const turnConfig = {
    matutino1: { start: 8, end: 11.5 },   // 8:00 AM a 11:30 AM
    matutino2: { start: 11.5, end: 15 },  // 11:30 AM a 3:00 PM
    vespertino1: { start: 15, end: 17.5 }, // 3:00 PM a 5:30 PM
    vespertino2: { start: 17.5, end: 20 }  // 5:30 PM a 8:00 PM
  };

  // Configuración de anchos según cantidad de instructores
  const getGridTemplateColumns = () => {
    const instructorCount = instructors.length;
    let columnWidth = '1fr';
    
    // Ajustar ancho según cantidad de instructores
    if (instructorCount <= 3) {
      columnWidth = 'minmax(200px, 1fr)';
    } else if (instructorCount <= 5) {
      columnWidth = 'minmax(150px, 1fr)';
    } else if (instructorCount <= 7) {
      columnWidth = 'minmax(120px, 1fr)';
    } else {
      columnWidth = 'minmax(100px, 1fr)';
    }
    
    return `100px repeat(${instructorCount}, ${columnWidth})`;
  };

  useEffect(() => {
    const actualizarHora = () => {
      const ahora = new Date();
      const horaFormateada = ahora.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      setHora(horaFormateada);
    };
    
    actualizarHora();
    const intervalo = setInterval(actualizarHora, 60000);
    
    return () => clearInterval(intervalo);
  }, []);

  // Definir tipos de clase para mostrar letra en esquina
  const tiposClase = {
    "P": { letra: "P", color: "bg-purple-500 text-white", nombre: "Clase Prueba" },
    "C": { letra: "C", color: "bg-yellow-500 text-white", nombre: "Clase suelta" },
    "R": { letra: "R", color: "bg-red-500 text-white", nombre: "Reposición" },
    "F": { letra: "F", color: "bg-blue-500 text-white", nombre: "Clase fija" },
  };

  // Función para obtener la información del tipo de clase
  const getTipoClaseInfo = (slot) => {

     console.log("i" + slot)
    if (!slot || !slot.ClassType) {
      return null;
    }

     console.log("e" + slot.ClassType);
    const tipoClase = slot.ClassType.toUpperCase();
    return tiposClase[tipoClase] || null;
  };

  // Definir colores según STATUS de la clase
  const slotStatusColors = {
    disponible: { 
      bg: 'bg-green-100', 
      border: 'border-green-200',
      text: 'text-green-700',
      icon: 'check_circle',
      label: '' 
    },
    reservado: { 
      bg: 'bg-yellow-100', 
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      icon: 'schedule',
      label: '' 
    },
    confirmado: { 
      bg: 'bg-green-100', 
      border: 'border-green-200',
      text: 'text-green-700',
      icon: 'check_circle',
      label: '' 
    },
    no_vino: { 
      bg: 'bg-red-100', 
      border: 'border-red-200',
      text: 'text-red-700',
      icon: 'cancel',
      label: '' 
    },
    cancelado: { 
      bg: 'bg-gray-100', 
      border: 'border-gray-200',
      text: 'text-gray-500',
      icon: 'cancel',
      label: '' 
    },
    // Agregar estados por defecto
    pendiente: { 
      bg: 'bg-orange-100', 
      border: 'border-orange-200',
      text: 'text-orange-700',
      icon: 'schedule',
      label: '' 
    },
    // Estado por defecto si no hay status
    default: { 
      bg: 'bg-gray-50', 
      border: 'border-gray-200',
      text: 'text-gray-700',
      icon: 'help',
      label: '' 
    }
  };

  useEffect(() => {
    fetchPoolData();
    updateCurrentTurn();
    
    const dataInterval = setInterval(() => {
      fetchPoolData();
      updateCurrentTurn();
      setLastUpdate(new Date());
    }, 30000);
    
    const viewInterval = setInterval(() => {
      setShowCurrentTimeOnly(prev => !prev);
    }, 30000);
    
    const turnInterval = setInterval(updateCurrentTurn, 60000);
    
    return () => {
      clearInterval(dataInterval);
      clearInterval(viewInterval);
      clearInterval(turnInterval);
    };
  }, [poolId]);

  const updateCurrentTurn = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour + currentMinute / 60; // Convertir a horas decimales
    
    // Determinar turno actual basado en la hora
    let turn = 'matutino1';
    
    if (currentTime >= turnConfig.matutino1.start && currentTime < turnConfig.matutino1.end) {
      turn = 'matutino1';
    } else if (currentTime >= turnConfig.matutino2.start && currentTime < turnConfig.matutino2.end) {
      turn = 'matutino2';
    } else if (currentTime >= turnConfig.vespertino1.start && currentTime < turnConfig.vespertino1.end) {
      turn = 'vespertino1';
    } else if (currentTime >= turnConfig.vespertino2.start && currentTime < turnConfig.vespertino2.end) {
      turn = 'vespertino2';
    } else {
      // Fuera de horario, determinar el turno más cercano
      if (currentTime < turnConfig.matutino1.start) {
        // Antes del primer turno del día
        if (currentTime < 12) {
          turn = 'matutino1';
        } else {
          // Si es después de medianoche pero antes de las 8am, mostrar vespertino2 del día anterior o matutino1
          turn = 'matutino1';
        }
      } else if (currentTime >= turnConfig.vespertino2.end) {
        // Después del último turno, mostrar matutino1 del siguiente día
        turn = 'matutino1';
      }
    }
    
    setCurrentTurn(turn);
  };

  const getTimeBlocksByTurn = (blocks) => {
    return blocks.filter(block => {
      if (!block.horaInicio) return false;
      const [hour, minute] = block.horaInicio.split(':').map(Number);
      const blockTime = hour + minute / 60; // Convertir a horas decimales
      
      const turn = turnConfig[currentTurn];
      return blockTime >= turn.start && blockTime < turn.end;
    });
  };

  const getCurrentTimeBlock = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    const turnTimeBlocks = getTimeBlocksByTurn(timeBlocks);
    
    const sortedTimeBlocks = [...turnTimeBlocks].sort((a, b) => {
      const timeA = a.horaInicio ? a.horaInicio.split(':').map(Number) : [0, 0];
      const timeB = b.horaInicio ? b.horaInicio.split(':').map(Number) : [0, 0];
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });
    
    for (const timeBlock of sortedTimeBlocks) {
      if (timeBlock.horaInicio) {
        const [blockHour, blockMinute] = timeBlock.horaInicio.split(':').map(Number);
        const blockStartTime = blockHour * 60 + blockMinute;
        const blockEndTime = blockStartTime + 30;
        
        if (currentTime >= blockStartTime && currentTime < blockEndTime) {
          return timeBlock;
        }
      }
    }
    
    return null;
  };

  const fetchPoolData = async () => {
    try {
      setLoading(true);
      
      const poolRes = await axios.get(`${API_BASE_URL}/pools/${poolId}`);
      setPool(poolRes.data);
      
      const instructorsRes = await axios.get(`${API_BASE_URL}/instructors`, {
        params: { poolId, activo: 'true' }
      });
      setInstructors(instructorsRes.data);
      
      const timeBlocksRes = await axios.get(`${API_BASE_URL}/timeblocks`);
      setTimeBlocks(timeBlocksRes.data);
      
      const today = new Date().toLocaleDateString('en-CA'); // Formato YYYY-MM-DD
console.log("hoy: " + today);
      const slotsRes = await axios.get(`${API_BASE_URL}/slots/tabla-dia`, {
        params: { fecha: today, poolId }
      });
      
      setSlots(slotsRes.data);
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSlotForInstructorAndTimeBlock = (instructorId, timeBlockId) => {
    return slots.find(slot => 
      slot.instructorId === instructorId && 
      slot.timeBlockId === timeBlockId
    );
  };

  const getTimeBlocksToDisplay = () => {
    if (showCurrentTimeOnly) {
      const currentBlock = getCurrentTimeBlock();
      if (currentBlock) {
        return [currentBlock];
      } else {
        return [];
      }
    }
    return getTimeBlocksByTurn(timeBlocks);
  };

  const getRowClass = (index) => {
    return index % 2 === 0 ? 'bg-white' : 'bg-blue-50';
  };

  const getColumnClass = (index) => {
    return index % 2 === 0 ? 'bg-white' : 'bg-blue-50';
  };

  // Función para obtener el color según el STATUS de la clase
  const getSlotStatusColorClass = (slot) => {
    if (!slot || !slot.status) {
      return slotStatusColors.default;
    }

    const status = slot.status.toLowerCase();
    const statusColor = slotStatusColors[status];
    
    return statusColor || slotStatusColors.default;
  };

  if (loading) {
    return (
      <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-lg">Cargando pantalla de alberca...</p>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl text-red-500">Alberca no encontrada</p>
      </div>
    );
  }

  const today = new Date();
  const timeBlocksToDisplay = getTimeBlocksToDisplay();
  const currentTimeString = today.getHours().toString().padStart(2, '0') + ':' + today.getMinutes().toString().padStart(2, '0');

  const getTurnDisplayName = (turn) => {
    const names = {
      matutino1: 'Matutino 1 (8:00 - 11:30)',
      matutino2: 'Matutino 2 (11:30 - 15:00)',
      vespertino1: 'Vespertino 1 (15:00 - 17:30)',
      vespertino2: 'Vespertino 2 (17:30 - 20:00)'
    };
    return names[turn] || turn;
  };

  const getTurnColorClass = (turn) => {
    const colors = {
      matutino1: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      matutino2: 'bg-amber-100 text-amber-700 border-amber-300',
      vespertino1: 'bg-indigo-100 text-indigo-700 border-indigo-300',
      vespertino2: 'bg-purple-100 text-purple-700 border-purple-300'
    };
    return colors[turn] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

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

      <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col font-[Inter] p-2 md:p-2">
        <header className="bg-white border-b shadow-sm p-3 md:p-2 mb-2 md:mb-2">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="h-10 w-22 md:h-12 md:w-24 rounded-lg overflow-hidden">
                <img 
                  src="/kinderswim.png" 
                  alt="Kinderswim logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-xs md:text-sm text-slate-500">
                HOY • {today.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getTurnColorClass(currentTurn)}`}>
                {getTurnDisplayName(currentTurn)}
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
              <div className={`px-2 py-1 rounded-full text-m font-bold bg-green-100 text-green-700 border border-green-300`}>
                Hora actual: {hora}
              </div>

              <div className="text-blue-600 font-extrabold text-2xl md:text-2xl tracking-wide text-center md:text-right">
                {pool.nombre}
              </div>
            </div>
          </div>
        </header>

        <main className={`flex-1 overflow-hidden max-h-[calc(100vh-140px)] ${showCurrentTimeOnly ? 'flex items-center justify-center' : ''}`}>
          <div 
            ref={tableRef}
            className={`h-full mx-auto bg-white rounded-xl shadow border overflow-hidden flex flex-col ${
              showCurrentTimeOnly ? 'w-full' : 'w-full'
            }`}
          >
            {/* Header de tabla con ancho controlado */}
            <div 
              className="grid border-b sticky top-0 bg-white z-10 flex-shrink-0"
              style={{
                gridTemplateColumns: getGridTemplateColumns()
              }}
            >
              <div className="flex items-center justify-center border-r text-slate-400 p-2 md:p-3">
                <img 
                  src="/reloj.png" 
                  alt="reloj"
                  className="w-8 h-8 object-cover"
                />
              </div>

              {instructors.map((instructor, index) => (
                <div 
                  key={instructor.id} 
                  className={`p-2 md:p-1 text-center border-r last:border-r-0 ${getColumnClass(index)} min-w-0`}
                >
                  <div className="font-extrabold text-sm md:text-lg truncate px-1">
                    {instructor.nombre}
                  </div>
                </div>
              ))}
            </div>

            {/* Cuerpo de tabla */}
            <div className="flex-1 overflow-y-auto">
              {showCurrentTimeOnly && timeBlocksToDisplay.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 md:p-8 text-center">
                  <img 
                  src="/fecha-del-calendario.png" 
                  alt="callogo"
                  className="w-8 h-8 object-cover"
                />
                  <h3 className="text-xl md:text-2xl font-bold text-gray-500 mb-2">
                    No hay clases programadas
                  </h3>
                  <p className="text-gray-400">
                    Horario actual: <span className="font-bold">{currentTimeString}</span>
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Turno: <span className="font-bold">{getTurnDisplayName(currentTurn)}</span>
                  </p>
                  <p className="text-gray-400 text-xs md:text-sm mt-2">
                    Las clases se mostrarán cuando esté dentro del horario programado
                  </p>
                </div>
              ) : (
                timeBlocksToDisplay.map((timeBlock, rowIndex) => (
                  <div 
                    key={timeBlock.id} 
                    className="grid border-b hover:bg-slate-50 min-w-0"
                    style={{
                      gridTemplateColumns: getGridTemplateColumns(),
                      minHeight: rowHeight === 'small' ? '60px' : 
                                 rowHeight === 'medium' ? '80px' : '100px'
                    }}
                  >
                    <div className={`flex items-center justify-center font-mono border-r p-2 md:p-4 ${
                      showCurrentTimeOnly 
                        ? 'text-2xl md:text-3xl text-blue-700 font-bold bg-blue-50' 
                        : 'text-sm md:text-base text-slate-500'
                    }`}>
                      {showCurrentTimeOnly ? (
                        <div className="text-center">
                          <div className="text-2xl md:text-2xl font-bold">{timeBlock.horaInicio || '--:--'}</div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="font-bold">{timeBlock.horaInicio || '--:--'}</div>
                        </div>
                      )}
                    </div>

                    {instructors.map((instructor, colIndex) => {
                      const slot = getSlotForInstructorAndTimeBlock(instructor.id, timeBlock.id);
                      const statusConfig = getSlotStatusColorClass(slot);
                    
                      
                      const tipoClaseInfo = slot ? slot.classType : "."

                    
                      
                      
                      return (
                        <div
                          key={instructor.id}
                          className={`border-r last:border-r-0 p-2 md:p-1 flex items-center justify-center min-w-0 relative ${
                            showCurrentTimeOnly ? getColumnClass(colIndex) : ''
                          }`}
                        >
                          {slot ? (
                            <div className={`flex flex-col w-full h-full min-w-0 justify-center rounded-md p-1 md:p-2 border relative ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text}`}>
                              {/* Cuadrito rojo con letra "A" en esquina superior izquierda */}

                              {/* Indicador del tipo de clase en esquina superior derecha */}
      {tipoClaseInfo && tiposClase[tipoClaseInfo] && (
  <div className="absolute top-1 right-1 z-10">
    <div 
      className={`w-3 h-3 md:w-3 md:h-3 rounded-full flex items-center justify-center text-[8px] md:text-[10px] font-bold ${
        tiposClase[tipoClaseInfo].color
      }`}
      title={tiposClase[tipoClaseInfo].nombre}
    >
      {tipoClaseInfo}
    </div>
  </div>
)}

                              <div className="min-w-0 text-center">
                                <span className="font-semibold text-sm md:text-lg truncate block w-full">
                                  {slot.student?.nombre || 'Sin alumno'}
                                </span>
                                
                                <div className="space-y-0 md:space-y-1 mt-0 md:mt-1">
                                  {slot.notas && (
                                    <div className="text-xs md:text-sm truncate w-full opacity-90">
                                      {slot.notas}
                                    </div>
                                  )}
                                  <div className="flex flex-wrap gap-1 md:gap-2 justify-center">
                                    {slot.student?.edad && (
                                      <div className="text-xs truncate opacity-80">
                                        Edad: {slot.student.edad}
                                      </div>
                                    )}
                                    {slot.student?.telefonoContacto && (
                                      <div className="text-xs hidden md:block truncate opacity-80">
                                        Tel: {slot.student.telefonoContacto}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-full h-full">
                              <img
                                src="/ola.png"
                                alt="Horario disponible"
                                className={`${
                                  showCurrentTimeOnly 
                                    ? 'h-16 md:h-24' 
                                    : rowHeight === 'small'
                                      ? 'h-6 md:h-8'
                                      : rowHeight === 'medium'
                                        ? 'h-8 md:h-12'
                                        : 'h-10 md:h-14'
                                } opacity-70`}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}