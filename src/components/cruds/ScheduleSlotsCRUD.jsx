import { useState, useEffect } from 'react';
import { slotService, instructorService, studentService, timeBlockService } from '../../services/api';

export default function ScheduleSlotsCRUD() {
  const [slots, setSlots] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [students, setStudents] = useState([]);
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [filters, setFilters] = useState({
    fecha: new Date().toLocaleDateString('en-CA').split('T')[0],
    instructorId: '',
    status: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    fecha: new Date().toISOString().split('T')[0],
    classType: 'C',
    status: 'disponible',
    notas: '',
    instructorId: '',
    timeBlockId: '',
    studentId: ''
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const classTypes = [
    { value: 'P', label: 'Clase de Prueba' },
    { value: 'C', label: 'Clase Suelta' },
    { value: 'R', label: 'Reposición' },
    { value: 'F', label: 'Clase Fija' }
  ];

  const slotStatuses = [
    { value: 'disponible', label: 'Disponible' },
    { value: 'reservado', label: 'Reservado' },
    { value: 'confirmado', label: 'Confirmado' },
    { value: 'no_vino', label: 'No Vino' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

  useEffect(() => {
    fetchData();
  }, [filters.fecha]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const params = {};
      if (filters.fecha) params.fecha = filters.fecha;
      if (filters.instructorId) params.instructorId = filters.instructorId;
      if (filters.status) params.status = filters.status;
      
      const [slotsRes, instructorsRes, studentsRes, timeBlocksRes] = await Promise.all([
        slotService.getAll(params),
        instructorService.getAll({ activo: true }),
        studentService.getAll(),
        timeBlockService.getAll()
      ]);
      
      setSlots(slotsRes.data);
      setInstructors(instructorsRes.data);
      setStudents(studentsRes.data);
      setTimeBlocks(timeBlocksRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showAlert('Error al cargar datos: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este horario?')) return;
    
    try {
      await slotService.delete(id);
      setSlots(slots.filter(s => s.id !== id));
      showAlert('Horario eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar horario:', error);
      showAlert('Error al eliminar el horario: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (slot) => {
    setFormData({
      fecha: new Date(slot.fecha).toISOString().split('T')[0],
      classType: slot.classType,
      status: slot.status,
      notas: slot.notas || '',
      instructorId: slot.instructorId,
      timeBlockId: slot.timeBlockId,
      studentId: slot.studentId || ''
    });
    setEditingId(slot.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const fechaDate = new Date(formData.fecha);
      fechaDate.setHours(12, 0, 0, 0);
      
      const dataToSend = {
        ...formData,
        fecha: fechaDate.toISOString(),
        studentId: formData.studentId || null
      };
      
      if (editingId) {
        const response = await slotService.update(editingId, dataToSend);
        setSlots(slots.map(s => s.id === editingId ? response.data : s));
        showAlert('Horario actualizado');
      } else {
        const response = await slotService.create(dataToSend);
        setSlots([...slots, response.data]);
        showAlert('Horario creado');
      }
      
      resetForm();
    } catch (error) {
      console.error('Error al guardar horario:', error);
      showAlert('Error al guardar el horario: ' + (error.response?.data?.error || error.message));
    }
  };

  const resetForm = () => {
    setFormData({ 
      fecha: new Date().toISOString().split('T')[0],
      classType: 'C',
      status: 'disponible',
      notas: '',
      instructorId: '',
      timeBlockId: '',
      studentId: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const getClassTypeColor = (type) => {
    switch (type) {
      case 'P': return 'bg-purple-100 text-purple-800';
      case 'C': return 'bg-amber-100 text-amber-800';
      case 'R': return 'bg-indigo-100 text-indigo-800';
      case 'F': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'disponible': return 'bg-green-100 text-green-800';
      case 'reservado': return 'bg-yellow-100 text-yellow-800';
      case 'confirmado': return 'bg-blue-100 text-blue-800';
      case 'no_vino': return 'bg-red-100 text-red-800';
      case 'cancelado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border">
      <div className="p-6 border-b bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Gestión de Horarios</h2>
            <p className="text-gray-600">Administra el calendario de clases</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowForm(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <span className="material-icons">add_alarm</span>
              Nuevo Horario
            </button>
            <button 
              onClick={fetchData}
              className="bg-white border text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <span className="material-icons">refresh</span>
              Refrescar
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={filters.fecha}
              onChange={(e) => setFilters({...filters, fecha: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
            <select
              value={filters.instructorId}
              onChange={(e) => setFilters({...filters, instructorId: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Todos los instructores</option>
              {instructors.map(instructor => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Todos los estados</option>
              {slotStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">
              {editingId ? 'Editar Horario' : 'Nuevo Horario'}
            </h3>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <span className="material-icons">close</span>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructor *</label>
              <select
                value={formData.instructorId}
                onChange={(e) => setFormData({...formData, instructorId: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Seleccionar instructor</option>
                {instructors.map(instructor => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bloque Horario *</label>
              <select
                value={formData.timeBlockId}
                onChange={(e) => setFormData({...formData, timeBlockId: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Seleccionar bloque</option>
                {timeBlocks.map(block => {
                  const start = new Date(block.horaInicio);
                  const end = new Date(block.horaFin);
                  return (
                    <option key={block.id} value={block.id}>
                      {start.getHours().toString().padStart(2, '0')}:{start.getMinutes().toString().padStart(2, '0')} - 
                      {end.getHours().toString().padStart(2, '0')}:{end.getMinutes().toString().padStart(2, '0')}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Clase *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                {slotStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estudiante</label>
              <select
                value={formData.studentId}
                onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Sin estudiante</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({...formData, notas: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                rows="2"
                placeholder="Notas adicionales..."
              />
            </div>
            
            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg flex items-center gap-2"
                disabled={loading}
              >
                <span className="material-icons">{editingId ? 'save' : 'add'}</span>
                {editingId ? 'Guardar cambios' : 'Crear horario'}
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

      {loading ? (
        <div className="p-8 text-center">
          <span className="material-icons animate-spin text-4xl text-amber-500">refresh</span>
          <p className="mt-2 text-gray-600">Cargando horarios...</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instructor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {slots.map((slot) => {
                  const start = slot.timeBlock ? new Date(slot.timeBlock.horaInicio) : null;
                  const end = slot.timeBlock ? new Date(slot.timeBlock.horaFin) : null;
                  
                  return (
                    <tr key={slot.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium">{formatDate(slot.fecha)}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(slot.fecha).toLocaleDateString('es-ES')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{slot.instructor?.nombre}</div>
                        <div className="text-xs text-gray-500">
                          {slot.instructor?.pool?.nombre}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {start && end ? (
                          <div className="font-mono">
                            {start.getHours().toString().padStart(2, '0')}:{start.getMinutes().toString().padStart(2, '0')} - 
                            {end.getHours().toString().padStart(2, '0')}:{end.getMinutes().toString().padStart(2, '0')}
                          </div>
                        ) : (
                          <span className="text-gray-400">Sin horario</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {slot.student ? (
                          <div className="font-medium">{slot.student.nombre}</div>
                        ) : (
                          <span className="text-gray-400">Disponible</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getClassTypeColor(slot.classType)}`}>
                          {classTypes.find(t => t.value === slot.classType)?.label || slot.classType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(slot.status)}`}>
                          {slotStatuses.find(s => s.value === slot.status)?.label || slot.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(slot)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          >
                            <span className="material-icons text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(slot.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          >
                            <span className="material-icons text-lg">delete</span>
                          </button>
                          <button className="text-emerald-600 hover:text-emerald-900 p-1 rounded hover:bg-emerald-50">
                            <span className="material-icons text-lg">check_circle</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Mostrando {slots.length} horarios para {formatDate(filters.fecha)}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{slots.filter(s => s.status === 'disponible').length}</span> disponibles /{' '}
                <span className="font-medium">{slots.filter(s => s.status === 'reservado').length}</span> reservados /{' '}
                <span className="font-medium">{slots.filter(s => s.status === 'confirmado').length}</span> confirmados
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}