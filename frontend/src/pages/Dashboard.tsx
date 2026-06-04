import { useEffect, useState } from 'react'
import { classService, courseService, launchService, studentService, teacherService, userService } from '../services'

interface Stats {
  users: number
  students: number
  teachers: number
  courses: number
  classes: number
  launches: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    users: 0,
    students: 0,
    teachers: 0,
    courses: 0,
    classes: 0,
    launches: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      userService.list().catch(() => ({ total: 0 })),
      studentService.list().catch(() => ({ total: 0 })),
      teacherService.list().catch(() => ({ total: 0 })),
      courseService.list().catch(() => ({ total: 0 })),
      classService.list().catch(() => ({ total: 0 })),
      launchService.list().catch(() => ({ total: 0 })),
    ]).then(([u, s, t, c, cl, l]) => {
      setStats({
        users: u.total,
        students: s.total,
        teachers: t.total,
        courses: c.total,
        classes: cl.total,
        launches: l.total,
      })
      setLoading(false)
    })
  }, [])

  const cards = [
    { label: 'Users', value: stats.users, color: 'bg-blue-500', icon: '👥' },
    { label: 'Students', value: stats.students, color: 'bg-green-500', icon: '🎓' },
    { label: 'Teachers', value: stats.teachers, color: 'bg-purple-500', icon: '👨‍🏫' },
    { label: 'Courses', value: stats.courses, color: 'bg-yellow-500', icon: '📚' },
    { label: 'Classes', value: stats.classes, color: 'bg-pink-500', icon: '🏫' },
    { label: 'Launches', value: stats.launches, color: 'bg-indigo-500', icon: '🚀' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      {loading ? (
        <div className="text-gray-500">Loading statistics...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {cards.map((c) => (
            <div key={c.label} className="card p-4 md:p-6 flex items-center gap-4">
              <div className={`${c.color} w-12 h-12 rounded-md flex items-center justify-center text-white text-xl`}>
                {c.icon}
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{c.value}</div>
                <div className="text-sm text-gray-500">{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 md:mt-8 card p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Welcome to EduManager</h2>
        <p className="text-sm text-gray-600">
          A complete education management system. Manage students, teachers, courses, classes, and academic launches.
          Use the sidebar to navigate between sections.
        </p>
      </div>
    </div>
  )
}
