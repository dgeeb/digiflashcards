<template>
	<div id="page" :class="{'plein-ecran': pleinEcran}">
		<div id="serie">
			<header id="header" v-if="vue === 'editeur' || (vue === 'apprenant' && !integration && !impressionPDF)">
				<div id="conteneur-header">
					<a id="conteneur-logo" :href="definirRacine()" :title="$t('accueil')">
						<span id="logo"></span>
					</a>
					<span id="titre">{{ nom }}</span>
					<span id="conteneur-partage" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('partager')" @click="afficherMenuPartager" @keydown.enter="afficherMenuPartager">
						<i class="material-icons">share</i>
					</span>
					<span id="conteneur-parametres" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('parametres')" @click="ouvrirModaleSerie" @keydown.enter="ouvrirModaleSerie" v-if="admin">
						<i class="material-icons">settings</i>
					</span>
					<span id="conteneur-parametres" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('seConnecter')" @click="ouvrirModaleConnexion" @keydown.enter="ouvrirModaleConnexion" v-else>
						<i class="material-icons">lock_open</i>
					</span>
				</div>
			</header>

			<div id="onglets" v-if="vue === 'apprenant' && cartes.length > 4 && options.exercices && (exercicesQuiz.length > 4 || exercicesEcrire.length > 4) && !impressionPDF">
				<span class="onglet" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :class="{'selectionne': onglet === 'cartes'}" :title="$t('afficherCartes')" @click="definirOnglet('cartes')" @keydown.enter="definirOnglet('cartes')"><i class="material-icons">style</i></span>
				<span class="onglet" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :class="{'selectionne': onglet === 'quiz'}" :title="$t('afficherQuiz')" @click="definirOnglet('quiz')" @keydown.enter="definirOnglet('quiz')" v-if="exercicesQuiz.length > 4"><i class="material-icons">help_center</i></span>
				<span class="onglet" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :class="{'selectionne': onglet === 'ecrire'}" :title="$t('afficherEcrire')" @click="definirOnglet('ecrire')" @keydown.enter="definirOnglet('ecrire')" v-if="exercicesEcrire.length > 4"><i class="material-icons">edit</i></span>
				<span class="onglet" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :class="{'selectionne': onglet === 'appariement'}" :title="$t('afficherAppariement')" @click="definirOnglet('appariement')" @keydown.enter="definirOnglet('appariement')" v-if="exercicesAppariement.hasOwnProperty('gauche') && exercicesAppariement.gauche.length > 4"><i class="material-icons">view_comfy_alt</i></span>
			</div>

			<div id="conteneur">
				<div id="actions" v-if="vue === 'editeur'">
					<div id="importer-csv">
						<span class="bouton" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @click="ouvrirModaleImporterCSV" @keydown.enter="ouvrirModaleImporterCSV"><i class="material-icons">upload_file</i><span>{{ $t('importerCSV') }}</span></span>
						<a href="./static/digiflashcards_template.csv" target="_blank">{{ $t('telechargerModele') }}</a>
					</div>
					<a :href="definirRacine() + '#/f/' + id + '?vue=apprenant'" target="_blank"><i class="material-icons">preview</i><span>{{ $t('apercuApprenant') }}</span></a>
				</div>

				<div id="options" v-if="vue === 'editeur' && cartes.length > 4">
					<div class="option">
						<h3 v-html="$t('optionExercices')" />
						<label class="bouton-radio" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @keydown.enter="activerInput('option-exercices-oui')">{{ $t('oui') }}
							<input id="option-exercices-oui" type="radio" name="exercices" :checked="options.exercices === true" @change="modifierOptions('exercices', true)">
							<span class="coche" />
						</label>
						<label class="bouton-radio" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @keydown.enter="activerInput('option-exercices-non')">{{ $t('non') }}
							<input id="option-exercices-non" type="radio" name="exercices" :checked="options.exercices === false" @change="modifierOptions('exercices', false)">
							<span class="coche" />
						</label>
					</div>
					<div class="option" v-if="options.exercices === true">
						<h3 v-html="$t('reponsesQuiz')" />
						<label class="bouton-radio" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @keydown.enter="activerInput('option-quiz-terme')">{{ $t('terme') }}
							<input id="option-quiz-terme" type="radio" name="quiz" :checked="options.quiz === 'terme'" @change="modifierOptions('quiz', 'terme')">
							<span class="coche" />
						</label>
						<label class="bouton-radio" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @keydown.enter="activerInput('option-quiz-definition')">{{ $t('definition') }}
							<input id="option-quiz-definition" type="radio" name="quiz" :checked="options.quiz === 'definition'" @change="modifierOptions('quiz', 'definition')">
							<span class="coche" />
						</label>
					</div>
					<div class="option" v-if="options.exercices === true">
						<h3 v-html="$t('reponseEcrire')" />
						<label class="bouton-radio" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @keydown.enter="activerInput('option-ecrire-terme')">{{ $t('terme') }}
							<input id="option-ecrire-terme" type="radio" name="ecrire" :checked="options.ecrire === 'terme'" @change="modifierOptions('ecrire', 'terme')">
							<span class="coche" />
						</label>
						<label class="bouton-radio" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @keydown.enter="activerInput('option-ecrire-definition')">{{ $t('definition') }}
							<input id="option-ecrire-definition" type="radio" name="ecrire" :checked="options.ecrire === 'definition'" @change="modifierOptions('ecrire', 'definition')">
							<span class="coche" />
						</label>
					</div>
					<div class="option" v-if="options.exercices === true">
						<h3 v-html="$t('optionCasse')" />
						<label class="bouton-radio" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @keydown.enter="activerInput('option-casse-oui')">{{ $t('oui') }}
							<input id="option-casse-oui" type="radio" name="casse" :checked="options.casse === true" @change="modifierOptions('casse', true)">
							<span class="coche" />
						</label>
						<label class="bouton-radio" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @keydown.enter="activerInput('option-casse-non')">{{ $t('non') }}
							<input id="option-casse-non" type="radio" name="casse" :checked="options.casse === false" @change="modifierOptions('casse', false)">
							<span class="coche" />
						</label>
					</div>
					<div class="option" v-if="options.exercices === true">
						<h3 v-html="$t('reponsesAppariement')" />
						<label class="bouton-radio" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @keydown.enter="activerInput('option-appariement-terme')">{{ $t('terme') }}
							<input id="option-appariement-terme" type="radio" name="appariement" :checked="options.appariement === 'terme'" @change="modifierOptions('appariement', 'terme')">
							<span class="coche" />
						</label>
						<label class="bouton-radio" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @keydown.enter="activerInput('option-appariement-definition')">{{ $t('definition') }}
							<input id="option-appariement-definition" type="radio" name="appariement" :checked="options.appariement === 'definition'" @change="modifierOptions('appariement', 'definition')">
							<span class="coche" />
						</label>
					</div>
				</div>

				<draggable id="cartes" class="admin" v-model="cartes" :animation="250" :sort="true" :swap-threshold="0.5" handle=".statique" filter=".supprimer,.masquer" :preventOnFilter="true" draggable=".carte" v-if="cartes.length > 0 && vue === 'editeur'" @end="modifierPositionCarte">
					<article :id="'carte' + index" class="carte" :class="{'masque': item.hasOwnProperty('masque') && item.masque === true}" v-for="(item, index) in cartes" :key="'carte_' + index">
						<div class="actions statique">
							<div class="gauche">
								{{ index + 1 }}
							</div>
							<div class="droite">
								<span><i class="material-icons">drag_handle</i></span>
								<span class="masquer" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @click="masquerCarte(index)" @keydown.enter="masquerCarte(index)" :title="$t('masquer')" v-if="!item.hasOwnProperty('masque') || item.hasOwnProperty('masque') && item.masque === false"><i class="material-icons">visibility</i></span>
								<span class="masquer" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @click="afficherCarte(index)" @keydown.enter="afficherCarte(index)" :title="$t('afficher')" v-else><i class="material-icons">visibility_off</i></span>
								<span class="supprimer" :class="{'desactive': cartes.length < 3}" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @click="afficherSupprimerCarte(index)" @keydown.enter="afficherSupprimerCarte(index)" :title="$t('supprimer')"><i class="material-icons">delete</i></span>
							</div>
						</div>

						<div class="conteneur recto">
							<span class="label">{{ $t('terme') }}</span>
							<span class="texte"><textarea :class="{'avec-image': item.recto.image !== ''}" :value="item.recto.texte" @input="enregistrerTexte($event, index, 'recto')" /></span>

							<span class="conteneur-chargement" v-if="chargement === 'image_recto_' + index">
								<span class="chargement" />
								<span class="progression" v-if="progression > 0">{{ progression }} %</span>
							</span>
							<template v-else-if="chargement !== 'image_recto_' + index && item.recto.image === ''">
								<label :for="'televerser_image_recto_' + index" class="image" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('ajouterImage')" @keydown.enter="activerInput('televerser_image_recto_' + index)"><i class="material-icons">add_photo_alternate</i></label>
								<input :id="'televerser_image_recto_' + index" type="file" accept=".jpg, .jpeg, .png, .gif" @change="televerserImage($event.target.files[0], index, 'recto')" style="display: none;">
							</template>
							<span class="image" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('afficherImage')" @click="afficherImage(index, 'recto', definirLienMedia(item.recto.image, ''))" @keydown.enter="afficherImage(index, 'recto', definirLienMedia(item.recto.image, ''))" v-else-if="chargement !== 'image_recto_' + index && item.recto.image !== ''" :style="{'background-image': 'url(' + definirLienMedia(item.recto.image, 'vignette_') + ')'}" />

							<span class="conteneur-chargement" v-if="chargement === 'audio_recto_' + index">
								<span class="chargement" />
								<span class="progression" v-if="progression > 0">{{ progression }} %</span>
							</span>
							<span class="audio" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('ajouterAudio')" @click="afficherAudio(index, 'recto', '')" @keydown.enter="afficherAudio(index, 'recto', '')" v-else-if="chargement !== 'audio_recto_' + index && item.recto.audio === ''"><i class="material-icons">audiotrack</i></span>
							<span class="audio televerse" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('afficherAudio')" @click="afficherAudio(index, 'recto', definirLienMedia(item.recto.audio, ''))" @keydown.enter="afficherAudio(index, 'recto', definirLienMedia(item.recto.audio, ''))" v-else-if="chargement !== 'audio_recto_' + index && item.recto.audio !== ''"><i class="material-icons">graphic_eq</i></span>
						</div>

						<div class="conteneur verso">
							<span class="label">{{ $t('definition') }}</span>
							<span class="texte"><textarea :class="{'avec-image': item.verso.image !== ''}" :value="item.verso.texte" @input="enregistrerTexte($event, index, 'verso')" /></span>

							<span class="conteneur-chargement" v-if="chargement === 'image_verso_' + index">
								<span class="chargement" />
								<span class="progression" v-if="progression > 0">{{ progression }} %</span>
							</span>
							<template v-else-if="chargement !== 'image_verso_' + index && item.verso.image === ''">
								<label :for="'televerser_image_verso_' + index" class="image" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('ajouterImage')" @keydown.enter="activerInput('televerser_image_verso_' + index)"><i class="material-icons">add_photo_alternate</i></label>
								<input :id="'televerser_image_verso_' + index" type="file" accept=".jpg, .jpeg, .png, .gif" @change="televerserImage($event.target.files[0], index, 'verso')" style="display: none;">
							</template>
							<span class="image" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('afficherImage')" @click="afficherImage(index, 'verso', definirLienMedia(item.verso.image, ''))" @keydown.enter="afficherImage(index, 'verso', definirLienMedia(item.verso.image, ''))" v-else-if="chargement !== 'image_verso_' + index && item.verso.image !== ''" :style="{'background-image': 'url(' + definirLienMedia(item.verso.image, 'vignette_') + ')'}" />

							<span class="conteneur-chargement audio" v-if="chargement === 'audio_verso_' + index">
								<span class="chargement" />
								<span class="progression" v-if="progression > 0">{{ progression }} %</span>
							</span>
							<span class="audio" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('ajouterAudio')" @click="afficherAudio(index, 'verso', '')" @keydown.enter="afficherAudio(index, 'verso', '')" v-else-if="chargement !== 'audio_verso_' + index && item.verso.audio === ''"><i class="material-icons">audiotrack</i></span>
							<span class="audio televerse" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('afficherAudio')" @click="afficherAudio(index, 'verso', definirLienMedia(item.verso.audio, ''))" @keydown.enter="afficherAudio(index, 'verso', definirLienMedia(item.verso.audio, ''))" v-else-if="chargement !== 'audio_verso_' + index && item.verso.audio !== ''"><i class="material-icons">graphic_eq</i></span>
						</div>
					</article>
				</draggable>

				<div id="cartes" class="apprenant" v-else-if="cartes.length > 0 && vue === 'apprenant' && onglet === 'cartes'">
					<article :id="'carte_' + index" class="carte" :class="{'flip': recto === false}" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @click="recto = !recto" @keydown.enter="recto = !recto" v-show="navigationCartes === index" v-for="(item, index) in cartes" :key="'carte_' + index">
						<div class="recto" v-show="!transition">
							<div class="conteneur-media" :class="{'avec-texte': item.recto.texte !== ''}" v-if="item.recto.image !== '' || item.recto.audio !== ''">
								<div class="conteneur-image" :class="{'avec-audio': item.recto.audio !== ''}" v-if="item.recto.image !== ''">
									<span class="image" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @click="afficherZoomImage($event, definirLienMedia(item.recto.image, ''))" @keydown.enter="afficherZoomImage($event, definirLienMedia(item.recto.image, ''))" v-if="item.recto.texte !== ''"><img :src="definirLienMedia(item.recto.image, '')" :alt="item.recto.image"></span>
									<span class="image" v-else><img :src="definirLienMedia(item.recto.image, '')" :alt="item.recto.image"></span>
								</div>
								<div class="conteneur-audio" :class="{'avec-image': item.recto.image !== ''}" v-if="item.recto.audio !== ''">
									<span class="audio" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :class="{'lecture': lecture}" @click="lireAudio($event, definirLienMedia(item.recto.audio, ''))" @keydown.enter="lireAudio($event, definirLienMedia(item.recto.audio, ''))"><i class="material-icons">volume_up</i></span>
								</div>
							</div>
							<div class="conteneur-texte" v-if="item.recto.texte !== '' && !item.recto.texte.includes('|')">
								<span class="texte" v-html="definirHTML(item.recto.texte)" />
							</div>
							<div class="conteneur-texte" v-else-if="item.recto.texte !== '' && item.recto.texte.includes('|')">
								<span class="texte multi" v-html="definirItemTexte(item.recto.texte)" />
							</div>
						</div>

						<div class="verso" v-show="!transition">
							<div class="conteneur-media" :class="{'avec-texte': item.verso.texte !== ''}" v-if="item.verso.image !== '' || item.verso.audio !== ''">
								<div class="conteneur-image" :class="{'avec-audio': item.verso.audio !== ''}" v-if="item.verso.image !== ''">
									<span class="image" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @click="afficherZoomImage($event, definirLienMedia(item.verso.image, ''))" @keydown.enter="afficherZoomImage($event, definirLienMedia(item.verso.image, ''))" v-if="item.verso.texte !== ''"><img :src="definirLienMedia(item.verso.image, '')" :alt="item.verso.image"></span>
									<span class="image" v-else><img :src="definirLienMedia(item.verso.image, '')" :alt="item.verso.image"></span>
								</div>
								<div class="conteneur-audio" :class="{'avec-image': item.verso.image !== ''}" v-if="item.verso.audio !== ''">
									<span class="audio" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @click="lireAudio($event, definirLienMedia(item.verso.audio, ''))" @keydown.enter="lireAudio($event, definirLienMedia(item.verso.audio, ''))" :class="{'lecture': lecture}"><i class="material-icons">volume_up</i></span>
								</div>
							</div>
							<div class="conteneur-texte" v-if="item.verso.texte !== ''  && !item.verso.texte.includes('|')">
								<span class="texte" v-html="definirHTML(item.verso.texte)" />
							</div>
							<div class="conteneur-texte" v-else-if="item.verso.texte !== '' && item.verso.texte.includes('|')">
								<span class="texte multi" v-html="definirItemTexte(item.verso.texte)" />
							</div>
						</div>
					</article>

                                        <div class="navigation" v-if="!impressionPDF">
                                                <span class="precedent" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('afficherCartePrecedente')" @click="afficherCartePrecedente" @keydown.enter="afficherCartePrecedente"><i class="material-icons">arrow_back</i></span>
                                                <span class="actions">
                                                        <span class="total">{{ navigationCartes + 1 }} / {{ cartes.length }}</span>
							<span class="memorise" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('marquerMemorisee')" @click="modifierCartesMemorisees(cartes[navigationCartes].id)" @keydown.enter="modifierCartesMemorisees(cartes[navigationCartes].id)" v-if="cartes[navigationCartes].hasOwnProperty('id') && !cartesMemorisees.includes(cartes[navigationCartes].id)"><i class="material-icons">check_circle</i></span>
							<span class="memorise actif" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('supprimerMemorisee')" @click="modifierCartesMemorisees(cartes[navigationCartes].id)" @keydown.enter="modifierCartesMemorisees(cartes[navigationCartes].id)" v-else-if="cartes[navigationCartes].hasOwnProperty('id') && cartesMemorisees.includes(cartes[navigationCartes].id)"><i class="material-icons">check_circle</i></span>
							<span class="aleatoire" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('melangerCartes')" @click="melangerCartes" @keydown.enter="melangerCartes"><i class="material-icons">shuffle</i></span>
							<span class="aleatoire" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('inverserCartes')" @click="inverserCartes" @keydown.enter="inverserCartes"><i class="material-icons">flip</i></span>
							<span class="ecran" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('mettrePleinEcran')" @click="gererPleinEcran" @keydown.enter="gererPleinEcran" v-if="!pleinEcran"><i class="material-icons">fullscreen</i></span>
							<span class="ecran" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('sortirPleinEcran')" @click="gererPleinEcran" @keydown.enter="gererPleinEcran" v-else><i class="material-icons">close_fullscreen</i></span>
						</span>
                                                <span class="suivant" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('afficherCarteSuivante')" @click="afficherCarteSuivante" @keydown.enter="afficherCarteSuivante"><i class="material-icons">arrow_forward</i></span>
                                        </div>
                                        <div class="raccourcis-clavier" v-if="!impressionPDF">
                                                <span class="titre">{{ $t('raccourcisClavierTitre') }}</span>
                                                <ul>
                                                        <li>{{ $t('raccourciCartePrecedente') }}</li>
                                                        <li>{{ $t('raccourciCarteSuivante') }}</li>
                                                        <li>{{ $t('raccourciRetournerCarte') }}</li>
                                                        <li>{{ $t('raccourciJouerAudio') }}</li>
                                                </ul>
                                        </div>
                                </div>

                                <div id="exercices" v-else-if="exercicesQuiz.length > 0 && vue === 'apprenant' && onglet === 'quiz'">
					<article class="exercice quiz" v-show="navigationQuiz === indexQuiz" v-for="(itemQuiz, indexQuiz) in exercicesQuiz" :key="'exercice_quiz_' + indexQuiz">
						<template v-for="(itemQuestion, indexQuestion) in itemQuiz">
							<div class="question" v-if="options.quiz === 'definition' && itemQuestion.correct === true" :key="'question_quiz_definition_' + indexQuiz + '_' + indexQuestion">
								<span class="texte consigne">{{ $t('consigneQuiz') }}</span>
								<span class="image" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :class="{'avec-texte': itemQuestion.recto.texte !== '', 'avec-audio': itemQuestion.recto.audio !== ''}" @click="afficherZoomImage($event, definirLienMedia(itemQuestion.recto.image, ''))" @keydown.enter="afficherZoomImage($event, definirLienMedia(itemQuestion.recto.image, ''))" v-if="itemQuestion.recto.image !== ''"><img :src="definirLienMedia(itemQuestion.recto.image, '')" :alt="itemQuestion.recto.image"></span>
								<span class="audio" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :class="{'avec-texte': itemQuestion.recto.texte !== '', 'avec-image': itemQuestion.recto.image !== '', 'lecture': lecture}" @click="lireAudio($event, definirLienMedia(itemQuestion.recto.audio, ''))" @keydown.enter="lireAudio($event, definirLienMedia(itemQuestion.recto.audio, ''))" v-if="itemQuestion.recto.audio !== ''"><i class="material-icons">volume_up</i></span>
								<span class="texte" v-if="itemQuestion.recto.texte !== ''" v-html="definirHTML(itemQuestion.recto.texte)" />
							</div>
							<div class="question" v-else-if="options.quiz === 'terme' && itemQuestion.correct === true" :key="'question_quiz_terme_' + indexQuiz + '_' + indexQuestion">
								<span class="texte consigne">{{ $t('consigneQuiz') }}</span>
								<span class="image" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :class="{'avec-texte': itemQuestion.verso.texte !== '', 'avec-audio': itemQuestion.verso.audio !== ''}" @click="afficherZoomImage($event, definirLienMedia(itemQuestion.verso.image, ''))" @keydown.enter="afficherZoomImage($event, definirLienMedia(itemQuestion.verso.image, ''))" v-if="itemQuestion.verso.image !== ''"><img :src="definirLienMedia(itemQuestion.verso.image, '')" :alt="itemQuestion.verso.image"></span>
								<span class="audio" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :class="{'avec-texte': itemQuestion.verso.texte !== '', 'avec-image': itemQuestion.verso.image !== '', 'lecture': lecture}" @click="lireAudio($event, definirLienMedia(itemQuestion.verso.audio, ''))" @keydown.enter="lireAudio($event, definirLienMedia(itemQuestion.verso.audio, ''))" v-if="itemQuestion.verso.audio !== ''"><i class="material-icons">volume_up</i></span>
								<span class="texte" v-if="itemQuestion.verso.texte !== ''" v-html="definirHTML(itemQuestion.verso.texte)" />
							</div>
						</template>

						<div :id="'reponses_' + indexQuiz" class="reponses">
							<div class="reponse" v-for="(itemReponse, indexReponse) in itemQuiz" :key="'reponse_quiz_' + indexQuiz + '_' + indexReponse">
								<label class="conteneur-coche" :class="{'correct': itemReponse.reponse && itemReponse.correct, 'incorrect': itemReponse.reponse && !itemReponse.correct}" v-if="options.quiz === 'definition'">
									<input :id="'reponse_quiz_' + indexQuiz + '_' + indexReponse" type="radio" :checked="itemReponse.reponse" :disabled="itemReponse.repondu" :value="itemReponse.correct" :name="'reponse_quiz_' + indexQuiz" :data-index="indexReponse">
									<span class="radio" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @keydown.enter="activerInput('reponse_quiz_' + indexQuiz + '_' + indexReponse)" />
									<span class="image" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :class="{'avec-texte': itemReponse.verso.texte !== ''}" @click="afficherZoomImage($event, definirLienMedia(itemReponse.verso.image, ''))" @keydown.enter="afficherZoomImage($event, definirLienMedia(itemReponse.verso.image, ''))" v-if="itemReponse.verso.image !== ''"><img :src="definirLienMedia(itemReponse.verso.image, '')" :alt="itemReponse.verso.image"></span>
									<span class="audio" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :class="{'avec-texte': itemReponse.verso.texte !== '', 'avec-image': itemReponse.verso.image !== '', 'lecture': lectureQuiz === indexReponse}" @click="lireAudioQuiz($event, indexReponse, definirLienMedia(itemReponse.verso.audio, ''))" @keydown.enter="lireAudioQuiz($event, indexReponse, definirLienMedia(itemReponse.verso.audio, ''))" v-if="itemReponse.verso.audio !== ''"><i class="material-icons">volume_up</i></span>
									<span class="texte" v-if="itemReponse.verso.texte !== ''" v-html="definirHTML(itemReponse.verso.texte)" />
								</label>
								<label class="conteneur-coche" :class="{'correct': itemReponse.reponse && itemReponse.correct, 'incorrect': itemReponse.reponse && !itemReponse.correct}" v-else>
									<input :id="'reponse_quiz_' + indexQuiz + '_' + indexReponse" type="radio" :checked="itemReponse.reponse" :disabled="itemReponse.repondu" :value="itemReponse.correct" :name="'reponse_quiz_' + indexQuiz" :data-index="indexReponse">
									<span class="radio" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @keydown.enter="activerInput('reponse_quiz_' + indexQuiz + '_' + indexReponse)" />
									<span class="image" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :class="{'avec-texte': itemReponse.recto.texte !== ''}" @click="afficherZoomImage($event, definirLienMedia(itemReponse.recto.image, ''))" @keydown.enter="afficherZoomImage($event, definirLienMedia(itemReponse.recto.image, ''))" v-if="itemReponse.recto.image !== ''"><img :src="definirLienMedia(itemReponse.recto.image, '')" :alt="itemReponse.recto.image"></span>
									<span class="audio" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :class="{'avec-texte': itemReponse.recto.texte !== '', 'avec-image': itemReponse.recto.image !== '', 'lecture': lectureQuiz === indexReponse}" @click="lireAudioQuiz($event, indexReponse, definirLienMedia(itemReponse.recto.audio, ''))" @keydown.enter="lireAudioQuiz($event, indexReponse, definirLienMedia(itemReponse.recto.audio, ''))" v-if="itemReponse.recto.audio !== ''"><i class="material-icons">volume_up</i></span>
									<span class="texte" v-if="itemReponse.recto.texte !== ''" v-html="definirHTML(itemReponse.recto.texte)" />
								</label>
							</div>
						</div>

						<div class="valider" v-if="!exercicesQuiz[indexQuiz][0].repondu">
							<span role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @click="verifierQuiz" @keydown.enter="verifierQuiz">{{ $t('valider') }}</span>
						</div>
					</article>

					<div class="navigation">
						<span class="precedent" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('afficherQuestionPrecedente')" @click="afficherQuestionQuizPrecedente" @keydown.enter="afficherQuestionQuizPrecedente"><i class="material-icons">arrow_back</i></span>
						<span class="actions">
							<span class="total">{{ navigationQuiz + 1 }} / {{ exercicesQuiz.length }}</span>
							<span class="reinitialiser" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('reinitialiser')" @click="reinitialiserQuiz" @keydown.enter="reinitialiserQuiz"><i class="material-icons">autorenew</i></span>
							<span class="score" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('afficherScore')" @click="afficherScoreQuiz" @keydown.enter="afficherScoreQuiz" v-if="verifierReponsesQuiz() === exercicesQuiz.length"><i class="material-icons">emoji_events</i></span>
							<span class="ecran" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('mettrePleinEcran')" @click="gererPleinEcran" @keydown.enter="gererPleinEcran" v-if="!pleinEcran"><i class="material-icons">fullscreen</i></span>
							<span class="ecran" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('sortirPleinEcran')" @click="gererPleinEcran" @keydown.enter="gererPleinEcran" v-else><i class="material-icons">close_fullscreen</i></span>
						</span>
						<span class="suivant" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('afficherQuestionSuivante')" @click="afficherQuestionQuizSuivante" @keydown.enter="afficherQuestionQuizSuivante"><i class="material-icons">arrow_forward</i></span>
					</div>
				</div>

				<div id="exercices" v-else-if="exercicesEcrire.length > 0 && vue === 'apprenant' && onglet === 'ecrire'">
					<article class="exercice ecrire" v-show="navigationEcrire === indexEcrire" v-for="(itemEcrire, indexEcrire) in exercicesEcrire" :key="'exercice_ecrire_' + indexEcrire">
						<div class="question">
							<template v-if="options.ecrire === 'definition' && (itemEcrire.recto.image !== '' || itemEcrire.recto.audio !== '' || itemEcrire.recto.texte !== '') && itemEcrire.verso.texte !== ''">
								<span class="image" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :class="{'avec-texte': itemEcrire.recto.texte !== '', 'avec-audio': itemEcrire.recto.audio !== ''}" @click="afficherZoomImage($event, definirLienMedia(itemEcrire.recto.image, ''))" @keydown.enter="afficherZoomImage($event, definirLienMedia(itemEcrire.recto.image, ''))" v-if="itemEcrire.recto.image !== ''"><img :src="definirLienMedia(itemEcrire.recto.image, '')" :alt="itemEcrire.recto.image"></span>
								<span class="audio" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :class="{'avec-texte': itemEcrire.recto.texte !== '', 'avec-image': itemEcrire.recto.image !== '', 'lecture': lecture}" @click="lireAudio($event, definirLienMedia(itemEcrire.recto.audio, ''))" @keydown.enter="lireAudio($event, definirLienMedia(itemEcrire.recto.audio, ''))" v-if="itemEcrire.recto.audio !== ''"><i class="material-icons">volume_up</i></span>
								<span class="texte" v-if="itemEcrire.recto.texte !== ''" v-html="definirHTML(itemEcrire.recto.texte)" />
							</template>
							<template v-else-if="options.ecrire === 'terme' && (itemEcrire.verso.image !== '' || itemEcrire.verso.audio !== '' || itemEcrire.verso.texte !== '') && itemEcrire.recto.texte !== ''">
								<span class="image" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :class="{'avec-texte': itemEcrire.verso.texte !== '', 'avec-audio': itemEcrire.verso.audio !== ''}" @click="afficherZoomImage($event, definirLienMedia(itemEcrire.verso.image, ''))" @keydown.enter="afficherZoomImage($event, definirLienMedia(itemEcrire.verso.image, ''))" v-if="itemEcrire.verso.image !== ''"><img :src="definirLienMedia(itemEcrire.verso.image, '')" :alt="itemEcrire.verso.image"></span>
								<span class="audio" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :class="{'avec-texte': itemEcrire.verso.texte !== '', 'avec-image': itemEcrire.verso.image !== '', 'lecture': lecture}" @click="lireAudio($event, definirLienMedia(itemEcrire.verso.audio, ''))" @keydown.enter="lireAudio($event, definirLienMedia(itemEcrire.verso.audio, ''))" v-if="itemEcrire.verso.audio !== ''"><i class="material-icons">volume_up</i></span>
								<span class="texte" v-if="itemEcrire.verso.texte !== ''" v-html="definirHTML(itemEcrire.verso.texte)" />
							</template>
						</div>
						
						<div class="champ">
							<input :id="'champ_' + indexEcrire" type="text" :class="{'correct': itemEcrire.correct === true, 'incorrect': itemEcrire.correct === false}" :placeholder="$t('ecrivezTerme')" :disabled="itemEcrire.reponse !== ''" :value="itemEcrire.reponse" @keydown.enter="verifierEcrire">
						</div>

						<div class="valider" v-if="itemEcrire.reponse === ''">
							<span role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @click="verifierEcrire" @keydown.enter="verifierEcrire">{{ $t('valider') }}</span>
						</div>
					</article>

					<div class="navigation">
						<span class="precedent" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('afficherQuestionPrecedente')" @click="afficherQuestionEcrirePrecedente" @keydown.enter="afficherQuestionEcrirePrecedente"><i class="material-icons">arrow_back</i></span>
						<span class="actions">
							<span class="total">{{ navigationEcrire + 1 }} / {{ exercicesEcrire.length }}</span>
							<span class="reinitialiser" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('reinitialiser')" @click="reinitialiserEcrire" @keydown.enter="reinitialiserEcrire"><i class="material-icons">autorenew</i></span>
							<span class="score" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('afficherScore')" @click="afficherScoreEcrire" @keydown.enter="afficherScoreEcrire" v-if="verifierReponsesEcrire() === exercicesEcrire.length"><i class="material-icons">emoji_events</i></span>
							<span class="ecran" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('mettrePleinEcran')" @click="gererPleinEcran" @keydown.enter="gererPleinEcran" v-if="!pleinEcran"><i class="material-icons">fullscreen</i></span>
							<span class="ecran" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('sortirPleinEcran')" @click="gererPleinEcran" @keydown.enter="gererPleinEcran" v-else><i class="material-icons">close_fullscreen</i></span>
						</span>
						<span class="suivant" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('afficherQuestionSuivante')" @click="afficherQuestionEcrireSuivante" @keydown.enter="afficherQuestionEcrireSuivante"><i class="material-icons">arrow_forward</i></span>
					</div>
				</div>

				<div id="exercices" v-else-if="exercicesAppariement.hasOwnProperty('gauche') && exercicesAppariement.gauche.length > 0 && vue === 'apprenant' && onglet === 'appariement'">
					<article class="exercice appariement">
						<div class="question"><span class="texte consigne">{{ $t('consigneAppariement') }}</span></div>
						<div class="items reponses" v-if="exercicesAppariement.reponse.length > 0">
							<ul class="paires">
								<li :class="{'correct': itemReponse[0] === itemReponse[1]}" v-for="(itemReponse, indexReponse) in exercicesAppariement.reponse" :key="'paire_' + indexReponse">
									<div class="gauche">
										<div class="image" v-if="exercicesAppariement.gauche.filter(function (e) { return e.image !== '' && e.id === itemReponse[0] }).length === 1">
											<img :src="definirLienMedia(exercicesAppariement.gauche.filter(function (e) { return e.id === itemReponse[0] })[0].image, '')" :alt="exercicesAppariement.gauche.filter(function (e) { return e.id === itemReponse[0] }).image">
										</div>
										<div class="audio" v-if="exercicesAppariement.gauche.filter(function (e) { return e.audio !== '' && e.id === itemReponse[0] }).length === 1" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :class="{'lecture': lectureAppariement === itemReponse[0]}" @click="lireAudioAppariement($event, itemReponse[0], definirLienMedia(exercicesAppariement.gauche.filter(function (e) { return e.id === itemReponse[0] })[0].audio, ''))" @keydown.enter="lireAudioAppariement($event, itemReponse[0], definirLienMedia(exercicesAppariement.gauche.filter(function (e) { return e.id === itemReponse[0] })[0].audio, ''))"><i class="material-icons">volume_up</i></div>
										<div class="texte" v-if="exercicesAppariement.gauche.filter(function (e) { return e.texte !== '' && e.id === itemReponse[0] }).length === 1" v-html="exercicesAppariement.gauche.filter(function (e) { return e.id === itemReponse[0] })[0].texte" />
									</div>
									<div class="droite">
										<div class="image" v-if="exercicesAppariement.droite.filter(function (e) { return e.image !== '' && e.id === itemReponse[1] }).length === 1">
											<img :src="definirLienMedia(exercicesAppariement.droite.filter(function (e) { return e.id === itemReponse[1] })[0].image, '')" :alt="exercicesAppariement.droite.filter(function (e) { return e.id === itemReponse[1] })[0].image">
										</div>
										<div class="audio" v-if="exercicesAppariement.droite.filter(function (e) { return e.audio !== '' && e.id === itemReponse[1] }).length === 1" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :class="{'lecture': lectureAppariement === itemReponse[1]}" @click="lireAudioAppariement($event, itemReponse[1], definirLienMedia(exercicesAppariement.droite.filter(function (e) { return e.id === itemReponse[1] })[0].audio, ''))" @keydown.enter="lireAudioAppariement($event, itemReponse[1], definirLienMedia(exercicesAppariement.droite.filter(function (e) { return e.id === itemReponse[1] })[0].audio, ''))"><i class="material-icons">volume_up</i></div>
										<div class="texte" v-if="exercicesAppariement.droite.filter(function (e) { return e.texte !== '' && e.id === itemReponse[1] }).length === 1" v-html="exercicesAppariement.droite.filter(function (e) { return e.id === itemReponse[1] })[0].texte" />
									</div>
									<span class="supprimer" role="button" @click="supprimerPaire(indexReponse)" v-if="itemReponse[0] !== itemReponse[1]"><i class="material-icons">close</i></span>
								</li>
							</ul>
						</div>
						<div class="items" v-if="exercicesAppariement.reponse.length !== exercicesAppariement.gauche.length">
							<ul class="gauche">
								<template v-for="(itemGauche, indexItemGauche) in exercicesAppariement.gauche" :key="'gauche_' + indexItemGauche">
									<li class="item" role="button" :class="{'selectionne': indexAppariement === indexItemGauche}" @click="selectionnerItemAppariement(indexItemGauche)" v-if="!exercicesAppariement.reponse.map(function (e) { return e[0] }).includes(itemGauche.id)">
										<div class="image" v-if="itemGauche.image !== ''">
											<img :src="definirLienMedia(itemGauche.image, '')" :alt="itemGauche.image">
										</div>
										<div class="audio" v-if="itemGauche.audio !== ''" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :class="{'lecture': lectureAppariement === itemGauche.id}" @click="lireAudioAppariement($event, itemGauche.id, definirLienMedia(itemGauche.audio, ''))" @keydown.enter="lireAudioAppariement($event, itemGauche.id, definirLienMedia(itemGauche.audio, ''))"><i class="material-icons">volume_up</i></div>
										<div class="texte" v-if="itemGauche.texte !== ''" v-html="itemGauche.texte" />
									</li>
								</template>
							</ul>
							<ul class="droite">
								<template v-for="(itemDroite, indexItemDroite) in exercicesAppariement.droite" :key="'droite_' + indexItemDroite">
									<li class="item" role="button" :class="{'selectionne': indexAppariement !== -1}" @click="envoyerReponseAppariement(itemDroite.id)" v-if="!exercicesAppariement.reponse.map(function (e) { return e[1] }).includes(itemDroite.id)">
										<div class="image" v-if="itemDroite.image !== ''">
											<img :src="definirLienMedia(itemDroite.image, '')" :alt="itemDroite.image">
										</div>
										<div class="audio" v-if="itemDroite.audio !== ''" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :class="{'lecture': lectureAppariement === itemDroite.id}" @click="lireAudioAppariement($event, itemDroite.id, definirLienMedia(itemDroite.audio, ''))" @keydown.enter="lireAudioAppariement($event, itemDroite.id, definirLienMedia(itemDroite.audio, ''))"><i class="material-icons">volume_up</i></div>
										<div class="texte" v-if="itemDroite.texte !== ''" v-html="itemDroite.texte" />
									</li>
								</template>
							</ul>
						</div>
					</article>

					<div class="navigation appariement">
						<span class="actions">
							<span class="reinitialiser" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('reinitialiser')" @click="reinitialiserAppariement" @keydown.enter="reinitialiserAppariement"><i class="material-icons">autorenew</i></span>
							<span class="score" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('afficherScore')" @click="afficherScoreAppariement" @keydown.enter="afficherScoreAppariement" v-if="verifierReponsesAppariement() === exercicesAppariement.gauche.length"><i class="material-icons">emoji_events</i></span>
							<span class="ecran" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('mettrePleinEcran')" @click="gererPleinEcran" @keydown.enter="gererPleinEcran" v-if="!pleinEcran"><i class="material-icons">fullscreen</i></span>
							<span class="ecran" role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('sortirPleinEcran')" @click="gererPleinEcran" @keydown.enter="gererPleinEcran" v-else><i class="material-icons">close_fullscreen</i></span>
						</span>
					</div>
				</div>

				<div id="ajouter-carte" v-if="vue === 'editeur'">
					<span role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" @click="ajouterCarte" @keydown.enter="ajouterCarte">{{ $t('ajouterCarte') }}</span>
				</div>

				<div id="credits" v-if="!integration && !impressionPDF">
					<p><a href="https://ladigitale.dev/digiflashcards/" target="_blank" rel="noreferrer" v-html="$t('credits')" /></p>
					<p>{{ new Date().getFullYear() }} - <a href="https://ladigitale.dev" target="_blank" rel="noreferrer">La Digitale</a></p>
				</div>
			</div>

			<div id="retour-haut" v-if="vue === 'editeur' && boutonRetour">
				<a :href="definirRacine() + '#/f/' + id + '?vue=apprenant'" target="_blank" :title="$t('apercuApprenant')"><i class="material-icons">preview</i></a>
				<span role="button" :tabindex="modale === '' && menu === '' && $parent.$parent.message === '' ? 0 : -1" :title="$t('retourHaut')" @click="retournerHaut" @keydown.enter="retournerHaut"><i class="material-icons">arrow_circle_up</i></span>
			</div>

			<div id="menu-partager" v-if="menu === 'partager'" :style="{'left': position + 'px'}">
				<div id="conteneur-partager">
					<label>{{ $t('lienEtCodeQR') }}</label>
					<div id="copier-lien" class="copier">
						<input type="text" disabled :value="definirRacine() + '#/f/' + id">
						<span class="icone lien" role="button" :tabindex="menu === '' ? -1 : 0" :title="$t('copierLien')" @keydown.enter="copierLien"><i class="material-icons">content_copy</i></span>
						<span class="icone codeqr" role="button" :tabindex="menu === '' ? -1 : 0" :title="$t('afficherCodeQR')" @click="afficherCodeQR" @keydown.enter="afficherCodeQR"><i class="material-icons">qr_code</i></span>
					</div>
					<label>{{ $t('codeIntegration') }}</label>
					<div id="copier-iframe" class="copier">
						<input type="text" disabled :value="'<iframe src=&quot;' + definirRacine() + '#/f/' + id + '&quot; allowfullscreen frameborder=&quot;0&quot; width=&quot;100%&quot; height=&quot;500&quot;></iframe>'">
						<span class="icone" role="button" :tabindex="menu === '' ? -1 : 0" :title="$t('copierCode')" @keydown.enter="copierIframe"><i class="material-icons">content_copy</i></span>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-if="modale === 'connexion'">
			<div class="modale" role="dialog">
				<header>
					<span class="titre">{{ $t('connexion') }}</span>
					<span class="fermer" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="fermerModaleConnexion" @keydown.enter="fermerModaleConnexion"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<div class="langue">
							<span role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" :class="{'selectionne': $parent.$parent.langue === 'fr'}" @click="modifierLangue('fr')" @keydown.enter="modifierLangue('fr')">FR</span>
							<span role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" :class="{'selectionne': $parent.$parent.langue === 'it'}" @click="modifierLangue('it')" @keydown.enter="modifierLangue('it')">IT</span>
							<span role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" :class="{'selectionne': $parent.$parent.langue === 'en'}" @click="modifierLangue('en')" @keydown.enter="modifierLangue('en')">EN</span>
						</div>
						<label for="question-secrete">{{ $t('questionSecrete') }}</label>
						<select id="question-secrete" :value="question" @change="question = $event.target.value">
							<option value="" selected>-</option>
							<option v-for="(item, index) in questions" :value="item" :key="'option_' + index">{{ $t(item) }}</option>
						</select>
						<label for="question-secrete">{{ $t('reponseSecrete') }}</label>
						<input id="question-secrete" type="password" :value="reponse" @input="reponse = $event.target.value" @keydown.enter="debloquerSerie">
						<div class="actions">
							<span class="bouton" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="debloquerSerie" @keydown.enter="debloquerSerie">{{ $t('valider') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-if="modale === 'importer-csv'">
			<div class="modale" role="dialog">
				<header>
					<span class="titre">{{ $t('importerCSV') }}</span>
					<span class="fermer" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="fermerModale" @keydown.enter="fermerModale"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<div class="parametre-import">
							<label>{{ $t('parametreImport') }}</label>
							<label class="bouton-radio" :tabindex="$parent.$parent.message === '' ? 0 : -1" @keydown.enter="activerInput('import-ajouter')">{{ $t('ajouterContenuImporte') }}
								<input id="import-ajouter" type="radio" name="import" :checked="parametreImport === 'ajouter'" @change="parametreImport = 'ajouter'">
							</label>
							<label class="bouton-radio" :tabindex="$parent.$parent.message === '' ? 0 : -1" @keydown.enter="activerInput('import-remplacer')">{{ $t('remplacerContenuImporte') }}
								<input id="import-remplacer" type="radio" name="import" :checked="parametreImport === 'remplacer'" @change="parametreImport = 'remplacer'">
							</label>
						</div>
						<input type="file" id="televerser_csv" name="televerser_csv" style="display: none;" accept=".csv" @change="importerCSV">
						<label for="televerser_csv" class="bouton large" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @keydown.enter="activerInput('televerser_csv')">{{ $t('selectionnerFichierCSV') }}</label>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'serie' || modale === 'modifier-nom' || modale === 'modifier-acces' || modale === 'importer' || modale === 'suppression-serie'">
			<div id="modale-parametres" class="modale" role="dialog" v-if="modale === 'serie'">
				<header>
					<span class="titre">{{ $t('parametresSerie') }}</span>
					<span class="fermer" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="fermerModaleSerie" @keydown.enter="fermerModaleSerie"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<div class="langue">
							<span role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" :class="{'selectionne': $parent.$parent.langue === 'fr'}" @click="modifierLangue('fr')" @keydown.enter="modifierLangue('fr')">FR</span>
							<span role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" :class="{'selectionne': $parent.$parent.langue === 'it'}" @click="modifierLangue('it')" @keydown.enter="modifierLangue('it')">IT</span>
							<span role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" :class="{'selectionne': $parent.$parent.langue === 'en'}" @click="modifierLangue('en')" @keydown.enter="modifierLangue('en')">EN</span>
						</div>
						<span class="vues"><b>{{ $t('nombreVues') }}</b> {{ vues }}</span>
						<span class="bouton large" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="ouvrirModaleNomSerie" @keydown.enter="ouvrirModaleNomSerie" v-if="!digidrive">{{ $t('modifierNomSerie') }}</span>
						<span class="bouton large" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="ouvrirModaleAccesSerie" @keydown.enter="ouvrirModaleAccesSerie" v-if="!digidrive">{{ $t('modifierAccesSerie') }}</span>
						<span class="bouton large" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="exporterSerie" @keydown.enter="exporterSerie">{{ $t('exporterSerie') }}</span>
						<span class="bouton large" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="ouvrirModaleImporter" @keydown.enter="ouvrirModaleImporter">{{ $t('importerSerie') }}</span>
						<span class="bouton large rouge" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="afficherSupprimerSerie" @keydown.enter="afficherSupprimerSerie" v-if="!digidrive">{{ $t('supprimerSerie') }}</span>
						<span class="bouton large" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="terminerSession" @keydown.enter="terminerSession">{{ $t('terminerSession') }}</span>
					</div>
				</div>
			</div>

			<div class="modale" role="dialog" v-else-if="modale === 'modifier-nom'">
				<header>
					<span class="titre">{{ $t('modifierNomSerie') }}</span>
					<span class="fermer" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="fermerModaleNomSerie" @keydown.enter="fermerModaleNomSerie"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<label for="nouveau-nom">{{ $t('nouveauNom') }}</label>
						<input id="nouveau-nom" type="text" :value="nouveaunom" @input="nouveaunom = $event.target.value" @keydown.enter="modifierNomSerie">
						<div class="actions">
							<span class="bouton" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="modifierNomSerie" @keydown.enter="modifierNomSerie">{{ $t('modifier') }}</span>
						</div>
					</div>
				</div>
			</div>

			<div class="modale" role="dialog" v-else-if="modale === 'modifier-acces'">
				<header>
					<span class="titre">{{ $t('modifierAccesSerie') }}</span>
					<span class="fermer" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="fermerModaleAccesSerie" @keydown.enter="fermerModaleAccesSerie"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<label for="question-secrete">{{ $t('questionSecreteActuelle') }}</label>
						<select id="question-secrete" :value="question" @change="question = $event.target.value">
							<option value="" selected>-</option>
							<option v-for="(item, index) in questions" :value="item" :key="'option_' + index">{{ $t(item) }}</option>
						</select>
						<label for="reponse-secrete">{{ $t('reponseSecreteActuelle') }}</label>
						<input id="reponse-secrete" type="text" :value="reponse" @input="reponse = $event.target.value">
						<label for="nouvelle-question-secrete">{{ $t('nouvelleQuestionSecrete') }}</label>
						<select id="nouvelle-question-secrete" :value="nouvellequestion" @change="nouvellequestion = $event.target.value">
							<option value="" selected>-</option>
							<option v-for="(item, index) in questions" :value="item" :key="'option_' + index">{{ $t(item) }}</option>
						</select>
						<label for="nouvelle-reponse-secrete">{{ $t('nouvelleReponseSecrete') }}</label>
						<input id="nouvelle-reponse-secrete" type="text" :value="nouvellereponse" @input="nouvellereponse = $event.target.value" @keydown.enter="modifierAccesSerie">
						<div class="actions">
							<span class="bouton" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="modifierAccesSerie" @keydown.enter="modifierAccesSerie">{{ $t('modifier') }}</span>
						</div>
					</div>
				</div>
			</div>

			<div class="modale" role="dialog" v-else-if="modale === 'importer'">
				<header>
					<span class="titre">{{ $t('importerSerie') }}</span>
					<span class="fermer" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="fermerModale" @keydown.enter="fermerModale"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<div class="parametre-import">
							<label>{{ $t('parametreImport') }}</label>
							<label class="bouton-radio" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @keydown.enter="activerInput('import-ajouter')">{{ $t('ajouterContenuImporte') }}
								<input id="import-ajouter" type="radio" name="import" :checked="parametreImport === 'ajouter'" @change="parametreImport = 'ajouter'">
							</label>
							<label class="bouton-radio" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @keydown.enter="activerInput('import-remplacer')">{{ $t('remplacerContenuImporte') }}
								<input id="import-remplacer" type="radio" name="import" :checked="parametreImport === 'remplacer'" @change="parametreImport = 'remplacer'">
							</label>
						</div>
						<input type="file" id="importer" name="importer" style="display: none;" accept=".zip" @change="importerSerie">
						<label for="importer" class="bouton large" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @keydown.enter="activerInput('importer')">{{ $t('selectionnerFichier') }}</label>
					</div>
				</div>
			</div>

			<div class="modale confirmation" role="dialog" v-else-if="modale === 'suppression-serie'">
				<div class="conteneur">
					<div class="contenu">
						<p v-html="$t('confirmationSupprimerSerie')" />
						<div class="actions">
							<span class="bouton" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="fermerModale" @keydown.enter="fermerModale">{{ $t('non') }}</span>
							<span class="bouton" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="supprimerSerie" @keydown.enter="supprimerSerie">{{ $t('oui') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'suppression-carte'">
			<div class="modale confirmation" role="dialog">
				<div class="conteneur">
					<div class="contenu">
						<p v-html="$t('confirmationSupprimerCarte')" />
						<div class="actions">
							<span class="bouton" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="fermerModale" @keydown.enter="fermerModale">{{ $t('non') }}</span>
							<span class="bouton" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="supprimerCarte" @keydown.enter="supprimerCarte">{{ $t('oui') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'image'">
			<div id="modale-image" class="modale" role="dialog">
				<header>
					<span class="titre" />
					<span class="fermer" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="fermerModaleImage" @keydown.enter="fermerModaleImage"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<div class="conteneur-chargement" v-show="chargementImage">
							<div class="chargement" />
						</div>
						<img :src="image" :alt="image">
						<div class="actions">
							<label :for="'televerser_image_' + carteIndex" class="bouton" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @keydown.enter="activerInput('televerser_image_' + carteIndex)">{{ $t('modifier') }}</label>
							<input :id="'televerser_image_' + carteIndex" type="file" @change="televerserImage($event.target.files[0], carteIndex, carteType)" style="display: none" accept=".jpg, .jpeg, .png, .gif">
							<span class="bouton" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="supprimerImage(carteIndex, carteType)" @keydown.enter="supprimerImage(carteIndex, carteType)">{{ $t('supprimer') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div id="zoom-image" class="conteneur-modale" v-else-if="modale === 'zoom-image'" @click="fermerModaleZoomImage">
			<img :src="image" :alt="image" :tabindex="$parent.$parent.message === '' ? 0 : -1" @keydown.enter="fermerModaleZoomImage">
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'ajouter-audio'">
			<div id="modale-ajouter-audio" class="modale" :class="{'transcodage': transcodage}" role="dialog">
				<header v-if="!transcodage">
					<span class="titre">{{ titreAjouterAudio }}</span>
					<span class="fermer" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="fermerModaleAjouterAudio" @keydown.enter="fermerModaleAjouterAudio"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu" v-if="!transcodage">
						<template v-if="audio === '' && !enregistrement">
							<span id="enregistrer" class="bouton" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="enregistrerAudio" @keydown.enter="enregistrerAudio"><i class="material-icons">fiber_manual_record</i><span>{{ $t('enregistrerAudio') }}</span></span>
							<div class="separateur">
								<span>{{ $t('ou') }}</span>
							</div>
							<label :for="'televerser_audio_' + carteIndex" class="bouton" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @keydown.enter="activerInput('televerser_audio_' + carteIndex)">{{ $t('selectionnerFichierMP3') }}</label>
							<input :id="'televerser_audio_' + carteIndex" type="file" @change="selectionnerAudio" style="display: none" accept=".mp3">
						</template>
						<div id="enregistrement" v-else-if="audio === '' && enregistrement">
							<canvas id="visualisation" width="360" height="60" />
							<div class="enregistrement">
								<span class="bouton stopper" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="arreterEnregistrementAudio" @keydown.enter="arreterEnregistrementAudio"><i class="material-icons">stop</i></span>
								<span class="duree">{{ dureeEnregistrement }}</span>
							</div>
						</div>
						<template v-else>
							<audio controls><source :src="audio"></audio>
							<div class="actions">
								<span class="bouton" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="audio = ''" @keydown.enter="audio = ''">{{ $t('annuler') }}</span>
								<span class="bouton" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="ajouterAudio(carteIndex, carteType)" @keydown.enter="ajouterAudio(carteIndex, carteType)">{{ $t('valider') }}</span>
							</div>
						</template>
					</div>
					<div class="contenu" v-else>
						<div class="conteneur-chargement">
							<div class="chargement" />
						</div>
						<span class="patienter">{{ $t('transcodage') }}</span>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'audio'">
			<div id="modale-audio" class="modale" role="dialog">
				<header>
					<span class="titre" />
					<span class="fermer" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="fermerModaleAudio" @keydown.enter="fermerModaleAudio"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<audio controls><source :src="audio"></audio>
						<div class="actions">
							<span class="bouton" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="supprimerAudio(carteIndex, carteType)" @keydown.enter="supprimerAudio(carteIndex, carteType)">{{ $t('supprimer') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale score" v-else-if="modale === 'score-quiz'" @click="fermerModale">
			<div class="conteneur" role="dialog">
				<span class="icone"><i class="material-icons">emoji_events</i></span>
				<span class="score" :tabindex="$parent.$parent.message === '' ? 0 : -1" @keydown.enter="fermerModale">{{ definirScoreQuiz() }} %</span>
			</div>
		</div>

		<div class="conteneur-modale score" v-else-if="modale === 'score-ecrire'" @click="fermerModale">
			<div class="conteneur" role="dialog">
				<span class="icone"><i class="material-icons">emoji_events</i></span>
				<span class="score" :tabindex="$parent.$parent.message === '' ? 0 : -1" @keydown.enter="fermerModale">{{ definirScoreEcrire() }} %</span>
			</div>
		</div>

		<div class="conteneur-modale score" v-else-if="modale === 'score-appariement'" @click="fermerModale">
			<div class="conteneur" role="dialog">
				<span class="icone"><i class="material-icons">emoji_events</i></span>
				<span class="score" :tabindex="$parent.$parent.message === '' ? 0 : -1" @keydown.enter="fermerModale">{{ definirScoreAppariement() }} %</span>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'code-qr'">
			<div id="codeqr" class="modale" role="dialog">
				<header>
					<span class="titre">{{ $t('codeQR') }}</span>
					<span class="fermer" role="button" :tabindex="$parent.$parent.message === '' ? 0 : -1" @click="fermerModale" @keydown.enter="fermerModale"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<div id="qr" />
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import ClipboardJS from 'clipboard'
import { saveAs } from 'file-saver'
import latinise from 'voca/latinise'
import stripTags from 'voca/strip_tags'
import JSZip from 'jszip'
import imagesLoaded from 'imagesloaded'
import fitty from 'fitty'
import Papa from 'papaparse'
import fscreen from 'fscreen'
import lamejs from 'lamejs'
import DOMPurify from 'dompurify'
import { VueDraggableNext } from 'vue-draggable-next'

export default {
	name: 'Editeur-Digiflashcards',
	components: {
		draggable: VueDraggableNext
	},
	data () {
		return {
			modale: '',
			menu: '',
			admin: false,
			id: '',
			question: '',
			questions: ['motPrefere', 'filmPrefere', 'chansonPreferee', 'prenomMere', 'prenomPere', 'nomRue', 'nomEmployeur', 'nomAnimal'],
			reponse: '',
			nom: '',
			options: { exercices: true, quiz: 'definition', ecrire: 'definition', appariement: 'definition', casse: false },
			cartes: [{ recto: { texte: '', image: '', audio: '' }, verso: { texte: '', image: '', audio: '' } }, { recto: { texte: '', image: '', audio: '' }, verso: { texte: '', image: '', audio: '' } }, { recto: { texte: '', image: '', audio: '' }, verso: { texte: '', image: '', audio: '' } }],
			cartesOriginales: [],
			carteIndex: '',
			carteType: '',
			nouveaunom: '',
			nouvellequestion: '',
			nouvellereponse: '',
			vues: 0,
			codeqr: '',
			position: 0,
			chargement: '',
			progression: 0,
			chrono: '',
			vue: 'apprenant',
			navigationCartes: 0,
			recto: true,
			transition: false,
			tailleFonte: 28,
			fitty: '',
			onglet: 'cartes',
			navigationQuiz: 0,
			exercicesQuiz: [],
			navigationEcrire: 0,
			exercicesEcrire: [],
			indexAppariement: -1,
			exercicesAppariement: [],
			chargementImage: false,
			image: '',
			audio: '',
			blob: '',
			transcodage: false,
			mediaRecorder: '',
			flux: [],
			contexte: '',
			lecture: false,
			lectureQuiz: '',
			lectureAppariement: '',
			intervalle: '',
			enregistrement: false,
			dureeEnregistrement: '00 : 00',
			titreAjouterAudio: '',
			pleinEcran: false,
			cartesInversees: false,
			parametreImport: 'ajouter',
			digidrive: false,
			boutonRetour: false,
			cartesMemorisees: [],
			integration: false,
			impressionPDF: false,
			fitties: '',
			elementPrecedent: null
		}
	},
	watch: {
		modale: function (valeur) {
			if (valeur !== '') {
				this.menu = ''
			}
		},
		recto: function () {
			if (this.audio !== '') {
				this.audio.pause()
				this.audio = ''
				this.lecture = false
			}
		},
		onglet: function () {
			if (this.audio !== '') {
				this.audio.pause()
				this.audio = ''
				this.lecture = false
				this.lectureQuiz = ''
			}
		},
		cartes: {
			handler (cartes) {
				if (this.vue === 'editeur') {
					for (let i = 0; i < cartes.length; i++) {
						if (!cartes[i].hasOwnProperty('id')) {
							const id = 'carte-' + (new Date()).getTime() + Math.random().toString(16).slice(12)
							cartes[i].id = id
						}
					}
					this.cartes = cartes
				}
			},
			deep: true
		}
	},
	created () {
		this.id = this.$route.params.id
		const langue = this.$route.query.lang
		if (this.$parent.$parent.langues.includes(langue) === true) {
			this.$parent.$parent.langue = langue
			localStorage.setItem('digiflashcards_lang', langue)
		}
		const vue = this.$route.query.vue
		if (vue && vue === 'apprenant') {
			this.vue = 'apprenant'
		}
		if (window.location.href.includes('?print-pdf')) {
			this.vue = 'apprenant'
			this.impressionPDF = true
		}
		const question = this.$route.query.q
		const reponse = this.$route.query.r
		if (question && question !== '' && reponse && reponse !== '') {
			const xhreq = new XMLHttpRequest()
			xhreq.onload = function () {
				if (xhreq.readyState === xhreq.DONE && xhreq.status === 200 && xhreq.responseText === 'serie_debloquee') {
					this.admin = true
					this.vue = 'editeur'
					this.digidrive = true
				}
				window.history.replaceState({}, document.title, window.location.href.split('?')[0])
			}.bind(this)
			xhreq.open('POST', this.$parent.$parent.hote + 'inc/ouvrir_serie.php', true)
			xhreq.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
			xhreq.send('serie=' + this.id + '&question=' + window.atob(question) + '&reponse=' + window.atob(reponse) + '&type=api')
		}
		const xhr = new XMLHttpRequest()
		xhr.onload = function () {
			if (xhr.readyState === xhr.DONE && xhr.status === 200) {
				if (xhr.responseText === 'contenu_inexistant' || this.verifierJSON(xhr.responseText) === false) {
					this.$router.push('/')
					return false
				}
				const reponse = JSON.parse(xhr.responseText)
				if (!reponse.nom || reponse.nom === '') {
					this.$router.push('/')
					return false
				}
				this.admin = reponse.admin
				if (this.admin && !vue && !this.impressionPDF) {
					this.vue = 'editeur'
				}
				this.nom = reponse.nom
				this.vues = reponse.vues
				if (reponse.donnees !== '' && this.verifierJSON(reponse.donnees) === true) {
					const donnees = JSON.parse(reponse.donnees)
					this.cartes = donnees.cartes
					if (donnees.hasOwnProperty('options')) {
						this.options = donnees.options
					}
					if (!this.options.hasOwnProperty('quiz')) {
						this.options.quiz = 'definition'
					}
					if (!this.options.hasOwnProperty('ecrire')) {
						this.options.ecrire = 'definition'
					}
					if (!this.options.hasOwnProperty('appariement')) {
						this.options.appariement = 'definition'
					}
					this.verifierCartes()
				}
				this.digidrive = Boolean(reponse.digidrive)

				if (this.vue === 'apprenant') {
					this.cartes = this.cartes.filter(function (carte) {
						return (carte.recto.texte !== '' || carte.recto.image !== '' || carte.recto.audio !== '') && (carte.verso.texte !== '' || carte.verso.image !== '' || carte.verso.audio !== '')
					}.bind(this))
					this.cartesOriginales = JSON.parse(JSON.stringify(this.cartes))
					this.cartes = this.cartes.filter(function (carte) {
						return !carte.hasOwnProperty('masque') || (carte.hasOwnProperty('masque') && carte.masque === false)
					}.bind(this))
					if (this.cartes.length > 0) {
						const tailleFonte = this.tailleFonte
						this.$nextTick(function () {
							this.fitty = fitty('#carte_0 .texte', {
								minSize: tailleFonte,
								maxSize: 100,
								multiLine: true
							})
							window.MathJax.typeset()
						}.bind(this))
					}
					this.cartes.forEach(function (carte) {
						if (carte.recto.texte !== '') {
							carte.recto.texte = carte.recto.texte.replace(/(?:\r\n|\r|\n)/g, '<br>')
						}
						if (carte.verso.texte !== '') {
							carte.verso.texte = carte.verso.texte.replace(/(?:\r\n|\r|\n)/g, '<br>')
						}
					})
					if (localStorage.getItem('digiflashcards_cartes_memorisees_' + this.id)) {
						this.cartesMemorisees = JSON.parse(localStorage.getItem('digiflashcards_cartes_memorisees_' + this.id))
						if (this.cartesMemorisees.length > 0) {
							const cartes = JSON.parse(JSON.stringify(this.cartes))
							const cartesMemorisees = []
							this.cartesMemorisees.forEach(function (carteMemorisee) {
								cartes.forEach(function (carte, index) {
									if (carte.hasOwnProperty('id') && carteMemorisee === carte.id) {
										cartesMemorisees.push(carte)
										cartes.splice(index, 1)
									}
								})
							})
							cartes.push(...cartesMemorisees)
							this.cartes = cartes
						}
					}
					if (localStorage.getItem('digiflashcards_quiz_' + this.id)) {
						this.exercicesQuiz = JSON.parse(localStorage.getItem('digiflashcards_quiz_' + this.id))
					} else if (this.cartes.length > 4 && this.options.exercices === true) {
						this.definirExercicesQuiz()
					}
					if (localStorage.getItem('digiflashcards_ecrire_' + this.id)) {
						this.exercicesEcrire = JSON.parse(localStorage.getItem('digiflashcards_ecrire_' + this.id))
					} else if (this.cartes.length > 4 && this.options.exercices === true) {
						this.definirExercicesEcrire()
					}
					if (localStorage.getItem('digiflashcards_appariement_' + this.id)) {
						this.exercicesAppariement = JSON.parse(localStorage.getItem('digiflashcards_appariement_' + this.id))
					} else if (this.cartes.length > 4 && this.options.exercices === true) {
						this.definirExercicesAppariement()
					}
					document.querySelector('#app').classList.add('apprenant')

					if (this.impressionPDF === true) {
						this.definirTailleFonte()
					}
				} else {
					this.$nextTick(function () {
						document.querySelector('#page').addEventListener('dragover', function (event) {
							event.preventDefault()
							event.stopPropagation()
						}, false)

						document.querySelector('#page').addEventListener('dragcenter', function (event) {
							event.preventDefault()
							event.stopPropagation()
						}, false)

						document.querySelector('#page').addEventListener('drop', function (event) {
							event.preventDefault()
							event.stopPropagation()
						}, false)

						document.querySelector('#cartes').addEventListener('dragover', function (event) {
							event.preventDefault()
							event.stopPropagation()
						}, false)

						document.querySelector('#cartes').addEventListener('dragcenter', function (event) {
							event.preventDefault()
							event.stopPropagation()
						}, false)

						document.querySelector('#cartes').addEventListener('drop', function (event) {
							event.preventDefault()
							event.stopPropagation()
							if (event.dataTransfer.files && event.dataTransfer.files[0] && (event.dataTransfer.files[0].type.substring(0, 5) === 'image' || event.dataTransfer.files[0].type.substring(0, 5) === 'audio')) {
								if (event.target.closest('.conteneur') !== null && (event.target.closest('.conteneur').classList.contains('recto') || event.target.closest('.conteneur').classList.contains('verso'))) {
									let type
									if (event.target.closest('.conteneur').classList.contains('recto')) {
										type = 'recto'
									} else if (event.target.closest('.conteneur').classList.contains('verso')) {
										type = 'verso'
									}
									const index = event.target.closest('.carte').id.substring(5)
									if (event.dataTransfer.files[0].type.substring(0, 5) === 'image' && index !== null && type !== null) {
										this.televerserImage(event.dataTransfer.files[0], index, type)
									} else if (event.dataTransfer.files[0].type.substring(0, 5) === 'audio' && index !== null && type !== null) {
										this.televerserAudio(event.dataTransfer.files[0], index, type)
									}
								}
							}
						}.bind(this), false)
					}.bind(this))
				}
				setTimeout(function () {
					document.title = this.nom + ' - Digiflashcards by La Digitale'
					this.$parent.$parent.chargement = false
				}.bind(this), 300)
			} else {
				this.$parent.$parent.chargement = false
				this.$parent.$parent.message = this.$t('erreurServeur')
			}
		}.bind(this)
		xhr.open('POST', this.$parent.$parent.hote + 'inc/recuperer_serie.php', true)
		xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
		xhr.send('id=' + this.id)
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

		this.definirTailleFonte()

		const lien = this.definirRacine() + '#/f/' + this.id
		const clipboard = new ClipboardJS('#copier-lien .lien', {
			text: function () {
				return lien
			}
		})
		clipboard.on('success', function () {
			document.querySelector('#copier-lien .lien').focus()
			this.$parent.$parent.notification = this.$t('lienCopie')
		}.bind(this))
		const iframe = '<iframe src="' + lien + '?vue=apprenant" allowfullscreen frameborder="0" width="100%" height="500"></iframe>'
		const clipboardIframe = new ClipboardJS('#copier-iframe span', {
			text: function () {
				return iframe
			}
		})
		clipboardIframe.on('success', function () {
			document.querySelector('#copier-iframe span').focus()
			this.$parent.$parent.notification = this.$t('codeCopie')
		}.bind(this))

		if (fscreen.fullscreenEnabled) {
			fscreen.addEventListener('fullscreenchange', function () {
				this.$nextTick(function () {
					if (fscreen.fullscreenElement !== null) {
						this.pleinEcran = true
					} else {
						this.pleinEcran = false
					}
				}.bind(this))
			}.bind(this))
		} else {
			document.querySelector('#page').classList.add('sans-plein-ecran')
		}

		document.addEventListener('click', function (event) {
			const partager = document.querySelector('#conteneur-partage')
			const menuPartager = document.querySelector('#menu-partager')
			if (partager && menuPartager && event.target !== partager && event.target !== menuPartager && !partager.contains(event.target) && !menuPartager.contains(event.target)) {
				this.menu = ''
				this.gererFocus()
			}
		}.bind(this))

		if (window !== window.parent) {
			this.integration = true
			document.querySelector('#app').classList.add('integration')
		}

		if (this.impressionPDF === true) {
			document.getElementsByTagName('html')[0].style.height = 'auto'
			document.querySelector('#app').classList.add('pdf')
		}

		window.addEventListener('resize', function () {
			if (this.menu === 'partager') {
				this.menu = ''
				this.gererFocus()
			}
			this.definirTailleFonte()
			if (this.enregistrement === true) {
				this.$nextTick(function () {
					const largeur = document.querySelector('#enregistrement').offsetWidth
					const canvas = document.querySelector('#visualisation')
					canvas.width = largeur
				})
			}
			if (this.onglet === 'appariement') {
				this.$nextTick(function () {
					this.redimensionnerAppariement()
				}.bind(this))
			}
		}.bind(this))

		document.addEventListener('keydown', this.gererClavier, false)

		document.body.addEventListener('scroll', this.gererScroll, false)
	},
	beforeUnmount () {
		document.removeEventListener('keydown', this.gererClavier, false)
	},
	methods: {
		definirRacine () {
			return window.location.href.split('#')[0]
		},
		verifierJSON (json) {
			try {
				JSON.parse(json)
				return true
			} catch {
				return false
			}
		},
		definirOnglet (onglet) {
			if (this.onglet !== onglet) {
				this.onglet = onglet
			}
			if (onglet === 'cartes') {
				const tailleFonte = this.tailleFonte
				if (this.fitty !== '') {
					if (this.fitty[0]) {
						this.fitty[0].unsubscribe()
					}
					if (this.fitty[1]) {
						this.fitty[1].unsubscribe()
					}
				}
				this.$nextTick(function () {
					this.fitty = fitty('#carte_' + this.navigationCartes + ' .texte', {
						minSize: tailleFonte,
						maxSize: 100,
						multiLine: true
					})
					window.MathJax.typeset()
				}.bind(this))
			} else if (onglet === 'ecrire') {
				this.$nextTick(function () {
					document.querySelector('#champ_' + this.navigationEcrire).focus()
					window.MathJax.typeset()
				}.bind(this))
			} else if (onglet === 'appariement') {
				this.$nextTick(function () {
					this.redimensionnerAppariement()
					window.MathJax.typeset()
				}.bind(this))
			} else {
				this.$nextTick(function () {
					window.MathJax.typeset()
				}.bind(this))
			}
		},
		activerInput (id) {
			document.querySelector('#' + id).click()
		},
		modifierOptions (type, valeur) {
			this.options[type] = valeur
			const xhr = new XMLHttpRequest()
			xhr.onload = function () {
				if (xhr.readyState === xhr.DONE && xhr.status === 200) {
					if (xhr.responseText === 'contenu_inexistant') {
						document.title = 'Digiflashcards by La Digitale'
						this.$router.push('/')
					} else if (xhr.responseText === 'erreur') {
						this.$parent.$parent.message = this.$t('erreurServeur')
					} else if (xhr.responseText === 'non_autorise') {
						this.$parent.$parent.message = this.$t('actionNonAutorisee')
					}
				} else {
					this.$parent.$parent.message = this.$t('erreurServeur')
				}
			}.bind(this)
			xhr.open('POST', this.$parent.$parent.hote + 'inc/modifier_serie.php', true)
			xhr.setRequestHeader('Content-type', 'application/json')
			const json = { serie: this.id, donnees: JSON.stringify({ cartes: this.cartes, options: this.options }) }
			xhr.send(JSON.stringify(json))
			if (type === 'quiz') {
				if (localStorage.getItem('digiflashcards_quiz_' + this.id)) {
					localStorage.removeItem('digiflashcards_quiz_' + this.id)
				}
				if (this.cartes.length > 4) {
					this.definirExercicesQuiz()
				}
			} else if (type === 'ecrire') {
				if (localStorage.getItem('digiflashcards_ecrire_' + this.id)) {
					localStorage.removeItem('digiflashcards_ecrire_' + this.id)
				}
				if (this.cartes.length > 4) {
					this.definirExercicesEcrire()
				}
			} else if (type === 'appariement') {
				if (localStorage.getItem('digiflashcards_appariement_' + this.id)) {
					localStorage.removeItem('digiflashcards_appariement_' + this.id)
				}
				if (this.cartes.length > 4) {
					this.definirExercicesAppariement()
				}
			}
		},
		definirTailleFonte () {
			if (this.vue === 'apprenant' && !this.impressionPDF) {
				this.$nextTick(function () {
					if (document.body.clientWidth < 360) {
						this.tailleFonte = 18
					} else if (document.body.clientWidth < 400) {
						this.tailleFonte = 20
					} else if (document.body.clientWidth < 768) {
						this.tailleFonte = 24
					} else {
						this.tailleFonte = 28
					}
					const tailleFonte = this.tailleFonte
					if (this.fitty !== '') {
						if (this.fitty[0]) {
							this.fitty[0].unsubscribe()
						}
						if (this.fitty[1]) {
							this.fitty[1].unsubscribe()
						}
					}
					this.$nextTick(function () {
						this.fitty = fitty('#carte_' + this.navigationCartes + ' .texte', {
							minSize: tailleFonte,
							maxSize: 100,
							multiLine: true
						})
					}.bind(this))
				}.bind(this))
			} else if (this.vue === 'apprenant' && this.impressionPDF) {
				this.$nextTick(function () {
					if (document.body.clientWidth < 360) {
						this.tailleFonte = 18
					} else if (document.body.clientWidth < 400) {
						this.tailleFonte = 20
					} else if (document.body.clientWidth < 768) {
						this.tailleFonte = 24
					} else {
						this.tailleFonte = 28
					}
					const tailleFonte = this.tailleFonte
					if (this.fitty !== '') {
						if (this.fitty[0]) {
							this.fitty[0].unsubscribe()
						}
						if (this.fitty[1]) {
							this.fitty[1].unsubscribe()
						}
					}
					if (this.fitties !== '') {
						this.fitties.forEach(function (element) {
							element.unsubscribe()
						})
					}
					this.$nextTick(function () {
						this.fitties = fitty('#cartes .texte', {
							minSize: tailleFonte,
							maxSize: 70,
							multiLine: true
						})
						this.fitties.forEach(function (element) {
							element.fit()
						})
					}.bind(this))
				}.bind(this))
			}
		},
		definirLienMedia (media, prefixe) {
			if (this.verifierLien(media) === false) {
				return this.definirRacine() + 'fichiers/' + this.id + '/' + prefixe + media
			} else {
				return media
			}
		},
		modifierLangue (langue) {
			this.$root.$i18n.locale = langue
			this.$parent.$parent.langue = langue
			document.getElementsByTagName('html')[0].setAttribute('lang', langue)
			this.$parent.$parent.notification = this.$t('langueModifiee')
			localStorage.setItem('digiflashcards_lang', langue)
		},
		afficherMenuPartager () {
			this.elementPrecedent = (document.activeElement || document.body)
			this.menu = 'partager'
			this.$nextTick(function () {
				const rect = document.querySelector('#conteneur-partage').getBoundingClientRect()
				const largeurBouton = rect.width
				const largeurMenu = document.querySelector('#menu-partager').getBoundingClientRect().width
				this.position = rect.left - ((largeurMenu * 90) / 100 - largeurBouton / 2)
				document.querySelector('#menu-partager span').focus()
			}.bind(this))
		},
		copierLien () {
			document.querySelector('#copier-lien .lien').click()
		},
		copierIframe () {
			document.querySelector('#copier-iframe span').click()
		},
		afficherCodeQR () {
			this.modale = 'code-qr'
			this.$nextTick(function () {
				const lien = this.definirRacine() + '#/f/' + this.id
				// eslint-disable-next-line
				this.codeqr = new QRCode('qr', {
					text: lien,
					width: 360,
					height: 360,
					colorDark: '#000000',
					colorLight: '#ffffff',
					// eslint-disable-next-line
					correctLevel : QRCode.CorrectLevel.H
				})
				document.querySelector('#codeqr .fermer').focus()
			}.bind(this))
		},
		fermerModale () {
			this.modale = ''
			this.gererFocus()
		},
		definirHTML (html) {
			return DOMPurify.sanitize(html)
		},
		definirItemTexte (texte) {
			let html = ''
			const items = texte.split('|')
			items.forEach(function (item) {
				html += '- ' + DOMPurify.sanitize(item.trim()) + '<br>'
			})
			return html
		},
		supprimerDonneesExercices () {
			if (localStorage.getItem('digiflashcards_quiz_' + this.id)) {
				localStorage.removeItem('digiflashcards_quiz_' + this.id)
			}
			if (localStorage.getItem('digiflashcards_ecrire_' + this.id)) {
				localStorage.removeItem('digiflashcards_ecrire_' + this.id)
			}
			if (localStorage.getItem('digiflashcards_appariement_' + this.id)) {
				localStorage.removeItem('digiflashcards_appariement_' + this.id)
			}
		},
		afficherCartePrecedente () {
			this.$parent.$parent.chargementTransparent = true
			this.transition = true
			if (this.navigationCartes > 0) {
				this.navigationCartes--
			} else {
				this.navigationCartes = this.cartes.length - 1
			}
			this.recto = true
			if (this.audio !== '') {
				this.audio.pause()
				this.audio = ''
				this.lecture = false
			}
			setTimeout(function () {
				imagesLoaded('#cartes', function () {
					this.$parent.$parent.chargementTransparent = false
					this.transition = false
					const tailleFonte = this.tailleFonte
					this.$nextTick(function () {
						this.fitty = fitty('#carte_' + this.navigationCartes + ' .texte', {
							minSize: tailleFonte,
							maxSize: 100,
							multiLine: true
						})
						document.querySelector('#carte_' + this.navigationCartes).focus()
					}.bind(this))
				}.bind(this))
			}.bind(this), 200)
		},
		afficherCarteSuivante () {
			this.$parent.$parent.chargementTransparent = true
			this.transition = true
			if (this.navigationCartes < this.cartes.length - 1) {
				this.navigationCartes++
			} else {
				this.navigationCartes = 0
			}
			this.recto = true
			if (this.audio !== '') {
				this.audio.pause()
				this.audio = ''
				this.lecture = false
			}
			setTimeout(function () {
				imagesLoaded('#cartes', function () {
					this.$parent.$parent.chargementTransparent = false
					this.transition = false
					const tailleFonte = this.tailleFonte
					this.$nextTick(function () {
						this.fitty = fitty('#carte_' + this.navigationCartes + ' .texte', {
							minSize: tailleFonte,
							maxSize: 100,
							multiLine: true
						})
						document.querySelector('#carte_' + this.navigationCartes).focus()
					}.bind(this))
				}.bind(this))
			}.bind(this), 200)
		},
		ajouterCarte () {
			this.cartes.push({ recto: { texte: '', image: '', audio: '' }, verso: { texte: '', image: '', audio: '' } })
			this.$nextTick(function () {
				document.body.scrollTop = document.body.scrollHeight
				document.querySelector('#cartes .carte:last-child textarea').focus()
			})
		},
		enregistrerTexte (event, index, type) {
			this.cartes[index][type].texte = event.target.value
			if (this.chrono !== '') {
				clearTimeout(this.chrono)
				this.chrono = ''
			}
			this.chrono = setTimeout(function () {
				const xhr = new XMLHttpRequest()
				xhr.onload = function () {
					this.chrono = ''
					if (xhr.readyState === xhr.DONE && xhr.status === 200) {
						if (xhr.responseText === 'contenu_inexistant') {
							document.title = 'Digiflashcards by La Digitale'
							this.$router.push('/')
						} else if (xhr.responseText === 'erreur') {
							this.$parent.$parent.message = this.$t('erreurServeur')
						} else if (xhr.responseText === 'non_autorise') {
							this.$parent.$parent.message = this.$t('actionNonAutorisee')
						}
					} else {
						this.$parent.$parent.message = this.$t('erreurServeur')
					}
				}.bind(this)
				xhr.open('POST', this.$parent.$parent.hote + 'inc/modifier_serie.php', true)
				xhr.setRequestHeader('Content-type', 'application/json')
				const json = { serie: this.id, donnees: JSON.stringify({ cartes: this.cartes, options: this.options }) }
				xhr.send(JSON.stringify(json))
				this.supprimerDonneesExercices()
			}.bind(this), 1000)
		},
		televerserImage (blob, index, type) {
			const extension = blob.name.substring(blob.name.lastIndexOf('.') + 1).toLowerCase()
			if (['jpg', 'jpeg', 'png', 'gif'].includes(extension) === false) {
				this.$parent.$parent.message = this.$t('erreurFormat')
				return false
			}
			if (blob.size < 1024000) {
				this.modale = ''
				this.chargement = 'image_' + type + '_' + index
				const formData = new FormData()
				formData.append('ancienfichier', this.cartes[index][type].image)
				formData.append('serie', this.id)
				formData.append('blob', blob)
				let xhr = new XMLHttpRequest()
				xhr.onload = function () {
					if (xhr.readyState === xhr.DONE && xhr.status === 200) {
						this.chargement = ''
						this.progression = 0
						if (xhr.responseText === 'erreur') {
							this.$parent.$parent.message = this.$t('erreurTeleversement')
						} else {
							this.cartes[index][type].image = xhr.responseText
							xhr = new XMLHttpRequest()
							xhr.onload = function () {
								if (xhr.readyState === xhr.DONE && xhr.status === 200) {
									if (xhr.responseText === 'contenu_inexistant') {
										document.title = 'Digiflashcards by La Digitale'
										this.$router.push('/')
									} else if (xhr.responseText === 'erreur') {
										this.$parent.$parent.message = this.$t('erreurServeur')
									} else if (xhr.responseText === 'non_autorise') {
										this.$parent.$parent.message = this.$t('actionNonAutorisee')
									}
								} else {
									this.$parent.$parent.message = this.$t('erreurServeur')
								}
							}.bind(this)
							xhr.open('POST', this.$parent.$parent.hote + 'inc/modifier_serie.php', true)
							xhr.setRequestHeader('Content-type', 'application/json')
							const json = { serie: this.id, donnees: JSON.stringify({ cartes: this.cartes, options: this.options }) }
							xhr.send(JSON.stringify(json))
							this.supprimerDonneesExercices()
						}
					} else {
						this.chargement = ''
						this.progression = 0
						this.$parent.$parent.message = this.$t('erreurTeleversement')
					}
				}.bind(this)
				xhr.upload.onprogress = function (e) {
					if (e.lengthComputable) {
						const pourcentage = (e.loaded / e.total) * 100
						this.progression = Math.round(pourcentage)
					}
				}.bind(this)
				xhr.open('POST', this.$parent.$parent.hote + 'inc/televerser_image.php', true)
				xhr.send(formData)
			} else {
				this.$parent.$parent.message = this.$t('tailleMax', { taille: 1 })
			}
		},
		afficherImage (index, type, image) {
			this.chargementImage = true
			this.elementPrecedent = (document.activeElement || document.body)
			this.carteIndex = index
			this.carteType = type
			this.image = image
			this.modale = 'image'
			this.$nextTick(function () {
				imagesLoaded('#modale-image .contenu', function () {
					this.chargementImage = false
					document.querySelector('#modale-image .fermer').focus()
				}.bind(this))
			}.bind(this))
		},
		fermerModaleImage () {
			this.modale = ''
			this.image = ''
			this.carteIndex = ''
			this.carteType = ''
			this.chargementImage = false
			this.gererFocus()
		},
		afficherZoomImage (event, image) {
			event.preventDefault()
			event.stopPropagation()
			this.$parent.$parent.chargement = true
			this.elementPrecedent = (document.activeElement || document.body)
			this.image = image
			this.modale = 'zoom-image'
			this.$nextTick(function () {
				imagesLoaded('#zoom-image', function () {
					this.$parent.$parent.chargement = false
					document.querySelector('#zoom-image img').focus()
				}.bind(this))
			}.bind(this))
		},
		fermerModaleZoomImage () {
			this.modale = ''
			this.image = ''
			this.gererFocus()
		},
		supprimerImage (index, type) {
			this.fermerModaleImage()
			this.$parent.$parent.chargement = true
			const cartes = JSON.parse(JSON.stringify(this.cartes))
			let image = ''
			if (cartes[index][type].image !== '' && this.verifierLien(cartes[index][type].image) === false) {
				image = cartes[index][type].image
			}
			cartes[index][type].image = ''
			const xhr = new XMLHttpRequest()
			xhr.onload = function () {
				if (xhr.readyState === xhr.DONE && xhr.status === 200) {
					this.$parent.$parent.chargement = false
					if (xhr.responseText === 'contenu_inexistant') {
						document.title = 'Digiflashcards by La Digitale'
						this.$router.push('/')
					} else if (xhr.responseText === 'erreur') {
						this.$parent.$parent.message = this.$t('erreurServeur')
					} else if (xhr.responseText === 'non_autorise') {
						this.$parent.$parent.message = this.$t('actionNonAutorisee')
					} else if (xhr.responseText === 'serie_modifiee') {
						this.cartes = cartes
					}
				} else {
					this.$parent.$parent.chargement = false
					this.$parent.$parent.message = this.$t('erreurServeur')
				}
			}.bind(this)
			xhr.open('POST', this.$parent.$parent.hote + 'inc/modifier_serie.php', true)
			xhr.setRequestHeader('Content-type', 'application/json')
			const json = { serie: this.id, donnees: JSON.stringify({ cartes: cartes, options: this.options }), image: image }
			xhr.send(JSON.stringify(json))
			this.supprimerDonneesExercices()
		},
		televerserAudio (blob, index, type) {
			const fichier = blob.name
			const extension = blob.name.substring(blob.name.lastIndexOf('.') + 1).toLowerCase()
			if (extension !== 'mp3') {
				this.$parent.$parent.message = this.$t('erreurFormat')
				return false
			}
			if (blob.size < 1024000) {
				this.chargement = 'audio_' + type + '_' + index
				const formData = new FormData()
				formData.append('ancienfichier', this.cartes[index][type].audio)
				formData.append('serie', this.id)
				formData.append('blob', blob, fichier)
				let xhr = new XMLHttpRequest()
				xhr.onload = function () {
					if (xhr.readyState === xhr.DONE && xhr.status === 200) {
						this.chargement = ''
						this.progression = 0
						if (xhr.responseText === 'erreur') {
							this.$parent.$parent.message = this.$t('erreurTeleversement')
						} else {
							this.cartes[index][type].audio = xhr.responseText
							xhr = new XMLHttpRequest()
							xhr.onload = function () {
								if (xhr.readyState === xhr.DONE && xhr.status === 200) {
									if (xhr.responseText === 'contenu_inexistant') {
										document.title = 'Digiflashcards by La Digitale'
										this.$router.push('/')
									} else if (xhr.responseText === 'erreur') {
										this.$parent.$parent.message = this.$t('erreurServeur')
									} else if (xhr.responseText === 'non_autorise') {
										this.$parent.$parent.message = this.$t('actionNonAutorisee')
									}
								} else {
									this.$parent.$parent.message = this.$t('erreurServeur')
								}
							}.bind(this)
							xhr.open('POST', this.$parent.$parent.hote + 'inc/modifier_serie.php', true)
							xhr.setRequestHeader('Content-type', 'application/json')
							const json = { serie: this.id, donnees: JSON.stringify({ cartes: this.cartes, options: this.options }) }
							xhr.send(JSON.stringify(json))
							this.supprimerDonneesExercices()
						}
					} else {
						this.chargement = ''
						this.progression = 0
						this.$parent.$parent.message = this.$t('erreurTeleversement')
					}
				}.bind(this)
				xhr.upload.onprogress = function (e) {
					if (e.lengthComputable) {
						const pourcentage = (e.loaded / e.total) * 100
						this.progression = Math.round(pourcentage)
					}
				}.bind(this)
				xhr.open('POST', this.$parent.$parent.hote + 'inc/televerser_audio.php', true)
				xhr.send(formData)
			} else {
				this.$parent.$parent.message = this.$t('tailleMax', { taille: 1 })
			}
		},
		async ajouterAudio (index, type) {
			let fichier = ''
			if (this.blob.name) {
				const extension = this.blob.name.substring(this.blob.name.lastIndexOf('.') + 1).toLowerCase()
				if (extension !== 'mp3') {
					this.fermerModaleAjouterAudio()
					this.$parent.$parent.message = this.$t('erreurFormat')
					return false
				}
				fichier = this.blob.name
			} else {
				fichier = 'enregistrement.mp3'
			}
			if (this.blob.size < 1024000 || fichier === 'enregistrement.mp3') {
				let blob
				if (fichier === 'enregistrement.mp3') {
					this.transcodage = true
					blob = await this.blobEnMp3()
				} else {
					blob = this.blob
				}
				this.fermerModaleAjouterAudio()
				this.chargement = 'audio_' + type + '_' + index
				const formData = new FormData()
				formData.append('ancienfichier', this.cartes[index][type].audio)
				formData.append('serie', this.id)
				formData.append('blob', blob, fichier)
				let xhr = new XMLHttpRequest()
				xhr.onload = function () {
					if (xhr.readyState === xhr.DONE && xhr.status === 200) {
						this.chargement = ''
						this.progression = 0
						if (xhr.responseText === 'erreur') {
							this.$parent.$parent.message = this.$t('erreurTeleversement')
						} else {
							this.cartes[index][type].audio = xhr.responseText
							xhr = new XMLHttpRequest()
							xhr.onload = function () {
								if (xhr.readyState === xhr.DONE && xhr.status === 200) {
									if (xhr.responseText === 'contenu_inexistant') {
										document.title = 'Digiflashcards by La Digitale'
										this.$router.push('/')
									} else if (xhr.responseText === 'erreur') {
										this.$parent.$parent.message = this.$t('erreurServeur')
									} else if (xhr.responseText === 'non_autorise') {
										this.$parent.$parent.message = this.$t('actionNonAutorisee')
									}
								} else {
									this.$parent.$parent.message = this.$t('erreurServeur')
								}
							}.bind(this)
							xhr.open('POST', this.$parent.$parent.hote + 'inc/modifier_serie.php', true)
							xhr.setRequestHeader('Content-type', 'application/json')
							const json = { serie: this.id, donnees: JSON.stringify({ cartes: this.cartes, options: this.options }) }
							xhr.send(JSON.stringify(json))
							this.supprimerDonneesExercices()
						}
					} else {
						this.chargement = ''
						this.progression = 0
						this.$parent.$parent.message = this.$t('erreurTeleversement')
					}
				}.bind(this)
				xhr.upload.onprogress = function (e) {
					if (e.lengthComputable) {
						const pourcentage = (e.loaded / e.total) * 100
						this.progression = Math.round(pourcentage)
					}
				}.bind(this)
				xhr.open('POST', this.$parent.$parent.hote + 'inc/televerser_audio.php', true)
				xhr.send(formData)
			} else {
				this.$parent.$parent.message = this.$t('tailleMax', { taille: 1 })
			}
		},
		blobEnMp3 () {
			return new Promise(function (resolve) {
				const audioContext = new AudioContext()
				const fileReader = new FileReader()
				fileReader.onloadend = function () {
					const arrayBuffer = fileReader.result
					audioContext.decodeAudioData(arrayBuffer, function (audioBuffer) {
						resolve(this.transcoder(audioBuffer))
					}.bind(this))
				}.bind(this)
				fileReader.readAsArrayBuffer(this.blob)
			}.bind(this))
		},
		selectionnerAudio (event) {
			this.blob = event.target.files[0]
			this.audio = URL.createObjectURL(event.target.files[0])
		},
		enregistrerAudio () {
			if (!navigator.mediaDevices || !navigator.mediaDevices?.enumerateDevices) {
				this.$parent.$parent.message = this.$t('enregistrementNonSupporte')
			} else {
				navigator.mediaDevices.enumerateDevices().then(function (devices) {
					let entreeAudio = false
					for (const device of devices) {
						if (device.kind === 'audioinput') {
							entreeAudio = true
							break
						}
					}
					if (entreeAudio === true) {
						if (!navigator.mediaDevices?.getUserMedia) {
							this.$parent.$parent.message = this.$t('enregistrementNonSupporte')
						} else {
							navigator.mediaDevices.getUserMedia({ audio: true }).then(function (flux) {
								this.titreAjouterAudio = this.$t('enregistrementAudio')
								this.mediaRecorder = new MediaRecorder(flux)
								this.mediaRecorder.start()
								this.visualiser(flux)
								this.enregistrement = true
								const temps = Date.now()
								this.intervalle = setInterval(function () {
									const delta = Date.now() - temps
									let secondes = Math.floor((delta / 1000) % 60)
									let minutes = Math.floor((delta / 1000 / 60) << 0)
									if (secondes < 10) {
										secondes = '0' + secondes
									}
									if (minutes < 10) {
										minutes = '0' + minutes
									}
									this.dureeEnregistrement = minutes + ' : ' + secondes
									if (this.dureeEnregistrement === '00 : 10') {
										this.arreterEnregistrementAudio()
									}
								}.bind(this), 100)
								this.mediaRecorder.onstop = function () {
									if (this.flux.length > 0) {
										this.blob = new Blob(this.flux, { type: 'audio/wav' })
										this.enregistrement = false
										this.audio = URL.createObjectURL(this.blob)
										this.mediaRecorder = ''
										this.flux = []
										this.contexte = ''
										this.titreAjouterAudio = this.$t('ajouterAudio')
										this.dureeEnregistrement = '00 : 00'
										if (this.intervalle !== '') {
											clearInterval(this.intervalle)
											this.intervalle = ''
										}
									}
								}.bind(this)
								this.mediaRecorder.ondataavailable = function (e) {
									this.flux.push(e.data)
								}.bind(this)
							}.bind(this)).catch(function () {
								this.enregistrement = false
								this.mediaRecorder = ''
								this.flux = []
								this.contexte = ''
								this.$parent.$parent.message = this.$t('erreurMicro')
							}.bind(this))
						}
					} else {
						this.$parent.$parent.message = this.$t('aucuneEntreeAudio')
					}
				}.bind(this))
			}
		},
		arreterEnregistrementAudio () {
			this.mediaRecorder.stop()
		},
		visualiser (flux) {
			if (!this.contexte) {
				this.contexte = new AudioContext()
			}
			const source = this.contexte.createMediaStreamSource(flux)
			const analyser = this.contexte.createAnalyser()
			analyser.fftSize = 2048
			const bufferLength = analyser.frequencyBinCount
			const dataArray = new Uint8Array(bufferLength)
			source.connect(analyser)

			this.$nextTick(function () {
				draw()
			})

			function draw () {
				if (document.querySelector('#visualisation')) {
					const canvas = document.querySelector('#visualisation')
					const canvasCtx = canvas.getContext('2d')
					const largeur = document.querySelector('#enregistrement').offsetWidth
					const hauteur = canvas.height
					canvas.width = largeur
					requestAnimationFrame(draw)
					analyser.getByteTimeDomainData(dataArray)

					canvasCtx.fillStyle = '#eeeeee'
					canvasCtx.fillRect(0, 0, largeur, hauteur)
					canvasCtx.lineWidth = 2
					canvasCtx.strokeStyle = '#000000'
					canvasCtx.beginPath()

					const sliceWidth = largeur * 1.0 / bufferLength
					let x = 0

					for (let i = 0; i < bufferLength; i++) {
						const v = dataArray[i] / 128.0
						const y = v * hauteur / 2
						if (i === 0) {
							canvasCtx.moveTo(x, y)
						} else {
							canvasCtx.lineTo(x, y)
						}
						x += sliceWidth
					}
					canvasCtx.lineTo(canvas.width, canvas.height / 2)
					canvasCtx.stroke()
				}
			}
		},
                lireAudio (event, audio) {
                        event.preventDefault()
                        event.stopPropagation()
                        if (this.audio !== '' && this.lecture) {
                                this.audio.pause()
                                this.lecture = false
                        } else if (this.audio !== '' && !this.lecture) {
                                this.audio.play()
                                this.lecture = true
                        } else if (this.audio === '') {
                                this.lecture = true
                                this.audio = new Audio(audio)
                                this.audio.play()
                                this.audio.onended = function() {
                                        this.lecture = false
                                        this.audio = ''
                                }.bind(this)
                        }
                },
                lireAudioDepuisClavier (audio) {
                        const evenement = {
                                preventDefault () {},
                                stopPropagation () {}
                        }
                        this.lireAudio(evenement, audio)
                },
                recupererAudioCarteActive () {
                        if (this.cartes.length === 0 || typeof this.navigationCartes !== 'number') {
                                return ''
                        }
                        const carte = this.cartes[this.navigationCartes]
                        if (!carte) {
                                return ''
                        }
                        if (this.recto === true && carte.recto && carte.recto.audio !== '') {
                                return this.definirLienMedia(carte.recto.audio, '')
                        } else if (this.recto === false && carte.verso && carte.verso.audio !== '') {
                                return this.definirLienMedia(carte.verso.audio, '')
                        } else if (carte.recto && carte.recto.audio !== '') {
                                return this.definirLienMedia(carte.recto.audio, '')
                        } else if (carte.verso && carte.verso.audio !== '') {
                                return this.definirLienMedia(carte.verso.audio, '')
                        }
                        return ''
                },
                afficherAudio (index, type, audio) {
                        this.carteIndex = index
                        this.carteType = type
                        this.elementPrecedent = (document.activeElement || document.body)
                        if (audio === '') {
				this.titreAjouterAudio = this.$t('ajouterAudio')
				this.modale = 'ajouter-audio'
				this.$nextTick(function () {
					document.querySelector('#enregistrer').focus()
				})
			} else {
				this.audio = audio
				this.modale = 'audio'
				this.$nextTick(function () {
					document.querySelector('#modale-audio audio').focus()
				})
			}
		},
		fermerModaleAudio () {
			this.modale = ''
			this.audio = ''
			this.carteIndex = ''
			this.carteType = ''
			this.gererFocus()
		},
		fermerModaleAjouterAudio () {
			this.modale = ''
			this.audio = ''
			this.blob = ''
			this.enregistrement = false
			this.mediaRecorder = ''
			this.flux = []
			this.contexte = ''
			this.titreAjouterAudio = this.$t('ajouterAudio')
			this.dureeEnregistrement = '00 : 00'
			this.carteIndex = ''
			this.carteType = ''
			if (this.intervalle !== '') {
				clearInterval(this.intervalle)
				this.intervalle = ''
			}
			this.transcodage = false
			this.gererFocus()
		},
		supprimerAudio (index, type) {
			this.fermerModaleAudio()
			this.$parent.$parent.chargement = true
			const cartes = JSON.parse(JSON.stringify(this.cartes))
			let audio = ''
			if (cartes[index][type].audio !== '' && this.verifierLien(cartes[index][type].audio) === false) {
				audio = cartes[index][type].audio
			}
			cartes[index][type].audio = ''
			const xhr = new XMLHttpRequest()
			xhr.onload = function () {
				if (xhr.readyState === xhr.DONE && xhr.status === 200) {
					this.$parent.$parent.chargement = false
					if (xhr.responseText === 'contenu_inexistant') {
						document.title = 'Digiflashcards by La Digitale'
						this.$router.push('/')
					} else if (xhr.responseText === 'erreur') {
						this.$parent.$parent.message = this.$t('erreurServeur')
					} else if (xhr.responseText === 'non_autorise') {
						this.$parent.$parent.message = this.$t('actionNonAutorisee')
					} else if (xhr.responseText === 'serie_modifiee') {
						this.cartes = cartes
					}
				} else {
					this.$parent.$parent.chargement = false
					this.$parent.$parent.message = this.$t('erreurServeur')
				}
			}.bind(this)
			xhr.open('POST', this.$parent.$parent.hote + 'inc/modifier_serie.php', true)
			xhr.setRequestHeader('Content-type', 'application/json')
			const json = { serie: this.id, donnees: JSON.stringify({ cartes: cartes, options: this.options }), audio: audio }
			xhr.send(JSON.stringify(json))
			this.supprimerDonneesExercices()
		},
		modifierPositionCarte (event) {
			if (this.cartes.length > 1 && event.oldIndex !== event.newIndex) {
				this.$parent.$parent.chargementTransparent = true
				const xhr = new XMLHttpRequest()
				xhr.onload = function () {
					if (xhr.readyState === xhr.DONE && xhr.status === 200) {
						this.$parent.$parent.chargementTransparent = false
						if (xhr.responseText === 'contenu_inexistant') {
							document.title = 'Digiflashcards by La Digitale'
							this.$router.push('/')
						} else if (xhr.responseText === 'erreur') {
							this.$parent.$parent.message = this.$t('erreurServeur')
						} else if (xhr.responseText === 'non_autorise') {
							this.$parent.$parent.message = this.$t('actionNonAutorisee')
						}
					} else {
						this.$parent.$parent.chargementTransparent = false
						this.$parent.$parent.message = this.$t('erreurServeur')
					}
				}.bind(this)
				xhr.open('POST', this.$parent.$parent.hote + 'inc/modifier_serie.php', true)
				xhr.setRequestHeader('Content-type', 'application/json')
				const json = { serie: this.id, donnees: JSON.stringify({ cartes: this.cartes, options: this.options }) }
				xhr.send(JSON.stringify(json))
			}
		},
		masquerCarte (index) {
			if (this.cartes.length > 1) {
				this.cartes[index].masque = true
				this.cartesOriginales = JSON.parse(JSON.stringify(this.cartes))
				this.$parent.$parent.chargementTransparent = true
				const xhr = new XMLHttpRequest()
				xhr.onload = function () {
					if (xhr.readyState === xhr.DONE && xhr.status === 200) {
						this.$parent.$parent.chargementTransparent = false
						if (xhr.responseText === 'contenu_inexistant') {
							document.title = 'Digiflashcards by La Digitale'
							this.$router.push('/')
						} else if (xhr.responseText === 'erreur') {
							this.$parent.$parent.message = this.$t('erreurServeur')
						} else if (xhr.responseText === 'non_autorise') {
							this.$parent.$parent.message = this.$t('actionNonAutorisee')
						}
					} else {
						this.$parent.$parent.chargementTransparent = false
						this.$parent.$parent.message = this.$t('erreurServeur')
					}
				}.bind(this)
				xhr.open('POST', this.$parent.$parent.hote + 'inc/modifier_serie.php', true)
				xhr.setRequestHeader('Content-type', 'application/json')
				const json = { serie: this.id, donnees: JSON.stringify({ cartes: this.cartes, options: this.options }) }
				xhr.send(JSON.stringify(json))
			}
		},
		afficherCarte (index) {
			this.cartes[index].masque = false
			this.$parent.$parent.chargementTransparent = true
				const xhr = new XMLHttpRequest()
				xhr.onload = function () {
					if (xhr.readyState === xhr.DONE && xhr.status === 200) {
						this.$parent.$parent.chargementTransparent = false
						if (xhr.responseText === 'contenu_inexistant') {
							document.title = 'Digiflashcards by La Digitale'
							this.$router.push('/')
						} else if (xhr.responseText === 'erreur') {
							this.$parent.$parent.message = this.$t('erreurServeur')
						} else if (xhr.responseText === 'non_autorise') {
							this.$parent.$parent.message = this.$t('actionNonAutorisee')
						}
					} else {
						this.$parent.$parent.chargementTransparent = false
						this.$parent.$parent.message = this.$t('erreurServeur')
					}
				}.bind(this)
				xhr.open('POST', this.$parent.$parent.hote + 'inc/modifier_serie.php', true)
				xhr.setRequestHeader('Content-type', 'application/json')
				const json = { serie: this.id, donnees: JSON.stringify({ cartes: this.cartes, options: this.options }) }
				xhr.send(JSON.stringify(json))
		},
		afficherSupprimerCarte (index) {
			if (this.cartes.length > 2) {
				this.carteIndex = index
				this.elementPrecedent = (document.activeElement || document.body)
				this.modale = 'suppression-carte'
				this.$nextTick(function () {
					document.querySelector('.modale .bouton').focus()
				})
			}
		},
		fermerModaleSupprimerCarte () {
			this.modale = ''
			this.carteIndex = ''
			this.gererFocus()
		},
		supprimerCarte () {
			this.modale = ''
			this.$parent.$parent.chargement = true
			const cartes = JSON.parse(JSON.stringify(this.cartes))
			const index = this.carteIndex
			const fichiers = []
			if (cartes[index].recto.image !== '' && this.verifierLien(cartes[index].recto.image) === false) {
				fichiers.push(cartes[index].recto.image)
				fichiers.push('vignette_' + cartes[index].recto.image)
			}
			if (cartes[index].recto.audio !== '' && this.verifierLien(cartes[index].recto.audio) === false) {
				fichiers.push(cartes[index].recto.audio)
			}
			if (cartes[index].verso.image !== '' && this.verifierLien(cartes[index].verso.image) === false) {
				fichiers.push(cartes[index].verso.image)
				fichiers.push('vignette_' + cartes[index].verso.image)
			}
			if (cartes[index].verso.audio !== '' && this.verifierLien(cartes[index].verso.audio) === false) {
				fichiers.push(cartes[index].verso.audio)
			}
			cartes.splice(this.carteIndex, 1)
			const xhr = new XMLHttpRequest()
			xhr.onload = function () {
				if (xhr.readyState === xhr.DONE && xhr.status === 200) {
					this.$parent.$parent.chargement = false
					if (xhr.responseText === 'contenu_inexistant') {
						document.title = 'Digiflashcards by La Digitale'
						this.$router.push('/')
					} else if (xhr.responseText === 'erreur') {
						this.$parent.$parent.message = this.$t('erreurServeur')
					} else if (xhr.responseText === 'non_autorise') {
						this.$parent.$parent.message = this.$t('actionNonAutorisee')
					} else if (xhr.responseText === 'serie_modifiee') {
						this.cartes = cartes
						this.carteIndex = ''
						this.$parent.$parent.notification = this.$t('carteSupprimee')
					}
				} else {
					this.$parent.$parent.chargement = false
					this.carteIndex = ''
					this.$parent.$parent.message = this.$t('erreurServeur')
				}
			}.bind(this)
			xhr.open('POST', this.$parent.$parent.hote + 'inc/modifier_serie.php', true)
			xhr.setRequestHeader('Content-type', 'application/json')
			const json = { serie: this.id, donnees: JSON.stringify({ cartes: cartes, options: this.options }), fichiers: JSON.stringify(fichiers) }
			xhr.send(JSON.stringify(json))
			this.supprimerDonneesExercices()
		},
		modifierCartesMemorisees (id) {
			this.$parent.$parent.chargement = true
			let ajout = true
			if (!this.cartesMemorisees.includes(id)) {
				this.cartesMemorisees.push(id)
			} else {
				const index = this.cartesMemorisees.indexOf(id)
				this.cartesMemorisees.splice(index, 1)
				ajout = false
			}
			localStorage.setItem('digiflashcards_cartes_memorisees_' + this.id, JSON.stringify(this.cartesMemorisees))
			setTimeout(function () {
				if (ajout === true) {
					this.$parent.$parent.notification = this.$t('carteMemorisee')
				} else {
					this.$parent.$parent.notification = this.$t('carteNonMemorisee')
				}
				this.$parent.$parent.chargement = false
			}.bind(this), 200)
		},
		definirExercicesQuiz () {
			const cartes = []
			const copieCartes = JSON.parse(JSON.stringify(this.cartes))
			copieCartes.forEach(function (item) {
				if ((item.recto.hasOwnProperty('texte') && item.recto.hasOwnProperty('image') && item.recto.hasOwnProperty('audio') && item.verso.hasOwnProperty('texte') && item.verso.hasOwnProperty('image') && item.verso.hasOwnProperty('audio')) && (item.recto.texte.trim() !== '' || item.recto.image.trim() !== '' || item.recto.audio.trim() !== '') && (item.verso.texte.trim() !== '' || item.verso.image.trim() !== '' || item.verso.audio.trim() !== '')) {
					if (item.recto.texte.includes('|')) {
						item.recto.texte = item.recto.texte.split('|')[Math.floor(Math.random() * item.recto.texte.split('|').length)]
					}
					if (item.verso.texte.includes('|')) {
						item.verso.texte = item.verso.texte.split('|')[Math.floor(Math.random() * item.verso.texte.split('|').length)]
					}
					cartes.push(item)
				}
			})
			const cartesExercice = this.melangerEntrees(cartes)
			const donnees = []
			cartesExercice.forEach(function (item) {
				let indexItem = ''
				let cartesSansItem = []
				const copieCartesSansItem = JSON.parse(JSON.stringify(cartes))
				copieCartesSansItem.forEach(function (item) {
					if ((item.recto.texte.trim() !== '' || item.recto.image.trim() !== '' || item.recto.audio.trim() !== '') && (item.verso.texte.trim() !== '' || item.verso.image.trim() !== '' || item.verso.audio.trim() !== '')) {
						cartesSansItem.push(item)
					}
				})
				cartesSansItem = this.melangerEntrees(cartesSansItem)
				cartesSansItem.forEach(function (obj, index) {
					if (obj.recto.texte === item.recto.texte && obj.recto.image === item.recto.image && obj.recto.audio === item.recto.audio) {
						obj.correct = true
						indexItem = index
					} else {
						obj.correct = false
					}
					obj.reponse = false
					obj.repondu = false
				})
				const liste = []
				for (let i = 0; i <= cartes.length; i++) {
					if (i !== indexItem) {
						liste.push(i)
					}
				}
				liste.splice(0, 3)
				for (let j = liste.length - 1; j >= 0; j--) {
					cartesSansItem.splice(liste[j], 1)
				}
				const items = this.melangerEntrees(cartesSansItem)
				donnees.push(items)
			}.bind(this))
			if (cartesExercice.length > 20) {
				this.exercicesQuiz = donnees.slice(0, -(cartesExercice.length - 20))
				localStorage.setItem('digiflashcards_quiz_' + this.id, JSON.stringify(donnees.slice(0, -(cartesExercice.length - 20))))
			} else if (cartesExercice.length > 4) {
				this.exercicesQuiz = donnees
				localStorage.setItem('digiflashcards_quiz_' + this.id, JSON.stringify(donnees))
			}
		},
		afficherQuestionQuizPrecedente () {
			this.$parent.$parent.chargementTransparent = true
			if (this.navigationQuiz > 0) {
				this.navigationQuiz--
			} else {
				this.navigationQuiz = this.exercicesQuiz.length - 1
			}
			if (this.audio !== '') {
				this.audio.pause()
				this.audio = ''
				this.lecture = false
				this.lectureQuiz = ''
			}
			setTimeout(function () {
				imagesLoaded('#exercices', function () {
					this.$parent.$parent.chargementTransparent = false
				}.bind(this))
			}.bind(this), 200)
		},
		afficherQuestionQuizSuivante () {
			this.$parent.$parent.chargementTransparent = true
			if (this.navigationQuiz < this.exercicesQuiz.length - 1) {
				this.navigationQuiz++
			} else {
				this.navigationQuiz = 0
			}
			if (this.audio !== '') {
				this.audio.pause()
				this.audio = ''
				this.lecture = false
				this.lectureQuiz = ''
			}
			setTimeout(function () {
				imagesLoaded('#exercices', function () {
					this.$parent.$parent.chargementTransparent = false
				}.bind(this))
			}.bind(this), 200)
		},
		lireAudioQuiz (event, index, audio) {
			event.preventDefault()
			event.stopPropagation()
			if (this.audio !== '' && this.lectureQuiz === index && this.audio.paused) {
				this.audio.play()
				this.lectureQuiz = index
			} else if (this.audio !== '' && this.lectureQuiz === index && !this.audio.paused) {
				this.audio.pause()
				this.lectureQuiz = ''
			} else {
				this.lectureQuiz = index
				this.audio = new Audio(audio)
				this.audio.play()
				this.audio.onended = function() {
					this.lectureQuiz = ''
					this.audio = ''
				}.bind(this)
			}
		},
		verifierQuiz () {
			const input = document.querySelector('#reponses_' + this.navigationQuiz + ' input[type=radio]:checked')
			if (input) {
				const reponse = input.value
				const index = parseInt(input.getAttribute('data-index'))
				if (JSON.parse(reponse) === true) {
					const correct = new Audio('./static/fx/correct.mp3')
					correct.play()
				} else {
					const incorrect = new Audio('./static/fx/incorrect.mp3')
					incorrect.play()
				}
				this.exercicesQuiz[this.navigationQuiz][index].reponse = true
				this.exercicesQuiz[this.navigationQuiz].forEach(function (item) {
					item.repondu = true
				})
				localStorage.setItem('digiflashcards_quiz_' + this.id, JSON.stringify(this.exercicesQuiz))
				if (this.verifierReponsesQuiz() === this.exercicesQuiz.length) {
					this.afficherScoreQuiz()
					if (this.definirScoreQuiz() > 79) {
						this.lancerConfettis()
					}
				}
			}
		},
		afficherScoreQuiz () {
			this.elementPrecedent = (document.activeElement || document.body)
			this.modale = 'score-quiz'
			this.$nextTick(function () {
				document.querySelector('.conteneur-modale.score .score').focus()
			})
		},
		verifierReponsesQuiz () {
			let reponses = 0
			this.exercicesQuiz.forEach(function (items) {
				items.forEach(function (item) {
					if (item.reponse) {
						reponses++
					}
				})
			})
			return reponses
		},
		definirScoreQuiz () {
			let correct = 0
			this.exercicesQuiz.forEach(function (items) {
				items.forEach(function (item) {
					if (item.reponse && item.correct) {
						correct++
					}
				})
			})
			return Math.round((correct / this.exercicesQuiz.length) * 100)
		},
		reinitialiserQuiz () {
			this.$parent.$parent.chargement = true
			if (localStorage.getItem('digiflashcards_quiz_' + this.id)) {
				localStorage.removeItem('digiflashcards_quiz_' + this.id)
				this.navigationQuiz = 0
				this.definirExercicesQuiz()
			}
			setTimeout(function () {
				this.$parent.$parent.chargement = false
			}.bind(this), 200)
		},
		definirExercicesEcrire () {
			const cartes = []
			const copieCartes = JSON.parse(JSON.stringify(this.cartes))
			copieCartes.forEach(function (item) {
				if (item.recto.hasOwnProperty('texte') && item.recto.hasOwnProperty('image') && item.recto.hasOwnProperty('audio') && item.verso.hasOwnProperty('texte') && item.verso.hasOwnProperty('image') && item.verso.hasOwnProperty('audio') && this.options.ecrire === 'definition' && (item.verso.texte.trim() !== '' && !item.verso.texte.includes('$$') && (item.recto.texte.trim() !== '' || item.recto.image.trim() !== '' || item.recto.audio.trim() !== ''))) {
					if (item.recto.texte.includes('|')) {
						item.recto.texte = item.recto.texte.split('|')[Math.floor(Math.random() * item.recto.texte.split('|').length)].trim()
					}
					item.correct = ''
					item.reponse = ''
					item.valide = false
					cartes.push(item)
				} else if (item.recto.hasOwnProperty('texte') && item.recto.hasOwnProperty('image') && item.recto.hasOwnProperty('audio') && item.verso.hasOwnProperty('texte') && item.verso.hasOwnProperty('image') && item.verso.hasOwnProperty('audio') && this.options.ecrire === 'terme' && (item.recto.texte.trim() !== '' && !item.recto.texte.includes('$$') && (item.verso.texte.trim() !== '' || item.verso.image.trim() !== '' || item.verso.audio.trim() !== ''))) {
					if (item.verso.texte.includes('|')) {
						item.verso.texte = item.verso.texte.split('|')[Math.floor(Math.random() * item.verso.texte.split('|').length)].trim()
					}
					item.correct = ''
					item.reponse = ''
					item.valide = false
					cartes.push(item)
				}
			}.bind(this))
			const cartesExercice = this.melangerEntrees(cartes)
			if (cartesExercice.length > 20) {
				this.exercicesEcrire = cartesExercice.slice(0, -(cartesExercice.length - 20))
				localStorage.setItem('digiflashcards_ecrire_' + this.id, JSON.stringify(cartesExercice.slice(0, -(cartesExercice.length - 20))))
			} else if (cartesExercice.length > 4) {
				this.exercicesEcrire = cartesExercice
				localStorage.setItem('digiflashcards_ecrire_' + this.id, JSON.stringify(cartesExercice))
			}
		},
		afficherQuestionEcrirePrecedente () {
			this.$parent.$parent.chargementTransparent = true
			if (this.navigationEcrire > 0) {
				this.navigationEcrire--
			} else {
				this.navigationEcrire = this.exercicesEcrire.length - 1
			}
			if (this.audio !== '') {
				this.audio.pause()
				this.audio = ''
				this.lecture = false
			}
			setTimeout(function () {
				imagesLoaded('#exercices', function () {
					this.$parent.$parent.chargementTransparent = false
					this.$nextTick(function () {
						document.querySelector('#champ_' + this.navigationEcrire).focus()
					}.bind(this))
				}.bind(this))
			}.bind(this), 200)
		},
		afficherQuestionEcrireSuivante () {
			this.$parent.$parent.chargementTransparent = true
			if (this.navigationEcrire < this.exercicesEcrire.length - 1) {
				this.navigationEcrire++
			} else {
				this.navigationEcrire = 0
			}
			if (this.audio !== '') {
				this.audio.pause()
				this.audio = ''
				this.lecture = false
			}
			setTimeout(function () {
				imagesLoaded('#exercices', function () {
					this.$parent.$parent.chargementTransparent = false
					this.$nextTick(function () {
						document.querySelector('#champ_' + this.navigationEcrire).focus()
					}.bind(this))
				}.bind(this))
			}.bind(this), 200)
		},
		verifierEcrire () {
			const reponse = document.querySelector('#champ_' + this.navigationEcrire).value
			let reponseFormatee = reponse.trim().replace(/\s+/g, ' ')
			const exercicesEcrire = JSON.parse(JSON.stringify(this.exercicesEcrire))
			const texteRecto = []
			const texteVerso = []
			if (reponseFormatee !== '') {
				if (this.options.casse === false) {
					reponseFormatee = reponseFormatee.toLowerCase()
					const itemsRecto = exercicesEcrire[this.navigationEcrire].recto.texte.split('|')
					itemsRecto.forEach(function (item) {
						texteRecto.push(stripTags(item.replace(/\s+/g, ' ').replace(/\r?\n|\r/g, '').toLowerCase().trim()))
					})
					const itemsVerso = exercicesEcrire[this.navigationEcrire].verso.texte.split('|')
					itemsVerso.forEach(function (item) {
						texteVerso.push(stripTags(item.replace(/\s+/g, ' ').replace(/\r?\n|\r/g, '').toLowerCase().trim()))
					})
				} else {
					const itemsRecto = exercicesEcrire[this.navigationEcrire].recto.texte.split('|')
					itemsRecto.forEach(function (item) {
						texteRecto.push(stripTags(item.replace(/\s+/g, ' ').replace(/\r?\n|\r/g, '').trim()))
					})
					const itemsVerso = exercicesEcrire[this.navigationEcrire].verso.texte.split('|')
					itemsVerso.forEach(function (item) {
						texteVerso.push(stripTags(item.replace(/\s+/g, ' ').replace(/\r?\n|\r/g, '').trim()))
					})
				}
				if ((this.options.ecrire === 'definition' && texteVerso.includes(reponseFormatee)) || (this.options.ecrire === 'terme' && texteRecto.includes(reponseFormatee))) {
					this.exercicesEcrire[this.navigationEcrire].correct = true
					const correct = new Audio('./static/fx/correct.mp3')
					correct.play()
				} else {
					this.exercicesEcrire[this.navigationEcrire].correct = false
					const incorrect = new Audio('./static/fx/incorrect.mp3')
					incorrect.play()
				}
				this.exercicesEcrire[this.navigationEcrire].reponse = reponse
				localStorage.setItem('digiflashcards_ecrire_' + this.id, JSON.stringify(this.exercicesEcrire))
				if (this.verifierReponsesEcrire() === this.exercicesEcrire.length) {
					this.afficherScoreEcrire()
					if (this.definirScoreEcrire() > 79) {
						this.lancerConfettis()
					}
				}
			}
		},
		afficherScoreEcrire () {
			this.elementPrecedent = (document.activeElement || document.body)
			this.modale = 'score-ecrire'
			this.$nextTick(function () {
				document.querySelector('.conteneur-modale.score .score').focus()
			})
		},
		verifierReponsesEcrire () {
			let reponses = 0
			this.exercicesEcrire.forEach(function (item) {
				if (item.reponse !== '') {
					reponses++
				}
			})
			return reponses
		},
		definirScoreEcrire () {
			let correct = 0
			this.exercicesEcrire.forEach(function (item) {
				if (item.correct) {
					correct++
				}
			})
			return Math.round((correct / this.exercicesEcrire.length) * 100)
		},
		reinitialiserEcrire () {
			this.$parent.$parent.chargement = true
			if (localStorage.getItem('digiflashcards_ecrire_' + this.id)) {
				localStorage.removeItem('digiflashcards_ecrire_' + this.id)
				this.navigationEcrire = 0
				this.definirExercicesEcrire()
			}
			setTimeout(function () {
				this.$parent.$parent.chargement = false
			}.bind(this), 200)
		},
		definirExercicesAppariement () {
			const cartes = {}
			cartes.gauche = []
			cartes.droite = []
			cartes.reponse = []
			const copieCartes = JSON.parse(JSON.stringify(this.cartes))
			copieCartes.forEach(function (item) {
				if ((item.recto.hasOwnProperty('texte') && item.recto.hasOwnProperty('image') && item.recto.hasOwnProperty('audio') && item.verso.hasOwnProperty('texte') && item.verso.hasOwnProperty('image') && item.verso.hasOwnProperty('audio')) && (item.recto.texte.trim() !== '' || item.recto.image.trim() !== '' || item.recto.audio.trim() !== '') && (item.verso.texte.trim() !== '' || item.verso.image.trim() !== '' || item.verso.audio.trim() !== '')) {
					if (item.recto.texte.includes('|')) {
						const texteRecto = item.recto.texte.split('|')[Math.floor(Math.random() * item.recto.texte.split('|').length)]
						item.recto.texte = stripTags(texteRecto.replace(/\s+/g, ' ').replace(/\r?\n|\r/g, '').trim())
					}
					if (item.verso.texte.includes('|')) {
						const texteVerso = item.verso.texte.split('|')[Math.floor(Math.random() * item.verso.texte.split('|').length)]
						item.verso.texte = stripTags(texteVerso.replace(/\s+/g, ' ').replace(/\r?\n|\r/g, '').trim())
					}
					item.recto.id = item.id
					item.verso.id = item.id
					if (this.options.appariement === 'definition') {
						cartes.gauche.push(item.recto)
						cartes.droite.push(item.verso)
					} else {
						cartes.gauche.push(item.verso)
						cartes.droite.push(item.recto)
					}
				}
			}.bind(this))
			if (cartes.gauche.length > 20) {
				cartes.droite = this.melangerEntrees(cartes.droite)
				cartes.droite = cartes.droite.slice(0, -(cartes.droite.length - 20))
				const cartesGauches = []
				cartes.droite.forEach(function (itemDroite) {
					cartes.gauche.forEach(function (itemGauche) {
						if (itemDroite.id === itemGauche.id) {
							cartesGauches.push(itemGauche)
						}
					})
				})
				cartes.gauche = cartesGauches
				cartes.droite = this.melangerEntrees(cartes.droite)
				this.exercicesAppariement = cartes
				localStorage.setItem('digiflashcards_appariement_' + this.id, JSON.stringify(cartes))
			} else if (cartes.gauche.length > 4) {
				cartes.droite = this.melangerEntrees(cartes.droite)
				this.exercicesAppariement = cartes
				localStorage.setItem('digiflashcards_appariement_' + this.id, JSON.stringify(cartes))
			}
		},
		supprimerPaire (index) {
			this.exercicesAppariement.reponse.splice(index, 1)
			this.$nextTick(function () {
				this.redimensionnerAppariement()
				window.MathJax.typeset()
				localStorage.setItem('digiflashcards_appariement_' + this.id, JSON.stringify(this.exercicesAppariement))
			}.bind(this))
		},
		selectionnerItemAppariement (index) {
			this.indexAppariement = index
		},
		envoyerReponseAppariement (id) {
			if (this.indexAppariement !== -1) {
				this.exercicesAppariement.reponse.push([this.exercicesAppariement.gauche[this.indexAppariement].id, id])
				this.indexAppariement = -1
				this.$nextTick(function () {
					this.redimensionnerAppariement()
					window.MathJax.typeset()
					localStorage.setItem('digiflashcards_appariement_' + this.id, JSON.stringify(this.exercicesAppariement))
					const total = this.exercicesAppariement.gauche.length
					let reponses = 0
					this.exercicesAppariement.reponse.forEach(function (reponse) {
						if (reponse[0] === reponse[1]) {
							reponses++
						}
					})
					if (reponses === total) {
						this.afficherScoreAppariement()
						if (this.definirScoreAppariement() > 79) {
							this.lancerConfettis()
						}
					}
				}.bind(this))
			}
		},
		afficherScoreAppariement () {
			this.elementPrecedent = (document.activeElement || document.body)
			this.modale = 'score-appariement'
			this.$nextTick(function () {
				document.querySelector('.conteneur-modale.score .score').focus()
			})
		},
		lireAudioAppariement (event, index, audio) {
			event.preventDefault()
			event.stopPropagation()
			if (this.audio !== '' && this.lectureAppariement === index && this.audio.paused) {
				this.audio.play()
				this.lectureAppariement = index
			} else if (this.audio !== '' && this.lectureAppariement === index && !this.audio.paused) {
				this.audio.pause()
				this.lectureAppariement = ''
			} else {
				this.lectureAppariement = index
				this.audio = new Audio(audio)
				this.audio.play()
				this.audio.onended = function() {
					this.lectureAppariement = ''
					this.audio = ''
				}.bind(this)
			}
		},
		verifierReponsesAppariement () {
			let reponses = 0
			this.exercicesAppariement.reponse.forEach(function () {
				reponses++
			})
			return reponses
		},
		definirScoreAppariement () {
			let correct = 0
			this.exercicesAppariement.reponse.forEach(function (reponse) {
				if (reponse[0] === reponse[1]) {
					correct++
				}
			})
			return Math.round((correct / this.exercicesAppariement.gauche.length) * 100)
		},
		reinitialiserAppariement () {
			this.$parent.$parent.chargement = true
			if (localStorage.getItem('digiflashcards_appariement_' + this.id)) {
				localStorage.removeItem('digiflashcards_appariement_' + this.id)
				this.indexAppariement = -1
				this.definirExercicesAppariement()
				this.$nextTick(function () {
					this.redimensionnerAppariement()
				}.bind(this))
			}
			setTimeout(function () {
				this.$parent.$parent.chargement = false
			}.bind(this), 200)
		},
		definirHauteurPaires () {
			const items = document.querySelectorAll('.appariement li.item')
			const heights = []
			items.forEach(function (item) {
				const height = item.clientHeight
				heights.push(height)
			})
			const height = Math.max.apply(Math, heights)
			items.forEach(function (item) {
				item.style.height = height + 'px'
			})
		},
		redimensionnerAppariement () {
			const items = document.querySelectorAll('.appariement li.item')
			items.forEach(function (item) {
				if (item.hasAttribute('style')) {
					item.removeAttribute('style')
				}
			})
			this.definirHauteurPaires()
		},
		ouvrirModaleSerie () {
			this.elementPrecedent = (document.activeElement || document.body)
			this.modale = 'serie'
			this.$nextTick(function () {
				document.querySelector('.modale .fermer').focus()
			})
		},
		fermerModaleSerie () {
			this.modale = ''
			this.question = ''
			this.reponse = ''
			this.nouveaunom = ''
			this.nouvellequestion = ''
			this.nouvellereponse = ''
			this.gererFocus()
		},
		ouvrirModaleNomSerie () {
			this.nouveaunom = this.nom
			this.modale = 'modifier-nom'
			this.$nextTick(function () {
				document.querySelector('.modale input').focus()
			})
		},
		fermerModaleNomSerie () {
			this.modale = ''
			this.nouveaunom = ''
			this.gererFocus()
		},
		modifierNomSerie () {
			if (this.nouveaunom !== '' && this.nom !== this.nouveaunom) {
				this.$parent.$parent.chargement = true
				const xhr = new XMLHttpRequest()
				xhr.onload = function () {
					if (xhr.readyState === xhr.DONE && xhr.status === 200) {
						this.$parent.$parent.chargement = false
						if (xhr.responseText === 'contenu_inexistant') {
							document.title = 'Digiflashcards by La Digitale'
							this.$router.push('/')
						} else if (xhr.responseText === 'erreur') {
							this.$parent.$parent.message = this.$t('erreurServeur')
							this.fermerModaleNomSerie()
						} else if (xhr.responseText === 'non_autorise') {
							this.$parent.$parent.message = this.$t('actionNonAutorisee')
							this.fermerModaleNomSerie()
						} else if (xhr.responseText === 'nom_modifie') {
							this.nom = this.nouveaunom
							this.$parent.$parent.notification = this.$t('nomModifie')
							document.title = this.nom + ' - Digiflashcards by La Digitale'
							this.fermerModaleNomSerie()
						}
					} else {
						this.$parent.$parent.chargement = false
						this.fermerModaleNomSerie()
						this.$parent.$parent.message = this.$t('erreurServeur')
					}
				}.bind(this)
				xhr.open('POST', this.$parent.$parent.hote + 'inc/modifier_nom_serie.php', true)
				xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
				xhr.send('serie=' + this.id + '&nouveaunom=' + this.nouveaunom)
			} else if (this.nouveaunom === '') {
				this.$parent.$parent.message = this.$t('remplirChampNouveauNom')
			}
		},
		ouvrirModaleAccesSerie () {
			this.modale = 'modifier-acces'
			this.$nextTick(function () {
				document.querySelector('.modale select').focus()
			})
		},
		fermerModaleAccesSerie () {
			this.modale = ''
			this.question = ''
			this.reponse = ''
			this.nouvellequestion = ''
			this.nouvellereponse = ''
			this.gererFocus()
		},
		modifierAccesSerie () {
			if (this.question !== '' && this.reponse !== '' && this.nouvellequestion !== '' && this.nouvellereponse !== '') {
				this.$parent.$parent.chargement = true
				const xhr = new XMLHttpRequest()
				xhr.onload = function () {
					if (xhr.readyState === xhr.DONE && xhr.status === 200) {
						this.$parent.$parent.chargement = false
						this.fermerModaleAccesSerie()
						if (xhr.responseText === 'contenu_inexistant') {
							document.title = 'Digiflashcards by La Digitale'
							this.$router.push('/')
						} else if (xhr.responseText === 'erreur') {
							this.$parent.$parent.message = this.$t('erreurServeur')
						} else if (xhr.responseText === 'non_autorise') {
							this.$parent.$parent.message = this.$t('informationsIncorrectes')
						} else if (xhr.responseText === 'acces_modifie') {
							this.$parent.$parent.notification = this.$t('accesModifie')
						}
					} else {
						this.$parent.$parent.chargement = false
						this.fermerModaleAccesSerie()
						this.$parent.$parent.message = this.$t('erreurServeur')
					}
				}.bind(this)
				xhr.open('POST', this.$parent.$parent.hote + 'inc/modifier_acces_serie.php', true)
				xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
				xhr.send('serie=' + this.id + '&question=' + this.question + '&reponse=' + this.reponse + '&nouvellequestion=' + this.nouvellequestion + '&nouvellereponse=' + this.nouvellereponse)
			} else if (this.question === '') {
				this.$parent.$parent.message = this.$t('selectionnerQuestionSecreteActuelle')
			} else if (this.reponse === '') {
				this.$parent.$parent.message = this.$t('indiquerReponseSecreteActuelle')
			} else if (this.nouvellequestion === '') {
				this.$parent.$parent.message = this.$t('selectionnerNouvelleQuestionSecrete')
			} else if (this.nouvellereponse === '') {
				this.$parent.$parent.message = this.$t('indiquerNouvelleReponseSecrete')
			}
		},
		ouvrirModaleConnexion () {
			this.elementPrecedent = (document.activeElement || document.body)
			this.modale = 'connexion'
			this.$nextTick(function () {
				document.querySelector('.modale .fermer').focus()
			})
		},
		fermerModaleConnexion () {
			this.modale = ''
			this.question = ''
			this.reponse = ''
			this.gererFocus()
		},
		debloquerSerie () {
			if (this.question !== '' && this.reponse !== '') {
				this.$parent.$parent.chargement = true
				const xhr = new XMLHttpRequest()
				xhr.onload = function () {
					if (xhr.readyState === xhr.DONE && xhr.status === 200) {
						this.$parent.$parent.chargement = false
						this.fermerModaleConnexion()
						if (xhr.responseText === 'contenu_inexistant') {
							document.title = 'Digiflashcards by La Digitale'
							this.$router.push('/')
						} else if (xhr.responseText === 'erreur') {
							this.$parent.$parent.message = this.$t('erreurServeur')
						} else if (xhr.responseText === 'non_autorise') {
							this.$parent.$parent.message = this.$t('informationsIncorrectes')
						} else if (xhr.responseText === 'serie_debloquee') {
							this.admin = true
							this.vue = 'editeur'
							this.$parent.$parent.notification = this.$t('connexionReussie')
							if (this.pleinEcran) {
								fscreen.exitFullscreen()
								this.pleinEcran = false
							}
							if (this.cartesInversees === true) {
								this.cartesInversees = false
								this.cartes = this.cartesOriginales
							} else if (this.cartesOriginales.length > 0) {
								this.cartes = this.cartesOriginales
							}
							this.verifierCartes()
							document.querySelector('#app').classList.remove('apprenant')
							window.history.replaceState({}, document.title, window.location.href.split('?')[0])
						}
					} else {
						this.$parent.$parent.chargement = false
						this.fermerModaleConnexion()
						this.$parent.$parent.message = this.$t('erreurServeur')
					}
				}.bind(this)
				xhr.open('POST', this.$parent.$parent.hote + 'inc/ouvrir_serie.php', true)
				xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
				xhr.send('serie=' + this.id + '&question=' + this.question + '&reponse=' + this.reponse + '&type=utilisateur')
			} else if (this.question === '') {
				this.$parent.$parent.message = this.$t('selectionnerQuestionSecrete')
			} else if (this.reponse === '') {
				this.$parent.$parent.message = this.$t('remplirReponseSecrete')
			}
		},
		exporterSerie () {
			this.modale = ''
			this.$parent.$parent.chargement = true
			const donnees = { cartes: this.cartes }
			let nom = latinise(this.nom.toLowerCase())
			nom = nom.replace(/ /gi, '-')
			nom = nom.replace(/[^0-9a-z_-]/gi, '')
			if (nom.length > 100) {
				nom = nom.substring(0, 100)
			}
			const zip = new JSZip()
			const fichiers = []
			this.cartes.forEach(function (carte) {
				if (carte.recto.image !== '' && this.verifierLien(carte.recto.image) === false) {
					fichiers.push(carte.recto.image)
				}
				if (carte.recto.audio !== '' && this.verifierLien(carte.recto.audio) === false) {
					fichiers.push(carte.recto.audio)
				}
				if (carte.verso.image !== '' && this.verifierLien(carte.verso.image) === false) {
					fichiers.push(carte.verso.image)
				}
				if (carte.verso.audio !== '' && this.verifierLien(carte.verso.audio) === false) {
					fichiers.push(carte.verso.audio)
				}
			}.bind(this))
			const donneesFichiers = []
			for (const fichier of fichiers) {
				const donneesFichier = new Promise(function (resolve) {
					const xhr = new XMLHttpRequest()
					xhr.onload = function () {
						if (xhr.readyState === xhr.DONE && xhr.status === 200) {
							resolve({ nom: fichier, binaire: this.response })
						} else {
							resolve({ nom: '', binaire: '' })
						}
					}
					xhr.onerror = function () {
						resolve({ nom: '', binaire: '' })
					}
					xhr.open('GET', this.definirRacine() + 'fichiers/' + this.id + '/' + fichier, true)
					xhr.responseType = 'arraybuffer'
					xhr.send()
				}.bind(this))
				donneesFichiers.push(donneesFichier)
			}
			Promise.all(donneesFichiers).then(function (resultat) {
				resultat.forEach(function (item) {
					if (item.nom !== '' && item.binaire !== '') {
						zip.folder('fichiers').file(item.nom, item.binaire, { binary: true })
					}
				})
				zip.file('donnees.json', JSON.stringify(donnees))
				const csv = []
				this.cartes.forEach(function (item) {
					csv.push({ 'recto_texte' : item.recto.texte, 'recto_image': item.recto.image, 'recto_audio' : item.recto.audio, 'verso_texte' : item.verso.texte, 'verso_image' : item.verso.image, 'verso_audio' : item.verso.audio })
				})
				zip.file('donnees.csv', Papa.unparse(csv, {
					header: true,
					transformHeader: true,
					skipEmptyLines: true,
					quoteChar: '"',
					escapeChar: '"',
					delimiter: ",",
				}))
				zip.generateAsync({ type: 'blob' }).then(function (archive) {
					this.$parent.$parent.chargement = false
					saveAs(archive, nom + '_' + new Date().getTime() + '.zip')
					this.$parent.$parent.notification = this.$t('serieExportee')
				}.bind(this))
			}.bind(this))
		},
		ouvrirModaleImporter () {
			this.modale = 'importer'
			this.$nextTick(function () {
				document.querySelector('.modale .fermer').focus()
			})
		},
		importerSerie (event) {
			const fichier = event.target.files[0]
			if (fichier === null || fichier.length === 0) {
				document.querySelector('#importer').value = ''
				return false
			} else {
				this.modale = ''
				this.$parent.$parent.chargement = true
				const donneesFichiers = []
				const jszip = new JSZip()
				jszip.loadAsync(fichier).then(function (archive) {
					if (archive.files['donnees.json'] && archive.files['donnees.json'] !== '') {
						archive.files['donnees.json'].async('string').then(function (donnees) {
							donnees = JSON.parse(donnees)
							let indexFichier = 0
							const fichiers = []
							donnees.cartes.forEach(function (carte, index) {
								if (carte.recto.image !== '' && this.verifierLien(carte.recto.image) === false) {
									fichiers.push(carte.recto.image)
								}
								if (carte.recto.audio !== '' && this.verifierLien(carte.recto.audio) === false) {
									fichiers.push(carte.recto.audio)
								}
								if (carte.verso.image !== '' && this.verifierLien(carte.verso.image) === false) {
									fichiers.push(carte.verso.image)
								}
								if (carte.verso.audio !== '' && this.verifierLien(carte.verso.audio) === false) {
									fichiers.push(carte.verso.audio)
								}
								if (!carte.hasOwnProperty('id')) {
									const id = 'carte-' + (new Date()).getTime() + Math.random().toString(16).slice(12)
									donnees.cartes[index].id = id
								}
							}.bind(this))
							if (fichiers.length === 0 && this.parametreImport === 'remplacer') {
								new Promise(function (resolve) {
									const xhr = new XMLHttpRequest()
									xhr.onload = function () {
										resolve('dossier_vide')
									}.bind(this)
									xhr.onerror = function () {
										resolve('erreur_televersement')
									}
									xhr.open('POST', this.$parent.$parent.hote + 'inc/vider_dossier_serie.php', true)
									xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
									xhr.send('serie=' + this.id)
								}.bind(this))
							}
							for (const item of fichiers) {
								const donneesFichier = new Promise(function (resolve) {
									if (archive.files['fichiers/' + item]) {
										archive.files['fichiers/' + item].async('blob').then(function (blob) {
											indexFichier++
											const formData = new FormData()
											formData.append('index', indexFichier)
											formData.append('parametre', this.parametreImport)
											formData.append('fichier', item)
											formData.append('serie', this.id)
											formData.append('blob', blob)
											const xhr = new XMLHttpRequest()
											xhr.onload = function () {
												if (xhr.readyState === xhr.DONE && xhr.status === 200) {
													resolve('fichier_televerse')
												} else {
													resolve('erreur_televersement')
												}
											}.bind(this)
											xhr.onerror = function () {
												resolve('erreur_televersement')
											}
											xhr.open('POST', this.$parent.$parent.hote + 'inc/televerser_fichier_import.php', true)
											xhr.send(formData)
										}.bind(this))
									} else {
										resolve('erreur_televersement')
									}
								}.bind(this))
								donneesFichiers.push(donneesFichier)
							}
							Promise.all(donneesFichiers).then(function () {
								let json
								let cartes = JSON.parse(JSON.stringify(this.cartes))
								if (this.parametreImport === 'ajouter') {
									donnees.cartes.forEach(function (carte) {
										cartes.push(carte)
									})
									cartes = cartes.filter(function (carte) {
										return (carte.recto.texte !== '' || carte.recto.image !== '' || carte.recto.audio !== '') && (carte.verso.texte !== '' || carte.verso.image !== '' || carte.verso.audio !== '')
									})
									cartes = cartes.filter((valeur, index) => {
										const _valeur = JSON.stringify(valeur)
										return index === cartes.findIndex(obj => {
											return JSON.stringify(obj) === _valeur
										})
									})
									json = { serie: this.id, donnees: JSON.stringify({ cartes: cartes, options: this.options }) }
								} else {
									json = { serie: this.id, donnees: JSON.stringify({ cartes: donnees.cartes, options: this.options }) }
								}
								const xhr = new XMLHttpRequest()
								xhr.onload = function () {
									if (xhr.readyState === xhr.DONE && xhr.status === 200) {
										this.$parent.$parent.chargement = false
										if (xhr.responseText === 'contenu_inexistant') {
											document.title = 'Digiflashcards by La Digitale'
											this.$router.push('/')
										} else if (xhr.responseText === 'erreur') {
											this.$parent.$parent.message = this.$t('erreurServeur')
										} else if (xhr.responseText === 'non_autorise') {
											this.$parent.$parent.message = this.$t('actionNonAutorisee')
										} else if (xhr.responseText === 'serie_modifiee') {
											this.vue = 'editeur'
											if (this.parametreImport === 'ajouter') {
												this.cartes = cartes
											} else {
												this.cartes = donnees.cartes
											}
											this.cartesInversees = false
											this.cartesOriginales = []
											this.verifierCartes()
											this.$parent.$parent.notification = this.$t('serieImportee')
											document.querySelector('#app').classList.remove('apprenant')
										}
									} else {
										this.$parent.$parent.chargement = false
										this.$parent.$parent.message = this.$t('erreurServeur')
									}
								}.bind(this)
								xhr.open('POST', this.$parent.$parent.hote + 'inc/modifier_serie.php', true)
								xhr.setRequestHeader('Content-type', 'application/json')
								xhr.send(JSON.stringify(json))
								this.supprimerDonneesExercices()
							}.bind(this))
						}.bind(this))
					}
				}.bind(this))
			}
		},
		verifierCartes () {
			if (this.cartes.length === 0) {
				this.cartes = [{ recto: { texte: '', image: '', audio: '' }, verso: { texte: '', image: '', audio: '' } }, { recto: { texte: '', image: '', audio: '' }, verso: { texte: '', image: '', audio: '' } }, { recto: { texte: '', image: '', audio: '' }, verso: { texte: '', image: '', audio: '' } }]
			} else if (this.cartes.length === 1) {
				this.cartes.push({ recto: { texte: '', image: '', audio: '' }, verso: { texte: '', image: '', audio: '' } }, { recto: { texte: '', image: '', audio: '' }, verso: { texte: '', image: '', audio: '' } })
			} else if (this.cartes.length === 2) {
				this.cartes.push({ recto: { texte: '', image: '', audio: '' }, verso: { texte: '', image: '', audio: '' } })
			}
		},
		terminerSession () {
			this.$parent.$parent.chargement = true
			const xhr = new XMLHttpRequest()
			xhr.onload = function () {
				if (xhr.readyState === xhr.DONE && xhr.status === 200) {
					this.$parent.$parent.chargement = false
					if (xhr.responseText === 'session_terminee') {
						this.fermerModaleSerie()
						this.admin = false
						this.vue = 'apprenant'
						if (this.cartes.length > 0) {
							const tailleFonte = this.tailleFonte
							this.$nextTick(function () {
								this.fitty = fitty('#carte_0 .texte', {
									minSize: tailleFonte,
									maxSize: 100,
									multiLine: true
								})
								window.MathJax.typeset()
							}.bind(this))
						}
						this.$parent.$parent.notification = this.$t('sessionTerminee')
						document.querySelector('#app').classList.add('apprenant')
						window.history.replaceState({}, document.title, window.location.href.split('?')[0])
					}
				} else {
					this.$parent.$parent.chargement = false
					this.fermerModaleSerie()
					this.$parent.$parent.message = this.$t('erreurServeur')
				}
			}.bind(this)
			xhr.open('POST', this.$parent.$parent.hote + 'inc/terminer_session_serie.php', true)
			xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
			xhr.send('serie=' + this.id)
		},
		afficherSupprimerSerie () {
			this.modale = 'suppression-serie'
			this.$nextTick(function () {
				document.querySelector('.modale .bouton').focus()
			})
		},
		supprimerSerie () {
			this.modale = ''
			this.$parent.$parent.chargement = true
			const xhr = new XMLHttpRequest()
			xhr.onload = function () {
				if (xhr.readyState === xhr.DONE && xhr.status === 200) {
					if (xhr.responseText === 'erreur') {
						this.$parent.$parent.chargement = false
						this.$parent.$parent.message = this.$t('erreurServeur')
					} else if (xhr.responseText === 'non_autorise') {
						this.$parent.$parent.chargement = false
						this.$parent.$parent.message = this.$t('actionNonAutorisee')
					} else if (xhr.responseText === 'serie_supprimee' || xhr.responseText === 'contenu_inexistant') {
						document.title = 'Digiflashcards by La Digitale'
						this.$router.push('/')
					}
				} else {
					this.$parent.$parent.chargement = false
					this.fermerModale()
					this.$parent.$parent.message = this.$t('erreurServeur')
				}
			}.bind(this)
			xhr.open('POST', this.$parent.$parent.hote + 'inc/supprimer_serie.php', true)
			xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
			xhr.send('serie=' + this.id)
		},
		ouvrirModaleImporterCSV () {
			this.elementPrecedent = (document.activeElement || document.body)
			this.modale = 'importer-csv'
			this.$nextTick(function () {
				document.querySelector('.modale .fermer').focus()
			})
		},
		importerCSV (event) {
			const fichier = event.target.files[0]
			if (fichier === null || fichier.length === 0) {
				document.querySelector('#televerser_csv').value = ''
				return false
			} else {
				this.modale = ''
				const that = this
				let cartes
				this.$parent.$parent.chargement = true
				Papa.parse(fichier, {
					header: true,
					transformHeader: true,
					skipEmptyLines: true,
					complete: function (results) {
						const donnees = results.data
						if (that.parametreImport === 'remplacer') {
							cartes = []
						} else {
							cartes = JSON.parse(JSON.stringify(that.cartes))
						}
						donnees.forEach(function (item) {
							if ((item.recto_texte !== '' || item.recto_image !== '' || item.recto_audio !== '') && (item.verso_texte !== '' || item.verso_image !== '' || item.verso_audio !== '')) {
								const id = 'carte-' + (new Date()).getTime() + Math.random().toString(16).slice(12)
								cartes.push({ id: id, recto: { texte: item.recto_texte, image: item.recto_image, audio: item.recto_audio }, verso: { texte: item.verso_texte, image: item.verso_image, audio: item.verso_audio } })
							}
						})
						cartes = cartes.filter(function (carte) {
							return (carte.recto.texte !== '' || carte.recto.image !== '' || carte.recto.audio !== '') && (carte.verso.texte !== '' || carte.verso.image !== '' || carte.verso.audio !== '')
						})
						let xhr = new XMLHttpRequest()
						xhr.onload = function () {
							if (xhr.readyState === xhr.DONE && xhr.status === 200) {
								that.$parent.$parent.chargement = false
								if (xhr.responseText === 'contenu_inexistant') {
									document.title = 'Digiflashcards by La Digitale'
									that.$router.push('/')
								} else if (xhr.responseText === 'erreur') {
									that.$parent.$parent.message = that.$t('erreurServeur')
								} else if (xhr.responseText === 'non_autorise') {
									that.$parent.$parent.message = that.$t('actionNonAutorisee')
								} else if (xhr.responseText === 'serie_modifiee') {
									that.cartes = cartes
									that.cartesOriginales = []
									that.cartesInversees = false
									that.$parent.$parent.notification = that.$t('cartesImportees')
									that.gererFocus()
									if (that.parametreImport === 'remplacer') {
										xhr = new XMLHttpRequest()
										xhr.open('POST', that.$parent.$parent.hote + 'inc/vider_dossier_serie.php', true)
										xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
										xhr.send('serie=' + that.id)
									}
								}
							} else {
								that.$parent.$parent.chargement = false
								that.$parent.$parent.message = that.$t('erreurServeur')
							}
						}
						xhr.open('POST', that.$parent.$parent.hote + 'inc/modifier_serie.php', true)
						xhr.setRequestHeader('Content-type', 'application/json')
						const json = { serie: that.id, donnees: JSON.stringify({ cartes: cartes, options: this.options }) }
						xhr.send(JSON.stringify(json))
						that.supprimerDonneesExercices()
					}
				})
			}
		},
		gererFocus () {
			if (this.elementPrecedent) {
				this.elementPrecedent.focus()
				this.elementPrecedent = null
			}
		},
		gererClavier (event) {
			if (event.key === 'Escape' && this.$parent.$parent.message !== '') {
				this.$parent.$parent.message = ''
			} else if (event.key === 'Escape' && this.modale === 'connexion') {
				this.fermerModaleConnexion()
			} else if (event.key === 'Escape' && this.modale === 'serie') {
				this.fermerModaleSerie()
			} else if (event.key === 'Escape' && this.modale === 'modifier-nom') {
				this.fermerModaleNomSerie()
			} else if (event.key === 'Escape' && this.modale === 'modifier-acces') {
				this.fermerModaleAccesSerie()
			} else if (event.key === 'Escape' && this.modale === 'image') {
				this.fermerModaleImage()
			} else if (event.key === 'Escape' && this.modale === 'zoom-image') {
				this.fermerModaleZoomImage()
			} else if (event.key === 'Escape' && this.modale === 'ajouter-audio') {
				this.fermerModaleAjouterAudio()
			} else if (event.key === 'Escape' && this.modale === 'audio') {
				this.fermerModaleAudio()
			} else if (event.key === 'Escape' && this.modale !== '') {
				this.fermerModale()
			} else if (event.key === 'Escape' && this.menu !== '') {
				this.menu = ''
				this.gererFocus()
                        } else if (this.vue === 'apprenant' && this.modale === '' && this.onglet === 'cartes' && event.key === 'ArrowLeft') {
                                event.preventDefault()
                                this.afficherCartePrecedente()
                        } else if (this.vue === 'apprenant' && this.modale === '' && this.onglet === 'cartes' && event.key === 'ArrowRight') {
                                event.preventDefault()
                                this.afficherCarteSuivante()
                        } else if (this.vue === 'apprenant' && this.modale === '' && this.onglet === 'cartes' && event.key === 'ArrowUp') {
                                event.preventDefault()
                                this.recto = !this.recto
                        } else if (this.vue === 'apprenant' && this.modale === '' && this.onglet === 'cartes' && event.key === 'ArrowDown') {
                                const audio = this.recupererAudioCarteActive()
                                if (audio !== '') {
                                        event.preventDefault()
                                        this.lireAudioDepuisClavier(audio)
                                }
			} else if (this.vue === 'apprenant' && this.modale === '' && this.onglet === 'quiz' && event.key === 'ArrowLeft') {
				this.afficherQuestionQuizPrecedente()
			} else if (this.vue === 'apprenant' && this.modale === '' && this.onglet === 'quiz' && event.key === 'ArrowRight') {
				this.afficherQuestionQuizSuivante()
			} else if (this.vue === 'apprenant' && this.modale === '' && this.onglet === 'ecrire' && event.key === 'ArrowLeft') {
				this.afficherQuestionEcrirePrecedente()
			} else if (this.vue === 'apprenant' && this.modale === '' && this.onglet === 'ecrire' && event.key === 'ArrowRight') {
				this.afficherQuestionEcrireSuivante()
			}
		},
		gererScroll () {
			const y = document.body.scrollTop
			if (this.vue === 'editeur' && y > 100) {
				this.boutonRetour = true
			} else {
				this.boutonRetour = false
			}
		},
		retournerHaut () {
			document.body.scrollTop = 0
		},
		gererPleinEcran () {
			if (!this.pleinEcran) {
				fscreen.requestFullscreen(document.querySelector('#app'))
				this.pleinEcran = true
			} else {
				fscreen.exitFullscreen()
				this.pleinEcran = false
			}
		},
		melangerCartes () {
			this.$parent.$parent.chargement = true
			if (this.audio !== '') {
				this.audio.pause()
				this.audio = ''
				this.lecture = false
			}
			setTimeout(function () {
				const cartes = JSON.parse(JSON.stringify(this.cartes))
				for (let i = cartes.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1))
					const temp = cartes[i]
					cartes[i] = cartes[j]
					cartes[j] = temp
				}
				this.recto = true
				this.cartes = cartes
				const tailleFonte = this.tailleFonte
				this.$nextTick(function () {
					this.fitty = fitty('#carte_' + this.navigationCartes + ' .texte', {
						minSize: tailleFonte,
						maxSize: 100,
						multiLine: true
					})
					window.MathJax.typeset()
				}.bind(this))
				this.$parent.$parent.notification = this.$t('cartesMelangees')
				this.$parent.$parent.chargement = false
			}.bind(this), 200)
		},
		melangerEntrees (array) {
			for (let i = array.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1))
				const temp = array[i]
				array[i] = array[j]
				array[j] = temp
			}
			return array
		},
		inverserCartes () {
			this.$parent.$parent.chargement = true
			if (this.audio !== '') {
				this.audio.pause()
				this.audio = ''
				this.lecture = false
			}
			setTimeout(function () {
				const cartes = JSON.parse(JSON.stringify(this.cartes))
				if (this.cartesInversees === false) {
					this.cartesInversees = true
				} else {
					this.cartesInversees = false
				}
				for (let i = 0; i < cartes.length; i++) {
					const recto = cartes[i].recto
					const verso = cartes[i].verso
					cartes[i].recto = verso
					cartes[i].verso = recto
				}
				this.recto = true
				this.cartes = cartes
				const tailleFonte = this.tailleFonte
				this.$nextTick(function () {
					this.fitty = fitty('#carte_' + this.navigationCartes + ' .texte', {
						minSize: tailleFonte,
						maxSize: 100,
						multiLine: true
					})
					window.MathJax.typeset()
				}.bind(this))
				if (this.cartes.length > 4) {
					this.definirExercicesEcrire()
					this.definirExercicesQuiz()
					this.definirExercicesAppariement()
				}
				this.$parent.$parent.notification = this.$t('cartesInversees')
				this.$parent.$parent.chargement = false
			}.bind(this), 200)
		},
		lancerConfettis () {
			// eslint-disable-next-line
			confetti({ angle: 300, spread: 55, particleCount: 150, origin: { x: 0, y: -0.2 }, zIndex: 10010 })
			// eslint-disable-next-line
			confetti({ angle: 240, spread: 55, particleCount: 150, origin: { x: 1, y: -0.2 }, zIndex: 10010 })
			// eslint-disable-next-line
			confetti({ angle: 270, spread: 70, particleCount: 150, origin: { x: 0.5, y: -0.2 }, zIndex: 10010 })
		},
		verifierLien (lien) {
			let url
			try {
				url = new URL(lien)
			} catch (_) {
				return false
			}
			return url.protocol === 'http:' || url.protocol === 'https:'
		},
		transcoder (aBuffer) {
			const numOfChan = aBuffer.numberOfChannels
			const btwLength = aBuffer.length * numOfChan * 2 + 44
			const btwArrBuff = new ArrayBuffer(btwLength)
			const btwView = new DataView(btwArrBuff)
			const btwChnls = []
			let btwIndex
			let btwSample
			let btwOffset = 0
			let btwPos = 0
			setUint32(0x46464952)
			setUint32(btwLength - 8)
			setUint32(0x45564157)
			setUint32(0x20746d66)
			setUint32(16)
			setUint16(1)
			setUint16(numOfChan)
			setUint32(aBuffer.sampleRate)
			setUint32(aBuffer.sampleRate * 2 * numOfChan)
			setUint16(numOfChan * 2)
			setUint16(16)
			setUint32(0x61746164)
			setUint32(btwLength - btwPos - 4)
			for (btwIndex = 0; btwIndex < aBuffer.numberOfChannels; btwIndex++) {
				btwChnls.push(aBuffer.getChannelData(btwIndex))
			}
			while (btwPos < btwLength) {
				for (btwIndex = 0; btwIndex < numOfChan; btwIndex++) {
					btwSample = Math.max(-1, Math.min(1, btwChnls[btwIndex][btwOffset]))
					btwSample = (0.5 + btwSample < 0 ? btwSample * 32768 : btwSample * 32767) | 0
					btwView.setInt16(btwPos, btwSample, true)
					btwPos += 2
				}
				btwOffset++
			}
			const wavHdr = lamejs.WavHeader.readHeader(new DataView(btwArrBuff))
			const data = new Int16Array(btwArrBuff, wavHdr.dataOffset, wavHdr.dataLen / 2)
			const leftData = []
			const rightData = []
			for (let i = 0; i < data.length; i += 2) {
				leftData.push(data[i])
				rightData.push(data[i + 1])
			}
			const left = new Int16Array(leftData)
			const right = new Int16Array(rightData)
			let blob
			if (wavHdr.channels === 2) {
				blob = wavToMp3(wavHdr.channels, wavHdr.sampleRate, left, right)
			} else if (wavHdr.channels === 1) {
				blob = wavToMp3(wavHdr.channels, wavHdr.sampleRate, data)
			}
			return blob

			function setUint16 (data) {
				btwView.setUint16(btwPos, data, true)
				btwPos += 2
			}

			function setUint32 (data) {
				btwView.setUint32(btwPos, data, true)
				btwPos += 4
			}

			function wavToMp3 (channels, sampleRate, left, right = null) {
				const buffer = []
				const mp3enc = new lamejs.Mp3Encoder(channels, sampleRate, 96)
				let remaining = left.length
				const samplesPerFrame = 1152
				for (let i = 0; remaining >= samplesPerFrame; i += samplesPerFrame) {
					let mp3buf
					if (!right) {
						const mono = left.subarray(i, i + samplesPerFrame)
						mp3buf = mp3enc.encodeBuffer(mono)
					} else {
						const leftChunk = left.subarray(i, i + samplesPerFrame)
						const rightChunk = right.subarray(i, i + samplesPerFrame)
						mp3buf = mp3enc.encodeBuffer(leftChunk, rightChunk)
					}
					if (mp3buf.length > 0) {
						buffer.push(new Int8Array(mp3buf))
					}
					remaining -= samplesPerFrame
				}
				const d = mp3enc.flush()
				if (d.length > 0) {
					buffer.push(new Int8Array(d))
				}
				return new Blob(buffer, { type: 'audio/mpeg' })
			}
		}
	}
}
</script>

<style scoped>
#page {
	background: #fff;
}

#page,
#serie {
	position: relative;
	width: 100%;
	height: 100%;
}

#header {
	position: sticky;
	top: 0;
	left: 0;
	right: 0;
	height: 40px;
    width: 100%;
    text-align: center;
    background: #fff;
	z-index: 100;
	user-select: none;
}

#conteneur-header {
	display: flex;
	justify-content: flex-start;
	align-items: center;
	max-width: 75em;
	margin: 0 auto;
	padding: 0 20px;
}

#conteneur-partage,
#conteneur-parametres,
#conteneur-logo {
    height: 40px;
    background: #fff;
}

#conteneur-logo {
	width: 32px;
	text-align: center;
}

