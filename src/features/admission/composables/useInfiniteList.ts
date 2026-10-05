import { computed } from 'vue'
import {
  keepPreviousData,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/vue-query'
import { getIndonesianErrorMessage } from '@mts241alikhlash/web-shared/utils/error-handler'

const PAGE_SIZE = 20

interface Page<T> {
  data?: T[]
  meta?: { total?: number }
}

export function useInfiniteList<T>(options: {
  scope: string[]
  filters: Record<string, unknown>
  fetchPage: (page: number, limit: number) => Promise<Page<T>>
  errorMessage: string
}) {
  const queryClient = useQueryClient()

  const query = useInfiniteQuery({
    queryKey: [...options.scope, options.filters],
    queryFn: ({ pageParam }) => options.fetchPage(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage: Page<T>, pages: Page<T>[]) => {
      const loaded = pages.reduce(
        (count, page) => count + (page.data?.length ?? 0),
        0,
      )
      return loaded < (lastPage.meta?.total ?? 0) ? pages.length + 1 : undefined
    },
    placeholderData: keepPreviousData,
  })

  const items = computed(
    () => query.data.value?.pages.flatMap((page) => page.data ?? []) ?? [],
  )
  const totalItems = computed(
    () => query.data.value?.pages[0]?.meta?.total ?? 0,
  )
  const listError = computed(() =>
    query.error.value
      ? getIndonesianErrorMessage(query.error.value, options.errorMessage)
      : null,
  )

  function loadMore() {
    if (query.hasNextPage.value && !query.isFetching.value) {
      void query.fetchNextPage()
    }
  }

  function refresh() {
    return queryClient.invalidateQueries({ queryKey: options.scope })
  }

  return {
    items,
    totalItems,
    listError,
    loading: query.isPending,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    loadMore,
    refresh,
  }
}
