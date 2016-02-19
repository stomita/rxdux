import { Observable, Subject, BehaviorSubject, ReplaySubject } from 'rx';
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
class Store {
  constructor(action$, state$) {
    this._action$ = action$;
    this._state$ = state$;
    this._currState = undefined;
    this._state$.subscribe((state) => this._currState = state);
  }

  dispatch(action) {
    return this._action$.onNext(action);
  }

  subscribe(...args) {
    return this._state$.debounce(0).subscribe(...args);
  }

  getState() {
    return this._currState;
  }

  getObservable() {
    return this._state$;
  }
}


/**
 *
 */
export function createStore(reducer, initialState, errorRecoveryHandler = defaultErrorRecoveryHandler) {
  const action$ = new BehaviorSubject({ type: '@@rxdux/INIT' });
  const state$ = createState(reducer, initialState, action$, errorRecoveryHandler);
  return new Store(action$, state$);
}


/**
 *
 */
export function combineStores(stores) {
  const isArrayStores = Array.isArray(stores);
  const cnames = Object.keys(stores);
  const cstores = isArrayStores ? stores : cnames.map((cname) => stores[cname]);
  const cstates$ = cstores.map((cstore) => cstore.getObservable());
  const state$ = Observable.combineLatest(...cstates$, (...cstates) => {
    return isArrayStores ? cstates : cstates.reduce((state, cstate, i) => {
      const cname = cnames[i];
      return { ...state, [cname]: cstate };
    }, {});
  })
  .shareReplay(1);
  const action$ = new Subject();
  action$.subscribe((action) => {
    cstores.forEach((cstore) => cstore.dispatch(action));
  });
  return new Store(action$, state$);
}

/**
 *
 */
export function mergeStores(...stores) {
  const cstates$ = stores.map((cstore) => cstore.getObservable());
  const state$ = Observable.of({})
    .concat(Observable.merge(...cstates$))
    .scan((state, cstate) => {
      return Object.keys(cstate).reduce((s, prop) => {
        const value = cstate[prop];
        return s[prop] === value ? s : { ...s, [prop]: value };
      }, state);
    })
    .skip(1)
    .distinctUntilChanged()
    .shareReplay(1)
  ;
  const action$ = new Subject();
  action$.subscribe((action) => {
    stores.forEach((cstore) => cstore.dispatch(action));
  });
  return new Store(action$, state$);
}


/**
 *
 */
export { toObservable, toPromise };
