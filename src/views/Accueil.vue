<template>
	<div id="page">
		<div id="accueil" :style="{'background-image': 'url(./static/img/fond.png)'}">
			<div id="langues">
				<span class="bouton" role="button" tabindex="0" :class="{'selectionne': $parent.$parent.langue === 'fr'}" @click="modifierLangue('fr')">FR</span>
				<span class="bouton" role="button" tabindex="0" :class="{'selectionne': $parent.$parent.langue === 'it'}" @click="modifierLangue('it')">IT</span>
				<span class="bouton" role="button" tabindex="0" :class="{'selectionne': $parent.$parent.langue === 'en'}" @click="modifierLangue('en')">EN</span>
			</div>
			<div id="conteneur">
				<div id="contenu">
					<h1>
						<span>Digiflashcards</span> <span>by La Digitale</span>
					</h1>
					<div>
						<p v-html="$t('slogan')" />
						<span id="bouton" role="button" tabindex="0" @click="ouvrirModale">{{ $t('creerSerie') }}</span>
					</div>
				</div>
				<div id="credits">
					<p><a href="https://opencollective.com/ladigitale" target="_blank" rel="noreferrer">{{ $t('soutien') }}</a></p>
					<p>{{ new Date().getFullYear() }} - <a href="https://ladigitale.dev" target="_blank" rel="noreferrer">La Digitale</a> - <a href="https://codeberg.org/ladigitale/digiflashcards" target="_blank" rel="noreferrer">{{ $t('codeSource') }}</a> - <span class="hub" @click="ouvrirHub"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#001d1d" width="36px" height="36px"><path d="M0 0h24v24H0z" fill="none"/><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg></span></p>
				</div>
			</div>
		</div>
		<div class="conteneur-modale" v-if="modale === 'serie'">
			<div class="modale">
				<header>
					<span class="titre">{{ $t('nouvelleSerie') }}</span>
					<span class="fermer" role="button" tabindex="0" @click="fermerModale"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<label>{{ $t('nomSerie') }}</label>
						<input type="text" :value="nom" @input="nom = $event.target.value">
						<label>{{ $t('questionSecrete') }}</label>
						<select :value="question" @change="question = $event.target.value">
							<option value="" selected>-</option>
							<option v-for="(item, index) in questions" :value="item" :key="'option_' + index">{{ $t(item) }}</option>
						</select>
						<label>{{ $t('reponseSecreteEdition') }}</label>
						<input type="text" :value="reponse" @input="reponse = $event.target.value" @keydown.enter="creer">
						<div class="actions">
							<span class="bouton" role="button" tabindex="0" @click="creer">{{ $t('creer') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div id="hub" :class="{'ouvert': hub}">
			<span @click="fermerHub"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fff" width="36px" height="36px"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></span>
			<iframe src="https://ladigitale.dev/hub.html"></iframe>
		</div>
	</div>
</template>

<script>
export default {
	name: 'Accueil-Digiflashcards',
	data () {
		return {
			modale: '',
			nom: '',
			question: '',
			questions: ['motPrefere', 'filmPrefere', 'chansonPreferee', 'prenomMere', 'prenomPere', 'nomRue', 'nomEmployeur', 'nomAnimal'],
			reponse: '',
			hub: false
		}
	},
	created () {
		const langue = this.$route.query.lang
		if (this.$parent.$parent.langues.includes(langue) === true) {
			this.$parent.$parent.langue = langue
			localStorage.setItem('digiflashcards_lang', langue)
		}
	},
	mounted () {
		const langue = navigator.language.substring(0, 2)
		if (this.$parent.$parent.langues.includes(this.$route.query.lang) === false && this.$parent.$parent.langues.includes(langue) === true) {
			this.$parent.$parent.langue = langue
		}
		if (localStorage.getItem('digiflashcards_lang')) {
			this.$parent.$parent.langue = localStorage.getItem('digiflashcards_lang')
		}
		this.$root.$i18n.locale = this.$parent.$parent.langue
		document.getElementsByTagName('html')[0].setAttribute('lang', this.$parent.$parent.langue)
		setTimeout(function () {
			this.$parent.$parent.chargement = false
		}.bind(this), 300)
	},
	methods: {
		modifierLangue (langue) {
			this.$root.$i18n.locale = langue
			this.$parent.$parent.langue = langue
			document.getElementsByTagName('html')[0].setAttribute('lang', langue)
			this.$parent.$parent.notification = this.$t('langueModifiee')
			localStorage.setItem('digiflashcards_lang', langue)
		},
		ouvrirModale () {
			this.modale = 'serie'
			this.$nextTick(function () {
				document.querySelector('.modale input').focus()
			})
		},
		fermerModale () {
			this.modale = ''
			this.nom = ''
			this.question = ''
			this.reponse = ''
		},
		creer () {
			if (this.nom !== '' && this.question !== '' && this.reponse !== '') {
				this.$parent.$parent.chargement = true
				const xhr = new XMLHttpRequest()
				xhr.onload = function () {
					if (xhr.readyState === xhr.DONE && xhr.status === 200) {
						this.$parent.$parent.chargement = false
						this.fermerModale()
						if (xhr.responseText !== 'erreur') {
							this.$router.push('/f/' + xhr.responseText)
						} else {
							this.$parent.$parent.message = this.$t('erreurServeur')
						}
					} else {
						this.$parent.$parent.chargement = false
						this.fermerModale()
						this.$parent.$parent.message = this.$t('erreurServeur')
					}
				}.bind(this)
				xhr.open('POST', this.$parent.$parent.hote + 'inc/creer_serie.php', true)
				xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
				xhr.send('nom=' + this.nom + '&question=' + this.question + '&reponse=' + this.reponse)
			} else if (this.nom === '') {
				this.$parent.$parent.message = this.$t('remplirTitre')
			} else if (this.question === '') {
				this.$parent.$parent.message = this.$t('selectionnerQuestionSecrete')
			} else if (this.reponse === '') {
				this.$parent.$parent.message = this.$t('remplirReponseSecrete')
			}
		},
		ouvrirHub () {
			this.hub = true
		},
		fermerHub () {
			this.hub = false
		}
	}
}
</script>

<style scoped>
#page,
#accueil {
	width: 100%;
	height: 100vh;
}

#accueil {
	background-size: cover;
	background-position: center;
	background-repeat: no-repeat;
}

