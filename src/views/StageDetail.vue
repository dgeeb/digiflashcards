<template>
  <section v-if="stage && course" class="stage-detail">
    <header class="stage-detail__header">
      <div>
        <h1>{{ stage.title }}</h1>
        <p>{{ stage.description || 'Describe what learners should achieve in this stage.' }}</p>
      </div>
      <div class="stage-detail__meta">
        <div>
          <span class="meta-label">Stage points</span>
          <span class="meta-value">{{ stage.points ?? 0 }}</span>
        </div>
        <div>
          <span class="meta-label">Cards</span>
          <span class="meta-value">{{ stage.metrics.total }}</span>
        </div>
        <div>
          <span class="meta-label">Due today</span>
          <span class="meta-value">{{ stage.metrics.due }}</span>
        </div>
        <div>
          <span class="meta-label">Mode</span>
          <span class="meta-value">{{ isStudentCourse ? 'Student' : 'Creator' }}</span>
        </div>
      </div>
    </header>

    <section v-if="!isStudentCourse" class="stage-detail__form">
      <div class="stage-detail__form-header">
        <h2>Add a new card</h2>
        <div class="stage-detail__import-actions">
          <button class="button button--ghost" type="button" @click="downloadTemplate">Download CSV template</button>
          <button class="button button--ghost" type="button" @click="triggerCsvImport">Import CSV</button>
        </div>
      </div>
      <form class="inline-form" @submit.prevent="addCard">
        <div class="form-grid">
          <div class="form-field">
            <label for="card-front">Prompt</label>
            <textarea id="card-front" v-model="cardForm.front" rows="3" placeholder="Front of the card" required></textarea>
          </div>
          <div class="form-field">
            <label for="card-back">Answer</label>
            <textarea id="card-back" v-model="cardForm.back" rows="3" placeholder="Back of the card" required></textarea>
          </div>
        </div>
        <div class="form-field">
          <label for="card-note">Extra notes (optional)</label>
          <input id="card-note" v-model="cardForm.note" type="text" placeholder="Mnemonic, example sentence…" />
        </div>
        <fieldset class="audio-fieldset">
          <legend>Audio (optional)</legend>
          <div class="audio-fieldset__row">
            <div class="form-field">
              <label for="audio-side">Play audio on</label>
              <select id="audio-side" v-model="cardForm.audioSide">
                <option value="front">Prompt only</option>
                <option value="back">Answer only</option>
                <option value="both">Prompt and answer</option>
              </select>
            </div>
            <div class="form-field" v-if="cardForm.audioSide === 'both'">
              <label for="audio-target">Side to edit</label>
              <select id="audio-target" v-model="audioTarget">
                <option value="front">Prompt audio</option>
                <option value="back">Answer audio</option>
              </select>
            </div>
            <div class="audio-fieldset__buttons">
              <button
                class="button button--ghost"
                type="button"
                @click="startRecording"
                :disabled="!recordingSupported || isRecording"
              >
                Record {{ audioTargetLabel }} audio
              </button>
              <button
                v-if="isRecording"
                class="button button--ghost"
                type="button"
                @click="stopRecording()"
              >
                Stop recording
              </button>
              <button
                class="button button--ghost"
                type="button"
                @click="generateAudioForForm"
                :disabled="generatingAudio"
              >
                {{ generatingAudio ? 'Generating…' : `Generate ${audioTargetLabel} with ElevenLabs` }}
              </button>
              <button
                class="button button--ghost"
                type="button"
                @click="clearAudioAttachment()"
                :disabled="!audioAttachment[audioTarget]"
              >
                Remove {{ audioTargetLabel }} audio
              </button>
              <button
                class="button button--ghost"
                type="button"
                @click="clearAudioAttachment('all')"
                :disabled="!audioAttachment.front && !audioAttachment.back"
              >
                Clear all audio
              </button>
            </div>
          </div>
          <p v-if="!recordingSupported" class="form-help">Recording is not supported in this browser.</p>
          <p v-if="audioStatus" class="form-help">{{ audioStatus }}</p>
          <div class="audio-preview-grid">
            <div v-if="audioAttachment.front" class="audio-preview-card">
              <p class="audio-preview__label">Prompt audio ready</p>
              <audio :src="audioPreviewUrl.front || audioAttachment.front.dataUrl" class="audio-preview" controls></audio>
            </div>
            <div v-if="audioAttachment.back" class="audio-preview-card">
              <p class="audio-preview__label">Answer audio ready</p>
              <audio :src="audioPreviewUrl.back || audioAttachment.back.dataUrl" class="audio-preview" controls></audio>
            </div>
          </div>
        </fieldset>
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
        <button class="button button--success" type="submit">Add card</button>
      </form>
      <p v-if="importError" class="form-error" role="alert">{{ importError }}</p>
      <section class="stage-detail__audio-settings" :class="{ 'stage-detail__audio-settings--collapsed': !showAudioSettings }">
        <header class="stage-detail__audio-settings-header">
          <div>
            <h3>Text-to-speech settings</h3>
            <p class="form-help form-help--status">
              {{
                elevenLabsForm.apiKey
                  ? 'API key saved locally in this browser.'
                  : 'No API key saved yet. Your credentials stay on this device.'
              }}
            </p>
          </div>
          <button class="button button--ghost" type="button" @click="showAudioSettings = !showAudioSettings">
            {{ showAudioSettings ? 'Hide settings' : 'Edit settings' }}
          </button>
        </header>
        <form v-if="showAudioSettings" class="inline-form inline-form--compact" @submit.prevent="saveElevenLabsConfig">
          <div class="form-grid">
            <div class="form-field">
              <label for="tts-key">ElevenLabs API key</label>
              <input id="tts-key" v-model="elevenLabsForm.apiKey" type="password" autocomplete="off" placeholder="Paste your key" />
              <p class="form-help">
                Need help finding your key?
                <button class="link-button" type="button" @click="showApiHelp = true">View quick guide</button>
              </p>
            </div>
            <div class="form-field">
              <label for="tts-voice">Voice ID</label>
              <input id="tts-voice" v-model="elevenLabsForm.voiceId" type="text" />
            </div>
            <div class="form-field">
              <label for="tts-model">Model</label>
              <input id="tts-model" v-model="elevenLabsForm.modelId" type="text" />
            </div>
            <div class="form-field">
              <label for="tts-format">Output format</label>
              <select id="tts-format" v-model="elevenLabsForm.outputFormat">
                <option value="mp3_44100_128">MP3 · 44.1kHz · 128kbps</option>
                <option value="mp3_44100_64">MP3 · 44.1kHz · 64kbps</option>
                <option value="mp3_44100_192">MP3 · 44.1kHz · 192kbps</option>
                <option value="opus_48000_64">Opus · 48kHz · 64kbps</option>
              </select>
            </div>
          </div>
          <button class="button button--ghost" type="submit">Save settings</button>
        </form>
        <p v-if="showAudioSettings" class="form-help">Your ElevenLabs credentials are stored locally in this browser.</p>
      </section>
    </section>

    <section v-else class="stage-detail__form stage-detail__form--student">
      <h2>Read-only stage</h2>
      <p>This stage belongs to a shared course. You can review and study cards, but editing is disabled.</p>
    </section>

    <section class="stage-detail__cards">
      <header class="stage-detail__cards-header">
        <div>
          <h2>Cards</h2>
          <p>{{ cardsView.length }} card{{ cardsView.length === 1 ? '' : 's' }} in this stage.</p>
        </div>
        <div class="stage-detail__cards-actions">
          <router-link class="button button--ghost" :to="{ name: 'StageSession', params: { courseId: course.id, stageId: stage.id } }">
            Start revision
          </router-link>
          <template v-if="!isStudentCourse">
            <button
              class="button button--primary"
              type="button"
              :disabled="bulkStatus.running || !missingAudioCount"
              @click="bulkGenerateAudio"
            >
              <span v-if="bulkStatus.running">Generating… {{ bulkStatus.processed }}/{{ bulkStatus.total }}</span>
              <span v-else>Generate missing audio ({{ missingAudioCount }})</span>
            </button>
          </template>
        </div>
      </header>
      <p v-if="bulkStatus.error" class="form-error" role="alert">{{ bulkStatus.error }}</p>
      <p v-if="bulkStatus.running" class="form-help">Audio generation is running in the background…</p>
      <p v-if="!cardsView.length" class="empty-state">No cards yet. Add your first one above.</p>
      <div v-else class="card-table-wrapper">
        <table class="card-table">
          <thead>
            <tr>
              <th scope="col">Prompt</th>
              <th scope="col">Answer</th>
              <th scope="col">Status</th>
              <th scope="col">Next review</th>
              <th scope="col">Mastery</th>
              <th scope="col">Audio</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="card in cardsView" :key="card.id">
              <td>
                <p class="card-table__front">{{ card.front }}</p>
                <small v-if="card.note" class="card-table__note">{{ card.note }}</small>
              </td>
              <td>{{ card.back }}</td>
              <td>{{ card.status }}</td>
              <td>{{ card.due }}</td>
              <td>{{ card.mastery }}</td>
              <td class="card-table__audio">
                <div class="card-audio-line" :class="{ 'card-audio-line--missing': card.needsFront }">
                  <span class="card-audio-line__label">Front</span>
                  <span class="card-audio-line__meta">
                    <template v-if="['front', 'both'].includes(card.audioSide)">
                      <template v-if="card.audio.front">
                        {{ card.audio.front.source === 'tts' ? 'Generated' : card.audio.front.source === 'recording' ? 'Recording' : 'Imported' }}
                      </template>
                      <template v-else>Missing</template>
                    </template>
                    <template v-else>Not required</template>
                  </span>
                  <audio
                    v-if="card.audio.front"
                    :src="card.audio.front.url"
                    :type="card.audio.front.mimeType"
                    controls
                    preload="none"
                    class="card-audio-line__player"
                  ></audio>
                </div>
                <div class="card-audio-line" :class="{ 'card-audio-line--missing': card.needsBack }">
                  <span class="card-audio-line__label">Back</span>
                  <span class="card-audio-line__meta">
                    <template v-if="['back', 'both'].includes(card.audioSide)">
                      <template v-if="card.audio.back">
                        {{ card.audio.back.source === 'tts' ? 'Generated' : card.audio.back.source === 'recording' ? 'Recording' : 'Imported' }}
                      </template>
                      <template v-else>Missing</template>
                    </template>
                    <template v-else>Not required</template>
                  </span>
                  <audio
                    v-if="card.audio.back"
                    :src="card.audio.back.url"
                    :type="card.audio.back.mimeType"
                    controls
                    preload="none"
                    class="card-audio-line__player"
                  ></audio>
                </div>
                <small class="card-audio-line__hint">Playback: {{ card.audioSide }}</small>
              </td>
              <td class="card-table__actions">
                <template v-if="isStudentCourse">
                  <span class="tag tag--muted">Read-only</span>
                </template>
                <template v-else>
                  <button class="link-button" type="button" @click="removeCard(card.id)">Remove card</button>
                  <button
                    v-if="['front', 'both'].includes(card.audioSide) && card.audio.front"
                    class="link-button"
                    type="button"
                    @click="removeCardAudio(card.id, 'front')"
                  >
                    Remove front audio
                  </button>
                  <button
                    v-if="['back', 'both'].includes(card.audioSide) && card.audio.back"
                    class="link-button"
                    type="button"
                    @click="removeCardAudio(card.id, 'back')"
                  >
                    Remove back audio
                  </button>
                  <button
                    v-if="['front', 'both'].includes(card.audioSide)"
                    class="link-button"
                    type="button"
                    @click="regenerateCardAudio(card, 'front')"
                  >
                    {{ card.audio.front ? 'Regenerate front audio' : 'Generate front audio' }}
                  </button>
                  <button
                    v-if="['back', 'both'].includes(card.audioSide)"
                    class="link-button"
                    type="button"
                    @click="regenerateCardAudio(card, 'back')"
                  >
                    {{ card.audio.back ? 'Regenerate back audio' : 'Generate back audio' }}
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <input ref="fileInput" class="sr-only" type="file" accept=".csv,text/csv" @change="handleCsvUpload" />
    <div v-if="showApiHelp" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="api-help-title">
      <div class="modal-card">
        <h3 id="api-help-title">Finding your ElevenLabs API key</h3>
        <ol>
          <li>
            Visit
            <a href="https://elevenlabs.io" target="_blank" rel="noopener">elevenlabs.io</a>
            and sign in to your account.
          </li>
          <li>Open your profile menu and choose <strong>API Keys</strong>.</li>
          <li>Create or copy a key, then paste it into the field above.</li>
        </ol>
        <p class="form-help">Your key is stored locally in this browser only.</p>
        <button class="button button--primary" type="button" @click="showApiHelp = false">Got it</button>
      </div>
    </div>
  </section>
  <section v-else class="dashboard dashboard--empty">
    <div class="empty-card">
      <h1>Stage not found</h1>
      <p>The stage you were looking for was not found.</p>
      <router-link class="button button--primary" :to="{ name: 'Dashboard' }">Back to dashboard</router-link>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import Papa from 'papaparse'
