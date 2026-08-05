import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
const makeIcon = (symbol) => ({ size = 18 }) => <span aria-hidden="true" style={{fontSize: Math.max(14, size - 1), lineHeight: 1}}>{symbol}</span>;
const Plus=makeIcon('＋'), Search=makeIcon('⌕'), X=makeIcon('×'), Check=makeIcon('✓'), Clock3=makeIcon('◷'), BedDouble=makeIcon('▤'), Stethoscope=makeIcon('⚕'), ClipboardList=makeIcon('☷'), Trash2=makeIcon('⌫'), ChevronDown=makeIcon('⌄'), ChevronUp=makeIcon('⌃'), AlertTriangle=makeIcon('⚠'), Archive=makeIcon('▣'), RotateCcw=makeIcon('↺');
import './styles.css';

const STORAGE_KEY = 'er-flow-tracker-v1';

const STATUSES = [
  { value: 'New', color: 'gray' },
  { value: 'Workup pending', color: 'yellow' },
  { value: 'For consult', color: 'orange' },
  { value: 'For admission', color: 'blue' },
  { value: 'Waiting for room', color: 'purple' },
  { value: 'Transferred', color: 'teal' },
  { value: 'Discharged', color: 'green' },
  { value: 'Urgent follow-up', color: 'red' }
];

const QUICK_TASKS = ['CBC', 'Urinalysis', 'Imaging', 'Consult', 'Admission orders', 'Medication', 'Reassessment'];

const blankPatient = {
  code: '', ageSex: '', complaint: '', erBed: '', service: '',
  status: 'New', disposition: '', room: '', notes: '', tasks: []
};

function nowLabel() {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  }).format(new Date());
}

