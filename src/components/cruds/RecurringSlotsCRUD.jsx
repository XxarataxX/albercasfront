import { useState, useEffect, useRef } from 'react';
import { recurringSlotService, instructorService, studentService, timeBlockService, poolService } from '../../services/api';
import Alert from '../ui/Alert';

export default function RecurringSlotsCRUD() {
  const [slots, setSlots] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [students, setStudents] = useState([]);
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(true); // <-- Nuevo estado para mostrar/ocultar filtros

   const [alert, setAlert] = useState({
  message: '',
  type: 'info',
})
  
  // Filtros
  const [filters, setFilters] = useState({
    instructorId: '',
    studentId: '',
    timeBlockId: '',
    classType: '',
    status: '',
    fechaDesde: '',
    fechaHasta: ''
  });
  
  // Slots filtrados
  const [filteredSlots, setFilteredSlots] = useState([]);

  // Formulario para slots recurrentes
  const [formData, setFormData] = useState({
    instructorId: '',
    studentId: '',
    timeBlockId: '',
    poolId: '',
    classType: 'C',
    startDate: new Date().toLocaleDateString('en-CA').split('T')[0],
    duration: 30,
    daysOfWeek: [],
    notas: ''
  });

  const classTypes = [
    { value: 'P', label: 'Clase de Prueba' },
    { value: 'C', label: 'Clase Suelta' },
    { value: 'R', label: 'Reposición' },
    { value: 'F', label: 'Clase Fija' }
  ];

  const statusOptions = [
    { value: 'disponible', label: 'Disponible' },
    { value: 'reservado', label: 'Reservado' },
    { value: 'confirmado', label: 'Confirmado' },
    { value: 'no_vino', label: 'No Vino' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

  const daysOfWeekOptions = [
    { value: 'L', label: 'Lunes', short: 'L' },
    { value: 'M', label: 'Martes', short: 'M' },
    { value: 'MI', label: 'Miércoles', short: 'MI' },
    { value: 'J', label: 'Jueves', short: 'J' },
    { value: 'V', label: 'Viernes', short: 'V' },
    { value: 'S', label: 'Sábado', short: 'S' },
    { value: 'D', label: 'Domingo', short: 'D' }
  ];

  // Cargar datos iniciales
  useEffect(() => {
    fetchData();
  }, []);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters();
  }, [slots, filters]);

  const formatDateUTC = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      timeZone: 'UTC',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getWeekdayUTC = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      timeZone: 'UTC',
      weekday: 'short'
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      timeZone: 'UTC',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [slotsRes, instructorsRes, studentsRes, timeBlocksRes, poolsRes] = await Promise.all([
        recurringSlotService.getAll(),
        instructorService.getAll({ activo: true }),
        studentService.getAll({ activo: true }),
        timeBlockService.getAll(),
        poolService.getAll({ activo: true })
      ]);
      
      setSlots(slotsRes.data);
      setInstructors(instructorsRes.data);
      setStudents(studentsRes.data);
      setTimeBlocks(timeBlocksRes.data);
      setPools(poolsRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showAlert('Error al cargar datos: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...slots];

    // Filtrar por instructor
    if (filters.instructorId) {
      result = result.filter(slot => slot.instructorId === filters.instructorId);
    }

    // Filtrar por estudiante
    if (filters.studentId) {
      result = result.filter(slot => slot.studentId === filters.studentId);
    }

    // Filtrar por horario
    if (filters.timeBlockId) {
      result = result.filter(slot => slot.timeBlockId === filters.timeBlockId);
    }

    // Filtrar por tipo de clase
    if (filters.classType) {
      result = result.filter(slot => slot.classType === filters.classType);
    }

    // Filtrar por estado
    if (filters.status) {
      result = result.filter(slot => slot.status === filters.status);
    }

    // Filtrar por fecha desde
    if (filters.fechaDesde) {
      const fechaDesde = new Date(filters.fechaDesde + 'T00:00:00.000Z');
      result = result.filter(slot => new Date(slot.fecha) >= fechaDesde);
    }

    // Filtrar por fecha hasta
    if (filters.fechaHasta) {
      const fechaHasta = new Date(filters.fechaHasta + 'T23:59:59.999Z');
      result = result.filter(slot => new Date(slot.fecha) <= fechaHasta);
    }

    setFilteredSlots(result);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      instructorId: '',
      studentId: '',
      timeBlockId: '',
      classType: '',
      status: '',
      fechaDesde: '',
      fechaHasta: ''
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este horario?')) return;
    
    try {
      await recurringSlotService.delete(id);
      setSlots(slots.filter(s => s.id !== id));
      showAlert('Horario eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar horario:', error);
      showAlert('Error al eliminar el horario: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDayToggle = (dayValue) => {
    const currentDays = [...formData.daysOfWeek];
    if (currentDays.includes(dayValue)) {
      setFormData({
        ...formData,
        daysOfWeek: currentDays.filter(d => d !== dayValue)
      });
    } else {
      setFormData({
        ...formData,
        daysOfWeek: [...currentDays, dayValue]
      });
    }
  };

  const getEndDate = () => {
    if (!formData.startDate || !formData.duration) return null;
    
    const startDate = new Date(formData.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + parseInt(formData.duration));
    
    return endDate.toLocaleDateString('en-CA').split('T')[0];
  };

  const generatePatternDescription = () => {
    if (formData.daysOfWeek.length === 0) return 'Sin días seleccionados';
    
    const selectedDays = formData.daysOfWeek.map(day => 
      daysOfWeekOptions.find(d => d.value === day)?.short || day
    );
    
    return `${selectedDays.join(', ')} por ${formData.duration} días`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.daysOfWeek.length === 0) {
      showAlert('Por favor selecciona al menos un día de la semana');
      return;
    }
    
    try {
      setFormLoading(true);
      
      const endDate = getEndDate();
      const dataToSend = {
        ...formData,
        endDate,
        duration: parseInt(formData.duration)
      };
      
      const response = await recurringSlotService.createRecurring(dataToSend);
      
      if (response.data && Array.isArray(response.data.createdSlots)) {
        setSlots([...slots, ...response.data.createdSlots]);
        showAlert(`¡Se crearon ${response.data.createdSlots.length} slots exitosamente!`);
      } else {
        fetchData();
        showAlert('Slots creados exitosamente');
      }
      
      resetForm();
    } catch (error) {
      console.error('Error al crear slots recurrentes:', error);
      showAlert('Error al crear los slots: ' + (error.response?.data?.error || error.message));
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      instructorId: '',
      studentId: '',
      timeBlockId: '',
      poolId: '',
      classType: 'C',
      startDate: new Date().toLocaleDateString('en-CA').split('T')[0],
      duration: 30,
      daysOfWeek: [],
      notas: ''
    });
    setShowForm(false);
  };

  const handleInstructorChange = (instructorId) => {
    const selectedInstructor = instructors.find(i => i.id === instructorId);
    setFormData({
      ...formData,
      instructorId,
      poolId: selectedInstructor?.poolId || ''
    });
  };

  const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };

  const alertTimeoutRef = useRef(null);
  


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


  return (
    <div className="bg-white rounded-xl shadow-lg border">
       <Alert
                message={alert.message}
                type={alert.type}
                onClose={() => setAlert({ message: '', type: 'info' })}
              />
      <div className="p-6 border-b bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Slots Recurrentes</h2>
            <p className="text-gray-600">Crea horarios automáticos por período</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowForm(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <span className="material-icons-round">add_circle</span>
              Nuevo Slot Recurrente
            </button>
            <button 
              onClick={fetchData}
              className="bg-white border text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <span className="material-icons-round">refresh</span>
              Refrescar
            </button>
          </div>
        </div>
      </div>

      {/* Sección de Filtros - Con botón para mostrar/ocultar */}
      <div className="border-b bg-gray-50">
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <span className="material-icons-round">
                {showFilters ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
              </span>
              Filtros de búsqueda
              {Object.values(filters).some(f => f) && (
                <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {Object.values(filters).filter(f => f).length} activo(s)
                </span>
              )}
            </button>
          </div>
          
          <div className="flex gap-2">
            {showFilters && (
              <button 
                onClick={resetFilters}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span className="material-icons-round text-sm">filter_alt_off</span>
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
        
        {showFilters && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro Instructor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructor
                </label>
                <select
                  value={filters.instructorId}
                  onChange={(e) => handleFilterChange('instructorId', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="">Todos los instructores</option>
                  {instructors.map(instructor => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Estudiante */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estudiante
                </label>
                <select
                  value={filters.studentId}
                  onChange={(e) => handleFilterChange('studentId', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="">Todos los estudiantes</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Horario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horario
                </label>
                <select
                  value={filters.timeBlockId}
                  onChange={(e) => handleFilterChange('timeBlockId', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="">Todos los horarios</option>
                  {timeBlocks.map(block => (
                    <option key={block.id} value={block.id}>
                      {block.horaInicio} - {block.horaFin}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Tipo de Clase */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Clase
                </label>
                <select
                  value={filters.classType}
                  onChange={(e) => handleFilterChange('classType', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="">Todos los tipos</option>
                  {classTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="">Todos los estados</option>
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Fecha Desde */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha desde
                </label>
                <input
                  type="date"
                  value={filters.fechaDesde}
                  onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                />
              </div>

              {/* Filtro Fecha Hasta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha hasta
                </label>
                <input
                  type="date"
                  value={filters.fechaHasta}
                  onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                />
              </div>

              {/* Contador de resultados */}
              <div className="flex items-center justify-center">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <div className="text-sm text-blue-700 font-medium">Resultados</div>
                  <div className="text-2xl font-bold text-blue-800">{filteredSlots.length}</div>
                  <div className="text-xs text-blue-600">de {slots.length} slots</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Crear Slots Recurrentes</h3>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <span className="material-icons-round">close</span>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Primera fila: Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructor *
                </label>
                <select
                  value={formData.instructorId}
                  onChange={(e) => handleInstructorChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Seleccionar instructor</option>
                  {instructors.map(instructor => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.nombre} ({instructor.pool?.nombre || 'Sin alberca'})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estudiante *
                </label>
                <select
                  value={formData.studentId}
                  onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Seleccionar estudiante</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.nombre} {student.edad ? `(${student.edad} años)` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horario *
                </label>
                <select
                  name="timeBlockId"
                  value={formData.timeBlockId || ''}
                  onChange={(e) => setFormData({...formData, timeBlockId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Seleccionar horario</option>
                  {timeBlocks.map(block => (
                    <option key={block.id} value={block.id}>
                      {block.horaInicio} - {block.horaFin} (30 min)
                    </option>
                  ))}
                </select>
                {formData.timeBlockId && (
                  <div className="text-xs text-green-600 mt-1">
                    Horario seleccionado: {timeBlocks.find(b => b.id === formData.timeBlockId)?.horaInicio} - {timeBlocks.find(b => b.id === formData.timeBlockId)?.horaFin}
                  </div>
                )}
              </div>  
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Clase *
                </label>
                <select
                  value={formData.classType}
                  onChange={(e) => setFormData({...formData, classType: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  {classTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Segunda fila: Fechas y duración */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de inicio *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración (días) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="30"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.duration} días ≈ {Math.floor(formData.duration / 30)} meses
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de fin
                </label>
                <input
                  type="date"
                  value={getEndDate() || ''}
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                  readOnly
                />
                <div className="text-xs text-gray-500 mt-1">
                  Calculado automáticamente
                </div>
              </div>
            </div>
            
            {/* Tercera fila: Días de la semana */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Días de la semana *
              </label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeekOptions.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      formData.daysOfWeek.includes(day.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Patrón: {generatePatternDescription()}
              </div>
              
            </div>
            
            {/* Cuarta fila: Notas y acciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (opcional)
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({...formData, notas: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                rows="2"
                placeholder="Notas adicionales sobre estas clases..."
              />
            </div>
            
            {/* Resumen y acciones */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Resumen del slot recurrente:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Instructor:</span>{' '}
                  {formData.instructorId ? 
                    instructors.find(i => i.id === formData.instructorId)?.nombre : 
                    'No seleccionado'}
                </div>
                <div>
                  <span className="font-medium">Estudiante:</span>{' '}
                  {formData.studentId ? 
                    students.find(s => s.id === formData.studentId)?.nombre : 
                    'No seleccionado'}
                </div>
                <div>
                  <span className="font-medium">Período:</span>{' '}
                  {formData.startDate ? formatDate(formData.startDate) : 'No definido'} → {getEndDate() ? formatDate(getEndDate()) : 'No definido'}
                </div>
                <div>
                  <span className="font-medium">Días seleccionados:</span>{' '}
                  {formData.daysOfWeek.length > 0 ? 
                    formData.daysOfWeek.map(d => daysOfWeekOptions.find(day => day.value === d)?.short).join(', ') : 
                    'Ninguno'}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg flex items-center gap-2"
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <span className="material-icons-round animate-spin">refresh</span>
                    Creando slots...
                  </>
                ) : (
                  <>
                    <span className="material-icons-round">add_circle</span>
                    Crear Slots Recurrentes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-5 py-2 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de slots existentes */}
      {loading && !showForm ? (
        <div className="p-8 text-center">
          <span className="material-icons-round animate-spin text-4xl text-amber-500">refresh</span>
          <p className="mt-2 text-gray-600">Cargando slots...</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSlots.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <span className="material-icons-round text-5xl mb-4">search_off</span>
                        <p className="text-lg font-medium">No se encontraron slots</p>
                        <p className="text-sm mt-1">Intenta con otros filtros o crea un nuevo slot</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSlots.map((slot) => (
                    <tr key={slot.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium">{slot.instructor?.nombre}</div>
                        <div className="text-xs text-gray-500">
                          {slot.instructor?.pool?.nombre || 'Sin alberca'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{slot.student?.nombre}</div>
                      </td>
                      <td className="px-6 py-4">
                        {slot.timeBlock ? (
                          <div className="font-mono">
                            {slot.timeBlock.horaInicio} - {slot.timeBlock.horaFin}
                            <div className="text-xs text-gray-500">
                              {toMinutes(slot.timeBlock.horaFin) - toMinutes(slot.timeBlock.horaInicio)} min
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Sin horario</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {formatDateUTC(slot.fecha)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getWeekdayUTC(slot.fecha)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          slot.classType === 'P' ? 'bg-purple-100 text-purple-800' :
                          slot.classType === 'C' ? 'bg-amber-100 text-amber-800' :
                          slot.classType === 'R' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {classTypes.find(t => t.value === slot.classType)?.label || slot.classType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          slot.status === 'disponible' ? 'bg-green-100 text-green-800' :
                          slot.status === 'reservado' ? 'bg-yellow-100 text-yellow-800' :
                          slot.status === 'confirmado' ? 'bg-blue-100 text-blue-800' :
                          slot.status === 'no_vino' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {slot.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(slot.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Eliminar"
                          >
                            <span className="material-icons-round text-lg">delete</span>
                          </button>
                          <button className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50">
                            <span className="material-icons-round text-lg">edit</span>
                          </button>
                          <button className={`p-1 rounded ${
                            slot.status === 'confirmado' ? 'text-green-600 hover:text-green-900' :
                            'text-gray-600 hover:text-gray-900'
                          }`}>
                            <span className="material-icons-round text-lg">check_circle</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                Mostrando {filteredSlots.length} de {slots.length} slots
                {Object.values(filters).some(f => f) && (
                  <span className="ml-2 text-blue-600">
                    (filtrados)
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-600">
                    <span className="font-medium">{filteredSlots.filter(s => s.status === 'disponible').length}</span> disponibles
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-xs text-gray-600">
                    <span className="font-medium">{filteredSlots.filter(s => s.status === 'reservado').length}</span> reservados
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-gray-600">
                    <span className="font-medium">{filteredSlots.filter(s => s.status === 'confirmado').length}</span> confirmados
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}