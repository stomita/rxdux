import { Observable, ReplaySubject } from 'rx';

export function isObservable(o) {
  return o !== null && typeof o === 'object' && typeof o.subscribe === 'function';
}

export function isFunction(o) {
  return typeof o === 'function';
}

export function isPromiseLike(o) {
  return o !== null && typeof o === 'object' && typeof o.then === 'function';
}

export function isGenerator(o) {
  return o !== null && typeof o === 'object' && typeof o.next === 'function' && typeof o.throw === 'function';
}

export function isGeneratorFunction(o) {
  if (typeof o !== 'function') { return false; }
  const constructor = o && o.constructor;
  return !!constructor && (
    constructor.name === 'GeneratorFunction' ||
    constructor.displayName === 'GeneratorFunction' ||
    isGenerator(constructor.prototype)
  );
}

export function fromGenerator(gen) {
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

export function fromFunction(fn) {
  return Observable.create((o) => {
    fn(o.onNext.bind(o), o.onError.bind(o), o.onCompleted.bind(o));
  });
}

/**
 *
 */
export function toPromise(o) {
  return new Promise((resolve, reject) => {
    toObservable(o).last().subscribe(resolve, reject);
  });
}

/**
 *
 */
export function toObservable(o) {
  return (
    isObservable(o) ? o :
    isPromiseLike(o) ? Observable.fromPromise(o) :
    isGeneratorFunction(o) || isGenerator(o) ? fromGenerator(o) :
    isFunction(o) ? fromFunction(o) :
    Observable.of(o)
  );
}
