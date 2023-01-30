import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { OrderParam, PaginatedAPIRequest, PaginatedAPIResponse } from 'pingpong-types';
import { DEFAULT_FIRST_PAGE_SELECTOR } from './consts';
import { ApplicationState } from '../../store';
import { usePaginatedAPIState } from './usePaginatedAPIState';
import { useAlwaysUpdateCurrentRef } from '..';

export const usePaginatedAPI = <ResultItem, E = string>(
  pageSize: number,
  apiCall: (req: PaginatedAPIRequest) => Promise<PaginatedAPIResponse<ResultItem>>,
  orderParams: OrderParam[],
  firstPageSelecter: (state: ApplicationState) => ResultItem[] | undefined = DEFAULT_FIRST_PAGE_SELECTOR,
  toTypedError?: (e: unknown) => E,
) => {
  /** Store */
  const firstPageFromStore = useSelector(firstPageSelecter);

  /** State */
  const { results, searchQuery, isLoading, setSearchQuery, onFetchPage, error, setResults, totalCount } = usePaginatedAPIState(pageSize, apiCall, orderParams, toTypedError);

  const currentPageRef = useAlwaysUpdateCurrentRef(Math.ceil(results.length / pageSize) - 1);

  const onFetchFirstPageRef = useAlwaysUpdateCurrentRef(() => onFetchPage(0, true).catch(() => undefined)); // silent. error handling can be done using 'dataError'
  const onFetchNextPageRef = useAlwaysUpdateCurrentRef(() => onFetchPage(currentPageRef.current + 1, false).catch(() => undefined));

  /** Callbacks */
  const onEndReached = useCallback(() => {
    if (!isLoading && results.length < totalCount.current) {
      onFetchNextPageRef.current();
    }
  }, [isLoading, results.length]);

  /** Effects */

  /** OnMount / OnSearchQueryChanged */
  useEffect(() => {
    if (searchQuery.length === 0 && !!firstPageFromStore) {
      setResults(firstPageFromStore);
    } else {
      onFetchFirstPageRef.current();
    }
  }, [searchQuery]);

  return { results, searchQuery, isLoading, setSearchQuery, onEndReached, error };
};