function App() {
  const [patients, setPatients] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankPatient);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Active');
  const [expandedId, setExpandedId] = useState(null);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  }, [patients]);

  const visiblePatients = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients
      .filter(p => {
        const completed = ['Discharged', 'Transferred'].includes(p.status);
        if (filter === 'Active' && completed) return false;
        if (filter === 'Completed' && !completed) return false;
        if (filter === 'Pending' && !p.tasks.some(t => !t.done)) return false;
        if (!q) return true;
        return [p.code, p.ageSex, p.complaint, p.erBed, p.service, p.status, p.room]
          .some(v => (v || '').toLowerCase().includes(q));
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [patients, query, filter]);

  const activeCount = patients.filter(p => !['Discharged', 'Transferred'].includes(p.status)).length;
  const pendingCount = patients.filter(p => p.tasks.some(t => !t.done)).length;
  const completedCount = patients.filter(p => ['Discharged', 'Transferred'].includes(p.status)).length;

  function openNew() {
    setEditingId(null);
    setForm(blankPatient);
    setNewTask('');
    setShowForm(true);
  }

  function openEdit(patient) {
    setEditingId(patient.id);
    setForm({ ...patient, tasks: patient.tasks.map(t => ({ ...t })) });
    setNewTask('');
    setShowForm(true);
  }

  function savePatient(e) {
    e.preventDefault();
    if (!form.code.trim()) return;
    const payload = {
      ...form,
      code: form.code.trim(),
      id: editingId || crypto.randomUUID(),
      createdAt: editingId ? patients.find(p => p.id === editingId)?.createdAt : Date.now(),
      updatedAt: Date.now(),
      updatedLabel: nowLabel()
    };
    setPatients(prev => editingId
      ? prev.map(p => p.id === editingId ? payload : p)
      : [payload, ...prev]
    );
    setShowForm(false);
  }

  function addTask(label) {
    const clean = label.trim();
    if (!clean || form.tasks.some(t => t.label.toLowerCase() === clean.toLowerCase())) return;
    setForm(f => ({ ...f, tasks: [...f.tasks, { id: crypto.randomUUID(), label: clean, done: false }] }));
    setNewTask('');
  }

  function toggleTask(patientId, taskId) {
    setPatients(prev => prev.map(p => p.id === patientId ? {
      ...p,
      tasks: p.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t),
      updatedAt: Date.now(), updatedLabel: nowLabel()
    } : p));
  }

  function removePatient(id) {
    if (window.confirm('Remove this patient from the tracker?')) {
      setPatients(prev => prev.filter(p => p.id !== id));
    }
  }

  function clearCompleted() {
    if (window.confirm('Delete all discharged and transferred patients?')) {
      setPatients(prev => prev.filter(p => !['Discharged', 'Transferred'].includes(p.status)));
    }
  }

  function clearAll() {
    if (window.confirm('Delete ALL tracker data on this device?')) setPatients([]);
  }

  const statusMeta = status => STATUSES.find(s => s.value === status) || STATUSES[0];

  return (
    <div className="app-shell">
      <header>
        <div>
          <p className="eyebrow">PERSONAL ER BOARD</p>
          <h1>ER Flow Tracker</h1>
          <p className="subtitle">Track pending tasks, consults, disposition, and room assignment.</p>
        </div>
        <button className="primary" onClick={openNew}><Plus size={19}/> Add patient</button>
      </header>

      <section className="privacy-note">
        <AlertTriangle size={18}/>
        Use patient codes or initials only. Avoid full names, complete MRNs, addresses, or other identifying information.
      </section>

      <section className="stats">
        <button onClick={() => setFilter('Active')} className={filter === 'Active' ? 'active' : ''}>
          <strong>{activeCount}</strong><span>Active</span>
        </button>
        <button onClick={() => setFilter('Pending')} className={filter === 'Pending' ? 'active' : ''}>
          <strong>{pendingCount}</strong><span>With pending</span>
        </button>
        <button onClick={() => setFilter('Completed')} className={filter === 'Completed' ? 'active' : ''}>
          <strong>{completedCount}</strong><span>Completed</span>
        </button>
      </section>

      <section className="toolbar">
        <div className="searchbox"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search code, complaint, room..."/></div>
        <button className="ghost" onClick={() => setFilter('All')}>All</button>
      </section>

      <main>
        {visiblePatients.length === 0 ? (
          <div className="empty">
            <ClipboardList size={38}/>
            <h2>No patients here</h2>
            <p>Add a patient or choose a different filter.</p>
            <button className="primary" onClick={openNew}><Plus size={18}/> Add first patient</button>
          </div>
        ) : visiblePatients.map(patient => {
          const pending = patient.tasks.filter(t => !t.done);
          const expanded = expandedId === patient.id;
          const meta = statusMeta(patient.status);
          return (
            <article className="patient-card" key={patient.id}>
              <div className="card-top" onClick={() => setExpandedId(expanded ? null : patient.id)}>
                <div className="patient-main">
                  <div className="code-row">
                    <h2>{patient.code}</h2>
                    {patient.ageSex && <span>{patient.ageSex}</span>}
                  </div>
                  <p className="complaint">{patient.complaint || 'No chief complaint entered'}</p>
                  <div className="meta-row">
                    <span className={`status ${meta.color}`}>{patient.status}</span>
                    {patient.erBed && <span><BedDouble size={15}/> {patient.erBed}</span>}
                    {patient.service && <span><Stethoscope size={15}/> {patient.service}</span>}
                  </div>
                </div>
                <div className="pending-badge">
                  <strong>{pending.length}</strong><span>pending</span>
                  {expanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>} 
                </div>
              </div>

              {expanded && (
                <div className="card-body">
                  <div className="detail-grid">
                    <div><label>Disposition</label><p>{patient.disposition || '—'}</p></div>
                    <div><label>Room</label><p>{patient.room || 'Not assigned'}</p></div>
                  </div>

                  <div className="task-list">
                    <div className="section-title"><ClipboardList size={17}/><strong>Pending checklist</strong></div>
                    {patient.tasks.length === 0 ? <p className="muted">No checklist items.</p> : patient.tasks.map(task => (
                      <button key={task.id} className={`task ${task.done ? 'done' : ''}`} onClick={() => toggleTask(patient.id, task.id)}>
                        <span className="checkbox">{task.done && <Check size={15}/>}</span>
                        <span>{task.label}</span>
                      </button>
                    ))}
                  </div>

                  {patient.notes && <div className="notes"><label>Notes</label><p>{patient.notes}</p></div>}
                  <div className="card-footer">
                    <span><Clock3 size={14}/> Updated {patient.updatedLabel || 'recently'}</span>
                    <div>
                      <button className="ghost" onClick={() => openEdit(patient)}>Edit</button>
                      <button className="danger-icon" onClick={() => removePatient(patient.id)} aria-label="Delete"><Trash2 size={17}/></button>
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </main>

      <footer>
        <button className="ghost" onClick={clearCompleted}><Archive size={17}/> Clear completed</button>
        <button className="ghost danger" onClick={clearAll}><RotateCcw size={17}/> Clear all data</button>
      </footer>

      {showForm && (
        <div className="modal-backdrop" onMouseDown={() => setShowForm(false)}>
          <form className="modal" onSubmit={savePatient} onMouseDown={e => e.stopPropagation()}>
            <div className="modal-head">
              <div><p className="eyebrow">{editingId ? 'UPDATE RECORD' : 'NEW RECORD'}</p><h2>{editingId ? 'Edit patient' : 'Add patient'}</h2></div>
              <button type="button" className="icon" onClick={() => setShowForm(false)}><X/></button>
            </div>

            <div className="form-grid two">
              <label>Patient code or initials*<input required value={form.code} onChange={e => setForm({...form, code:e.target.value})} placeholder="ER-07"/></label>
              <label>Age / Sex<input value={form.ageSex} onChange={e => setForm({...form, ageSex:e.target.value})} placeholder="6/M"/></label>
            </div>
            <label>Chief complaint<input value={form.complaint} onChange={e => setForm({...form, complaint:e.target.value})} placeholder="Fever, seizure"/></label>
            <div className="form-grid two">
              <label>ER bed / area<input value={form.erBed} onChange={e => setForm({...form, erBed:e.target.value})} placeholder="Pedia ER Bed 3"/></label>
              <label>Consult service<input value={form.service} onChange={e => setForm({...form, service:e.target.value})} placeholder="Pediatrics"/></label>
            </div>
            <div className="form-grid two">
              <label>Status<select value={form.status} onChange={e => setForm({...form, status:e.target.value})}>{STATUSES.map(s => <option key={s.value}>{s.value}</option>)}</select></label>
              <label>Disposition<input value={form.disposition} onChange={e => setForm({...form, disposition:e.target.value})} placeholder="Admit / discharge / observe"/></label>
            </div>
            <label>Room assignment<input value={form.room} onChange={e => setForm({...form, room:e.target.value})} placeholder="412-B or waiting"/></label>

            <div className="task-editor">
              <div className="section-title"><ClipboardList size={17}/><strong>Checklist</strong></div>
              <div className="quick-tasks">{QUICK_TASKS.map(t => <button type="button" key={t} onClick={() => addTask(t)}>+ {t}</button>)}</div>
              <div className="add-task-row"><input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add custom pending item" onKeyDown={e => { if(e.key==='Enter'){ e.preventDefault(); addTask(newTask); }}}/><button type="button" onClick={() => addTask(newTask)}>Add</button></div>
              {form.tasks.map(task => (
                <div className="edit-task" key={task.id}>
                  <button type="button" className={`checkbox ${task.done ? 'checked' : ''}`} onClick={() => setForm(f => ({...f, tasks:f.tasks.map(t => t.id===task.id ? {...t, done:!t.done}:t)}))}>{task.done && <Check size={14}/>}</button>
                  <span>{task.label}</span>
                  <button type="button" className="icon small" onClick={() => setForm(f => ({...f, tasks:f.tasks.filter(t => t.id!==task.id)}))}><X size={16}/></button>
                </div>
              ))}
            </div>

            <label>Notes<textarea rows="3" value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} placeholder="Repeat temperature at 2 PM"/></label>
            <button className="primary full" type="submit"><Check size={18}/> Save patient</button>
          </form>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
