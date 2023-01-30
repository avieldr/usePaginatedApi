export const TOTAL_COUNT_DEFAULT = -1;
export const SEARCH_QUERY_DEFAULT = '';

export const DEFAULT_FIRST_PAGE_SELECTOR = () => undefined;
export const DEFAULT_TO_TYPED_ERROR = (e: unknown) => {
  if (e instanceof Error) {
    return e.message;
  }
  return 'usePaginatedAPI - Unknown Error';
};
