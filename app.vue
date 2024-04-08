<template>
  <div class="flex h-screen">
    <aside class="h-full w-[400px] shrink-0 space-y-4 overflow-y-auto border-r">
      <section class="p-2">
        <h3 class="mt-2">プロンプト</h3>
        <ul ref="elInputRef" class="space-y-[2px]">
          <li
            v-for="(word, index) in context.inputWords"
            :key="word.id"
            class="flex items-center gap-1"
          >
            <button class="text-xs" @click="moveUp(index)">↑</button>
            <button class="text-xs" @click="moveDown(index)">↓</button>
            <PrimeCheckbox
              v-model="word.disabled"
              binary
              :trueValue="false"
              :falseValue="true"
            />
            <PrimeInputText
              :modelValue="word.word"
              class="w-64 text-xs"
              size="small"
              @update:modelValue="word.word = $event?.trim() || ''"
            />
            <PrimeInputNumber
              v-model="word.str"
              mode="decimal"
              showButtons
              size="small"
              :min="-10"
              :max="10"
              :pt="{
                input: { root: 'w-6 text-sm py-0 px-1' },
                incrementButton: {
                  root: { class: 'p-0 w-max [&>.p-icon]:w-2 [&>.p-icon]:h-2' },
                },
                decrementButton: {
                  root: { class: 'p-0 w-max [&>.p-icon]:w-2 [&>.p-icon]:h-2' },
                },
              }"
            /><button type="button" @click="removeInputWord(index)">
              <span class="pi pi-trash p-1"></span>
            </button>
            <button type="button" @click="addInputWord(index)">
              <span class="pi pi-plus p-1"></span>
            </button>
          </li>
        </ul>
        <h3 class="mt-2">ネガティブ</h3>
        <ul ref="elNegativeRef">
          <li
            v-for="(word, index) in context.negativeWords"
            :key="word.id"
            class="flex items-center gap-1"
          >
            <span class="handle pi pi-align-justify p-1"></span>
            <PrimeCheckbox
              v-model="word.disabled"
              binary
              :trueValue="false"
              :falseValue="true"
            />
            <PrimeInputText
              :modelValue="word.word"
              class="w-64 text-xs"
              size="small"
              @update:model-value="word.word = $event.trim()"
            />
            <PrimeInputNumber
              v-model="word.str"
              mode="decimal"
              showButtons
              size="small"
              :min="-10"
              :max="10"
              :pt="{
                input: { root: 'w-6 text-sm py-0 px-1' },
                incrementButton: {
                  root: { class: 'p-0 w-max [&>.p-icon]:w-2 [&>.p-icon]:h-2' },
                },
                decrementButton: {
                  root: { class: 'p-0 w-max [&>.p-icon]:w-2 [&>.p-icon]:h-2' },
                },
              }"
            />
            <button type="button" @click="removeNegativeWord(index)">
              <span class="pi pi-trash p-1"></span>
            </button>
          </li>
        </ul>
        <PrimeButton
          class="mt-2"
          severity="secondary"
          outlined
          @click="addNegativeWord"
          ><span class="pi pi-plus mr-1" />ネガティブ追加</PrimeButton
        >
      </section>

      <div class="sticky bottom-0 space-y-4 rounded bg-white p-4">
        <div ref="dropRef" class="sticky top-0 h-10 bg-blue-100">Drop</div>
        <div class="flex items-center gap-4">
          <div>
            <div class="flex items-center gap-1">
              <PrimeCheckbox
                v-model="context.addQuarity"
                inputId="quarity"
                binary
              /><label for="quarity">クオリティ</label>
            </div>
            <div class="flex items-center gap-1">
              ネガティブ<PrimeDropdown
                v-model="context.negativeSetId"
                :options="negativePresetWordSets"
                optionLabel="label"
                optionValue="id"
              />
            </div>
          </div>
          <PrimeDropdown
            v-model="context.size"
            :options="sizeOptions"
            optionLabel="label"
            optionValue="id"
          />
        </div>
        <div>
          <div class="flex items-center gap-1">
            <PrimeCheckbox
              v-model="isCensored"
              inputId="is-censored"
              binary
            /><label for="is-censored">修正</label>
          </div>
        </div>
        <div>
          <pre class="whitespace-pre-wrap break-all text-xs">{{
            inputWordsToSend
          }}</pre>
        </div>
        <div class="flex items-center gap-4">
          <PrimeButton :loading="generating" @click="generateImage"
            >単発生成</PrimeButton
          >
          <PrimeButton
            v-if="!continueGeneration"
            :disabled="generating"
            @click="startGenerating"
            >スタート</PrimeButton
          >
          <PrimeButton v-else @click="stopGenerating">ストップ</PrimeButton>
          <PrimeProgressSpinner v-if="generating" class="size-5" />
          <PrimeButton class="ml-auto" @click="clearCurrentSelection"
            >クリア</PrimeButton
          >
        </div>
      </div>
    </aside>
    <main
      ref="mainRef"
      class="relative flex h-full grow flex-col"
      :class="[isCensored ? 'blur-sm' : '']"
    >
      <div
        class="glow grid grid-cols-4 overflow-y-auto"
        style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))"
      >
        <div v-for="i in result" :key="i" @click="selectedImageUrl = i">
          <img :src="i" />
        </div>
      </div>
      <div
        v-if="selectedImageUrl"
        class="absolute inset-0 bg-white/70"
        @click="selectedImageUrl = undefined"
      >
        <img
          class="pointer-events-none size-full object-contain"
          :src="selectedImageUrl"
        />
      </div>
    </main>
    <PrimeConfirmDialog></PrimeConfirmDialog>
  </div>
