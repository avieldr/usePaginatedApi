import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { OrderParam, PaginatedAPIRequest, PaginatedAPIResponse } from 'pingpong-types';
import { DEFAULT_FIRST_PAGE_SELECTOR, SEARCH_QUERY_DEFAULT, TOTAL_COUNT_DEFAULT } from './consts';
import { ApplicationState } from '../../store';
import { useAlwaysUpdateCurrentRef } from '..';
import { useDebouncedApi } from './useDebouncedApi';

export const usePaginatedAPIState = <ResultItem, E = string>(
  pageSize: number,
  apiCall: (req: PaginatedAPIRequest) => Promise<PaginatedAPIResponse<ResultItem>>,
  orderParams: OrderParam[],
  toTypedError?: (e: unknown) => E,
) => {
  /** State */
  const [searchQuery, setSearchQuery] = useState(SEARCH_QUERY_DEFAULT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const totalCount = useRef(TOTAL_COUNT_DEFAULT);

  /** API */

  const onLoading = useCallback((params: { loading: boolean; isPeriodic: boolean }) => {
    setIsLoading(params.loading);
  }, []);

  const onResponse = useCallback((res: PaginatedAPIResponse<ResultItem>) => {
    const resetResults = res.page === 0;
    setResults((currentResults) => [...(resetResults ? [] : currentResults), ...res.results]);
    totalCount.current = res.totalCount;
  }, []);

  const onError = useCallback((error: boolean) => {
    setError(error);
  }, []);

  const { fetchRef, fetchDebouncedRef, cancelPrevFetchRef } = useDebouncedApi(apiCall, { onLoading, onResponse, onError });
  /** Callbacks */

  const onFetchPage = useCallback(
    async (page: number, debouncable = true) => {
      cancelPrevFetchRef.current();
      const fetch = debouncable ? fetchDebouncedRef : fetchRef;
      fetch.current({
        page,
        pageSize,
        orderParams,
        search: searchQuery,
      });
    },
    [pageSize, searchQuery, orderParams],
  );

  return { results, searchQuery, isLoading, setSearchQuery, onFetchPage, error, setResults, totalCount };
};
