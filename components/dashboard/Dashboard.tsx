import { ClipboardCheck, ShoppingBag, Truck, Wallet, Users, ArrowUpRight } from 'lucide-react'
import ActivityChart from './ActivityChart'

interface DashboardStats {
  kpis: {
    surveyed_stores: number
    pending_sales: number
    pending_deliveries: number
    collections: number
  }
  active_agents: { on_field: number; total: number }
  activity_trends: { name: string; surveys: number; orders: number; deliveries: number }[]
  top_performers: { name: string; role: string; count: number }[]
}

const KPICard = ({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) => (
  <div className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <p className="text-muted-foreground text-sm font-medium">{title}</p>
    <h3 className="text-2xl font-bold mt-1 text-foreground">{value.toLocaleString()}</h3>
  </div>
)

export default function Dashboard({ stats }: { stats: DashboardStats }) {
  const { kpis, active_agents, activity_trends, top_performers } = stats

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Operations Overview</h1>
          <p className="text-muted-foreground">Real-time status of your field agents and store workflow.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors font-medium">
            Generate Report
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Surveyed Stores" value={kpis.surveyed_stores} icon={ClipboardCheck} color="bg-emerald-600" />
        <KPICard title="Pending Sales" value={kpis.pending_sales} icon={ShoppingBag} color="bg-emerald-500" />
        <KPICard title="Pending Deliveries" value={kpis.pending_deliveries} icon={Truck} color="bg-emerald-700" />
        <KPICard title="Collections" value={kpis.collections} icon={Wallet} color="bg-amber-600" />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Activity Trends</h3>
            <span className="text-sm text-muted-foreground">Last 7 Days</span>
          </div>
          <div className="h-80 w-full">
            <ActivityChart data={activity_trends} />
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-6">Active Resources</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Active Agents</p>
                  <p className="text-xs text-muted-foreground">Currently on field</p>
                </div>
              </div>
              <span className="text-lg font-bold text-foreground">
                {active_agents.on_field}/{active_agents.total}
              </span>
            </div>

            <div className="mt-8 pt-8 border-t">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Top Performers</h4>
              <div className="space-y-4">
                {top_performers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
                ) : (
                  top_performers.map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{p.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{p.role.toLowerCase()}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-foreground">{p.count} tasks</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
