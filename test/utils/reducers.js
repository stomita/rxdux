import { Observable } from 'rx';
import wait from './wait';

export function identityReducer(state) { return state; }

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

export function stringReducer(state = '', action) {
  switch (action.type) {
    case 'APPEND':
      return state + action.value;
    case 'RESET':
      return '';
    default:
      return state;
  }
}

export function numPromiseReducer(state = 0, action) {
  switch (action.type) {
    case 'ADD':
      return wait(50).then(() => {
        const value = Number(action.value);
        if (isNaN(value)) { throw new Error('value is not a number'); }
        return state + value;
      });
    case 'RESET':
      return wait(100).then(() => 0);
    default:
      return state;
  }
}

export function numObservableReducer(state = 0, action) {
  switch (action.type) {
    case 'ADD':
      return Observable.interval(50)
        .take(action.value)
        .map((i) => state + i + 1);
    case 'RESET':
      return Observable.of(0).delay(100);
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
          yield wait(100);
          const records = [1, 2, 3].map((id) => `${action.keyword} #${id}`);
          yield { ...state, records, loading: false };
        };
      };
    case 'RESET':
      return (function*() {
        yield { records: [], loading: false };
      })();
    default:
      return state;
  }
}