import { useRoute } from 'vue-router'
import { currentUser, useAuth } from '../composables/useAuth'
import { createId } from '../utils/id'
import { computeStageMetrics } from '../utils/srs'

const emit = defineEmits(['notify'])
const route = useRoute()
const { updateCurrentUser, saveElevenLabsSettings } = useAuth()

const cardForm = reactive({
  front: '',
  back: '',
  note: '',
  audioSide: 'back'
})
const audioTarget = ref('back')
const formError = ref('')
const importError = ref('')
const audioStatus = ref('')
const audioAttachment = reactive({ front: null, back: null })
const audioPreviewUrl = reactive({ front: '', back: '' })
const isRecording = ref(false)
const mediaRecorder = ref(null)
const recordingStream = ref(null)
const generatingAudio = ref(false)
const bulkStatus = reactive({ running: false, processed: 0, total: 0, error: '' })
const fileInput = ref(null)
const showApiHelp = ref(false)

const elevenLabsForm = reactive({
  apiKey: '',
  voiceId: '21m00Tcm4TlvDq8ikWAM',
  modelId: 'eleven_multilingual_v2',
  outputFormat: 'mp3_44100_128'
})

const course = computed(() => {
  const courseId = route.params.courseId
  return currentUser.value?.courses.find(item => item.id === courseId) ?? null
})

