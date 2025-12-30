import AttendanceManagement from '@/components/dashboard/AttendanceManagement'

export default function AttendancePage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground mt-2">
            Track employee attendance, shift hours, and GPS routes
          </p>
        </div>
      </div>

      <AttendanceManagement />
    </div>
  )
}
