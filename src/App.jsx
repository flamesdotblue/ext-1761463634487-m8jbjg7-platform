import React, { useEffect, useMemo, useState } from 'react';
import { Home, Users, Calendar as CalendarIcon, Shield, FileText } from 'lucide-react';
import Dashboard from './components/Dashboard';
import EmployeeTable from './components/EmployeeTable';
import AttendanceCalendar from './components/AttendanceCalendar';
import RoleManager from './components/RoleManager';

const seedEmployees = [
  { id: 'e1', name: 'Alice Johnson', roleId: 'r1', contact: 'alice@example.com' },
  { id: 'e2', name: 'Brian Smith', roleId: 'r2', contact: 'brian@example.com' },
  { id: 'e3', name: 'Carla Gomez', roleId: 'r2', contact: 'carla@example.com' },
  { id: 'e4', name: 'David Lee', roleId: 'r3', contact: 'david@example.com' },
];

const seedRoles = [
  { id: 'r1', name: 'Manager', permissions: { canViewReports: true, canMarkAttendance: true, canManageRoles: true } },
  { id: 'r2', name: 'Staff', permissions: { canViewReports: true, canMarkAttendance: false, canManageRoles: false } },
  { id: 'r3', name: 'Contractor', permissions: { canViewReports: false, canMarkAttendance: false, canManageRoles: false } },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  // attendance: { [employeeId]: { [dateISO]: 'present'|'absent'|'late'|'excused' } }
  const [attendance, setAttendance] = useState({});

  // Local storage persistence
  useEffect(() => {
    const data = localStorage.getItem('ems-data');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setEmployees(parsed.employees || seedEmployees);
        setRoles(parsed.roles || seedRoles);
        setAttendance(parsed.attendance || {});
      } catch (e) {
        setEmployees(seedEmployees);
        setRoles(seedRoles);
        setAttendance({});
      }
    } else {
      setEmployees(seedEmployees);
      setRoles(seedRoles);
      setAttendance({});
    }
  }, []);

  useEffect(() => {
    const payload = { employees, roles, attendance };
    localStorage.setItem('ems-data', JSON.stringify(payload));
  }, [employees, roles, attendance]);

  const roleMap = useMemo(() => Object.fromEntries(roles.map(r => [r.id, r])), [roles]);

  const markAttendance = (employeeIds, dates, status) => {
    setAttendance(prev => {
      const copy = { ...prev };
      employeeIds.forEach(eid => {
        if (!copy[eid]) copy[eid] = {};
        dates.forEach(d => {
          copy[eid][d] = status;
        });
      });
      return { ...copy };
    });
  };

  const clearAttendance = (employeeIds, dates) => {
    setAttendance(prev => {
      const copy = { ...prev };
      employeeIds.forEach(eid => {
        if (!copy[eid]) return;
        dates.forEach(d => {
          delete copy[eid][d];
        });
      });
      return { ...copy };
    });
  };

  const updateEmployeeRole = (employeeId, roleId) => {
    setEmployees(prev => prev.map(e => (e.id === employeeId ? { ...e, roleId } : e)));
  };

  const upsertRole = (role) => {
    setRoles(prev => {
      const exists = prev.find(r => r.id === role.id);
      if (exists) return prev.map(r => (r.id === role.id ? role : r));
      return [...prev, role];
    });
  };

  const deleteRole = (roleId) => {
    setRoles(prev => prev.filter(r => r.id !== roleId));
    setEmployees(prev => prev.map(e => (e.roleId === roleId ? { ...e, roleId: roles[0]?.id || '' } : e)));
  };

  const quickStats = useMemo(() => {
    const d = todayISO();
    let present = 0, absent = 0, late = 0, excused = 0;
    employees.forEach(e => {
      const st = attendance[e.id]?.[d];
      if (st === 'present') present++;
      else if (st === 'absent') absent++;
      else if (st === 'late') late++;
      else if (st === 'excused') excused++;
    });
    return { present, absent, late, excused };
  }, [attendance, employees]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white grid place-items-center font-bold">EM</div>
            <span className="font-semibold text-lg">Employee Manager</span>
          </div>
          <nav className="hidden sm:flex items-center gap-2">
            <TabButton icon={<Home size={16} />} label="Dashboard" active={activeTab==='dashboard'} onClick={()=>setActiveTab('dashboard')} />
            <TabButton icon={<Users size={16} />} label="Employees" active={activeTab==='employees'} onClick={()=>setActiveTab('employees')} />
            <TabButton icon={<CalendarIcon size={16} />} label="Attendance" active={activeTab==='attendance'} onClick={()=>setActiveTab('attendance')} />
            <TabButton icon={<Shield size={16} />} label="Roles" active={activeTab==='roles'} onClick={()=>setActiveTab('roles')} />
          </nav>
          <div className="sm:hidden"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            employees={employees}
            roles={roles}
            roleMap={roleMap}
            attendance={attendance}
            quickStats={quickStats}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'employees' && (
          <EmployeeTable
            employees={employees}
            roles={roles}
            roleMap={roleMap}
            attendance={attendance}
            onUpdateRole={updateEmployeeRole}
            onMarkAttendance={markAttendance}
          />
        )}
        {activeTab === 'attendance' && (
          <AttendanceCalendar
            employees={employees}
            roles={roles}
            attendance={attendance}
            onMarkAttendance={markAttendance}
            onClearAttendance={clearAttendance}
          />
        )}
        {activeTab === 'roles' && (
          <RoleManager
            roles={roles}
            employees={employees}
            onUpsertRole={upsertRole}
            onDeleteRole={deleteRole}
            onAssignRole={updateEmployeeRole}
          />
        )}
      </main>

      <footer className="py-6 text-center text-sm text-neutral-500">© {new Date().getFullYear()} Employee Manager</footer>
    </div>
  );
}

function TabButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${active ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}
    >
      {icon}
      {label}
    </button>
  );
}
