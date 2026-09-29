import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { withBranchParams, getBranchScope } from '../branchScope';
import { poolService, instructorService, timeBlockService, extractList } from '../services/api';

const WEEK_DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const CLASS_TYPE_LABELS = { F: 'Fija', C: 'Suelta', P: 'Prueba', R: 'Reposicion' };

const toLocalISODate = (date) => date.toLocaleDateString('en-CA').split('T')[0];
const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
const startOfMondayWeek = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);
  const day = date.getDay();
  return addDays(date, day === 0 ? -6 : 1 - day);
};

const normalizeId = (value) => (value === null || value === undefined ? '' : String(value));
const getPoolId = (pool) => normalizeId(pool.id || pool.pool_id || pool.poolId);
const getInstructorPoolId = (instructor) =>
  normalizeId(instructor.poolId || instructor.pool_id || instructor.pool?.id || instructor.alberca_pool_id);
const getTimeBlockId = (block) => normalizeId(block.id || block.timeBlockId || block.time_block_id);
const getSlotInstructorId = (slot) => normalizeId(slot.instructorId || slot.instructor_id);
const getSlotTimeBlockId = (slot) => normalizeId(slot.timeBlockId || slot.time_block_id);
const getSlotState = (slot) => slot?.status || slot?.state || '';
const getProgramInstructorId = (program) => normalizeId(program.instructor_id || program.instructorId);
const getProgramTimeBlockId = (program) => normalizeId(program.time_block_id || program.timeBlockId);
const getProgramPoolId = (program) => normalizeId(program.pool_id || program.poolId);
const getClassType = (record) => record?.class_type || record?.classType || 'F';

const getTimeBlockLabel = (block) => {
  const start = block.horaInicio || block.hour_start || block.hourStart || '';
  const end = block.horaFin || block.hour_end || block.hourEnd || '';
  return `${start}${end ? ` - ${end}` : ''}`;
};

const getProgramDays = (program) => {
  const rawDays = program.daysOfWeek || program.days_of_week || [];
  if (Array.isArray(rawDays)) return rawDays.map(Number).filter((day) => !Number.isNaN(day));
  return String(rawDays)
    .split(',')
    .map((day) => Number(day.trim()))
    .filter((day) => !Number.isNaN(day));
};

const isDateInProgramRange = (date, program) => {
  const start = program.start_date || program.startDate;
  const end = program.end_date || program.endDate;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
};

const isBusySlot = (slot) => {
  if (!slot) return false;
  const state = getSlotState(slot);
  return state && state !== 'disponible' && state !== 'cancelado';
};

const getStudentName = (record) =>
  record?.student_name ||
  record?.studentName ||
  record?.student?.nombre ||
  record?.student?.name ||
  record?.partner_name ||
  'Alumno';

