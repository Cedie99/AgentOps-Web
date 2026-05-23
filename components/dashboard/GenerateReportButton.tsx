'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'

interface Survey {
  id: number
  store_name: string
  owner_name: string | null
  contact_number: string
  contact_person: string | null
  current_supplier: string | null
  customer_status: string
  address: string
  city: string
  province: string
  landmark: string | null
  remarks: string | null
  is_platinum_client: boolean
  surveyor_name: string
  captured_at: string
  assigned_to_name: string | null
}

export default function GenerateReportButton() {
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/surveys')
      if (!res.ok) throw new Error('Failed to fetch surveys')
      const { surveys }: { surveys: Survey[] } = await res.json()

      const now = new Date()
      const dateStr = format(now, 'yyyy-MM-dd')
      const generatedAt = format(now, 'PPPp')

      // --- Summary counts ---
      const total = surveys.length
      const byStatus: Record<string, number> = { PROSPECT: 0, NEW: 0, EXISTING: 0 }
      const byProvince: Record<string, number> = {}
      let platinumCount = 0

      for (const s of surveys) {
        byStatus[s.customer_status] = (byStatus[s.customer_status] ?? 0) + 1
        byProvince[s.province] = (byProvince[s.province] ?? 0) + 1
        if (s.is_platinum_client) platinumCount++
      }

      const topProvinces = Object.entries(byProvince)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)

      // --- Build rows ---
      const rows: string[][] = []

      rows.push(['SURVEYS CONDUCTED REPORT'])
      rows.push(['Generated', generatedAt])
      rows.push([])

      // Summary
      rows.push(['SUMMARY'])
      rows.push(['Total Surveys', String(total)])
      rows.push(['Prospect', String(byStatus.PROSPECT ?? 0)])
      rows.push(['New Customer', String(byStatus.NEW ?? 0)])
      rows.push(['Existing Customer', String(byStatus.EXISTING ?? 0)])
      rows.push(['Platinum Clients', String(platinumCount)])
      rows.push([])

      rows.push(['TOP PROVINCES'])
      rows.push(['Province', 'Count'])
      topProvinces.forEach(([province, count]) => {
        rows.push([province, String(count)])
      })
      rows.push([])

      // Survey detail list
      rows.push(['SURVEY DETAILS'])
      rows.push([
        '#',
        'Store Name',
        'Owner',
        'Contact Person',
        'Contact Number',
        'Address',
        'City',
        'Province',
        'Landmark',
        'Status',
        'Platinum',
        'Current Supplier',
        'Surveyor',
        'Assigned To',
        'Date Captured',
        'Remarks',
      ])

      surveys.forEach((s, i) => {
        rows.push([
          String(i + 1),
          s.store_name,
          s.owner_name ?? '',
          s.contact_person ?? '',
          s.contact_number,
          s.address,
          s.city,
          s.province,
          s.landmark ?? '',
          s.customer_status,
          s.is_platinum_client ? 'Yes' : 'No',
          s.current_supplier ?? '',
          s.surveyor_name,
          s.assigned_to_name ?? 'Unassigned',
          format(new Date(s.captured_at), 'yyyy-MM-dd HH:mm'),
          s.remarks ?? '',
        ])
      })

      // --- Build and download CSV ---
      const csv = rows
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `surveys_report_${dateStr}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Report generation failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleGenerate}
      disabled={loading}
      className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 text-white font-medium"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4 mr-2" />
      )}
      {loading ? 'Generating...' : 'Generate Report'}
    </Button>
  )
}
