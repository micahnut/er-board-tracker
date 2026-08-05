import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
const makeIcon = (symbol) => ({ size = 18 }) => <span aria-hidden="true" style={{fontSize: Math.max(14, size - 1), lineHeight: 1}}>{symbol}</span>;
const Plus=makeIcon('＋'), Search=makeIcon('⌕'), X=makeIcon('×'), Check=makeIcon('✓'), Clock3=makeIcon('◷'), ClipboardList=makeIcon('☷'), Trash2=makeIcon('⌫'), ChevronDown=makeIcon('⌄'), ChevronUp=makeIcon('⌃'), Archive=makeIcon('▣'), RotateCcw=makeIcon('↺');
import './styles.css';

const STORAGE_KEY = 'er-flow-tracker-v1';

const STATUSES = [
  { value: 'For admission', color: 'blue' },
  { value: 'Discharged', color: 'green' },
  { value: 'Consult', color: 'orange' },
  { value: 'Waiting for room', color: 'purple' },
  { value: 'Admitted', color: 'teal' },
  { value: 'Transferred to wards', color: 'teal' }
];

const QUICK_TASKS = ['CBC', 'Urinalysis', 'Chest Xray', 'Reassessment'];
const SERVICES = ['Pediatrics', 'Internal Medicine', 'Family Medicine', 'Surgery', 'Obstetrics and Gynecology', 'Ortho'];

const SAMPLE_PATIENTS = [
  {
    code: 'NAVALES, GHAEL JOHN', age: '4Y', sex: 'M', physician: 'DR. HERNAEZ',
    complaint: '', impression: 'R/O DENGUE FEVER VS UTI VS SVI', room: '902', pgi: 'COBARDE',
    status: 'For admission', disposition: 'For admission',
    tasks: ['Room assignment']
  },
  {
    code: 'MANULAT, LUKE ISAIAH', age: '1Y', sex: 'M', physician: 'DR. GERRA',
    complaint: '', impression: 'AGE W/ MODERATE DEHYDRATION; R/O UTI', room: '808', pgi: 'COBARDE',
    status: 'For admission', disposition: 'For admission',
    tasks: ['Chest Xray']
  },
  {
    code: 'ROSALES, HALSTON', age: '6Y', sex: 'M', physician: 'DR. MARATAS',
    complaint: '', impression: 'R/O DENGUE VS SVI', pgi: 'GARGARAN',
    status: 'Discharged', disposition: 'DISCHARGED',
    tasks: []
  },
  {
    code: 'RIOS, JEFFERY', age: '19Y', sex: 'M', physician: 'DR. E. UY',
    complaint: '', impression: 'R/O SVI', pgi: 'GARGARAN',
    status: 'Discharged', disposition: 'DISCHARGED',
    tasks: []
  },
  {
    code: 'CABASAG, NATHAN', age: '5Y', sex: 'M', physician: 'DR. C. UY',
    complaint: '', impression: 'R/O UTI VS SVI', pgi: 'GARGARAN',
    status: 'Consult', disposition: '-',
    tasks: ['Chest Xray']
  },
  {
    code: 'ABELLA, XIAN ANDRES QUIRANTE', erBed: 'ER1 - 5', service: 'Pediatrics',
    complaint: 'Emergency case registry sample', status: 'Consult',
    tasks: ['CBC', 'Reassessment']
  },
  {
    code: 'ALBELLAR, JAYRALDINE MONTES', erBed: 'ER1 - 14', service: 'Obstetrics and Gynecology',
    complaint: 'Emergency case registry sample', status: 'Consult',
    tasks: ['Urinalysis', 'Chest Xray']
  },
  {
    code: 'AUGUSTO, CARLOS WAGWAG', erBed: 'ER1 - 9', service: 'Internal Medicine',
    complaint: 'Emergency case registry sample', status: 'Consult',
    tasks: ['Chest Xray']
  },
  {
    code: 'DIO, AKIM MATEO APINES', erBed: 'ER1 - 6', service: 'Pediatrics',
    complaint: 'Emergency case registry sample', status: 'Waiting for room',
    tasks: ['Room assignment']
  },
  {
    code: 'GOMEZ, HELEN TIRO', erBed: 'ER2 - D', service: 'Internal Medicine',
    complaint: 'Emergency case registry sample', status: 'Consult',
    tasks: ['Reassessment']
  }
];

