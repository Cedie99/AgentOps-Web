'use client'

import React, { useState, useEffect } from 'react'
import { Smartphone, History, Save, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'

interface AppConfig {
  id: string
  platform: string
  minimum_version: string
  latest_version: string
  force_update: boolean
  update_message: string | null
  store_url: string | null
  created_at: string
  updated_at: string
}

interface VersionHistory {
  id: string
  platform: string
  version_number: string
  change_type: string
  previous_value: string | null
  new_value: string
  changed_by: string | null
  change_note: string | null
  created_at: string
}

export default function AppVersionsPage() {
  const [configs, setConfigs] = useState<AppConfig[]>([])
  const [history, setHistory] = useState<VersionHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<'android' | 'ios'>('android')
  const [showSuccess, setShowSuccess] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    latest_version: '',
    minimum_version: '',
    force_update: false,
    update_message: '',
    change_note: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // Update form when platform changes
    if (Array.isArray(configs) && configs.length > 0) {
      const config = configs.find(c => c.platform === selectedPlatform)
      if (config) {
        setFormData({
          latest_version: config.latest_version,
          minimum_version: config.minimum_version,
          force_update: config.force_update,
          update_message: config.update_message || '',
          change_note: '',
        })
      }
    }
  }, [selectedPlatform, configs])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [configsRes, historyRes] = await Promise.all([
        fetch('/api/app-versions'),
        fetch('/api/app-versions/history?limit=20'),
      ])

      const configsData = await configsRes.json()
      const historyData = await historyRes.json()

      setConfigs(configsData)
      setHistory(historyData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setShowSuccess(false)

    try {
      const response = await fetch('/api/app-versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          ...formData,
          changed_by: 'Admin', // TODO: Get from auth context
        }),
      })

      if (response.ok) {
        setShowSuccess(true)
        await fetchData()
        setFormData(prev => ({ ...prev, change_note: '' }))
        setTimeout(() => setShowSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Error updating version:', error)
    } finally {
      setSaving(false)
    }
  }

  const currentConfig = Array.isArray(configs) ? configs.find(c => c.platform === selectedPlatform) : null

  const getChangeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      minimum_updated: 'Minimum Version Updated',
      latest_updated: 'Latest Version Updated',
      force_enabled: 'Force Update Enabled',
      force_disabled: 'Force Update Disabled',
    }
    return labels[type] || type
  }

  const getChangeTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      minimum_updated: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
      latest_updated: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
      force_enabled: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
      force_disabled: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    }
    return colors[type] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">App Version Management</h1>
        <p className="text-muted-foreground mt-2">
          Control mobile app updates and force version upgrades
        </p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-700 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-green-800 dark:text-green-300 font-medium">Version updated successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Version Control */}
        <div className="space-y-6">
          {/* Platform Selector */}
          <div className="bg-card rounded-xl shadow-sm border p-6">
            <div className="flex gap-4">
              <button
                onClick={() => setSelectedPlatform('android')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  selectedPlatform === 'android'
                    ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <Smartphone className="w-6 h-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
                <p className="font-semibold text-foreground">Android</p>
                <p className="text-sm text-muted-foreground mt-1">
                  v{Array.isArray(configs) ? configs.find(c => c.platform === 'android')?.latest_version || '1.0.0' : '1.0.0'}
                </p>
              </button>

              <button
                onClick={() => setSelectedPlatform('ios')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  selectedPlatform === 'ios'
                    ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <Smartphone className="w-6 h-6 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                <p className="font-semibold text-foreground">iOS</p>
                <p className="text-sm text-muted-foreground mt-1">
                  v{Array.isArray(configs) ? configs.find(c => c.platform === 'ios')?.latest_version || '1.0.0' : '1.0.0'}
                </p>
              </button>
            </div>
          </div>

          {/* Version Form */}
          <div className="bg-card rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Update {selectedPlatform === 'android' ? 'Android' : 'iOS'} Version
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Latest Version */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Latest Version *
                </label>
                <input
                  type="text"
                  value={formData.latest_version}
                  onChange={(e) => setFormData({ ...formData, latest_version: e.target.value })}
                  placeholder="1.0.0"
                  className="w-full px-4 py-2 border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Version available in the app store
                </p>
              </div>

              {/* Minimum Version */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Minimum Required Version
                </label>
                <input
                  type="text"
                  value={formData.minimum_version}
                  onChange={(e) => setFormData({ ...formData, minimum_version: e.target.value })}
                  placeholder="1.0.0"
                  className="w-full px-4 py-2 border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Users below this version will be forced to update
                </p>
              </div>

              {/* Force Update Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Force Update</p>
                  <p className="text-sm text-muted-foreground">Block app until user updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.force_update}
                    onChange={(e) => setFormData({ ...formData, force_update: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Update Message */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Update Message
                </label>
                <textarea
                  value={formData.update_message}
                  onChange={(e) => setFormData({ ...formData, update_message: e.target.value })}
                  placeholder="A new version is available..."
                  rows={3}
                  className="w-full px-4 py-2 border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Message shown to users in the app
                </p>
              </div>

              {/* Change Note */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Change Note (Internal)
                </label>
                <input
                  type="text"
                  value={formData.change_note}
                  onChange={(e) => setFormData({ ...formData, change_note: e.target.value })}
                  placeholder="e.g., Critical bug fix release"
                  className="w-full px-4 py-2 border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Internal note for tracking (not shown to users)
                </p>
              </div>

              {/* Warning */}
              {formData.force_update && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-700 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-red-800 dark:text-red-300 font-medium">Force Update Enabled</p>
                    <p className="text-red-700 dark:text-red-400 text-sm mt-1">
                      Users below minimum version ({formData.minimum_version}) will be blocked from using the app until they update.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Update Version
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Current Status & History */}
        <div className="space-y-6">
          {/* Current Status */}
          <div className="bg-card rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Current Status</h2>

            {currentConfig ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Platform</span>
                  <span className="font-semibold text-foreground capitalize">{currentConfig.platform}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Latest Version</span>
                  <span className="font-semibold text-foreground">{currentConfig.latest_version}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Minimum Version</span>
                  <span className="font-semibold text-foreground">{currentConfig.minimum_version}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Force Update</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    currentConfig.force_update
                      ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                      : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                  }`}>
                    {currentConfig.force_update ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="text-foreground">
                    {new Date(currentConfig.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No configuration found</p>
            )}
          </div>

          {/* Version History */}
          <div className="bg-card rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <History className="w-5 h-5" />
                Change History
              </h2>
              <button
                onClick={fetchData}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3 max-h-125 overflow-y-auto">
              {Array.isArray(history) && history.length > 0 ? (
                history.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getChangeTypeBadge(entry.change_type)}`}>
                            {getChangeTypeLabel(entry.change_type)}
                          </span>
                          <span className="px-2 py-1 bg-muted text-foreground rounded text-xs font-medium capitalize">
                            {entry.platform}
                          </span>
                        </div>

                        <p className="text-sm text-foreground">
                          <span className="text-muted-foreground">From:</span> <span className="font-mono">{entry.previous_value || 'N/A'}</span>
                          {' → '}
                          <span className="text-muted-foreground">To:</span> <span className="font-mono font-semibold">{entry.new_value}</span>
                        </p>

                        {entry.change_note && (
                          <p className="text-sm text-muted-foreground mt-1 italic">&quot;{entry.change_note}&quot;</p>
                        )}

                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{entry.changed_by || 'System'}</span>
                          <span>•</span>
                          <span>{new Date(entry.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No change history yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
