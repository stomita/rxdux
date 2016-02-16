import { Observable } from 'rx';
import { createSelector } from 'reselect';
import wait from './wait';

function repeat(n) {
  return new Array(n + 1).join('_').split('').map((a, i) => i);
}

export const simpleSelector = createSelector(
  [
    (s) => s.num,
    (s) => s.string,
  ],
  (num, string) => repeat(num).map((i) => `${string} #${i + 1}`)
);

export const combinedSelector = createSelector(
  [
    simpleSelector,
    (s) => s.result.records
  ],
  (recs1, recs2) => recs1.concat(recs2)
);

export const simplePromiseSelector = createSelector(
  [
    (s) => s.num,
    (s) => s.string,
  ],
  (num, string) => {
    return wait(100).then(() => repeat(num).map((i) => `${string} #${i + 1}`))
  }
);

export const combinedObservableSelector = createSelector(
  [
    simplePromiseSelector,
    (s) => s.result.records
  ],
  (recs1, recs2) => {
    return Observable.fromPromise(recs1)
      .concat(
        Observable.merge(
          ...recs2.map((r, i) => Observable.of(r).delay((i + 1) * 10))
        )
      )
      .scan((recs, r) => [ ...recs, r ])
    ;
  }
);