</template>
<script setup lang="ts">
import { nanoid } from 'nanoid'
import JSZip from 'jszip'
import { readMetadata } from './utils/png-metadata'

const config = useRuntimeConfig()
const confirm = useConfirm()
const token = config.public.novelaiToken

type Word = { word: string; str: number }
type WordEditable = { word: string; str: number; id: string; disabled: boolean }

type SizeOption = {
  id:
    | 'portrait-small'
    | 'portrait'
    | 'landscape'
    | 'square'
    | 'portrait-large'
    | 'landscape-large'
  label: string
  width: number
  height: number
}
const sizeOptions: SizeOption[] = [
  { id: 'portrait-small', label: '縦小', width: 512, height: 768 },
  { id: 'portrait', label: '縦', width: 832, height: 1216 },
  { id: 'landscape', label: '横', width: 1216, height: 832 },
  { id: 'square', label: '正方形', width: 1024, height: 1024 },
  { id: 'portrait-large', label: '縦大', width: 1024, height: 1536 },
  { id: 'landscape-large', label: '横大', width: 1536, height: 1024 },
]

const selectedImageUrl = ref<string | undefined>(undefined)

const elInputRef = ref<HTMLElement>()
const elNegativeRef = ref<HTMLElement>()
const isCensored = ref(false)
const dropRef = ref<HTMLElement>()

