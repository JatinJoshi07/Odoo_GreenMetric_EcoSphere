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

  // State loaded from Dexie DB
  const [carbonLogs, setCarbonLogs] = useState([])
  const [csrLogs, setCsrLogs] = useState([])
  const [complianceIssues, setComplianceIssues] = useState([])

  // User Gamification XP and Badges (stateful, with default starter values and localStorage persistence)
  const [userXP, setUserXP] = useState(() => {
    const saved = localStorage.getItem('ecosphere-xp')
    return saved ? parseInt(saved, 10) : 1200
  })

  const [userBadges, setUserBadges] = useState(() => {
    const saved = localStorage.getItem('ecosphere-badges')
    return saved ? JSON.parse(saved) : ['Sustainably Starter', 'CSR Champion']
  })

  useEffect(() => {
    localStorage.setItem('ecosphere-xp', userXP.toString())
  }, [userXP])

  useEffect(() => {
    localStorage.setItem('ecosphere-badges', JSON.stringify(userBadges))
  }, [userBadges])

  // --- MOCK INTERACTIVE DIAL STATE FOR LANDING PREVIEW ---
  const [previewValue, setPreviewValue] = useState(78)

  // Form states
  const [carbonFuelSource, setCarbonFuelSource] = useState('Fleet Fuel')
  const [carbonAmount, setCarbonAmount] = useState('')
  const [csrChallenge, setCsrChallenge] = useState('Cycle to Work')
  const [csrFile, setCsrFile] = useState(null)
  const [csrFileName, setCsrFileName] = useState('')

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

      // Sort by date or id to look nice
      setCarbonLogs(cLogs.reverse())
      setCsrLogs(sLogs.reverse())
      setComplianceIssues(compIssues)
    } catch (e) {
      console.error("Dexie failed to load or seed data:", e)
    }
  }



  // --- AUTOMATED SYNC ENGINE PIPELINE ---
  // overrideXP / overrideBadges: pass the freshly-computed values from an
  // action handler so we never read stale React closure state.
  const handleSync = async (overrideXP, overrideBadges) => {
    if (!online) {
      setSyncMessage('⚠️ Switch machine connection to ONLINE to synchronize.')
      return
    }
    setSyncing(true)
    setSyncMessage('📡 Scanning IndexedDB and connecting to server...')

    // Use the override values if provided, otherwise fall back to current state
    const currentXP     = overrideXP     !== undefined ? overrideXP     : userXP
    const currentBadges = overrideBadges !== undefined ? overrideBadges : userBadges

    const syncUrl = `http://${window.location.hostname}:5000/sync`

    try {
      // 1. PUSH PHASE: Get all pending transactions
      const pendingCarbon = await db.carbon_transactions.where('sync_status').equals('pending').toArray()
      const pendingCsr    = await db.csr_participations.where('sync_status').equals('pending').toArray()
      const pendingComp   = await db.compliance_issues.where('sync_status').equals('pending').toArray()

      const totalPending = pendingCarbon.length + pendingCsr.length + pendingComp.length

      // Always push user XP and badges (using the fresh values)
      const userPayload = {
        id: 'u-001',
        totalXP: currentXP,
        badges: currentBadges
      }

      setSyncMessage(`Pushing state to central cloud...`)
      const payload = {
        carbon_transactions: pendingCarbon,
        csr_participations: pendingCsr,
        compliance_issues: pendingComp,
        user: userPayload
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
          await db.transaction('rw', db.carbon_transactions, db.csr_participations, db.compliance_issues, async () => {
            for (let item of pendingCarbon) {
              await db.carbon_transactions.update(item.id, { sync_status: 'synced' })
            }
            for (let item of pendingCsr) {
              await db.csr_participations.update(item.id, { sync_status: 'synced' })
            }
            for (let item of pendingComp) {
              await db.compliance_issues.update(item.id, { sync_status: 'synced' })
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
        const { carbon_transactions, csr_participations, compliance_issues, user } = fetchedData

        await db.transaction('rw', db.carbon_transactions, db.csr_participations, db.compliance_issues, async () => {
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
        })

        // Merge User XP and Badges: always keep the HIGHER of local vs server,
        // using functional updaters so React batching never loses the fresh local value.
        if (user) {
          setUserXP(prev => Math.max(prev, user.totalXP))
          setUserBadges(prev => Array.from(new Set([...prev, ...user.badges])))
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
          await db.transaction('rw', db.carbon_transactions, db.csr_participations, db.compliance_issues, async () => {
            for (let item of pendingCarbon) {
              await db.carbon_transactions.update(item.id, { sync_status: 'synced' })
            }
            for (let item of pendingCsr) {
              await db.csr_participations.update(item.id, { sync_status: 'synced' })
            }
            for (let item of pendingComp) {
              await db.compliance_issues.update(item.id, { sync_status: 'synced' })
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
  const emissionFactors = {
    'Fleet Fuel': 2.31,
    'Electricity': 0.85,
    'Natural Gas': 1.88
  }

  const calculatedEmissionsInput = useMemo(() => {
    const amt = parseFloat(carbonAmount)
    if (isNaN(amt) || amt <= 0) return 0
    return parseFloat((amt * emissionFactors[carbonFuelSource]).toFixed(2))
  }, [carbonAmount, carbonFuelSource])

  // --- REAL-TIME DYNAMIC ESG SCORE CALCULATIONS ---
  // ESG scores are weighted: 40% Env, 30% Soc, 30% Gov
  const scores = useMemo(() => {
    // 1. Env: starts at 90%, drops 1.5% for every 10kg emissions from transactions (representing footprint target offsets)
    const totalEmissions = carbonLogs.reduce((acc, curr) => acc + (curr.calculatedEmissions || 0), 0)
    const envBase = Math.max(10, 95 - (totalEmissions / 15))

    // 2. Soc: base score 50% + 15% for every CSR activity completion, capped at 98%
    const completedCsrCount = csrLogs.length
    const socBase = Math.min(98, 50 + (completedCsrCount * 15))

    // 3. Gov: percentage of compliance issues resolved. Let's seed 3 issues.
    const totalIssues = complianceIssues.length
    const resolvedIssues = complianceIssues.filter(i => i.status === 'Closed').length
    const govBase = totalIssues > 0 ? (resolvedIssues / totalIssues) * 100 : 80

    // Weighted composite
    const overall = (envBase * 0.4) + (socBase * 0.3) + (govBase * 0.3)

    return {
      env: envBase,
      soc: socBase,
      gov: govBase,
      overall: overall
    }
  }, [carbonLogs, csrLogs, complianceIssues])

  // --- USER TRIGGERS / FORM SUBMISSIONS ---
  const handleAddCarbonLog = async (e) => {
    e.preventDefault()
    const amt = parseFloat(carbonAmount)
    if (isNaN(amt) || amt <= 0) return

    const newLog = {
      id: generateUUID(),
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
      
      // Auto XP award
      const newXP = userXP + 25
      setUserXP(newXP)
      
      // Trigger background sync to server
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
    // Enforce proof upload before submission
    if (!csrFile) return

    const newCsr = {
      id: generateUUID(),
      userId: 'u-001',
      activityId: csrChallenge === 'Cycle to Work' ? 'ch-001' : csrChallenge === 'Avoid Single-Use Plastics' ? 'ch-002' : 'ch-003',
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

      // Gamification Reward: Award XP depending on challenge
      let xpReward = 100
      if (csrChallenge === 'Cycle to Work') xpReward = 150
      if (csrChallenge === 'Avoid Single-Use Plastics') xpReward = 100
      if (csrChallenge === 'Share Fleet Log') xpReward = 50

      const newXP = userXP + xpReward
      setUserXP(newXP)
      
      // Unlock new badge if user exceeds threshold
      let updatedBadges = [...userBadges]
      if (newXP >= 1400 && !userBadges.includes('Eco Titan')) {
        updatedBadges = [...userBadges, 'Eco Titan']
        setUserBadges(updatedBadges)
      }

      // Trigger background sync to server
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
      
      // Governance change reward
      let newXP = userXP
      if (nextStatus === 'Closed') {
        newXP = userXP + 50
      } else {
        newXP = Math.max(0, userXP - 50)
      }
      setUserXP(newXP)

      // Trigger background sync to server
      handleSync(newXP)
    } catch (err) {
      console.error(err)
    }
  }

  // --- REWARD REDEMPTION SUBMISSION ---
  const handleRedeem = (cost, itemName) => {
    if (userXP < cost) {
      alert(`⚠️ Insufficient XP. You need ${cost} XP to redeem this reward.`)
      return
    }
    setUserXP(prev => prev - cost)
    alert(`🎉 Successfully redeemed: ${itemName}! Deducted ${cost} XP from your balance.`)
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
              onClick={handleSync} 
              disabled={syncing}
              className={`tactile-btn ${syncing ? 'active' : ''}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              {syncing ? 'Synchronizing...' : 'Sync Dexie Queue'}
            </button>
          </div>

          {/* MAIN CIRCULAR ESG SCORE GAUGES SECTION */}
          <div className="gauges-row">
            {/* OVERALL MASTER Score Dial (Composite) */}
            <div className="embossed-panel master-gauge-card">
              <CircularGauge value={scores.overall} label="Composite" color="var(--accent-green)" size={160} />
              <div className="master-gauge-info">
                <h3>Overall ESG Rating</h3>
                <p>
                  Calculated as a weighted matrix (40% Environment, 30% Social, 30% Governance) based on local transactions.
                </p>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="badge-item" style={{ fontSize: '0.7rem', padding: '4px 8px' }}>
                    Weighting: 40/30/30
                  </span>
                  <span className="badge-item" style={{ fontSize: '0.7rem', padding: '4px 8px', color: 'var(--accent-green)' }}>
                    Standard Compliant
                  </span>
                </div>
              </div>
            </div>

            {/* Environmental Dial */}
            <div className="embossed-panel gauge-card">
              <CircularGauge value={scores.env} label="Environmental" color="var(--accent-green)" />
              <span className="hardware-label" style={{ marginTop: '15px' }}>40% Score Weight</span>
            </div>

            {/* Social Dial */}
            <div className="embossed-panel gauge-card">
              <CircularGauge value={scores.soc} label="Social (CSR)" color="var(--accent-blue)" />
              <span className="hardware-label" style={{ marginTop: '15px' }}>30% Score Weight</span>
            </div>

            {/* Governance Dial */}
            <div className="embossed-panel gauge-card">
              <CircularGauge value={scores.gov} label="Governance" color="var(--red)" />
              <span className="hardware-label" style={{ marginTop: '15px' }}>30% Score Weight</span>
            </div>
          </div>

          {/* ACTIVE AUDITS & ACTIONS SECTION */}
          <div className="dashboard-grid" style={{ marginBottom: '40px' }}>
            
            {/* PANEL: LOG CARBON EMISSIONS (E-Pillar) */}
            <div className="embossed-panel">
              <h3 className="desk-section-title">
                <IconFlame size={18} color="var(--accent-green)" />
                Automated Carbon Engine
              </h3>

              <form onSubmit={handleAddCarbonLog}>
                <div className="tactile-input-container">
                  <label className="tactile-label" htmlFor="source-type">Fuel Source</label>
                  <select 
                    id="source-type"
                    className="tactile-input tactile-select"
                    value={carbonFuelSource}
                    onChange={(e) => setCarbonFuelSource(e.target.value)}
                  >
                    <option value="Fleet Fuel">Fleet Fuel (CO₂ x2.31)</option>
                    <option value="Electricity">Electricity (CO₂ x0.85)</option>
                    <option value="Natural Gas">Natural Gas (CO₂ x1.88)</option>
                  </select>
                </div>

                <div className="tactile-input-container">
                  <label className="tactile-label" htmlFor="amount-input">Raw Quantity (Liters / kWh)</label>
                  <input 
                    id="amount-input"
                    type="number" 
                    className="tactile-input" 
                    placeholder="Enter operation volume"
                    value={carbonAmount}
                    onChange={(e) => setCarbonAmount(e.target.value)}
                    min="1"
                    required
                  />
                </div>

                <div className="debossed-panel" style={{ padding: '14px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="hardware-label" style={{ fontSize: '0.75rem' }}>Calculated CO₂ Footprint</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--red)' }}>
                    {calculatedEmissionsInput} kg
                  </span>
                </div>

                <button type="submit" className="tactile-btn primary" style={{ width: '100%' }}>
                  Log Carbon Transaction (+25 XP)
                </button>
              </form>

              {/* Transactions list */}
              <div style={{ marginTop: '24px' }}>
                <span className="hardware-label">Offline Audit Trail ({carbonLogs.length})</span>
                <div className="log-list">
                  {carbonLogs.map(log => (
                    <div key={log.id} className="log-item">
                      <div className="log-item-details">
                        <span className="log-item-type">{log.sourceType} ({log.rawAmount} units)</span>
                        <span className="log-item-date">{formatTimestamp(log.createdAt || log.date)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="log-item-amount">+{log.calculatedEmissions} kg CO₂</span>
                        <div className="log-item-sync">
                          <span className={`sync-dot ${log.sync_status === 'synced' ? 'synced' : 'pending'}`}></span>
                          {log.sync_status === 'synced' ? 'Synced' : 'Pending'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PANEL: USER PROFILE & CSR ACTIONS (S-Pillar) */}
            <div className="embossed-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '30px' }}>
              
              {/* User profile capsule */}
              <div>
                <div className="user-hub">
                  <div className="user-avatar">
                    {userXP > 0 ? 'JJ' : 'EM'}
                  </div>
                  <div className="user-meta">
                    <h4>Jatin Joshi</h4>
                    <p>Role: System Admin (Engineering)</p>
                  </div>
                </div>

                {/* Neumorphic XP progress meter */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    <span className="hardware-label">Accrued XP Level</span>
                    <span>{userXP} XP</span>
                  </div>
                  <div className="debossed-panel" style={{ padding: '4px', borderRadius: '10px' }}>
                    <div 
                      style={{ 
                        height: '10px', 
                        borderRadius: '6px', 
                        background: 'var(--accent-blue)', 
                        width: `${Math.min(100, (userXP / 2000) * 100)}%`,
                        transition: 'width 0.4s ease'
                      }}
                    ></div>
                  </div>
                </div>

                {/* Badges checklist */}
                <span className="hardware-label">Unlocked Milestones</span>
                <div className="badge-list">
                  {userBadges.map(badge => (
                    <div key={badge} className="badge-item">
                      <IconAward size={14} color="var(--accent-blue)" />
                      {badge}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form: submit CSR Activity */}
              <div>
                <h3 className="desk-section-title" style={{ marginTop: '10px' }}>
                  <IconActivity size={18} color="var(--accent-blue)" />
                  Gamified CSR Evidence
                </h3>

                <form onSubmit={handleAddCsrLog}>
                  <div className="tactile-input-container">
                    <label className="tactile-label" htmlFor="csr-challenge">Select CSR Campaign</label>
                    <select 
                      id="csr-challenge"
                      className="tactile-input tactile-select"
                      value={csrChallenge}
                      onChange={(e) => setCsrChallenge(e.target.value)}
                    >
                      <option value="Cycle to Work">Cycle to Work (+150 XP)</option>
                      <option value="Avoid Single-Use Plastics">Avoid Single-Use Plastics (+100 XP)</option>
                      <option value="Share Fleet Log">Share Fleet Log (+50 XP)</option>
                    </select>
                  </div>

                  <div className="tactile-input-container">
                    <label className="tactile-label">Upload Evidence File (Required)</label>
                    <div className={`tactile-file-drop ${csrFile ? 'has-file' : ''}`}>
                      <IconCloud size={28} color={csrFile ? 'var(--accent-green)' : 'var(--text-muted)'} />
                      <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                        {csrFileName ? `📎 ${csrFileName}` : 'Drag or click to choose proof image'}
                      </p>
                      <input 
                        type="file" 
                        className="file-input-hidden" 
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={!csrFile}
                    className={`tactile-btn secondary ${!csrFile ? 'disabled' : ''}`}
                    style={{ width: '100%', opacity: csrFile ? 1 : 0.6 }}
                  >
                    Submit Proof & Claim XP
                  </button>
                </form>

                {/* CSR list */}
                <div style={{ marginTop: '24px' }}>
                  <span className="hardware-label">CSR Activity Trail ({csrLogs.length})</span>
                  <div className="log-list" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {csrLogs.map(log => {
                      const campaignName = log.activityId === 'ch-001' ? 'Cycle to Work' : log.activityId === 'ch-002' ? 'Avoid Single-Use Plastics' : log.activityId === 'ch-003' ? 'Share Fleet Log' : 'CSR Campaign'
                      return (
                        <div key={log.id} className="log-item">
                          <div className="log-item-details">
                            <span className="log-item-type">{campaignName}</span>
                            <span className="log-item-date">{formatTimestamp(log.createdAt)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span className="log-item-amount" style={{ color: 'var(--accent-blue)' }}>{log.status}</span>
                            <div className="log-item-sync">
                              <span className={`sync-dot ${log.sync_status === 'synced' ? 'synced' : 'pending'}`}></span>
                              {log.sync_status === 'synced' ? 'Synced' : 'Pending'}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* GOVERNANCE TRACKER (G-Pillar) */}
          <div className="embossed-panel" style={{ marginBottom: '40px' }}>
            <h3 className="desk-section-title">
              <IconShield size={18} color="var(--red)" />
              Active Compliance Flags
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Current System Time: <span>2026-07-12</span>. Issues exceeding target due dates alert operators with emergency pulse flashes. Click rocker toggles to close resolved audits.
            </p>

            <div className="compliance-list">
              {complianceIssues.map(issue => {
                const isOverdue = new Date('2026-07-12') > new Date(issue.dueDate) && issue.status === 'Open'
                return (
                  <div key={issue.id} className="compliance-item">
                    <div className="compliance-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={`compliance-badge ${issue.status === 'Open' ? (isOverdue ? 'overdue' : 'open') : 'closed'}`}>
                          {issue.status === 'Open' ? (isOverdue ? '⚠️ Overdue' : 'Open') : 'Closed'}
                        </span>
                        <span className="compliance-desc">{issue.description}</span>
                      </div>
                      <div className="compliance-meta" style={{ marginTop: '6px' }}>
                        <span>Owner: {issue.ownerId === 'u-001' ? 'Jatin Joshi' : issue.ownerId}</span>
                        <span>Due Date: {issue.dueDate}</span>
                        <span>Sync: {issue.sync_status}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleToggleCompliance(issue.id, issue.status)}
                      className={`tactile-btn ${issue.status === 'Closed' ? 'active' : ''}`}
                      style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                    >
                      {issue.status === 'Open' ? 'Toggle Close' : 'Reopen Audit'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* REWARD CATALOG (Desk perspective cards) */}
          <div style={{ marginBottom: '40px' }}>
            <div className="desk-section-title">
              <IconAward size={18} color="var(--accent-green)" />
              Reward Redemption Catalog
            </div>
            
            <div className="desk-surface">
              {/* Card 1 */}
              <div className="desk-card">
                <div className="desk-card-header">
                  <div className="desk-card-icon green">
                    <IconLeaf size={24} />
                  </div>
                  <span className="desk-card-cost">200 XP</span>
                </div>
                <div className="desk-card-body">
                  <h4 className="desk-card-title">Plant 5 Forest Trees</h4>
                  <p className="desk-card-desc">
                    Fund corporate carbon absorption program. Trees are planted in localized ESG parks under your audit profile.
                  </p>
                </div>
                <div className="desk-card-footer">
                  <button onClick={() => handleRedeem(200, 'Plant 5 Forest Trees')} className="tactile-btn primary">
                    Redeem Reward
                  </button>
                </div>
              </div>

              {/* Card 2 */}
              <div className="desk-card" style={{ transform: 'rotateX(12deg) rotateY(4deg) rotateZ(1deg)' }}>
                <div className="desk-card-header">
                  <div className="desk-card-icon">
                    <IconGlobe size={24} />
                  </div>
                  <span className="desk-card-cost">500 XP</span>
                </div>
                <div className="desk-card-body">
                  <h4 className="desk-card-title">Solar Device Charger</h4>
                  <p className="desk-card-desc">
                    Get an embossed solar-powered battery bank. Shipped directly to your division head office for auditing.
                  </p>
                </div>
                <div className="desk-card-footer">
                  <button onClick={() => handleRedeem(500, 'Solar Device Charger')} className="tactile-btn secondary">
                    Redeem Reward
                  </button>
                </div>
              </div>

              {/* Card 3 */}
              <div className="desk-card" style={{ transform: 'rotateX(15deg) rotateY(-12deg) rotateZ(-6deg)' }}>
                <div className="desk-card-header">
                  <div className="desk-card-icon green">
                    <IconLeaf size={24} />
                  </div>
                  <span className="desk-card-cost">300 XP</span>
                </div>
                <div className="desk-card-body">
                  <h4 className="desk-card-title">Stainless Eco Flask</h4>
                  <p className="desk-card-desc">
                    Claim a triple-insulated skeuomorphic temperature flask, customized with carbon-offset serial tracking.
                  </p>
                </div>
                <div className="desk-card-footer">
                  <button onClick={() => handleRedeem(300, 'Stainless Eco Flask')} className="tactile-btn primary">
                    Redeem Reward
                  </button>
                </div>
              </div>
            </div>
          </div>

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