#conteneur-partage,
#conteneur-parametres {
	line-height: 40px;
	cursor: pointer;
}

#conteneur-partage {
	width: 40px;
	padding: 0 8px;
}

#conteneur-parametres {
	width: 32px;
	padding: 0 0 0 8px;
}

#conteneur-partage i,
#conteneur-parametres i {
	font-size: 24px;
	width: 24px;
}

#logo {
    width: 24px;
    height: 24px;
    background: #00ced1;
    display: inline-block;
    border-radius: 50%;
    margin: 8px 8px 8px 0;
}

#titre {
	display: block;
	width: calc(100% - 104px);
	font-family: 'Roboto-Slab';
	font-size: 18px;
    padding: 0 7px;
    line-height: 40px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
	text-transform: uppercase;
    letter-spacing: 1px;
}

#titre:before {
    content: '';
    position: absolute;
    right: 0;
    width: 100%;
    top: 100%;
    bottom: auto;
    height: 8px;
    pointer-events: none;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0, rgba(0, 0, 0, 0.08) 40%, rgba(0, 0, 0, 0.04) 50%, transparent 90%, transparent);
}

#onglets {
	display: flex;
    justify-content: flex-start;
    align-items: center;
	width: 100%;
	max-width: 75em;
	height: 40px;
	margin: 0 auto;
	padding: 0 20px 0;
}

