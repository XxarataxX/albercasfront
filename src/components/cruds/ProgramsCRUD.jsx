import { useState } from 'react';

export default function ProgramsCRUD() {
  const [programs, setPrograms] = useState([
    { id: 1, nombre: 'Iniciación Infantil', duracion: '8 semanas', nivel: 'Principiante', precio: 1200, activo: true },
    { id: 2, nombre: 'Perfeccionamiento', duracion: '12 semanas', nivel: 'Intermedio', precio: 1800, activo: true },
    { id: 3, nombre: 'Competencia Avanzada', duracion: '16 semanas', nivel: 'Avanzado', precio: 2400, activo: true },
    { id: 4, nombre: 'Natación para Adultos', duracion: '10 semanas', nivel: 'Principiante', precio: 1500, activo: false },
    { id: 5, nombre: 'Clases Privadas', duracion: 'Personalizada', nivel: 'Todos', precio: 3000, activo: true },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    nombre: '', 
    duracion: '', 
    nivel: '',
    precio: ''
  });

  const niveles = ['Principiante', 'Intermedio', 'Avanzado', 'Todos'];

  const handleDelete = (id) => {
    if (window.confirm('¿Está seguro de eliminar este programa?')) {
      setPrograms(programs.filter(p => p.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newProgram = {
      id: Math.max(...programs.map(p => p.id)) + 1,
      ...formData,
      precio: parseFloat(formData.precio),
      activo: true
    };
    setPrograms([...programs, newProgram]);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ nombre: '', duracion: '', nivel: '', precio: '' });
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border">
      <div className="p-6 border-b bg-gradient-to-r from-violet-50 to-purple-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Gestión de Programas</h2>
            <p className="text-gray-600">Administra los programas de entrenamiento</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowForm(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <span className="material-icons">library_add</span>
              Nuevo Programa
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Nuevo Programa</h3>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <span className="material-icons">close</span>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del programa *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Ej: Natación Infantil"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duración *</label>
              <input
                type="text"
                value={formData.duracion}
                onChange={(e) => setFormData({...formData, duracion: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Ej: 8 semanas"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nivel *</label>
              <select
                value={formData.nivel}
                onChange={(e) => setFormData({...formData, nivel: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Seleccionar nivel</option>
                {niveles.map(nivel => (
                  <option key={nivel} value={nivel}>{nivel}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.precio}
                onChange={(e) => setFormData({...formData, precio: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="1200.00"
                required
              />
            </div>
            
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg">
                Guardar Programa
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Programa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duración</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nivel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {programs.map((program) => (
              <tr key={program.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">#{program.id}</td>
                <td className="px-6 py-4">
                  <div className="font-medium">{program.nombre}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded">
                    {program.duracion}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    program.nivel === 'Principiante' ? 'bg-yellow-100 text-yellow-800' :
                    program.nivel === 'Intermedio' ? 'bg-orange-100 text-orange-800' :
                    program.nivel === 'Avanzado' ? 'bg-red-100 text-red-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {program.nivel}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-green-700">${program.precio.toLocaleString()}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${program.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {program.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800">
                      <span className="material-icons">edit</span>
                    </button>
                    <button onClick={() => handleDelete(program.id)} className="text-red-600 hover:text-red-800">
                      <span className="material-icons">delete</span>
                    </button>
                    <button className="text-green-600 hover:text-green-800">
                      <span className="material-icons">visibility</span>
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