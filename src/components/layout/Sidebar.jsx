export default function Sidebar({ tables, activeTab, setActiveTab }) {
  return (
    <aside className="w-64 bg-white border-r min-h-[calc(100vh-64px)]">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Administración</h2>
        <nav className="space-y-1">
          {tables.map((table) => (
            <button
              key={table.id}
              onClick={() => setActiveTab(table.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === table.id
                  ? 'bg-blue-50 text-blue-600 border border-blue-100'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{table.icon}</span>
              <span className="font-medium">{table.name}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}