import { useEffect, useState } from 'react'
import { userService } from '../services'
import type { User } from '../types'
import { useAuth } from '../context/AuthContext'
import Pagination from '../components/Pagination'

export default function Users() {
  const { user: currentUser } = useAuth()
  const [items, setItems] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const isAdmin = currentUser?.role === 'admin'

  const load = async (p = page) => {
    setLoading(true)
    setError('')
    try {
      const data = await userService.list(p)
      setItems(data.users)
      setTotal(data.total)
      setPage(data.page)
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
  }, [page])

  const toggleActive = async (u: User) => {
    if (!isAdmin) return
    await userService.update(u.id, { isActive: !u.isActive })
    load()
  }

  const changeRole = async (u: User, role: string) => {
    if (!isAdmin) return
    await userService.update(u.id, { role })
    load()
  }

  const remove = async (u: User) => {
    if (!isAdmin) return
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
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="text-center text-gray-500 py-6">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="text-center text-gray-500 py-6">
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
                    {isAdmin ? (
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="admin">admin</option>
                        <option value="teacher">teacher</option>
                        <option value="student">student</option>
                      </select>
                    ) : (
                      <span className="badge badge-blue">{u.role}</span>
                    )}
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
                  {isAdmin && (
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
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination page={page} limit={20} total={total} onPageChange={setPage} />
      </div>
    </div>
  )
}
