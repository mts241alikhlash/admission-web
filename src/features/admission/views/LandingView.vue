<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LandingFaq from '../components/landing/LandingFaq.vue'
import LandingFooter from '../components/landing/LandingFooter.vue'
import LandingHero from '../components/landing/LandingHero.vue'
import LandingHowItWorks from '../components/landing/LandingHowItWorks.vue'
import LandingNavbar from '../components/landing/LandingNavbar.vue'
import LandingRequirements from '../components/landing/LandingRequirements.vue'
import LandingWaveSection from '../components/landing/LandingWaveSection.vue'
import SignUpDialog from '../components/SignUpDialog.vue'
import { useSignUpDialog } from '../composables/useSignUpDialog'
import { usePublicAdmission } from '../composables/usePublicAdmission'
import type { ActiveWave, AdmissionDocumentType } from '../types'

const route = useRoute()
const router = useRouter()

const { isOpen, open } = useSignUpDialog()

const { fetchActiveWaves } = usePublicAdmission()

const waves = ref<ActiveWave[]>([])
const documentTypes = ref<AdmissionDocumentType[]>([])
const isLoading = ref(true)
const hasError = ref(false)

const primaryWave = computed(() => waves.value[0] ?? null)

async function loadAdmission() {
  isLoading.value = true
  hasError.value = false
  const data = await fetchActiveWaves()

  if (data) {
    waves.value = data.waves
    documentTypes.value = data.documentTypes
  } else {
    hasError.value = true
  }

  isLoading.value = false
}

onMounted(() => {
  if (route.query.signup === '1') {
    open()
    void router.replace({ query: {} })
  }
  void loadAdmission()
})
</script>

<template>
  <div class="min-h-screen overflow-x-clip bg-[#f7f8f8] text-slate-950">
    <LandingNavbar />

    <main>
      <LandingHero
        :error="hasError"
        :wave="primaryWave"
        :loading="isLoading"
      />
      <div
        v-if="hasError"
        id="gelombang"
        role="alert"
        class="scroll-mt-24 border-b border-amber-200 bg-amber-50 p-5 text-center text-sm text-amber-950"
      >
        Informasi pendaftaran belum dapat dimuat. Silakan coba kembali.
        <button
          type="button"
          class="ml-3 inline-flex min-h-11 items-center font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-950"
          @click="loadAdmission"
        >
          Coba lagi
        </button>
      </div>
      <LandingWaveSection
        v-if="!hasError"
        id="gelombang"
        :waves="waves"
        :loading="isLoading"
      />
      <LandingHowItWorks id="alur" />
      <LandingRequirements
        id="persyaratan"
        :document-types="documentTypes"
        :loading="isLoading"
      />
      <LandingFaq id="faq" />
    </main>

    <LandingFooter />

    <SignUpDialog v-model="isOpen" />
  </div>
</template>
