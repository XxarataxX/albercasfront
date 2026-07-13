import { useState, useEffect, useRef } from 'react';
import { instructorService, poolService } from '../../services/api';
import Alert from '../ui/Alert';

export default function InstructorsCRUD() {
  const [instructors, setInstructors] = useState([]);
  const [pools, setPools] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    nombre: '', 
    poolId: '', 
    activo: true 
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [alert, setAlert] = useState({
  message: '',
  type: 'info',
})
  // Cargar datos
  useEffect(() => {
    fetchData();
  }, []);

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

  

  const alertTimeoutRef = useRef(null);

  const fetchPools = async () => {
    try {
      setLoading(true);
      const response = await poolService.getAll();
      setPools(response.data);
    } catch (error) {
      console.error('Error al cargar albercas:', error);
      showAlert('Error al cargar albercas: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };



  const fetchData = async () => {
    try {
      setLoading(true);
      const [instructorsRes, poolsRes] = await Promise.all([
        instructorService.getAll(),
        poolService.getAll()
      ]);
      
      setInstructors(instructorsRes.data);
      setPools(poolsRes.data.filter(p => p.activo));
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showAlert('Error al cargar datos: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este instructor?')) return;
    
    try {
      await instructorService.delete(id);
      setInstructors(instructors.filter(i => i.id !== id));
      showAlert('Instructor eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar instructor:', error);
      showAlert('Error al eliminar el instructor: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (instructor) => {
    setFormData({
      nombre: instructor.nombre,
      poolId: instructor.poolId,
      activo: instructor.activo
    });
    setEditingId(instructor.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        const response = await instructorService.update(editingId, formData);
        setInstructors(instructors.map(i => i.id === editingId ? response.data : i));
        showAlert('Instructor actualizado');
      } else {
        const response = await instructorService.create(formData);
        setInstructors([...instructors, response.data]);
        showAlert('Instructor creado');
      }
      
      resetForm();
    } catch (error) {
      console.error('Error al guardar instructor:', error);
      showAlert('Error al guardar el instructor: ' + (error.response?.data?.error || error.message));
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', poolId: '', activo: true });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    
    <div className="bg-white rounded-xl shadow-lg border">
            <div className="p-6">
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ message: '', type: 'info' })}
        />
      </div>
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Gestión de Instructores</h2>
            <p className="text-gray-600">Administra los maestros de natación</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <span className="material-icons">add</span>
              Nuevo Instructor
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
      </div>

      {showForm && (
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">
              {editingId ? 'Editar Instructor' : 'Nuevo Instructor'}
            </h3>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <span className="material-icons">close</span>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alberca asignada *
              </label>
              <select
                value={formData.poolId}
                onChange={(e) => setFormData({...formData, poolId: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar alberca</option>
                {pools.map(pool => (
                  <option key={pool.id} value={pool.id}>{pool.nombre}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Activo</span>
              </label>
            </div>
            
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg flex items-center gap-2"
                disabled={loading}
              >
                <span className="material-icons">{editingId ? 'save' : 'add'}</span>
                {editingId ? 'Guardar cambios' : 'Crear instructor'}
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
          <span className="material-icons animate-spin text-4xl text-blue-500">refresh</span>
          <p className="mt-2 text-gray-600">Cargando instructores...</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alberca</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {instructors.map((instructor) => (
                  <tr key={instructor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3">
                          {instructor.nombre.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{instructor.nombre}</div>
                          <div className="text-xs text-gray-500">ID: {instructor.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`h-3 w-3 rounded-full mr-2 ${
                          instructor.poolId ? 'bg-blue-500' : 'bg-gray-300'
                        }`}></div>
                        <span className="text-sm font-medium">
                          {instructor.pool?.nombre || 'Sin asignar'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        instructor.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {instructor.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {new Date(instructor.createdAt).toLocaleDateString('en-CA')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(instructor)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        >
                          <span className="material-icons text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(instructor.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        >
                          <span className="material-icons text-lg">delete</span>
                        </button>
                        <a
                          href={`/pantalla/${instructor.poolId}`}
                          className="text-emerald-600 hover:text-emerald-900 p-1 rounded hover:bg-emerald-50"
                          title="Ver en pantalla"
                        >
                          <span className="material-icons text-lg">visibility</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Mostrando {instructors.length} instructores
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{instructors.filter(i => i.activo).length}</span> activos /{' '}
                <span className="font-medium">{instructors.filter(i => !i.activo).length}</span> inactivos
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}