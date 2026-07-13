import { useState, useEffect, useRef } from 'react';
import { studentService } from '../../services/api';

export default function StudentsCRUD() {
  const [confirmModal, setConfirmModal] = useState({ 
  show: false, 
  student: null, 
  tipo: 'baja'
});
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    nombre: '', 
    edad: '', 
    telefonoContacto: '', 
    nombreTutor: '', 
    notas: '',
    activo: true 
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

     const [alert, setAlert] = useState({
  message: '',
  type: 'info',
})

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


  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentService.getAll();
      setStudents(response.data);
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
      showAlert('Error al cargar estudiantes: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este estudiante?')) return;
    
    try {
      await studentService.delete(id);
      setStudents(students.filter(s => s.id !== id));
      showAlert('Estudiante eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar estudiante:', error);
      showAlert('Error al eliminar el estudiante: ' + (error.response?.data?.error || error.message));
    }
  };

// En StudentsCRUD.jsx
const handleBajaTotal = (student) => {
  setConfirmModal({ show: true, student: student, tipo: 'baja' });
};

// Esta es la función que REALMENTE hace el trabajo cuando el usuario da click en "Sí, confirmar"
const confirmDeactivation = async () => {
  const student = confirmModal.student;
  try {
    setLoading(true);
    // Limpiamos datos para evitar el error 500 que tenías antes
    const { _count, createdAt, updatedAt, slots, programas, ...datosLimpios } = student;
    
    await studentService.update(student.id, { 
      ...datosLimpios,
      activo: false 
    });
    
    setConfirmModal({ show: false, student: null }); // Cerramos modal
    fetchStudents(); 
    showAlert(`Se ha dado de baja a ${student.nombre} y se limpió su agenda`, 'success');
  } catch (error) {
    showAlert('Error al procesar la baja', 'error');
  } finally {
    setLoading(false);
  }
};

const handleReactivar = (student) => {
  setConfirmModal({ 
    show: true, 
    student: student, 
    tipo: 'reactivar' 
  });
};