const isStudentCourse = computed(() => course.value?.role === 'student')

const stage = computed(() => {
  const stageId = route.params.stageId
  return course.value?.stages.find(item => item.id === stageId) ?? null
})

const cardsView = computed(() => {
  if (!stage.value) {
    return []
  }
  const now = Date.now()
  return stage.value.cards.map(card => {
    const frontAudio = card.audio?.front
      ? {
          url: card.audio.front.dataUrl,
          source: card.audio.front.source,
          mimeType: card.audio.front.mimeType
        }
      : null
    const backAudio = card.audio?.back
      ? {
          url: card.audio.back.dataUrl,
          source: card.audio.back.source,
          mimeType: card.audio.back.mimeType
        }
      : null
    const side = card.audioSide || 'back'
    return {
      id: card.id,
      front: card.front,
      back: card.back,
      note: card.note,
      status: card.due ? (new Date(card.due).getTime() <= now ? 'Due' : 'Scheduled') : 'New',
      due: formatDue(card.due),
      mastery: `${Math.round(card.mastery || 0)}%`,
      audio: { front: frontAudio, back: backAudio },
      audioSide: side,
      needsFront: ['front', 'both'].includes(side) && !frontAudio,
      needsBack: ['back', 'both'].includes(side) && !backAudio
    }
  })
})

