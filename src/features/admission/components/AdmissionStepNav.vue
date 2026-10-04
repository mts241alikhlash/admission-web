<script setup lang="ts">
import { computed } from 'vue'
import { Check } from 'lucide-vue-next'

const props = defineProps<{
  steps: readonly string[]
  currentStep: number
  disabled: boolean
}>()

defineEmits<{ select: [index: number] }>()

const mobileStart = computed(() =>
  Math.max(0, Math.min(props.currentStep - 1, props.steps.length - 3)),
)

function visibleOnMobile(index: number) {
  return index >= mobileStart.value && index < mobileStart.value + 3
}
</script>

<template>
  <div class="border-b pb-4">
    <ol
      class="mx-auto flex w-full max-w-xl items-center justify-center"
      aria-label="Langkah formulir"
    >
      <li
        v-for="(step, index) in steps"
        :key="step"
        class="flex min-w-0 items-center last:flex-none"
        :class="[
          index < steps.length - 1 ? 'flex-1' : '',
          !visibleOnMobile(index) ? 'hidden sm:flex' : '',
        ]"
      >
        <button
          type="button"
          :disabled="disabled"
          :aria-current="index === currentStep ? 'step' : undefined"
          class="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :class="
            index === currentStep
              ? 'border-primary bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:border-primary'
          "
          @click="$emit('select', index)"
        >
          <Check
            v-if="index < currentStep"
            class="size-4"
            aria-hidden="true"
          />
          <span v-else>{{ index + 1 }}</span>
          <span class="sr-only">. {{ step }}</span>
        </button>
        <span
          v-if="index < steps.length - 1"
          data-test="step-connector"
          aria-hidden="true"
          class="mx-1 h-0.5 flex-1 bg-muted sm:mx-2"
          :class="!visibleOnMobile(index + 1) ? 'hidden sm:block' : ''"
        />
      </li>
    </ol>
    <div class="mt-3 text-center">
      <p class="text-xs font-medium text-muted-foreground">
        Langkah {{ currentStep + 1 }} dari {{ steps.length }}
      </p>
      <h2 class="text-sm font-bold">{{ steps[currentStep] }}</h2>
    </div>
  </div>
</template>
