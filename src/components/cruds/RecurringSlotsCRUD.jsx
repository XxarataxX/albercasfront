import { useState, useEffect, useRef } from 'react';
import { recurringSlotService, instructorService, studentService, timeBlockService, poolService, extractList, extractPagination } from '../../services/api';
import Alert from '../ui/Alert';

const SLOTS_PAGE_SIZE = 20;
const LOOKUP_PAGE_SIZE = 500;

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
  const [selectedPackage, setSelectedPackage] = useState('');

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
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: SLOTS_PAGE_SIZE,
    total: 0,
    pages: 1,
    hasMore: false
  });

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
    { value: 'R', label: 'Reposicion' },
    { value: 'F', label: 'Clase Fija' }
  ];

  const monthlyPackages = [
    { value: '1', label: '1 vez por semana', price: '$1,650', sessions: '4 clases aprox.' },
    { value: '2', label: '2 veces por semana', price: '$2,650', sessions: '8 clases aprox.' },
    { value: '3', label: '3 veces por semana', price: '$3,340', sessions: '12 clases aprox.' }
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
    { value: 'MI', label: 'Miercoles', short: 'MI' },
    { value: 'J', label: 'Jueves', short: 'J' },
    { value: 'V', label: 'Viernes', short: 'V' },
    { value: 'S', label: 'Sabado', short: 'S' },
    { value: 'D', label: 'Domingo', short: 'D' }
  ];

  // Cargar datos y aplicar filtros desde el API.
  useEffect(() => {
    fetchData(1);
  }, [filters]);

  useEffect(() => {
    setFilteredSlots(slots);
  }, [slots]);

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

  const fetchData = async (page = pagination.page, pageSize = pagination.pageSize) => {
    try {
      setLoading(true);
      const slotParams = { page, pageSize };
      Object.entries(filters).forEach(([key, value]) => {
        if (value) slotParams[key] = value;
      });

      const [slotsRes, instructorsRes, studentsRes, timeBlocksRes, poolsRes] = await Promise.all([
        recurringSlotService.getAll(slotParams),
        instructorService.getAll({ activo: true }),
        studentService.getAll({ activo: true, page: 1, pageSize: LOOKUP_PAGE_SIZE }),
        timeBlockService.getAll(),
        poolService.getAll({ activo: true })
      ]);

      const slotList = extractList(slotsRes.data, 'slots');
      const studentList = extractList(studentsRes.data, 'students');

      setSlots(slotList);
      setFilteredSlots(slotList);
      setPagination({
        ...extractPagination(slotsRes.data, slotList.length),
        pageSize
      });
      setInstructors(instructorsRes.data);
      setStudents(studentList);
      setTimeBlocks(timeBlocksRes.data);
      setPools(poolsRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showAlert('Error al cargar datos: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (page) => {
    const nextPage = Math.max(1, Math.min(page, pagination.pages || 1));
    fetchData(nextPage, pagination.pageSize);
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
    if (!window.confirm('Estas seguro de eliminar este horario?')) return;
    
    try {
      await recurringSlotService.delete(id);
      fetchData(pagination.page);
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
    if (formData.daysOfWeek.length === 0) return 'Sin dias seleccionados';
    
    const selectedDays = formData.daysOfWeek.map(day => 
      daysOfWeekOptions.find(d => d.value === day)?.short || day
    );
    
    return `${selectedDays.join(', ')} por 30 dias`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.daysOfWeek.length === 0) {
      showAlert('Por favor selecciona al menos un dia de la semana');
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
        showAlert(`Se crearon ${response.data.createdSlots.length} slots exitosamente!`);
      } else {
        fetchData(pagination.page);
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
    setSelectedPackage('');
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
            <p className="text-gray-600">Crea horarios automaticos por periodo</p>
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
              onClick={() => fetchData(pagination.page)}
              className="bg-white border text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <span className="material-icons-round">refresh</span>
              Refrescar
            </button>
          </div>
        </div>
      </div>

      {/* Seccion de filtros */}
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
              Filtros de busqueda
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
                  <div className="text-xs text-blue-600">de {pagination.total || slots.length} slots</div>
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
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <section className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-icons-round text-blue-600">person_search</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Alumno</h4>
                  <p className="text-sm text-gray-500">Selecciona primero el alumno que recibira las clases.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
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
                        {student.nombre} {student.edad ? `(${student.edad} anos)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-blue-700 font-semibold">Alumno seleccionado</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">
                    {formData.studentId ? students.find(s => s.id === formData.studentId)?.nombre : 'Pendiente'}
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-icons-round text-emerald-600">payments</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Paquete mensual</h4>
                  <p className="text-sm text-gray-500">Elige la frecuencia antes de asignar los dias de clase.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {monthlyPackages.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedPackage(option.value)}
                    className={`text-left border rounded-lg p-4 transition-colors ${
                      selectedPackage === option.value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                        : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-2xl font-bold mt-2">{option.price}</div>
                    <div className="text-xs text-gray-500 mt-1">{option.sessions}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-icons-round text-amber-600">event_available</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Horario de clases</h4>
                  <p className="text-sm text-gray-500">Define instructor, horario, periodo y dias de asistencia.</p>
                </div>
              </div>

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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de clase *
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Vigencia</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">30 dias desde la fecha de inicio</div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-amber-700 font-semibold">Horario elegido</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">
                    {formData.timeBlockId
                      ? `${timeBlocks.find(b => b.id === formData.timeBlockId)?.horaInicio} - ${timeBlocks.find(b => b.id === formData.timeBlockId)?.horaFin}`
                      : 'Pendiente'}
                  </div>
                </div>
              </div>
              <div className="mt-5">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Dias de la semana *
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
                  Patron: {generatePatternDescription()}
                </div>
              </div>
            </section>

            <section className="bg-white border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (opcional)
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({...formData, notas: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                rows="2"
                placeholder="Observaciones internas sobre estas clases..."
              />
            </section>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Resumen</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Alumno:</span>{' '}
                  {formData.studentId ? students.find(s => s.id === formData.studentId)?.nombre : 'No seleccionado'}
                </div>
                <div>
                  <span className="font-medium">Paquete:</span>{' '}
                  {selectedPackage ? monthlyPackages.find(option => option.value === selectedPackage)?.label : 'No seleccionado'}
                </div>
                <div>
                  <span className="font-medium">Instructor:</span>{' '}
                  {formData.instructorId ? instructors.find(i => i.id === formData.instructorId)?.nombre : 'No seleccionado'}
                </div>
                <div>
                  <span className="font-medium">Periodo:</span>{' '}
                  {formData.startDate ? formatDate(formData.startDate) : 'No definido'} a {getEndDate() ? formatDate(getEndDate()) : 'No definido'}
                </div>
                <div>
                  <span className="font-medium">Dias:</span>{' '}
                  {formData.daysOfWeek.length > 0
                    ? formData.daysOfWeek.map(d => daysOfWeekOptions.find(day => day.value === d)?.short).join(', ')
                    : 'Ninguno'}
                </div>
                <div>
                  <span className="font-medium">Tipo:</span>{' '}
                  {classTypes.find(type => type.value === formData.classType)?.label}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-5 py-2 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg flex items-center justify-center gap-2"
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <span className="material-icons-round animate-spin">refresh</span>
                    Creando horarios...
                  </>
                ) : (
                  <>
                    <span className="material-icons-round">add_circle</span>
                    Registrar clases
                  </>
                )}
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
                Mostrando {filteredSlots.length} de {pagination.total || slots.length} slots
                {Object.values(filters).some(f => f) && (
                  <span className="ml-2 text-blue-600">
                    (filtrados)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page <= 1 || loading}
                  className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-gray-600">
                  Pagina {pagination.page} de {pagination.pages || 1}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={!pagination.hasMore || loading}
                  className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
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


