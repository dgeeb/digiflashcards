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
              <label for="audio-mode">Generate audio for</label>
              <select id="audio-mode" v-model="cardForm.audioMode">
                <option value="front">Prompt only</option>
                <option value="back">Answer only</option>
                <option value="both">Both sides</option>
              </select>
            </div>
            <div v-if="cardForm.audioMode === 'both'" class="audio-side-switch">
              <span class="audio-side-switch__label">Active side</span>
              <div class="audio-side-switch__buttons">
                <button
                  class="button button--ghost"
                  type="button"
                  :class="{ 'is-active': cardForm.activeAudioSide === 'front' }"
                  @click="cardForm.activeAudioSide = 'front'"
                >
                  Prompt
                </button>
                <button
                  class="button button--ghost"
                  type="button"
                  :class="{ 'is-active': cardForm.activeAudioSide === 'back' }"
                  @click="cardForm.activeAudioSide = 'back'"
                >
                  Answer
                </button>
              </div>
            </div>
            <div class="audio-fieldset__buttons">
              <button
                class="button button--ghost"
                type="button"
                @click="startRecording"
                :disabled="!recordingSupported || isRecording"
              >
                Record audio ({{ cardForm.activeAudioSide === 'back' ? 'answer' : 'prompt' }})
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
                {{ generatingAudio ? 'Generating…' : 'Generate with ElevenLabs' }}
              </button>
              <button
                class="button button--ghost"
                type="button"
                @click="clearAudioAttachment()"
                :disabled="!audioAttachment[cardForm.activeAudioSide]"
              >
                Remove {{ cardForm.activeAudioSide === 'back' ? 'answer' : 'prompt' }} audio
              </button>
            </div>
          </div>
          <p v-if="!recordingSupported" class="form-help">Recording is not supported in this browser.</p>
          <p v-if="audioStatus" class="form-help">{{ audioStatus }}</p>
          <div class="audio-preview-group">
            <div v-if="audioPreviewUrl.front" class="audio-preview-card">
              <h4>Prompt audio</h4>
              <audio class="audio-preview" :src="audioPreviewUrl.front" controls></audio>
            </div>
            <div v-if="audioPreviewUrl.back" class="audio-preview-card">
              <h4>Answer audio</h4>
              <audio class="audio-preview" :src="audioPreviewUrl.back" controls></audio>
            </div>
          </div>
        </fieldset>
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
        <button class="button button--success" type="submit">Add card</button>
      </form>
      <p v-if="importError" class="form-error" role="alert">{{ importError }}</p>
      <section class="stage-detail__audio-settings">
        <h3>Text-to-speech settings</h3>
        <form class="inline-form inline-form--compact" @submit.prevent="saveElevenLabsConfig">
          <div class="form-grid">
            <div class="form-field">
              <div class="field-label-with-action">
                <label for="tts-key">ElevenLabs API key</label>
                <button class="link-button" type="button" @click="showApiInfo = true">Where to find it?</button>
              </div>
              <input id="tts-key" v-model="elevenLabsForm.apiKey" type="password" autocomplete="off" placeholder="Paste your key" />
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
        <p class="form-help">Your ElevenLabs credentials are stored locally in this browser.</p>
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
            <label class="sr-only" for="bulk-audio-side">Generate audio from</label>
            <select id="bulk-audio-side" v-model="bulkAudioSide">
              <option value="front">Prompt text</option>
              <option value="back">Answer text</option>
              <option value="both">Prompt + answer</option>
            </select>
            <button
              class="button button--primary"
              type="button"
              :disabled="bulkStatus.running || !missingAudioCount"
              @click="bulkGenerateAudio"
            >
              <span v-if="bulkStatus.running">Generating… {{ bulkStatus.processed }}/{{ bulkStatus.total }}</span>
              <span v-else>Generate audio ({{ missingAudioCount }})</span>
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
                <template v-if="card.audio.front || card.audio.back">
                  <div v-if="card.audio.front" class="card-table__audio-item">
                    <audio :src="card.audio.front.url" :type="card.audio.front.mimeType" controls preload="none"></audio>
                    <small>
                      {{ card.audio.front.source === 'tts' ? 'Generated' : card.audio.front.source === 'recording' ? 'Recording' : 'Imported' }} · Prompt
                    </small>
                  </div>
                  <div v-if="card.audio.back" class="card-table__audio-item">
                    <audio :src="card.audio.back.url" :type="card.audio.back.mimeType" controls preload="none"></audio>
                    <small>
                      {{ card.audio.back.source === 'tts' ? 'Generated' : card.audio.back.source === 'recording' ? 'Recording' : 'Imported' }} · Answer
                    </small>
                  </div>
                </template>
                <span v-else class="tag tag--muted">No audio</span>
              </td>
              <td class="card-table__actions">
                <template v-if="isStudentCourse">
                  <span class="tag tag--muted">Read-only</span>
                </template>
                <template v-else>
                  <button class="link-button" type="button" @click="removeCard(card.id)">Remove</button>
                  <button
                    v-if="card.audio.front || card.audio.back"
                    class="link-button"
                    type="button"
                    @click="removeCardAudio(card.id)"
                  >
                    Remove audio
                  </button>
                  <button class="link-button" type="button" @click="regenerateCardAudio(card)">
                    {{ card.audio.front || card.audio.back ? 'Regenerate audio' : 'Generate audio' }}
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <input ref="fileInput" class="sr-only" type="file" accept=".csv,text/csv" @change="handleCsvUpload" />
    <div v-if="showApiInfo" class="modal-backdrop" @click.self="showApiInfo = false">
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="api-info-title">
        <h3 id="api-info-title">Where to find your ElevenLabs API key</h3>
        <ol>
          <li>Sign in to your <a href="https://elevenlabs.io" target="_blank" rel="noopener">ElevenLabs account</a>.</li>
          <li>Open the <strong>Profile → API Keys</strong> section.</li>
          <li>Copy your key and paste it into the field above.</li>
        </ol>
        <button class="button button--primary" type="button" @click="showApiInfo = false">Got it</button>
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
  audioMode: 'front',
  activeAudioSide: 'front'
})
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
const bulkAudioSide = ref('front')
const fileInput = ref(null)
const showApiInfo = ref(false)

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
  return [...stage.value.cards].map(card => ({
    id: card.id,
    front: card.front,
    back: card.back,
    note: card.note,
    status: card.due ? (new Date(card.due).getTime() <= Date.now() ? 'Due' : 'Scheduled') : 'New',
    due: formatDue(card.due),
    mastery: `${Math.round((card.mastery || 0))}%`,
    audio: {
      front: card.audio?.front
        ? {
            url: card.audio.front.dataUrl,
            source: card.audio.front.source,
            mimeType: card.audio.front.mimeType
          }
        : null,
      back: card.audio?.back
        ? {
            url: card.audio.back.dataUrl,
            source: card.audio.back.source,
            mimeType: card.audio.back.mimeType
          }
        : null
    },
    audioSide: card.audioSide || (card.audio?.front && card.audio?.back ? 'both' : card.audio?.front ? 'front' : card.audio?.back ? 'back' : 'none')
  }))
})