const missingAudioCount = computed(() => {
  if (!stage.value) {
    return 0
  }
  return stage.value.cards.reduce((total, card) => {
    const side = card.audioSide || 'back'
    let count = total
    if (['front', 'both'].includes(side) && !card.audio?.front) {
      count += 1
    }
    if (['back', 'both'].includes(side) && !card.audio?.back) {
      count += 1
    }
    return count
  }, 0)
})

const audioTargetLabel = computed(() => (audioTarget.value === 'front' ? 'prompt' : 'answer'))

const elevenLabsSettings = computed(() => currentUser.value?.integrations?.elevenLabs ?? elevenLabsForm)

watch(elevenLabsSettings, value => {
  if (!value) {
    return
  }
  elevenLabsForm.apiKey = value.apiKey || ''
  elevenLabsForm.voiceId = value.voiceId || '21m00Tcm4TlvDq8ikWAM'
  elevenLabsForm.modelId = value.modelId || 'eleven_multilingual_v2'
  elevenLabsForm.outputFormat = value.outputFormat || 'mp3_44100_128'
  if (!audioSettingsInitialised.value) {
    showAudioSettings.value = !value.apiKey
    audioSettingsInitialised.value = true
  }
}, { immediate: true })

watch(() => cardForm.audioSide, value => {
  if (value === 'front') {
    audioTarget.value = 'front'
    audioAttachment.back = null
    cleanupPreview('back')
  } else if (value === 'back') {
    audioTarget.value = 'back'
    audioAttachment.front = null
    cleanupPreview('front')
  }
})

