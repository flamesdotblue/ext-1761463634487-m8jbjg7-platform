import React, { useMemo, useState } from 'react';
import { Search, Filter, ChevronUp, ChevronDown } from 'lucide-react';

const todayISO = () => new Date().toISOString().slice(0, 10);
const getWeekDatesFrom = (startDateISO) => {
  const d = new Date(startDateISO + 'T00:00:00');
  const dates = [];
  for (let i=0;i<7;i++) {
    const t = new Date(d);
    t.setDate(d.getDate()+i);
    dates.push(t.toISOString().slice(0,10));
  }
  return dates;
};

const getMonthDates = (year, month) => {
  const start = new Date(year, month, 1);
  const dates = [];
  const cur = new Date(start);
  while (cur.getMonth() === month) {
    dates.push(cur.toISOString().slice(0,10));
    cur.setDate(cur.getDate()+1);
  }
  return dates;
};

export default function EmployeeTable({ employees, roles, roleMap, attendance, onUpdateRole, onMarkAttendance }) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selected, setSelected] = useState([]);
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });
  const [bulkStatus, setBulkStatus] = useState('present');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = employees.filter(e => (roleFilter==='all' || e.roleId===roleFilter) && (q==='' || e.name.toLowerCase().includes(q) || e.contact.toLowerCase().includes(q)));
    list.sort((a,b) => {
      const va = sort.key==='name' ? a.name : (roleMap[a.roleId]?.name || '');
      const vb = sort.key==='name' ? b.name : (roleMap[b.roleId]?.name || '');
      return sort.dir==='asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return list;
  }, [employees, roleFilter, query, sort, roleMap]);

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map(e => e.id));
  };

  const markToday = () => {
    if (selected.length === 0) return;
    onMarkAttendance(selected, [todayISO()], bulkStatus);
  };

  const markWeek = () => {
    if (selected.length === 0) return;
    const start = todayISO();
    onMarkAttendance(selected, getWeekDatesFrom(start), bulkStatus);
  };

  const markMonth = () => {
    if (selected.length === 0) return;
    const now = new Date();
    onMarkAttendance(selected, getMonthDates(now.getFullYear(), now.getMonth()), bulkStatus);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 text-neutral-400" size={18}/>
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search employees" className="w-full border rounded-md pl-9 pr-3 py-2 text-sm" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-neutral-600"><Filter size={16}/> Filters</div>
              <select className="border rounded-md px-3 py-2 text-sm" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}>
                <option value="all">All roles</option>
                {roles.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select className="border rounded-md px-3 py-2 text-sm" value={bulkStatus} onChange={e=>setBulkStatus(e.target.value)}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>
            <button onClick={markToday} className="px-3 py-2 rounded-md bg-neutral-900 text-white text-sm">Mark Today</button>
            <button onClick={markWeek} className="px-3 py-2 rounded-md border text-sm">Mark Week</button>
            <button onClick={markMonth} className="px-3 py-2 rounded-md border text-sm">Mark Month</button>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 border-b">
            <tr className="text-left">
              <th className="p-3 w-10"><input type="checkbox" checked={selected.length===filtered.length && filtered.length>0} onChange={toggleAll} /></th>
              <SortableTh label="Name" active={sort.key==='name'} dir={sort.dir} onClick={()=>setSort(s=>({ key: 'name', dir: s.key==='name' && s.dir==='asc' ? 'desc' : 'asc' }))} />
              <SortableTh label="Role" active={sort.key==='role'} dir={sort.dir} onClick={()=>setSort(s=>({ key: 'role', dir: s.key==='role' && s.dir==='asc' ? 'desc' : 'asc' }))} />
              <th className="p-3">Contact</th>
              <th className="p-3">Today</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => {
              const today = attendance[e.id]?.[todayISO()] || '-';
              return (
                <tr key={e.id} className="border-b">
                  <td className="p-3"><input type="checkbox" checked={selected.includes(e.id)} onChange={(ev)=>{
                    setSelected(prev => ev.target.checked ? [...prev, e.id] : prev.filter(id => id !== e.id));
                  }}/></td>
                  <td className="p-3 font-medium">{e.name}</td>
                  <td className="p-3">
                    <select value={e.roleId} onChange={ev=>onUpdateRole(e.id, ev.target.value)} className="border rounded-md px-2 py-1 text-sm">
                      {roles.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
                    </select>
                  </td>
                  <td className="p-3 text-neutral-600">{e.contact}</td>
                  <td className="p-3">
                    <StatusPill status={today} />
                  </td>
                </tr>
              );
            })}
            {filtered.length===0 && (
              <tr>
                <td className="p-4 text-center text-neutral-500" colSpan={5}>No employees found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortableTh({ label, active, dir, onClick }) {
  return (
    <th className="p-3 cursor-pointer select-none" onClick={onClick}>
      <div className="inline-flex items-center gap-1">
        {label}
        {active && (dir==='asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}
      </div>
    </th>
  );
}

function StatusPill({ status }) {
  const map = {
    present: 'bg-emerald-100 text-emerald-700',
    absent: 'bg-rose-100 text-rose-700',
    late: 'bg-amber-100 text-amber-700',
    excused: 'bg-neutral-200 text-neutral-700',
    '-': 'bg-neutral-100 text-neutral-500'
  };
  const label = status === '-' ? 'No status' : status?.[0]?.toUpperCase()+status?.slice(1);
  return <span className={`px-2 py-1 rounded-md text-xs font-medium ${map[status||'-']}`}>{label}</span>;
}
