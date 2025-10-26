import React, { useMemo, useState } from 'react';
import { ArrowRight, FileText, Users, CalendarDays, CheckCircle2, XCircle, Clock, MinusCircle, Download } from 'lucide-react';

const formatISO = d => d.toISOString().slice(0,10);
const parseISO = s => new Date(s + 'T00:00:00');

export default function Dashboard({ employees, roles, roleMap, attendance, quickStats, onNavigate }) {
  const [reportRoleId, setReportRoleId] = useState('all');
  const [reportEmployeeId, setReportEmployeeId] = useState('all');
  const [start, setStart] = useState(() => formatISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [end, setEnd] = useState(() => formatISO(new Date()));

  const { rows, totals } = useMemo(() => {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    const days = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate()+1)) {
      days.push(formatISO(d));
    }
    const filteredEmployees = employees.filter(e => (reportRoleId==='all' || e.roleId===reportRoleId) && (reportEmployeeId==='all' || e.id===reportEmployeeId));

    const rs = filteredEmployees.map(e => {
      let present=0, absent=0, late=0, excused=0;
      days.forEach(dt => {
        const st = attendance[e.id]?.[dt];
        if (st==='present') present++; else if (st==='absent') absent++; else if (st==='late') late++; else if (st==='excused') excused++;
      });
      return { id: e.id, name: e.name, role: roleMap[e.roleId]?.name || '', present, absent, late, excused, total: days.length };
    });
    const totals = rs.reduce((acc, r) => ({ present: acc.present+r.present, absent: acc.absent+r.absent, late: acc.late+r.late, excused: acc.excused+r.excused, total: acc.total + r.total }), {present:0,absent:0,late:0,excused:0,total:0});
    return { rows: rs, totals };
  }, [employees, roleMap, attendance, reportRoleId, reportEmployeeId, start, end]);

  const exportCSV = () => {
    const header = ['Employee','Role','Present','Absent','Late','Excused','Total'];
    const lines = [header.join(',')];
    rows.forEach(r => {
      lines.push([r.name, r.role, r.present, r.absent, r.late, r.excused, r.total].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'attendance-report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="text-indigo-600" />} title="Employees" value={employees.length} />
        <StatCard icon={<CheckCircle2 className="text-emerald-600" />} title="Present today" value={quickStats.present} />
        <StatCard icon={<XCircle className="text-rose-600" />} title="Absent today" value={quickStats.absent} />
        <StatCard icon={<Clock className="text-amber-500" />} title="Late today" value={quickStats.late} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2"><CalendarDays size={18}/> Quick Actions</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <QuickAction title="Mark attendance" subtitle="Calendar view for bulk updates" onClick={()=>onNavigate('attendance')} />
            <QuickAction title="Manage employees" subtitle="Update roles and details" onClick={()=>onNavigate('employees')} />
            <QuickAction title="Manage roles" subtitle="Define permissions" onClick={()=>onNavigate('roles')} />
            <QuickAction title="View reports" subtitle="Filter by role, employee, range" onClick={()=>document.getElementById('report-section')?.scrollIntoView({behavior:'smooth'})} />
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2"><FileText size={18}/> Today snapshot</h2>
          <ul className="text-sm space-y-2">
            <li className="flex justify-between"><span className="text-neutral-600">Excused</span><span className="font-medium">{quickStats.excused}</span></li>
            <li className="flex justify-between"><span className="text-neutral-600">No status</span><span className="font-medium">{Math.max(employees.length - (quickStats.present + quickStats.absent + quickStats.late + quickStats.excused),0)}</span></li>
          </ul>
        </div>
      </div>

      <div id="report-section" className="bg-white border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg flex items-center gap-2"><FileText size={18}/> Attendance Report</h2>
          <button onClick={exportCSV} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-neutral-50"><Download size={16}/> Export CSV</button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <select className="w-full border rounded-md px-3 py-2 text-sm" value={reportRoleId} onChange={e=>setReportRoleId(e.target.value)}>
            <option value="all">All roles</option>
            {roles.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
          </select>
          <select className="w-full border rounded-md px-3 py-2 text-sm" value={reportEmployeeId} onChange={e=>setReportEmployeeId(e.target.value)}>
            <option value="all">All employees</option>
            {employees.map(e => (<option key={e.id} value={e.id}>{e.name}</option>))}
          </select>
          <input type="date" className="w-full border rounded-md px-3 py-2 text-sm" value={start} onChange={e=>setStart(e.target.value)} />
          <input type="date" className="w-full border rounded-md px-3 py-2 text-sm" value={end} onChange={e=>setEnd(e.target.value)} />
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-neutral-50">
                <th className="p-2">Employee</th>
                <th className="p-2">Role</th>
                <th className="p-2 text-emerald-700">Present</th>
                <th className="p-2 text-rose-700">Absent</th>
                <th className="p-2 text-amber-700">Late</th>
                <th className="p-2 text-neutral-700">Excused</th>
                <th className="p-2">Total Days</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="p-2 font-medium">{r.name}</td>
                  <td className="p-2 text-neutral-600">{r.role}</td>
                  <td className="p-2">{r.present}</td>
                  <td className="p-2">{r.absent}</td>
                  <td className="p-2">{r.late}</td>
                  <td className="p-2">{r.excused}</td>
                  <td className="p-2">{r.total}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-neutral-500" colSpan={7}>No results for the selected criteria</td>
                </tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-neutral-50 font-medium">
                  <td className="p-2">Totals</td>
                  <td className="p-2"/>
                  <td className="p-2">{totals.present}</td>
                  <td className="p-2">{totals.absent}</td>
                  <td className="p-2">{totals.late}</td>
                  <td className="p-2">{totals.excused}</td>
                  <td className="p-2">{totals.total}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="bg-white border rounded-xl p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-neutral-100 grid place-items-center">{icon}</div>
        <div>
          <div className="text-sm text-neutral-600">{title}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ title, subtitle, onClick }) {
  return (
    <button onClick={onClick} className="group border rounded-lg p-4 text-left hover:shadow-sm transition">
      <div className="font-medium flex items-center justify-between">
        {title}
        <ArrowRight className="opacity-0 group-hover:opacity-100 transition" size={16}/>
      </div>
      <div className="text-sm text-neutral-600 mt-1">{subtitle}</div>
    </button>
  );
}
