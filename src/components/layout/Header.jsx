export default function Header() {
  return (
    <header className="bg-white border-b shadow-sm">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
                  src="/kinderswim.png" 
                  alt="Kinderswim logo"
                  className="w-26 h-16 object-cover"
                />
            <div>
              <h1 className="text-xl font-bold text-gray-900">KinderSwim</h1>
              <p className="text-sm text-gray-500">Panel de administración</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="font-medium">Administrador</p>
              <p className="text-sm text-gray-500">admin@escuela.com</p>
            </div>
            <div className="text-sm bg-gray-100 px-3 py-1 rounded-full">
              {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}