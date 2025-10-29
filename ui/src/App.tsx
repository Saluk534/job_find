import { useEffect, useState } from 'react'

type User = { id: number; name: string }

export default function App() {
  const [users, setUsers] = useState<User[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  // Your API base — works locally or in Docker
  const API_URL = process.env.VITE_API_URL 


  async function fetchUsers() {
    const res = await fetch(`${API_URL}/users`)
    const data = await res.json()
    setUsers(data.users || [])
  }

  async function addUser() {
    if (!name.trim()) return
    setLoading(true)
    await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    setName('')
    await fetchUsers()
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <main style={{ maxWidth: 500, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>Users</h1>

      {/* Add user form */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter name"
          style={{ flex: 1, padding: '0.5rem' }}
        />
        <button onClick={addUser} disabled={loading}>
          {loading ? 'Adding...' : 'Add'}
        </button>
      </div>

      {/* User list */}
      <ul>
        {users.map(u => (
          <li key={u.id}>{u.name}</li>
        ))}
      </ul>
    </main>
  )
}
