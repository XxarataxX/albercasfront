import { useState, useEffect, useRef } from 'react';
import { studentService, extractList, extractPagination } from '../../services/api';


const STUDENTS_PAGE_SIZE = 20;

export default function StudentsCRUD() {
  const [confirmModal, setConfirmModal] = useState({ 
  show: false, 
  student: null, 
  tipo: 'baja'
});
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: STUDENTS_PAGE_SIZE,
    total: 0,
    pages: 1,
    hasMore: false
  });
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
    fetchStudents(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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


  const fetchStudents = async (page = pagination.page, pageSize = pagination.pageSize) => {
    try {
      setLoading(true);
      const response = await studentService.getAll({ page, pageSize });
      const list = extractList(response.data, 'students');
      setStudents(list);
      setPagination({
        ...extractPagination(response.data, list.length),
        pageSize
      });
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
      showAlert('Error al cargar estudiantes: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (page) => {
    const nextPage = Math.max(1, Math.min(page, pagination.pages || 1));
    fetchStudents(nextPage, pagination.pageSize);
  };

  const packageStateLabels = {
    initial_payment_pending: 'Primer pago pendiente',
    active: 'Activo',
    renewal_pending: 'Renovacion pendiente',
    overdue_first_surcharge: '1er recargo',
    overdue_second_surcharge: '2do recargo',
    cancelled: 'Cancelado'
  };

  const packageStateClasses = {
    initial_payment_pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-emerald-100 text-emerald-800',
    renewal_pending: 'bg-blue-100 text-blue-800',
    overdue_first_surcharge: 'bg-orange-100 text-orange-800',
    overdue_second_surcharge: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-700'
  };

  const getOpenPackagePeriod = (student) => student.openPackagePeriod || student.open_package_period || null;

  const handleDelete = async (id) => {
    if (!window.confirm('Ãƒâ€šÃ‚Â¿EstÃƒÆ’Ã‚Â¡ seguro de eliminar este estudiante?')) return;
    
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
    
    // Mantenemos tu lÃƒÆ’Ã‚Â³gica de limpieza exacta
    const { _count, createdAt, updatedAt, slots, programas, ...datosLimpios } = student;
    
    // Determinamos el nuevo estado: si el tipo es 'reactivar' mandamos true
    const nuevoEstado = tipo === 'reactivar';

    await studentService.update(student.id, { 
      ...datosLimpios,
      activo: nuevoEstado 
    });
    
    // ÃƒÆ’Ã¢â‚¬Â°xito
    setConfirmModal({ show: false, student: null, tipo: 'baja' });
    fetchStudents(pagination.page); // Recarga la lista igual que antes
    
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
        await studentService.create(dataToSend);
        fetchStudents(1);
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
      <div className="p-6 border-b bg-gradient-to-r from-sky-50 via-cyan-50 to-emerald-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Alumnos</h2>
            <p className="text-gray-600">Alta y administracion de alumnos por sucursal</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowForm(true)}
              className="bg-cyan-700 hover:bg-cyan-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm"
            >
              <span className="material-icons">person_add</span>
              Nuevo alumno
            </button>
            <button 
              onClick={() => fetchStudents(pagination.page)}
              className="bg-white border text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <span className="material-icons">refresh</span>
              Refrescar
            </button>
          </div>
        </div>
      </div>

      {alert.message && (
        <div
          className={`mx-6 mt-4 rounded-lg border px-4 py-3 text-sm ${
            alert.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : alert.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {alert.message}
        </div>
      )}

      {showForm && (
        <div className="p-6 border-b bg-slate-50">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                {editingId ? 'Editar registro' : 'Alta de alumno'}
              </p>
              <h3 className="text-lg font-bold text-gray-900">
                {editingId ? 'Actualizar datos del alumno' : 'Registrar nuevo alumno'}
              </h3>
              <p className="text-sm text-gray-600">
                Captura solo datos operativos. Los datos fiscales se solicitan aparte si el cliente los necesita.
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full p-2 text-gray-500 hover:bg-white hover:text-gray-800"
              aria-label="Cerrar formulario"
            >
              <span className="material-icons">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <section className="rounded-lg border bg-white p-4">
              <div className="mb-4 flex items-center gap-2 text-cyan-800">
                <span className="material-icons">school</span>
                <h4 className="font-semibold text-gray-900">Datos del alumno</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Nombre y apellidos del alumno"
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
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Ej. 6"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-white p-4">
              <div className="mb-4 flex items-center gap-2 text-cyan-800">
                <span className="material-icons">contact_phone</span>
                <h4 className="font-semibold text-gray-900">Contacto principal</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del tutor
                  </label>
                  <input
                    type="text"
                    value={formData.nombreTutor}
                    onChange={(e) => setFormData({...formData, nombreTutor: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Madre, padre o responsable"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefono de contacto
                  </label>
                  <input
                    type="tel"
                    value={formData.telefonoContacto}
                    onChange={(e) => setFormData({...formData, telefonoContacto: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="10 digitos"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-white p-4">
              <div className="mb-4 flex items-center gap-2 text-cyan-800">
                <span className="material-icons">notes</span>
                <h4 className="font-semibold text-gray-900">Notas internas</h4>
              </div>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({...formData, notas: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                rows="3"
                placeholder="Notas medicas, observaciones o comentarios de recepcion"
              />
            </section>

            {editingId && (
              <label className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Alumno activo</span>
              </label>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={resetForm}
                className="bg-white border hover:bg-gray-50 text-gray-800 px-5 py-2 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-cyan-700 hover:bg-cyan-800 text-white px-5 py-2 rounded-lg flex items-center justify-center gap-2 font-medium shadow-sm"
                disabled={loading}
              >
                <span className="material-icons">{editingId ? 'save' : 'add'}</span>
                {editingId ? 'Guardar cambios' : 'Crear alumno'}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paquete</th>
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
                          {student.edad} aÃƒÆ’Ã‚Â±os
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">No especificada</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {student.telefonoContacto || 'Sin telÃƒÆ’Ã‚Â©fono'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {student.nombreTutor || 'Sin tutor'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getOpenPackagePeriod(student) ? (
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-gray-800">
                            {getOpenPackagePeriod(student).package_label || 'Paquete mensual'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getOpenPackagePeriod(student).invoice_name || 'Sin factura'}
                          </div>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            packageStateClasses[getOpenPackagePeriod(student).state] || 'bg-gray-100 text-gray-700'
                          }`}>
                            {packageStateLabels[getOpenPackagePeriod(student).state] || getOpenPackagePeriod(student).state || 'Pendiente'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Sin paquete</span>
                      )}
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

                        {/* NUEVO BOTÃƒÆ’Ã¢â‚¬Å“N: BAJA TOTAL */}
   {student.activo ? (
      /* SI ESTÃƒÆ’Ã‚Â ACTIVO: Mostrar botÃƒÆ’Ã‚Â³n para DAR DE BAJA */
      <button
        onClick={() => handleBajaTotal(student)}
        className="text-orange-600 hover:text-orange-900"
        title="Dar de baja y liberar clases"
      >
        <span className="material-icons text-lg">person_off</span>
      </button>
    ) : (
      /* SI ESTÃƒÆ’Ã‚Â INACTIVO: Mostrar botÃƒÆ’Ã‚Â³n para REACTIVAR */
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
                Mostrando {students.length} de {pagination.total || students.length} estudiantes
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
              <div className="text-sm text-gray-600">
                <span className="font-medium">{students.filter(s => s.activo).length}</span> activos /{' '}
                <span className="font-medium">{students.filter(s => !s.activo).length}</span> inactivos
              </div>
            </div>
          </div>
        </>
      )}
      {/* MODAL DE CONFIRMACIÃƒÆ’Ã¢â‚¬Å“N PERSONALIZADO */}
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
          ? `Ãƒâ€šÃ‚Â¿Deseas reactivar a ${confirmModal.student?.nombre}? PodrÃƒÆ’Ã‚Â¡s asignarle clases nuevamente.`
          : `Ãƒâ€šÃ‚Â¿EstÃƒÆ’Ã‚Â¡s seguro de dar de baja a ${confirmModal.student?.nombre}? Se eliminarÃƒÆ’Ã‚Â¡n sus clases futuras.`
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
  onClick={handleConfirmAction} // <--- Esta es la que dispara la lÃƒÆ’Ã‚Â³gica de arriba
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

