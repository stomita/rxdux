import { Observable, BehaviorSubject, ReplaySubject } from 'rx';
import { toObservable, toPromise } from './utils';

const DEBUG = process.env.DEBUG;

function defaultErrorRecoveryHandler(err, prevState) {
  if (DEBUG) { console.error('*** error =', err); }
  return prevState;
}

function createState(reducer, action$, errorHandler) {
  const initState$ = Observable.of(undefined);
  return Observable.of(initState$)
    .concat(action$)
    .scan((prevState$, action) => {
      const nextState$ = new ReplaySubject(1);
      const recoveryState$ = new ReplaySubject(1);
      prevState$
        .last()
        .doAction(() => DEBUG && console.log('>>> action =', action))
        .map((prevState) => {
          const state$ = toObservable(reducer(prevState, action));
          state$.subscribeOnError((err) => {
            toObservable(errorHandler(err, prevState))
              .subscribe(recoveryState$);
          });
          return state$;
        })
        .flatMap((state$) => state$)
        .catch(recoveryState$)
        .doAction((state) => DEBUG && console.log('### state =>', state))
        .subscribe(nextState$)
      ;
      return nextState$;
    })
    .skip(1)
    .flatMapLatest((state$) => state$)
    .distinctUntilChanged()
    .debounce(0)
    .shareReplay(1)
  ;
}

/**
 *
 */
export function combineReducers(reducers) {
  const rnames = Object.keys(reducers);
  return (state, action) => {
    const cstates$ = rnames.map((rname) => {
      const reducer = reducers[rname];
      return toObservable(reducer(state && state[rname], action));
    });
    return Observable.combineLatest(...cstates$, (...cstates) => {
      return cstates.reduce((prevState, cstate, i) => {
        const rname = rnames[i];
        return prevState[rname] === cstate ? prevState : { ...prevState, [rname]: cstate };
      }, state || {});
    });
  }
}

/**
 *
 */
export function assignSelectors(reducer, selectors) {
  return (state, action) => {
    const sprops = Object.keys(selectors);
    const lastSelections = {};
    return toObservable(reducer(state, action))
      .flatMapLatest((newState) => {
        const selections = sprops.map((prop) => {
          const lastSelection = lastSelections[prop];
          const selector = selectors[prop];
          const selection$ = toObservable(selector(newState));
          return (
            typeof lastSelection === 'undefined' ?
            selection$ :
            selection$.startWith(lastSelection)
          )
          .distinctUntilChanged()
          .map((value) => ({ prop, value }));
        });
        return Observable.of(newState)
          .concat(Observable.merge(...selections))
          .scan((prevState, { prop, value }) => {
            lastSelections[prop] = value;
            return prevState[prop] !== value ? { ...prevState, [prop]: value } : prevState;
          })
          .debounce(0)
        ;
      })
    ;
  };
}

/**
 *
 */
export function createStore(reducer, errorRecoveryHandler = defaultErrorRecoveryHandler) {
  const action$ = new BehaviorSubject({ type: '@@rxdux/INIT' });
  const state$ = createState(reducer, action$, errorRecoveryHandler);
  return {
    dispatch: (action) => action$.onNext(action),
    subscribe: (...args) => state$.subscribe(...args),
    getState: () => state$.getValue()
  };
}

/**
 *
 */
export { toObservable, toPromise };