#onglets .onglet {
	display: flex;
    justify-content: center;
    align-items: center;
	width: 100%;
	height: 40px;
	font-size: 24px;
	border-radius: 5px;
	text-align: center;
	cursor: pointer;
	user-select: none;
}

#onglets .onglet.selectionne {
	background: #00ced1;
	cursor: default;
}

#options {
	display: flex;
	justify-content: flex-start;
	flex-wrap: wrap;
	width: 100%;
	max-width: 75em;
	margin: 30px auto 0;
	padding: 0 20px;
}

#options .option {
	margin-right: 40px;
	margin-bottom: 20px;
}

#options .option:last-child {
	margin-right: 0;
}

#options h3 {
	font-size: 16px;
	font-weight: 700;
	line-height: 1.25;
	margin-bottom: 10px;
}

#options .bouton-radio {
	display: inline-block;
	position: relative;
	padding-left: 30px;
	cursor: pointer;
	font-size: 16px;
	user-select: none;
	margin-right: 15px;
	line-height: 22px;
}

#options .bouton-radio:last-child {
	margin-right: 0;
}

#options .bouton-radio input {
	display: none;
}

#options .coche {
	position: absolute;
	top: 0;
	left: 0;
	height: 22px;
	width: 22px;
	background-color: #eee;
	border-radius: 50%;
}

