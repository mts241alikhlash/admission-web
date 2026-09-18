<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LandingCta from '../components/landing/LandingCta.vue'
import LandingFaq from '../components/landing/LandingFaq.vue'
import LandingFooter from '../components/landing/LandingFooter.vue'
import LandingHero from '../components/landing/LandingHero.vue'
import LandingHowItWorks from '../components/landing/LandingHowItWorks.vue'
import LandingNavbar from '../components/landing/LandingNavbar.vue'
import LandingRequirements from '../components/landing/LandingRequirements.vue'
import LandingSupport from '../components/landing/LandingSupport.vue'
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
  <div class="min-h-screen overflow-x-clip bg-slate-50 text-slate-950">
    <LandingNavbar />

    <main>
      <div
        v-if="hasError"
        id="gelombang"
        role="alert"
        class="bg-amber-50 p-5 text-center text-sm text-amber-950"
      >
        Informasi pendaftaran belum dapat dimuat. Silakan coba kembali.
        <button
          type="button"
          class="ml-3 font-bold underline"
          @click="loadAdmission"
        >
          Coba lagi
        </button>
      </div>
      <LandingHero
        :error="hasError"
        :wave="primaryWave"
        :loading="isLoading"
      />
      <LandingSupport />
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
      <LandingCta />
    </main>

    <LandingFooter />

    <SignUpDialog v-model="isOpen" />
  </div>
</template>