function formatDue(date) {
  if (!date) {
    return 'New card'
  }
  const dueDate = new Date(date)
  if (Number.isNaN(dueDate.getTime())) {
    return 'Unknown'
  }
  const now = Date.now()
  const diff = dueDate.getTime() - now
  if (diff <= 0) {
    return 'Due now'
  }
  const days = Math.round(diff / 86400000)
  if (days === 0) {
    return 'Later today'
  }
  if (days === 1) {
    return 'Tomorrow'
  }
  return `In ${days} days`
}

const recordingSupported = computed(() => typeof window !== 'undefined' && typeof navigator !== 'undefined' && typeof MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia))

function cleanupPreview(side) {
  const targets = side ? [side] : ['front', 'back']
  targets.forEach(name => {
    const url = audioPreviewUrl[name]
    if (url) {
      URL.revokeObjectURL(url)
      audioPreviewUrl[name] = ''
    }
  })
}

function clearAudioAttachment(side = audioTarget.value) {
  stopRecording(true)
  if (side === 'front' || side === 'back') {
    audioAttachment[side] = null
    cleanupPreview(side)
  } else {
    audioAttachment.front = null
    audioAttachment.back = null
    cleanupPreview()
  }
  if (!audioAttachment.front && !audioAttachment.back) {
    audioStatus.value = ''
  }
}

function resetForm() {
  cardForm.front = ''
  cardForm.back = ''
  cardForm.note = ''
  cardForm.audioSide = 'back'
  audioTarget.value = 'back'
  formError.value = ''
  importError.value = ''
  audioAttachment.front = null
  audioAttachment.back = null
  cleanupPreview()
  audioStatus.value = ''
}

function addCard() {
  if (!stage.value || !course.value || isStudentCourse.value) {
    return
  }
  if (!cardForm.front.trim() || !cardForm.back.trim()) {
    formError.value = 'Both sides of the card are required.'
    return
  }
  const audio = {
    front: audioAttachment.front
      ? {
          dataUrl: audioAttachment.front.dataUrl,
          mimeType: audioAttachment.front.mimeType,
          source: audioAttachment.front.source,
          textSource: 'front',
          createdAt: new Date().toISOString()
        }
      : null,
    back: audioAttachment.back
      ? {
          dataUrl: audioAttachment.back.dataUrl,
          mimeType: audioAttachment.back.mimeType,
          source: audioAttachment.back.source,
          textSource: 'back',
          createdAt: new Date().toISOString()
        }
      : null
  }
  updateCurrentUser(user => {
    const targetCourse = user.courses.find(item => item.id === course.value.id)
    if (!targetCourse) {
      return
    }
    const targetStage = targetCourse.stages.find(item => item.id === stage.value.id)
    if (!targetStage) {
      return
    }
    targetStage.cards.push({
      id: createId(),
      front: cardForm.front.trim(),
      back: cardForm.back.trim(),
      note: cardForm.note.trim(),
      createdAt: new Date().toISOString(),
      status: 'new',
      history: [],
      mastery: 0,
      easeFactor: 2.5,
      intervalDays: 0,
      due: null,
      audio: audio.front || audio.back ? audio : null,
      audioSide: cardForm.audioSide
    })
    computeStageMetrics(targetStage)
  })
  if (!response?.warning) {
    emit('notify', 'Card added to the stage!')
  }
  resetForm()
}

function removeCard(cardId) {
  if (!stage.value || !course.value || isStudentCourse.value) {
    return
  }
  const response = applyUserUpdate(user => {
    const targetCourse = user.courses.find(item => item.id === course.value.id)
    if (!targetCourse) {
      return
    }
    const targetStage = targetCourse.stages.find(item => item.id === stage.value.id)
    if (!targetStage) {
      return
    }
    targetStage.cards = targetStage.cards.filter(card => card.id !== cardId)
    computeStageMetrics(targetStage)
  })
  if (!response?.warning) {
    emit('notify', 'Card removed.')
  }
}

function textForCard(card, side = 'front') {
  return (side === 'back' ? card.back : card.front) || ''
}

function stopRecording(force = false) {
  if (!mediaRecorder.value) {
    return
  }
  if (isRecording.value) {
    mediaRecorder.value.stop()
    isRecording.value = false
  } else if (force && recordingStream.value) {
    recordingStream.value.getTracks().forEach(track => track.stop())
  }
  if (force) {
    mediaRecorder.value = null
  }
}