const missingAudioCount = computed(() => {
  if (!stage.value) {
    return 0
  }
  if (bulkAudioSide.value === 'both') {
    return stage.value.cards.filter(card => !card.audio || !card.audio.front || !card.audio.back).length
  }
  return stage.value.cards.filter(card => !card.audio || !card.audio[bulkAudioSide.value]).length
})

const elevenLabsSettings = computed(() => currentUser.value?.integrations?.elevenLabs ?? elevenLabsForm)

watch(elevenLabsSettings, value => {
  if (!value) {
    return
  }
  elevenLabsForm.apiKey = value.apiKey || ''
  elevenLabsForm.voiceId = value.voiceId || '21m00Tcm4TlvDq8ikWAM'
  elevenLabsForm.modelId = value.modelId || 'eleven_multilingual_v2'
  elevenLabsForm.outputFormat = value.outputFormat || 'mp3_44100_128'
}, { immediate: true })

watch(() => cardForm.audioMode, value => {
  if (value === 'front' || value === 'back') {
    cardForm.activeAudioSide = value
    const otherSide = value === 'front' ? 'back' : 'front'
    if (audioAttachment[otherSide]) {
      clearAudioAttachment(otherSide, true)
    }
  } else if (value === 'both' && !['front', 'back'].includes(cardForm.activeAudioSide)) {
    cardForm.activeAudioSide = 'front'
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
  targets.forEach(key => {
    const url = audioPreviewUrl[key]
    if (url) {
      URL.revokeObjectURL(url)
      audioPreviewUrl[key] = ''
    }
  })
}

function clearAudioAttachment(side = cardForm.activeAudioSide, silent = false) {
  stopRecording(true)
  const targets = side ? [side] : ['front', 'back']
  targets.forEach(key => {
    audioAttachment[key] = null
    cleanupPreview(key)
  })
  if (!silent) {
    audioStatus.value = side === 'back' ? 'Answer audio removed.' : 'Prompt audio removed.'
  }
}

function resetForm() {
  cardForm.front = ''
  cardForm.back = ''
  cardForm.note = ''
  cardForm.audioMode = 'front'
  cardForm.activeAudioSide = 'front'
  formError.value = ''
  importError.value = ''
  audioStatus.value = ''
  clearAudioAttachment('front', true)
  clearAudioAttachment('back', true)
}

function deriveAudioSide(audio) {
  if (!audio) {
    return 'none'
  }
  const hasFront = Boolean(audio.front)
  const hasBack = Boolean(audio.back)
  if (hasFront && hasBack) {
    return 'both'
  }
  if (hasFront) {
    return 'front'
  }
  if (hasBack) {
    return 'back'
  }
  return 'none'
}

function buildAudioPayloadFromForm() {
  const allowedSides = cardForm.audioMode === 'front'
    ? ['front']
    : cardForm.audioMode === 'back'
      ? ['back']
      : ['front', 'back']
  const now = new Date().toISOString()
  const payload = { front: null, back: null }
  let hasAudio = false
  allowedSides.forEach(side => {
    const attachment = audioAttachment[side]
    if (attachment) {
      payload[side] = {
        dataUrl: attachment.dataUrl,
        mimeType: attachment.mimeType,
        source: attachment.source,
        textSource: side,
        createdAt: attachment.createdAt || now
      }
      hasAudio = true
    }
  })
  if (!hasAudio) {
    return null
  }
  return payload
}

function addCard() {
  if (!stage.value || !course.value || isStudentCourse.value) {
    return
  }
  if (!cardForm.front.trim() || !cardForm.back.trim()) {
    formError.value = 'Both sides of the card are required.'
    return
  }
  const audio = buildAudioPayloadFromForm()
  const audioSide = deriveAudioSide(audio)
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
      audio,
      audioSide
    })
    computeStageMetrics(targetStage)
  })
  emit('notify', 'Card added to the stage!')
  resetForm()
}

