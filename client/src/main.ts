import { createApp } from 'vue'
import { applyDocumentMeta } from './config/appConfig'
import { hydrateAuth } from './composables/useAuth'
import { bootstrapIssues } from './composables/useIssues'
import { hydrateLocale } from './composables/useLocale'
import { router } from './router'
import './style.css'
import App from './App.vue'

applyDocumentMeta()

await Promise.all([hydrateLocale(), hydrateAuth(), bootstrapIssues()])

createApp(App).use(router).mount('#app')
