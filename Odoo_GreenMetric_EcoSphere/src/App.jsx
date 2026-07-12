import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { db, seedLocalSampleData } from './features/offlineStore'
import './App.css'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth, googleProvider } from './features/firebase'

// ─── UTILITIES ──────────────────────────────────────────────────
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

const formatTimestamp = (dateVal) => {
  if (!dateVal) return ''
  try {
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return String(dateVal)
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch { return String(dateVal) }
}

const TODAY = new Date().toISOString().split('T')[0]

// ─── XP LEVEL SYSTEM ────────────────────────────────────────────
const XP_LEVELS = [
  { name: 'Seedling',    icon: '🌱', min: 0,    max: 199,      color: '#27AE60' },
  { name: 'Sapling',     icon: '🌿', min: 200,  max: 499,      color: '#1ABC9C' },
  { name: 'TreeHugger',  icon: '🌳', min: 500,  max: 999,      color: '#2471A3' },
  { name: 'EcoChampion', icon: '🏆', min: 1000, max: 1999,     color: '#8E44AD' },
  { name: 'EcoTitan',    icon: '⚡', min: 2000, max: Infinity, color: '#E67E22' }
]

const getLevel = (xp) => {
  const idx = XP_LEVELS.findIndex(l => xp <= l.max)
  const levelIdx = idx >= 0 ? idx : XP_LEVELS.length - 1
  const level = XP_LEVELS[levelIdx]
  const next = XP_LEVELS[levelIdx + 1]
  const progress = next ? Math.min(100, ((xp - level.min) / (level.max - level.min + 1)) * 100) : 100
  return { ...level, levelIdx, next, progress }
}

// ─── CARBON STREAK ──────────────────────────────────────────────
const getStreak = (logs, userId) => {
  const dates = [...new Set(logs.filter(l => l.userId === userId).map(l => l.date))].sort().reverse()
  if (!dates.length) return 0
  let streak = 0
  let check = new Date()
  const dateSet = new Set(dates)
  // Allow yesterday as streak start if user hasn't logged today yet
  if (!dateSet.has(TODAY)) check.setDate(check.getDate() - 1)
  for (let i = 0; i < 365; i++) {
    const d = check.toISOString().split('T')[0]
    if (dateSet.has(d)) { streak++; check.setDate(check.getDate() - 1) }
    else break
  }
  return streak
}

// ─── ICONS ──────────────────────────────────────────────────────
function IconLeaf({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 0 9.5a7 7 0 0 1-8 8.5z"/><path d="M19 2c-2.26 4.33-5.27 7.14-8 8"/></svg>
}
function IconGlobe({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
}
function IconActivity({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
}
function IconShield({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
}
function IconFlame({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
}
function IconAward({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
}
function IconWifi({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
}
function IconWifiOff({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
}
function IconSun({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
}
function IconMoon({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
}
function IconCloud({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
}
function IconArrowRight({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
}
function IconDownload({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
}
function IconUsers({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function IconClock({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}
function IconTrendUp({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
}
function IconTerminal({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
}
function IconCheck({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────

// Circular Gauge
function CircularGauge({ value, max = 100, label, color = 'var(--accent-green)', size = 140 }) {
  const radius = size * 0.35
  const sw = size * 0.08
  const circ = 2 * Math.PI * radius
  const offset = circ - (Math.min(Math.max(value, 0), max) / max) * circ
  return (
    <div className="gauge-container" style={{ width: size, height: size }}>
      <div className="gauge-outer">
        <svg width={size} height={size} className="gauge-svg">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--shadow-dark)" strokeWidth={sw} className="gauge-track"/>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={sw}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            transform={`rotate(-90 ${size/2} ${size/2})`} className="gauge-progress"/>
        </svg>
        <div className="gauge-inner">
          <span className="gauge-value">{Math.round(value)}%</span>
          <span className="gauge-label">{label}</span>
        </div>
      </div>
    </div>
  )
}

// XP Progress Ring
function XPProgressRing({ xp }) {
  const lv = getLevel(xp)
  const size = 80, r = 30, circ = 2 * Math.PI * r
  const offset = circ - (lv.progress / 100) * circ
  return (
    <div className="xp-ring-container">
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--shadow-dark)" strokeWidth="6"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={lv.color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 0.9s ease' }}/>
      </svg>
      <div className="xp-ring-inner">{lv.icon}</div>
    </div>
  )
}

// Toast
function Toast({ toast, onRemove }) {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }
  return (
    <div className={`toast toast-${toast.type}`} onClick={() => onRemove(toast.id)} title="Click to dismiss">
      <span className="toast-icon">{icons[toast.type] || 'ℹ️'}</span>
      <span className="toast-msg">{toast.msg}</span>
    </div>
  )
}
function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="toast-container">
      {toasts.map(t => <Toast key={t.id} toast={t} onRemove={onRemove}/>)}
    </div>
  )
}

// Stat Card
function StatCard({ icon, label, value, color = 'var(--accent-green)', suffix = '' }) {
  return (
    <div className="stat-card embossed-panel">
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-value" style={{ color }}>{value}{suffix}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  )
}

// Skeleton Card
function SkeletonCard() {
  return (
    <div className="skeleton-card embossed-panel">
      <div className="skeleton-circle"/>
      <div className="skeleton-line title"/>
      <div className="skeleton-line full"/>
      <div className="skeleton-line short"/>
    </div>
  )
}

// ─── MAIN APP ───────────────────────────────────────────────────
function App() {
  const [page, setPage] = useState('landing')
  const [theme, setTheme] = useState('light')
  const [online, setOnline] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [activeTab, setActiveTab] = useState('employee')
  const [loading, setLoading] = useState(true)

  // Auth
  const [currentUser, setCurrentUser] = useState(null)
  const [authView, setAuthView] = useState('login')
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerName, setRegisterName] = useState('')
  const [registerUsername, setRegisterUsername] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerRole, setRegisterRole] = useState('Employee')
  const [registerDeptId, setRegisterDeptId] = useState('dept-admin')

  // Data
  const [carbonLogs, setCarbonLogs] = useState([])
  const [csrLogs, setCsrLogs] = useState([])
  const [complianceIssues, setComplianceIssues] = useState([])
  const [departments, setDepartments] = useState([])
  const [emissionFactorsList, setEmissionFactorsList] = useState([])
  const [challenges, setChallenges] = useState([])
  const [allUsers, setAllUsers] = useState([])

  // Toast system
  const [toasts, setToasts] = useState([])
  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500)
  }, [])
  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  // Audit trail
  const [auditLog, setAuditLog] = useState([])
  const addAudit = useCallback((type, msg) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false })
    setAuditLog(prev => [{ time, type, msg, id: Date.now() }, ...prev].slice(0, 40))
  }, [])

  // Form states
  const [carbonFuelSource, setCarbonFuelSource] = useState('Fleet Fuel')
  const [carbonAmount, setCarbonAmount] = useState('')
  const [csrChallenge, setCsrChallenge] = useState('Cycle to Work')
  const [csrFile, setCsrFile] = useState(null)
  const [csrFileName, setCsrFileName] = useState('')
  const [newDeptName, setNewDeptName] = useState('')
  const [newDeptHead, setNewDeptHead] = useState('u-003')
  const [newDeptEmpCount, setNewDeptEmpCount] = useState('')
  const [newEfSource, setNewEfSource] = useState('')
  const [newEfMultiplier, setNewEfMultiplier] = useState('')
  const [newChallengeTitle, setNewChallengeTitle] = useState('')
  const [newChallengeXP, setNewChallengeXP] = useState('')
  const [newComplianceDesc, setNewComplianceDesc] = useState('')
  const [newComplianceOwner, setNewComplianceOwner] = useState('u-003')
  const [newComplianceDueDate, setNewComplianceDueDate] = useState('')

  // Landing preview
  const [previewValue, setPreviewValue] = useState(78)

  const userXP = currentUser ? currentUser.totalXP : 0
  const userBadges = currentUser ? currentUser.badges || [] : []

  // ── THEME ────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('ecosphere-theme') || 'light'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('ecosphere-theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  // ── KEYBOARD SHORTCUTS ───────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!currentUser || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'e' || e.key === 'E') setActiveTab('employee')
      if ((e.key === 'd' || e.key === 'D') && (currentUser.role === 'Department Head' || currentUser.role === 'System Admin')) setActiveTab('deptHead')
      if ((e.key === 'a' || e.key === 'A') && currentUser.role === 'System Admin') setActiveTab('admin')
      if (e.key === 't' || e.key === 'T') toggleTheme()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentUser, theme])

  // ── DB LOAD ──────────────────────────────────────────────────
  const loadDBData = async () => {
    try {
      await seedLocalSampleData()
      const [cLogs, sLogs, compIssues, depts, efs, chs, usrs] = await Promise.all([
        db.carbon_transactions.toArray(),
        db.csr_participations.toArray(),
        db.compliance_issues.toArray(),
        db.departments.toArray(),
        db.emission_factors.toArray(),
        db.challenges.toArray(),
        db.users.toArray()
      ])
      setCarbonLogs(cLogs.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)))
      setCsrLogs(sLogs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)))
      setComplianceIssues(compIssues)
      setDepartments(depts)
      setEmissionFactorsList(efs)
      setChallenges(chs)
      setAllUsers(usrs)
      setLoading(false)
    } catch (e) {
      console.error('DB load failed:', e)
      setLoading(false)
    }
  }

  // ── FIREBASE AUTH ────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          let localUser = await db.users.get(fbUser.uid)
          if (!localUser) {
            localUser = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email.split('@')[0],
              username: fbUser.email,
              password: '',
              role: 'Employee',
              departmentId: 'dept-admin',
              totalXP: 0,
              badges: [],
              sync_status: 'pending'
            }
            await db.users.add(localUser)
            await loadDBData()
            handleSync()
          } else {
            let updated = false
            if (fbUser.displayName && localUser.name !== fbUser.displayName) { localUser.name = fbUser.displayName; updated = true }
            if (localUser.username !== fbUser.email) { localUser.username = fbUser.email; updated = true }
            if (updated) { localUser.sync_status = 'pending'; await db.users.put(localUser); await loadDBData(); handleSync() }
          }
          setCurrentUser(localUser)
          localStorage.setItem('ecosphere-user-id', fbUser.uid)
          addAudit('auth', `${localUser.name} authenticated via Firebase`)
        } catch (err) { console.error('Firebase link error:', err) }
      } else {
        setCurrentUser(null)
        localStorage.removeItem('ecosphere-user-id')
      }
    })
    return () => unsub()
  }, [])

  // ── ROLE TAB ADJUSTMENT ──────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return
    if (currentUser.role === 'System Admin' && !['admin','deptHead','employee'].includes(activeTab)) setActiveTab('admin')
    else if (currentUser.role === 'Department Head' && !['deptHead','employee'].includes(activeTab)) setActiveTab('deptHead')
    else if (currentUser.role === 'Employee') setActiveTab('employee')
  }, [currentUser])

  // ── EMISSION FACTORS MAP ─────────────────────────────────────
  const emissionFactors = useMemo(() => {
    const map = {}
    emissionFactorsList.forEach(ef => { map[ef.sourceType] = ef.multiplierValue })
    if (!Object.keys(map).length) { map['Fleet Fuel'] = 2.31; map['Electricity'] = 0.85; map['Natural Gas'] = 1.88 }
    return map
  }, [emissionFactorsList])

  useEffect(() => {
    const keys = Object.keys(emissionFactors)
    if (keys.length && !keys.includes(carbonFuelSource)) setCarbonFuelSource(keys[0])
  }, [emissionFactors])

  const calculatedEmissions = useMemo(() => {
    const amt = parseFloat(carbonAmount)
    if (isNaN(amt) || amt <= 0 || !emissionFactors[carbonFuelSource]) return 0
    return parseFloat((amt * emissionFactors[carbonFuelSource]).toFixed(2))
  }, [carbonAmount, carbonFuelSource, emissionFactors])

  // ── ESG SCORES ───────────────────────────────────────────────
  const scores = useMemo(() => {
    const totalEm = carbonLogs.reduce((a, c) => a + (c.calculatedEmissions || 0), 0)
    const env = Math.max(10, 95 - totalEm / 15)
    const soc = Math.min(98, 50 + csrLogs.length * 15)
    const resolved = complianceIssues.filter(i => i.status === 'Closed').length
    const gov = complianceIssues.length ? (resolved / complianceIssues.length) * 100 : 80
    return { env, soc, gov, overall: env * 0.4 + soc * 0.3 + gov * 0.3 }
  }, [carbonLogs, csrLogs, complianceIssues])

  const departmentScores = useMemo(() => {
    if (!currentUser) return { env: 80, soc: 80, gov: 80, overall: 80 }
    const deptId = currentUser.departmentId
    const deptCarbon = carbonLogs.filter(l => allUsers.find(u => u.id === (l.userId || 'u-001'))?.departmentId === deptId)
    const env = Math.max(10, 95 - deptCarbon.reduce((a, c) => a + (c.calculatedEmissions || 0), 0) / 15)
    const deptCsr = csrLogs.filter(l => allUsers.find(u => u.id === l.userId)?.departmentId === deptId)
    const soc = Math.min(98, 50 + deptCsr.length * 15)
    const deptComp = complianceIssues.filter(i => allUsers.find(u => u.id === i.ownerId)?.departmentId === deptId)
    const gov = deptComp.length ? (deptComp.filter(i => i.status === 'Closed').length / deptComp.length) * 100 : 80
    return { env, soc, gov, overall: env * 0.4 + soc * 0.3 + gov * 0.3 }
  }, [carbonLogs, csrLogs, complianceIssues, currentUser, allUsers])

  // ── SYNC ENGINE ──────────────────────────────────────────────
  const handleSync = async (overrideXP, overrideBadges) => {
    if (!online) { setSyncMessage('⚠️ Switch to ONLINE to synchronize.'); return }
    setSyncing(true)
    setSyncMessage('📡 Scanning local database...')
    const currentXP = overrideXP ?? userXP
    const currentBadges = overrideBadges ?? userBadges
    const syncUrl = `http://${window.location.hostname}:5000/sync`
    addAudit('push', 'Starting push phase...')
    try {
      const [pendingCarbon, pendingCsr, pendingComp, pendingDepts, pendingEfs, pendingChs, pendingUsers] = await Promise.all([
        db.carbon_transactions.where('sync_status').equals('pending').toArray(),
        db.csr_participations.where('sync_status').equals('pending').toArray(),
        db.compliance_issues.where('sync_status').equals('pending').toArray(),
        db.departments.where('sync_status').equals('pending').toArray(),
        db.emission_factors.where('sync_status').equals('pending').toArray(),
        db.challenges.where('sync_status').equals('pending').toArray(),
        db.users.where('sync_status').equals('pending').toArray()
      ])
      const totalPending = pendingCarbon.length + pendingCsr.length + pendingComp.length + pendingDepts.length + pendingEfs.length + pendingChs.length + pendingUsers.length
      const userPayloads = [...pendingUsers]
      if (currentUser && !pendingUsers.find(u => u.id === currentUser.id)) {
        userPayloads.push({ ...currentUser, totalXP: currentXP, badges: currentBadges })
      }
      setSyncMessage('⬆️ Pushing to cloud...')
      let serverResponded = false
      try {
        const res = await fetch(syncUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ carbon_transactions: pendingCarbon, csr_participations: pendingCsr, compliance_issues: pendingComp, departments: pendingDepts, emission_factors: pendingEfs, challenges: pendingChs, users: userPayloads }) })
        if (res.ok) {
          serverResponded = true
          addAudit('push', `Pushed ${totalPending} items to MongoDB`)
          await db.transaction('rw', db.carbon_transactions, db.csr_participations, db.compliance_issues, db.departments, db.emission_factors, db.challenges, db.users, async () => {
            for (const item of [...pendingCarbon, ...pendingCsr, ...pendingComp, ...pendingDepts, ...pendingEfs, ...pendingChs, ...pendingUsers]) {
              const store = pendingCarbon.includes(item) ? db.carbon_transactions : pendingCsr.includes(item) ? db.csr_participations : pendingComp.includes(item) ? db.compliance_issues : pendingDepts.includes(item) ? db.departments : pendingEfs.includes(item) ? db.emission_factors : pendingChs.includes(item) ? db.challenges : db.users
              await store.update(item.id, { sync_status: 'synced' })
            }
          })
        }
      } catch (e) { addAudit('error', 'Backend unreachable, using local simulation') }

      setSyncMessage('⬇️ Pulling cloud updates...')
      let fetchedData = null
      try {
        const res = await fetch(syncUrl)
        if (res.ok) { fetchedData = await res.json(); addAudit('pull', 'Pulled latest data from cloud') }
      } catch { }

      if (fetchedData) {
        const { carbon_transactions, csr_participations, compliance_issues, departments: sd, emission_factors: se, challenges: sc, users: su } = fetchedData
        await db.transaction('rw', db.carbon_transactions, db.csr_participations, db.compliance_issues, db.departments, db.emission_factors, db.challenges, db.users, async () => {
          if (carbon_transactions?.length) await db.carbon_transactions.bulkPut(carbon_transactions.map(t => ({ ...t, sync_status: 'synced' })))
          if (csr_participations?.length) await db.csr_participations.bulkPut(csr_participations.map(p => ({ ...p, sync_status: 'synced' })))
          if (compliance_issues?.length) await db.compliance_issues.bulkPut(compliance_issues.map(i => ({ ...i, sync_status: 'synced' })))
          if (sd?.length) await db.departments.bulkPut(sd.map(d => ({ ...d, sync_status: 'synced' })))
          if (se?.length) await db.emission_factors.bulkPut(se.map(e => ({ ...e, sync_status: 'synced' })))
          if (sc?.length) await db.challenges.bulkPut(sc.map(c => ({ ...c, sync_status: 'synced' })))
          if (su?.length) await db.users.bulkPut(su.map(u => ({ ...u, sync_status: 'synced' })))
        })
        if (su && currentUser) {
          const updated = su.find(u => u.id === currentUser.id)
          if (updated) setCurrentUser(prev => ({ ...prev, totalXP: Math.max(prev.totalXP, updated.totalXP), badges: [...new Set([...prev.badges, ...updated.badges])] }))
        }
      } else {
        // Offline simulation — mark pending as synced locally
        await db.transaction('rw', db.carbon_transactions, db.csr_participations, db.compliance_issues, db.departments, db.emission_factors, db.challenges, db.users, async () => {
          for (const store of [db.carbon_transactions, db.csr_participations, db.compliance_issues, db.departments, db.emission_factors, db.challenges, db.users]) {
            const pending = await store.where('sync_status').equals('pending').toArray()
            for (const item of pending) await store.update(item.id, { sync_status: 'synced' })
          }
        })
        addAudit('seed', `Offline sim: resolved ${totalPending} pending items`)
      }

      await loadDBData()
      setSyncing(false)
      const msg = fetchedData
        ? (totalPending > 0 ? `✅ Synced! Pushed ${totalPending} items & updated local DB.` : '🟢 Local database fully synchronized.')
        : `✅ Offline resolved ${totalPending || 0} pending logs.`
      setSyncMessage(msg)
    } catch (e) {
      setSyncing(false)
      setSyncMessage('❌ Sync failed: ' + e.message)
      addAudit('error', 'Sync failed: ' + e.message)
    }
  }

  useEffect(() => { if (online) handleSync() }, [online])
  useEffect(() => { loadDBData().then(() => { if (online) handleSync() }) }, [])

  // ── LOGOUT ───────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem('ecosphere-user-id')
      setCurrentUser(null)
      setActiveTab('employee')
      addToast('Signed out successfully.', 'info')
    } catch (e) { addToast('Logout failed: ' + e.message, 'error') }
  }

  // ── AUTH HANDLERS ────────────────────────────────────────────
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    if (!loginUsername || !loginPassword) return
    try {
      const email = loginUsername.includes('@') ? loginUsername : `${loginUsername.toLowerCase()}@ecosphere.local`
      await signInWithEmailAndPassword(auth, email, loginPassword)
      setLoginUsername(''); setLoginPassword('')
      addToast('Welcome back! Signed in successfully.', 'success')
    } catch (err) {
      // Fallback: local DB login for seeded users
      try {
        const localUser = await db.users.where('username').equals(loginUsername).first()
        if (localUser && localUser.password === loginPassword) {
          setCurrentUser(localUser)
          addToast(`Welcome, ${localUser.name}! (Local login)`, 'success')
          addAudit('auth', `${localUser.name} authenticated via local DB`)
        } else {
          addToast('Login failed. Check your credentials.', 'error')
        }
      } catch {
        addToast(`Login failed: ${err.message}`, 'error')
      }
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    if (!registerName || !registerUsername || !registerPassword) return
    try {
      const email = registerUsername.includes('@') ? registerUsername : `${registerUsername.toLowerCase()}@ecosphere.local`
      const cred = await createUserWithEmailAndPassword(auth, email, registerPassword)
      const newUsr = { id: cred.user.uid, name: registerName, username: email, password: '', role: registerRole, departmentId: registerDeptId, totalXP: 0, badges: [], sync_status: 'pending' }
      await db.users.put(newUsr)
      setRegisterName(''); setRegisterUsername(''); setRegisterPassword('')
      await loadDBData()
      addToast('🎉 Registration successful! Welcome to EcoSphere.', 'success')
      setAuthView('login')
      handleSync()
    } catch (err) { addToast(`Registration failed: ${err.message}`, 'error') }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
      addToast('Signed in with Google!', 'success')
    } catch (err) { addToast(`Google Sign-In failed: ${err.message}`, 'error') }
  }

  // ── EMPLOYEE HANDLERS ────────────────────────────────────────
  const handleAddCarbonLog = async (e) => {
    e.preventDefault()
    const amt = parseFloat(carbonAmount)
    if (isNaN(amt) || amt <= 0 || !currentUser) return
    const newLog = { id: generateUUID(), userId: currentUser.id, sourceType: carbonFuelSource, rawAmount: amt, calculatedEmissions, date: TODAY, sync_status: 'pending', createdAt: new Date().toISOString() }
    try {
      await db.carbon_transactions.add(newLog)
      setCarbonAmount('')
      await loadDBData()
      const newXP = userXP + 25
      await db.users.update(currentUser.id, { totalXP: newXP })
      setCurrentUser(prev => ({ ...prev, totalXP: newXP }))
      addToast(`+25 XP! Logged ${calculatedEmissions} kg CO₂e from ${carbonFuelSource}`, 'success')
      handleSync(newXP)
    } catch (err) { addToast('Failed to log transaction: ' + err.message, 'error') }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) { setCsrFile(file); setCsrFileName(file.name) }
  }

  const handleAddCsrLog = async (e) => {
    e.preventDefault()
    if (!csrFile || !currentUser) return
    const selectedCh = challenges.find(ch => ch.title === csrChallenge)
    const activityId = selectedCh ? selectedCh.id : 'ch-001'
    const xpReward = selectedCh ? selectedCh.xpValue : 100
    const newCsr = { id: generateUUID(), userId: currentUser.id, activityId, proofFile: 'uploaded-base64-file-string', status: 'Submitted', sync_status: 'pending', createdAt: new Date().toISOString() }
    try {
      await db.csr_participations.add(newCsr)
      setCsrFile(null); setCsrFileName('')
      await loadDBData()
      const newXP = userXP + xpReward
      let updatedBadges = [...userBadges]
      if (newXP >= 1400 && !userBadges.includes('Eco Titan')) {
        updatedBadges = [...userBadges, 'Eco Titan']
        addToast('🏅 Badge Unlocked: Eco Titan!', 'success')
      }
      await db.users.update(currentUser.id, { totalXP: newXP, badges: updatedBadges })
      setCurrentUser(prev => ({ ...prev, totalXP: newXP, badges: updatedBadges }))
      addToast(`+${xpReward} XP! CSR activity "${csrChallenge}" submitted.`, 'success')
      handleSync(newXP, updatedBadges)
    } catch (err) { addToast('Failed to submit CSR: ' + err.message, 'error') }
  }

  const handleToggleCompliance = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Open' ? 'Closed' : 'Open'
    try {
      await db.compliance_issues.update(id, { status: nextStatus, sync_status: 'pending' })
      await loadDBData()
      if (currentUser) {
        const newXP = nextStatus === 'Closed' ? userXP + 50 : Math.max(0, userXP - 50)
        await db.users.update(currentUser.id, { totalXP: newXP })
        setCurrentUser(prev => ({ ...prev, totalXP: newXP }))
        if (nextStatus === 'Closed') addToast('+50 XP! Compliance issue acknowledged.', 'success')
        handleSync(newXP)
      }
    } catch (err) { addToast('Failed to update compliance: ' + err.message, 'error') }
  }

  const handleRedeem = async (cost, itemName) => {
    if (userXP < cost || !currentUser) { addToast(`Need ${cost} XP to redeem. You have ${userXP} XP.`, 'warning'); return }
    const newXP = userXP - cost
    await db.users.update(currentUser.id, { totalXP: newXP })
    setCurrentUser(prev => ({ ...prev, totalXP: newXP }))
    addToast(`🎁 Redeemed: ${itemName}! -${cost} XP`, 'success')
    handleSync(newXP)
  }

  // ── ADMIN HANDLERS ───────────────────────────────────────────
  const handleAddDept = async (e) => {
    e.preventDefault()
    if (!newDeptName) return
    const newDept = { id: 'dept-' + Math.random().toString(36).substr(2, 4), name: newDeptName, headId: newDeptHead, employeeCount: parseInt(newDeptEmpCount, 10) || 5, esgScores: { env: 80, soc: 80, gov: 80 }, sync_status: 'pending' }
    try { await db.departments.add(newDept); setNewDeptName(''); setNewDeptEmpCount(''); await loadDBData(); handleSync(); addToast(`Department "${newDeptName}" created!`, 'success') }
    catch (err) { addToast('Failed to add department: ' + err.message, 'error') }
  }
  const handleDeleteDept = async (id) => {
    try { await db.departments.delete(id); await loadDBData(); handleSync(); addToast('Department removed.', 'info') }
    catch (err) { addToast('Failed to delete: ' + err.message, 'error') }
  }
  const handleAddEf = async (e) => {
    e.preventDefault()
    if (!newEfSource || !newEfMultiplier) return
    const newEf = { id: 'ef-' + Math.random().toString(36).substr(2, 4), sourceType: newEfSource, multiplierValue: parseFloat(newEfMultiplier), sync_status: 'pending' }
    try { await db.emission_factors.add(newEf); setNewEfSource(''); setNewEfMultiplier(''); await loadDBData(); handleSync(); addToast(`Emission factor "${newEfSource}" added!`, 'success') }
    catch (err) { addToast('Failed to add emission factor: ' + err.message, 'error') }
  }
  const handleDeleteEf = async (id) => {
    try { await db.emission_factors.delete(id); await loadDBData(); handleSync(); addToast('Emission factor removed.', 'info') }
    catch (err) { addToast('Failed to delete: ' + err.message, 'error') }
  }
  const handleAddChallenge = async (e) => {
    e.preventDefault()
    if (!newChallengeTitle || !newChallengeXP) return
    const newCh = { id: 'ch-' + Math.random().toString(36).substr(2, 4), title: newChallengeTitle, xpValue: parseInt(newChallengeXP, 10), status: 'Active', sync_status: 'pending' }
    try { await db.challenges.add(newCh); setNewChallengeTitle(''); setNewChallengeXP(''); await loadDBData(); handleSync(); addToast(`Challenge "${newChallengeTitle}" added!`, 'success') }
    catch (err) { addToast('Failed to add challenge: ' + err.message, 'error') }
  }
  const handleDeleteChallenge = async (id) => {
    try { await db.challenges.delete(id); await loadDBData(); handleSync(); addToast('Challenge removed.', 'info') }
    catch (err) { addToast('Failed to delete: ' + err.message, 'error') }
  }

  // ── DEPT HEAD HANDLERS ───────────────────────────────────────
  const handleAddCompliance = async (e) => {
    e.preventDefault()
    if (!newComplianceDesc || !newComplianceOwner || !newComplianceDueDate) return
    const newIssue = { id: generateUUID(), description: newComplianceDesc, ownerId: newComplianceOwner, dueDate: newComplianceDueDate, status: 'Open', sync_status: 'pending' }
    try { await db.compliance_issues.add(newIssue); setNewComplianceDesc(''); setNewComplianceDueDate(''); await loadDBData(); handleSync(); addToast('Compliance flag created and assigned.', 'warning') }
    catch (err) { addToast('Failed to create issue: ' + err.message, 'error') }
  }

  // ── DATA EXPORT ──────────────────────────────────────────────
  const handleExportData = async () => {
    try {
      const data = {
        exportDate: new Date().toISOString(),
        carbonTransactions: carbonLogs,
        csrParticipations: csrLogs,
        complianceIssues,
        departments,
        emissionFactors: emissionFactorsList,
        challenges,
        users: allUsers.map(u => ({ ...u, password: '[REDACTED]' }))
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `ecosphere-export-${TODAY}.json`; a.click()
      URL.revokeObjectURL(url)
      addToast('Data exported as JSON successfully!', 'success')
    } catch (e) { addToast('Export failed: ' + e.message, 'error') }
  }

  // ── DERIVED DATA ─────────────────────────────────────────────
  const userStreak = useMemo(() => getStreak(carbonLogs, currentUser?.id), [carbonLogs, currentUser])
  const userLevel = useMemo(() => getLevel(userXP), [userXP])

  const activityFeed = useMemo(() => {
    if (!currentUser) return []
    const feed = [
      ...carbonLogs.filter(l => l.userId === currentUser.id).map(l => ({ ...l, feedType: 'carbon', ts: new Date(l.createdAt || l.date) })),
      ...csrLogs.filter(l => l.userId === currentUser.id).map(l => ({ ...l, feedType: 'csr', ts: new Date(l.createdAt || 0) })),
      ...complianceIssues.filter(i => i.ownerId === currentUser.id).map(i => ({ ...i, feedType: 'compliance', ts: new Date(i.createdAt || i.dueDate) }))
    ]
    return feed.sort((a, b) => b.ts - a.ts).slice(0, 15)
  }, [carbonLogs, csrLogs, complianceIssues, currentUser])

  // Sorted compliance issues (overdue first, then by due date)
  const sortedCompliance = useMemo(() => {
    return [...complianceIssues].sort((a, b) => {
      const aOverdue = new Date(TODAY) > new Date(a.dueDate) && a.status === 'Open'
      const bOverdue = new Date(TODAY) > new Date(b.dueDate) && b.status === 'Open'
      if (aOverdue && !bOverdue) return -1
      if (!aOverdue && bOverdue) return 1
      if (a.status === 'Open' && b.status !== 'Open') return -1
      if (a.status !== 'Open' && b.status === 'Open') return 1
      return new Date(a.dueDate) - new Date(b.dueDate)
    })
  }, [complianceIssues])

  // Dept risk heatmap categories
  const deptRiskData = useMemo(() => {
    if (!currentUser) return []
    const deptComp = sortedCompliance.filter(i => allUsers.find(u => u.id === i.ownerId)?.departmentId === currentUser.departmentId)
    const categories = ['Safety', 'Environmental', 'Waste', 'Reporting', 'Training']
    return categories.map(cat => {
      const count = deptComp.filter(i => i.status === 'Open').length
      const overdue = deptComp.filter(i => new Date(TODAY) > new Date(i.dueDate) && i.status === 'Open').length
      const level = overdue > 0 ? 'high' : count > 0 ? 'medium' : 'low'
      return { cat, count, overdue, level }
    })
  }, [sortedCompliance, currentUser, allUsers])

  // Challenge templates
  const CHALLENGE_TEMPLATES = [
    { title: 'Zero-Waste Lunch Week', xp: 120 },
    { title: 'EV/Bike Commute Day', xp: 80 },
    { title: 'Paper-Free Office Day', xp: 60 },
    { title: 'Community Cleanup Drive', xp: 200 },
    { title: 'Turn Off All Standby Devices', xp: 40 },
  ]

  // ── TICKER DATA ──────────────────────────────────────────────
  const totalEmissionsAll = useMemo(() => carbonLogs.reduce((a, c) => a + (c.calculatedEmissions || 0), 0).toFixed(1), [carbonLogs])
  const tickerItems = [
    { label: 'Total CO₂ Logged', value: `${totalEmissionsAll} kg`, accent: true },
    { label: 'CSR Activities', value: csrLogs.length },
    { label: 'Departments', value: departments.length },
    { label: 'Active Challenges', value: challenges.filter(c => c.status === 'Active').length },
    { label: 'Compliance Issues Open', value: complianceIssues.filter(i => i.status === 'Open').length },
    { label: 'ESG Score', value: `${Math.round(scores.overall)}%`, accent: true },
    { label: 'Total XP Earned', value: allUsers.reduce((a, u) => a + (u.totalXP || 0), 0) },
    { label: 'Users Registered', value: allUsers.length },
  ]
  const deptRanking = useMemo(() => {
    return [...departments].map(d => ({ ...d, esg: ((d.esgScores?.env || 70) + (d.esgScores?.soc || 70) + (d.esgScores?.gov || 70)) / 3 })).sort((a, b) => b.esg - a.esg)
  }, [departments])

  const getDeptName = (deptId) => departments.find(d => d.id === deptId)?.name || deptId

  // ─── RENDER ─────────────────────────────────────────────────────
  return (
    <main className="app-shell" data-theme={theme}>
      <ToastContainer toasts={toasts} onRemove={removeToast}/>

      {/* ── GLOBAL NAVBAR ── */}
      <div className="container" style={{ paddingBottom: 0 }}>
        <header className="navbar">
          <div className="nav-brand">
            <IconLeaf size={24} color="var(--accent-green)"/>
            Eco<span>Sphere</span>
          </div>
          <div className="nav-controls">
            {/* Online/Offline toggle */}
            <div className="hardware-toggle-container">
              <span className="hardware-label">{online ? 'Online' : 'Offline'}</span>
              <button onClick={() => setOnline(!online)} className={`hardware-switch ${online ? 'active' : ''}`} aria-label="Toggle connectivity" title="Toggle network online/offline (simulates offline queue)">
                <span className="hardware-switch-handle"/>
              </button>
            </div>
            {/* Theme toggle */}
            <button onClick={toggleTheme} className="tactile-btn icon-only" aria-label="Toggle theme" title="Toggle light/dark (T)">
              {theme === 'light' ? <IconMoon size={17}/> : <IconSun size={17}/>}
            </button>
            {/* Page control */}
            {page === 'dashboard'
              ? <button onClick={() => setPage('landing')} className="tactile-btn secondary">← Back</button>
              : <button onClick={() => setPage('dashboard')} className="tactile-btn primary">Launch Console</button>
            }
            {currentUser && (
              <button onClick={handleLogout} className="tactile-btn danger" style={{ padding: '8px 14px', fontSize: '0.82rem' }} title="Sign out">
                Log Out
              </button>
            )}
          </div>
        </header>
      </div>

      {/* ══════════════════════════════════════════════════════════
          LANDING PAGE
          ══════════════════════════════════════════════════════════ */}
      {page === 'landing' ? (
        <div className="container page-enter">
          {/* ── HERO ── */}
          <section className="landing-hero">
            <div className="landing-hero-content">
              <span className="landing-tagline">Local-First ESG Architecture</span>
              <h1 className="landing-title">
                Zero-Trust Sustainability <span>Management.</span>
              </h1>
              <p className="landing-desc">
                An intelligent corporate ESG environment designed to run anywhere — even in remote locations or connection dead zones. Auto-compute carbon transactions, log verified CSR activities offline, and keep teams aligned.
              </p>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <button onClick={() => setPage('dashboard')} className="tactile-btn primary machine-footer-btn" style={{ maxWidth: 260, padding: '14px 24px' }}>
                  Open Dashboard <IconArrowRight size={17}/>
                </button>
                <a href="#how-it-works" className="tactile-btn" style={{ padding: '14px 20px' }}>
                  How It Works
                </a>
              </div>
            </div>

            {/* Interactive Machine Preview */}
            <div className="landing-hero-preview">
              <div className="tactile-machine">
                <div className="machine-header">
                  <span className="machine-title">Eco-Calibration Console</span>
                  <div className="machine-status-light">
                    <span className="machine-light"/>ACTIVE
                  </div>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.4' }}>
                  Interact with the calibration dials to preview skeuomorphic depth and responsive ESG indicators.
                </p>
                <div className="machine-dial-grid">
                  <div className="embossed-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px' }}>
                    <CircularGauge value={previewValue} label="ESG Tuning" color="var(--accent-blue)" size={105}/>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button onClick={() => setPreviewValue(p => Math.max(10, p - 5))} className="tactile-btn icon-only" style={{ width: 30, height: 30, fontSize: '1rem' }}>−</button>
                      <button onClick={() => setPreviewValue(p => Math.min(100, p + 5))} className="tactile-btn icon-only" style={{ width: 30, height: 30, fontSize: '1rem' }}>+</button>
                    </div>
                  </div>
                  <div className="debossed-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '8px' }}>
                    <div>
                      <span className="hardware-label" style={{ fontSize: '0.62rem' }}>Engine Mode</span>
                      <p style={{ fontSize: '0.85rem', fontWeight: 800, marginTop: '3px' }}>Skeuomorphic V2</p>
                    </div>
                    <div>
                      <span className="hardware-label" style={{ fontSize: '0.62rem' }}>Shadow Depth</span>
                      <p style={{ fontSize: '0.85rem', fontWeight: 800, marginTop: '3px' }}>Tactile Slate</p>
                    </div>
                    <div>
                      <span className="hardware-label" style={{ fontSize: '0.62rem' }}>Current Score</span>
                      <p style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-green)', marginTop: '3px' }}>{previewValue}%</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setPage('dashboard')} className="tactile-btn primary machine-footer-btn">
                  Launch Interactive Console
                </button>
              </div>
            </div>
          </section>

          {/* ── LIVE STATS TICKER ── */}
          <div className="stats-ticker-wrapper">
            <div className="stats-ticker-track">
              {[...tickerItems, ...tickerItems].map((item, i) => (
                <div key={i} className="stats-ticker-item">
                  <span>{item.label}:</span>
                  <strong className={item.accent ? 'ticker-accent' : ''}>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* ── HOW IT WORKS ── */}
          <section id="how-it-works" className="how-it-works">
            <div className="section-header">
              <span className="section-subtitle">Simple. Powerful. Offline-Ready.</span>
              <h2 className="section-title">How EcoSphere Works</h2>
            </div>
            <div className="how-it-works-steps">
              {[
                { n: '01', icon: '⚡', title: 'Log Activities', desc: 'Record fuel usage, CSR events, and compliance tasks directly from your device — even without internet.' },
                { n: '02', icon: '📡', title: 'Sync to Cloud', desc: 'When back online, the IndexedDB queue automatically pushes all pending records to MongoDB Atlas.' },
                { n: '03', icon: '🏆', title: 'Earn Rewards', desc: 'Accumulate XP, unlock badges, climb leaderboards, and redeem real-world sustainability rewards.' },
              ].map((step, i) => (
                <div key={i} className="embossed-panel hiw-step" style={{ position: 'relative' }}>
                  <div className="hiw-step-number" style={{ background: 'var(--bg)', color: 'var(--accent-green)' }}>{step.n}</div>
                  <div className="hiw-step-icon">{step.icon}</div>
                  <h3 className="hiw-step-title">{step.title}</h3>
                  <p className="hiw-step-desc">{step.desc}</p>
                  {i < 2 && <span className="hiw-step-connector">→</span>}
                </div>
              ))}
            </div>
          </section>

          {/* ── DEPT LEADERBOARD TEASER ── */}
          {deptRanking.length > 0 && (
            <div className="embossed-panel" style={{ marginBottom: 40 }}>
              <h3 className="desk-section-title" style={{ marginBottom: 12 }}>
                <IconTrendUp size={18} color="var(--accent-amber)"/> Department ESG Leaderboard
              </h3>
              <div className="leaderboard-strip">
                {deptRanking.map((dept, i) => (
                  <div key={dept.id} className="leaderboard-card embossed-panel">
                    <span className="leaderboard-rank">{['🥇','🥈','🥉'][i] || `#${i+1}`}</span>
                    <span className="leaderboard-name">{dept.name}</span>
                    <span className="leaderboard-score">ESG: {dept.esg.toFixed(1)}% · {dept.employeeCount} staff</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── FEATURES ── */}
          <section id="features" className="landing-features">
            <div className="section-header">
              <span className="section-subtitle">Tactile Hardware Performance</span>
              <h2 className="section-title">Fully Integrated ESG Auditing</h2>
            </div>
            <div className="features-grid">
              <div className="embossed-panel feature-card">
                <div className="feature-icon-wrapper"><IconFlame size={22}/></div>
                <h3 className="feature-title">Automated Carbon Engine</h3>
                <p className="feature-desc">Input fuel operations and the engine computes carbon equivalents instantly using dynamic multipliers — no spreadsheets required.</p>
              </div>
              <div className="embossed-panel feature-card">
                <div className="feature-icon-wrapper blue"><IconAward size={22}/></div>
                <h3 className="feature-title">Gamified XP Rewards</h3>
                <p className="feature-desc">Earn XP for every eco-action, unlock badge milestones from Seedling to EcoTitan, and redeem real sustainability rewards.</p>
              </div>
              <div className="embossed-panel feature-card">
                <div className="feature-icon-wrapper"><IconShield size={22}/></div>
                <h3 className="feature-title">Active Governance Flags</h3>
                <p className="feature-desc">Never miss a compliance deadline. Overdue audits pulse with visual warnings until acknowledged by the responsible owner.</p>
              </div>
              <div className="embossed-panel feature-card">
                <div className="feature-icon-wrapper amber"><IconWifi size={22}/></div>
                <h3 className="feature-title">Offline-First Sync Queue</h3>
                <p className="feature-desc">All data is stored in IndexedDB first. When connectivity resumes, the sync pipeline pushes everything to MongoDB automatically.</p>
              </div>
              <div className="embossed-panel feature-card">
                <div className="feature-icon-wrapper blue"><IconUsers size={22}/></div>
                <h3 className="feature-title">Multi-Role Console</h3>
                <p className="feature-desc">Three distinct dashboards — Employee, Department Head, and System Admin — each with role-appropriate tools and visibility.</p>
              </div>
              <div className="embossed-panel feature-card">
                <div className="feature-icon-wrapper"><IconTrendUp size={22}/></div>
                <h3 className="feature-title">Real-Time ESG Scores</h3>
                <p className="feature-desc">Environmental, Social, and Governance scores auto-compute from live data and update across gauge dials in real time.</p>
              </div>
            </div>
          </section>

          <footer className="footer">
            <p>EcoSphere Sustainability Console • Powered by <span>Odoo GreenMetric</span></p>
            <p>Local-First Zero-Trust Architecture • All rights reserved © 2026</p>
            <p style={{ marginTop: 8, fontSize: '0.75rem' }}>
              Keyboard shortcuts (on dashboard): <strong>E</strong> Employee · <strong>D</strong> Dept Head · <strong>A</strong> Admin · <strong>T</strong> Theme
            </p>
          </footer>
        </div>

      ) : (
        /* ══════════════════════════════════════════════════════════
           DASHBOARD CONSOLE
           ══════════════════════════════════════════════════════════ */
        <div className="container page-enter">

          {/* ── SYNC STATUS BAR ── */}
          <div className="embossed-panel" style={{ marginBottom: 24, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {online ? <IconWifi size={20} color="var(--accent-green)"/> : <IconWifiOff size={20} color="var(--red)"/>}
              <div>
                <span className="hardware-label" style={{ fontSize: '0.65rem' }}>Sync Status Monitor</span>
                <p style={{ fontSize: '0.88rem', fontWeight: 700, marginTop: 1, color: syncing ? 'var(--accent-blue)' : 'var(--text)' }}>
                  {syncMessage || (online ? '🟢 Connected to cloud database' : '⚠️ Offline — items queued in IndexedDB')}
                </p>
              </div>
            </div>
            <button onClick={() => handleSync()} disabled={syncing} className={`tactile-btn ${syncing ? 'active' : ''}`} style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
              {syncing ? '⟳ Syncing...' : 'Sync Now'}
            </button>
          </div>

          {/* ── AUTH GATEWAY ── */}
          {!currentUser ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '30px 0' }}>
              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, width: '100%', maxWidth: 600 }}>
                  <SkeletonCard/><SkeletonCard/>
                </div>
              ) : (
                <div className="tactile-machine" style={{ maxWidth: 480, width: '100%' }}>
                  <div className="machine-header">
                    <span className="machine-title">Security Gateway</span>
                    <div className="machine-status-light">
                      <span className="machine-light" style={{ background: 'var(--red)', boxShadow: '0 0 8px var(--red)' }}/>
                      LOCKED
                    </div>
                  </div>

                  {/* Auth tabs */}
                  <div className="debossed-panel" style={{ padding: '5px', borderRadius: 10, display: 'flex', gap: 5, marginBottom: 18 }}>
                    <button onClick={() => setAuthView('login')} className={`tactile-btn ${authView === 'login' ? 'active primary' : ''}`} style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: '0.8rem' }}>Sign In</button>
                    <button onClick={() => setAuthView('register')} className={`tactile-btn ${authView === 'register' ? 'active secondary' : ''}`} style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: '0.8rem' }}>Register</button>
                  </div>

                  {authView === 'login' ? (
                    <form onSubmit={handleLoginSubmit}>
                      <div className="tactile-input-container">
                        <label className="tactile-label" htmlFor="login-user">Username or Email</label>
                        <input id="login-user" type="text" className="tactile-input" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} placeholder="e.g. jatin" required/>
                      </div>
                      <div className="tactile-input-container">
                        <label className="tactile-label" htmlFor="login-pass">Password</label>
                        <input id="login-pass" type="password" className="tactile-input" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Enter password" required/>
                      </div>
                      <button type="submit" className="tactile-btn primary machine-footer-btn" style={{ marginTop: 8 }}>Authenticate Console</button>
                      <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0' }}>
                        <hr style={{ flex: 1, border: 0, borderTop: '1px solid var(--border-color)' }}/>
                        <span style={{ padding: '0 10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>OR</span>
                        <hr style={{ flex: 1, border: 0, borderTop: '1px solid var(--border-color)' }}/>
                      </div>
                      <button type="button" onClick={handleGoogleSignIn} className="tactile-btn secondary machine-footer-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '11px' }}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/></svg>
                        Sign In with Google
                      </button>
                      <div className="debossed-panel" style={{ marginTop: 16, padding: '12px', borderRadius: 10, fontSize: '0.73rem', lineHeight: 1.5, color: 'var(--text-muted)' }}>
                        💡 <strong>Seeded credentials:</strong>
                        <ul style={{ margin: '4px 0 0 14px', padding: 0 }}>
                          <li>Admin: <code>jatin</code> / <code>password123</code></li>
                          <li>Dept Head: <code>sarah</code> / <code>password123</code></li>
                          <li>Employee: <code>michael</code> / <code>password123</code></li>
                        </ul>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleRegisterSubmit}>
                      {[
                        { id: 'reg-name', label: 'Full Name', val: registerName, set: setRegisterName, type: 'text', ph: 'e.g. Jack Smith' },
                        { id: 'reg-user', label: 'Username', val: registerUsername, set: setRegisterUsername, type: 'text', ph: 'Create username' },
                        { id: 'reg-pass', label: 'Password', val: registerPassword, set: setRegisterPassword, type: 'password', ph: 'Create password' },
                      ].map(f => (
                        <div key={f.id} className="tactile-input-container">
                          <label className="tactile-label" htmlFor={f.id}>{f.label}</label>
                          <input id={f.id} type={f.type} className="tactile-input" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} required/>
                        </div>
                      ))}
                      <div className="tactile-input-container">
                        <label className="tactile-label" htmlFor="reg-role">Role</label>
                        <select id="reg-role" className="tactile-input tactile-select" value={registerRole} onChange={e => setRegisterRole(e.target.value)}>
                          <option value="Employee">Employee</option>
                          <option value="Department Head">Department Head</option>
                          <option value="System Admin">System Admin</option>
                        </select>
                      </div>
                      <div className="tactile-input-container">
                        <label className="tactile-label" htmlFor="reg-dept">Department</label>
                        <select id="reg-dept" className="tactile-input tactile-select" value={registerDeptId} onChange={e => setRegisterDeptId(e.target.value)}>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      <button type="submit" className="tactile-btn secondary machine-footer-btn" style={{ marginTop: 8 }}>Register New Operator</button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* ── ROLE TABS ── */}
              {currentUser.role !== 'Employee' && (
                <div className="debossed-panel" style={{ padding: 7, borderRadius: 14, marginBottom: 24, display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  <button onClick={() => setActiveTab('employee')} className={`tactile-btn ${activeTab === 'employee' ? 'active primary' : ''}`} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: '0.83rem', whiteSpace: 'nowrap' }} title="E">
                    👷 Employee Console
                  </button>
                  {(currentUser.role === 'Department Head' || currentUser.role === 'System Admin') && (
                    <button onClick={() => setActiveTab('deptHead')} className={`tactile-btn ${activeTab === 'deptHead' ? 'active secondary' : ''}`} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: '0.83rem', whiteSpace: 'nowrap' }} title="D">
                      👔 Dept Head · {getDeptName(currentUser.departmentId)}
                    </button>
                  )}
                  {currentUser.role === 'System Admin' && (
                    <button onClick={() => setActiveTab('admin')} className={`tactile-btn ${activeTab === 'admin' ? 'active amber' : ''}`} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: '0.83rem', whiteSpace: 'nowrap' }} title="A">
                      🔧 Admin Master Console
                    </button>
                  )}
                </div>
              )}

              {/* ══════════════════════════════════════════════════
                  TAB 1: EMPLOYEE CONSOLE
                  ══════════════════════════════════════════════════ */}
              {activeTab === 'employee' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                  {/* Profile + XP Level + Streak */}
                  <div className="embossed-panel" style={{ padding: '22px 28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
                      <div className="user-hub">
                        <div className="user-avatar">{currentUser.name.charAt(0).toUpperCase()}</div>
                        <div className="user-meta">
                          <h4>{currentUser.name}</h4>
                          <p>Role: <strong>{currentUser.role}</strong> · Dept: <strong>{getDeptName(currentUser.departmentId)}</strong></p>
                          <p style={{ marginTop: 3, fontSize: '0.75rem', color: 'var(--text-muted)' }}>🔑 Press E/D/A to switch tabs</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* XP Level Ring */}
                        <div className="xp-level-card embossed-panel" style={{ padding: '14px 18px' }}>
                          <XPProgressRing xp={userXP}/>
                          <div className="xp-level-info">
                            <div className="xp-level-name">{userLevel.icon} {userLevel.name}</div>
                            <div className="xp-level-sub">{userXP} XP {userLevel.next ? `· ${userLevel.next.min - userXP} to ${userLevel.next.name}` : '· MAX LEVEL'}</div>
                            <div className="xp-progress-bar" style={{ width: 140 }}>
                              <div className="xp-progress-fill" style={{ width: `${userLevel.progress}%` }}/>
                            </div>
                          </div>
                        </div>
                        {/* Streak */}
                        <div className="streak-badge embossed-panel" style={{ flexDirection: 'column', textAlign: 'center', padding: '14px 18px' }}>
                          <span className="streak-flame">🔥</span>
                          <span className="streak-count">{userStreak}</span>
                          <span className="streak-label">Day Streak</span>
                        </div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div style={{ marginTop: 18, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                      <span className="hardware-label">Badge Collection</span>
                      <div className="badge-list">
                        {userBadges.length > 0 ? (
                          userBadges.map((badge, i) => <span key={i} className="badge-item unlocked">🏅 {badge}</span>)
                        ) : (
                          <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No badges yet. Complete challenges to earn your first!</span>
                        )}
                        {/* Locked preview badges */}
                        {['Eco Driver', 'CSR Champion', 'Eco Titan', 'Sustainably Starter'].filter(b => !userBadges.includes(b)).slice(0, 3).map((b, i) => (
                          <span key={i} className="badge-item locked">🔒 {b}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats Row */}
                  <div className="stats-row">
                    <StatCard icon="⚡" label="Carbon Logs" value={carbonLogs.filter(l => l.userId === currentUser.id).length} color="var(--red)"/>
                    <StatCard icon="🌿" label="Total CO₂" value={carbonLogs.filter(l => l.userId === currentUser.id).reduce((a, c) => a + (c.calculatedEmissions || 0), 0).toFixed(1)} suffix=" kg" color="var(--accent-amber)"/>
                    <StatCard icon="🏆" label="CSR Activities" value={csrLogs.filter(l => l.userId === currentUser.id).length} color="var(--accent-green)"/>
                    <StatCard icon="🚨" label="Active Issues" value={complianceIssues.filter(i => i.ownerId === currentUser.id && i.status === 'Open').length} color="var(--accent-blue)"/>
                  </div>

                  {/* Carbon Log + CSR Forms */}
                  <div className="dashboard-grid">
                    {/* Panel A: Carbon Logging */}
                    <div className="embossed-panel">
                      <h3 className="desk-section-title"><IconFlame size={17} color="var(--red)"/> Log Carbon Transaction</h3>
                      <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
                        Record fuel usage or utility consumption. CO₂ is computed instantly from dynamic multipliers.
                      </p>
                      <form onSubmit={handleAddCarbonLog}>
                        <div className="tactile-input-container">
                          <label className="tactile-label" htmlFor="emp-carbon-source">Emission Source</label>
                          <select id="emp-carbon-source" className="tactile-input tactile-select" value={carbonFuelSource} onChange={e => setCarbonFuelSource(e.target.value)}>
                            {Object.keys(emissionFactors).map(src => <option key={src} value={src}>{src} (×{emissionFactors[src]} CO₂/unit)</option>)}
                          </select>
                        </div>
                        <div className="tactile-input-container">
                          <label className="tactile-label" htmlFor="emp-carbon-amount">Quantity / Units</label>
                          <input id="emp-carbon-amount" type="number" className="tactile-input" placeholder="e.g. 150" value={carbonAmount} onChange={e => setCarbonAmount(e.target.value)} min="0.1" step="any" required/>
                        </div>
                        {/* Live CO₂ readout */}
                        <div className="debossed-panel" style={{ padding: '14px', borderRadius: 12, marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span className="hardware-label" style={{ fontSize: '0.62rem' }}>Calculated CO₂ Output</span>
                            <p style={{ fontSize: '1.3rem', fontWeight: 900, color: calculatedEmissions > 0 ? 'var(--red)' : 'var(--text-muted)', marginTop: 3 }}>
                              {calculatedEmissions} <span style={{ fontSize: '0.82rem', fontWeight: 400 }}>kg CO₂e</span>
                            </p>
                          </div>
                          <IconLeaf size={26} color={calculatedEmissions > 0 ? 'var(--red)' : 'var(--text-muted)'}/>
                        </div>
                        <button type="submit" className="tactile-btn primary" style={{ width: '100%' }}>
                          Confirm & Log (+25 XP) <IconArrowRight size={16}/>
                        </button>
                      </form>
                    </div>

                    {/* Panel B: CSR Portal */}
                    <div className="embossed-panel">
                      <h3 className="desk-section-title"><IconAward size={17} color="var(--accent-blue)"/> CSR Gamification Portal</h3>
                      <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
                        Participated in a CSR event? Select the challenge, upload proof, and claim your XP.
                      </p>
                      <form onSubmit={handleAddCsrLog}>
                        <div className="tactile-input-container">
                          <label className="tactile-label" htmlFor="emp-csr-challenge">Sustainability Challenge</label>
                          <select id="emp-csr-challenge" className="tactile-input tactile-select" value={csrChallenge} onChange={e => setCsrChallenge(e.target.value)}>
                            {challenges.filter(ch => ch.status === 'Active').map(ch => <option key={ch.id} value={ch.title}>{ch.title} (+{ch.xpValue} XP)</option>)}
                          </select>
                        </div>
                        <div className="tactile-input-container">
                          <label className="tactile-label">Upload Participation Proof</label>
                          <div className={`tactile-file-drop ${csrFile ? 'has-file' : ''}`}>
                            <IconCloud size={22} color={csrFile ? 'var(--accent-green)' : 'var(--text-muted)'}/>
                            <span style={{ fontSize: '0.83rem', fontWeight: 700 }}>
                              {csrFile ? `✓ ${csrFileName}` : 'Drag & drop or browse file'}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Image, PDF, or document required</span>
                            <input type="file" className="file-input-hidden" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx"/>
                          </div>
                        </div>
                        <button type="submit" className={`tactile-btn ${csrFile ? 'secondary' : ''}`} style={{ width: '100%', marginTop: 8 }} disabled={!csrFile}>
                          {!csrFile ? '🔒 Evidence Required' : 'Submit CSR Participation'}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Governance + Rewards */}
                  <div className="dashboard-grid">
                    {/* Panel C: My Compliance Issues */}
                    <div className="embossed-panel">
                      <h3 className="desk-section-title"><IconShield size={17} color="var(--accent-amber)"/> Assigned Policy Actions</h3>
                      <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                        Compliance tasks assigned to you. Acknowledge each to earn +50 XP.
                      </p>
                      <div className="compliance-list" style={{ maxHeight: 380, overflowY: 'auto' }}>
                        {sortedCompliance.filter(i => i.ownerId === currentUser.id).length > 0 ? (
                          sortedCompliance.filter(i => i.ownerId === currentUser.id).map(issue => {
                            const isOverdue = new Date(TODAY) > new Date(issue.dueDate) && issue.status === 'Open'
                            return (
                              <div key={issue.id} className="compliance-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span className={`compliance-badge ${issue.status === 'Open' ? (isOverdue ? 'overdue' : 'open') : 'closed'}`}>
                                    {issue.status === 'Open' ? (isOverdue ? '⚠️ OVERDUE' : 'Pending') : '✓ Done'}
                                  </span>
                                  <button onClick={() => handleToggleCompliance(issue.id, issue.status)} className={`tactile-btn ${issue.status === 'Closed' ? 'active' : 'primary'}`} style={{ padding: '5px 10px', fontSize: '0.72rem' }}>
                                    {issue.status === 'Open' ? '+50 XP Acknowledge' : 'Reopen'}
                                  </button>
                                </div>
                                <div>
                                  <span className="compliance-desc" style={{ display: 'block' }}>{issue.description}</span>
                                  <div className="compliance-meta" style={{ marginTop: 5 }}>
                                    <span>Due: {issue.dueDate}</span>
                                    <span className={`sync-dot ${issue.sync_status}`} style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%' }}/>
                                    <span>{issue.sync_status}</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <div className="debossed-panel" style={{ padding: 18, textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            🎉 No assigned compliance issues. You're all clear!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Panel D: Rewards Store */}
                    <div className="embossed-panel">
                      <h3 className="desk-section-title"><IconAward size={17} color="var(--accent-green)"/> Eco Rewards Store</h3>
                      <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'var(--bg)', boxShadow: 'inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Balance</span>
                        <p style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--accent-green)' }}>{userXP} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>XP</span></p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                          { icon: '🌳', name: 'Plant a Native Tree', desc: 'We plant a certified sapling on your behalf.', cost: 300 },
                          { icon: '⚡', name: 'Clean Energy Certificate', desc: 'Offset 100 kWh of your home grid footprint.', cost: 500 },
                          { icon: '🍱', name: 'Organic Cafeteria Voucher', desc: 'Free plant-based meal at the cafeteria.', cost: 200 },
                          { icon: '🎽', name: 'EcoSphere Sustainability Kit', desc: 'Branded reusable products kit.', cost: 750 },
                          { icon: '🌍', name: 'Carbon Offset Certificate', desc: 'Official PDF certificate for 1 tonne CO₂.', cost: 1000 },
                        ].map(r => (
                          <div key={r.name} className="embossed-panel" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                            <div>
                              <span style={{ fontWeight: 800, fontSize: '0.9rem', display: 'block' }}>{r.icon} {r.name}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.desc}</span>
                            </div>
                            <button onClick={() => handleRedeem(r.cost, r.name)} disabled={userXP < r.cost} className="tactile-btn primary" style={{ padding: '7px 12px', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                              {userXP >= r.cost ? `${r.cost} XP` : `Need ${r.cost}`}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Activity Timeline */}
                  <div className="embossed-panel">
                    <h3 className="desk-section-title"><IconClock size={17} color="var(--accent-blue)"/> Activity Timeline</h3>
                    {activityFeed.length > 0 ? (
                      <div className="activity-timeline">
                        {activityFeed.map((item, i) => {
                          const isCarbonItem = item.feedType === 'carbon'
                          const isCsrItem = item.feedType === 'csr'
                          const ch = isCsrItem ? challenges.find(c => c.id === item.activityId) : null
                          return (
                            <div key={item.id || i} className={`timeline-item type-${item.feedType}`}>
                              <div className="timeline-item-icon">
                                {isCarbonItem ? '⚡' : isCsrItem ? '🏆' : '🚨'}
                              </div>
                              <div className="timeline-item-body">
                                <div className="timeline-item-title">
                                  {isCarbonItem && `${item.sourceType} — ${item.rawAmount} units`}
                                  {isCsrItem && (ch ? ch.title : 'CSR Activity')}
                                  {item.feedType === 'compliance' && item.description}
                                  {isCarbonItem && <span className="timeline-item-badge red">+{item.calculatedEmissions} kg CO₂</span>}
                                  {isCsrItem && ch && <span className="timeline-item-badge green">+{ch.xpValue} XP</span>}
                                  {item.feedType === 'compliance' && <span className={`timeline-item-badge ${item.status === 'Open' ? 'amber' : 'green'}`}>{item.status}</span>}
                                </div>
                                <div className="timeline-item-meta">
                                  {item.date || (item.createdAt ? item.createdAt.split('T')[0] : '')} · {item.sync_status}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="debossed-panel" style={{ padding: 18, textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        No activity yet. Start logging to see your timeline!
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* ══════════════════════════════════════════════════
                  TAB 2: DEPT HEAD CONSOLE
                  ══════════════════════════════════════════════════ */}
              {activeTab === 'deptHead' && (currentUser.role === 'Department Head' || currentUser.role === 'System Admin') && (
                <>
                  {/* ESG Gauges */}
                  <div className="gauges-row">
                    <div className="embossed-panel master-gauge-card">
                      <CircularGauge value={departmentScores.overall} label="Dept Overall" color="var(--accent-blue)" size={155}/>
                      <div className="master-gauge-info">
                        <h3>{getDeptName(currentUser.departmentId)} Department</h3>
                        <p>Live ESG aggregates for this division. Scores update in real time as team members log activities.</p>
                        <div style={{ marginTop: 12 }}>
                          <span className="badge-item" style={{ fontSize: '0.7rem', padding: '4px 8px', color: 'var(--accent-blue)' }}>
                            Head: {currentUser.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="embossed-panel gauge-card">
                      <CircularGauge value={departmentScores.env} label="Env Score" color="var(--accent-green)"/>
                    </div>
                    <div className="embossed-panel gauge-card">
                      <CircularGauge value={departmentScores.soc} label="Social Score" color="var(--accent-blue)"/>
                    </div>
                    <div className="embossed-panel gauge-card">
                      <CircularGauge value={departmentScores.gov} label="Gov Score" color="var(--accent-amber)"/>
                    </div>
                  </div>

                  {/* Benchmark + Heatmap */}
                  <div className="dashboard-grid" style={{ marginBottom: 24 }}>
                    {/* Dept vs Company benchmark */}
                    <div className="embossed-panel">
                      <h3 className="desk-section-title"><IconTrendUp size={17} color="var(--accent-blue)"/> Dept vs. Company Benchmark</h3>
                      <div className="bar-chart" style={{ marginTop: 8 }}>
                        {[
                          { label: 'ENV (Dept)', val: departmentScores.env, cls: 'env' },
                          { label: 'ENV (Company)', val: scores.env, cls: 'env' },
                          { label: 'SOC (Dept)', val: departmentScores.soc, cls: 'soc' },
                          { label: 'SOC (Company)', val: scores.soc, cls: 'soc' },
                          { label: 'GOV (Dept)', val: departmentScores.gov, cls: 'gov' },
                          { label: 'GOV (Company)', val: scores.gov, cls: 'gov' },
                        ].map((b, i) => (
                          <div key={i} className="bar-chart-row">
                            <span className="bar-chart-label" style={{ minWidth: 120 }}>{b.label}</span>
                            <div className="bar-chart-track">
                              <div className={`bar-chart-fill ${b.cls}`} style={{ width: `${b.val}%` }}/>
                            </div>
                            <span className="bar-chart-value">{b.val.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Risk Heatmap */}
                    <div className="embossed-panel">
                      <h3 className="desk-section-title"><IconShield size={17} color="var(--red)"/> Compliance Risk Heatmap</h3>
                      <div className="risk-heatmap">
                        {deptRiskData.map((cell, i) => (
                          <div key={i} className={`risk-cell ${cell.level}`}>
                            <div className="risk-cell-count">{cell.count}</div>
                            <div>{cell.cat}</div>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 10 }}>
                        🟢 Low · 🟡 Medium · 🔴 High risk. Based on open issues.
                      </p>
                    </div>
                  </div>

                  {/* Team Table */}
                  <div className="embossed-panel" style={{ marginBottom: 24 }}>
                    <h3 className="desk-section-title"><IconUsers size={17} color="var(--accent-blue)"/> Team Member Overview</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="team-table">
                        <thead>
                          <tr>
                            <th>Member</th>
                            <th>Role</th>
                            <th>XP / Level</th>
                            <th>Badges</th>
                            <th>Logs</th>
                            <th>CSR</th>
                            <th>Issues</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allUsers.filter(u => u.departmentId === currentUser.departmentId).map(u => {
                            const lv = getLevel(u.totalXP || 0)
                            return (
                              <tr key={u.id}>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className="team-avatar">{u.name.charAt(0)}</span>
                                    <span style={{ fontWeight: 700 }}>{u.name}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className={`role-badge ${u.role === 'System Admin' ? 'admin' : u.role === 'Department Head' ? 'head' : 'employee'}`}>
                                    {u.role === 'System Admin' ? 'Admin' : u.role === 'Department Head' ? 'Head' : 'Emp.'}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{u.totalXP || 0} XP · {lv.icon} {lv.name}</div>
                                  <div className="xp-mini-bar">
                                    <div className="xp-mini-fill" style={{ width: `${lv.progress}%` }}/>
                                  </div>
                                </td>
                                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{(u.badges || []).length > 0 ? (u.badges || []).slice(0, 2).join(', ') : '—'}</td>
                                <td style={{ fontWeight: 700, color: 'var(--red)' }}>{carbonLogs.filter(l => l.userId === u.id).length}</td>
                                <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{csrLogs.filter(l => l.userId === u.id).length}</td>
                                <td style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>{complianceIssues.filter(i => i.ownerId === u.id && i.status === 'Open').length}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Compliance Management */}
                  <div className="dashboard-grid">
                    <div className="embossed-panel">
                      <h3 className="desk-section-title"><IconShield size={17} color="var(--red)"/> Create Compliance Flag</h3>

                      {/* Quick-create chips */}
                      <div style={{ marginBottom: 4 }}>
                        <span className="tactile-label">Quick Templates</span>
                        <div className="challenge-chips" style={{ marginTop: 6 }}>
                          {['Safety Inspection Overdue', 'Waste Audit Required', 'Training Not Completed', 'Environmental Report Due', 'Equipment Safety Check'].map(t => (
                            <button key={t} className="challenge-chip" onClick={() => setNewComplianceDesc(t)}>{t}</button>
                          ))}
                        </div>
                      </div>

                      <form onSubmit={handleAddCompliance}>
                        <div className="tactile-input-container">
                          <label className="tactile-label" htmlFor="comp-desc">Issue Description</label>
                          <input id="comp-desc" type="text" className="tactile-input" placeholder="e.g. Hazardous waste inspection overdue" value={newComplianceDesc} onChange={e => setNewComplianceDesc(e.target.value)} required/>
                        </div>
                        <div className="tactile-input-container">
                          <label className="tactile-label" htmlFor="comp-owner">Assign To</label>
                          <select id="comp-owner" className="tactile-input tactile-select" value={newComplianceOwner} onChange={e => setNewComplianceOwner(e.target.value)}>
                            {allUsers.filter(u => u.departmentId === currentUser.departmentId).map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                          </select>
                        </div>
                        <div className="tactile-input-container">
                          <label className="tactile-label" htmlFor="comp-due">Due Date</label>
                          <input id="comp-due" type="date" className="tactile-input" value={newComplianceDueDate} onChange={e => setNewComplianceDueDate(e.target.value)} required/>
                        </div>
                        <button type="submit" className="tactile-btn danger" style={{ width: '100%' }}>
                          Create Violation Flag
                        </button>
                      </form>
                    </div>

                    <div className="embossed-panel">
                      <h3 className="desk-section-title"><IconShield size={17} color="var(--red)"/> Dept Compliance Queue</h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>Sorted by urgency — overdue items appear first.</p>
                      <div className="compliance-list" style={{ maxHeight: 400, overflowY: 'auto' }}>
                        {sortedCompliance.filter(issue => allUsers.find(u => u.id === issue.ownerId)?.departmentId === currentUser.departmentId).map(issue => {
                          const isOverdue = new Date(TODAY) > new Date(issue.dueDate) && issue.status === 'Open'
                          const ownerUser = allUsers.find(u => u.id === issue.ownerId)
                          return (
                            <div key={issue.id} className="compliance-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className={`compliance-badge ${issue.status === 'Open' ? (isOverdue ? 'overdue' : 'open') : 'closed'}`}>
                                  {issue.status === 'Open' ? (isOverdue ? '⚠️ Overdue' : 'Open') : '✓ Closed'}
                                </span>
                                <button onClick={() => handleToggleCompliance(issue.id, issue.status)} className={`tactile-btn ${issue.status === 'Closed' ? 'active' : ''}`} style={{ padding: '5px 10px', fontSize: '0.72rem' }}>
                                  {issue.status === 'Open' ? 'Close Issue' : 'Reopen'}
                                </button>
                              </div>
                              <div>
                                <span className="compliance-desc" style={{ display: 'block', fontWeight: 700 }}>{issue.description}</span>
                                <div className="compliance-meta" style={{ marginTop: 5 }}>
                                  <span>Owner: {ownerUser?.name || issue.ownerId}</span>
                                  <span>Due: {issue.dueDate}</span>
                                  <span>{issue.sync_status}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                        {sortedCompliance.filter(i => allUsers.find(u => u.id === i.ownerId)?.departmentId === currentUser.departmentId).length === 0 && (
                          <div className="debossed-panel" style={{ padding: 16, textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            🎉 No compliance issues in your department!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ══════════════════════════════════════════════════
                  TAB 3: SYSTEM ADMIN CONSOLE
                  ══════════════════════════════════════════════════ */}
              {activeTab === 'admin' && currentUser.role === 'System Admin' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginBottom: 40 }}>

                  {/* Global ESG Overview + Bar Chart */}
                  <div className="embossed-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                      <h3 className="desk-section-title" style={{ marginBottom: 0 }}>
                        <IconGlobe size={18} color="var(--accent-green)"/> Company-Wide ESG Overview
                      </h3>
                      <button onClick={handleExportData} className="tactile-btn secondary" style={{ padding: '8px 14px', fontSize: '0.8rem', gap: 6 }}>
                        <IconDownload size={15}/> Export JSON
                      </button>
                    </div>

                    {/* Global gauges */}
                    <div className="gauges-row" style={{ marginBottom: 28 }}>
                      {[
                        { label: 'Environmental', val: scores.env, color: 'var(--accent-green)' },
                        { label: 'Social', val: scores.soc, color: 'var(--accent-blue)' },
                        { label: 'Governance', val: scores.gov, color: 'var(--accent-amber)' },
                        { label: 'Overall ESG', val: scores.overall, color: 'var(--accent-purple)' },
                      ].map(g => (
                        <div key={g.label} className="embossed-panel gauge-card">
                          <CircularGauge value={g.val} label={g.label} color={g.color}/>
                        </div>
                      ))}
                    </div>

                    {/* Per-Dept ESG bars */}
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Per-Department Overall Scores</h4>
                    <div className="bar-chart">
                      {departments.map(d => {
                        const avg = ((d.esgScores?.env || 70) + (d.esgScores?.soc || 70) + (d.esgScores?.gov || 70)) / 3
                        return (
                          <div key={d.id} className="bar-chart-row">
                            <span className="bar-chart-label">{d.name}</span>
                            <div className="bar-chart-track">
                              <div className="bar-chart-fill overall" style={{ width: `${avg}%` }}/>
                            </div>
                            <span className="bar-chart-value">{avg.toFixed(1)}%</span>
                          </div>
                        )
                      })}
                      {departments.length === 0 && <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>No departments configured.</p>}
                    </div>
                  </div>

                  {/* Company Stats Row */}
                  <div className="stats-row">
                    <StatCard icon="🏢" label="Departments" value={departments.length} color="var(--accent-blue)"/>
                    <StatCard icon="👥" label="Users" value={allUsers.length} color="var(--accent-green)"/>
                    <StatCard icon="⚡" label="Total CO₂ Logged" value={parseFloat(totalEmissionsAll)} suffix=" kg" color="var(--red)"/>
                    <StatCard icon="🏆" label="Total XP Earned" value={allUsers.reduce((a, u) => a + (u.totalXP || 0), 0)} color="var(--accent-amber)"/>
                  </div>

                  {/* User Management Table */}
                  <div className="embossed-panel">
                    <h3 className="desk-section-title"><IconUsers size={18} color="var(--accent-blue)"/> User Management</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="user-mgmt-table">
                        <thead>
                          <tr>
                            <th>User</th><th>Role</th><th>Department</th><th>XP</th><th>Level</th><th>Badges</th><th>Sync</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allUsers.map(u => {
                            const lv = getLevel(u.totalXP || 0)
                            return (
                              <tr key={u.id}>
                                <td style={{ fontWeight: 700 }}>{u.name}</td>
                                <td><span className={`role-badge ${u.role === 'System Admin' ? 'admin' : u.role === 'Department Head' ? 'head' : 'employee'}`}>{u.role === 'System Admin' ? 'Admin' : u.role === 'Department Head' ? 'Dept Head' : 'Employee'}</span></td>
                                <td style={{ color: 'var(--text-muted)' }}>{getDeptName(u.departmentId)}</td>
                                <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{u.totalXP || 0}</td>
                                <td>{lv.icon} {lv.name}</td>
                                <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{(u.badges || []).length || '—'}</td>
                                <td>
                                  <span className={`sync-dot ${u.sync_status}`} style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%' }}/>
                                  {' '}{u.sync_status}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Dept + Emission + Challenge Management */}
                  <div className="embossed-panel">
                    <h3 className="desk-section-title"><IconGlobe size={18} color="var(--accent-blue)"/> Department Configuration</h3>
                    <div className="dashboard-grid">
                      <div>
                        <form onSubmit={handleAddDept}>
                          <div className="tactile-input-container">
                            <label className="tactile-label" htmlFor="dept-name">Department Name</label>
                            <input id="dept-name" type="text" className="tactile-input" placeholder="e.g. Quality Assurance" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} required/>
                          </div>
                          <div className="tactile-input-container">
                            <label className="tactile-label" htmlFor="dept-head">Department Head</label>
                            <select id="dept-head" className="tactile-input tactile-select" value={newDeptHead} onChange={e => setNewDeptHead(e.target.value)}>
                              {allUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                            </select>
                          </div>
                          <div className="tactile-input-container">
                            <label className="tactile-label" htmlFor="dept-emp">Employee Count</label>
                            <input id="dept-emp" type="number" className="tactile-input" placeholder="e.g. 12" value={newDeptEmpCount} onChange={e => setNewDeptEmpCount(e.target.value)} min="1" required/>
                          </div>
                          <button type="submit" className="tactile-btn primary" style={{ width: '100%' }}>Add Department</button>
                        </form>
                      </div>
                      <div>
                        <span className="hardware-label">Configured Departments ({departments.length})</span>
                        <div className="log-list" style={{ maxHeight: 280, overflowY: 'auto', marginTop: 10 }}>
                          {departments.map(d => {
                            const mgr = allUsers.find(u => u.id === d.headId)
                            return (
                              <div key={d.id} className="log-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 800 }}>🏢 {d.name}</span>
                                  <button onClick={() => handleDeleteDept(d.id)} className="tactile-btn danger" style={{ padding: '3px 8px', fontSize: '0.68rem' }}>Delete</button>
                                </div>
                                <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                  <span>Head: {mgr ? mgr.name : d.headId}</span>
                                  <span>Staff: {d.employeeCount}</span>
                                  <span className={`sync-dot ${d.sync_status}`} style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', alignSelf: 'center' }}/>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="embossed-panel">
                    <h3 className="desk-section-title"><IconFlame size={18} color="var(--accent-green)"/> Emission Multipliers</h3>
                    <div className="dashboard-grid">
                      <div>
                        <form onSubmit={handleAddEf}>
                          <div className="tactile-input-container">
                            <label className="tactile-label" htmlFor="ef-source">Fuel / Energy Source</label>
                            <input id="ef-source" type="text" className="tactile-input" placeholder="e.g. Bio-Fuel" value={newEfSource} onChange={e => setNewEfSource(e.target.value)} required/>
                          </div>
                          <div className="tactile-input-container">
                            <label className="tactile-label" htmlFor="ef-mult">CO₂ Multiplier (kg per unit)</label>
                            <input id="ef-mult" type="number" className="tactile-input" placeholder="e.g. 1.25" step="0.01" value={newEfMultiplier} onChange={e => setNewEfMultiplier(e.target.value)} min="0.01" required/>
                          </div>
                          <button type="submit" className="tactile-btn primary" style={{ width: '100%' }}>Add Emission Factor</button>
                        </form>
                      </div>
                      <div>
                        <span className="hardware-label">Active Factors ({emissionFactorsList.length})</span>
                        <div className="log-list" style={{ maxHeight: 280, overflowY: 'auto', marginTop: 10 }}>
                          {emissionFactorsList.map(ef => (
                            <div key={ef.id} className="log-item" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ fontWeight: 800 }}>⚡ {ef.sourceType}</span>
                                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ef.sync_status}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontWeight: 800, color: 'var(--red)' }}>×{ef.multiplierValue}</span>
                                <button onClick={() => handleDeleteEf(ef.id)} className="tactile-btn danger" style={{ padding: '3px 8px', fontSize: '0.68rem' }}>Delete</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="embossed-panel">
                    <h3 className="desk-section-title"><IconAward size={18} color="var(--accent-green)"/> Gamification Challenges</h3>

                    {/* Challenge templates */}
                    <div style={{ marginBottom: 14 }}>
                      <span className="tactile-label">Quick Add Templates</span>
                      <div className="challenge-chips" style={{ marginTop: 6 }}>
                        {CHALLENGE_TEMPLATES.map(t => (
                          <button key={t.title} className="challenge-chip" onClick={() => { setNewChallengeTitle(t.title); setNewChallengeXP(String(t.xp)) }}>
                            {t.title} (+{t.xp})
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="dashboard-grid">
                      <div>
                        <form onSubmit={handleAddChallenge}>
                          <div className="tactile-input-container">
                            <label className="tactile-label" htmlFor="challenge-title">Challenge Title</label>
                            <input id="challenge-title" type="text" className="tactile-input" placeholder="e.g. Plant a Community Tree" value={newChallengeTitle} onChange={e => setNewChallengeTitle(e.target.value)} required/>
                          </div>
                          <div className="tactile-input-container">
                            <label className="tactile-label" htmlFor="challenge-xp">XP Reward</label>
                            <input id="challenge-xp" type="number" className="tactile-input" placeholder="e.g. 150" value={newChallengeXP} onChange={e => setNewChallengeXP(e.target.value)} min="10" required/>
                          </div>
                          <button type="submit" className="tactile-btn primary" style={{ width: '100%' }}>Add Challenge</button>
                        </form>
                      </div>
                      <div>
                        <span className="hardware-label">Active Registry ({challenges.length})</span>
                        <div className="log-list" style={{ maxHeight: 280, overflowY: 'auto', marginTop: 10 }}>
                          {challenges.map(ch => (
                            <div key={ch.id} className="log-item" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ fontWeight: 800 }}>🏆 {ch.title}</span>
                                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ch.status} · {ch.sync_status}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontWeight: 800, color: 'var(--accent-blue)' }}>+{ch.xpValue} XP</span>
                                <button onClick={() => handleDeleteChallenge(ch.id)} className="tactile-btn danger" style={{ padding: '3px 8px', fontSize: '0.68rem' }}>Delete</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Audit Terminal */}
                  <div className="embossed-panel">
                    <h3 className="desk-section-title"><IconTerminal size={18} color="var(--accent-green)"/> Sync Audit Trail</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>Live log of all sync events, auth actions, and database operations.</p>
                    <div className="audit-terminal">
                      {auditLog.length === 0 ? (
                        <div style={{ color: '#586e75' }}>// Waiting for events...</div>
                      ) : (
                        auditLog.map(log => (
                          <div key={log.id} className="audit-log-line">
                            <span className="audit-log-time">[{log.time}]</span>
                            <span className={`audit-log-type ${log.type}`}>{log.type.toUpperCase()}</span>
                            <span className="audit-log-msg">{log.msg}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}
            </>
          )}
        </div>
      )}

      <footer className="footer">
        <p>EcoSphere Sustainability Console · Powered by <span>Odoo GreenMetric</span></p>
        <p>Local-First Zero-Trust Architecture · © 2026</p>
      </footer>
    </main>
  )
}

export default App


