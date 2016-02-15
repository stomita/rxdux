import Rx, { Observable } from 'rx';

function wait(msec) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), msec);
  });
}

export function numReducer(state = 0, action) {
  switch (action.type) {
    case 'ADD':
      return state + action.value;
    case 'RESET':
      return 0;
    default:
      return state;
  }
}

export function boolReducer(state = false, action) {
  switch (action.type) {
    case 'TOGGLE':
      return !state;
    case 'RESET':
      return false;
    default:
      return state;
  }
}

export function numPromiseReducer(state = 1, action) {
  switch (action.type) {
    case 'ADD':
      return wait(100).then(() => {
        const value = Number(action.value);
        if (isNaN(value)) { throw new Error('value is not a number'); }
        return state + value;
      });
    case 'RESET':
      return wait(80).then(() => 0);
    default:
      return state;
  }
}

export function stringObservableReducer(state = '', action) {
  switch (action.type) {
    case 'APPEND':
      return Observable.of(state)
        .concat(
          Observable.interval(10)
            .take(action.value.length)
            .map((i) => action.value[i])
        )
        .scan((str, c) => str + c);
    case 'RESET':
      return Observable.of('').delay(30);
    default:
      return state;
  }
}

export function resultGeneratorReducer(state = { records: [], loading: false }, action) {
  switch (action.type) {
    case 'SEARCH':
      return function*() {
        state = { ...state, loading: true };
        yield state;
        yield function*() {
          yield wait(100)
          const records = [1,2,3].map((id) => `${action.keyword} #${id}`);
          yield { ...state, records, loading: false };
        };
      };
    case 'RESET':
      const gen = function*() { yield { records: [], loading: false }; };
      return gen();
    default:
      return state;
  }
}