async function startRecording() {
  if (!recordingSupported.value || isRecording.value || isStudentCourse.value) {
    return
  }
  const targetSide = cardForm.audioSide === 'both' ? audioTarget.value : cardForm.audioSide
  if (!['front', 'back'].includes(targetSide)) {
    audioStatus.value = 'Select which side should receive the recording first.'
    return
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    recordingStream.value = stream
    const recorder = new MediaRecorder(stream)
    const chunks = []
    recorder.ondataavailable = event => {
      if (event.data?.size > 0) {
        chunks.push(event.data)
      }
    }
    recorder.onstop = async () => {
      try {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
        await attachAudioFromBlob(blob, 'recording', targetSide)
        audioStatus.value = `Recording ready for the ${targetSide === 'front' ? 'prompt' : 'answer'}.`
      } catch (error) {
        console.warn('Unable to attach recording', error)
        audioStatus.value = 'Unable to process the recording.'
      } finally {
        stream.getTracks().forEach(track => track.stop())
        recordingStream.value = null
        mediaRecorder.value = null
      }
    }
    recorder.start()
    mediaRecorder.value = recorder
    isRecording.value = true
    audioStatus.value = 'Recording…'
  } catch (error) {
    console.warn('Recording failed', error)
    audioStatus.value = 'Recording is not available in this browser.'
  }
}

async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function attachAudioFromBlob(blob, source, side) {
  if (!['front', 'back'].includes(side)) {
    return
  }
  const dataUrl = await blobToDataUrl(blob)
  audioAttachment[side] = {
    dataUrl,
    mimeType: blob.type || 'audio/mpeg',
    source,
    textSource: side
  }
  cleanupPreview(side)
  audioPreviewUrl[side] = URL.createObjectURL(blob)
}