#options .bouton-radio:hover input ~ .coche {
	background-color: #ccc;
}

#options .bouton-radio input:checked ~ .coche {
	background-color: #00ced1;
}

#options .coche:after {
	content: '';
	position: absolute;
	display: none;
}

#options .bouton-radio input:checked ~ .coche:after {
	display: block;
}

#options .bouton-radio .coche:after {
	top: 6px;
	left: 6px;
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: #fff;
}

#conteneur {
	position: relative;
	width: 100%;
}

#page.plein-ecran #conteneur {
	height: calc(100% - 80px);
}

#cartes {
	display: flex;
	flex-wrap: wrap;
	flex-direction: row;
    justify-content: flex-start;
    align-content: flex-start;
    align-items: flex-start;
	width: 100%;
	max-width: 75em;
	margin: 0 auto;
	padding: 30px 20px 0;
}

#options + #cartes {
	padding: 10px 20px 0;
}

#cartes.admin .carte {
	position: relative;
	display: flex;
	justify-content: center;
	align-items: center;
	flex-wrap: wrap;
	width: 100%;
    margin-bottom: 20px;
	padding: 0.5em 1em 1em 1em;
	text-align: center;
    border-radius: 10px;
	background: #eee;
}

#cartes.admin .carte.masque {
	opacity: 0.5;
	background: #f5f5f5;
}

