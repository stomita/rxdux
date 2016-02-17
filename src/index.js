import { Observable, BehaviorSubject, ReplaySubject } from 'rx';
import { toObservable, toPromise } from './utils';

const DEBUG = process.env.DEBUG;

function defaultErrorRecoveryHandler(err, prevState) {
  if (DEBUG) { console.error('*** error =', err); }
  return prevState;
}

function createState(reducer, initState, action$, errorHandler) {
  const initState$ = Observable.of(initState);
  return Observable.of(initState$)
    .concat(action$)
    .scan((prevState$, action) => {
      const nextState$ = new ReplaySubject(1);
      const recoveryState$ = new ReplaySubject(1);
      prevState$
        .last()
        .doAction(() => DEBUG && console.log('>>> action =', action))
        .map((prevState) => {
          const state$ = toObservable(reducer(prevState, action)).shareReplay(1);
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
    .flatMap((state$) => state$)
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
export function createStore(reducer, initialState, errorRecoveryHandler = defaultErrorRecoveryHandler) {
  const action$ = new BehaviorSubject({ type: '@@rxdux/INIT' });
  const state$ = createState(reducer, initialState, action$, errorRecoveryHandler);
  let currState = initialState;
  state$.subscribe((state) => currState = state);
  return {
    dispatch(action) {
      return action$.onNext(action);
    },
    subscribe(...args) {
      return state$.subscribe(...args);
    },
    getState() {
      return currState;
    }
  };
}

/**
 *
 */
export { toObservable, toPromise };
