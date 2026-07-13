import { useState } from 'react';

export default function PaymentsCRUD() {
  const [payments, setPayments] = useState([
    { id: 1, estudiante: 'Luis Martínez', concepto: 'Curso Iniciación', monto: 1200, fecha: '2024-10-20', metodo: 'Tarjeta', status: 'Pagado' },
    { id: 2, estudiante: 'Ana García', concepto: 'Clases Privadas', monto: 3000, fecha: '2024-10-21', metodo: 'Efectivo', status: 'Pagado' },
    { id: 3, estudiante: 'Carlos Rodríguez', concepto: 'Mensualidad Octubre', monto: 1800, fecha: '2024-10-22', metodo: 'Transferencia', status: 'Pendiente' },
    { id: 4, estudiante: 'María López', concepto: 'Inscripción', monto: 500, fecha: '2024-10-23', metodo: 'Tarjeta', status: 'Pagado' },
    { id: 5, estudiante: 'Sofía Torres', concepto: 'Curso Avanzado', monto: 2400, fecha: '2024-10-24', metodo: 'Efectivo', status: 'Vencido' },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    estudiante: '', 
    concepto: '', 
    monto: '',
    fecha: '',
    metodo: '',
    status: ''
  });

  const metodos = ['Efectivo', 'Tarjeta', 'Transferencia', 'Cheque'];
  const statuses = ['Pagado', 'Pendiente', 'Vencido', 'Cancelado'];

  const handleDelete = (id) => {
    if (window.confirm('¿Está seguro de eliminar este pago?')) {
      setPayments(payments.filter(p => p.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newPayment = {
      id: Math.max(...payments.map(p => p.id)) + 1,
      ...formData,
      monto: parseFloat(formData.monto)
    };
    setPayments([...payments, newPayment]);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ estudiante: '', concepto: '', monto: '', fecha: '', metodo: '', status: '' });
    setShowForm(false);
  };

  // Calcular totales
  const totalPagado = payments
    .filter(p => p.status === 'Pagado')
    .reduce((sum, p) => sum + p.monto, 0);
  
  const totalPendiente = payments
    .filter(p => p.status === 'Pendiente')
    .reduce((sum, p) => sum + p.monto, 0);

  return (
    <div className="bg-white rounded-xl shadow-lg border">
      <div className="p-6 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Gestión de Pagos</h2>
            <p className="text-gray-600">Control de pagos y facturación</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <span className="material-icons">payments</span>
              Nuevo Pago
            </button>
            <button className="bg-white border text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2">
              <span className="material-icons">receipt</span>
              Generar Reporte
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-sm text-gray-600">Total Recaudado</div>
            <div className="text-2xl font-bold text-emerald-600">${totalPagado.toLocaleString()}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-sm text-gray-600">Pendiente por Cobrar</div>
            <div className="text-2xl font-bold text-amber-600">${totalPendiente.toLocaleString()}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-sm text-gray-600">Total Pagos</div>
            <div className="text-2xl font-bold text-blue-600">{payments.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-sm text-gray-600">Tasa de Cobro</div>
            <div className="text-2xl font-bold text-green-600">
              {((payments.filter(p => p.status === 'Pagado').length / payments.length) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Registrar Pago</h3>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <span className="material-icons">close</span>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estudiante *</label>
              <select
                value={formData.estudiante}
                onChange={(e) => setFormData({...formData, estudiante: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Seleccionar estudiante</option>
                <option value="Luis Martínez">Luis Martínez</option>
                <option value="Ana García">Ana García</option>
                <option value="Carlos Rodríguez">Carlos Rodríguez</option>
                <option value="María López">María López</option>
                <option value="Sofía Torres">Sofía Torres</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Concepto *</label>
              <input
                type="text"
                value={formData.concepto}
                onChange={(e) => setFormData({...formData, concepto: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Ej: Mensualidad Octubre"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.monto}
                onChange={(e) => setFormData({...formData, monto: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="1200.00"
                required
              />
            </div>
            
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago *</label>
              <select
                value={formData.metodo}
                onChange={(e) => setFormData({...formData, metodo: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Seleccionar método</option>
                {metodos.map(metodo => (
                  <option key={metodo} value={metodo}>{metodo}</option>
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
                <option value="">Seleccionar estado</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg flex items-center gap-2">
                <span className="material-icons">save</span>
                Registrar Pago
              </button>
              <button type="button" onClick={resetForm} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-5 py-2 rounded-lg">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">#{payment.id}</td>
                <td className="px-6 py-4">
                  <div className="font-medium">{payment.estudiante}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">{payment.concepto}</div>
                </td>
                <td className="px-6 py-4">
                  <div className={`font-bold ${
                    payment.status === 'Pagado' ? 'text-green-700' :
                    payment.status === 'Pendiente' ? 'text-amber-700' :
                    'text-red-700'
                  }`}>
                    ${payment.monto.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">{payment.fecha}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    payment.metodo === 'Efectivo' ? 'bg-green-100 text-green-800' :
                    payment.metodo === 'Tarjeta' ? 'bg-blue-100 text-blue-800' :
                    payment.metodo === 'Transferencia' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {payment.metodo}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    payment.status === 'Pagado' ? 'bg-green-100 text-green-800' :
                    payment.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                    payment.status === 'Vencido' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800">
                      <span className="material-icons">receipt</span>
                    </button>
                    <button onClick={() => handleDelete(payment.id)} className="text-red-600 hover:text-red-800">
                      <span className="material-icons">delete</span>
                    </button>
                    <button className={`p-1 rounded ${
                      payment.status === 'Pagado' ? 'text-green-600 hover:text-green-800' :
                      payment.status === 'Pendiente' ? 'text-amber-600 hover:text-amber-800' :
                      'text-gray-600 hover:text-gray-800'
                    }`}>
                      <span className="material-icons">check_circle</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}