
import { useState, useEffect } from 'react';
import { timeBlockService } from '../../services/api';

/* =========================
   UTILIDADES (HORAS)
========================= */

const extractHHMM = (iso) => {
  if (!iso) return '';
  return iso.substring(11, 16);
};

const toMinutes = (hhmm) => {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export default function TimeBlocksCRUD() {
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    horaInicio: '', 
    horaFin: '',
    duracion: 0 
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  /* =========================
     FETCH
  ========================= */

  useEffect(() => {
    fetchTimeBlocks();
  }, []);

  const fetchTimeBlocks = async () => {
    try {
      setLoading(true);
      const res = await timeBlockService.getAll();
      setTimeBlocks(res.data);
    } catch (e) {
      alert('Error al cargar bloques horarios');
      console.error('Error fetching time blocks:', e);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     VALIDACIÓN
  ========================= */

  const validateForm = () => {
    const errors = {};
    
    if (!formData.horaInicio) {
      errors.horaInicio = 'Hora de inicio es requerida';
    }
    
    if (!formData.horaFin) {
      errors.horaFin = 'Hora de fin es requerida';
    }
    
    if (formData.horaInicio && formData.horaFin) {
      const startMinutes = toMinutes(formData.horaInicio);
      const endMinutes = toMinutes(formData.horaFin);
      
      if (endMinutes <= startMinutes) {
        errors.horaFin = 'La hora de fin debe ser mayor que la hora de inicio';
      }
      
      // Validar que no se superponga con otros bloques (excepto el que se está editando)
      const isOverlapping = timeBlocks.some(block => {
        if (editingId && block.id === editingId) return false;
        
        const blockStart = toMinutes(block.horaInicio);
        const blockEnd = toMinutes(block.horaFin);
        
        return (
          (startMinutes >= blockStart && startMinutes < blockEnd) ||
          (endMinutes > blockStart && endMinutes <= blockEnd) ||
          (startMinutes <= blockStart && endMinutes >= blockEnd)
        );
      });
      
      if (isOverlapping) {
        errors.overlap = 'Este horario se superpone con otro bloque existente';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* =========================
     CRUD - COMPLETO
  ========================= */

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este bloque horario?')) return;
    
    try {
      await timeBlockService.delete(id);
      setTimeBlocks(timeBlocks.filter(t => t.id !== id));
      alert('Bloque horario eliminado correctamente');
    } catch (error) {
      console.error('Error deleting time block:', error);
      alert('Error al eliminar el bloque horario');
    }
  };

  const handleEdit = (block) => {
    setFormData({
      horaInicio: block.horaInicio,
      horaFin: block.horaFin,
      duracion: toMinutes(block.horaFin) - toMinutes(block.horaInicio)
    });
    setEditingId(block.id);
    setShowForm(true);
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulario
    if (!validateForm()) {
      return;
    }

    const payload = {
      horaInicio: formData.horaInicio,
      horaFin: formData.horaFin
    };

    try {
      setLoading(true);
      let updatedBlock;

          if (editingId) {
        // Editar bloque existente
        const res = await timeBlockService.update(editingId, payload);
        updatedBlock = res.data;
        
        // Actualizar el bloque en el estado
        setTimeBlocks(timeBlocks.map(block => 
          block.id === editingId ? updatedBlock : block
        ));
      } else {
        // Crear nuevo bloque
        const res = await timeBlockService.create(payload);
        updatedBlock = res.data;
        setTimeBlocks([...timeBlocks, updatedBlock]);
      }

      resetForm();
    } catch (error) {
      alert(`Error al ${editingId ? 'actualizar' : 'crear'} bloque: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      horaInicio: '', 
      horaFin: '',
      duracion: 0 
    });
    setEditingId(null);
    setShowForm(false);
    setFormErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Calcular duración automáticamente
      if (newData.horaInicio && newData.horaFin) {
        const duration = toMinutes(newData.horaFin) - toMinutes(newData.horaInicio);
        newData.duracion = duration > 0 ? duration : 0;
      }
      
      return newData;
    });
    
    // Limpiar error específico cuando el usuario empieza a escribir
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  /* =========================
     COMPONENTE
  ========================= */

  return (
    <div className="bg-white rounded-xl shadow-lg border">
      
      {/* HEADER CON ESTILO MEJORADO */}
      <div className="p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Gestión de Bloques Horarios</h2>
            <p className="text-gray-600">Administra los horarios disponibles para clases</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ horaInicio: '', horaFin: '' });
                setShowForm(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <span className="material-icons">schedule</span>
              Nuevo Bloque
            </button>
            <button 
              onClick={fetchTimeBlocks}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              disabled={loading}
            >
              <span className={`material-icons ${loading ? 'animate-spin' : ''}`}>
                {loading ? 'refresh' : 'refresh'}
              </span>
              Refrescar
            </button>
          </div>
        </div>
      </div>

      {/* FORMULARIO CON ESTILO MEJORADO */}
      {showForm && (
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900">
              {editingId ? '✏️ Editar Bloque Horario' : '➕ Nuevo Bloque Horario'}
            </h3>
            <button 
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200"
            >
              <span className="material-icons">close</span>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* HORA INICIO */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de inicio *
              </label>
              <input
                type="time"
                value={formData.horaInicio}
                onChange={e => handleInputChange('horaInicio', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                  formErrors.horaInicio ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {formErrors.horaInicio && (
                <p className="mt-1 text-sm text-red-600">{formErrors.horaInicio}</p>
              )}
            </div>
            
            {/* HORA FIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de fin *
              </label>
              <input
                type="time"
                value={formData.horaFin}
                onChange={e => handleInputChange('horaFin', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                  formErrors.horaFin ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {formErrors.horaFin && (
                <p className="mt-1 text-sm text-red-600">{formErrors.horaFin}</p>
              )}
            </div>
            
            {/* INFORMACIÓN Y ERRORES */}
            <div className="md:col-span-2">
              {formErrors.overlap && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-200 mb-3">
                  <div className="flex items-center gap-2 text-red-700">
                    <span className="material-icons text-sm">warning</span>
                    <span className="text-sm font-medium">Conflicto de horario</span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">{formErrors.overlap}</p>
                </div>
              )}
              
              <div className={`p-3 rounded-lg border ${
                formData.horaInicio && formData.horaFin && formData.duracion > 0 
                  ? 'bg-green-50 border-green-100' 
                  : 'bg-blue-50 border-blue-100'
              }`}>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="material-icons text-sm">info</span>
                  <span className="text-sm font-medium">Información del bloque</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {formData.horaInicio && formData.horaFin ? (
                    <>
                      <strong>Duración:</strong> {formData.duracion} minutos
                      <br />
                      <strong>Horario:</strong> {formData.horaInicio} - {formData.horaFin}
                    </>
                  ) : (
                    'Ingresa ambas horas para calcular la duración'
                  )}
                </p>
                {editingId && (
                  <p className="text-sm text-amber-600 mt-1 font-medium">
                    Estás editando un bloque existente. Los cambios se guardarán inmediatamente.
                  </p>
                )}
              </div>
            </div>
            
            {/* BOTONES */}
            <div className="md:col-span-2 flex justify-end gap-3 pt-4">
              <button
                type="submit"
                className={`px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                disabled={loading}
              >
                <span className="material-icons">
                  {editingId ? 'save' : 'add_circle'}
                </span>
                {loading ? 'Procesando...' : editingId ? 'Guardar cambios' : 'Crear bloque'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-5 py-2 rounded-lg"
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABLA CON ESTILO MEJORADO */}
    
      {loading && !showForm ? (
        <div className="p-8 text-center">
          <span className="material-icons animate-spin text-4xl text-indigo-500">refresh</span>
          <p className="mt-2 text-gray-600">Cargando bloques horarios...</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hora Inicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hora Fin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duración
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeBlocks.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      <span className="material-icons text-4xl text-gray-300 mb-2">schedule</span>
                      <p className="text-lg">No hay bloques horarios creados</p>
                      <p className="text-sm mt-1">Crea tu primer bloque horario usando el botón "Nuevo Bloque"</p>
                    </td>
                  </tr>
                ) : (
                  timeBlocks.map(block => {
                    const start = block.horaInicio;
                    const end = block.horaFin;
                    const duration = toMinutes(end) - toMinutes(start);
                    
                    return (
                      <tr key={block.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold mr-3">
                              <span className="material-icons text-sm">schedule</span>
                            </div>
                            <div className="font-mono font-medium text-gray-900">
                              {start}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono font-medium text-gray-900">
                            {end}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                            duration < 30 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : duration < 60 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {duration} minutos
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {/* BOTÓN EDITAR */}
                            <button
                              onClick={() => handleEdit(block)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
                              title="Editar bloque"
                            >
                              <span className="material-icons text-lg">edit</span>
                            </button>
                            
                            {/* BOTÓN ELIMINAR */}
                            <button
                              onClick={() => handleDelete(block.id)}
                              className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors border border-red-200"
                              title="Eliminar bloque"
                            >
                              <span className="material-icons text-lg">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* FOOTER DE LA TABLA */}
          {timeBlocks.length > 0 && (
            <div className="px-6 py-4 border-t bg-gray-50">
              <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="text-sm text-gray-600">
                  Mostrando <span className="font-semibold">{timeBlocks.length}</span> bloques horarios
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Duración promedio:</span>{' '}
                  {timeBlocks.length > 0 
                    ? `${Math.round(timeBlocks.reduce((acc, block) => 
                        acc + (toMinutes(block.horaFin) - toMinutes(block.horaInicio)), 0) / timeBlocks.length
                      )} minutos` 
                    : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Horario total cubierto:</span>{' '}
                  {timeBlocks.length > 0 
                    ? `${Math.round(timeBlocks.reduce((acc, block) => 
                        acc + (toMinutes(block.horaFin) - toMinutes(block.horaInicio)), 0) / 60
                      )} horas` 
                    : 'N/A'}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

