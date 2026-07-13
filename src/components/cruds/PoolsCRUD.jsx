import { useState, useEffect, useRef } from 'react';
import { poolService } from '../../services/api';
import Alert from '../ui/Alert';



export default function PoolsCRUD() {

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


  const [pools, setPools] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    nombre: '', 
    ubicacion: '', 
    identificador: '',
    activo: true 
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [alert, setAlert] = useState({
  message: '',
  type: 'info',
})




  // Cargar pools del backend
  useEffect(() => {
    fetchPools();
  }, []);


  useEffect(() => {
  return () => {
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }
  };
}, []);
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

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta alberca?')) return;
    
    try {
      await poolService.delete(id);
      setPools(pools.filter(p => p.id !== id));
      showAlert('Alberca eliminada correctamente', 'warning');
    } catch (error) {
      console.error('Error al eliminar alberca:', error);
      showAlert('Error al eliminar la alberca: ' + (error.response?.data?.error || error.message), 'error');
    }
  };


  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const response = await poolService.update(id, { activo: !currentStatus });
      setPools(pools.map(p => p.id === id ? response.data : p));
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      showAlert('Error al actualizar estado: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  const handleEdit = (pool) => {
    setFormData({
      nombre: pool.nombre,
      ubicacion: pool.ubicacion || '',
      identificador: pool.identificador || '',
      activo: pool.activo
    });
    setEditingId(pool.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      
      if (editingId) {
        response = await poolService.update(editingId, formData);
        setPools(pools.map(p => p.id === editingId ? response.data : p));
        showAlert('Alberca actualizada', 'success');
      } else {
        response = await poolService.create(formData);
        setPools([...pools, response.data]);
        showAlert('Alberca creada correctamente', 'success');
      }
      
      resetForm();
    } catch (error) {
      console.error('Error al guardar alberca:', error);
      const errorMsg = error.response?.data?.error || error.message;
      if (errorMsg.includes('identificador') && errorMsg.includes('ya está en uso')) {
        showAlert('Error: El identificador ya está en uso. Por favor, usa otro.', 'error');
      } else {
        showAlert('Error al guardar la alberca: ' + errorMsg, 'info');
      }
    }
  };

  const resetForm = () => {
    setFormData({ 
      nombre: '', 
      ubicacion: '', 
      identificador: '',
      activo: true 
    });
    setEditingId(null);
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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
      <div className="p-6 border-b bg-gradient-to-r from-cyan-50 to-blue-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Gestión de Albercas</h2>
            <p className="text-gray-600">Administra las piscinas del sistema</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowForm(true)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <span className="material-icons-round">add_location</span>
              Nueva Alberca
            </button>
            <button 
              onClick={fetchPools}
              className="bg-white border text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <span className="material-icons-round">refresh</span>
              Refrescar
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">
              {editingId ? 'Editar Alberca' : 'Nueva Alberca'}
            </h3>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <span className="material-icons-round">close</span>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Alberca Principal"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identificador
              </label>
              <input
                type="text"
                value={formData.identificador}
                onChange={(e) => setFormData({...formData, identificador: e.target.value.toUpperCase()})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: ALB-001"
              />
              <div className="text-xs text-gray-500 mt-1">
                Código único para identificar la alberca (opcional)
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación
              </label>
              <input
                type="text"
                value={formData.ubicacion}
                onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Zona Norte, Planta Alta"
              />
            </div>
            
            <div className="flex items-center justify-between md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    id="activo-checkbox"
                  />
                  <label htmlFor="activo-checkbox" className="text-sm text-gray-700 select-none">
                    Activa
                  </label>
                </div>
                <div className="text-sm text-gray-500">
                  {formData.activo ? '✓ La alberca estará disponible' : '✗ La alberca estará deshabilitada'}
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="material-icons-round animate-spin">refresh</span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <span className="material-icons-round">{editingId ? 'save' : 'add'}</span>
                    {editingId ? 'Guardar cambios' : 'Crear alberca'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-5 py-2 rounded-lg transition-colors duration-200"
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center">
          <span className="material-icons-round animate-spin text-4xl text-blue-500">refresh</span>
          <p className="mt-2 text-gray-600">Cargando albercas...</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID / Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creada</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pools.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <span className="material-icons-round text-5xl mb-4">pool</span>
                        <p className="text-lg font-medium">No hay albercas registradas</p>
                        <p className="text-sm mt-1">Crea tu primera alberca usando el botón "Nueva Alberca"</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pools.map((pool) => (
                    <tr key={pool.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-xs font-mono text-gray-500 truncate max-w-[100px]" title={pool.id}>
                            ID: {pool.id.slice(0, 8)}...
                          </div>
                          {pool.identificador && (
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                <span className="material-icons-round text-xs mr-1">tag</span>
                                {pool.identificador}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{pool.nombre}</div>
                        {!pool.identificador && (
                          <div className="text-xs text-gray-500 italic">Sin identificador</div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {pool.ubicacion || (
                            <span className="text-gray-400 italic">Sin ubicación</span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(pool.id, pool.activo)}
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 ${
                            pool.activo 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-200'
                          }`}
                          title={pool.activo ? 'Hacer inactiva' : 'Hacer activa'}
                        >
                          <span className={`w-2 h-2 rounded-full mr-1.5 ${pool.activo ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {pool.activo ? 'Activa' : 'Inactiva'}
                        </button>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatDate(pool.createdAt)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(pool.createdAt).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(pool)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title="Editar"
                          >
                            <span className="material-icons-round text-lg">edit</span>
                          </button>
                          
                          <button
                            onClick={() => handleDelete(pool.id)}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Eliminar"
                          >
                            <span className="material-icons-round text-lg">delete</span>
                          </button>
                          
                         <a
  href={`/pantalla/${pool.identificador || pool.id}`}
  className="p-2 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors duration-200"
  title="Configurar pantalla"
>
  <span className="material-icons-round text-lg">settings</span>
</a>

                           <a
                            href={`/pantallaview/${pool.identificador || pool.id}`}
                            className="p-2 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors duration-200"
                            title="Ver en pantalla"
                          >
                            <span className="material-icons-round text-lg">tv</span>
                          </a>
                          
                          
                         
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pools.length > 0 && (
            <div className="px-6 py-4 border-t bg-gray-50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                  Mostrando <span className="font-semibold">{pools.length}</span> alberca{pools.length !== 1 ? 's' : ''}
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-600">
                      <span className="font-semibold">{pools.filter(p => p.activo).length}</span> activas
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs text-gray-600">
                      <span className="font-semibold">{pools.filter(p => !p.activo).length}</span> inactivas
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-gray-600">
                      <span className="font-semibold">{pools.filter(p => p.identificador).length}</span> con identificador
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}