import { Observable, Subject, BehaviorSubject, ReplaySubject } from 'rx';
import { createSelector } from 'reselect';

function isObservable(o) {
  return o !== null && typeof o === 'object' && typeof o.subscribe === 'function';
}

function isPromiseLike(o) {
  return o !== null && typeof o === 'object' && typeof o.then === 'function';
}

function isGenerator(o) {
  return o !== null && typeof o === 'object' && typeof o.next === 'function' && typeof o.throw === 'function';
}

function isGeneratorFunction(o) {
  if (typeof o !== 'function') { return false; }
  const constructor = o && o.constructor;
  return !!constructor && (
    constructor.name === 'GeneratorFunction' ||
    constructor.displayName === 'GeneratorFunction' ||
    isGenerator(constructor.prototype)
  );
}

function fromGenerator(gen) {
  gen = isGeneratorFunction(gen) ? gen() : isGenerator(gen) ? gen : null;
  const sub$ = new ReplaySubject(1);
  function onNext(value) {
    sub$.onNext(value);
    let ret;
    try {
      ret = gen.next(value);
    } catch(e) {
      return sub$.onError(e);
    }
    processNext(ret);
  }
  function onError(err) {
    let ret;
    try {
      ret = gen.throw(err);
    } catch(e) {
      return sub$.onError(e);
    }
    processNext(ret);
  }
  function processNext(ret) {
    if (ret.done) { return sub$.onCompleted(); }
    toPromise(ret.value).then(onNext, onError);
  }
  onNext();
  return sub$.skip(1);
}

export function toPromise(o) {
  return new Promise((resolve, reject) => {
    toObservable(o).last().subscribe(resolve, reject);
  });
}

export function toObservable(o) {
  return (
    isObservable(o) ? o :
    isPromiseLike(o) ? Observable.fromPromise(o) :
    isGeneratorFunction(o) || isGenerator(o) ? fromGenerator(o) :
    Observable.of(o)
  );
}

function defaultErrorHandler(err, prevState) {
  console.log('*** error =', err);
  console.log(err.stack);
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
        .doAction(() => console.log('>>> action =', action))
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
        .doAction(console.log.bind(console, '### state changed ='))
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

export function combineReducerWithSelector(reducer, inputSelectors, resultFunc) {
  const selector = createSelector(inputSelectors, resultFunc);
  let lastSelection;
  return (state, action) => {
    return toObservable(reducer(state, action))
      .flatMap((newState) => {
        let currentSelection;
        return toObservable(selector(newState))
          .doAction((selection) => currentSelection = selection)
          .map((selection) => lastSelection !== selection ? { ...newState, ...selection } : newState)
          .doAction(() => lastSelection = currentSelection)
        ;
      })
      .shareReplay(1)
    ;
  };
}

export function createStore(reducer, errorRecoveryHandler = defaultErrorHandler) {
  const action$ = new BehaviorSubject({ type: '$INIT' });
  const state$ = createState(reducer, action$, errorRecoveryHandler);
  return {
    dispatch: (action) => action$.onNext(action),
    subscribe: (...args) => state$.subscribe(...args),
    getState: () => state$.getValue()
  };
}