const handleConfirmAction = async () => {
  const { student, tipo } = confirmModal;
  if (!student) return;

  try {
    setLoading(true);
    
    // Mantenemos tu lógica de limpieza exacta
    const { _count, createdAt, updatedAt, slots, programas, ...datosLimpios } = student;
    
    // Determinamos el nuevo estado: si el tipo es 'reactivar' mandamos true
    const nuevoEstado = tipo === 'reactivar';

    await studentService.update(student.id, { 
      ...datosLimpios,
      activo: nuevoEstado 
    });
    
    // Éxito
    setConfirmModal({ show: false, student: null, tipo: 'baja' });
    fetchStudents(); // Recarga la lista igual que antes
    
    const mensajeOk = tipo === 'reactivar' 
      ? 'Alumno reactivado correctamente' 
      : 'Alumno dado de baja y agenda liberada';
      
    showAlert(mensajeOk, 'success');
  } catch (error) {
    console.error(`Error al ${tipo}:`, error);
    showAlert(`Error al ${tipo === 'reactivar' ? 'reactivar' : 'procesar la baja'}`, 'error');
  } finally {
    setLoading(false);
  }
};

  const handleEdit = (student) => {
    setFormData({
      nombre: student.nombre,
      edad: student.edad || '',
      telefonoContacto: student.telefonoContacto || '',
      nombreTutor: student.nombreTutor || '',
      notas: student.notas || '',
      activo: student.activo
    });
    setEditingId(student.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const dataToSend = {
        ...formData,
        edad: formData.edad ? parseInt(formData.edad) : null,
      };
      
      if (editingId) {
        const response = await studentService.update(editingId, dataToSend);
        setStudents(students.map(s => s.id === editingId ? response.data : s));
        showAlert('Estudiante actualizado');
      } else {
        const response = await studentService.create(dataToSend);
        setStudents([...students, response.data]);
        showAlert('Estudiante creado');
      }
      
      resetForm();
    } catch (error) {
      console.error('Error al guardar estudiante:', error);
      showAlert('Error al guardar el estudiante: ' + (error.response?.data?.error || error.message));
    }
  };

  const resetForm = () => {
    setFormData({ 
      nombre: '', 
      edad: '', 
      telefonoContacto: '', 
      nombreTutor: '', 
      notas: '',
      activo: true 
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border">
      <div className="p-6 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Gestión de Estudiantes</h2>
            <p className="text-gray-600">Administra los alumnos del sistema</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <span className="material-icons">person_add</span>
              Nuevo Estudiante
            </button>
            <button 
              onClick={fetchStudents}
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
              {editingId ? 'Editar Estudiante' : 'Nuevo Estudiante'}
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
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Edad
              </label>
              <input
                type="number"
                min="0"
                max="99"
                value={formData.edad}
                onChange={(e) => setFormData({...formData, edad: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Ej: 12"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono de contacto
              </label>
              <input
                type="tel"
                value={formData.telefonoContacto}
                onChange={(e) => setFormData({...formData, telefonoContacto: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Ej: 555-1234"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del tutor
              </label>
              <input
                type="text"
                value={formData.nombreTutor}
                onChange={(e) => setFormData({...formData, nombreTutor: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Ej: María García"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({...formData, notas: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                rows="2"
                placeholder="Información adicional..."
              />
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
                {editingId ? 'Guardar cambios' : 'Crear estudiante'}
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
          <span className="material-icons animate-spin text-4xl text-emerald-500">refresh</span>
          <p className="mt-2 text-gray-600">Cargando estudiantes...</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Edad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold mr-3">
                          {student.nombre.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{student.nombre}</div>
                          <div className="text-xs text-gray-500">ID: {student.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {student.edad ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                          {student.edad} años
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">No especificada</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {student.telefonoContacto || 'Sin teléfono'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {student.nombreTutor || 'Sin tutor'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {student.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(student)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        >
                          <span className="material-icons text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        >
                          <span className="material-icons text-lg">delete</span>
                        </button>

                        {/* NUEVO BOTÓN: BAJA TOTAL */}
   {student.activo ? (
      /* SI ESTÁ ACTIVO: Mostrar botón para DAR DE BAJA */
      <button
        onClick={() => handleBajaTotal(student)}
        className="text-orange-600 hover:text-orange-900"
        title="Dar de baja y liberar clases"
      >
        <span className="material-icons text-lg">person_off</span>
      </button>
    ) : (
      /* SI ESTÁ INACTIVO: Mostrar botón para REACTIVAR */
      <button
        onClick={() => handleReactivar(student)}
        className="text-green-600 hover:text-green-900"
        title="Reactivar alumno"
      >
        <span className="material-icons text-lg">person_add</span>
      </button>
    )}
                       
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
                Mostrando {students.length} estudiantes
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{students.filter(s => s.activo).length}</span> activos /{' '}
                <span className="font-medium">{students.filter(s => !s.activo).length}</span> inactivos
              </div>
            </div>
          </div>
        </>
      )}
      {/* MODAL DE CONFIRMACIÓN PERSONALIZADO */}
{confirmModal.show && (
  <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-100">
      <div className={`flex items-center gap-3 mb-4 ${
        confirmModal.tipo === 'reactivar' ? 'text-green-600' : 'text-orange-600'
      }`}>
        <span className="material-icons text-3xl">
          {confirmModal.tipo === 'reactivar' ? 'person_add' : 'warning'}
        </span>
        <h3 className="text-xl font-bold">
          {confirmModal.tipo === 'reactivar' ? 'Reactivar Alumno' : 'Confirmar Baja'}
        </h3>
      </div>
      
      <p className="text-gray-600 mb-6">
        {confirmModal.tipo === 'reactivar' 
          ? `¿Deseas reactivar a ${confirmModal.student?.nombre}? Podrás asignarle clases nuevamente.`
          : `¿Estás seguro de dar de baja a ${confirmModal.student?.nombre}? Se eliminarán sus clases futuras.`
        }
      </p>
      
      <div className="flex gap-3">
        <button
          onClick={() => setConfirmModal({ show: false, student: null })}
          className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
        >
          Cancelar
        </button>
       <button
  onClick={handleConfirmAction} // <--- Esta es la que dispara la lógica de arriba
  className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${
    confirmModal.tipo === 'reactivar' ? 'bg-green-600' : 'bg-orange-600'
  }`}
>
  {confirmModal.tipo === 'reactivar' ? 'Reactivar' : 'Dar de Baja'}
</button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}