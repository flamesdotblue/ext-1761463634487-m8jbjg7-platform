import React, { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const newId = () => 'r_' + Math.random().toString(36).slice(2,8);

export default function RoleManager({ roles, employees, onUpsertRole, onDeleteRole, onAssignRole }) {
  const [name, setName] = useState('');
  const [perms, setPerms] = useState({ canViewReports: true, canMarkAttendance: true, canManageRoles: false });

  const usedCount = useMemo(() => {
    const map = {};
    roles.forEach(r => { map[r.id] = 0; });
    employees.forEach(e => { if (map[e.roleId] !== undefined) map[e.roleId] += 1; });
    return map;
  }, [roles, employees]);

  const addRole = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const role = { id: newId(), name: trimmed, permissions: { ...perms } };
    onUpsertRole(role);
    setName('');
  };

  const togglePerm = (k) => setPerms(p => ({ ...p, [k]: !p[k] }));

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white border rounded-xl p-5">
        <h2 className="font-semibold text-lg mb-4">Roles</h2>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 border-b text-left">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Permissions</th>
                <th className="p-2">Assigned</th>
                <th className="p-2 w-12"/>
              </tr>
            </thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="p-2 font-medium">{r.name}</td>
                  <td className="p-2 text-neutral-600">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(r.permissions).map(([k,v]) => (
                        <span key={k} className={`px-2 py-1 rounded-md text-xs ${v ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'}`}>{k}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-2">{usedCount[r.id]||0}</td>
                  <td className="p-2 text-right">
                    <button onClick={()=>onDeleteRole(r.id)} className="p-2 rounded-md hover:bg-rose-50 text-rose-600"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
              {roles.length===0 && (
                <tr>
                  <td className="p-4 text-center text-neutral-500" colSpan={4}>No roles defined</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-semibold mb-3">Create role</h3>
          <div className="space-y-3">
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Role name" className="w-full border rounded-md px-3 py-2 text-sm"/>
            <div className="space-y-2">
              <PermToggle label="Can view reports" checked={perms.canViewReports} onChange={()=>togglePerm('canViewReports')} />
              <PermToggle label="Can mark attendance" checked={perms.canMarkAttendance} onChange={()=>togglePerm('canMarkAttendance')} />
              <PermToggle label="Can manage roles" checked={perms.canManageRoles} onChange={()=>togglePerm('canManageRoles')} />
            </div>
            <button onClick={addRole} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-neutral-900 text-white text-sm"><Plus size={16}/> Add role</button>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-semibold mb-3">Assign roles</h3>
          <div className="space-y-3 max-h-[380px] overflow-auto pr-1">
            {employees.map(e => (
              <div key={e.id} className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-sm">{e.name}</div>
                  <div className="text-xs text-neutral-600">{e.contact}</div>
                </div>
                <select value={e.roleId} onChange={ev=>onAssignRole(e.id, ev.target.value)} className="border rounded-md px-2 py-1 text-sm">
                  {roles.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PermToggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}
