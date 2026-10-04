import { createApp } from 'vue'
import { applyDocumentMeta } from './config/appConfig'
import { hydrateAuth } from './composables/useAuth'
import { bootstrapLocation } from './composables/useCurrentLocation'
import { bootstrapIssues } from './composables/useIssues'
import { hydrateLocale } from './composables/useLocale'
import { router } from './router'
import '@fontsource-variable/source-sans-3'
import './style.css'
import App from './App.vue'

applyDocumentMeta()

void bootstrapLocation()

await Promise.all([hydrateLocale(), hydrateAuth(), bootstrapIssues()])

createApp(App).use(router).mount('#app')
