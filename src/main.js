import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createI18n } from 'vue-i18n'
import messages from '@/lang'

const i18n = createI18n({
	locale: 'fr',
	fallbackLocale: 'fr',
	messages
})

createApp(App).use(router).use(i18n).mount('#app')
