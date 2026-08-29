import { useParams } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { withBranchParams, withBranchPayload } from '../branchScope';

export default function PoolScreen() {
  const { poolId } = useParams();

  const [pool, setPool] = useState(null);
  const [instructors, setInstructors] = useState([]);
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [gridData, setGridData] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTurn, setCurrentTurn] = useState('matutino'); // Estado para el turno actual

  // Modal reemplazar alumno
  const [replaceSlot, setReplaceSlot] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState([]);

  const [errorMover, setErrorMover] = useState('');

   const [alert, setAlert] = useState({
  message: '',
  type: 'info',
})

  // Modal reservar nueva clase
  const [showReservaModal, setShowReservaModal] = useState(false);
  const [selectedSlotInfo, setSelectedSlotInfo] = useState(null);
  const [reservaData, setReservaData] = useState({
    classType: 'C',
    notas: '',
    // Campos para estudiante existente
    studentId: '',
    // Campos para estudiante nuevo (prueba)
    nuevoEstudiante: {
      nombre: '',
      edad: '',
      telefonoContacto: '',
      nombreTutor: '',
      email: ''
    }
  });
  const [buscandoEstudiantes, setBuscandoEstudiantes] = useState(false);
  const [estudiantesEncontrados, setEstudiantesEncontrados] = useState([]);
  const [reservando, setReservando] = useState(false);
  const [creandoEstudiante, setCreandoEstudiante] = useState(false);


  const [moveSlot, setMoveSlot] = useState(null);
    const [showMoveMenu, setShowMoveMenu] = useState(null); // Para controlar menÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âº
    const [moveData, setMoveData] = useState({
    nuevaFecha: '',
    nuevoTimeBlockId: '',
    nuevoInstructorId: '',
    notas: ''
    });
    const [buscandoInstructores, setBuscandoInstructores] = useState(false);
    const [instructoresDisponibles, setInstructoresDisponibles] = useState([]);
    const [timeBlocksDisponibles, setTimeBlocksDisponibles] = useState([]);
    const [moviendoClase, setMoviendoClase] = useState(false);

  const alertTimeoutRef = useRef(null);
  const studentSearchTimeoutRef = useRef(null);
  const reservaStudentSearchTimeoutRef = useRef(null);

  const tipos = [
    { l: "P", c: "bg-purple-100 text-purple-700", nombre: "Clase prueba" },
    { l: "C", c: "bg-amber-100 text-amber-700", nombre: "Clase suelta" },
    { l: "R", c: "bg-indigo-100 text-indigo-700", nombre: "Reposicion" },
    { l: "F", c: "bg-blue-100 text-blue-700", nombre: "Clase fija" },
  ];
  const tiposReservaDirecta = tipos.filter(tipo => tipo.l !== 'F');

  const showAlert = (message, type = 'info') => {
  // Limpia timeout anterior
  if (alertTimeoutRef.current) {
    clearTimeout(alertTimeoutRef.current);
  }

  setAlert({ message, type });

  alertTimeoutRef.current = setTimeout(() => {
    setAlert({ message: '', type: 'info' });
    alertTimeoutRef.current = null;
  }, 4000);
};


  // ConfiguraciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de horarios por turno
  const turnConfig = {
    matutino: {
      start: 6,  // 6:00 AM
      end: 15,   // 2:00 PM
      label: 'Matutino',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-300'
    },
    vespertino: { 
      start: 14, // 2:00 PM
      end: 22,   // 10:00 PM
      label: 'Vespertino',
      color: 'bg-indigo-100 text-indigo-700 border-indigo-300'
    }
  };

  const statusBorder = {
    reservado: 'border-l-yellow-500',
    confirmado: 'border-l-green-500',
    no_vino: 'border-l-red-500',
    cancelado: 'border-l-gray-400'
  };

  const changeDay = (delta) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta);
      return d;
    });
  };

  const formatTimeLabel = (hhmm) => hhmm || '--:--';

  // Filtrar timeBlocks por turno actual
  const getTimeBlocksByTurn = (blocks) => {
    return blocks.filter(block => {
      if (!block.horaInicio) return false;
      const [hour] = block.horaInicio.split(':').map(Number);
      return hour >= turnConfig[currentTurn].start && hour < turnConfig[currentTurn].end;
    });
  };

  const abrirModalMoverClase = (slot) => {
  // Calcular fecha mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­nima (maÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±ana)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toLocaleDateString('en-CA').split('T')[0];
  
  // Calcular fecha mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡xima (30 dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­as desde maÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±ana)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toLocaleDateString('en-CA').split('T')[0];
  
  setMoveSlot({
    ...slot,
    minDate,
    maxDateStr
  });
  
  // Cargar instructores disponibles
  cargarInstructoresDisponibles();
  
  // Cargar horarios disponibles
  cargarTimeBlocksDisponibles();
  
  // Resetear datos del formulario
  setMoveData({
    nuevaFecha: '',
    nuevoTimeBlockId: '',
    nuevoInstructorId: '',
    motivo: '',
    notas: ''
  });
  
  // Cerrar menÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âº
  setShowMoveMenu(null);
};

// ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ FUNCIÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“N: Cargar instructores disponibles
const cargarInstructoresDisponibles = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/instructors`, {
      params: { poolId, activo: 'true' }
    });
    setInstructoresDisponibles(response.data);
  } catch (error) {
    console.error('Error cargando instructores:', error);
    setInstructoresDisponibles([]);
  }
};

// ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ FUNCIÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“N: Cargar horarios disponibles
const cargarTimeBlocksDisponibles = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/timeblocks`);
    setTimeBlocksDisponibles(response.data);
  } catch (error) {
    console.error('Error cargando horarios:', error);
    setTimeBlocksDisponibles([]);
  }
};

// ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ FUNCIÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“N: Mover clase
const moverClase = async () => {
  if (!moveSlot) return;

  setErrorMover('');

    const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // Solo fecha, sin hora

  const fechaClase = extraerSoloFecha(moveSlot.fecha);

  console.log('ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â DEBUG FECHAS VALIDACIÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“N:', {
    hoy: hoy.toISOString(),
    fechaClase: fechaClase.toISOString(),
    fechaClaseDisplay: formatFechaSlot(moveSlot.fecha)
  });

  if (fechaClase < hoy) {
    const fechaDisplay = formatFechaSlot(moveSlot.fecha);
    const errorMsg = `ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Esta clase fue el ${fechaDisplay}. No se puede mover una clase que ya pasÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³.`;
    setErrorMover(errorMsg);
    showAlert(errorMsg, 'error');
    return;
  }

if (fechaClase.getTime() === hoy.getTime()) {
    // Obtener la hora actual LOCAL
    const ahora = new Date();
    const horaActual = ahora.getHours();
    const minutoActual = ahora.getMinutes();
    
    // Obtener la hora de inicio de la clase
    const horaClaseStr = moveSlot.timeBlock?.horaInicio || '00:00';
    const [horaClase, minutoClase] = horaClaseStr.split(':').map(Number);
    
    // Calcular tiempos en minutos para comparar
    const tiempoActual = horaActual * 60 + minutoActual;
    const tiempoClase = horaClase * 60 + minutoClase;
    
    console.log('ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â DEBUG HORA:', {
      horaActual,
      minutoActual,
      horaClase,
      minutoClase,
      tiempoActual,
      tiempoClase,
      diferencia: tiempoActual - tiempoClase
    });
    
    // Si ya pasÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ la hora de la clase (con margen de 5 minutos)
    if (tiempoActual > tiempoClase + 5) {
      const errorMsg = `ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Esta clase comenzÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ a las ${horaClaseStr}. No se puede mover una clase que ya estÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ en curso o terminÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³.`;
      setErrorMover(errorMsg);
      showAlert(errorMsg, 'error');
      return;
    }
}
  
  
  // Validar que haya al menos un cambio
  if (!moveData.nuevaFecha && !moveData.nuevoTimeBlockId && !moveData.nuevoInstructorId) {
    const errorMsg = 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Debes seleccionar al menos un cambio: fecha, horario o instructor';
    setErrorMover(errorMsg);
    return;
  }
  

  
  try {
    setMoviendoClase(true);
    
    const payload = {
      ...moveData,
      nuevaFecha: moveData.nuevaFecha || undefined,
      nuevoTimeBlockId: moveData.nuevoTimeBlockId || undefined,
      nuevoInstructorId: moveData.nuevoInstructorId || undefined,
      motivo: '',
      notas: moveData.notas?.trim() || ''
    };

    delete payload.motivo;
    
    console.log('ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ Moviendo clase con payload:', payload);
    
    const response = await axios.post(
      `${API_BASE_URL}/slots/${moveSlot.id}/move`,
      payload
    );
    
    showAlert(response.data.message || 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Clase movida exitosamente');
    setMoveSlot(null);
    fetchData();
    
  } catch (error) {
    console.error('ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Error moviendo clase:', error);
    if (error.response?.data?.error) {
      showAlert(`Error: ${error.response.data.error}`);
    } else {
      showAlert('Error al mover la clase. Intenta de nuevo.');
    }
  } finally {
    setMoviendoClase(false);
  }
};



  // Obtener las etiquetas de horario para cada turno
  const getTurnTimeLabel = (turn) => {
    return `${turnConfig[turn].start}:00 - ${turnConfig[turn].end}:00`;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const fecha = currentDate.toLocaleDateString('en-CA').split('T')[0];

    try {
      const [poolRes, instRes, tbRes, slotRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/pools/${poolId}`),
        axios.get(`${API_BASE_URL}/instructors`, {
          params: { poolId, activo: 'true' }
        }),
        axios.get(`${API_BASE_URL}/timeblocks`),
        axios.get(`${API_BASE_URL}/slots/tabla-dia`, {
          params: { fecha, poolId }
        })
      ]);

      setPool(poolRes.data);
      setInstructors(instRes.data);
      setTimeBlocks(tbRes.data);

      const organized = {};
      slotRes.data.forEach(slot => {
        // Solo procesamos slots que tengan instructor y bloque de tiempo
        if (!slot.timeBlockId || !slot.instructorId) return;

        if (!organized[slot.timeBlockId]) organized[slot.timeBlockId] = {};

        // Si el slot tiene studentId null, en el frontend se verÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ como el botÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n (+) 
        // gracias a tu lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³gica de: const hasStudent = !!slot?.student;
        organized[slot.timeBlockId][slot.instructorId] = slot;
      });

      setGridData(organized);
    } catch (e) {
      console.error(e);
      setGridData({});
    } finally {
      setLoading(false);
    }
  }, [poolId, currentDate]);

  useEffect(() => {
    fetchData();

    // Determinar turno actual basado en la hora
    updateCurrentTurnByTime();

    // Actualizar turno cada minuto
    const turnInterval = setInterval(updateCurrentTurnByTime, 60000);

    return () => {
      clearInterval(turnInterval);
    };
  }, [fetchData]);

  // Determinar turno actual basado en la hora del dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a
  const updateCurrentTurnByTime = () => {
    const now = new Date();
    const currentHour = now.getHours();

    if (currentHour >= turnConfig.matutino.start && currentHour < turnConfig.matutino.end) {
      setCurrentTurn('matutino');
    } else if (currentHour >= turnConfig.vespertino.start && currentHour < turnConfig.vespertino.end) {
      setCurrentTurn('vespertino');
    } else {
      // Fuera de horarios
      if (currentHour < turnConfig.matutino.start) {
        setCurrentTurn('vespertino'); // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ltimo turno del dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a anterior
      } else {
        setCurrentTurn('matutino'); // PrÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ximo turno del dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a siguiente
      }
    }
  };

  // Cambiar turno manualmente
  const toggleTurn = () => {
    setCurrentTurn(prev => prev === 'matutino' ? 'vespertino' : 'matutino');
  };

  // Obtener timeBlocks filtrados para mostrar
  const getDisplayTimeBlocks = () => {
    return getTimeBlocksByTurn(timeBlocks).sort((a, b) => {
      const timeA = a.horaInicio ? a.horaInicio.split(':').map(Number) : [0, 0];
      const timeB = b.horaInicio ? b.horaInicio.split(':').map(Number) : [0, 0];
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });
  };

  const setEstado = async (id, status) => {
    await axios.put(`${API_BASE_URL}/slots/${id}`, { status });
    fetchData();
  };

  const marcarNoVino = async (slot) => {
    if (slot.status === 'reservado') {
      await axios.put(`${API_BASE_URL}/slots/${slot.id}`, {
        status: 'confirmado'
      });
    }
    await axios.put(`${API_BASE_URL}/slots/${slot.id}`, {
      status: 'no_vino'
    });
    fetchData();
  };

  const liberarSlot = async (id) => {
    if (!window.confirm('ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿Liberar este horario?')) return;

    await axios.put(`${API_BASE_URL}/slots/${id}/cancel`, {
      cancelReason: 'Liberado por administrador'
    });

    fetchData();
  };

  const buscarAlumnos = (q) => {
    setStudentSearch(q);

    if (studentSearchTimeoutRef.current) {
      clearTimeout(studentSearchTimeoutRef.current);
    }

    if (!q || q.trim().length < 2) {
      setStudents([]);
      return;
    }

    studentSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/slots/students/para-asignar`, {
          params: withBranchParams({ search: q.trim(), limit: 10, pageSize: 10 })
        });
        setStudents((res.data.estudiantes || []).slice(0, 10));
      } catch (error) {
        setStudents([]);
      }
    }, 300);
  };



  const reemplazarAlumno = async () => {
    if (replaceSlot.classType === 'P') {
      if (!replaceSlot.nuevoEstudianteNombre?.trim()) {
        showAlert('Por favor ingresa el nombre del estudiante de prueba');
        return;
      }
    } else {
      if (!replaceSlot.studentId) {
        showAlert('Por favor selecciona un estudiante');
        return;
      }
    }

    try {
      let payload = {
        classType: replaceSlot.classType
      };

      if (replaceSlot.classType === 'P') {
        payload = {
          ...payload,
          nuevoEstudiante: {
            nombre: replaceSlot.nuevoEstudianteNombre,
            edad: replaceSlot.nuevoEstudianteEdad,
            telefonoContacto: replaceSlot.nuevoEstudianteTelefono,
            nombreTutor: replaceSlot.nuevoEstudianteTutor,
            email: ''
          }
        };
      } else {
        payload = {
          ...payload,
          studentId: replaceSlot.studentId
        };
      }

      console.log('Enviando payload al backend:', payload);

      const response = await axios.post(
        `${API_BASE_URL}/slots/${replaceSlot.id}/reemplazar`,
        withBranchPayload(payload)
      );

      showAlert('ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Alumno reemplazado exitosamente');
      setReplaceSlot(null);
      setStudentSearch('');
      setStudents([]);
      fetchData();

    } catch (error) {
      console.error('Error al reemplazar alumno:', error);
      if (error.response?.data?.error) {
        showAlert(`Error: ${error.response.data.error}`);
      } else {
        showAlert('Error al reemplazar alumno. Intenta de nuevo.');
      }
    }
  };

  const abrirModalReserva = (instructorId, timeBlockId, instructorNombre, hora) => {
    const fecha = currentDate.toLocaleDateString('en-CA').split('T')[0];

    setSelectedSlotInfo({
      fecha,
      instructorId,
      timeBlockId,
      instructorNombre,
      hora,
      fechaFormateada: currentDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    });

    setReservaData({
      classType: 'C',
      notas: '',
      studentId: '',
      nuevoEstudiante: {
        nombre: '',
        edad: '',
        telefonoContacto: '',
        nombreTutor: '',
        email: ''
      }
    });

    setEstudiantesEncontrados([]);
    setShowReservaModal(true);
  };

  const buscarEstudiantesParaReserva = (nombre) => {
    if (reservaStudentSearchTimeoutRef.current) {
      clearTimeout(reservaStudentSearchTimeoutRef.current);
    }

    if (!nombre || nombre.trim().length < 2) {
      setEstudiantesEncontrados([]);
      setBuscandoEstudiantes(false);
      return;
    }

    setBuscandoEstudiantes(true);
    reservaStudentSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/slots/students/para-asignar`, {
          params: withBranchParams({ search: nombre.trim(), limit: 10, pageSize: 10 })
        });
        setEstudiantesEncontrados((res.data.estudiantes || []).slice(0, 10));
      } catch (error) {
        console.error('Error buscando estudiantes:', error);
        setEstudiantesEncontrados([]);
      } finally {
        setBuscandoEstudiantes(false);
      }
    }, 300);
  };

  const crearEstudianteYReservar = async () => {
    if (!reservaData.nuevoEstudiante.nombre.trim()) {
      showAlert('Por favor ingresa el nombre del estudiante de prueba');
      return;
    }

    setCreandoEstudiante(true);
    try {
      const estudianteResponse = await axios.post(`${API_BASE_URL}/students`, withBranchPayload({
        nombre: reservaData.nuevoEstudiante.nombre.trim(),
        edad: reservaData.nuevoEstudiante.edad ? parseInt(reservaData.nuevoEstudiante.edad) : null,
        telefonoContacto: reservaData.nuevoEstudiante.telefonoContacto?.trim() || null,
        nombreTutor: reservaData.nuevoEstudiante.nombreTutor?.trim() || null,
        notas: `Estudiante de prueba creado automÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ticamente. ${reservaData.notas || ''}`
      }));

      const nuevoEstudianteId = estudianteResponse.data.id;

      const reservaPayload = {
        fecha: selectedSlotInfo.fecha,
        instructorId: selectedSlotInfo.instructorId,
        timeBlockId: selectedSlotInfo.timeBlockId,
        studentId: nuevoEstudianteId,
        classType: reservaData.classType,
        notas: `Clase de prueba - ${reservaData.notas || ''}`
      };

      const reservaResponse = await axios.post(`${API_BASE_URL}/slots/reservar`, reservaPayload);

      showAlert('ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Estudiante creado y clase de prueba reservada exitosamente');
      setShowReservaModal(false);
      fetchData();

    } catch (error) {
      console.error('Error creando estudiante y reservando:', error);
      if (error.response?.data?.error) {
        showAlert(`Error: ${error.response.data.error}`);
      } else {
        showAlert('Error al crear estudiante y reservar la clase. Intenta de nuevo.');
      }
    } finally {
      setCreandoEstudiante(false);
    }
  };

  const formatFechaSlot = (fechaString) => {
  if (!fechaString) return 'Fecha invÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡lida';
  
  // Extraer solo YYYY-MM-DD del string
  const match = fechaString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    // Intentar parsear como Date si no coincide el patrÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n
    const fecha = new Date(fechaString);
    const year = fecha.getFullYear();
    const month = fecha.getMonth();
    const day = fecha.getDate();
    
    const fechaLocal = new Date(year, month, day);
    return fechaLocal.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });
  }
  
  // Crear fecha LOCAL con los componentes extraÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­dos
  const [, year, month, day] = match;
  const fechaLocal = new Date(
    parseInt(year),
    parseInt(month) - 1, // Meses son 0-indexed
    parseInt(day)
  );
  
  return fechaLocal.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  });
};

const getFechaYYYYMMDD = (fechaString) => {
  if (!fechaString) return '';
  
  const match = fechaString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  
  // Fallback
  const fecha = new Date(fechaString);
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

const fechaYaPaso = (fechaString) => {
  if (!fechaString) return true;
  
  // Hoy (solo fecha)
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  // Extraer fecha del slot (ignorar hora)
  const fechaSlot = extraerSoloFecha(fechaString);
  
  return fechaSlot < hoy;
};

// Extraer solo fecha (sin hora) de un string
const extraerSoloFecha = (fechaString) => {
  if (!fechaString) return new Date();
  
  const match = fechaString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Fallback
  const fecha = new Date(fechaString);
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
};

  const reservarSlotConEstudianteExistente = async () => {
    if (!reservaData.studentId) {
      showAlert('Por favor selecciona un estudiante');
      return;
    }

    setReservando(true);
    try {
      const payload = {
        fecha: selectedSlotInfo.fecha,
        instructorId: selectedSlotInfo.instructorId,
        timeBlockId: selectedSlotInfo.timeBlockId,
        studentId: reservaData.studentId,
        classType: reservaData.classType,
        notas: reservaData.notas
      };

      const response = await axios.post(`${API_BASE_URL}/slots/reservar`, payload);

      showAlert(response.data.message || 'Clase reservada exitosamente');
      setShowReservaModal(false);
      fetchData();

    } catch (error) {
      console.error('Error reservando slot:', error);
      if (error.response?.data?.error) {
        showAlert(`Error: ${error.response.data.error}`);
      } else {
        showAlert('Error al reservar la clase. Intenta de nuevo.');
      }
    } finally {
      setReservando(false);
    }
  };

  const reservarSlot = async () => {
    if (reservaData.classType === 'P') {
      await crearEstudianteYReservar();
      showAlert('ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Estudiante creado y clase de prueba reservada exitosamente');

    } else {
      await reservarSlotConEstudianteExistente();
    }
  };

  const handleClassTypeChange = (newClassType) => {
    setReservaData(prev => ({
      ...prev,
      classType: newClassType,
      ...(newClassType !== 'P' && {
        nuevoEstudiante: {
          nombre: '',
          edad: '',
          telefonoContacto: '',
          nombreTutor: '',
          email: ''
        }
      }),
      ...(newClassType === 'P' && {
        studentId: ''
      })
    }));
  };

  if (loading && !pool) {
    return <div className="p-20">CargandoÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦</div>;
  }

  const displayTimeBlocks = getDisplayTimeBlocks();

  return (
    <div className="bg-slate-50 min-h-screen">

      {alert.message && (
        <div className={`fixed top-5 right-5 z-[100] p-4 rounded-lg shadow-lg border-l-4 animate-bounce ${alert.type === 'success' ? 'bg-green-100 border-green-500 text-green-700' :
            alert.type === 'error' ? 'bg-red-100 border-red-500 text-red-700' :
              'bg-blue-100 border-blue-500 text-blue-700'
          }`}>
          <div className="flex items-center gap-2">
            <span className="material-icons">
              {alert.type === 'success' ? 'check_circle' : alert.type === 'error' ? 'error' : 'info'}
            </span>
            <p className="font-medium">{alert.message}</p>
          </div>
        </div>
      )}

      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
      />

      {/* HEADER */}
      <header className="bg-white border-b p-4 sticky top-0 z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black text-blue-600 uppercase">
              {pool?.nombre}
            </h1>

            {/* BotÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n para cambiar turno */}
            <button
              onClick={toggleTurn}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105 ${turnConfig[currentTurn].color}`}
            >
              <span className="material-icons-round text-sm">
                {currentTurn === 'matutino' ? 'wb_sunny' : 'nights_stay'}
              </span>
              <span className="font-bold">{turnConfig[currentTurn].label}</span>
              <span className="text-xs opacity-75">
                {getTurnTimeLabel(currentTurn)}
              </span>
              <span className="material-icons-round text-sm ml-1">
                swap_horiz
              </span>
            </button>
          </div>

          <div className="flex gap-4 items-center">
            <div className="text-sm text-slate-600 hidden md:block">
              Turno actual: {turnConfig[currentTurn].label}
            </div>

            <div className="flex gap-2 items-center bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => changeDay(-1)}
                className="p-2 hover:bg-white rounded transition-colors"
                title="DÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a anterior"
              >
                ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬
              </button>
              <span className="font-bold px-3">
                {currentDate.toLocaleDateString('es-ES', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short'
                })}
              </span>
              <button
                onClick={() => changeDay(1)}
                className="p-2 hover:bg-white rounded transition-colors"
                title="DÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a siguiente"
              >
                ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¶
              </button>
            </div>
          </div>
        </div>

        {/* Info del turno actual */}
        <div className="mt-2 text-sm text-slate-500">
          Mostrando horarios de {turnConfig[currentTurn].label} ({getTurnTimeLabel(currentTurn)})
          {displayTimeBlocks.length === 0 && (
            <span className="text-amber-600 ml-2">
              ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ No hay horarios programados para este turno
            </span>
          )}
        </div>
      </header>

      {/* TABLA */}
      <main className="p-4 md:p-6 overflow-auto">
        {displayTimeBlocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow border">
            <span className="material-icons-round text-gray-300 text-5xl mb-4">
              schedule
            </span>
            <h3 className="text-lg font-bold text-gray-500 mb-2">
              No hay horarios programados
            </h3>
            <p className="text-gray-400 text-center max-w-md">
              No hay clases programadas para el turno {turnConfig[currentTurn].label}
              ({getTurnTimeLabel(currentTurn)}) en esta fecha.
            </p>
            <button
              onClick={toggleTurn}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ver turno {currentTurn === 'matutino' ? 'vespertino' : 'matutino'}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow border min-w-max">
            {/* INSTRUCTORES - CABECERA */}
            <div className="flex bg-slate-900 text-white">
              <div className="w-24 flex-shrink-0" />
              {instructors.map(i => (
                <div
                  key={i.id}
                  className="min-w-[260px] max-w-[260px] w-[260px] flex-shrink-0 p-4 font-black text-center overflow-hidden whitespace-nowrap overflow-ellipsis"
                  style={{ flex: '0 0 260px' }}
                  title={i.nombre}
                >
                  {i.nombre}
                </div>
              ))}
            </div>

            {/* FILAS - SOLO HORARIOS DEL TURNO ACTUAL */}
            {displayTimeBlocks.map(tb => (
              <div key={tb.id} className="flex border-b h-28">
                {/* COLUMNA DE HORA */}
                <div className="w-24 flex-shrink-0 flex items-center justify-center font-mono text-slate-400 bg-slate-50">
                  {formatTimeLabel(tb.horaInicio)}
                </div>

                {/* CELDAS DE ALUMNOS - MISMO ANCHO QUE CABECERA */}
                {instructors.map(inst => {
                  const slot = gridData[tb.id]?.[inst.id];
                  if (!slot) {
                    return (
                      <div
                        key={inst.id}
                        className="min-w-[260px] max-w-[260px] w-[260px] flex-shrink-0 border-r flex items-center justify-center bg-white"
                        style={{ flex: '0 0 260px' }}
                      >
                        <button
                          className="h-full w-full flex items-center justify-center hover:bg-blue-50 transition-colors cursor-pointer"
                          onClick={() => abrirModalReserva(
                            inst.id, 
                            tb.id, 
                            inst.nombre, 
                            tb.horaInicio
                          )}
                        >
                          <img 
                            src="/ola.png" 
                            alt="Reservar clase" 
                            className="h-16 w-16 object-contain opacity-30 hover:opacity-40 transition-opacity"
                            title="Haz clic para reservar una clase"
                          />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={inst.id}
                      className="min-w-[260px] max-w-[260px] w-[260px] flex-shrink-0 p-2 border-r"
                      style={{ flex: '0 0 260px' }}
                    >
                      <div
                        className={`h-full rounded-xl border p-3 flex justify-between ${statusBorder[slot.status]}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs uppercase truncate">
                            {slot.student?.nombre}
                          </div>
                          <div className="flex gap-1 mt-1">
                            <span
                              className={`px-1 text-[9px] rounded ${tipos.find(t => t.l === slot.classType)?.c
                                }`}
                            >
                              {slot.classType}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {slot.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 flex-shrink-0 ml-2">
                          {slot.status !== 'no_vino' && (
                            <button
                              onClick={() => setEstado(slot.id, 'confirmado')}
                              className="material-icons-round text-green-500 hover:text-green-700"
                              title="Confirmar asistencia"
                            >
                               <img 
                                src="/check.png" 
                                alt="confirmado"
                                className="w-6 h-6 object-cover"
                                />
                            </button>
                          )}

                          <button
                            onClick={() => marcarNoVino(slot)}
                            className="material-icons-round text-red-500 hover:text-red-700"
                            title="Marcar como no asistiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³"
                          >
                             <img 
                                src="/close.png" 
                                alt="no vino"
                                className="w-4 h-4 object-cover ml-1"
                                />
                          </button>

                          <div className="relative">
  <button
    onClick={(e) => {
      e.stopPropagation();
      setShowMoveMenu(showMoveMenu === slot.id ? null : slot.id);
    }}
    className="material-icons-round text-blue-500 hover:text-blue-700"
    title="Opciones de clase"
  >
     <img 
                                src="/switch.png" 
                                alt="cambio"
                                className="w-6 h-6 object-cover"
                                />
  </button>
  
  {/* MenÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âº desplegable */}
  {showMoveMenu === slot.id && (
    <div 
      className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          setReplaceSlot(slot);
          setShowMoveMenu(null);
        }}
        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 text-sm"
      >
              <img 
                                src="/user.png" 
                                alt="user"
                                className="w-4 h-4 object-cover"
                                />
        <div>
          <div className="font-medium">Reemplazar alumno</div>
          <div className="text-xs text-slate-500">Cambiar estudiante en este horario</div>
        </div>
      </button>
      
      <div className="border-t border-slate-100"></div>
      
      <button
        onClick={() => abrirModalMoverClase(slot)}
        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 text-sm"
      >
          <img 
                                src="/calendar.png" 
                                alt="user"
                                className="w-4 h-4 object-cover"
                                />
        <div>
          <div className="font-medium">Mover clase</div>
          <div className="text-xs text-slate-500">Cambiar fecha, horario o instructor</div>
        </div>
      </button>
    </div>
  )}
</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </main>

     {moveSlot && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setMoveSlot(null)}>
    <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
      
      <h2 className="font-black text-xl mb-2 flex items-center gap-2">
        <span className="material-icons-round text-indigo-600">calendar_today</span>
        Mover Clase
      </h2>
      
      {/* InformaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n actual */}
      <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-slate-500">Clase actual</div>
            <div className="font-semibold text-lg">{moveSlot.student?.nombre || 'Sin estudiante'}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-xs ${tipos.find(t => t.l === moveSlot.classType)?.c}`}>
                {tipos.find(t => t.l === moveSlot.classType)?.nombre}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs ${
                moveSlot.status === 'confirmado' ? 'bg-green-100 text-green-800' :
                moveSlot.status === 'reservado' ? 'bg-yellow-100 text-yellow-800' :
                'bg-slate-100 text-slate-800'
              }`}>
                {moveSlot.status}
              </span>
            </div>
          </div>
          
          <div>
            <div className="text-sm text-slate-500">Fecha y horario actual</div>
            <div className="font-semibold text-lg">
                <div className="font-semibold text-lg">
                {formatFechaSlot(moveSlot.fecha)}
                {' - '}
                {moveSlot.timeBlock?.horaInicio || '--:--'}
                </div>

                <div className="text-sm text-slate-500 mt-1">
                 <span className="font-medium">Instructor:</span> {moveSlot.instructor?.nombre}
                </div>
          </div>
        </div>
      </div>
      </div>
      
      {/* Formulario de movimiento */}
      <div className="space-y-6">
        {/* Cambiar fecha */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <span className="material-icons-round align-text-bottom text-base mr-1">event</span>
            Nueva fecha (opcional)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="date"
              min={moveSlot.minDate}
              max={moveSlot.maxDateStr}
              value={moveData.nuevaFecha}
              onChange={(e) => {
                setMoveData({ ...moveData, nuevaFecha: e.target.value });
                setErrorMover(''); // Limpiar error al cambiar
              }}
              className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {moveData.nuevaFecha && (
              <button
                onClick={() => {
                  setMoveData({ ...moveData, nuevaFecha: '' });
                  setErrorMover('');
                }}
                className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                title="Quitar fecha"
              >
                <span className="material-icons-round text-base">close</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            <span className="material-icons-round align-text-bottom text-xs">info</span>
            Fecha mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­nima: {moveSlot.minDate} (maÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±ana) ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ MÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡xima: {moveSlot.maxDateStr}
          </p>
        </div>
        
        {/* Cambiar horario */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <span className="material-icons-round align-text-bottom text-base mr-1">schedule</span>
            Nuevo horario (opcional)
          </label>
          <select
            value={moveData.nuevoTimeBlockId}
            onChange={(e) => {
              setMoveData({ ...moveData, nuevoTimeBlockId: e.target.value });
              setErrorMover('');
            }}
            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Mismo horario (no cambiar)</option>
            {timeBlocksDisponibles
              .sort((a, b) => {
                const timeA = a.horaInicio ? a.horaInicio.split(':').map(Number) : [0, 0];
                const timeB = b.horaInicio ? b.horaInicio.split(':').map(Number) : [0, 0];
                return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
              })
              .map(tb => (
                <option key={tb.id} value={tb.id}>
                  {tb.horaInicio} - {tb.horaFin}
                </option>
              ))
            }
          </select>
        </div>
        
        {/* Cambiar instructor */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <span className="material-icons-round align-text-bottom text-base mr-1">person</span>
            Nuevo instructor (opcional)
          </label>
          <select
            value={moveData.nuevoInstructorId}
            onChange={(e) => {
              setMoveData({ ...moveData, nuevoInstructorId: e.target.value });
              setErrorMover('');
            }}
            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Mismo instructor: {moveSlot.instructor?.nombre}</option>
            {instructoresDisponibles
              .filter(inst => inst.id !== moveSlot.instructorId)
              .sort((a, b) => a.nombre.localeCompare(b.nombre))
              .map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.nombre}
                </option>
              ))
            }
          </select>
        </div>
        
        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <span className="material-icons-round align-text-bottom text-base mr-1">note</span>
            Notas adicionales (opcional)
          </label>
          <textarea
            value={moveData.notas}
            onChange={(e) => {
              setMoveData({ ...moveData, notas: e.target.value });
              setErrorMover('');
            }}
            placeholder="Observaciones, comentarios adicionales..."
            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
          />
        </div>
        
        {/* ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ SECCIÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“N DE ERRORES (NUEVA) */}
        {errorMover && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg animate-pulse">
            <div className="flex items-start gap-3">
              <span className="material-icons-round text-red-600 flex-shrink-0">error</span>
              <div>
                <h4 className="font-medium text-red-800 mb-1">No se puede mover la clase</h4>
                <p className="text-sm text-red-700">{errorMover}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Resumen de cambios */}
        {(moveData.nuevaFecha || moveData.nuevoTimeBlockId || moveData.nuevoInstructorId) && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <span className="material-icons-round text-base">list</span>
              Resumen de cambios:
            </h3>
            <ul className="text-sm text-blue-700 space-y-2">
              {moveData.nuevaFecha && (
                <li className="flex items-start gap-2">
                  <span className="material-icons-round text-sm mt-0.5">calendar_today</span>
                  <div>
                    <div className="font-medium">Nueva fecha</div>
                    <div>{moveData.nuevaFecha}</div>
                  </div>
                </li>
              )}
              {moveData.nuevoTimeBlockId && (
                <li className="flex items-start gap-2">
                  <span className="material-icons-round text-sm mt-0.5">schedule</span>
                  <div>
                    <div className="font-medium">Nuevo horario</div>
                    <div>{
                      timeBlocksDisponibles.find(tb => tb.id === moveData.nuevoTimeBlockId)?.horaInicio || 'Horario seleccionado'
                    } - {
                      timeBlocksDisponibles.find(tb => tb.id === moveData.nuevoTimeBlockId)?.horaFin || ''
                    }</div>
                  </div>
                </li>
              )}
              {moveData.nuevoInstructorId && (
                <li className="flex items-start gap-2">
                  <span className="material-icons-round text-sm mt-0.5">person</span>
                  <div>
                    <div className="font-medium">Nuevo instructor</div>
                    <div>{
                      instructoresDisponibles.find(i => i.id === moveData.nuevoInstructorId)?.nombre || 'Instructor seleccionado'
                    }</div>
                  </div>
                </li>
              )}
            </ul>
          </div>
        )}
        
        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={() => {
              setMoveSlot(null);
              setShowMoveMenu(null);
              setErrorMover('');
            }}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2"
            disabled={moviendoClase}
          >
            <span className="material-icons-round">close</span>
            Cancelar
          </button>
          
          <button
            onClick={moverClase}
            disabled={moviendoClase || (!moveData.nuevaFecha && !moveData.nuevoTimeBlockId && !moveData.nuevoInstructorId)}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
              moviendoClase || (!moveData.nuevaFecha && !moveData.nuevoTimeBlockId && !moveData.nuevoInstructorId)
                ? 'bg-indigo-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {moviendoClase ? (
              <>
                <span className="animate-spin">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³</span>
                Moviendo...
              </>
            ) : (
              <>
                <span className="material-icons-round">swap_horiz</span>
                Mover Clase
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}


      {/* MODAL REEMPLAZAR - MANTENIDO IGUAL */}
      {replaceSlot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px] max-h-[90vh] overflow-auto">
            <h2 className="font-black text-xl mb-4">Reemplazar alumno</h2>

            <div className="mb-6">
              <p className="text-sm text-slate-600 mb-2">
                Slot actual: <span className="font-semibold">{replaceSlot.student?.nombre}</span>
              </p>
              <p className="text-xs text-slate-500">
                {currentDate.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })} - {replaceSlot.timeBlock?.horaInicio}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipo de clase
              </label>
              <div className="flex gap-2">
                {tiposReservaDirecta.map(tipo => (
                  <button
                    key={tipo.l}
                    onClick={() => {
                      setReplaceSlot({
                        ...replaceSlot,
                        classType: tipo.l
                      });
                    }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${replaceSlot.classType === tipo.l
                        ? `${tipo.c.split(' ')[0]} border-2 border-blue-500`
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    {tipo.nombre}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Tipo actual:
                <span className={`ml-1 px-2 py-1 rounded text-xs ${tipos.find(t => t.l === replaceSlot.classType)?.c}`}>
                  {replaceSlot.classType === 'P' ? 'Clase prueba' :
                    replaceSlot.classType === 'C' ? 'Clase suelta' :
                      replaceSlot.classType === 'R' ? 'Reposicion' : 'Clase fija'}
                </span>
              </p>
            </div>

            {replaceSlot.classType === 'P' ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Datos del nuevo estudiante de prueba *
                </label>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nombre completo *"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={replaceSlot.nuevoEstudianteNombre || ''}
                    onChange={(e) => {
                      setReplaceSlot({
                        ...replaceSlot,
                        nuevoEstudianteNombre: e.target.value
                      });
                    }}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Edad"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="99"
                      value={replaceSlot.nuevoEstudianteEdad || ''}
                      onChange={(e) => {
                        setReplaceSlot({
                          ...replaceSlot,
                          nuevoEstudianteEdad: e.target.value
                        });
                      }}
                    />
                    <input
                      type="tel"
                      placeholder="TelÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©fono contacto"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={replaceSlot.nuevoEstudianteTelefono || ''}
                      onChange={(e) => {
                        setReplaceSlot({
                          ...replaceSlot,
                          nuevoEstudianteTelefono: e.target.value
                        });
                      }}
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Nombre del tutor"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={replaceSlot.nuevoEstudianteTutor || ''}
                    onChange={(e) => {
                      setReplaceSlot({
                        ...replaceSlot,
                        nuevoEstudianteTutor: e.target.value
                      });
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Buscar alumno existente *
                </label>
                <input
                  value={studentSearch}
                  onChange={e => buscarAlumnos(e.target.value)}
                  placeholder="Nombre del estudiante..."
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <div className="max-h-48 overflow-auto mt-2 border border-slate-200 rounded-lg">
                  {students.map(s => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setReplaceSlot({
                          ...replaceSlot,
                          studentId: s.id,
                          student: { ...s }
                        });
                      }}
                      className={`p-3 border-b border-slate-100 hover:bg-blue-50 cursor-pointer ${replaceSlot.studentId === s.id ? 'bg-blue-100' : ''
                        }`}
                    >
                      <div className="font-medium">{s.nombre}</div>
                      {s.edad && (
                        <div className="text-sm text-slate-500">Edad: {s.edad}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setReplaceSlot(null);
                  setStudentSearch('');
                  setStudents([]);
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                onClick={() => reemplazarAlumno()}
                disabled={(!replaceSlot.studentId && replaceSlot.classType !== 'P') || !replaceSlot.classType}
                className={`px-4 py-2 rounded-lg font-medium ${(!replaceSlot.studentId && replaceSlot.classType !== 'P') || !replaceSlot.classType
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
              >
                Confirmar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RESERVAR NUEVA CLASE - MANTENIDO IGUAL */}
      {showReservaModal && selectedSlotInfo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-auto">
            <h2 className="font-black text-xl mb-2">Reservar Nueva Clase</h2>
            <p className="text-slate-600 mb-6">
              {selectedSlotInfo.fechaFormateada} - {selectedSlotInfo.hora}
              <br />
              Instructor: <span className="font-semibold">{selectedSlotInfo.instructorNombre}</span>
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipo de clase
              </label>
              <div className="grid grid-cols-3 gap-2">
                {tiposReservaDirecta.map(tipo => (
                  <button
                    key={tipo.l}
                    type="button"
                    onClick={() => handleClassTypeChange(tipo.l)}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${reservaData.classType === tipo.l
                        ? `${tipo.c.split(' ')[0]} border-2 border-blue-500`
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    {tipo.nombre}
                </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Tipo seleccionado:
                <span className={`ml-1 px-2 py-1 rounded text-xs ${tipos.find(t => t.l === reservaData.classType)?.c}`}>
                  {tipos.find(t => t.l === reservaData.classType)?.nombre}
                </span>
              </p>
            </div>

            {reservaData.classType === 'P' ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Datos del nuevo estudiante de prueba *
                </label>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nombre completo *"
                    value={reservaData.nuevoEstudiante.nombre}
                    onChange={(e) => setReservaData({
                      ...reservaData,
                      nuevoEstudiante: {
                        ...reservaData.nuevoEstudiante,
                        nombre: e.target.value
                      }
                    })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Edad"
                      value={reservaData.nuevoEstudiante.edad}
                      onChange={(e) => setReservaData({
                        ...reservaData,
                        nuevoEstudiante: {
                          ...reservaData.nuevoEstudiante,
                          edad: e.target.value
                        }
                      })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="99"
                    />
                    <input
                      type="tel"
                      placeholder="TelÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©fono contacto"
                      value={reservaData.nuevoEstudiante.telefonoContacto}
                      onChange={(e) => setReservaData({
                        ...reservaData,
                        nuevoEstudiante: {
                          ...reservaData.nuevoEstudiante,
                          telefonoContacto: e.target.value
                        }
                      })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Nombre del tutor"
                    value={reservaData.nuevoEstudiante.nombreTutor}
                    onChange={(e) => setReservaData({
                      ...reservaData,
                      nuevoEstudiante: {
                        ...reservaData.nuevoEstudiante,
                        nombreTutor: e.target.value
                      }
                    })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {!reservaData.nuevoEstudiante.nombre.trim() && (
                  <p className="text-sm text-red-500 mt-2">
                    * El nombre es requerido para estudiantes de prueba
                  </p>
                )}
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Buscar estudiante existente *
                </label>
                <input
                  type="text"
                  placeholder="Nombre del estudiante..."
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => buscarEstudiantesParaReserva(e.target.value)}
                />

                {buscandoEstudiantes && (
                  <p className="text-sm text-slate-500 mt-2">Buscando estudiantes...</p>
                )}

                {estudiantesEncontrados.length > 0 && (
                  <div className="mt-2 border border-slate-200 rounded-lg max-h-48 overflow-auto">
                    {estudiantesEncontrados.map(estudiante => (
                      <div
                        key={estudiante.id}
                        className={`p-3 border-b border-slate-100 hover:bg-blue-50 cursor-pointer ${reservaData.studentId === estudiante.id ? 'bg-blue-100' : ''
                          }`}
                        onClick={() => setReservaData({
                          ...reservaData,
                          studentId: estudiante.id
                        })}
                      >
                        <div className="font-medium">{estudiante.nombre}</div>
                        {estudiante.edad && (
                          <div className="text-sm text-slate-500">Edad: {estudiante.edad}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {reservaData.studentId && (
                  <p className="text-sm text-green-600 mt-2">
                    ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ Estudiante seleccionado
                  </p>
                )}

                {!reservaData.studentId && reservaData.classType !== 'P' && (
                  <p className="text-sm text-red-500 mt-2">
                    * Debes seleccionar un estudiante
                  </p>
                )}
              </div>
            )}

            <div className="mb-8">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={reservaData.notas}
                onChange={(e) => setReservaData({
                  ...reservaData,
                  notas: e.target.value
                })}
                placeholder="Observaciones, comentarios..."
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReservaModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                disabled={reservando || creandoEstudiante}
              >
                Cancelar
              </button>

              <button
                onClick={reservarSlot}
                disabled={
                  reservando ||
                  creandoEstudiante ||
                  (reservaData.classType === 'P' && !reservaData.nuevoEstudiante.nombre.trim()) ||
                  (reservaData.classType !== 'P' && !reservaData.studentId)
                }
                className={`px-4 py-2 rounded-lg font-medium ${reservando || creandoEstudiante ||
                    (reservaData.classType === 'P' && !reservaData.nuevoEstudiante.nombre.trim()) ||
                    (reservaData.classType !== 'P' && !reservaData.studentId)
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
              >
                {reservando || creandoEstudiante ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³</span>
                    {creandoEstudiante ? 'Creando estudiante...' : 'Reservando...'}
                  </span>
                ) : (
                  `Reservar ${reservaData.classType === 'P' ? 'Clase de Prueba' : 'Clase'}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
