import React, { useEffect, useMemo, useState, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { Bell, Fish, Leaf, Gauge, LogIn, LogOut, Settings, Users, ChevronDown, Home, Library, User as UserIcon } from 'lucide-react'

// ---------- Lightweight App State (Auth + UI + Active Farm) ----------
const AuthContext = createContext(null)
const useAuth = () => useContext(AuthContext)

const AppProvider = ({ children }) => {
  const [token, setToken] = useState(() => window.sessionStorage.getItem('token') || window.localStorage.getItem('token') || '')
  const [user, setUser] = useState(() => {
    const raw = window.localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })
  const [activeFarm, setActiveFarm] = useState(() => {
    const raw = window.localStorage.getItem('activeFarm')
    return raw ? JSON.parse(raw) : null
  })
  const [unreadCount, setUnreadCount] = useState(0)
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const login = (nextUser, nextToken, remember) => {
    setUser(nextUser)
    setToken(nextToken)
    if (remember) {
      window.localStorage.setItem('token', nextToken)
    } else {
      window.sessionStorage.setItem('token', nextToken)
    }
    window.localStorage.setItem('user', JSON.stringify(nextUser))
  }

  const logout = () => {
    setUser(null)
    setToken('')
    window.localStorage.removeItem('token')
    window.sessionStorage.removeItem('token')
    window.localStorage.removeItem('user')
  }

  const value = useMemo(() => ({ user, token, login, logout, activeFarm, setActiveFarm, unreadCount, setUnreadCount, online }), [user, token, activeFarm, unreadCount, online])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ---------- Layout ----------
const Header = () => {
  const { user, logout, activeFarm, setActiveFarm, unreadCount, online } = useAuth()
  const [open, setOpen] = useState(false)
  const [farms, setFarms] = useState(() => {
    const raw = window.localStorage.getItem('farms_public')
    return raw ? JSON.parse(raw) : [
      { id: 'public-1', name: 'River Bend (Public)' },
      { id: 'public-2', name: 'Green Oasis (Public)' },
    ]
  })

  const switchFarm = (farm) => {
    setActiveFarm(farm)
    window.localStorage.setItem('activeFarm', JSON.stringify(farm))
    setOpen(false)
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Gauge className="w-5 h-5 text-blue-600" />
          <span>Aquaponics</span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <OnlineBadge online={online} />

          <div className="relative">
            <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-3 py-1.5 rounded border hover:bg-gray-50">
              <span className="truncate max-w-[160px]">{activeFarm?.name || 'Select farm'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-64 bg-white border rounded shadow">
                <div className="p-2 text-xs text-gray-500">Farms</div>
                <ul>
                  {farms.map(f => (
                    <li key={f.id}>
                      <button onClick={() => switchFarm(f)} className="w-full text-left px-3 py-2 hover:bg-gray-50">
                        {f.name}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="p-2 border-t text-sm"><Link to="/farms" onClick={() => setOpen(false)} className="text-blue-600 hover:underline">Manage farms</Link></div>
              </div>
            )}
          </div>

          <Link to="/notifications" className="relative p-2 rounded hover:bg-gray-100">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 text-[10px] bg-red-500 text-white rounded-full px-1">{unreadCount}</span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/profile" className="px-3 py-1.5 rounded border hover:bg-gray-50 flex items-center gap-2">
                <UserIcon className="w-4 h-4" /> {user.username}
              </Link>
              <button onClick={logout} className="px-3 py-1.5 rounded bg-gray-900 text-white flex items-center gap-2"><LogOut className="w-4 h-4"/> Logout</button>
            </div>
          ) : (
            <Link to="/login" className="px-3 py-1.5 rounded bg-blue-600 text-white flex items-center gap-2"><LogIn className="w-4 h-4"/> Login</Link>
          )}
        </div>
      </div>
    </header>
  )
}

const BottomNav = () => {
  const location = useLocation()
  const isActive = (path) => location.pathname === path
  return (
    <nav className="fixed md:hidden bottom-0 inset-x-0 bg-white border-t">
      <div className="grid grid-cols-5 max-w-6xl mx-auto">
        <NavItem to="/" icon={<Home className="w-5 h-5"/>} label="Home" active={isActive('/')} />
        <NavItem to="/dashboard" icon={<Gauge className="w-5 h-5"/>} label="Dashboard" active={isActive('/dashboard')} />
        <NavItem to="/notifications" icon={<Bell className="w-5 h-5"/>} label="Alerts" active={isActive('/notifications')} />
        <NavItem to="/species" icon={<Library className="w-5 h-5"/>} label="Species" active={isActive('/species')} />
        <NavItem to="/profile" icon={<UserIcon className="w-5 h-5"/>} label="Profile" active={isActive('/profile')} />
      </div>
    </nav>
  )
}

const NavItem = ({ to, icon, label, active }) => (
  <Link to={to} className={`flex flex-col items-center py-2 ${active ? 'text-blue-600' : 'text-gray-600'}`}>
    {icon}
    <span className="text-[11px]">{label}</span>
  </Link>
)

const OnlineBadge = ({ online }) => (
  <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
    <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
    {online ? 'Online' : 'Offline'}
  </span>
)

const Shell = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <Header />
    <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 pb-20 md:pb-8">{children}</main>
    <BottomNav />
  </div>
)

// ---------- Pages (Placeholders with UX flow hooks) ----------
const Landing = () => (
  <Shell>
    <div className="grid md:grid-cols-2 gap-6 items-center">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Monitor and manage your aquaponics farms</h1>
        <p className="text-gray-600 mb-6">Real-time water quality, alerts, historical insights, and species compatibility in one place.</p>
        <div className="flex gap-3">
          <Link to="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded">View Dashboard</Link>
          <Link to="/farms" className="px-4 py-2 rounded border">Browse Farms</Link>
        </div>
      </div>
      <div className="bg-white border rounded-lg p-4 grid grid-cols-3 gap-3">
        <MetricCard title="Temperature" value="24.3°C" trend="stable"/>
        <MetricCard title="pH" value="7.1" trend="up"/>
        <MetricCard title="Turbidity" value="12 NTU" trend="down"/>
      </div>
    </div>
  </Shell>
)

const MetricCard = ({ title, value, trend }) => (
  <div className="p-4 rounded-lg border bg-gradient-to-br from-white to-gray-50">
    <div className="text-xs text-gray-500">{title}</div>
    <div className="text-2xl font-semibold">{value}</div>
    <div className="text-xs text-gray-500">Trend: {trend}</div>
  </div>
)

const Dashboard = () => {
  const { activeFarm, online } = useAuth()
  return (
    <Shell>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Dashboard {activeFarm ? `— ${activeFarm.name}` : ''}</h2>
        <span className="text-xs text-gray-500">Live updates {online ? 'enabled' : 'paused (offline)'}</span>
      </div>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <MetricCard title="Temperature" value="--" trend="--"/>
        <MetricCard title="pH" value="--" trend="--"/>
        <MetricCard title="Turbidity" value="--" trend="--"/>
      </div>
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Historical (24h / 7d / 30d)</div>
          <div className="flex gap-2 text-sm">
            <button className="px-2 py-1 rounded border">24h</button>
            <button className="px-2 py-1 rounded border">7d</button>
            <button className="px-2 py-1 rounded border">30d</button>
          </div>
        </div>
        <div className="h-56 grid place-items-center text-gray-500 text-sm bg-gray-50 rounded">Chart placeholder (Recharts planned)</div>
      </div>
    </Shell>
  )
}

const PublicFarms = () => (
  <Shell>
    <h2 className="text-xl font-semibold mb-4">Public Farms</h2>
    <div className="grid md:grid-cols-2 gap-4">
      {[1,2,3].map(i => (
        <div key={i} className="p-4 border rounded bg-white">
          <div className="font-semibold">Green Farm {i}</div>
          <div className="text-sm text-gray-600">Coastal city, open for viewing</div>
          <div className="mt-3 flex gap-2">
            <button className="px-3 py-1.5 rounded bg-gray-900 text-white">View</button>
            <button className="px-3 py-1.5 rounded border">Set Active</button>
          </div>
        </div>
      ))}
    </div>
  </Shell>
)

const Notifications = () => {
  const { setUnreadCount } = useAuth()
  useEffect(() => {
    // simulate marking as read
    setUnreadCount(0)
  }, [setUnreadCount])
  return (
    <Shell>
      <h2 className="text-xl font-semibold mb-4">Notifications</h2>
      <div className="space-y-3">
        <AlertItem type="warning" title="High turbidity" message="Turbidity exceeded 50 NTU"/>
        <AlertItem type="critical" title="Low temperature" message="Temperature dropped below 18°C"/>
        <AlertItem type="info" title="Thresholds updated" message="Farm thresholds were changed"/>
      </div>
    </Shell>
  )
}

const AlertItem = ({ type, title, message }) => {
  const color = type === 'critical' ? 'red' : type === 'warning' ? 'amber' : 'blue'
  return (
    <div className={`p-3 border rounded bg-white flex items-start gap-3`}> 
      <span className={`mt-1 w-2 h-2 rounded-full bg-${color}-500`}></span>
      <div>
        <div className="font-medium">{title} <span className={`ml-2 text-xs px-2 py-0.5 rounded bg-${color}-100 text-${color}-700`}>{type}</span></div>
        <div className="text-sm text-gray-600">{message}</div>
      </div>
    </div>
  )
}

const Species = () => (
  <Shell>
    <h2 className="text-xl font-semibold mb-4">Species Catalogs</h2>
    <div className="grid md:grid-cols-2 gap-4">
      <div className="p-4 border rounded bg-white">
        <div className="flex items-center gap-2 mb-2 font-semibold"><Fish className="w-4 h-4"/> Fish</div>
        <ul className="text-sm list-disc pl-5 text-gray-700 space-y-1">
          <li>Tilapia — temp 22–30°C, pH 6.5–9</li>
          <li>Trout — temp 10–18°C, pH 6.5–8</li>
        </ul>
      </div>
      <div className="p-4 border rounded bg-white">
        <div className="flex items-center gap-2 mb-2 font-semibold"><Leaf className="w-4 h-4"/> Plants</div>
        <ul className="text-sm list-disc pl-5 text-gray-700 space-y-1">
          <li>Lettuce — temp 15–22°C, pH 6–7</li>
          <li>Basil — temp 18–30°C, pH 5.5–6.5</li>
        </ul>
      </div>
    </div>
  </Shell>
)

const Compatibility = () => (
  <Shell>
    <h2 className="text-xl font-semibold mb-4">Compatibility Calculator</h2>
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-1 p-4 border rounded bg-white space-y-3">
        <div className="font-semibold">Select Fish</div>
        <div className="space-y-2">
          <label className="flex items-center gap-2"><input type="checkbox"/> Tilapia</label>
          <label className="flex items-center gap-2"><input type="checkbox"/> Trout</label>
        </div>
        <div className="font-semibold mt-4">Select Plants</div>
        <div className="space-y-2">
          <label className="flex items-center gap-2"><input type="checkbox"/> Lettuce</label>
          <label className="flex items-center gap-2"><input type="checkbox"/> Basil</label>
        </div>
        <button className="mt-4 w-full px-3 py-2 rounded bg-blue-600 text-white">Calculate</button>
      </div>
      <div className="md:col-span-2 p-4 border rounded bg-white">
        <div className="font-semibold mb-2">Recommended operating ranges</div>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>Temperature: 22–26°C</li>
          <li>pH: 6.8–7.2</li>
          <li>Turbidity: 0–30 NTU</li>
        </ul>
        <div className="mt-3 text-gray-600 text-sm">Fit Score: 86/100</div>
      </div>
    </div>
  </Shell>
)

const Profile = () => {
  const { user, login } = useAuth()
  const [username, setUsername] = useState(user?.username || '')
  return (
    <Shell>
      <h2 className="text-xl font-semibold mb-4">Profile</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 border rounded bg-white space-y-3">
          <div>
            <label className="text-sm text-gray-600">Username</label>
            <input value={username} onChange={e=>setUsername(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded"/>
          </div>
          <button onClick={()=> login({ ...(user||{}), username }, 'demo-token', true)} className="px-3 py-2 rounded bg-blue-600 text-white">Save</button>
        </div>
        <div className="p-4 border rounded bg-white space-y-3">
          <div className="font-semibold">Change Password</div>
          <input type="password" placeholder="Current password" className="w-full px-3 py-2 border rounded"/>
          <input type="password" placeholder="New password" className="w-full px-3 py-2 border rounded"/>
          <button className="px-3 py-2 rounded bg-gray-900 text-white">Update Password</button>
        </div>
      </div>
    </Shell>
  )
}

const FarmSettings = () => (
  <Shell>
    <h2 className="text-xl font-semibold mb-4">Farm Settings</h2>
    <div className="grid md:grid-cols-2 gap-4">
      <div className="p-4 border rounded bg-white space-y-3">
        <div className="font-medium">General</div>
        <input className="w-full px-3 py-2 border rounded" placeholder="Name"/>
        <textarea className="w-full px-3 py-2 border rounded" placeholder="Description"/>
        <input className="w-full px-3 py-2 border rounded" placeholder="Location"/>
      </div>
      <div className="p-4 border rounded bg-white space-y-3">
        <div className="font-medium">Alert Thresholds</div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="col-span-1 text-gray-600"></div>
          <div className="text-gray-500">Min</div>
          <div className="text-gray-500">Max</div>
          <div className="text-gray-600">Temperature</div>
          <input className="px-2 py-1 border rounded" placeholder="18"/>
          <input className="px-2 py-1 border rounded" placeholder="28"/>
          <div className="text-gray-600">pH</div>
          <input className="px-2 py-1 border rounded" placeholder="6.5"/>
          <input className="px-2 py-1 border rounded" placeholder="7.5"/>
          <div className="text-gray-600">Turbidity</div>
          <input className="px-2 py-1 border rounded" placeholder="0"/>
          <input className="px-2 py-1 border rounded" placeholder="50"/>
        </div>
        <button className="px-3 py-2 rounded bg-blue-600 text-white">Save Settings</button>
      </div>
    </div>
  </Shell>
)

const FarmMembers = () => (
  <Shell>
    <h2 className="text-xl font-semibold mb-4">Members</h2>
    <div className="p-4 border rounded bg-white">
      <div className="flex gap-2 mb-3">
        <input className="px-3 py-2 border rounded flex-1" placeholder="Invite by email"/>
        <select className="px-3 py-2 border rounded"><option>viewer</option><option>member</option><option>admin</option></select>
        <button className="px-3 py-2 rounded bg-blue-600 text-white">Invite</button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="py-2">User</th>
            <th className="py-2">Role</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {[1,2,3].map(i => (
            <tr key={i} className="border-t">
              <td className="py-2">user{i}@farm.com</td>
              <td className="py-2"><span className="px-2 py-0.5 rounded bg-gray-100">member</span></td>
              <td className="py-2"><button className="text-red-600">Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Shell>
)

const Login = () => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const onSubmit = (e) => {
    e.preventDefault()
    // Demo auth: replace with API call
    login({ id: 'u1', email, username: email.split('@')[0] || 'user' }, 'demo-token', remember)
  }
  return (
    <Shell>
      <div className="max-w-md mx-auto p-6 border rounded bg-white">
        <h2 className="text-xl font-semibold mb-4">Log in</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded" placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded" placeholder="••••••••" />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} /> Remember me</label>
          <button className="w-full px-3 py-2 rounded bg-blue-600 text-white">Login</button>
          <div className="text-sm text-gray-600">No account? <Link className="text-blue-600" to="/register">Register</Link></div>
        </form>
      </div>
    </Shell>
  )
}

const Register = () => (
  <Shell>
    <div className="max-w-md mx-auto p-6 border rounded bg-white">
      <h2 className="text-xl font-semibold mb-4">Register</h2>
      <div className="space-y-3">
        <input className="w-full px-3 py-2 border rounded" placeholder="Email"/>
        <input className="w-full px-3 py-2 border rounded" placeholder="Username"/>
        <input className="w-full px-3 py-2 border rounded" placeholder="Password" type="password"/>
        <button className="w-full px-3 py-2 rounded bg-blue-600 text-white">Create account</button>
      </div>
    </div>
  </Shell>
)

const Farms = () => (
  <Shell>
    <h2 className="text-xl font-semibold mb-4">Your Farms</h2>
    <div className="grid md:grid-cols-2 gap-4">
      {[{name:'Home Farm', role:'admin'},{name:'Community Farm', role:'viewer'}].map((f,i)=> (
        <div key={i} className="p-4 border rounded bg-white">
          <div className="font-semibold">{f.name}</div>
          <div className="text-sm text-gray-600">Role: {f.role}</div>
          <div className="mt-3 flex gap-2">
            <Link to="/dashboard" className="px-3 py-1.5 rounded bg-gray-900 text-white">Open</Link>
            <Link to="/farm/settings" className="px-3 py-1.5 rounded border flex items-center gap-1"><Settings className="w-4 h-4"/> Settings</Link>
            <Link to="/farm/members" className="px-3 py-1.5 rounded border flex items-center gap-1"><Users className="w-4 h-4"/> Members</Link>
          </div>
        </div>
      ))}
    </div>
  </Shell>
)

const NotFound = () => (
  <Shell>
    <div className="text-center py-20">
      <div className="text-6xl mb-2">🕵️‍♂️</div>
      <div className="text-lg">Page not found</div>
      <Link to="/" className="text-blue-600">Go home</Link>
    </div>
  </Shell>
)

// ---------- Route Guards ----------
const PrivateRoute = ({ children }) => {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return children
}

// ---------- Root App ----------
export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/farms" element={<PrivateRoute><Farms /></PrivateRoute>} />
          <Route path="/farm/settings" element={<PrivateRoute><FarmSettings /></PrivateRoute>} />
          <Route path="/farm/members" element={<PrivateRoute><FarmMembers /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
          <Route path="/species" element={<Species />} />
          <Route path="/compatibility" element={<Compatibility />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
