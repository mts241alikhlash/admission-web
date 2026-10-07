import { onBeforeUnmount, onMounted, ref } from 'vue'

export function useLoopCarousel(count: number) {
  const copies = count > 1 ? 3 : 1
  const track = ref<HTMLElement | null>(null)
  const current = ref(0)
  let settleTimer: ReturnType<typeof setTimeout> | undefined

  function step(el: HTMLElement) {
    const [first, second] = Array.from(el.children) as HTMLElement[]
    return second ? second.offsetLeft - first.offsetLeft : first.offsetWidth
  }

  function position(el: HTMLElement) {
    return Math.round(el.scrollLeft / step(el))
  }

  function wrap(index: number) {
    return ((index % count) + count) % count
  }

  function recenter() {
    const el = track.value
    if (!el || copies === 1) return
    const index = position(el)
    if (index >= count && index < count * 2) return
    el.scrollLeft = (wrap(index) + count) * step(el)
  }

  function onScroll() {
    const el = track.value
    if (!el) return
    current.value = wrap(position(el))
    clearTimeout(settleTimer)
    settleTimer = setTimeout(recenter, 120)
  }

  function scrollToIndex(index: number) {
    const el = track.value
    if (!el) return
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)')
      .matches
    el.scrollTo({
      left: Math.max(index, 0) * step(el),
      behavior: smooth ? 'smooth' : 'auto',
    })
  }

  function go(direction: number) {
    const el = track.value
    if (!el) return
    scrollToIndex(position(el) + direction)
  }

  function goTo(index: number) {
    const el = track.value
    if (!el) return
    scrollToIndex(position(el) + (index - current.value))
  }

  function loop<T extends object>(items: T[]) {
    return Array.from({ length: copies }, (_, copy) =>
      items.map((item) => ({ ...item, copy })),
    ).flat()
  }

  onMounted(() => {
    const el = track.value
    if (el && copies > 1) el.scrollLeft = count * step(el)
  })

  onBeforeUnmount(() => clearTimeout(settleTimer))

  function bindTrack(node: unknown) {
    track.value = node instanceof HTMLElement ? node : null
  }

  return {
    bindTrack,
    current,
    copies,
    middleCopy: copies > 1 ? 1 : 0,
    onScroll,
    go,
    goTo,
    loop,
  }
}