#cartes.apprenant .carte {
	position: relative;
    display: flex;
	justify-content: center;
	align-items: center;
    margin: 0;
    width: 100%;
	height: 65vh;
	cursor: pointer;
}

.integration #cartes.apprenant .carte {
	height: 74vh;
}

#cartes.apprenant .carte > .recto,
#cartes.apprenant .carte > .verso {
	display: flex;
	justify-content: center;
	align-items: center;
    width: 100%;
    height: 65vh;
	padding: 20px;
    border-radius: 10px;
	transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275);
    transition-duration: 0.5s;
    transition-property: transform, opacity;
}

.integration #cartes.apprenant .carte > .recto,
.integration #cartes.apprenant .carte > .verso {
    height: 74vh;
}

#page.plein-ecran #cartes.apprenant .carte > .recto,
#page.plein-ecran #cartes.apprenant .carte > .verso,
#page.plein-ecran #cartes.apprenant .carte {
	height: 100%;
}

#cartes.apprenant .carte > .recto {
    transform: rotateY(0deg);
	background-color: #eee;
}

#cartes.apprenant .carte > .verso {
    position: absolute;
    opacity: 0;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
	background-color: #eee;
    transform: rotateX(-180deg);
	pointer-events: none;
}

#cartes.apprenant .carte.flip > .recto {
    transform: rotateX(180deg);
}