const blankPatient = {
  code: '', age: '', sex: '', ageSex: '', complaint: '', impression: '', erBed: '', service: '',
  physician: '', pgi: '', status: 'Consult', disposition: '', room: '', notes: '', tasks: []
};

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizePatient(patient) {
  const statusMap = {
    New: 'Consult',
    'Workup pending': 'Consult',
    'For consult': 'Consult',
    Transferred: 'Transferred to wards',
    'Urgent follow-up': 'Consult'
  };
  const taskMap = {
    Imaging: 'Chest Xray',
    Consult: null,
    'Admission orders': null,
    Medication: null
  };
  const seenTasks = new Set();
  const tasks = (patient.tasks || [])
    .map(task => ({ ...task, label: taskMap[task.label] === undefined ? task.label : taskMap[task.label] }))
    .filter(task => task.label)
    .filter(task => {
      const key = task.label.toLowerCase();
      if (seenTasks.has(key)) return false;
      seenTasks.add(key);
      return true;
    });
  const ageSex = patient.ageSex || '';
  const [legacyAge, legacySex] = ageSex.includes('/') ? ageSex.split('/') : [ageSex, ''];
  const serviceMap = {
    Medicine: 'Internal Medicine',
    Obstetrics: 'Obstetrics and Gynecology'
  };
  const knownImpressions = {
    'navales, ghael john': 'R/O DENGUE FEVER VS UTI VS SVI',
    'manulat, luke isaiah': 'AGE W/ MODERATE DEHYDRATION; R/O UTI',
    'rosales, halston': 'R/O DENGUE VS SVI',
    'rios, jeffery': 'R/O SVI',
    'cabasag, nathan': 'R/O UTI VS SVI'
  };
  const knownImpression = knownImpressions[(patient.code || '').trim().toLowerCase()];
  const impression = patient.impression || knownImpression || '';
  const complaint = knownImpression && patient.complaint === knownImpression ? '' : patient.complaint || '';

  return {
    ...patient,
    age: patient.age || legacyAge || '',
    sex: patient.sex || legacySex || '',
    complaint,
    impression,
    service: serviceMap[patient.service] || patient.service || '',
    status: statusMap[patient.status] || patient.status || 'Consult',
    tasks
  };
}

function formatAgeSex(patient) {
  const age = patient.age || '';
  const sex = patient.sex || '';
  if (age && sex) return `${age}/${sex}`;
  return age || sex || patient.ageSex || '-';
}

function tableCell(value) {
  return String(value || '-').replace(/\t/g, ' ').replace(/\n/g, ' ');
}

function escapeHtml(value) {
  return tableCell(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildDocsSections(patients) {
  const forAdmission = patients.filter(patient => patient.status === 'For admission');
  const consults = patients.filter(patient => patient.status === 'Consult');

  return [
    {
      title: `ER Admissions (${forAdmission.length})`,
      rows: forAdmission.map(patient => [
        patient.code,
        formatAgeSex(patient),
        patient.physician || patient.service,
        patient.impression,
        patient.room || patient.erBed,
        patient.pgi
      ])
    },
    {
      title: `II. ER Consult (${consults.length})`,
      rows: consults.map(patient => [
        patient.code,
        formatAgeSex(patient),
        patient.physician || patient.service,
        patient.impression,
        patient.status,
        patient.pgi
      ])
    }
  ];
}

function rowToText(row) {
  return row.map(tableCell).join('\t');
}

function rowToHtml(row, cellTag = 'td') {
  const cellStyle = [
    'border:1px solid #000',
    'padding:3px 8px',
    'font-family:Calibri,Arial,sans-serif',
    'font-size:8pt',
    'font-weight:700',
    'text-align:center',
    'vertical-align:middle',
    'color:#000'
  ].join(';');
  return `<tr>${row.map(cell => `<${cellTag} style="${cellStyle}">${escapeHtml(cell)}</${cellTag}>`).join('')}</tr>`;
}

async function copyRich(text, html) {
  if (navigator.clipboard?.write && window.ClipboardItem && window.isSecureContext) {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': new Blob([text], { type: 'text/plain' }),
        'text/html': new Blob([html], { type: 'text/html' })
      })
    ]);
    return;
  }

  if (html) {
    const container = document.createElement('div');
    container.contentEditable = 'true';
    container.innerHTML = html;
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);
    const range = document.createRange();
    range.selectNodeContents(container);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('copy');
    selection.removeAllRanges();
    document.body.removeChild(container);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function nowLabel() {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  }).format(new Date());
}

