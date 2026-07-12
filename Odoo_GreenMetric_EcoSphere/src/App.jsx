import React, { useState, useEffect, useMemo } from 'react'
import { db, seedLocalSampleData } from './features/offlineStore'
import './App.css'

// Safe UUID generator supporting non-secure contexts (HTTP network IPs)
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const formatTimestamp = (dateVal) => {
  if (!dateVal) return ''
  try {
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return String(dateVal)
    const pad = (num) => String(num).padStart(2, '0')
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
    const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    return `${dateStr} ${timeStr}`
  } catch (e) {
    return String(dateVal)
  }
}


// --- CUSTOM SVG ICONS FOR TACTILE GRAPHICS ---
function IconLeaf({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 0 9.5a7 7 0 0 1-8 8.5z" />
      <path d="M19 2c-2.26 4.33-5.27 7.14-8 8" />
    </svg>
  )
}

function IconGlobe({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function IconActivity({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function IconShield({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function IconFlame({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  )
}

function IconAward({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  )
}

function IconWifi({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  )
}

function IconWifiOff({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  )
}

function IconSun({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function IconMoon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function IconCloud({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  )
}

function IconArrowRight({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

// --- SUB-COMPONENT: SKEUOMORPHIC CIRCULAR GAUGE ---
function CircularGauge({ value, max = 100, label, color = 'var(--accent-green)', size = 140 }) {
  const radius = size * 0.35
  const strokeWidth = size * 0.08
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(Math.max(value, 0), max)
  const strokeDashoffset = circumference - (progress / max) * circumference

  return (
    <div className="gauge-container" style={{ width: size, height: size }}>
      <div className="gauge-outer">
        <svg width={size} height={size} className="gauge-svg">
          {/* Embossed Track (Inset effect inside outer circle) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--shadow-dark)"
            strokeWidth={strokeWidth}
            className="gauge-track"
          />
          {/* Active Dial Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="gauge-progress"
          />
        </svg>
        {/* Debossed Dial Face */}
        <div className="gauge-inner">
          <span className="gauge-value">{Math.round(value)}%</span>
          <span className="gauge-label">{label}</span>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [page, setPage] = useState('landing') // 'landing' or 'dashboard'
  const [theme, setTheme] = useState('light') // 'light' or 'dark'
  const [online, setOnline] = useState(true) // offline simulation mode
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [activeTab, setActiveTab] = useState('deptHead') // 'deptHead', 'admin', 'unauthorized'

  // Authentication State
  const [currentUser, setCurrentUser] = useState(null)
  const [authView, setAuthView] = useState('login') // 'login' or 'register'
  
  // Login input states
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register input states
  const [registerName, setRegisterName] = useState('')
  const [registerUsername, setRegisterUsername] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerRole, setRegisterRole] = useState('Employee')
  const [registerDeptId, setRegisterDeptId] = useState('dept-admin')

  // State loaded from Dexie DB
  const [carbonLogs, setCarbonLogs] = useState([])
  const [csrLogs, setCsrLogs] = useState([])
  const [complianceIssues, setComplianceIssues] = useState([])
  const [departments, setDepartments] = useState([])
  const [emissionFactorsList, setEmissionFactorsList] = useState([])
  const [challenges, setChallenges] = useState([])
  const [allUsers, setAllUsers] = useState([])

  // User stats (computed or synced for logged-in user)
  const userXP = currentUser ? currentUser.totalXP : 0
  const userBadges = currentUser ? currentUser.badges || [] : []

  const handleLogout = () => {
    localStorage.removeItem('ecosphere-user-id')
    setCurrentUser(null)
    setActiveTab('employee')
  }

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('ecosphere-theme') || 'light'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    localStorage.setItem('ecosphere-theme', nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
  }

  // Seeding sample data and reloading from Dexie DB
  const loadDBData = async () => {
    try {
      await seedLocalSampleData()
      const cLogs = await db.carbon_transactions.toArray()
      const sLogs = await db.csr_participations.toArray()
      const compIssues = await db.compliance_issues.toArray()
      const depts = await db.departments.toArray()
      const efs = await db.emission_factors.toArray()
      const chs = await db.challenges.toArray()
      const usrs = await db.users.toArray()

      setCarbonLogs(cLogs.reverse())
      setCsrLogs(sLogs.reverse())
      setComplianceIssues(compIssues)
      setDepartments(depts)
      setEmissionFactorsList(efs)
      setChallenges(chs)
      setAllUsers(usrs)
    } catch (e) {
      console.error("Dexie failed to load or seed data:", e)
    }
  }

  // Auto-login from session
  useEffect(() => {
    const checkSession = async () => {
      const savedId = localStorage.getItem('ecosphere-user-id')
      if (savedId && allUsers.length > 0) {
        const found = allUsers.find(u => u.id === savedId)
        if (found) {
          setCurrentUser(found)
        }
      }
    }
    checkSession()
  }, [allUsers])

  // Adjust active tab based on logged-in user role
  useEffect(() => {
    if (!currentUser) return
    if (currentUser.role === 'System Admin') {
      if (activeTab !== 'admin' && activeTab !== 'deptHead' && activeTab !== 'employee') {
        setActiveTab('admin')
      }
    } else if (currentUser.role === 'Department Head') {
      if (activeTab !== 'deptHead' && activeTab !== 'employee') {
        setActiveTab('deptHead')
      }
    } else {
      setActiveTab('employee')
    }
  }, [currentUser, activeTab])

  // --- MOCK INTERACTIVE DIAL STATE FOR LANDING PREVIEW ---
  const [previewValue, setPreviewValue] = useState(78)

  // Form states
  const [carbonFuelSource, setCarbonFuelSource] = useState('Fleet Fuel')
  const [carbonAmount, setCarbonAmount] = useState('')
  const [csrChallenge, setCsrChallenge] = useState('Cycle to Work')
  const [csrFile, setCsrFile] = useState(null)
  const [csrFileName, setCsrFileName] = useState('')

  // Admin form states
  const [newDeptName, setNewDeptName] = useState('')
  const [newDeptHead, setNewDeptHead] = useState('u-003')
  const [newDeptEmpCount, setNewDeptEmpCount] = useState('')

  const [newEfSource, setNewEfSource] = useState('')
  const [newEfMultiplier, setNewEfMultiplier] = useState('')

  const [newChallengeTitle, setNewChallengeTitle] = useState('')
  const [newChallengeXP, setNewChallengeXP] = useState('')

  // Dept Head form states
  const [newComplianceDesc, setNewComplianceDesc] = useState('')
  const [newComplianceOwner, setNewComplianceOwner] = useState('u-003')
  const [newComplianceDueDate, setNewComplianceDueDate] = useState('')

  // --- AUTOMATED SYNC ENGINE PIPELINE ---
  const handleSync = async (overrideXP, overrideBadges) => {
    if (!online) {
      setSyncMessage('⚠️ Switch machine connection to ONLINE to synchronize.')
      return
    }
    setSyncing(true)
    setSyncMessage('📡 Scanning IndexedDB and connecting to server...')

    const currentXP     = overrideXP     !== undefined ? overrideXP     : userXP
    const currentBadges = overrideBadges !== undefined ? overrideBadges : userBadges

    const syncUrl = `http://${window.location.hostname}:5000/sync`

    try {
      // 1. PUSH PHASE: Get all pending transactions & master updates
      const pendingCarbon = await db.carbon_transactions.where('sync_status').equals('pending').toArray()
      const pendingCsr    = await db.csr_participations.where('sync_status').equals('pending').toArray()
      const pendingComp   = await db.compliance_issues.where('sync_status').equals('pending').toArray()
      const pendingDepts  = await db.departments.where('sync_status').equals('pending').toArray()
      const pendingEfs    = await db.emission_factors.where('sync_status').equals('pending').toArray()
      const pendingChs    = await db.challenges.where('sync_status').equals('pending').toArray()
      const pendingUsers  = await db.users.where('sync_status').equals('pending').toArray()

      const totalPending = pendingCarbon.length + pendingCsr.length + pendingComp.length + pendingDepts.length + pendingEfs.length + pendingChs.length + pendingUsers.length

      // Update current user credentials payload
      const userPayloads = [...pendingUsers]
      if (currentUser) {
        const existInPending = pendingUsers.find(u => u.id === currentUser.id)
        if (!existInPending) {
          userPayloads.push({
            ...currentUser,
            totalXP: currentXP,
            badges: currentBadges
          })
        }
      }

      setSyncMessage(`Pushing state to central cloud...`)
      const payload = {
        carbon_transactions: pendingCarbon,
        csr_participations: pendingCsr,
        compliance_issues: pendingComp,
        departments: pendingDepts,
        emission_factors: pendingEfs,
        challenges: pendingChs,
        users: userPayloads
      }

      let serverResponded = false
      try {
        const response = await fetch(syncUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (response.ok) {
          serverResponded = true
          // Mark pushed items as synced in Dexie
          await db.transaction('rw', db.carbon_transactions, db.csr_participations, db.compliance_issues, db.departments, db.emission_factors, db.challenges, db.users, async () => {
            for (let item of pendingCarbon) {
              await db.carbon_transactions.update(item.id, { sync_status: 'synced' })
            }
            for (let item of pendingCsr) {
              await db.csr_participations.update(item.id, { sync_status: 'synced' })
            }
            for (let item of pendingComp) {
              await db.compliance_issues.update(item.id, { sync_status: 'synced' })
            }
            for (let item of pendingDepts) {
              await db.departments.update(item.id, { sync_status: 'synced' })
            }
            for (let item of pendingEfs) {
              await db.emission_factors.update(item.id, { sync_status: 'synced' })
            }
            for (let item of pendingChs) {
              await db.challenges.update(item.id, { sync_status: 'synced' })
            }
            for (let item of pendingUsers) {
              await db.users.update(item.id, { sync_status: 'synced' })
            }
          })
        }
      } catch (err) {
        console.warn("Backend server connection failed during push phase:", err)
      }

      // 2. PULL PHASE: Download database changes from server
      setSyncMessage('📥 Downloading cloud database updates...')
      let fetchedData = null
      try {
        const response = await fetch(syncUrl)
        if (response.ok) {
          fetchedData = await response.json()
        }
      } catch (err) {
        console.warn("Backend server connection failed during pull phase:", err)
      }

      // 3. MERGE PHASE: Save downloaded records to IndexedDB using upserts
      if (fetchedData) {
        const { carbon_transactions, csr_participations, compliance_issues, departments: servDepts, emission_factors: servEfs, challenges: servChs, users: servUsers } = fetchedData

        await db.transaction('rw', db.carbon_transactions, db.csr_participations, db.compliance_issues, db.departments, db.emission_factors, db.challenges, db.users, async () => {
          if (carbon_transactions && carbon_transactions.length > 0) {
            const mapped = carbon_transactions.map(t => ({ ...t, sync_status: 'synced' }))
            await db.carbon_transactions.bulkPut(mapped)
          }
          if (csr_participations && csr_participations.length > 0) {
            const mapped = csr_participations.map(p => ({ ...p, sync_status: 'synced' }))
            await db.csr_participations.bulkPut(mapped)
          }
          if (compliance_issues && compliance_issues.length > 0) {
            const mapped = compliance_issues.map(i => ({ ...i, sync_status: 'synced' }))
            await db.compliance_issues.bulkPut(mapped)
          }
          if (servDepts && servDepts.length > 0) {
            const mapped = servDepts.map(d => ({ ...d, sync_status: 'synced' }))
            await db.departments.bulkPut(mapped)
          }
          if (servEfs && servEfs.length > 0) {
            const mapped = servEfs.map(e => ({ ...e, sync_status: 'synced' }))
            await db.emission_factors.bulkPut(mapped)
          }
          if (servChs && servChs.length > 0) {
            const mapped = servChs.map(c => ({ ...c, sync_status: 'synced' }))
            await db.challenges.bulkPut(mapped)
          }
          if (servUsers && servUsers.length > 0) {
            const mapped = servUsers.map(u => ({ ...u, sync_status: 'synced' }))
            await db.users.bulkPut(mapped)
          }
        })

        if (servUsers && currentUser) {
          const updatedCurrentUser = servUsers.find(u => u.id === currentUser.id)
          if (updatedCurrentUser) {
            setCurrentUser(prev => ({
              ...prev,
              totalXP: Math.max(prev.totalXP, updatedCurrentUser.totalXP),
              badges: Array.from(new Set([...prev.badges, ...updatedCurrentUser.badges]))
            }))
          }
        }
      }

      // 4. REFRESH PHASE
      await loadDBData()
      setSyncing(false)
      if (fetchedData) {
        setSyncMessage(totalPending > 0
          ? `✅ Successfully synced! Pushed ${totalPending} items & updated local database.`
          : '🟢 Local database is fully synchronized with central cloud.'
        )
      } else {
        // Fallback offline simulator behavior
        if (totalPending > 0) {
          await db.transaction('rw', db.carbon_transactions, db.csr_participations, db.compliance_issues, db.departments, db.emission_factors, db.challenges, db.users, async () => {
            for (let item of pendingCarbon) {
              await db.carbon_transactions.update(item.id, { sync_status: 'synced' })
            }
            for (let item of pendingCsr) {
              await db.csr_participations.update(item.id, { sync_status: 'synced' })
            }
            for (let item of pendingComp) {
              await db.compliance_issues.update(item.id, { sync_status: 'synced' })
            }
            for (let item of pendingDepts) {
              await db.departments.update(item.id, { sync_status: 'synced' })
            }
            for (let item of pendingEfs) {
              await db.emission_factors.update(item.id, { sync_status: 'synced' })
            }
            for (let item of pendingChs) {
              await db.challenges.update(item.id, { sync_status: 'synced' })
            }
            for (let item of pendingUsers) {
              await db.users.update(item.id, { sync_status: 'synced' })
            }
          })
          await loadDBData()
        }
        setSyncMessage(`✅ Offline simulator resolved ${totalPending || '0'} pending logs.`)
      }

    } catch (e) {
      setSyncing(false)
      setSyncMessage('❌ Sync failed: ' + e.message)
    }
  }

  // Trigger sync automatically when network shifts from offline to online
  useEffect(() => {
    if (online) {
      handleSync()
    }
  }, [online])

  // Load and sync data from server on startup
  useEffect(() => {
    const init = async () => {
      await loadDBData()
      if (online) {
        handleSync()
      }
    }
    init()
  }, [])

  // --- DYNAMIC CALCULATOR LOGIC FOR AUTOMATED EMISSION ENGINE ---
  const emissionFactors = useMemo(() => {
    const map = {}
    emissionFactorsList.forEach(ef => {
      map[ef.sourceType] = ef.multiplierValue
    })
    if (Object.keys(map).length === 0) {
      map['Fleet Fuel'] = 2.31
      map['Electricity'] = 0.85
      map['Natural Gas'] = 1.88
    }
    return map
  }, [emissionFactorsList])

  useEffect(() => {
    const keys = Object.keys(emissionFactors)
    if (keys.length > 0 && !keys.includes(carbonFuelSource)) {
      setCarbonFuelSource(keys[0])
    }
  }, [emissionFactors, carbonFuelSource])

  const calculatedEmissionsInput = useMemo(() => {
    const amt = parseFloat(carbonAmount)
    if (isNaN(amt) || amt <= 0 || !emissionFactors[carbonFuelSource]) return 0
    return parseFloat((amt * emissionFactors[carbonFuelSource]).toFixed(2))
  }, [carbonAmount, carbonFuelSource, emissionFactors])

  // --- REAL-TIME DYNAMIC ESG SCORE CALCULATIONS ---
  const scores = useMemo(() => {
    const totalEmissions = carbonLogs.reduce((acc, curr) => acc + (curr.calculatedEmissions || 0), 0)
    const envBase = Math.max(10, 95 - (totalEmissions / 15))

    const completedCsrCount = csrLogs.length
    const socBase = Math.min(98, 50 + (completedCsrCount * 15))

    const totalIssues = complianceIssues.length
    const resolvedIssues = complianceIssues.filter(i => i.status === 'Closed').length
    const govBase = totalIssues > 0 ? (resolvedIssues / totalIssues) * 100 : 80

    const overall = (envBase * 0.4) + (socBase * 0.3) + (govBase * 0.3)

    return {
      env: envBase,
      soc: socBase,
      gov: govBase,
      overall: overall
    }
  }, [carbonLogs, csrLogs, complianceIssues])

  // Department specific scores (For Department Head Console)
  const departmentScores = useMemo(() => {
    if (!currentUser) return { env: 80, soc: 80, gov: 80, overall: 80 }
    const deptId = currentUser.departmentId
    
    // Filter carbon transactions created by users of this department
    const deptCarbonLogs = carbonLogs.filter(log => {
      const logUserId = log.userId || 'u-001'
      const u = allUsers.find(user => user.id === logUserId)
      return u && u.departmentId === deptId
    })
    const deptTotalEmissions = deptCarbonLogs.reduce((acc, curr) => acc + (curr.calculatedEmissions || 0), 0)
    const envScore = Math.max(10, 95 - (deptTotalEmissions / 15))

    // Filter CSR logs for users in this department
    const deptCsrLogs = csrLogs.filter(log => {
      const u = allUsers.find(user => user.id === log.userId)
      return u && u.departmentId === deptId
    })
    const completedCsrCount = deptCsrLogs.length
    const socScore = Math.min(98, 50 + (completedCsrCount * 15))

    // Filter compliance issues for users in this department
    const deptComplianceIssues = complianceIssues.filter(issue => {
      const u = allUsers.find(user => user.id === issue.ownerId)
      return u && u.departmentId === deptId
    })
    const deptTotalIssues = deptComplianceIssues.length
    const deptResolvedIssues = deptComplianceIssues.filter(i => i.status === 'Closed').length
    const govScore = deptTotalIssues > 0 ? (deptResolvedIssues / deptTotalIssues) * 100 : 80

    const overallScore = (envScore * 0.4) + (socScore * 0.3) + (govScore * 0.3)

    return {
      env: envScore,
      soc: socScore,
      gov: govScore,
      overall: overallScore
    }
  }, [carbonLogs, csrLogs, complianceIssues, currentUser, allUsers])

  // --- AUTHENTICATION FLOW HANDLERS ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    if (!loginUsername || !loginPassword) return

    const matched = allUsers.filter(u => u.username.toLowerCase() === loginUsername.toLowerCase())
    if (matched.length === 0) {
      alert('⚠️ Username not found.')
      return
    }

    const user = matched[0]
    if (user.password !== loginPassword) {
      alert('❌ Incorrect password.')
      return
    }

    localStorage.setItem('ecosphere-user-id', user.id)
    setCurrentUser(user)
    setLoginUsername('')
    setLoginPassword('')
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    if (!registerName || !registerUsername || !registerPassword) return

    const matched = allUsers.filter(u => u.username.toLowerCase() === registerUsername.toLowerCase())
    if (matched.length > 0) {
      alert('⚠️ Username is already taken.')
      return
    }

    const newUsr = {
      id: 'u-' + Math.random().toString(36).substr(2, 4),
      name: registerName,
      username: registerUsername,
      password: registerPassword,
      role: registerRole,
      departmentId: registerDeptId,
      totalXP: 0,
      badges: [],
      sync_status: 'pending'
    }

    try {
      await db.users.add(newUsr)
      setRegisterName('')
      setRegisterUsername('')
      setRegisterPassword('')
      await loadDBData()
      alert('🎉 Registration successful! You can now sign in using your credentials.')
      setAuthView('login')
      handleSync()
    } catch (err) {
      console.error(err)
    }
  }

  // --- USER TRIGGERS / FORM SUBMISSIONS ---
  const handleAddCarbonLog = async (e) => {
    e.preventDefault()
    const amt = parseFloat(carbonAmount)
    if (isNaN(amt) || amt <= 0 || !currentUser) return

    const newLog = {
      id: generateUUID(),
      userId: currentUser.id,
      sourceType: carbonFuelSource,
      rawAmount: amt,
      calculatedEmissions: calculatedEmissionsInput,
      date: new Date().toISOString().split('T')[0],
      sync_status: 'pending',
      createdAt: new Date().toISOString()
    }

    try {
      await db.carbon_transactions.add(newLog)
      setCarbonAmount('')
      await loadDBData()
      
      const newXP = userXP + 25
      
      // Update XP in local IndexedDB for this user
      await db.users.update(currentUser.id, { totalXP: newXP })
      setCurrentUser(prev => ({ ...prev, totalXP: newXP }))

      handleSync(newXP)
    } catch (err) {
      console.error(err)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCsrFile(file)
      setCsrFileName(file.name)
    }
  }

  const handleAddCsrLog = async (e) => {
    e.preventDefault()
    if (!csrFile || !currentUser) return

    const selectedCh = challenges.find(ch => ch.title === csrChallenge)
    const activityId = selectedCh ? selectedCh.id : 'ch-001'
    const xpReward = selectedCh ? selectedCh.xpValue : 100

    const newCsr = {
      id: generateUUID(),
      userId: currentUser.id,
      activityId: activityId,
      proofFile: 'uploaded-base64-file-string',
      status: 'Submitted',
      sync_status: 'pending',
      createdAt: new Date().toISOString()
    }

    try {
      await db.csr_participations.add(newCsr)
      setCsrFile(null)
      setCsrFileName('')
      await loadDBData()

      const newXP = userXP + xpReward
      
      let updatedBadges = [...userBadges]
      if (newXP >= 1400 && !userBadges.includes('Eco Titan')) {
        updatedBadges = [...userBadges, 'Eco Titan']
      }

      await db.users.update(currentUser.id, { totalXP: newXP, badges: updatedBadges })
      setCurrentUser(prev => ({ ...prev, totalXP: newXP, badges: updatedBadges }))

      handleSync(newXP, updatedBadges)
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleCompliance = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Open' ? 'Closed' : 'Open'
    try {
      await db.compliance_issues.update(id, { 
        status: nextStatus,
        sync_status: 'pending'
      })
      await loadDBData()
      
      if (currentUser) {
        let newXP = userXP
        if (nextStatus === 'Closed') {
          newXP = userXP + 50
        } else {
          newXP = Math.max(0, userXP - 50)
        }
        await db.users.update(currentUser.id, { totalXP: newXP })
        setCurrentUser(prev => ({ ...prev, totalXP: newXP }))
        handleSync(newXP)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleRedeem = async (cost, itemName) => {
    if (userXP < cost || !currentUser) {
      alert(`⚠️ Insufficient XP. You need ${cost} XP to redeem this reward.`)
      return
    }
    const newXP = userXP - cost
    await db.users.update(currentUser.id, { totalXP: newXP })
    setCurrentUser(prev => ({ ...prev, totalXP: newXP }))
    alert(`🎉 Successfully redeemed: ${itemName}! Deducted ${cost} XP from your balance.`)
    handleSync(newXP)
  }

  // --- SYSTEM ADMIN HANDLERS ---
  const handleAddDept = async (e) => {
    e.preventDefault()
    if (!newDeptName) return
    const newDept = {
      id: 'dept-' + Math.random().toString(36).substr(2, 4),
      name: newDeptName,
      headId: newDeptHead,
      employeeCount: parseInt(newDeptEmpCount, 10) || 5,
      esgScores: { env: 80, soc: 80, gov: 80 },
      sync_status: 'pending'
    }
    try {
      await db.departments.add(newDept)
      setNewDeptName('')
      setNewDeptEmpCount('')
      await loadDBData()
      handleSync()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteDept = async (id) => {
    try {
      await db.departments.delete(id)
      await loadDBData()
      handleSync()
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddEf = async (e) => {
    e.preventDefault()
    if (!newEfSource || !newEfMultiplier) return
    const newEf = {
      id: 'ef-' + Math.random().toString(36).substr(2, 4),
      sourceType: newEfSource,
      multiplierValue: parseFloat(newEfMultiplier),
      sync_status: 'pending'
    }
    try {
      await db.emission_factors.add(newEf)
      setNewEfSource('')
      setNewEfMultiplier('')
      await loadDBData()
      handleSync()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteEf = async (id) => {
    try {
      await db.emission_factors.delete(id)
      await loadDBData()
      handleSync()
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddChallenge = async (e) => {
    e.preventDefault()
    if (!newChallengeTitle || !newChallengeXP) return
    const newCh = {
      id: 'ch-' + Math.random().toString(36).substr(2, 4),
      title: newChallengeTitle,
      xpValue: parseInt(newChallengeXP, 10),
      status: 'Active',
      sync_status: 'pending'
    }
    try {
      await db.challenges.add(newCh)
      setNewChallengeTitle('')
      setNewChallengeXP('')
      await loadDBData()
      handleSync()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteChallenge = async (id) => {
    try {
      await db.challenges.delete(id)
      await loadDBData()
      handleSync()
    } catch (err) {
      console.error(err)
    }
  }

  // --- DEPARTMENT HEAD HANDLERS ---
  const handleAddCompliance = async (e) => {
    e.preventDefault()
    if (!newComplianceDesc || !newComplianceOwner || !newComplianceDueDate) return
    const newIssue = {
      id: generateUUID(),
      description: newComplianceDesc,
      ownerId: newComplianceOwner,
      dueDate: newComplianceDueDate,
      status: 'Open',
      sync_status: 'pending'
    }
    try {
      await db.compliance_issues.add(newIssue)
      setNewComplianceDesc('')
      setNewComplianceDueDate('')
      await loadDBData()
      handleSync()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <main className="app-shell" data-theme={theme}>
      {/* GLOBAL TACTILE HEADER BAR */}
      <div className="container" style={{ paddingBottom: '0px' }}>
        <header className="navbar">
          <div className="nav-brand">
            <IconLeaf size={26} color="var(--accent-green)" />
            Eco<span>Sphere</span>
          </div>

          <div className="nav-controls">
            {/* NETWORK CONNECTIVITY HARDWARE SWITCH */}
            <div className="hardware-toggle-container">
              <span className="hardware-label">
                {online ? 'Online' : 'Offline'}
              </span>
              <button 
                onClick={() => setOnline(!online)} 
                className={`hardware-switch ${online ? 'active' : ''}`}
                aria-label="Toggle network connectivity"
                title="Toggle network online/offline to test Dexie offline queue sync pipeline"
              >
                <span className="hardware-switch-handle"></span>
              </button>
            </div>

            {/* LIGHT/DARK THEME KEY BUTTON */}
            <button 
              onClick={toggleTheme} 
              className="tactile-btn icon-only" 
              aria-label="Toggle Theme"
              title="Toggle Light / Dark Modern Skeuomorphism"
            >
              {theme === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
            </button>

            {/* PAGE CONTROL KEY BUTTON */}
            {page === 'dashboard' ? (
              <button onClick={() => setPage('landing')} className="tactile-btn secondary">
                Back to Site
              </button>
            ) : (
              <button onClick={() => setPage('dashboard')} className="tactile-btn primary">
                Launch Console
              </button>
            )}

            {/* LOGGED IN USER LOGOUT SWITCH */}
            {currentUser && (
              <button 
                onClick={handleLogout} 
                className="tactile-btn danger" 
                title="Sign Out of Sustainability Console"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Log Out
              </button>
            )}
          </div>
        </header>
      </div>

      {/* LANDING PAGE ROUTE */}
      {page === 'landing' ? (
        <div className="container">
          <section className="landing-hero">
            <div className="landing-hero-content">
              <span className="landing-tagline">Local-First ESG Architecture</span>
              <h1 className="landing-title">
                Zero-Trust Sustainability <span>Management.</span>
              </h1>
              <p className="landing-desc">
                An intelligent corporate ESG environment designed to run anywhere—even in remote locations or connection dead zones. Auto-compute carbon transactions, log verified CSR activities offline, and keep teams aligned via hardware-grade skeuomorphic interfaces.
              </p>
              
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <button onClick={() => setPage('dashboard')} className="tactile-btn primary machine-footer-btn" style={{ maxWidth: '280px' }}>
                  Open EcoSphere Dashboard <IconArrowRight size={18} />
                </button>
                <a href="#features" className="tactile-btn" style={{ padding: '16px 24px' }}>
                  Explore Features
                </a>
              </div>
            </div>

            {/* INTERACTIVE PREVIEW MACHINE (Landing Wow-Factor) */}
            <div className="landing-hero-preview">
              <div className="tactile-machine">
                <div className="machine-header">
                  <span className="machine-title">Eco-Calibration Console</span>
                  <div className="machine-status-light">
                    <span className="machine-light"></span>
                    ACTIVE
                  </div>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
                  Interact with the calibration dials below to preview the skeuomorphic depth, shadow lines, and responsive indicator tracks.
                </p>

                <div className="machine-dial-grid">
                  <div className="embossed-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px' }}>
                    <CircularGauge value={previewValue} label="Tuning" color="var(--accent-blue)" size={110} />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                      <button 
                        onClick={() => setPreviewValue(prev => Math.max(10, prev - 5))} 
                        className="tactile-btn icon-only" 
                        style={{ width: '32px', height: '32px', fontSize: '1rem' }}
                      >-</button>
                      <button 
                        onClick={() => setPreviewValue(prev => Math.min(100, prev + 5))} 
                        className="tactile-btn icon-only" 
                        style={{ width: '32px', height: '32px', fontSize: '1rem' }}
                      >+</button>
                    </div>
                  </div>

                  <div className="debossed-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <span className="hardware-label" style={{ fontSize: '0.65rem' }}>Engine Mode</span>
                      <p style={{ fontSize: '0.85rem', fontWeight: 800, marginTop: '4px' }}>Skeuomorphic V1</p>
                    </div>
                    <div>
                      <span className="hardware-label" style={{ fontSize: '0.65rem' }}>Shadow Depth</span>
                      <p style={{ fontSize: '0.85rem', fontWeight: 800, marginTop: '4px' }}>Tactile Slate</p>
                    </div>
                  </div>
                </div>

                <button onClick={() => setPage('dashboard')} className="tactile-btn primary machine-footer-btn">
                  Launch Interactive Simulator
                </button>
              </div>
            </div>
          </section>

          {/* DETAIL FEATURES SECTION */}
          <section id="features" className="landing-features">
            <div className="section-header">
              <span className="section-subtitle">Tactile Hardware Performance</span>
              <h2 className="section-title">Fully Integrated ESG Auditing</h2>
            </div>

            <div className="features-grid">
              {/* Pillar 1 */}
              <div className="embossed-panel feature-card">
                <div className="feature-icon-wrapper">
                  <IconFlame size={24} />
                </div>
                <h3 className="feature-title">Automated Carbon Engine</h3>
                <p className="feature-desc">
                  Input operations like vehicle fuel fills or local utility consumption, and let the integrated database compute carbon equivalents instantly using dynamic emission multipliers.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="embossed-panel feature-card">
                <div className="feature-icon-wrapper blue">
                  <IconAward size={24} />
                </div>
                <h3 className="feature-title">Gamified Social Evidence</h3>
                <p className="feature-desc">
                  Encourage team corporate responsibility with verifiable proof uploads. Earn custom XP, climb local leaderboard milestones, and claim real carbon offsets.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="embossed-panel feature-card">
                <div className="feature-icon-wrapper">
                  <IconShield size={24} />
                </div>
                <h3 className="feature-title">Active Governance Flags</h3>
                <p className="feature-desc">
                  Never lose track of hazardous materials handling or waste compliance tasks. Overdue audits automatically throw flashing visual warning panels until closed.
                </p>
              </div>
            </div>
          </section>
        </div>
      ) : (
        /* DASHBOARD CONSOLE ROUTE */
        <div className="container">
          
          {/* OFFLINE DATABASE SYNC ALERTS */}
          <div className="embossed-panel" style={{ marginBottom: '30px', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {online ? (
                <IconWifi size={22} color="var(--accent-green)" />
              ) : (
                <IconWifiOff size={22} color="var(--red)" />
              )}
              <div>
                <span className="hardware-label" style={{ fontSize: '0.7rem' }}>Sync Status Monitor</span>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '2px', color: syncing ? 'var(--accent-blue)' : 'var(--text)' }}>
                  {syncMessage || (online ? '🟢 Connected to cloud database' : '⚠️ Offline state active. Pending items cached in IndexedDB.')}
                </p>
              </div>
            </div>

            <button 
              onClick={() => handleSync()} 
              disabled={syncing}
              className={`tactile-btn ${syncing ? 'active' : ''}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              {syncing ? 'Synchronizing...' : 'Sync Dexie Queue'}
            </button>
          </div>

          {/* GATEWAY AUTHENTICATION VIEW IF NOT SIGNED IN */}
          {!currentUser ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0' }}>
              <div className="tactile-machine" style={{ maxWidth: '480px', width: '100%' }}>
                <div className="machine-header">
                  <span className="machine-title">Security Gateway</span>
                  <div className="machine-status-light">
                    <span className="machine-light" style={{ backgroundColor: 'var(--red)', boxShadow: '0 0 8px var(--red)' }}></span>
                    LOCKED
                  </div>
                </div>

                {/* AUTH TAB CONTROL */}
                <div className="debossed-panel" style={{ padding: '6px', borderRadius: '10px', display: 'flex', gap: '6px', marginBottom: '20px' }}>
                  <button 
                    onClick={() => setAuthView('login')} 
                    className={`tactile-btn ${authView === 'login' ? 'active' : ''}`}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem' }}
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => setAuthView('register')} 
                    className={`tactile-btn ${authView === 'register' ? 'active' : ''}`}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem' }}
                  >
                    Register Account
                  </button>
                </div>

                {authView === 'login' ? (
                  <form onSubmit={handleLoginSubmit}>
                    <div className="tactile-input-container">
                      <label className="tactile-label" htmlFor="login-user">Username</label>
                      <input 
                        id="login-user"
                        type="text" 
                        className="tactile-input" 
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder="Enter username"
                        required
                      />
                    </div>
                    <div className="tactile-input-container">
                      <label className="tactile-label" htmlFor="login-pass">Password</label>
                      <input 
                        id="login-pass"
                        type="password" 
                        className="tactile-input" 
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter password"
                        required
                      />
                    </div>
                    <button type="submit" className="tactile-btn primary machine-footer-btn" style={{ marginTop: '10px' }}>
                      Authenticate Console
                    </button>

                    <div className="debossed-panel" style={{ marginTop: '20px', padding: '12px', borderRadius: '10px', fontSize: '0.75rem', lineHeight: '1.4', color: 'var(--text-muted)' }}>
                      💡 <strong>Hint:</strong> Use seeded credentials to log in:
                      <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                        <li>Admin: <code>jatin</code> / <code>password123</code></li>
                        <li>Head: <code>sarah</code> / <code>password123</code></li>
                        <li>Employee: <code>michael</code> / <code>password123</code></li>
                      </ul>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleRegisterSubmit}>
                    <div className="tactile-input-container">
                      <label className="tactile-label" htmlFor="reg-name">Full Name</label>
                      <input 
                        id="reg-name"
                        type="text" 
                        className="tactile-input" 
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        placeholder="e.g. Jack Smith"
                        required
                      />
                    </div>
                    <div className="tactile-input-container">
                      <label className="tactile-label" htmlFor="reg-user">Username</label>
                      <input 
                        id="reg-user"
                        type="text" 
                        className="tactile-input" 
                        value={registerUsername}
                        onChange={(e) => setRegisterUsername(e.target.value)}
                        placeholder="Create username"
                        required
                      />
                    </div>
                    <div className="tactile-input-container">
                      <label className="tactile-label" htmlFor="reg-pass">Password</label>
                      <input 
                        id="reg-pass"
                        type="password" 
                        className="tactile-input" 
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="Create password"
                        required
                      />
                    </div>
                    <div className="tactile-input-container">
                      <label className="tactile-label" htmlFor="reg-role">Role Assign</label>
                      <select 
                        id="reg-role"
                        className="tactile-input tactile-select"
                        value={registerRole}
                        onChange={(e) => setRegisterRole(e.target.value)}
                      >
                        <option value="Employee">Employee (Workspace log)</option>
                        <option value="Department Head">Department Head (Auditor)</option>
                        <option value="System Admin">System Admin (Full Config)</option>
                      </select>
                    </div>
                    <div className="tactile-input-container">
                      <label className="tactile-label" htmlFor="reg-dept">Department Assign</label>
                      <select 
                        id="reg-dept"
                        className="tactile-input tactile-select"
                        value={registerDeptId}
                        onChange={(e) => setRegisterDeptId(e.target.value)}
                      >
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="tactile-btn secondary machine-footer-btn" style={{ marginTop: '10px' }}>
                      Register New Operator
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* SKEUOMORPHIC ROLE TABS */}
              {currentUser.role !== 'Employee' && (
                <div className="debossed-panel" style={{ padding: '8px', borderRadius: '14px', marginBottom: '30px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => setActiveTab('employee')} 
                    className={`tactile-btn ${activeTab === 'employee' ? 'active' : ''}`}
                    style={{ flex: 1, padding: '10px 16px', borderRadius: '10px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                  >
                    👷 Employee Console
                  </button>

                  {(currentUser.role === 'Department Head' || currentUser.role === 'System Admin') && (
                    <button 
                      onClick={() => setActiveTab('deptHead')} 
                      className={`tactile-btn ${activeTab === 'deptHead' ? 'active' : ''}`}
                      style={{ flex: 1, padding: '10px 16px', borderRadius: '10px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                    >
                      👔 Dept Head Console ({currentUser.departmentId === 'dept-log' ? 'Logistics' : currentUser.departmentId === 'dept-eng' ? 'Engineering' : 'Administration'})
                    </button>
                  )}

                  {currentUser.role === 'System Admin' && (
                    <button 
                      onClick={() => setActiveTab('admin')} 
                      className={`tactile-btn ${activeTab === 'admin' ? 'active' : ''}`}
                      style={{ flex: 1, padding: '10px 16px', borderRadius: '10px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                    >
                      🔧 Admin Master Console
                    </button>
                  )}
                </div>
              )}

              {/* TAB 1: EMPLOYEE CONSOLE */}
              {activeTab === 'employee' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  
                  {/* PROFILE & STATS SUMMARY */}
                  <div className="embossed-panel" style={{ padding: '24px 30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                      <div className="user-hub">
                        <div className="user-avatar">
                          {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-meta">
                          <h4>{currentUser.name}</h4>
                          <p>Role: <strong>{currentUser.role}</strong> • Department: <strong>{departments.find(d => d.id === currentUser.departmentId)?.name || currentUser.departmentId}</strong></p>
                        </div>
                      </div>
                      
                      <div className="embossed-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span className="hardware-label" style={{ fontSize: '0.65rem' }}>Earning Progress</span>
                          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-green)' }}>{userXP} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>XP</span></p>
                        </div>
                        <IconAward size={36} color="var(--accent-green)" />
                      </div>
                    </div>

                    <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                      <span className="hardware-label">Unlocked Badge Pins</span>
                      <div className="badge-list">
                        {userBadges.length > 0 ? (
                          userBadges.map((badge, idx) => (
                            <span key={idx} className="badge-item">
                              🏅 {badge}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No badges unlocked yet. Start completing challenges to earn badges!</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* DOUBLE COLUMN OPERATION PANEL */}
                  <div className="dashboard-grid">
                    
                    {/* PANEL A: OPERATIONAL CARBON LOGGING */}
                    <div className="embossed-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h3 className="desk-section-title">
                          <IconFlame size={18} color="var(--accent-green)" />
                          Log Environmental Fuel Log
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.4' }}>
                          Record fleet refueling or utility fuel bills. The engine will instantly calculate the corresponding carbon emissions using standard multipliers.
                        </p>

                        <form onSubmit={handleAddCarbonLog}>
                          <div className="tactile-input-container">
                            <label className="tactile-label" htmlFor="emp-carbon-source">Fuel / Emission Source</label>
                            <select 
                              id="emp-carbon-source"
                              className="tactile-input tactile-select"
                              value={carbonFuelSource}
                              onChange={(e) => setCarbonFuelSource(e.target.value)}
                            >
                              {Object.keys(emissionFactors).map(src => (
                                <option key={src} value={src}>{src} (x{emissionFactors[src]} CO₂)</option>
                              ))}
                            </select>
                          </div>

                          <div className="tactile-input-container">
                            <label className="tactile-label" htmlFor="emp-carbon-amount">Raw Amount / Quantity</label>
                            <input 
                              id="emp-carbon-amount"
                              type="number" 
                              className="tactile-input" 
                              placeholder="e.g. 150"
                              value={carbonAmount}
                              onChange={(e) => setCarbonAmount(e.target.value)}
                              min="1"
                              step="any"
                              required
                            />
                          </div>

                          {/* DYNAMIC CARBON CALCULATION REAL-TIME READOUT */}
                          <div className="debossed-panel" style={{ padding: '16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span className="hardware-label" style={{ fontSize: '0.65rem' }}>Calculated CO₂ Output</span>
                              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--red)', marginTop: '4px' }}>
                                {calculatedEmissionsInput} <span style={{ fontSize: '0.85rem', fontWeight: 'normal' }}>kg CO₂e</span>
                              </p>
                            </div>
                            <IconLeaf size={28} color="var(--red)" />
                          </div>

                          <button type="submit" className="tactile-btn primary" style={{ width: '100%' }}>
                            Confirm & Log Fleet Transaction (+25 XP)
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* PANEL B: SOCIAL WORK EVIDENCE PORTAL */}
                    <div className="embossed-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h3 className="desk-section-title">
                          <IconAward size={18} color="var(--accent-blue)" />
                          CSR Gamification Portal
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.4' }}>
                          Participated in a corporate social responsibility event? Select the challenge, upload your evidence file, and claim your XP rewards.
                        </p>

                        <form onSubmit={handleAddCsrLog}>
                          <div className="tactile-input-container">
                            <label className="tactile-label" htmlFor="emp-csr-challenge">Sustainably Challenge</label>
                            <select 
                              id="emp-csr-challenge"
                              className="tactile-input tactile-select"
                              value={csrChallenge}
                              onChange={(e) => setCsrChallenge(e.target.value)}
                            >
                              {challenges.filter(ch => ch.status === 'Active').map(ch => (
                                <option key={ch.id} value={ch.title}>{ch.title} (+{ch.xpValue} XP)</option>
                              ))}
                            </select>
                          </div>

                          <div className="tactile-input-container">
                            <label className="tactile-label">Upload Proof of Participation</label>
                            <div className={`tactile-file-drop ${csrFile ? 'has-file' : ''}`}>
                              <IconCloud size={24} color={csrFile ? 'var(--accent-green)' : 'var(--text-muted)'} />
                              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                                {csrFile ? `Selected: ${csrFileName}` : 'Drag & drop or browse proof file'}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Enforced file upload required for verification</span>
                              <input 
                                type="file" 
                                className="file-input-hidden" 
                                onChange={handleFileChange}
                                accept="image/*,.pdf,.doc,.docx"
                              />
                            </div>
                          </div>

                          <button 
                            type="submit" 
                            className="tactile-btn secondary" 
                            style={{ width: '100%', marginTop: '10px' }}
                            disabled={!csrFile}
                          >
                            {!csrFile ? '🔒 Evidence Required to Submit' : 'Submit Verified CSR Participation'}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>

                  {/* GOVERNANCE & REDEMPTION DOUBLE PANEL */}
                  <div className="dashboard-grid">
                    
                    {/* PANEL C: ACTIVE GOVERNANCE POLICIES & COMPLIANCE */}
                    <div className="embossed-panel">
                      <h3 className="desk-section-title">
                        <IconShield size={18} color="var(--red)" />
                        Assigned Policy & Audit Acknowledgment
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.4' }}>
                        Governance violations, safety logs, or compliance documents that require your explicit acknowledgment or closure.
                      </p>

                      <div className="compliance-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {complianceIssues.filter(issue => issue.ownerId === currentUser.id).length > 0 ? (
                          complianceIssues.filter(issue => issue.ownerId === currentUser.id).map(issue => {
                            const isOverdue = new Date('2026-07-12') > new Date(issue.dueDate) && issue.status === 'Open'
                            return (
                              <div key={issue.id} className="compliance-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span className={`compliance-badge ${issue.status === 'Open' ? (isOverdue ? 'overdue' : 'open') : 'closed'}`}>
                                    {issue.status === 'Open' ? (isOverdue ? '⚠️ Overdue Audit' : 'Pending Action') : '✓ Acknowledged'}
                                  </span>
                                  <button 
                                    onClick={() => handleToggleCompliance(issue.id, issue.status)}
                                    className={`tactile-btn ${issue.status === 'Closed' ? 'active' : ''}`}
                                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                  >
                                    {issue.status === 'Open' ? 'Acknowledge Policy (+50 XP)' : 'Reopen Audit'}
                                  </button>
                                </div>
                                <div>
                                  <span className="compliance-desc" style={{ display: 'block', fontWeight: 800 }}>{issue.description}</span>
                                  <div className="compliance-meta" style={{ marginTop: '6px', justifyContent: 'space-between' }}>
                                    <span>Due Date: {issue.dueDate}</span>
                                    <span>Sync Status: {issue.sync_status}</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <div className="debossed-panel" style={{ padding: '20px', borderRadius: '12px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            🎉 Outstanding! No assigned compliance issues or policies require action.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* PANEL D: GAMIFICATION REWARD REDEMPTION STORE */}
                    <div className="embossed-panel">
                      <h3 className="desk-section-title">
                        <IconAward size={18} color="var(--accent-blue)" />
                        Redeem Rewards Store
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.4' }}>
                        Trade your earned sustainability XP points to claim tangible rewards, certificates, or carbon offset options.
                      </p>

                      <div className="desk-surface" style={{ gridTemplateColumns: '1fr', padding: '16px', gap: '16px', borderRadius: '16px', maxHeight: '420px', overflowY: 'auto' }}>
                        
                        {/* Reward Item 1 */}
                        <div className="embossed-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                          <div>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', display: 'block' }}>🌳 Plant a Native Tree</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>We will plant a certified native sapling on your behalf.</span>
                          </div>
                          <button 
                            onClick={() => handleRedeem(300, 'Plant a Native Tree')}
                            disabled={userXP < 300}
                            className="tactile-btn primary"
                            style={{ padding: '8px 14px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                          >
                            {userXP >= 300 ? 'Redeem (300 XP)' : '300 XP Required'}
                          </button>
                        </div>

                        {/* Reward Item 2 */}
                        <div className="embossed-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                          <div>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', display: 'block' }}>⚡ Clean Energy Certificate</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Offset 100 kWh of your home power grid footprint.</span>
                          </div>
                          <button 
                            onClick={() => handleRedeem(500, 'Clean Energy Certificate')}
                            disabled={userXP < 500}
                            className="tactile-btn primary"
                            style={{ padding: '8px 14px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                          >
                            {userXP >= 500 ? 'Redeem (500 XP)' : '500 XP Required'}
                          </button>
                        </div>

                        {/* Reward Item 3 */}
                        <div className="embossed-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                          <div>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', display: 'block' }}>🍱 Organic Cafeteria Voucher</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Free plant-based organic meal voucher at the cafeteria.</span>
                          </div>
                          <button 
                            onClick={() => handleRedeem(200, 'Organic Cafeteria Voucher')}
                            disabled={userXP < 200}
                            className="tactile-btn primary"
                            style={{ padding: '8px 14px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                          >
                            {userXP >= 200 ? 'Redeem (200 XP)' : '200 XP Required'}
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* SECTION E: INDIVIDUAL RECENT LOGS SUMMARY */}
                  <div className="embossed-panel">
                    <h3 className="desk-section-title">
                      <IconGlobe size={18} color="var(--accent-blue)" />
                      Your Local Sustainability Activity Logs
                    </h3>

                    <div className="dashboard-grid">
                      
                      {/* Left: Carbon Logs */}
                      <div>
                        <span className="hardware-label">Your Environmental Logs ({carbonLogs.filter(log => log.userId === currentUser.id).length})</span>
                        <div className="log-list" style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '10px' }}>
                          {carbonLogs.filter(log => log.userId === currentUser.id).length > 0 ? (
                            carbonLogs.filter(log => log.userId === currentUser.id).map(log => (
                              <div key={log.id} className="log-item" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="log-item-details">
                                  <span className="log-item-type">⚡ {log.sourceType} ({log.rawAmount} units)</span>
                                  <span className="log-item-date">Recorded: {log.date}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                  <span style={{ fontWeight: 800, color: 'var(--red)' }}>+{log.calculatedEmissions} kg CO₂</span>
                                  <div className="log-item-sync">
                                    <span className={`sync-dot ${log.sync_status}`}></span>
                                    <span style={{ fontSize: '0.7rem', textTransform: 'capitalize', color: 'var(--text-muted)' }}>{log.sync_status}</span>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '10px' }}>No logged fuel items yet.</div>
                          )}
                        </div>
                      </div>

                      {/* Right: CSR Logs */}
                      <div>
                        <span className="hardware-label">Your Social Participation Logs ({csrLogs.filter(log => log.userId === currentUser.id).length})</span>
                        <div className="log-list" style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '10px' }}>
                          {csrLogs.filter(log => log.userId === currentUser.id).length > 0 ? (
                            csrLogs.filter(log => log.userId === currentUser.id).map(log => {
                              const ch = challenges.find(c => c.id === log.activityId)
                              return (
                                <div key={log.id} className="log-item" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div className="log-item-details">
                                    <span className="log-item-type">🏆 {ch ? ch.title : 'Sustainability Activity'}</span>
                                    <span className="log-item-date">Status: <strong>{log.status}</strong></span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <span style={{ fontWeight: 800, color: 'var(--accent-blue)' }}>+{ch ? ch.xpValue : 100} XP</span>
                                    <div className="log-item-sync">
                                      <span className={`sync-dot ${log.sync_status}`}></span>
                                      <span style={{ fontSize: '0.7rem', textTransform: 'capitalize', color: 'var(--text-muted)' }}>{log.sync_status}</span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                          ) : (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '10px' }}>No logged CSR participations yet.</div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: DEPARTMENT HEAD CONSOLE */}
              {activeTab === 'deptHead' && (currentUser.role === 'Department Head' || currentUser.role === 'System Admin') && (
                <>
                  {/* DEPT PERFORMANCE MONITOR GAUGES */}
                  <div className="gauges-row">
                    <div className="embossed-panel master-gauge-card">
                      <CircularGauge value={departmentScores.overall} label="Dept Overall" color="var(--accent-blue)" size={160} />
                      <div className="master-gauge-info">
                        <h3>{currentUser.departmentId === 'dept-log' ? 'Logistics' : currentUser.departmentId === 'dept-eng' ? 'Engineering' : 'Administration'} Rating</h3>
                        <p>
                          Metrics aggregated for this division. System admin reviews overall corporate weighted performance.
                        </p>
                        <div style={{ marginTop: '12px' }}>
                          <span className="badge-item" style={{ fontSize: '0.7rem', padding: '4px 8px', color: 'var(--accent-blue)' }}>
                            Department Head: {currentUser.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="embossed-panel gauge-card">
                      <CircularGauge value={departmentScores.env} label="Department Env" color="var(--accent-green)" />
                    </div>

                    <div className="embossed-panel gauge-card">
                      <CircularGauge value={departmentScores.soc} label="Department Soc" color="var(--accent-blue)" />
                    </div>

                    <div className="embossed-panel gauge-card">
                      <CircularGauge value={departmentScores.gov} label="Department Gov" color="var(--red)" />
                    </div>
                  </div>

                  {/* LOCAL COMPLIANCE ISSUES MANAGEMENT */}
                  <div className="dashboard-grid" style={{ marginBottom: '40px' }}>
                    <div className="embossed-panel">
                      <h3 className="desk-section-title">
                        <IconShield size={18} color="var(--red)" />
                        Log Department Audit Flag
                      </h3>

                      <form onSubmit={handleAddCompliance}>
                        <div className="tactile-input-container">
                          <label className="tactile-label" htmlFor="comp-desc">Description</label>
                          <input 
                            id="comp-desc"
                            type="text" 
                            className="tactile-input" 
                            placeholder="e.g. Hazardous waste storage inspection overdue"
                            value={newComplianceDesc}
                            onChange={(e) => setNewComplianceDesc(e.target.value)}
                            required
                          />
                        </div>

                        <div className="tactile-input-container">
                          <label className="tactile-label" htmlFor="comp-owner">Target Owner</label>
                          <select 
                            id="comp-owner"
                            className="tactile-input tactile-select"
                            value={newComplianceOwner}
                            onChange={(e) => setNewComplianceOwner(e.target.value)}
                          >
                            {allUsers.filter(u => u.departmentId === currentUser.departmentId).map(u => (
                              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                            ))}
                          </select>
                        </div>

                        <div className="tactile-input-container">
                          <label className="tactile-label" htmlFor="comp-due">Due Date</label>
                          <input 
                            id="comp-due"
                            type="date" 
                            className="tactile-input"
                            value={newComplianceDueDate}
                            onChange={(e) => setNewComplianceDueDate(e.target.value)}
                            required
                          />
                        </div>

                        <button type="submit" className="tactile-btn danger" style={{ width: '100%' }}>
                          Create Compliance Violation Flag
                        </button>
                      </form>
                    </div>

                    <div className="embossed-panel">
                      <h3 className="desk-section-title">
                        <IconShield size={18} color="var(--red)" />
                        Localized Compliance List
                      </h3>
                      
                      <div className="compliance-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {complianceIssues.filter(issue => {
                          const u = allUsers.find(user => user.id === issue.ownerId)
                          return u && u.departmentId === currentUser.departmentId
                        }).map(issue => {
                          const isOverdue = new Date('2026-07-12') > new Date(issue.dueDate) && issue.status === 'Open'
                          const ownerUser = allUsers.find(u => u.id === issue.ownerId)
                          return (
                            <div key={issue.id} className="compliance-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className={`compliance-badge ${issue.status === 'Open' ? (isOverdue ? 'overdue' : 'open') : 'closed'}`}>
                                  {issue.status === 'Open' ? (isOverdue ? '⚠️ Overdue' : 'Open') : 'Closed'}
                                </span>
                                <button 
                                  onClick={() => handleToggleCompliance(issue.id, issue.status)}
                                  className={`tactile-btn ${issue.status === 'Closed' ? 'active' : ''}`}
                                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                >
                                  {issue.status === 'Open' ? 'Toggle Close' : 'Reopen Audit'}
                                </button>
                              </div>
                              <div>
                                <span className="compliance-desc" style={{ display: 'block', fontWeight: 800 }}>{issue.description}</span>
                                <div className="compliance-meta" style={{ marginTop: '6px', justifyContent: 'space-between' }}>
                                  <span>Owner: {ownerUser ? ownerUser.name : issue.ownerId}</span>
                                  <span>Due Date: {issue.dueDate}</span>
                                  <span>Sync: {issue.sync_status}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 3: SYSTEM ADMIN CONSOLE */}
              {activeTab === 'admin' && currentUser.role === 'System Admin' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', marginBottom: '40px' }}>
                  
                  {/* SECTION 1: DEPARTMENT HIERARCHIES */}
                  <div className="embossed-panel">
                    <h3 className="desk-section-title">
                      <IconGlobe size={18} color="var(--accent-blue)" />
                      Department Hierarchies Configuration
                    </h3>

                    <div className="dashboard-grid">
                      <div>
                        <form onSubmit={handleAddDept}>
                          <div className="tactile-input-container">
                            <label className="tactile-label" htmlFor="dept-name">Department Name</label>
                            <input 
                              id="dept-name"
                              type="text" 
                              className="tactile-input" 
                              placeholder="e.g. Quality Assurance"
                              value={newDeptName}
                              onChange={(e) => setNewDeptName(e.target.value)}
                              required
                            />
                          </div>

                          <div className="tactile-input-container">
                            <label className="tactile-label" htmlFor="dept-head">Department Head</label>
                            <select 
                              id="dept-head"
                              className="tactile-input tactile-select"
                              value={newDeptHead}
                              onChange={(e) => setNewDeptHead(e.target.value)}
                            >
                              {allUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                              ))}
                            </select>
                          </div>

                          <div className="tactile-input-container">
                            <label className="tactile-label" htmlFor="dept-emp">Employee Count</label>
                            <input 
                              id="dept-emp"
                              type="number" 
                              className="tactile-input" 
                              placeholder="e.g. 12"
                              value={newDeptEmpCount}
                              onChange={(e) => setNewDeptEmpCount(e.target.value)}
                              min="1"
                              required
                            />
                          </div>

                          <button type="submit" className="tactile-btn primary" style={{ width: '100%' }}>
                            Add Master Department
                          </button>
                        </form>
                      </div>

                      <div>
                        <span className="hardware-label">Configured Hierarchy Nodes ({departments.length})</span>
                        <div className="log-list" style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '10px' }}>
                          {departments.map(d => {
                            const mgr = allUsers.find(u => u.id === d.headId)
                            return (
                              <div key={d.id} className="log-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>🏢 {d.name}</span>
                                  <button 
                                    onClick={() => handleDeleteDept(d.id)}
                                    className="tactile-btn danger" 
                                    style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                  >
                                    Delete
                                  </button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  <span>Manager: {mgr ? mgr.name : d.headId}</span>
                                  <span>Staff: {d.employeeCount}</span>
                                  <span>Sync: {d.sync_status}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: EMISSION FACTORS */}
                  <div className="embossed-panel">
                    <h3 className="desk-section-title">
                      <IconFlame size={18} color="var(--accent-green)" />
                      Emission Multipliers Configuration
                    </h3>

                    <div className="dashboard-grid">
                      <div>
                        <form onSubmit={handleAddEf}>
                          <div className="tactile-input-container">
                            <label className="tactile-label" htmlFor="ef-source">Fuel/Energy Source</label>
                            <input 
                              id="ef-source"
                              type="text" 
                              className="tactile-input" 
                              placeholder="e.g. Bio-Fuel or Coal"
                              value={newEfSource}
                              onChange={(e) => setNewEfSource(e.target.value)}
                              required
                            />
                          </div>

                          <div className="tactile-input-container">
                            <label className="tactile-label" htmlFor="ef-mult">CO₂ Multiplier (kg per unit)</label>
                            <input 
                              id="ef-mult"
                              type="number" 
                              className="tactile-input" 
                              placeholder="e.g. 1.25"
                              step="0.01"
                              value={newEfMultiplier}
                              onChange={(e) => setNewEfMultiplier(e.target.value)}
                              min="0.01"
                              required
                            />
                          </div>

                          <button type="submit" className="tactile-btn primary" style={{ width: '100%' }}>
                            Add Emission Multiplier
                          </button>
                        </form>
                      </div>

                      <div>
                        <span className="hardware-label">Active Emission Factors ({emissionFactorsList.length})</span>
                        <div className="log-list" style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '10px' }}>
                          {emissionFactorsList.map(ef => (
                            <div key={ef.id} className="log-item" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ fontWeight: 800 }}>⚡ {ef.sourceType}</span>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sync: {ef.sync_status}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontWeight: 800, color: 'var(--red)' }}>x{ef.multiplierValue} CO₂</span>
                                <button 
                                  onClick={() => handleDeleteEf(ef.id)}
                                  className="tactile-btn danger" 
                                  style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: GAMIFICATION CHALLENGES */}
                  <div className="embossed-panel">
                    <h3 className="desk-section-title">
                      <IconAward size={18} color="var(--accent-green)" />
                      Gamification Challenges Catalog
                    </h3>

                    <div className="dashboard-grid">
                      <div>
                        <form onSubmit={handleAddChallenge}>
                          <div className="tactile-input-container">
                            <label className="tactile-label" htmlFor="challenge-title">Challenge Title</label>
                            <input 
                              id="challenge-title"
                              type="text" 
                              className="tactile-input" 
                              placeholder="e.g. Plant a Community Tree"
                              value={newChallengeTitle}
                              onChange={(e) => setNewChallengeTitle(e.target.value)}
                              required
                            />
                          </div>

                          <div className="tactile-input-container">
                            <label className="tactile-label" htmlFor="challenge-xp">XP Reward Value</label>
                            <input 
                              id="challenge-xp"
                              type="number" 
                              className="tactile-input" 
                              placeholder="e.g. 200"
                              value={newChallengeXP}
                              onChange={(e) => setNewChallengeXP(e.target.value)}
                              min="10"
                              required
                            />
                          </div>

                          <button type="submit" className="tactile-btn primary" style={{ width: '100%' }}>
                            Add Gamification Challenge
                          </button>
                        </form>
                      </div>

                      <div>
                        <span className="hardware-label">Active Challenge Registry ({challenges.length})</span>
                        <div className="log-list" style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '10px' }}>
                          {challenges.map(ch => (
                            <div key={ch.id} className="log-item" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ fontWeight: 800 }}>🏆 {ch.title}</span>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status: {ch.status} • Sync: {ch.sync_status}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontWeight: 800, color: 'var(--accent-blue)' }}>+{ch.xpValue} XP</span>
                                <button 
                                  onClick={() => handleDeleteChallenge(ch.id)}
                                  className="tactile-btn danger" 
                                  style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </>
          )}

        </div>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <p>EcoSphere Sustainability Console • Powered by <span>Odoo GreenMetric</span></p>
        <p>Local-First Zero-Trust Architecture • All rights reserved &copy; 2026</p>
      </footer>
    </main>
  )
}

export default App