#cartes.apprenant .carte.flip > .verso {
    opacity: 1;
    transform: rotateX(0deg);
	pointer-events: all;
}

#cartes.apprenant .carte .conteneur-texte {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100%;
	text-align: center;
	overflow-y: auto;
	overflow-x: hidden;
}

#cartes.apprenant .carte .conteneur-media + .conteneur-texte {
	justify-content: flex-start;
	width: 70%;
	text-align: left;
}

#cartes.apprenant .carte .texte {
	margin: auto 0;
	line-height: 1.35;
}

#cartes.apprenant .carte .texte.multi {
	text-align: left;
}

#cartes.apprenant .carte .texte + .image {
	margin-top: 20px;
}

#cartes.apprenant .carte .conteneur-media {
	display: block;
	width: 100%;
	height: 100%;
	margin-right: 0;
}

#cartes.apprenant .carte .conteneur-media.avec-texte {
	display: block;
	width: calc(30% - 20px);
	height: 100%;
	margin-right: 20px;
}

#cartes.apprenant .carte .conteneur-audio,
#cartes.apprenant .carte .conteneur-image {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100%;
}

#cartes.apprenant .carte .conteneur-media .conteneur-audio.avec-image {
	height: 30%;
}

#cartes.apprenant .carte .conteneur-media .conteneur-image.avec-audio {
	height: 70%;
}

