<template>
  <div class="flex h-screen">
    <aside class="h-full w-80 shrink-0 border-r">
      <PrimeCheckbox v-model="input.addQuarity">クオリティ</PrimeCheckbox>
      <PrimeCheckbox v-model="input.addNegative">ネガティブ</PrimeCheckbox>
      <section>
        <ul>
          <li
            v-for="(inputWord, index) in input.inputWords"
            :key="index"
            class="flex items-center"
          >
            <PrimeInputText v-model="inputWord.word" />
            <PrimeInputNumber
              v-model="inputWord.str"
              mode="decimal"
              showButtons
              :min="-10"
              :max="10"
              :pt="{
                input: { root: 'w-10' },
              }"
            /><PrimeButton
              icon="pi pi-bookmark"
              severity="secondary"
              text
              rounded
              aria-label="Bookmark"
              @click="removeInputWord(index)"
              >削除</PrimeButton
            >
          </li>
        </ul>
        <PrimeButton @click="addInputWord">プロンプト追加</PrimeButton>
      </section>
      <section>
        <ul>
          <li v-for="(word, index) in input.negativeWords" :key="index">
            <PrimeInputText v-model="word.word" /><PrimeInputNumber
              v-model="word.str"
              mode="decimal"
              showButtons
              :min="-10"
              :max="10"
            /><PrimeButton @click="removeNegativeWord(index)">削除</PrimeButton>
          </li>
        </ul>
        <PrimeButton @click="addNegativeWord">プロンプト追加</PrimeButton>
      </section>
      <div>
        <PrimeButton @click="generateImage">テスト生成</PrimeButton>
      </div>
    </aside>
    <main class="h-full grow">
      <div v-for="i in result" :key="i">
        <img :src="i" />
      </div>
    </main>
  </div>
</template>
<script setup lang="ts">
import JSZip from 'jszip'
const token =
  'pst-FhLFrBEdhs2MsRxfRAcNM6YcGdgtvEZnpTeJrTdE6aoH64wDpTe8ymaxpNno4iqA'

const defaultInput = {
  model: 'nai-diffusion-3',
  action: 'generate',
  parameters: {
    width: 1216,
    height: 832,
    scale: 5,
    sampler: 'k_euler',
    steps: 28,
    n_samples: 1,
    ucPreset: 0,
    qualityToggle: true,
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
type WordWithStr = { word: string; str: number }

const quarityPresetWords: WordWithStr[] = [
  { word: 'best quality', str: 0 },
  { word: 'amazing quality', str: 0 },
  { word: 'very aesthetic', str: 0 },
  { word: 'absurdres', str: 0 },
]
const negativePresetWords: WordWithStr[] = [
  { word: 'lowres', str: 0 },
  { word: 'bad', str: 1 },
  { word: 'error', str: 0 },
  { word: 'fewer', str: 0 },
  { word: 'extra', str: 0 },
  { word: 'missing', str: 0 },
  { word: 'worstquality', str: 0 },
  { word: 'jpegartifacts', str: 0 },
  { word: 'badquality', str: 0 },
  { word: 'watermark', str: 0 },
  { word: 'unfinished', str: 0 },
  { word: 'displeasing', str: 0 },
  { word: 'chromaticaberration', str: 0 },
  { word: 'signature', str: 0 },
  { word: 'extradigits', str: 0 },
  { word: 'artisticerror', str: 0 },
  { word: 'username', str: 0 },
  { word: 'scan', str: 0 },
  { word: 'abstract', str: -1 },
]

const input = reactive({
  addNegative: true,
  addQuarity: true,
  inputWords: [] as WordWithStr[],
  negativeWords: [] as WordWithStr[],
})

watch(input, () => {})

const addInputWord = () => {
  input.inputWords.push({ word: '', str: 0 })
}

const removeInputWord = (index: number) => {
  input.inputWords.splice(index, 1)
}

const addNegativeWord = () => {
  input.negativeWords.push({ word: '', str: 0 })
}

const removeNegativeWord = (index: number) => {
  input.negativeWords.splice(index, 1)
}

const inputWordsToSend = computed(() => {
  return [...input.inputWords, ...(input.addQuarity ? quarityPresetWords : [])]
    .map((w) =>
      w.str >= 0
        ? '{'.repeat(w.str) + w.word + '}'.repeat(w.str)
        : '['.repeat(w.str * -1) + w.word + ']'.repeat(w.str * -1)
    )
    .join(', ')
})

const negativePromptToSend = computed(() => {
  return [
    ...input.negativeWords,
    ...(input.addQuarity ? negativePresetWords : []),
  ]
    .map((w) =>
      w.str >= 0
        ? '{'.repeat(w.str) + w.word + '}'.repeat(w.str)
        : '['.repeat(w.str * -1) + w.word + ']'.repeat(w.str * -1)
    )
    .join(',')
})

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
const generateImage = async () => {
  const headers = new Headers()
  headers.append('Authorization', `Bearer ${token}`)
  const blob = await $fetch<Blob>('/novelai/ai/generate-image', {
    headers,
    body: {
      ...defaultInput,
      input: inputWordsToSend.value,
      negative_prompt: negativePromptToSend.value,
      seed: Math.floor(Math.random() * 10000000000),
    },
    method: 'POST',
  })
  const url = await extractAndDisplayImage(blob)
  result.value.push(url)

  const downloadLink = document.createElement('a')
  downloadLink.href = url
  downloadLink.download = `${new Date().getTime()}.png`
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)
}
</script>
