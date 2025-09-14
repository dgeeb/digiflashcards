import { createRouter, createWebHashHistory } from 'vue-router'
import Accueil from '../views/Accueil.vue'
import Editeur from '../views/Editeur.vue'

const routes = [
	{
		path: '/',
		name: 'Accueil',
		component: Accueil
	},
	{
		path: '/f/:id',
		name: 'Editeur',
		component: Editeur
	}
]

const router = createRouter({
	history: createWebHashHistory(),
	routes
})

export default router