#cartes.apprenant .carte .conteneur-media.avec-texte .conteneur-audio.avec-image,
#cartes.apprenant .carte .conteneur-media.avec-texte .conteneur-image.avec-audio {
	height: 50%;
}

#cartes.apprenant .carte .image {
	display: flex;
	width: 100%;
	height: 100%;
	justify-content: center;
	align-items: center;
	font-size: 0;
	text-align: center;
}

#cartes.apprenant .carte .image img {
	border-radius: 10px;
}

#cartes.apprenant .carte .conteneur-media.avec-texte img {
	cursor: zoom-in;
}

#cartes.apprenant .carte .audio {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	font-size: 150px;
	text-align: center;
	cursor: pointer;
}

#cartes.apprenant .carte .conteneur-media .conteneur-audio.avec-image .audio,
#cartes.apprenant .carte .conteneur-media.avec-texte .audio {
	font-size: 85px;
}

#cartes.apprenant .carte .audio.lecture {
	color: #fe68b2;
	text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.4);
}

#exercices .navigation,
#cartes.apprenant .navigation {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        margin-top: 30px;
        user-select: none;
}

#cartes.apprenant .raccourcis-clavier {
        margin-top: 20px;
        padding: 15px 20px;
        border: 1px solid #ddd;
        border-radius: 10px;
        background: #ffffff;
        color: #555;
        line-height: 1.5;
}

#cartes.apprenant .raccourcis-clavier .titre {
        font-weight: 700;
        display: block;
        margin-bottom: 10px;
}

#cartes.apprenant .raccourcis-clavier ul {
        margin: 0;
        padding-left: 20px;
}

#cartes.apprenant .raccourcis-clavier li {
        margin-bottom: 4px;
}

#exercices .navigation {
        background: #fff;
        padding-top: 30px;
        border-top: 1px solid #ddd;
}

#page.plein-ecran #cartes .navigation,
#page.plein-ecran #exercices .navigation {
	position: fixed;
	height: 80px;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 0 20px;
	width: 100%;
	max-width: 75em;
	margin: 0 auto;
}

#exercices .navigation i,
#cartes.apprenant .navigation i {
	font-size: 24px;
	cursor: pointer;
}

#cartes .navigation .total,
#exercices .navigation .total {
	font-weight: 700;
	padding: 4px 10px;
	background: #00ced1;
	border-radius: 5px;
}

#cartes .navigation .memorise,
#cartes .navigation .aleatoire,
#cartes .navigation .ecran,
#exercices .navigation .ecran,
#exercices .navigation .score,
#exercices .navigation .reinitialiser {
	font-size: 24px;
	margin-left: 15px;
}

#exercices .navigation.appariement {
	justify-content: center;
}

#exercices .navigation.appariement .reinitialiser {
	margin-left: 0;
}

#cartes .navigation .memorise.actif {
	color: #00b894;
}

#page.sans-plein-ecran #cartes .navigation .ecran,
#page.sans-plein-ecran #exercices .navigation .ecran {
	display: none!important;
}

#cartes .navigation .actions,
#exercices .navigation .actions {
	display: flex;
}

#cartes.admin .carte .actions {
	display: flex;
	justify-content: flex-start;
	align-items: center;
	width: 100%;
	line-height: 1;
	padding-bottom: 0.5em;
	border-bottom: 1px solid #ddd;
	user-select: none;
	cursor: move;
}

#cartes.admin .carte .actions .gauche {
	display: flex;
	justify-content: flex-start;
	align-items: center;
	font-size: 16px;
	font-weight: 700;
	width: calc(100% - 63px);
}

#cartes.admin .carte .actions .droite {
	display: flex;
	justify-content: flex-end;
	align-items: center;
}

#cartes.admin .carte .actions .droite span.supprimer {
	color: #ff6259;
	margin-left: 15px;
	cursor: pointer;
}

#cartes.admin .carte .actions .droite span.masquer {
	margin-left: 15px;
	cursor: pointer;
}

#cartes.admin .carte .actions .droite span.desactive {
	color: #aaa;
	cursor: default;
}

#cartes.admin .carte .actions .droite i {
	font-size: 24px;
}

#cartes.admin .carte .recto,
#cartes.admin .carte .verso {
	display: flex;
	justify-content: flex-start;
	align-items: center;
	flex-wrap: wrap;
	width: 50%;
}

#cartes.admin .carte .recto {
	padding: 1em 0.5em 0 0;
}

#cartes.admin .carte .verso {
	padding: 1em 0 0 0.5em;
}

#cartes.admin .carte .label {
	width: 100%;
	text-align: left;
	font-size: 12px;
	text-transform: uppercase;
	font-weight: 700;
	margin-bottom: 0.25em;
}

#cartes.admin .carte .texte {
	width: calc(100% - 60px);
}

#cartes.admin .carte textarea {
	height: 70px;
	margin: 0;
}

#cartes.admin .carte textarea.avec-image {
	border-top-right-radius: 0;
	border-bottom-right-radius: 0;
}

#cartes.admin .carte label.image {
	text-align: center;
	font-size: 24px;
	width: 30px;
	user-select: none;
}

#cartes.admin .carte span.image {
	width: 30px;
	height: 70px;
	background-size: cover;
	background-position: 50%;
	background-repeat: no-repeat;
	background-color: #ccc;
	border-top-right-radius: 4px;
	border-bottom-right-radius: 4px;
	border: 1px solid #ddd;
	border-left: 0;
	cursor: pointer;
}

#cartes.admin .carte .audio {
	text-align: center;
	font-size: 24px;
	width: 30px;
	user-select: none;
	cursor: pointer;
}

#cartes.admin .carte .audio.televerse {
	color: #00b894;
}

#cartes.admin .carte span.conteneur-chargement {
	width: 30px;
	text-align: center;
	font-size: 0;
}

#cartes.admin .carte span.conteneur-chargement .chargement {
	display: inline-block;
	border: 4px solid #ddd;
	border-top: 4px solid #00ced1;
	border-radius: 50%;
	width: 24px;
	height: 24px;
	animation: rotation 0.7s linear infinite;
}

#cartes.admin .carte span.conteneur-chargement .progression {
	display: block;
	font-size: 9px;
	margin-top: 5px;
	text-align: center;
}

#ajouter-carte {
	width: 100%;
	max-width: 75em;
	margin: 10px auto 0;
	padding: 0 20px;
}

#exercices {
	display: flex;
	flex-wrap: wrap;
	flex-direction: row;
    justify-content: flex-start;
    align-content: flex-start;
    align-items: flex-start;
	width: 100%;
	max-width: 75em;
	margin: 0 auto;
	padding: 30px 20px 0;
}

