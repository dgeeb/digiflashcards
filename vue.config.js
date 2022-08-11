const { defineConfig } = require('@vue/cli-service')
const path = require('path')

module.exports = defineConfig({
	publicPath: './',
	outputDir: 'dist',
	assetsDir: 'static',
	productionSourceMap: false,
	transpileDependencies: true,
	devServer: {
		proxy: {
			'^/inc': {
				target: 'http://127.0.0.1:8000',
				changeOrigin: true
			}
		},
		headers: {
			"Cross-Origin-Opener-Policy": "same-origin",
			"Cross-Origin-Embedder-Policy": "require-corp"
		}
	},
	chainWebpack: config => {
		config.plugin('copy').tap(args => {
			args[0].patterns = [{
				from: path.resolve(__dirname, 'public/static'),
				to: path.resolve(__dirname, 'dist/static'),
				toType: 'dir'
			},
			{
				from: path.resolve(__dirname, 'inc'),
				to: path.resolve(__dirname, 'dist/inc'),
				toType: 'dir',
				globOptions: {
					ignore: ['*.db']
				}
			},
			{
				from: path.resolve(__dirname, 'fichiers'),
				to: path.resolve(__dirname, 'dist/fichiers'),
				toType: 'dir'
			},
			{
				from: path.resolve(__dirname, '.htaccess'),
				to: path.resolve(__dirname, 'dist'),
				toType: 'dir'
			},
			{
				from: path.resolve(__dirname, 'README.md'),
				to: path.resolve(__dirname, 'dist'),
				toType: 'dir'
			},
			{
				from: path.resolve(__dirname, 'LICENSE'),
				to: path.resolve(__dirname, 'dist'),
				toType: 'dir'
			}]
			return args
		})
	}
})