async function requestElevenLabsAudio(text) {
  const apiKey = elevenLabsForm.apiKey?.trim()
  if (!apiKey) {
    throw new Error('Add your ElevenLabs API key in the settings below first.')
  }
  const voiceId = (elevenLabsForm.voiceId || '').trim() || '21m00Tcm4TlvDq8ikWAM'
  const modelId = (elevenLabsForm.modelId || '').trim() || 'eleven_multilingual_v2'
  const outputFormat = (elevenLabsForm.outputFormat || 'mp3_44100_128').trim()
  const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${encodeURIComponent(outputFormat)}`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text,
      model_id: modelId
    })
  })
  if (!response.ok) {
    const message = response.status === 401 ? 'Invalid ElevenLabs API key.' : 'Text-to-speech request failed.'
    throw new Error(message)
  }
  return response.blob()
}

async function generateAudioForForm() {
  if (isStudentCourse.value) {
    return
  }
  const targetSide = cardForm.audioSide === 'both' ? audioTarget.value : cardForm.audioSide
  const text = textForCard(cardForm, targetSide).trim()
  if (!text) {
    audioStatus.value = 'Enter text on the selected side before generating audio.'
    return
  }
  try {
    generatingAudio.value = true
    audioStatus.value = 'Generating audio…'
    const blob = await requestElevenLabsAudio(text)
    await attachAudioFromBlob(blob, 'tts', targetSide)
    audioStatus.value = `Audio generated for the ${targetSide === 'front' ? 'prompt' : 'answer'}.`
  } catch (error) {
    audioStatus.value = error?.message || 'Unable to generate audio.'
  } finally {
    generatingAudio.value = false
  }
}

async function saveElevenLabsConfig() {
  const response = await saveElevenLabsSettings({
    apiKey: elevenLabsForm.apiKey,
    voiceId: elevenLabsForm.voiceId,
    modelId: elevenLabsForm.modelId,
    outputFormat: elevenLabsForm.outputFormat
  })
  if (response?.warning) {
    emit('notify', response.warning)
    return
  }
  emit('notify', 'ElevenLabs settings saved.')
  showAudioSettings.value = false
}

function downloadTemplate() {
  const fields = ['prompt', 'answer', 'note', 'audio', 'audio_side']
  const sample = [
    {
      prompt: "Comment dire 'salut' ?",
      answer: 'Hey there!',
      note: "Hey there! How's it going? – Casual greeting.",
      audio: '',
      audio_side: 'back'
    },
    {
      prompt: 'You greet your manager in the morning. What do you say?',
      answer: 'Good morning!',
      note: 'Good morning! How are you today? – Polite workplace greeting.',
      audio: '',
      audio_side: 'both'
    }
  ]
  const csv = Papa.unparse({ fields, data: sample.map(row => fields.map(field => row[field] ?? '')) })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'digiflashcards-template.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function triggerCsvImport() {
  if (isStudentCourse.value) {
    return
  }
  fileInput.value?.click()
}

function handleCsvUpload(event) {
  const [file] = event.target.files || []
  event.target.value = ''
  if (!file || isStudentCourse.value) {
    return
  }
  importError.value = ''
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: results => {
      processCsvResults(results).catch(error => {
        console.warn('CSV import failed', error)
        importError.value = error?.message || 'Import failed. Please check your file.'
      })
    },
    error: error => {
      importError.value = error?.message || 'Unable to read the file.'
    }
  })
}

async function processCsvResults(results) {
  const records = Array.isArray(results.data) ? results.data : []
  const cards = []
  for (const record of records) {
    const front = (record.prompt || record.front || record.question || '').trim()
    const back = (record.answer || record.back || record.response || '').trim()
    if (!front || !back) {
      continue
    }
    const note = (record.note || record.notes || '').trim()
    const rawSide = String(record.audio_side || record.audioSide || 'back').toLowerCase()
    const audioSide = ['front', 'back', 'both'].includes(rawSide) ? rawSide : 'back'
    const audio = { front: null, back: null }
    const audioValue = (record.audio || record.audio_url || record.audioUrl || '').trim()
    if (audioValue) {
      try {
        if (audioSide === 'both' && audioValue.includes('|')) {
          const [frontValue, backValue] = audioValue.split('|')
          if (frontValue?.trim()) {
            audio.front = await resolveAudioFromValue(frontValue.trim(), 'front')
          }
          if (backValue?.trim()) {
            audio.back = await resolveAudioFromValue(backValue.trim(), 'back')
          }
        } else {
          const preferredSide = audioSide === 'back' ? 'back' : 'front'
          const clip = await resolveAudioFromValue(audioValue, preferredSide)
          if (clip) {
            if (audioSide === 'back') {
              audio.back = clip
            } else if (audioSide === 'front') {
              audio.front = clip
            } else {
              audio.front = { ...clip, textSource: 'front', side: 'front' }
              audio.back = { ...clip, textSource: 'back', side: 'back' }
            }
          }
        }
      } catch (error) {
        console.warn('Unable to import audio for a row', error)
      }
    }
    cards.push({
      id: createId(),
      front,
      back,
      note,
      createdAt: new Date().toISOString(),
      status: 'new',
      history: [],
      mastery: 0,
      easeFactor: 2.5,
      intervalDays: 0,
      due: null,
      audio: audio.front || audio.back ? audio : null,
      audioSide
    })
  }
  if (!cards.length) {
    importError.value = 'No valid cards were found in the file.'
    return
  }
  const response = applyUserUpdate(user => {
    const targetCourse = user.courses.find(item => item.id === course.value?.id)
    if (!targetCourse) {
      return
    }
    const targetStage = targetCourse.stages.find(item => item.id === stage.value?.id)
    if (!targetStage) {
      return
    }
    targetStage.cards.push(...cards)
    computeStageMetrics(targetStage)
  })
  if (!response?.warning) {
    emit('notify', `${cards.length} card${cards.length === 1 ? '' : 's'} imported successfully.`)
  }
  importError.value = ''
}

async function resolveAudioFromValue(value, preferredSide) {
  if (value.startsWith('data:')) {
    const semicolonIndex = value.indexOf(';')
    const mime = semicolonIndex !== -1 ? value.slice(5, semicolonIndex) : 'audio/mpeg'
    return {
      dataUrl: value,
      mimeType: mime,
      source: 'import',
      textSource: preferredSide,
      createdAt: new Date().toISOString()
    }
  }
  if (/^https?:/i.test(value)) {
    const response = await fetch(value)
    if (!response.ok) {
      throw new Error(`Unable to download audio from ${value}`)
    }
    const blob = await response.blob()
    const dataUrl = await blobToDataUrl(blob)
    return {
      dataUrl,
      mimeType: blob.type || 'audio/mpeg',
      source: 'import',
      textSource: preferredSide,
      createdAt: new Date().toISOString()
    }
  }
  return null
}

function removeCardAudio(cardId, side) {
  if (!stage.value || !course.value || isStudentCourse.value) {
    return
  }
  const response = applyUserUpdate(user => {
    const targetCourse = user.courses.find(item => item.id === course.value.id)
    if (!targetCourse) {
      return
    }
    const targetStage = targetCourse.stages.find(item => item.id === stage.value.id)
    if (!targetStage) {
      return
    }
    const targetCard = targetStage.cards.find(card => card.id === cardId)
    if (!targetCard) {
      return
    }
    const payload = targetCard.audio && typeof targetCard.audio === 'object'
      ? targetCard.audio
      : { front: null, back: null }
    if (side === 'front' || side === 'back') {
      payload[side] = null
    } else {
      payload.front = null
      payload.back = null
    }
    targetCard.audio = payload
  })
  if (side === 'front' || side === 'back') {
    emit('notify', `Removed ${side === 'front' ? 'prompt' : 'answer'} audio.`)
  } else {
    emit('notify', 'All audio removed from the card.')
  }
}

async function regenerateCardAudio(card, sideOverride = null) {
  if (!stage.value || !course.value || isStudentCourse.value) {
    return
  }
  let side = sideOverride
  if (!side) {
    if (card.needsBack && !card.needsFront) {
      side = 'back'
    } else if (card.needsFront && !card.needsBack) {
      side = 'front'
    } else {
      side = 'back'
    }
  }
  const text = textForCard(card, side)
  if (!text) {
    emit('notify', 'This card has no text on the selected side to generate audio.')
    return
  }
  try {
    const blob = await requestElevenLabsAudio(text)
    const dataUrl = await blobToDataUrl(blob)
    const response = applyUserUpdate(user => {
      const targetCourse = user.courses.find(item => item.id === course.value.id)
      if (!targetCourse) {
        return
      }
      const targetStage = targetCourse.stages.find(item => item.id === stage.value.id)
      if (!targetStage) {
        return
      }
      const targetCard = targetStage.cards.find(item => item.id === card.id)
      if (!targetCard) {
        return
      }
      if (!targetCard.audio || typeof targetCard.audio !== 'object') {
        targetCard.audio = { front: null, back: null }
      }
      targetCard.audio[side] = {
        dataUrl,
        mimeType: blob.type || 'audio/mpeg',
        source: 'tts',
        textSource: side,
        createdAt: new Date().toISOString()
      }
    })
    emit('notify', `Audio generated for the ${side === 'front' ? 'prompt' : 'answer'}.`)
  } catch (error) {
    emit('notify', error?.message || 'Unable to regenerate audio right now.')
  }
}

async function bulkGenerateAudio() {
  if (!stage.value || !course.value || isStudentCourse.value || bulkStatus.running) {
    return
  }
  const tasks = []
  stage.value.cards.forEach(card => {
    const side = card.audioSide || 'back'
    if (['front', 'both'].includes(side) && !card.audio?.front) {
      tasks.push({ card, side: 'front' })
    }
    if (['back', 'both'].includes(side) && !card.audio?.back) {
      tasks.push({ card, side: 'back' })
    }
  })
  if (!tasks.length) {
    emit('notify', 'All cards already have audio on the required sides.')
    return
  }
  bulkStatus.running = true
  bulkStatus.processed = 0
  bulkStatus.total = tasks.length
  bulkStatus.error = ''
  try {
    for (const task of tasks) {
      const text = textForCard(task.card, task.side)
      if (!text) {
        bulkStatus.processed += 1
        continue
      }
      const blob = await requestElevenLabsAudio(text)
      const dataUrl = await blobToDataUrl(blob)
      const response = applyUserUpdate(user => {
        const targetCourse = user.courses.find(item => item.id === course.value.id)
        if (!targetCourse) {
          return
        }
        const targetStage = targetCourse.stages.find(item => item.id === stage.value.id)
        if (!targetStage) {
          return
        }
        const targetCard = targetStage.cards.find(item => item.id === task.card.id)
        if (!targetCard) {
          return
        }
        if (!targetCard.audio || typeof targetCard.audio !== 'object') {
          targetCard.audio = { front: null, back: null }
        }
        targetCard.audio[task.side] = {
          dataUrl,
          mimeType: blob.type || 'audio/mpeg',
          source: 'tts',
          textSource: task.side,
          createdAt: new Date().toISOString()
        }
      })
      if (response?.warning) {
        bulkStatus.error = response.warning
        break
      }
      bulkStatus.processed += 1
    }
    emit('notify', 'Audio generated for missing card sides.')
  } catch (error) {
    console.warn('Bulk audio generation failed', error)
    bulkStatus.error = error?.message || 'Audio generation failed.'
  } finally {
    bulkStatus.running = false
  }
}

onBeforeUnmount(() => {
  stopRecording(true)
  if (recordingStream.value) {
    recordingStream.value.getTracks().forEach(track => track.stop())
    recordingStream.value = null
  }
  cleanupPreview()
})
</script>