#page.plein-ecran #cartes,
#page.plein-ecran #exercices {
	height: calc(100% - 80px);
	overflow: auto;
	-webkit-overflow-scrolling: touch;
}

#page.plein-ecran #exercices .exercice {
	margin-bottom: 60px;
}

#exercices .exercice {
	width: 100%;
}

#exercices .exercice .question {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-wrap: wrap;
}

#exercices .exercice.appariement .question {
	margin-bottom: 20px;
}

#exercices .question .image {
	font-size: 0;
}

#exercices .question .image img {
	max-height: 30vh;
	cursor: zoom-in;
}

#exercices .question .texte {
	font-size: 24px;
	text-align: center;
	line-height: 1.5;
}

#exercices .question .texte.consigne {
	display: block;
	width: 100%;
	color: #999;
}

#exercices .quiz .question .texte.consigne {
	margin-bottom: 20px;
}

#exercices .question .image.avec-texte {
	max-width: calc(30% - 20px);
	margin-right: 20px;
}

#exercices .question .image.avec-texte + .texte {
	max-width: 70%;
}

#exercices .question .audio {
	font-size: 96px;
	line-height: 1;
	cursor: pointer;
}

#exercices .question .audio.lecture {
	color: #fe68b2;
	text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.4);
}

#exercices .question .audio.avec-image {
	margin-left: 20px;
}

#exercices .question .audio.avec-texte {
	width: 96px;
	margin-right: 20px;
}

#exercices .question .audio.avec-texte + .texte {
	max-width: calc(100% - 116px);
}

#exercices .question .image.avec-texte.avec-audio {
	max-width: calc(35% - 112px);
	margin-right: 20px;
}

#exercices .question .audio.avec-texte.avec-image {
	font-size: 72px;
	max-width: 72px;
	margin-right: 20px;
	margin-left: 0;
}

#exercices .question .audio.avec-texte.avec-image + .texte {
	max-width: 65%;
}

#exercices .reponses {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-wrap: wrap;
	margin-top: 10px;
}

#exercices .reponses .reponse {
	width: 100%;
}

#exercices .conteneur-coche {
	display: flex;
	justify-content: flex-start;
	align-items: center;
	position: relative;
	margin-top: 20px;
	cursor: pointer;
	font-size: 24px;
	user-select: none;
}

#exercices .conteneur-coche input {
	display: none;
}

#exercices .radio {
	position: relative;
	height: 25px;
	width: 25px;
	background-color: #eee;
	border-radius: 50%;
	margin-right: 10px;
}

#exercices .conteneur-coche:hover input ~ .radio {
	background-color: #ccc;
}

#exercices .conteneur-coche input:checked ~ .radio {
	background-color: #00ced1;
}

#exercices .radio:after {
	content: '';
	position: absolute;
	display: none;
}

#exercices .conteneur-coche input:checked ~ .radio:after {
	display: block;
}

#exercices .conteneur-coche .radio:after {
	top: 7px;
	left: 7px;
	width: 11px;
	height: 11px;
	border-radius: 50%;
	background: #fff;
}

#exercices .conteneur-coche .image {
	width: 120px;
	margin-right: 10px;
	text-align: center;
}

#exercices .conteneur-coche .image img {
	max-width: 120px;
	max-height: 120px;
	cursor: zoom-in;
}

#exercices .conteneur-coche .image.avec-texte {
	width: 45px;
	margin-right: 10px;
	text-align: center;
}

#exercices .conteneur-coche .image.avec-texte img {
	max-width: 45px;
	max-height: 45px;
}

#exercices .conteneur-coche .audio {
	font-size: 36px;
	margin-right: 10px;
}

#exercices .conteneur-coche .audio.lecture {
	font-size: 36px;
	margin-right: 10px;
	color: #fe68b2;
	text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.4);
}

#exercices .conteneur-coche .texte {
	max-width: calc(100% - 35px);
}

#exercices .conteneur-coche .image.avec-texte + .texte {
	max-width: calc(100% - 90px);
}

#exercices .conteneur-coche .audio.avec-texte.avec-image + .texte {
	max-width: calc(100% - 136px);
}

#exercices .conteneur-coche .audio.avec-texte + .texte {
	max-width: calc(100% - 81px);
}

#actions {
	display: flex;
	justify-content: space-between;
	width: 100%;
	max-width: 75em;
	margin: 30px auto 0;
	padding: 0 20px;
	text-align: right;
}

#exercices .valider span,
#actions > a,
#actions span.bouton,
#ajouter-carte span {
	display: inline-block;
	width: 100%;
	font-weight: 700;
	font-size: 14px;
	text-transform: uppercase;
	height: 40px;
	line-height: 40px;
	color: #001d1d;
	background: #00ced1;
	text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
	text-align: center;
	padding: 0 20px;
	cursor: pointer;
	border-radius: 5px;
	letter-spacing: 1px;
	text-indent: 1px;
	transition: all .1s ease-in;
	user-select: none;
}

#exercices .valider span,
#actions span.bouton,
#actions > a {
	width: auto;
}

#exercices .valider span:hover,
#actions > a:hover,
#actions span.bouton:hover,
#ajouter-carte span:hover {
	background: #001d1d;
	color: #fff;
}

#actions #importer-csv a {
	font-size: 14px;
	margin-left: 15px;
}

#exercices .valider {
	margin-top: 30px;
	text-align: center;
}

#exercices .champ {
	margin-top: 30px;
	text-align: center;
}

#exercices .champ input[type="text"] {
	width: 100%;
	max-width: 700px;
	font-size: 24px;
	border-bottom: 2px solid #ddd;
	text-align: left;
	line-height: 2;
}

#exercices .champ input[type="text"].correct {
	border-color: #00b894!important;
	background: #def5e2!important;
}

#exercices .champ input[type="text"].incorrect {
	border-color: #777!important;
	background: #eee!important;
}

#exercices .conteneur-coche.correct input:checked ~ .radio {
	background-color: #00b894!important;
}

#exercices .conteneur-coche.incorrect input:checked ~ .radio {
	background-color: #777!important;
}

#exercices .appariement .items {
	display: flex;
    justify-content: space-between;
	align-items: center;
	width: 100%;
}

#exercices .appariement .items.reponses {
	margin-bottom: 20px;
}

#exercices .appariement ul {
	width: 100%;
	padding: 0;
	margin: 0;
}

#exercices .appariement ul.paires .gauche,
#exercices .appariement ul.paires .droite,
#exercices .appariement ul:not(.paires) {
	width: 50%;
}

#exercices .appariement ul li {
	position: relative;
	display: flex;
	align-items: center;
	border: 2px solid #ddd;
	background: rgba(255, 255, 255, 0.5);
	margin-bottom: 20px;
	cursor: pointer;
}

#exercices .appariement ul.paires .gauche {
	align-items: center;
	flex-wrap: wrap;
	padding-left: 10px;
	padding-top: 1%;
	padding-bottom: 10px;
	padding-right: 0;
}

#exercices .appariement ul.paires .droite {
	align-items: center;
	flex-wrap: wrap;
	padding-left: 0;
	padding-top: 10px;
	padding-bottom: 10px;
	padding-right: 10px;
}

#exercices .appariement ul.droite li,
#exercices .appariement ul.gauche li {
	padding: 10px;
}

#exercices .appariement ul.gauche li {
	margin-right: 10px;
}

#exercices .appariement ul.droite li {
	margin-left: 10px;
	cursor: default;
}

#exercices .appariement ul li.selectionne {
	border: 2px solid #001d1d;
	background: rgba(0, 0, 0, 0.04);
	cursor: pointer;
}

#exercices .appariement ul.paires .gauche,
#exercices .appariement ul.gauche li {
	display: flex;
	justify-content: flex-start;
	flex-wrap: wrap;
	text-align: left;
}

#exercices .appariement ul.paires .droite,
#exercices .appariement ul.droite li {
	display: flex;
	justify-content: flex-end;
	flex-wrap: wrap;
	text-align: right;
}

#exercices .appariement ul li:last-child {
	margin-bottom: 0;
}

#exercices .appariement ul.paires li {
    justify-content: space-between;
	border: 2px solid #001d1d;
	background: rgba(0, 0, 0, 0.04);
	z-index: 1;
}

#exercices .appariement ul.paires li.correct {
	border: 2px solid #00b894;
	cursor: default;
}

#exercices .appariement .items.reponses .gauche,
#exercices .appariement .items.reponses .droite {
	width: calc(50% - 38px);
}

#exercices .appariement ul.paires li span.supprimer {
	display: flex;
	justify-content: center;
	align-self: stretch;
	align-items: center;
	width: 76px;
	font-size: 36px;
	border-left: 2px solid #001d1d;
	color: #001d1d;
	cursor: pointer;
	user-select: none;
}

#exercices .appariement ul li .texte {
	margin: 10px;
	font-size: 24px;
	line-height: 1.25;
}

#exercices .appariement ul li .image {
	margin: 10px;
	font-size: 0;
}

#exercices .appariement ul li .audio {
	font-size: 96px;
	max-width: 96px;
	margin: 10px;
	cursor: pointer;
}

#exercices .appariement ul li .audio.lecture {
	color: #fe68b2;
	text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.4);
}

#exercices .appariement ul li .image + .audio,
#exercices .appariement ul li .audio:has(+ .texte) {
	font-size: 72px;
	max-width: 72px;
}

#exercices .appariement ul li .image img {
	max-height: 175px;
	margin: 0!important;
}

#actions span.bouton i,
#actions > a i {
	font-size: 24px;
	margin-right: 0.5em;
	font-weight: 400;
}

#menu-partager {
	position: absolute;
    z-index: 1000;
    border: 1px solid #ddd;
    padding: 1rem;
    border-radius: 1rem;
	background: #fff;
	box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.25);
	top: 54px;
	width: 300px;
}
	
#menu-partager:after {
	border: solid #ddd;
	content: '';
	display: block;
	position: absolute;
	top: 0;
	border-width: 0 1px 1px 0;
	transform: translate(-7px, -8px) rotate(-135deg);
	background: #fff;
    left: 90%;
    width: 14px;
    height: 14px;
}

#menu-partager label {
	display: block;
    width: 100%;
    font-weight: 700;
    font-size: 14px;
    margin-bottom: 10px;
    user-select: none;
}

#menu-partager .copier {
	display: flex;
	justify-content: center;
	align-items: center;
}

#menu-partager .copier input {
	display: block;
	width: calc(100% - 34px);
	font-weight: 400;
	font-size: 16px;
	border: 1px solid #ddd;
	border-radius: 4px;
	padding: 7px 15px;
	line-height: 1.5;
	text-align: left;
	margin-right: 10px;
}

#copier-lien {
	margin-bottom: 20px;
}

#copier-lien input {
	width: calc(100% - 68px);
}

#copier-lien span:last-child {
	margin-left: 10px;
}

#menu-partager .copier span i {
	font-size: 24px;
	width: 24px;
	height: 24px;
	cursor: pointer;
}

#menu-partager .copier span i:active {
	opacity: 0.8;
}

#page.plein-ecran #credits {
	display: none;
}

#credits {
	width: 100%;
	max-width: 75em;
	margin: 30px auto 0;
	padding: 30px 20px;
	border-top: 1px solid #ddd;
}

#credits p {
    font-size: 1em;
    line-height: 1.2;
    margin-bottom: 1em;
	text-align: center;
}

#credits p a span {
	text-decoration: underline;
}

.modale .bouton.large {
	width: 100%;
	text-align: center;
	margin-bottom: 20px;
}

.modale .bouton.large:last-child {
	margin-bottom: 0;
}

.modale .bouton.rouge {
	color: #fff;
	background: #ff6259;
}

.modale .bouton.rouge:hover {
	background: #d70b00;
}

.modale .langue {
	margin-bottom: 20px;
}

.modale .langue span {
	display: inline-flex;
	width: 45px;
	height: 45px;
	justify-content: center;
	align-items: center;
	line-height: 1;
	font-size: 20px;
	border-radius: 50%;
	margin-right: 10px;
	border: 1px solid #ddd;
	cursor: pointer;
	user-select: none;
}

.modale .langue span.selectionne {
	background: #444;
	color: #fff;
	border: 1px solid #222;
}

.modale .langue span:last-child {
	margin-right: 0;
}

.modale.confirmation .conteneur {
	text-align: center;
	padding: 30px 25px;
	max-width: 500px;
}

#modale-image img {
	max-height: calc(90vh - 145px);
}

#modale-ajouter-audio .actions,
#modale-audio .actions,
#modale-image .actions {
	margin-top: 20px;
}

#modale-ajouter-audio label,
#modale-image .actions label {
	width: auto;
	margin-bottom: 0;
}

#modale-ajouter-audio .contenu {
	text-align: center;
}

#modale-audio audio,
#modale-ajouter-audio audio {
	width: 100%;
}

.conteneur-modale.score,
#zoom-image {
	cursor: pointer;
}

#enregistrer i {
	font-size: 24px;
	margin-right: 0.5em;
	color: #ff1f1f;
}

#enregistrement .enregistrement {
	display: flex;
	justify-content: center;
	align-items: center;
}

#enregistrement .enregistrement .duree {
	font-size: 30px;
	font-weight: 500;
	margin-left: 25px;
}

#enregistrement .enregistrement .bouton {
	background-color: #fff;
	border-color: #001d1d;
	border-width: 1px;
	border-radius: 0;
	line-height: 1;
	height: auto;
	padding: 10px;
}

#enregistrement .enregistrement .bouton i {
	font-size: 48px;
	line-height: 1;
	margin: 0;
}

#enregistrement .enregistrement .bouton.stopper {
	color: #001d1d;
    animation: couleur ease-in 2s infinite;
}

#visualisation {
	margin-bottom: 20px;
}

@keyframes couleur {
    0% {
		background: #fff;
	}
    50% {
		background: #ff1f1f;
	}
    100% {
		background: #fff;
	}
}

.conteneur-modale.score .conteneur {
	text-align: center;
}

.conteneur-modale.score .icone {
	display: block;
	font-size: 30vh;
	color: #f7c500;
	text-shadow: 3px 3px 3px rgba(0, 0, 0, 0.3);
}

.conteneur-modale.score .score {
	display: block;
	font-size: 15vh;
	color: #fff;
	font-weight: 700;
	text-shadow: 3px 3px 3px rgba(0, 0, 0, 0.3);
}

.modale:not(.transcodage) div.conteneur-chargement {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	justify-content: center;
	align-items: center;
	flex-wrap: wrap;
	background: #fff;
	border-bottom-left-radius: 10px;
	border-bottom-right-radius: 10px;
	width: 100%;
	height: 100%;
	font-size: 0;
	line-height: 1;
}

.modale:not(.transcodage) div.conteneur-chargement .chargement {
	display: inline-block;
	border: 7px solid #ddd;
	border-top: 7px solid #00ced1;
	border-radius: 50%;
	width: 40px;
	height: 40px;
	animation: rotation 0.7s linear infinite;
}

@keyframes rotation {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

.modale .separateur {
    position: relative;
    margin: 20px 25%;
    text-align: center;
    width: 50%;
}

.modale .separateur:before {
    position: absolute;
    top: 50%;
    display: block;
    content: '';
    width: 100%;
    height: 1px;
    background-color: #ddd;
}

.modale .separateur span {
    position: relative;
    margin: 0;
    font-size: 14px;
    z-index: 2;
    display: inline-block;
    padding-left: 15px;
    padding-right: 15px;
    vertical-align: middle;
    background-color: #fff;
}

.modale .parametre-import {
	margin-bottom: 20px;
}

.modale .parametre-import label.bouton-radio {
	font-weight: 400;
}

#codeqr.modale .contenu {
	text-align: center;
	font-size: 0;
}

#retour-haut {
	position: fixed;
	bottom: 30px;
	right: 20px;
	display: flex;
	font-size: 36px;
	padding: 5px 10px;
	background: rgba(0, 0, 0, 0.4);
	color: #fff;
	border-radius: 10px;
	user-select: none;
	z-index: 10;
}

#retour-haut span {
	margin-left: 10px;
	cursor: pointer;
}

.pdf #cartes {
	padding: 0 20px 0;
}

.pdf #cartes.apprenant .carte {
	display: flex!important;
	flex-wrap: wrap;
	height: 100vh;
	pointer-events: none;
}

.pdf #cartes.apprenant .carte > .recto,
.pdf #cartes.apprenant .carte > .verso {
	height: 50vh;
}

.pdf #cartes.apprenant .carte > .recto {
	background-color: #ffffff;
}

.pdf #cartes.apprenant .carte > .verso {
	position: relative;
	opacity: 1;
	transform: rotateX(0deg);
}

@media screen and (max-width: 374px) {
	#exercices .appariement .items.reponses {
		margin-bottom: 10px;
	}

	#exercices .appariement ul li {
		margin-bottom: 10px;
	}

	#exercices .appariement ul.paires .gauche {
		padding-left: 0;
		padding-top: 0;
		padding-bottom: 0;
		padding-right: 0;
	}

	#exercices .appariement ul.paires .droite {
		padding-left: 0;
		padding-top: 0;
		padding-bottom: 0;
		padding-right: 0;
	}

	#exercices .appariement ul.droite li,
	#exercices .appariement ul.gauche li {
		padding: 0;
	}

	#exercices .appariement ul.gauche li {
		margin-right: 5px;
	}

	#exercices .appariement ul.droite li {
		margin-left: 5px;
	}

	#exercices .appariement .items.reponses .gauche,
	#exercices .appariement .items.reponses .droite {
		width: calc(50% - 22px);
	}

	#exercices .appariement ul.paires li span.supprimer {
		width: 44px;
		font-size: 24px;
	}

	#exercices .appariement ul li .image img {
		max-height: 125px;
	}
}

@media screen and (max-width: 399px) {
	#actions > a span {
		display: none;
	}

	#actions > a i {
		margin-right: 0;
	}

	#actions #importer-csv i {
		display: none;
	}

	#exercices .reponses .reponse {
		width: 100%;
		margin-right: 0;
	}

	#exercices .appariement ul li .texte,
	#exercices .conteneur-coche .audio.avec-texte.avec-image + .texte {
		font-size: 16px!important;
	}

	#exercices .question .audio {
		font-size: 60px!important;
	}

	#exercices .question .image.avec-audio {
		max-width: calc(100% - 80px)!important;
	}

	#exercices .question .audio.avec-texte {
		width: 60px!important;
	}

	#exercices .question .audio.avec-texte + .texte {
		max-width: calc(100% - 80px)!important;
	}
}

@media screen and (max-width: 499px) {
	#exercices .conteneur-coche .image {
		width: 90px;
	}

	#exercices .conteneur-coche .image img {
		max-width: 90px;
		max-height: 90px;
	}
}

@media screen and (min-width: 400px) and (max-width: 499px) {
	#actions > a i {
		display: none;
	}

	#actions #importer-csv i {
		display: none;
	}
}

@media screen and (min-width: 375px) and (max-width: 599px) {
	#exercices .appariement .items.reponses {
		margin-bottom: 10px;
	}

	#exercices .appariement ul li {
		margin-bottom: 10px;
	}

	#exercices .appariement ul.paires .gauche {
		padding-left: 0;
		padding-top: 0;
		padding-bottom: 0;
		padding-right: 0;
	}

	#exercices .appariement ul.paires .droite {
		padding-left: 0;
		padding-top: 0;
		padding-bottom: 0;
		padding-right: 0;
	}

	#exercices .appariement ul.droite li,
	#exercices .appariement ul.gauche li {
		padding: 0;
	}

	#exercices .appariement ul.gauche li {
		margin-right: 5px;
	}

	#exercices .appariement ul.droite li {
		margin-left: 5px;
	}

	#exercices .appariement .items.reponses .gauche,
	#exercices .appariement .items.reponses .droite {
		width: calc(50% - 22px);
	}

	#exercices .appariement ul.paires li span.supprimer {
		width: 44px;
		font-size: 24px;
	}

	#exercices .appariement ul li .image img {
		max-height: 125px;
	}
}

@media screen and (max-width: 599px) {
	#cartes.apprenant .carte .recto,
	#cartes.apprenant .carte .verso {
		flex-wrap: wrap;
	}

	#cartes.apprenant .carte .conteneur-media {
		width: 100%;
		height: 100%;
		margin: 0;
	}

	#cartes.apprenant .carte .conteneur-media.avec-texte {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: calc(30% - 20px);
		margin-bottom: 20px;
		margin-right: 0;
	}

	#cartes.apprenant .carte .conteneur-media.avec-texte + .conteneur-texte {
		width: 100%;
		height: 70%;
		justify-content: center;
		text-align: center;
	}

	#cartes.apprenant .carte .conteneur-media.avec-texte .conteneur-audio.avec-image,
	#cartes.apprenant .carte .conteneur-media.avec-texte .conteneur-image.avec-audio {
		height: 100%;
		width: 50%;
	}

	#cartes.apprenant .carte .audio {
		font-size: 100px;
	}

	#cartes.apprenant .carte .conteneur-media .conteneur-audio.avec-image .audio,
	#cartes.apprenant .carte .conteneur-media.avec-texte .audio {
		font-size: 60px;
	}

	#cartes.admin .carte .recto,
	#cartes.admin .carte .verso {
		width: 100%;
		padding-left: 0;
		padding-right: 0;
	}

	#exercices .navigation,
	#exercices,
	#cartes {
		padding-top: 20px;
	}

	#exercices .champ,
	#exercices .valider,
	#actions,
	#exercices .navigation,
	#cartes.apprenant .navigation,
	#credits {
		margin-top: 20px;
	}

	#actions #importer-csv a {
		display: block;
		text-align: left;
		margin-left: 0;
		margin-top: 10px;
	}

	#exercices .reponses {
		margin-top: 0;
	}

	#exercices .reponses .reponse {
		margin-right: 23px;
	}

	#exercices .appariement ul li .texte,
	#exercices .champ input[type="text"],
	#exercices .conteneur-coche .texte,
	#exercices .question .texte {
		font-size: 18px!important;
	}

	#exercices .question .audio.avec-texte.avec-image + .texte {
		width: 100%!important;
		max-width: 100%!important;
		text-align: center!important;
		margin-top: 20px;
	}

	#ajouter-carte {
		margin-top: 0;
	}

	#credits p {
		font-size: 0.75em;
	}

	#page.plein-ecran #cartes,
	#page.plein-ecran #exercices {
		height: calc(100% - 50px);
	}

	#page.plein-ecran #cartes .navigation,
	#page.plein-ecran #exercices .navigation {
		height: 50px;
	}
}

@media screen and (orientation: landscape) and (max-width: 599px) and (max-height: 479px) {
	#cartes.apprenant .carte .conteneur-media.avec-texte {
		height: calc(50% - 20px);
	}

	#cartes.apprenant .carte .conteneur-media.avec-texte + .conteneur-texte {
		height: 50%;
	}
}

@media screen and (min-width: 480px) and (max-width: 767px) {
	#exercices .appariement .items.reponses .gauche,
	#exercices .appariement .items.reponses .droite {
		width: calc(50% - 32px);
	}

	#exercices .appariement ul.paires li span.supprimer {
		width: 64px;
		font-size: 24px;
	}

	#exercices .appariement ul li .image img {
		max-height: 150px;
	}
}

@media screen and (max-width: 767px) {
	#exercices .appariement ul li .texte,
	#exercices .champ input[type="text"],
	#exercices .conteneur-coche .texte,
	#exercices .question .texte {
		font-size: 20px;
	}

	#exercices .question .audio {
		font-size: 72px;
	}

	#exercices .question .image.avec-texte.avec-audio {
		width: 120px;
		max-width: 120px;
		margin-right: 20px;
	}

	#exercices .question .image.avec-audio {
		max-width: calc(100% - 92px);
	}

	#exercices .question .audio.avec-texte.avec-image {
		font-size: 60px;
		width: 60px;
		max-width: 60px;
		margin-left: 0;
	}

	#exercices .question .audio.avec-texte {
		width: 72px;
	}

	#exercices .question .audio.avec-texte + .texte {
		max-width: calc(100% - 92px);
	}

	#exercices .question .audio.avec-texte.avec-image + .texte {
		max-width: calc(100% - 220px);
	}

	.modale .langue span {
		width: 40px;
		height: 40px;
		font-size: 18px;
		margin-right: 9px;
	}
}

@media screen and (max-width: 820px) and (orientation: landscape) {
	#credits p {
		margin-bottom: 0.75em!important;
	}
}

@media screen and (max-width: 850px) and (max-height: 500px) {
	#credits p {
		font-size: 0.75em;
	}
}
</style>

<style>
.sortable-chosen,
.sortable-ghost {
	background-color: #aaa!important;
}

.sortable-drag {
	opacity: 0.85!important;
	background-color: #ccc!important;
}

#codeqr.modale #qr {
	display: inline-block;
}

#codeqr.modale #qr img {
	max-width: 100%;
	height: auto;
	max-height: 60vh;
}
</style>
