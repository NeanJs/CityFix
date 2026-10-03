import { createApp } from 'vue'
import { applyDocumentMeta } from './config/appConfig'
import { bootstrapIssues } from './composables/useIssues'
import { router } from './router'
import './style.css'
import App from './App.vue'

applyDocumentMeta()

await bootstrapIssues()

createApp(App).use(router).mount('#app')
