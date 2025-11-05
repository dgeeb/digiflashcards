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
              <label for="audio-side">Generate audio for</label>
              <select id="audio-side" v-model="cardForm.audioSide">
                <option value="front">Prompt</option>
                <option value="back">Answer</option>
              </select>
            </div>
            <div class="audio-fieldset__buttons">
              <button
                class="button button--ghost"
                type="button"
                @click="startRecording"
                :disabled="!recordingSupported || isRecording"
              >
                Record audio
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
              <button class="button button--ghost" type="button" @click="clearAudioAttachment" :disabled="!audioAttachment">
                Remove audio
              </button>
            </div>
          </div>
          <p v-if="!recordingSupported" class="form-help">Recording is not supported in this browser.</p>
          <p v-if="audioStatus" class="form-help">{{ audioStatus }}</p>
          <audio v-if="audioPreviewUrl" class="audio-preview" :src="audioPreviewUrl" controls></audio>
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
              <label for="tts-key">ElevenLabs API key</label>
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
                <template v-if="card.audio">
                  <audio :src="card.audio.url" :type="card.audio.mimeType" controls preload="none"></audio>
                  <small>
                    {{ card.audio.source === 'tts' ? 'Generated' : card.audio.source === 'recording' ? 'Recording' : 'Imported' }} ·
                    {{ card.audio.textSource === 'back' ? 'Answer' : 'Prompt' }}
                  </small>
                </template>
                <span v-else class="tag tag--muted">No audio</span>
              </td>
              <td class="card-table__actions">
                <template v-if="isStudentCourse">
                  <span class="tag tag--muted">Read-only</span>
                </template>
                <template v-else>
                  <button class="link-button" type="button" @click="removeCard(card.id)">Remove</button>
                  <button v-if="card.audio" class="link-button" type="button" @click="removeCardAudio(card.id)">Remove audio</button>
                  <button class="link-button" type="button" @click="regenerateCardAudio(card)">
                    {{ card.audio ? 'Regenerate audio' : 'Generate audio' }}
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <input ref="fileInput" class="sr-only" type="file" accept=".csv,text/csv" @change="handleCsvUpload" />
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
  audioSide: 'front'
})
const formError = ref('')
const importError = ref('')
const audioStatus = ref('')
const audioAttachment = ref(null)
const audioPreviewUrl = ref('')
const isRecording = ref(false)
const mediaRecorder = ref(null)
const recordingStream = ref(null)
const generatingAudio = ref(false)
const bulkStatus = reactive({ running: false, processed: 0, total: 0, error: '' })
const bulkAudioSide = ref('front')
const fileInput = ref(null)

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
    audio: card.audio
      ? {
          url: card.audio.dataUrl,
          source: card.audio.source,
          textSource: card.audio.textSource || 'front',
          mimeType: card.audio.mimeType
        }
      : null
  }))
})

const missingAudioCount = computed(() => cardsView.value.filter(card => !card.audio).length)

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

function cleanupPreview() {
  if (audioPreviewUrl.value) {
    URL.revokeObjectURL(audioPreviewUrl.value)
    audioPreviewUrl.value = ''
  }
}

function clearAudioAttachment() {
  stopRecording(true)
  audioAttachment.value = null
  audioStatus.value = ''
  cleanupPreview()
}

function resetForm() {
  cardForm.front = ''
  cardForm.back = ''
  cardForm.note = ''
  cardForm.audioSide = 'front'
  formError.value = ''
  importError.value = ''
  clearAudioAttachment()
}

function addCard() {
  if (!stage.value || !course.value || isStudentCourse.value) {
    return
  }
  if (!cardForm.front.trim() || !cardForm.back.trim()) {
    formError.value = 'Both sides of the card are required.'
    return
  }
  const audio = audioAttachment.value
    ? {
        dataUrl: audioAttachment.value.dataUrl,
        mimeType: audioAttachment.value.mimeType,
        source: audioAttachment.value.source,
        textSource: audioAttachment.value.textSource || cardForm.audioSide,
        createdAt: new Date().toISOString()
      }
    : null
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
      audio
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
    recorder.ondataavailable = event => {
      if (event.data?.size > 0) {
        chunks.push(event.data)
      }
    }
    recorder.onstop = async () => {
      try {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
        await attachAudioFromBlob(blob, 'recording', cardForm.audioSide)
        audioStatus.value = 'Recording ready to attach.'
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
  audioAttachment.value = {
    dataUrl,
    mimeType: blob.type || 'audio/mpeg',
    source,
    textSource
  }
  cleanupPreview()
  audioPreviewUrl.value = URL.createObjectURL(blob)
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
  const text = cardForm.audioSide === 'back' ? cardForm.back.trim() : cardForm.front.trim()
  if (!text) {
    audioStatus.value = 'Enter text on the selected side before generating audio.'
    return
  }
  try {
    generatingAudio.value = true
    audioStatus.value = 'Generating audio…'
    const blob = await requestElevenLabsAudio(text)
    await attachAudioFromBlob(blob, 'tts', cardForm.audioSide)
    audioStatus.value = 'Audio generated with ElevenLabs.'
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
  const fields = ['prompt', 'answer', 'note', 'audio', 'audio_side']
  const sample = [
    { prompt: 'Bonjour', answer: 'Hello', note: 'French greeting', audio: '', audio_side: 'front' },
    { prompt: 'Merci', answer: 'Thank you', note: 'Remember the accent!', audio: '', audio_side: 'front' }
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
    const side = (record.audio_side || record.audioSide || 'front').toLowerCase() === 'back' ? 'back' : 'front'
    let audio = null
    const audioValue = (record.audio || record.audio_url || record.audioUrl || '').trim()
    if (audioValue) {
      try {
        audio = await resolveAudioFromValue(audioValue, side)
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
      audio
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
  })
  emit('notify', 'Audio removed from the card.')
}

async function regenerateCardAudio(card) {
  if (!stage.value || !course.value || isStudentCourse.value) {
    return
  }
  const side = card.audio?.textSource || bulkAudioSide.value || 'front'
  const text = textForCard(card, side)
  if (!text) {
    emit('notify', 'This card has no text on the selected side to generate audio.')
    return
  }
  try {
    const blob = await requestElevenLabsAudio(text)
    const dataUrl = await blobToDataUrl(blob)
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
      targetCard.audio = {
        dataUrl,
        mimeType: blob.type || 'audio/mpeg',
        source: 'tts',
        textSource: side,
        createdAt: new Date().toISOString()
      }
    })
    emit('notify', 'Audio regenerated for the card.')
  } catch (error) {
    emit('notify', error?.message || 'Unable to regenerate audio right now.')
  }
}

async function bulkGenerateAudio() {
  if (!stage.value || !course.value || isStudentCourse.value || bulkStatus.running) {
    return
  }
  const targets = stage.value.cards.filter(card => !card.audio)
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
      const text = textForCard(card, bulkAudioSide.value)
      if (!text) {
        bulkStatus.processed += 1
        continue
      }
      const blob = await requestElevenLabsAudio(text)
      const dataUrl = await blobToDataUrl(blob)
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
        targetCard.audio = {
          dataUrl,
          mimeType: blob.type || 'audio/mpeg',
          source: 'tts',
          textSource: bulkAudioSide.value,
          createdAt: new Date().toISOString()
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
