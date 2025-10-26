import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_COLORS = {
  present: 'bg-emerald-500',
  absent: 'bg-rose-500',
  late: 'bg-amber-400',
  excused: 'bg-neutral-400',
};

const formatISO = d => d.toISOString().slice(0,10);
const startOfMonth = (y,m) => new Date(y,m,1);
const endOfMonth = (y,m) => new Date(y,m+1,0);

function buildCalendar(year, month) {
  const start = startOfMonth(year, month);
  const end = endOfMonth(year, month);
  const startDay = new Date(start);
  startDay.setDate(start.getDate() - start.getDay());
  const days = [];
  const cur = new Date(startDay);
  while (cur <= end || cur.getDay() !== 0) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate()+1);
  }
  return days;
}

export default function AttendanceCalendar({ employees, roles, attendance, onMarkAttendance, onClearAttendance }) {
  const now = new Date();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selectedDates, setSelectedDates] = useState(new Set());
  const [status, setStatus] = useState('present');
  const [selectedEmployees, setSelectedEmployees] = useState(employees.slice(0,2).map(e => e.id));

  const days = useMemo(() => buildCalendar(view.y, view.m), [view]);
  const monthLabel = useMemo(() => new Date(view.y, view.m).toLocaleString(undefined, { month: 'long', year: 'numeric' }), [view]);

  const toggleDate = (iso) => {
    setSelectedDates(prev => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso); else next.add(iso);
      return next;
    });
  };

  const selectAllInMonth = () => {
    const start = startOfMonth(view.y, view.m);
    const end = endOfMonth(view.y, view.m);
    const all = new Set();
    for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) all.add(formatISO(d));
    setSelectedDates(all);
  };

  const selectThisWeek = () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    const all = new Set();
    for (let d = new Date(start); all.size < 7; d.setDate(d.getDate()+1)) all.add(formatISO(d));
    setSelectedDates(all);
  };

  const applyStatus = () => {
    if (selectedEmployees.length===0 || selectedDates.size===0) return;
    onMarkAttendance(selectedEmployees, Array.from(selectedDates), status);
  };

  const clearStatus = () => {
    if (selectedEmployees.length===0 || selectedDates.size===0) return;
    onClearAttendance(selectedEmployees, Array.from(selectedDates));
  };

  const dayStatusColor = (iso) => {
    if (selectedEmployees.length === 1) {
      const eid = selectedEmployees[0];
      const st = attendance[eid]?.[iso];
      if (!st) return '';
      return STATUS_COLORS[st];
    }
    // Mixed status: simple heuristic - if all same, show color; else neutral
    const statuses = new Set(selectedEmployees.map(eid => attendance[eid]?.[iso]).filter(Boolean));
    if (statuses.size === 1) {
      const st = Array.from(statuses)[0];
      return STATUS_COLORS[st] || '';
    }
    return '';
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end justify-between">
          <div className="flex items-center gap-3">
            <button className="h-9 w-9 grid place-items-center border rounded-md" onClick={()=>setView(v=>({ y: v.m===0 ? v.y-1 : v.y, m: v.m===0?11:v.m-1 }))}><ChevronLeft size={18}/></button>
            <div className="text-lg font-semibold min-w-[180px] text-center">{monthLabel}</div>
            <button className="h-9 w-9 grid place-items-center border rounded-md" onClick={()=>setView(v=>({ y: v.m===11 ? v.y+1 : v.y, m: v.m===11?0:v.m+1 }))}><ChevronRight size={18}/></button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full lg:w-auto">
            <select multiple value={selectedEmployees} onChange={(e)=>{
              const vals = Array.from(e.target.selectedOptions).map(o=>o.value);
              setSelectedEmployees(vals);
            }} className="border rounded-md px-3 py-2 text-sm min-w-[220px] h-24">
              {employees.map(e => (<option key={e.id} value={e.id}>{e.name}</option>))}
            </select>
            <select value={status} onChange={e=>setStatus(e.target.value)} className="border rounded-md px-3 py-2 text-sm">
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>
            <button onClick={applyStatus} className="px-3 py-2 rounded-md bg-neutral-900 text-white text-sm">Apply to selection</button>
            <button onClick={clearStatus} className="px-3 py-2 rounded-md border text-sm">Clear selection</button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 text-sm">
          <button onClick={selectThisWeek} className="px-2 py-1 rounded-md border">Select this week</button>
          <button onClick={selectAllInMonth} className="px-2 py-1 rounded-md border">Select whole month</button>
          <div className="ml-auto flex items-center gap-3">
            <Legend color="bg-emerald-500" label="Present"/>
            <Legend color="bg-rose-500" label="Absent"/>
            <Legend color="bg-amber-400" label="Late"/>
            <Legend color="bg-neutral-400" label="Excused"/>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 bg-neutral-50 text-xs font-medium">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (<div key={d} className="p-2 text-center">{d}</div>))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, idx) => {
            const iso = formatISO(d);
            const inMonth = d.getMonth() === view.m;
            const selected = selectedDates.has(iso);
            const color = dayStatusColor(iso);
            return (
              <button key={iso+idx} onClick={()=>toggleDate(iso)} className={`aspect-square p-2 border -ml-px -mt-px text-left relative ${inMonth ? 'bg-white' : 'bg-neutral-50 text-neutral-400'} ${selected ? 'ring-2 ring-neutral-900 z-10' : ''}`}>
                <div className="text-xs font-medium">{d.getDate()}</div>
                {color && <span className={`absolute bottom-2 right-2 h-2.5 w-2.5 rounded-full ${color}`}></span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`}></span>
      <span className="text-neutral-600">{label}</span>
    </div>
  );
}
