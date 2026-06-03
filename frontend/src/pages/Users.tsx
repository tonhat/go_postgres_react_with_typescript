import { useEffect, useState } from 'react'
import { userService } from '../services'
import type { User } from '../types'

export default function Users() {
  const [items, setItems] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await userService.list()
      setItems(data.users)
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to load',
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const toggleActive = async (u: User) => {
    await userService.update(u.id, { isActive: !u.isActive })
    load()
  }

  const changeRole = async (u: User, role: string) => {
    await userService.update(u.id, { role })
    load()
  }

  const remove = async (u: User) => {
    if (!confirm(`Delete user ${u.email}?`)) return
    await userService.remove(u.id)
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Users</h1>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2 mb-4">
          {error}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Full name</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center text-gray-500 py-6">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-gray-500 py-6">
                  No users found
                </td>
              </tr>
            ) : (
              items.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.email}</td>
                  <td className="font-medium">{u.fullName}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="admin">admin</option>
                      <option value="teacher">teacher</option>
                      <option value="student">student</option>
                    </select>
                  </td>
                  <td>{u.phone || '-'}</td>
                  <td>
                    {u.isActive ? (
                      <span className="badge badge-green">Active</span>
                    ) : (
                      <span className="badge badge-red">Inactive</span>
                    )}
                  </td>
                  <td className="text-xs">{u.createdAt?.slice(0, 10)}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-secondary text-xs"
                        onClick={() => toggleActive(u)}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn btn-danger text-xs" onClick={() => remove(u)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
