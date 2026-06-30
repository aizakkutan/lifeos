import React, { useState, useEffect } from 'react'

const STORAGE_KEY = 'lifeos_unlocked'

export default function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [checked, setChecked] = useState(false)

  const correctPassword = import.meta.env.VITE_APP_PASSWORD

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') setUnlocked(true)
    setChecked(true)
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (password === correctPassword) {
      localStorage.setItem(STORAGE_KEY, 'true')
      setUnlocked(true)
      setError(false)
    } else {
      setError(true)
      setPassword('')
    }
  }

  // Wait for localStorage check before rendering anything (avoids flash)
  if (!checked) return null

  if (unlocked) return children

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F2F2F7', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: '2rem',
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#FFFFFF', borderRadius: 16, padding: '2.5rem 2rem', width: 340, maxWidth: '100%',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 16,
        textAlign: 'center',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, background: '#E5F1FF', color: '#007AFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto',
        }}>
          🔒
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1C1C1E', letterSpacing: '-0.02em', marginBottom: 4 }}>
            LifeOS
          </div>
          <div style={{ fontSize: 13, color: '#8E8E93' }}>
            Enter your password to continue
          </div>
        </div>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={e => { setPassword(e.target.value); setError(false) }}
          placeholder="Password"
          style={{
            width: '100%', fontSize: 15, padding: '11px 14px', borderRadius: 10,
            border: error ? '1px solid #FF3B30' : '1px solid rgba(0,0,0,.1)',
            background: '#F2F2F7', color: '#1C1C1E', outline: 'none', textAlign: 'center',
            fontFamily: "'Inter', sans-serif",
          }}
        />
        {error && (
          <div style={{ fontSize: 12, color: '#FF3B30', marginTop: -8 }}>
            Incorrect password. Try again.
          </div>
        )}
        <button
          type="submit"
          style={{
            background: '#007AFF', color: '#fff', border: 'none', borderRadius: 10,
            padding: '11px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Unlock
        </button>
      </form>
    </div>
  )
}
