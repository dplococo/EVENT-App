import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.eventmanager.app',
  appName: 'EventManager Mobile',
  webDir: 'dist',
  android: {
    allowMixedContent: true
  }
}

export default config
