import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch all app versions
export async function GET() {
  try {
    const configs = await prisma.appConfig.findMany({
      where: { is_active: true },
      orderBy: { platform: 'asc' },
    })

    return NextResponse.json(configs)
  } catch (error) {
    console.error('Error fetching app versions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch app versions' },
      { status: 500 }
    )
  }
}

// POST - Update app version configuration
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      platform,
      minimum_version,
      latest_version,
      force_update,
      update_message,
      store_url,
      changed_by,
      change_note,
    } = body

    // Validate required fields
    if (!platform || !latest_version) {
      return NextResponse.json(
        { error: 'Platform and latest_version are required' },
        { status: 400 }
      )
    }

    // Get current config for history tracking
    const currentConfig = await prisma.appConfig.findUnique({
      where: { platform },
    })

    // Update the config
    const updatedConfig = await prisma.appConfig.update({
      where: { platform },
      data: {
        minimum_version: minimum_version || currentConfig?.minimum_version,
        latest_version,
        force_update: force_update ?? currentConfig?.force_update ?? false,
        update_message: update_message || currentConfig?.update_message,
        store_url: store_url || currentConfig?.store_url,
      },
    })

    // Track changes in history
    const historyEntries = []

    if (currentConfig) {
      // Track minimum version change
      if (minimum_version && minimum_version !== currentConfig.minimum_version) {
        historyEntries.push({
          platform,
          version_number: minimum_version,
          change_type: 'minimum_updated',
          previous_value: currentConfig.minimum_version,
          new_value: minimum_version,
          changed_by,
          change_note,
        })
      }

      // Track latest version change
      if (latest_version !== currentConfig.latest_version) {
        historyEntries.push({
          platform,
          version_number: latest_version,
          change_type: 'latest_updated',
          previous_value: currentConfig.latest_version,
          new_value: latest_version,
          changed_by,
          change_note,
        })
      }

      // Track force update toggle
      if (force_update !== undefined && force_update !== currentConfig.force_update) {
        historyEntries.push({
          platform,
          version_number: latest_version,
          change_type: force_update ? 'force_enabled' : 'force_disabled',
          previous_value: currentConfig.force_update.toString(),
          new_value: force_update.toString(),
          changed_by,
          change_note,
        })
      }
    }

    // Create history entries
    if (historyEntries.length > 0) {
      await prisma.appVersionHistory.createMany({
        data: historyEntries,
      })
    }

    return NextResponse.json({
      success: true,
      config: updatedConfig,
      changes: historyEntries.length,
    })
  } catch (error) {
    console.error('Error updating app version:', error)
    return NextResponse.json(
      { error: 'Failed to update app version' },
      { status: 500 }
    )
  }
}
