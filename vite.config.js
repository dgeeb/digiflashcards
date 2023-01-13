import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'path'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
	base: './',
  	plugins: [
		vue(),
		viteStaticCopy({
			targets: [
				{
					src: path.resolve(__dirname, 'README.md'),
					dest: './',
				},
				{
					src: path.resolve(__dirname, 'LICENSE'),
					dest: './',
				},
				{
					src: path.resolve(__dirname, 'inc') + '/!(*.db||api.php)',
					dest: './inc',
				},
				{
					src: path.resolve(__dirname, 'fichiers'),
					dest: './',
				}
			]
		})
	],
 	resolve: {
    	alias: {
      		'@': fileURLToPath(new URL('./src', import.meta.url))
   		}
  	},
	server: {
		port: 8080,
		proxy: {
			'^/inc': {
				target: 'http://127.0.0.1:8000',
				changeOrigin: true
			}
		}
	},
	build: {
		assetsDir: 'static/assets'
	}
})