function App() {
  const [patients, setPatients] = useState(() => {
    try { return (JSON.parse(localStorage.getItem(STORAGE_KEY)) || []).map(normalizePatient); }
    catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankPatient);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Active');
  const [expandedId, setExpandedId] = useState(null);
  const [newTask, setNewTask] = useState('');
  const [toast, setToast] = useState(null);
  const [showDocsPad, setShowDocsPad] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visiblePatients = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients
      .filter(p => {
        const completed = ['Discharged', 'Admitted', 'Transferred to wards'].includes(p.status);
        if (filter === 'Active' && completed) return false;
        if (filter === 'Consults' && p.status !== 'Consult') return false;
        if (filter === 'Admissions' && !['Waiting for room', 'Admitted', 'Transferred to wards'].includes(p.status)) return false;
        if (filter === 'Discharged' && p.status !== 'Discharged') return false;
        if (filter === 'Pending' && !(p.tasks || []).some(t => !t.done)) return false;
        if (!q) return true;
        return [p.code, formatAgeSex(p), p.impression, p.erBed, p.service, p.physician, p.pgi, p.status, p.room]
          .some(v => (v || '').toLowerCase().includes(q));
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [patients, query, filter]);

  const activeCount = patients.filter(p => !['Discharged', 'Admitted', 'Transferred to wards'].includes(p.status)).length;
  const consultCount = patients.filter(p => p.status === 'Consult').length;
  const admissionCount = patients.filter(p => ['Waiting for room', 'Admitted', 'Transferred to wards'].includes(p.status)).length;
  const pendingCount = patients.filter(p => (p.tasks || []).some(t => !t.done)).length;
  const dischargedCount = patients.filter(p => p.status === 'Discharged').length;

  function openNew() {
    setEditingId(null);
    setForm(blankPatient);
    setNewTask('');
    setShowForm(true);
  }

  function openEdit(patient) {
    setEditingId(patient.id);
    setForm({ ...blankPatient, ...patient, tasks: (patient.tasks || []).map(t => ({ ...t })) });
    setNewTask('');
    setShowForm(true);
  }

  function savePatient(e) {
    e.preventDefault();
    if (!form.code.trim()) return;
    const isEditing = Boolean(editingId);
    const payload = {
      ...form,
      code: form.code.trim(),
      id: editingId || createId(),
      createdAt: editingId ? patients.find(p => p.id === editingId)?.createdAt : Date.now(),
      updatedAt: Date.now(),
      updatedLabel: nowLabel()
    };
    setPatients(prev => editingId
      ? prev.map(p => p.id === editingId ? payload : p)
      : [payload, ...prev]
    );
    setShowForm(false);
    showToast(isEditing ? 'Patient updated' : 'Patient added');
  }

  function addTask(label) {
    const clean = label.trim();
    if (!clean || (form.tasks || []).some(t => t.label.toLowerCase() === clean.toLowerCase())) return;
    setForm(f => ({ ...f, tasks: [...(f.tasks || []), { id: createId(), label: clean, done: false }] }));
    setNewTask('');
    showToast(`${clean} added`);
  }

  function toggleTask(patientId, taskId) {
    let message = 'Checklist updated';
    setPatients(prev => prev.map(p => p.id === patientId ? {
      ...p,
      tasks: (p.tasks || []).map(t => {
        if (t.id !== taskId) return t;
        message = t.done ? `${t.label} reopened` : `${t.label} completed`;
        return { ...t, done: !t.done };
      }),
      updatedAt: Date.now(), updatedLabel: nowLabel()
    } : p));
    showToast(message);
  }

  function removePatient(id) {
    if (window.confirm('Remove this patient from the tracker?')) {
      setPatients(prev => prev.filter(p => p.id !== id));
      showToast('Patient removed');
    }
  }

  function clearDischarged() {
    if (window.confirm('Delete all discharged patients?')) {
      setPatients(prev => prev.filter(p => p.status !== 'Discharged'));
      showToast('Discharged patients cleared');
    }
  }

  function clearAll() {
    if (window.confirm('Delete ALL tracker data on this device?')) {
      setPatients([]);
      showToast('All tracker data cleared');
    }
  }

  function loadSampleData() {
    const existingCodes = new Set(patients.map(p => (p.code || '').trim().toLowerCase()));
    const loadedAt = Date.now();
    const samples = SAMPLE_PATIENTS
      .filter(sample => !existingCodes.has(sample.code.toLowerCase()))
      .map((sample, index) => ({
        ...blankPatient,
        ...sample,
        id: createId(),
        createdAt: loadedAt - index,
        updatedAt: loadedAt - index,
        updatedLabel: nowLabel(),
        tasks: (sample.tasks || []).map(label => ({ id: createId(), label, done: false }))
      }));

    if (samples.length === 0) {
      showToast('Sample data is already loaded');
      return;
    }

    setPatients(prev => [...samples, ...prev]);
    setFilter('All');
    showToast(`${samples.length} sample patients loaded`);
  }

  function showToast(message) {
    setToast({ id: createId(), message });
  }

  async function copyDocsText(text, message = 'Copied', html = '') {
    try {
      await copyRich(text, html);
      showToast(message);
    } catch {
      showToast('Copy failed');
    }
  }

  const statusMeta = status => STATUSES.find(s => s.value === status) || STATUSES[0];
  const docsSections = buildDocsSections(patients);

  return (
    <div className="app-shell">
      <header>
        <div>
          <h1>ER Board Tracker</h1>
        </div>
        <button type="button" className="primary" onClick={openNew}><Plus size={19}/> Add patient</button>
      </header>

      <section className="stats">
        <button type="button" onClick={() => setFilter('Active')} className={filter === 'Active' ? 'active' : ''}>
          <strong>{activeCount}</strong><span>Active</span>
        </button>
        <button type="button" onClick={() => setFilter('Pending')} className={filter === 'Pending' ? 'active' : ''}>
          <strong>{pendingCount}</strong><span>With pending</span>
        </button>
        <button type="button" onClick={() => setFilter('Consults')} className={filter === 'Consults' ? 'active' : ''}>
          <strong>{consultCount}</strong><span>Consults</span>
        </button>
        <button type="button" onClick={() => setFilter('Admissions')} className={filter === 'Admissions' ? 'active' : ''}>
          <strong>{admissionCount}</strong><span>Admissions</span>
        </button>
        <button type="button" onClick={() => setFilter('Discharged')} className={filter === 'Discharged' ? 'active' : ''}>
          <strong>{dischargedCount}</strong><span>Discharged</span>
        </button>
      </section>

      <section className="toolbar">
        <div className="searchbox"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, impression, room..."/></div>
        <button type="button" className="ghost docs-button" onClick={() => setShowDocsPad(true)}>Copy docs tables</button>
        <button type="button" className="ghost sample-button" onClick={loadSampleData}>Load sample data</button>
        <button type="button" className="ghost" onClick={() => setFilter('All')}>All</button>
      </section>

      <main>
        {visiblePatients.length === 0 ? (
          <div className="empty">
            <ClipboardList size={38}/>
            <h2>No patients here</h2>
            <p>Add a patient or choose a different filter.</p>
            <button type="button" className="primary" onClick={openNew}><Plus size={18}/> Add first patient</button>
          </div>
        ) : (
          <div className="system-table">
            <div className="system-row system-head" aria-hidden="true">
              <div>Name</div>
              <div>Age/Sex</div>
              <div>Attending Physician</div>
              <div>Impression</div>
              <div>Room</div>
              <div>PGI/CIC</div>
              <div>Disposition</div>
              <div className="pending-head">Pending</div>
            </div>

            {visiblePatients.map(patient => {
              const pending = (patient.tasks || []).filter(t => !t.done);
              const expanded = expandedId === patient.id;
              const meta = statusMeta(patient.status);
              return (
                <article className={`patient-record ${expanded ? 'selected' : ''}`} key={patient.id}>
                  <button type="button" className="system-row patient-row" onClick={() => setExpandedId(expanded ? null : patient.id)}>
                    <div className="name-cell">{patient.code || '-'}</div>
                    <div>{formatAgeSex(patient)}</div>
                    <div>{patient.physician || patient.service || '-'}</div>
                    <div className="impression-cell">{patient.impression || '-'}</div>
                    <div>{patient.room || patient.erBed || '-'}</div>
                    <div>{patient.pgi || '-'}</div>
                    <div><span className={`status ${meta.color}`}>{patient.status}</span></div>
                    <div className="pending-cell">
                      <strong>{pending.length}</strong>
                      {expanded ? <ChevronUp size={17}/> : <ChevronDown size={17}/>}
                    </div>
                  </button>

                  {expanded && (
                    <div className="card-body">
                      <div className="detail-grid">
                        <div><label>Room</label><p>{patient.room || 'Not assigned'}</p></div>
                        <div><label>ER bed / service</label><p>{[patient.erBed, patient.service].filter(Boolean).join(' / ') || '-'}</p></div>
                      </div>

                      <div className="task-list">
                        <div className="section-title"><ClipboardList size={17}/><strong>Pending checklist</strong></div>
                        {(patient.tasks || []).length === 0 ? <p className="muted">No checklist items.</p> : (patient.tasks || []).map(task => (
                          <button type="button" key={task.id} className={`task ${task.done ? 'done' : ''}`} onClick={() => toggleTask(patient.id, task.id)}>
                            <span className="checkbox">{task.done && <Check size={15}/>}</span>
                            <span>{task.label}</span>
                          </button>
                        ))}
                      </div>

                      {patient.notes && <div className="notes"><label>Notes</label><p>{patient.notes}</p></div>}
                      <div className="card-footer">
                        <span><Clock3 size={14}/> Updated {patient.updatedLabel || 'recently'}</span>
                        <div>
                          <button type="button" className="ghost" onClick={() => openEdit(patient)}>Edit</button>
                          <button type="button" className="danger-icon" onClick={() => removePatient(patient.id)} aria-label="Delete"><Trash2 size={17}/></button>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>

      <footer>
        <button type="button" className="ghost" onClick={clearDischarged}><Archive size={17}/> Clear discharged</button>
        <button type="button" className="ghost danger" onClick={clearAll}><RotateCcw size={17}/> Clear all data</button>
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
              <div className="form-grid age-sex">
                <label>Age<input value={form.age || ''} onChange={e => setForm({...form, age:e.target.value})} placeholder="6Y"/></label>
                <label>Sex<select value={form.sex || ''} onChange={e => setForm({...form, sex:e.target.value})}>
                  <option value="">-</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select></label>
              </div>
            </div>
            <label>Impression<input value={form.impression || ''} onChange={e => setForm({...form, impression:e.target.value})} placeholder="R/O dengue vs SVI"/></label>
            <div className="form-grid two">
              <label>ER bed<input value={form.erBed} onChange={e => setForm({...form, erBed:e.target.value})} placeholder="ER1 - 5"/></label>
              <label>Service<select value={form.service} onChange={e => setForm({...form, service:e.target.value})}>
                <option value="">-</option>
                {SERVICES.map(service => <option key={service} value={service}>{service}</option>)}
              </select></label>
            </div>
            <div className="form-grid two">
              <label>Attending physician<input value={form.physician || ''} onChange={e => setForm({...form, physician:e.target.value})} placeholder="DR. SANTOS"/></label>
              <label>PGI / CIC<input value={form.pgi || ''} onChange={e => setForm({...form, pgi:e.target.value})} placeholder="COBARDE"/></label>
            </div>
            <div className="form-grid two">
              <label>Disposition<select value={form.status} onChange={e => setForm({...form, status:e.target.value})}>{STATUSES.map(s => <option key={s.value}>{s.value}</option>)}</select></label>
              <label>Room assignment<input value={form.room} onChange={e => setForm({...form, room:e.target.value})} placeholder="412-B or waiting"/></label>
            </div>

            <div className="task-editor">
              <div className="section-title"><ClipboardList size={17}/><strong>Checklist</strong></div>
              <div className="quick-tasks">{QUICK_TASKS.map(t => <button type="button" key={t} onClick={() => addTask(t)}>+ {t}</button>)}</div>
              <div className="add-task-row"><input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add custom pending item" onKeyDown={e => { if(e.key==='Enter'){ e.preventDefault(); addTask(newTask); }}}/><button type="button" onClick={() => addTask(newTask)}>Add</button></div>
              {(form.tasks || []).map(task => (
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

      {showDocsPad && (
        <div className="modal-backdrop" onMouseDown={() => setShowDocsPad(false)}>
          <section className="modal docs-modal" onMouseDown={e => e.stopPropagation()}>
            <div className="modal-head">
              <div><p className="eyebrow">GOOGLE DOCS ROWS</p><h2>Copy docs tables</h2></div>
              <button type="button" className="icon" onClick={() => setShowDocsPad(false)}><X/></button>
            </div>

            <div className="docs-sections">
              {docsSections.map(section => (
                <div className="docs-section" key={section.title}>
                  <h3>{section.title}</h3>
                  {section.rows.length === 0 ? <p className="muted">No rows.</p> : section.rows.map((row, index) => (
                    <button type="button" className="docs-row" key={`${section.title}-${index}`} onClick={() => copyDocsText(rowToText(row), 'Row copied', `<table><tbody>${rowToHtml(row)}</tbody></table>`)}>
                      {row.map(tableCell).join(' | ')}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <Check size={16}/>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