const onPngFileDrop = async (files: File[] | null, event: DragEvent) => {
  const file = files?.[0]
  if (!file) {
    return
  }
  const buffer = new Uint8Array(await file.arrayBuffer())
  const metadata = readMetadata(buffer)

  const novelAiRequestData = JSON.parse(metadata.tEXt.Comment)
  const promptWords = (novelAiRequestData.prompt as string)
    .split(',')
    .map((w) => {
      const trimed = w.trim()
      const str = (trimed.match(/{/g) || []).length
      const word = trimed.replace(/[{}]/g, '')
      return { word, str }
    })
  // const negativeWords = (novelAiRequestData.negative_prompt as string)
  //   .split(',')
  //   .map((w) => {
  //     const trimed = w.trim()
  //     const str = (trimed.match(/{/g) || []).length
  //     const word = trimed.replace(/[{}]/g, '')
  //     return { word, str }
  //   })
  const notExistsWords: string[] = []
  clearCurrentSelection()
  promptWords.forEach(({ word, str }) => {
    const target = context.inputWords.find((iw) => iw.word === word)
    if (target) {
      target.str = str
      target.disabled = false
    } else {
      notExistsWords.push(word)
    }
  })
  if (notExistsWords.length > 0) {
    confirm.require({
      header: '未設定ワード',
      message: notExistsWords.join(', '),
    })
  }
}

useDropZone(dropRef, { onDrop: onPngFileDrop, dataTypes: ['image/png'] })

type Input = {
  negativeSetId: string
  addQuarity: boolean
  inputWords: WordEditable[]
  negativeWords: WordEditable[]
  size: SizeOption['id']
}

const inputStorage = useLocalStorage<Input>(
  'novel-ai-auto_input',
  {
    negativeSetId: 'strong',
    addQuarity: true,
    inputWords: [] as WordEditable[],
    negativeWords: [] as WordEditable[],
    size: 'portrait',
  },
  {
    serializer: { read: JSON.parse, write: JSON.stringify },
  }
)

const defaultInput = {
  model: 'nai-diffusion-3',
  action: 'generate',
  parameters: {
    scale: 5,
    sampler: 'k_euler',
    steps: 28,
    n_samples: 1,
    ucPreset: 0,
    sm: false,
    sm_dyn: false,
    dynamic_thresholding: false,
    controlnet_strength: 1,
    legacy: false,
    add_original_image: false,
    uncond_scale: 1,
    cfg_rescale: 0,
    noise_schedule: 'native',
    legacy_v3_extend: false,
    params_version: 1,
  },
}

const quarityPresetWords: Word[] = [
  { word: 'best quality', str: 0 },
  { word: 'amazing quality', str: 0 },
  { word: 'very aesthetic', str: 0 },
  { word: 'absurdres', str: 0 },
]
const negativePresetWordSets: { id: string; label: string; words: Word[] }[] = [
  {
    id: 'strong',
    label: '強い',
    words: [
      { word: 'lowres', str: 0 },
      { word: 'bad', str: 1 },
      { word: 'error', str: 0 },
      { word: 'fewer', str: 0 },
      { word: 'extra', str: 0 },
      { word: 'missing', str: 0 },
      { word: 'worst quality', str: 0 },
      { word: 'jpeg artifacts', str: 0 },
      { word: 'bad quality', str: 0 },
      { word: 'watermark', str: 0 },
      { word: 'unfinished', str: 0 },
      { word: 'displeasing', str: 0 },
      { word: 'chromatic aberration', str: 0 },
      { word: 'signature', str: 0 },
      { word: 'extra digits', str: 0 },
      { word: 'artistic error', str: 0 },
      { word: 'username', str: 0 },
      { word: 'scan', str: 0 },
      { word: 'abstract', str: -1 },
    ],
  },
  {
    id: 'weak',
    label: '弱い',
    words: [
      { word: 'lowres', str: 0 },
      { word: 'jpeg artifacts', str: 0 },
      { word: 'worst quality', str: 0 },
      { word: 'watermark', str: 0 },
      { word: 'blurry', str: 0 },
      { word: 'very displeasing', str: 0 },
    ],
  },
  {
    id: 'human-centric',
    label: '人間に重点',
    words: [
      { word: 'lowres', str: 0 },
      { word: 'bad', str: 1 },
      { word: 'error', str: 0 },
      { word: 'fewer', str: 0 },
      { word: 'extra', str: 0 },
      { word: 'missing', str: 0 },
      { word: 'worst quality', str: 0 },
      { word: 'jpeg artifacts', str: 0 },
      { word: 'bad quality', str: 0 },
      { word: 'watermark', str: 0 },
      { word: 'unfinished', str: 0 },
      { word: 'displeasing', str: 0 },
      { word: 'chromatic aberration', str: 0 },
      { word: 'signature', str: 0 },
      { word: 'extra digits', str: 0 },
      { word: 'artistic error', str: 0 },
      { word: 'username', str: 0 },
      { word: 'scan', str: 0 },
      { word: 'abstract', str: -1 },
      { word: 'bad anatomy', str: 0 },
      { word: 'bad hands', str: 0 },
      { word: 'mismatched pupils', str: 0 },
      { word: 'heart-shaped pupils', str: 0 },
      { word: 'glowing eyes', str: 0 },
    ],
  },
  {
    id: 'none',
    label: 'なし',
    words: [],
  },
]

// const negativeSetId = ref('strong')
// const addQuarity = ref(true)
// const size = ref<Input['size']>('portrait')
// const context.inputWords = ref<WordEditable[]>([])
// const negativeWords = ref<WordEditable[]>([])

const context = reactive<Input>({
  negativeSetId: 'strong',
  addQuarity: true,
  size: 'portrait',
  inputWords: [],
  negativeWords: [],
})

onMounted(() => {
  if (!inputStorage.value) {
    return
  }
  context.negativeSetId = inputStorage.value.negativeSetId
  context.addQuarity = inputStorage.value.addQuarity
  context.inputWords = inputStorage.value.inputWords.map((iw) => ({
    ...iw,
    word: iw.word.trim(),
  }))
  context.negativeWords = inputStorage.value.negativeWords
  context.size = inputStorage.value.size
})

watch(
  context,
  () => {
    inputStorage.value.negativeSetId = context.negativeSetId
    inputStorage.value.addQuarity = context.addQuarity
    inputStorage.value.inputWords = context.inputWords
    inputStorage.value.negativeWords = context.negativeWords
    inputStorage.value.size = context.size
  },
  { deep: true }
)

const addInputWord = (index: number) => {
  context.inputWords.splice(index + 1, 0, {
    id: nanoid(),
    word: '',
    str: 0,
    disabled: true,
  })
}

const removeInputWord = (index: number) => {
  context.inputWords.splice(index, 1)
}

const addNegativeWord = () => {
  context.negativeWords.push({
    id: nanoid(),
    word: '',
    str: 0,
    disabled: false,
  })
}

const removeNegativeWord = (index: number) => {
  context.negativeWords.splice(index, 1)
}

const moveUp = (index: number) => {
  if (index <= 0) {
    return
  }
  const temp = context.inputWords[index - 1]
  context.inputWords[index - 1] = context.inputWords[index]
  context.inputWords[index] = temp
}

const moveDown = (index: number) => {
  if (index >= context.inputWords.length) {
    return
  }
  const temp = context.inputWords[index + 1]
  context.inputWords[index + 1] = context.inputWords[index]
  context.inputWords[index] = temp
}

const inputWordsToSend = computed(() => {
  return [
    ...context.inputWords.filter((w) => !w.disabled),
    ...(context.addQuarity ? quarityPresetWords : []),
  ]
    .map((w) =>
      w.str >= 0
        ? '{'.repeat(w.str) + w.word + '}'.repeat(w.str)
        : '['.repeat(w.str * -1) + w.word + ']'.repeat(w.str * -1)
    )
    .join(', ')
})

const negativePromptToSend = computed(() => {
  const negativeSet = negativePresetWordSets.find(
    (s) => s.id === context.negativeSetId
  )
  return [
    ...(negativeSet ? negativeSet.words : []),
    ...context.negativeWords.filter((w) => !w.disabled),
  ]
    .map((w) =>
      w.str >= 0
        ? '{'.repeat(w.str) + w.word + '}'.repeat(w.str)
        : '['.repeat(w.str * -1) + w.word + ']'.repeat(w.str * -1)
    )
    .join(',')
})

const sizeToSend = computed(() => {
  return sizeOptions.find((so) => so.id === context.size)
})

const clearCurrentSelection = () => {
  context.inputWords.forEach((i) => (i.disabled = true))
}

async function extractAndDisplayImage(zipBlob: Blob) {
  // JSZipを使用してZipファイルを読み込む
  const zip = new JSZip()
  const content = await zip.loadAsync(zipBlob)

  // Zipファイル内の最初のPNGファイルを探す
  const pngFile = Object.keys(content.files).find((fileName) =>
    fileName.endsWith('.png')
  )
  if (!pngFile) {
    throw new Error('PNGファイルがZip内に見つかりません。')
  }

  // PNGファイルをBlobとして取得
  const pngBlob = await content.file(pngFile)?.async('blob')
  if (!pngBlob) {
    throw new Error('PNGをBlobに変換できません。')
  }

  // BlobからURLを作成し、imgタグのsrc属性に設定
  return URL.createObjectURL(pngBlob)
}

const result = ref<string[]>([])
const generating = ref(false)
const generateImage = async () => {
  generating.value = true
  try {
    const headers = new Headers()
    headers.append('Authorization', `Bearer ${token}`)
    const blob = await $fetch<Blob>('/ai/generate-image', {
      headers,
      body: {
        ...defaultInput,
        parameters: {
          ...defaultInput.parameters,
          width: sizeToSend.value?.width,
          height: sizeToSend.value?.height,
          negative_prompt: negativePromptToSend.value,
          qualityToggle: context.addQuarity || false,
        },
        input: inputWordsToSend.value,
        seed: Math.floor(Math.random() * 10000000000),
      },
      method: 'POST',
    })
    const url = await extractAndDisplayImage(blob)
    result.value.unshift(url)
    if (selectedImageUrl.value) {
      selectedImageUrl.value = url
    }

    const downloadLink = document.createElement('a')
    downloadLink.href = url
    downloadLink.download = `${new Date().getTime()}.png`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  } catch {
  } finally {
    generating.value = false
  }
}

const continueGeneration = ref(false)
const startGenerating = async () => {
  continueGeneration.value = true
  while (continueGeneration.value) {
    await generateImage()
  }
}
const stopGenerating = () => {
  continueGeneration.value = false
}
</script>