function removeCard(cardId) {
  if (!stage.value || !course.value || isStudentCourse.value) {
    return
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
    targetStage.cards = targetStage.cards.filter(card => card.id !== cardId)
    computeStageMetrics(targetStage)
  })
  emit('notify', 'Card removed.')
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
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    recordingStream.value = stream
    const recorder = new MediaRecorder(stream)
    const chunks = []
    const side = cardForm.activeAudioSide === 'back' ? 'back' : 'front'
    recorder.ondataavailable = event => {
      if (event.data?.size > 0) {
        chunks.push(event.data)
      }
    }
    recorder.onstop = async () => {
      try {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
        await attachAudioFromBlob(blob, 'recording', side)
        audioStatus.value = side === 'back' ? 'Recording ready for the answer side.' : 'Recording ready for the prompt side.'
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

async function attachAudioFromBlob(blob, source, textSource) {
  const dataUrl = await blobToDataUrl(blob)
  audioAttachment[textSource] = {
    dataUrl,
    mimeType: blob.type || 'audio/mpeg',
    source,
    textSource,
    createdAt: new Date().toISOString()
  }
  cleanupPreview(textSource)
  audioPreviewUrl[textSource] = URL.createObjectURL(blob)
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
  const side = cardForm.activeAudioSide === 'back' ? 'back' : 'front'
  const text = side === 'back' ? cardForm.back.trim() : cardForm.front.trim()
  if (!text) {
    audioStatus.value = 'Enter text on the selected side before generating audio.'
    return
  }
  try {
    generatingAudio.value = true
    audioStatus.value = 'Generating audio…'
    const blob = await requestElevenLabsAudio(text)
    await attachAudioFromBlob(blob, 'tts', side)
    audioStatus.value = side === 'back' ? 'Answer audio generated with ElevenLabs.' : 'Prompt audio generated with ElevenLabs.'
  } catch (error) {
    audioStatus.value = error?.message || 'Unable to generate audio.'
  } finally {
    generatingAudio.value = false
  }
}

async function saveElevenLabsConfig() {
  await saveElevenLabsSettings({
    apiKey: elevenLabsForm.apiKey,
    voiceId: elevenLabsForm.voiceId,
    modelId: elevenLabsForm.modelId,
    outputFormat: elevenLabsForm.outputFormat
  })
  emit('notify', 'ElevenLabs settings saved.')
}

function downloadTemplate() {
  const fields = ['prompt', 'answer', 'note', 'audio_front', 'audio_back', 'audio_side']
  const sample = [
    { prompt: 'Bonjour', answer: 'Hello', note: 'French greeting', audio_front: '', audio_back: '', audio_side: 'front' },
    { prompt: 'Merci', answer: 'Thank you', note: 'Remember the accent!', audio_front: '', audio_back: '', audio_side: 'both' }
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
    const audioFrontValue = (record.audio_front || record.audioFront || '').trim()
    const audioBackValue = (record.audio_back || record.audioBack || '').trim()
    const legacyAudioValue = (record.audio || record.audio_url || record.audioUrl || '').trim()
    const preferredSideRaw = (record.audio_side || record.audioSide || '').toLowerCase()
    const preferredSide = preferredSideRaw === 'back' ? 'back' : preferredSideRaw === 'both' ? 'both' : 'front'
    const audio = { front: null, back: null }
    if (audioFrontValue) {
      try {
        audio.front = await resolveAudioFromValue(audioFrontValue, 'front')
      } catch (error) {
        console.warn('Unable to import front audio for a row', error)
      }
    }
    if (audioBackValue) {
      try {
        audio.back = await resolveAudioFromValue(audioBackValue, 'back')
      } catch (error) {
        console.warn('Unable to import back audio for a row', error)
      }
    }
    if (!audio.front && !audio.back && legacyAudioValue) {
      try {
        const side = preferredSide === 'back' ? 'back' : 'front'
        const clip = await resolveAudioFromValue(legacyAudioValue, side)
        audio[side] = clip
      } catch (error) {
        console.warn('Unable to import audio for a row', error)
      }
    }
    const audioPayload = audio.front || audio.back ? audio : null
    const audioSide = audioPayload ? (preferredSide === 'both' && audioPayload.front && audioPayload.back
      ? 'both'
      : deriveAudioSide(audioPayload)) : 'none'
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
      audio: audioPayload,
      audioSide
    })
  }
  if (!cards.length) {
    importError.value = 'No valid cards were found in the file.'
    return
  }
  updateCurrentUser(user => {
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
  emit('notify', `${cards.length} card${cards.length === 1 ? '' : 's'} imported successfully.`)
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

function removeCardAudio(cardId) {
  if (!stage.value || !course.value || isStudentCourse.value) {
    return
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
    const targetCard = targetStage.cards.find(card => card.id === cardId)
    if (!targetCard) {
      return
    }
    targetCard.audio = null
    targetCard.audioSide = 'none'
  })
  emit('notify', 'Audio removed from the card.')
}

async function regenerateCardAudio(card) {
  if (!stage.value || !course.value || isStudentCourse.value) {
    return
  }
  const requestSides = bulkAudioSide.value === 'both'
    ? ['front', 'back']
    : [bulkAudioSide.value || (card.audioSide === 'back' ? 'back' : 'front')]
  const clips = []
  for (const side of requestSides) {
    const text = textForCard(card, side)
    if (!text) {
      continue
    }
    try {
      const blob = await requestElevenLabsAudio(text)
      const dataUrl = await blobToDataUrl(blob)
      clips.push({
        side,
        clip: {
          dataUrl,
          mimeType: blob.type || 'audio/mpeg',
          source: 'tts',
          textSource: side,
          createdAt: new Date().toISOString()
        }
      })
    } catch (error) {
      console.warn('Unable to regenerate audio for side', side, error)
    }
  }
  if (!clips.length) {
    emit('notify', 'This card has no text on the selected side to generate audio.')
    return
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
    const targetCard = targetStage.cards.find(item => item.id === card.id)
    if (!targetCard) {
      return
    }
    if (!targetCard.audio || typeof targetCard.audio !== 'object') {
      targetCard.audio = { front: null, back: null }
    }
    clips.forEach(({ side, clip }) => {
      targetCard.audio[side] = clip
    })
    targetCard.audioSide = deriveAudioSide(targetCard.audio)
    if (targetCard.audioSide === 'none') {
      targetCard.audio = null
    }
  })
  emit('notify', 'Audio regenerated for the card.')
}

async function bulkGenerateAudio() {
  if (!stage.value || !course.value || isStudentCourse.value || bulkStatus.running) {
    return
  }
  const targets = stage.value.cards.filter(card => {
    if (bulkAudioSide.value === 'both') {
      return !card.audio || !card.audio.front || !card.audio.back
    }
    return !card.audio || !card.audio[bulkAudioSide.value]
  })
  if (!targets.length) {
    emit('notify', 'All cards already have audio.')
    return
  }
  bulkStatus.running = true
  bulkStatus.processed = 0
  bulkStatus.total = targets.length
  bulkStatus.error = ''
  try {
    for (const card of targets) {
      const sides = bulkAudioSide.value === 'both'
        ? ['front', 'back']
        : [bulkAudioSide.value]
      const clips = []
      for (const side of sides) {
        if (card.audio && card.audio[side]) {
          continue
        }
        const text = textForCard(card, side)
        if (!text) {
          continue
        }
        try {
          const blob = await requestElevenLabsAudio(text)
          const dataUrl = await blobToDataUrl(blob)
          clips.push({
            side,
            clip: {
              dataUrl,
              mimeType: blob.type || 'audio/mpeg',
              source: 'tts',
              textSource: side,
              createdAt: new Date().toISOString()
            }
          })
        } catch (error) {
          console.warn('Unable to generate bulk audio for side', side, error)
        }
      }
      if (!clips.length) {
        bulkStatus.processed += 1
        continue
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
        const targetCard = targetStage.cards.find(item => item.id === card.id)
        if (!targetCard) {
          return
        }
        if (!targetCard.audio || typeof targetCard.audio !== 'object') {
          targetCard.audio = { front: null, back: null }
        }
        clips.forEach(({ side, clip }) => {
          targetCard.audio[side] = clip
        })
        targetCard.audioSide = deriveAudioSide(targetCard.audio)
        if (targetCard.audioSide === 'none') {
          targetCard.audio = null
        }
      })
      bulkStatus.processed += 1
    }
    emit('notify', 'Audio generated for missing cards.')
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
