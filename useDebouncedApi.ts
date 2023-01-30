import { MutableRefObject } from 'react';
import { useAlwaysUpdateCurrentRef } from '..';
import { useDebouncedApiState } from './useDebouncedApiState';
import { isCancelled } from '../../utils/promise/promise';

export type DebouncedApiReturnType<T> = {
  /** fetches immediately */
  fetchRef: MutableRefObject<(req: T, isPeriodic?: boolean) => void>;
  /** debounces fetch */
  fetchDebouncedRef: MutableRefObject<(req: T) => void>;
  cancelPrevFetchRef: MutableRefObject<() => void>;
};

export interface ApiCallbacks<R> {
  onLoading: (params: { loading: boolean; isPeriodic: boolean }) => void;
  onResponse: (res: R) => void;
  onError: (error: boolean) => void;
}

/**
 * @param apiCallbacks no need to memoize any of them
 */
export const useDebouncedApi = <T, R>(apiCall: (req: T) => Promise<R>, apiCallbacks: ApiCallbacks<R>): DebouncedApiReturnType<T> => {
  const { cancellableApiCall, cancellableApiCallDebounce, cancelAllApiCalls } = useDebouncedApiState(apiCall);

  /* fetch */
  const fetchInternal = async (req: T, isPeriodic?: boolean) => {
    apiCallbacks.onLoading({ loading: true, isPeriodic: !!isPeriodic });
    try {
      const res = await cancellableApiCall(req);
      //will not be called if the task is cancelled
      apiCallbacks.onResponse(res);
    } catch (err) {
      //set 'loading' false
      apiCallbacks.onLoading({ loading: false, isPeriodic: !!isPeriodic });
      if (!isCancelled(err)) {
        //set errors
        apiCallbacks.onError(true);
      }
    }
  };

  const fetchRef = useAlwaysUpdateCurrentRef(fetchInternal);

  const fetchDebouncedRef = useAlwaysUpdateCurrentRef((req: T) => {
    //set loading `true` immediately when called, before task actually starts, for UX
    apiCallbacks.onLoading({ loading: true, isPeriodic: false });
    cancellableApiCallDebounce(() => fetchInternal(req));
  });

  const cancelPrevFetchRef = useAlwaysUpdateCurrentRef(() => {
    //set loading `false`, because fetchDebouncedRef sets to `true` immediately when called, before task actually starts
    apiCallbacks.onLoading({ loading: false, isPeriodic: false });
    cancelAllApiCalls();
  });

  return {
    fetchRef,
    fetchDebouncedRef,
    cancelPrevFetchRef,
  };
};
