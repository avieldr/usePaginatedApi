import { taskDebounce } from '../../utils/debounce';
import { useRef } from 'react';
import { cancelAllPromises, removeFinishedPromiseCancel, withMultiPromiseCancel } from '../../utils/promise/promiseCollection';

type Methods<T, R> = {
  /**
   * @param req
   * @return `Promise` that might be {@link isCancelled cancelled}
   */
  cancellableApiCall(req: T): Promise<R>;
  /**
   * A simple task debounce, dedicated for use with {@link cancellableApiCall}
   * @param createApiCAllTask will be called after debounce 'wait' time is over. You should then {@link cancellableApiCall create the task}
   */
  cancellableApiCallDebounce(createApiCAllTask: () => Promise<unknown>): void;
  /**
   * cancels all {@link cancellableApiCallDebounce debounce-pending} and already-running {@link cancellableApiCall fetchQuote(s)}
   */
  cancelAllApiCalls(): void;
};

export const useDebouncedApiState = <T, R>(apiCall: (req: T) => Promise<R>, debounceTimeMS = 700): Methods<T, R> => {
  const _apiCallDebouncer = useRef(taskDebounce(debounceTimeMS));
  const _apiCallCancels = useRef<(() => void)[]>([]);

  const cancellableApiCall = (req: T): Promise<R> => {
    const { promise, cancel } = withMultiPromiseCancel(apiCall(req), (cancelToRemove) => {
      _apiCallCancels.current = removeFinishedPromiseCancel(cancelToRemove, _apiCallCancels.current);
    });
    _apiCallCancels.current.push(cancel);
    return promise;
  };

  const cancellableApiCallDebounce = (createApiCAllTask: () => Promise<unknown>) => {
    _apiCallDebouncer.current(createApiCAllTask);
  };

  const cancelAllApiCalls = () => {
    //cancel pending (debounced)
    _apiCallDebouncer.current.cancel();
    //cancel running
    const cancels = _apiCallCancels.current;
    _apiCallCancels.current = []; //clear cancel callbacks
    cancelAllPromises(cancels);
  };

  return { cancellableApiCall, cancellableApiCallDebounce, cancelAllApiCalls };
};
