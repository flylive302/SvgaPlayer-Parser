// stores/app.ts
// Main Pinia store — client-side state for conversion results and UI
import { defineStore } from 'pinia'

export interface ConversionResult {
  name: string
  type: 'video' | 'svga'
  sourceFilename: string
  downloadUrl?: string      // blob URL for download
  thumbnailUrl?: string     // blob URL for thumbnail  
  previewUrl?: string       // blob URL for preview
  formats: Record<string, boolean>
  cdnUrls: string[]
  historyId?: number        // SQLite row id after logging
}

export const useAppStore = defineStore('app', {
  state: () => ({
    // Current conversion results (in-memory, cleared on page refresh)
    conversionResults: [] as ConversionResult[],

    // Cached settings status (synced from server)
    settingsStatus: {
      r2: false,
      imagekit: false,
      github: false,
    } as Record<string, boolean>,

    // User preferences (persisted to localStorage)
    preferences: {
      defaultAlphaSide: 'right' as 'left' | 'right',
      defaultCdn: 'r2' as string,
      defaultCdnPath: '/',
    },
  }),

  actions: {
    addResult(result: ConversionResult) {
      this.conversionResults.unshift(result)
    },

    removeResult(name: string) {
      this.conversionResults = this.conversionResults.filter(r => r.name !== name)
    },

    clearResults() {
      // Revoke all blob URLs to free memory
      for (const r of this.conversionResults) {
        if (r.downloadUrl) URL.revokeObjectURL(r.downloadUrl)
        if (r.thumbnailUrl) URL.revokeObjectURL(r.thumbnailUrl)
        if (r.previewUrl) URL.revokeObjectURL(r.previewUrl)
      }
      this.conversionResults = []
    },

    updateSettingsStatus(provider: string, connected: boolean) {
      this.settingsStatus[provider] = connected
    },
  },

  persist: {
    pick: ['preferences'],
  },
})