export default function AvailabilityBoard() {
  const [selectedDate, setSelectedDate] = useState(toLocalISODate(new Date()));
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [pools, setPools] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [slotsByDay, setSlotsByDay] = useState({});
  const [expandedCell, setExpandedCell] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const weekStart = useMemo(() => startOfMondayWeek(selectedDate), [selectedDate]);
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => toLocalISODate(addDays(weekStart, index))),
    [weekStart]
  );

  const visiblePools = useMemo(() => {
    if (!selectedPoolId) return pools;
    return pools.filter((pool) => getPoolId(pool) === selectedPoolId);
  }, [pools, selectedPoolId]);

  const visiblePoolIds = useMemo(() => visiblePools.map(getPoolId).filter(Boolean), [visiblePools]);

  const visibleInstructors = useMemo(() => {
    const allowedPoolIds = new Set(visiblePoolIds);
    return instructors.filter((instructor) => {
      const active = instructor.activo ?? instructor.active ?? true;
      return active && allowedPoolIds.has(getInstructorPoolId(instructor));
    });
  }, [instructors, visiblePoolIds]);

  const poolById = useMemo(() => {
    const map = {};
    pools.forEach((pool) => {
      map[getPoolId(pool)] = pool;
    });
    return map;
  }, [pools]);

  const programsByCell = useMemo(() => {
    const allowedPoolIds = new Set(visiblePoolIds);
    const byCell = {};

    programs.forEach((program) => {
      const programPoolId = getProgramPoolId(program);
      if (programPoolId && !allowedPoolIds.has(programPoolId)) return;
      if (!program.active && !program.activo) return;

      const instructorId = getProgramInstructorId(program);
      const timeBlockId = getProgramTimeBlockId(program);
      const days = getProgramDays(program);
      if (!instructorId || !timeBlockId || days.length === 0) return;

      days.forEach((weekdayIndex) => {
        const key = `${weekdayIndex}:${timeBlockId}:${instructorId}`;
        if (!byCell[key]) byCell[key] = [];
        byCell[key].push(program);
      });
    });

    return byCell;
  }, [programs, visiblePoolIds]);

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [poolsRes, instructorsRes, timeBlocksRes, programsRes] = await Promise.all([
        poolService.getAll({ active: true }),
        instructorService.getAll({ active: true }),
        timeBlockService.getAll(),
        axios.get(`${API_BASE_URL}/programs`, { params: { active: true } }),
      ]);

      const poolRows = extractList(poolsRes.data, 'pools');
      const instructorRows = extractList(instructorsRes.data, 'instructors');
      const timeBlockRows = extractList(timeBlocksRes.data, 'time_blocks');
      const programRows = extractList(programsRes.data, 'programs');

      setPools(poolRows);
      setInstructors(instructorRows);
      setTimeBlocks(timeBlockRows);
      setPrograms(programRows);

      const activePoolIds = poolRows
        .filter((pool) => !selectedPoolId || getPoolId(pool) === selectedPoolId)
        .map(getPoolId)
        .filter(Boolean);

      const slotResponses = await Promise.all(
        weekDates.flatMap((date) =>
          activePoolIds.map((poolId) =>
            axios
              .get(`${API_BASE_URL}/slots/tabla-dia`, { params: withBranchParams({ fecha: date, poolId }) })
              .then((response) => ({ date, slots: Array.isArray(response.data) ? response.data : [] }))
          )
        )
      );

      const nextSlotsByDay = {};
      slotResponses.forEach(({ date, slots }) => {
        if (!nextSlotsByDay[date]) nextSlotsByDay[date] = {};
        slots.forEach((slot) => {
          const key = `${getSlotTimeBlockId(slot)}:${getSlotInstructorId(slot)}`;
          nextSlotsByDay[date][key] = slot;
        });
      });
      setSlotsByDay(nextSlotsByDay);
    } catch (err) {
      console.error('Error cargando disponibilidad:', err);
      setError(err.response?.data?.detail || err.response?.data?.error || err.message || 'No se pudo cargar disponibilidad');
      setSlotsByDay({});
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  }, [weekDates, selectedPoolId]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const getCellInfo = useCallback(
    (date, dayIndex, timeBlock) => {
      const timeBlockId = getTimeBlockId(timeBlock);
      const daySlots = slotsByDay[date] || {};
      const free = [];
      const fixed = [];
      const extras = [];

      visibleInstructors.forEach((instructor) => {
        const instructorId = normalizeId(instructor.id);
        const instructorPoolId = getInstructorPoolId(instructor);
        const pool = poolById[instructorPoolId];
        const slot = daySlots[`${timeBlockId}:${instructorId}`];
        const cellPrograms = (programsByCell[`${dayIndex}:${timeBlockId}:${instructorId}`] || []).filter((program) =>
          isDateInProgramRange(date, program)
        );
        const fixedProgram = cellPrograms[0];
        const slotType = getClassType(slot);

        if (fixedProgram) {
          fixed.push({ instructor, pool, program: fixedProgram, slot, source: 'program' });
          return;
        }
        if (isBusySlot(slot) && slotType === 'F') {
          fixed.push({ instructor, pool, slot, source: 'slot' });
          return;
        }
        if (isBusySlot(slot)) {
          extras.push({ instructor, pool, slot });
          return;
        }
        free.push({ instructor, pool, slot });
      });

      return { free, fixed, extras };
    },
    [visibleInstructors, slotsByDay, programsByCell, poolById]
  );

  const totals = useMemo(() => {
    return weekDates.reduce(
      (sum, date, dayIndex) =>
        timeBlocks.reduce((blockSum, block) => {
          const info = getCellInfo(date, dayIndex, block);
          return {
            free: blockSum.free + info.free.length,
            fixed: blockSum.fixed + info.fixed.length,
            extras: blockSum.extras + info.extras.length,
          };
        }, sum),
      { free: 0, fixed: 0, extras: 0 }
    );
  }, [weekDates, timeBlocks, getCellInfo]);

  const selectedCellDetails = useMemo(() => {
    if (!expandedCell) return null;
    const [date, blockId] = expandedCell.split(':');
    const dayIndex = weekDates.indexOf(date);
    const block = timeBlocks.find((item) => getTimeBlockId(item) === blockId);
    if (dayIndex < 0 || !block) return null;
    return {
      date,
      dayLabel: WEEK_DAYS[dayIndex],
      timeLabel: getTimeBlockLabel(block),
      info: getCellInfo(date, dayIndex, block),
    };
  }, [expandedCell, weekDates, timeBlocks, getCellInfo]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-5">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-600 font-bold">Kinder Swim</p>
              <h1 className="text-3xl font-black text-slate-900">Disponibilidad semanal</h1>
              <p className="text-slate-500 mt-1">
                Semana tipo basada en paquetes activos, con clases sueltas, pruebas y reposiciones como excepciones.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Los paquetes activos ocupan todas las semanas; las excepciones bloquean solo su fecha exacta.
              </p>
              {getBranchScope() && <p className="text-xs text-slate-400 mt-1">Sucursal activa: {getBranchScope()}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Semana que contiene</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Alberca</label>
                <select
                  value={selectedPoolId}
                  onChange={(event) => setSelectedPoolId(event.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                >
                  <option value="">Toda la sucursal</option>
                  {pools.map((pool) => (
                    <option key={getPoolId(pool)} value={getPoolId(pool)}>
                      {pool.nombre || pool.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-5">
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
              <div className="text-xs uppercase font-bold text-blue-700">Huecos disponibles</div>
              <div className="text-3xl font-black text-blue-900 mt-1">{loading ? '...' : totals.free}</div>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-4">
              <div className="text-xs uppercase font-bold text-rose-700">Fijos por paquete</div>
              <div className="text-3xl font-black text-rose-900 mt-1">{loading ? '...' : totals.fixed}</div>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
              <div className="text-xs uppercase font-bold text-amber-700">Excepciones semana</div>
              <div className="text-3xl font-black text-amber-900 mt-1">{loading ? '...' : totals.extras}</div>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
              <div className="text-xs uppercase font-bold text-emerald-700">Maestros activos</div>
              <div className="text-3xl font-black text-emerald-900 mt-1">{visibleInstructors.length}</div>
            </div>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-5">{error}</div>}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="sticky left-0 bg-slate-900 z-10 px-4 py-3 text-left text-sm font-bold min-w-36">Horario</th>
                  {weekDates.map((date, index) => (
                    <th key={date} className="px-4 py-3 text-left text-sm font-bold min-w-64">
                      {WEEK_DAYS[index]}
                      <div className="text-xs font-normal text-slate-300">{date}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeBlocks.map((block) => {
                  const blockId = getTimeBlockId(block);
                  return (
                    <tr key={blockId} className="border-t border-slate-100">
                      <td className="sticky left-0 bg-white z-10 px-4 py-3 font-bold text-slate-700 border-r border-slate-100">
                        {getTimeBlockLabel(block)}
                      </td>
                      {weekDates.map((date, dayIndex) => {
                        const info = getCellInfo(date, dayIndex, block);
                        const cellKey = `${date}:${blockId}`;
                        const isExpanded = expandedCell === cellKey;
                        return (
                          <td key={cellKey} className="align-top px-3 py-3 border-r border-slate-50">
                            <button
                              type="button"
                              onClick={() => setExpandedCell(isExpanded ? null : cellKey)}
                              className={`w-full rounded-xl border p-3 text-left transition ${
                                isExpanded ? 'ring-2 ring-blue-300 ' : ''
                              }${
                                info.free.length > 0
                                  ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-50 border-slate-200 text-slate-500'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold">Huecos</span>
                                <span className={`text-lg font-black ${info.free.length > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                                  {info.free.length}
                                </span>
                              </div>
                              <div className="text-xs mt-1 text-slate-500">
                                Fijos {info.fixed.length} · Extras {info.extras.length}
                              </div>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {loading && (
            <div className="p-6 text-center text-slate-500">
              <span className="material-icons-round animate-spin align-middle mr-2">refresh</span>
              Cargando disponibilidad semanal...
            </div>
          )}
        </div>
      </div>

      {selectedCellDetails && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/10 pointer-events-auto cursor-default"
            onClick={() => setExpandedCell(null)}
            aria-label="Cerrar detalle"
          />
          <aside className="absolute right-6 top-24 w-[360px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-7rem)] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-2xl pointer-events-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide font-bold text-blue-600">Detalle de disponibilidad</div>
                <div className="text-lg font-black text-slate-900">
                  {selectedCellDetails.dayLabel} · {selectedCellDetails.timeLabel}
                </div>
                <div className="text-xs text-slate-500">{selectedCellDetails.date}</div>
              </div>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-2 py-1 text-sm font-bold text-slate-500 hover:bg-slate-50"
                onClick={() => setExpandedCell(null)}
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-2">
                  <div className="text-[10px] uppercase font-bold text-emerald-700">Huecos</div>
                  <div className="text-xl font-black text-emerald-900">{selectedCellDetails.info.free.length}</div>
                </div>
                <div className="rounded-xl bg-rose-50 border border-rose-100 p-2">
                  <div className="text-[10px] uppercase font-bold text-rose-700">Fijos</div>
                  <div className="text-xl font-black text-rose-900">{selectedCellDetails.info.fixed.length}</div>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-2">
                  <div className="text-[10px] uppercase font-bold text-amber-700">Extras</div>
                  <div className="text-xl font-black text-amber-900">{selectedCellDetails.info.extras.length}</div>
                </div>
              </div>

              {selectedCellDetails.info.free.length > 0 && (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm">
                  <div className="font-bold text-emerald-800 mb-1">Maestros libres</div>
                  <div className="text-xs text-emerald-900">
                    {selectedCellDetails.info.free.map(({ instructor }) => instructor.nombre || instructor.name).join(', ')}
                  </div>
                </div>
              )}

              {selectedCellDetails.info.fixed.map(({ instructor, pool, program, slot, source }) => (
                <div key={`fixed:${program?.id || slot?.id}:${instructor.id}`} className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm">
                  <div className="font-bold text-rose-900">
                    {instructor.nombre || instructor.name} · {source === 'program' ? 'paquete fijo' : 'clase fija'}
                  </div>
                  <div className="text-xs text-rose-700">
                    {getStudentName(program || slot)} · {pool?.nombre || pool?.name || 'Alberca'}
                    {program?.id ? ` · programa ${program.id}` : ` · ${getSlotState(slot)}`}
                  </div>
                </div>
              ))}

              {selectedCellDetails.info.extras.map(({ instructor, pool, slot }) => (
                <div key={`extra:${slot?.id}:${instructor.id}`} className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm">
                  <div className="font-bold text-amber-900">
                    {instructor.nombre || instructor.name} · {CLASS_TYPE_LABELS[getClassType(slot)] || getClassType(slot)}
                  </div>
                  <div className="text-xs text-amber-700">
                    {getStudentName(slot)} · {pool?.nombre || pool?.name || 'Alberca'} · {getSlotState(slot)}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