#langues {
	position: fixed;
	display: flex;
	top: 10px;
	right: 5px;
	z-index: 10;
}

#langues span {
    display: flex;
    justify-content: center;
	align-items: center;
	font-size: 14px;
    width: 30px;
	height: 30px;
	background: #fff;
    border-radius: 50%;
    border: 1px solid #ddd;
    margin-right: 10px;
	cursor: pointer;
	user-select: none;
}

#langues span.selectionne {
    background: #242f3d;
    color: #fff;
    border: 1px solid #222;
    cursor: default;
}

#conteneur {
	position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
	flex-wrap: wrap;
	overflow: auto;
}

#contenu {
	max-width: 76em;
	text-align: center;
	padding: 12em 1em 6em;
	margin: auto;
}

#conteneur h1 {
    font-family: 'HKGroteskWide-ExtraBold', 'HKGrotesk-ExtraBold', sans-serif;
    font-size: 3em;
	font-weight: 900;
    margin-bottom: 0.85em;
    line-height: 1.4;
}

#conteneur p {
    font-size: 1.25em;
    line-height: 1.4;
    margin-bottom: 1.5em;
}

#credits {
	width: 100%;
	margin: 0 auto 0.75em;
}

#credits p {
    font-size: 1em;
    line-height: 1.2;
    margin-bottom: 1em;
	text-align: center;
}

#credits p:last-child {
	display: flex;
	justify-content: center;
	align-items: center;
}

#credits p:last-child a {
	margin: 0 5px;
}

#credits .hub {
	font-size: 0;
	cursor: pointer;
}

#hub {
	position: fixed;
	visibility: hidden;
	opacity: 0;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
	z-index: -1;
}

#hub.ouvert {
	visibility: visible;
	opacity: 1;
    animation: fonduEntrant linear 0.1s;
	z-index: 100000;
}

@keyframes fonduEntrant {
    from { opacity: 0; }
    to   { opacity: 1; }
}

#hub iframe {
	width: 100%;
    height: 100%;
}

#hub span {
	font-size: 0;
	color: #fff;
	position: absolute;
	top: 15px;
	right: 15px;
	cursor: pointer;
}

@media screen and (max-width: 359px) {
	#contenu {
		padding: 4em 1em 2em;
	}

	#bouton {
		font-size: 0.75em!important;
	}
}

@media screen and (min-width: 360px) and (max-width: 599px) {
	#contenu {
		padding: 5em 1em 2.5em;
	}
}

@media screen and (max-width: 399px) {
	#conteneur h1 span {
		display: block;
	}
}

@media screen and (max-width: 599px) {
	#conteneur h1 {
		font-size: 2em;
		margin-bottom: 1em;
	}

	#conteneur p {
		font-size: 1em;
		margin-bottom: 1.2em;
	}
	
	#bouton {
		font-size: 0.85em;
	}
	
	#credits p {
		font-size: 0.85em;
	}

	#hub span {
		top: 5px;
		right: 5px;
	}
	
	#hub span svg {
		width: 24px;
		height: 24px;
	}
}

@media screen and (max-width: 599px) and (orientation: landscape) {
	#contenu {
		padding: 2em 1em 1.5em!important;
	}
}

@media screen and (min-width: 600px) and (max-width: 820px) and (orientation: landscape) {
	#contenu {
		padding: 3em 1em 1.5em!important;
	}
}

@media screen and (max-width: 820px) and (orientation: landscape) {
	#conteneur p {
		font-size: 1em!important;
	}
	
	#credits p {
		font-size: 0.85em!important;
		margin-bottom: 0.85em!important;
	}
}

@media screen and (max-width: 1023px) and (orientation: landscape) {
	#contenu {
		padding: 7em 1em 3.5em;
	}
}

@media screen and (max-width: 767px) {
	#langues {
		top: 9px;
		right: 4px;
	}

	#langues span {
		font-size: 12px;
		width: 27px;
		height: 27px;
		margin-right: 9px;
	}
}

@media screen and (max-width: 850px) and (max-height: 500px) {
	#conteneur h1 {
		font-size: 2em;
		margin-bottom: 1em;
	}

	#conteneur p {
		font-size: 1em;
		margin-bottom: 1.2em;
	}
	
	#bouton {
		font-size: 0.85em!important;
	}
	
	#credits p {
		font-size: 0.85em;
	}
}
</style>
