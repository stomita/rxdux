# Rxdux

[![Build Status](https://travis-ci.org/stomita/rxdux.svg?branch=master)](https://travis-ci.org/stomita/rxdux)

Yet another flux implementation based on redux with asynchronous reducer feature

## Abstract

[Redux](http://redux.js.org), one of the most popular flux implementation, only allows its state reducer with synchronous change.
As this restriction, a redux application tends to yield fat action creators and very thin in reducers.

The `Rxdux` is based on Redux, but allows reducers to return asynchronous state changes.
The reducer can return a promise of state change or a sequence of state changes.
The first is done by `Promise` object, and the second is done by `Observable` in Rx world.
Thunk function or generator function can also be used to yield the state changes.

## Examples

### Promise Reducer

```es6
import { createStore } from 'rxdux';

// `fetchFruits` will return an array fruits ('apple','orange','banana')
// in node.js style callback function.
import { createStore } from 'rxdux';
import fetchFruits from '../utils/fetchFruits';
import wait from '../utils/wait';

const initialFruitsState = [];

// Reducer
function fruits(state = initialFruitsState, action) {
  switch (action.type) {
    case 'FETCH_FRUITS':
      // can return a Promise object for future change of state
      return new Promise((resolve, reject) => {
        fetchFruits((err, records) => {
          if (err) { return reject(err) }
          resolve(records);
        });
      });
    case 'CLEAR_FRUITS':
      // can also return synchronous state change, of course.
      return initialFruitsState;
    default:
      return state;
  }
}

const store = createStore(fruits);

store.subscribe((state) => {
  console.log(state);
});

// => []

store.dispatch({ type: 'FETCH_FRUITS' });

// => ['apple', 'orange', 'banana']

store.dispatch({ type: 'CLEAR_FRUITS' });

// => []

```


### Observable Reducer

```es6
import { createStore } from 'rxdux';
import { Observable } from 'rx';
import fetchFruits from './fetchFruits';

const initialFruitsState = { records: [], loading: false };

// Reducer
function fruits(state = initialFruitsState, action) {
  switch (action.type) {
    case 'FETCH_FRUITS':
      // can return a Observable object to future change of state
      return Observable.create((o) => {
        o.onNext({ ...state, loading: true });
        fetchFruits((err, records) => {
          if (err) { return state$.onError(err) }
          o.onNext({ records, loading: false });
          o.onCompleted();
        });
      });
    case 'CLEAR_FRUITS':
      // can also return synchronous state change, of course.
      return initialFruitsState;
    default:
      return state;
  }
}

const store = createStore(fruits);

store.subscribe((state) => {
  console.log(state);
});

// => { loading: false, records: [] }

store.dispatch({ type: 'FETCH_FRUITS' });

// => { loading: true, records: [] }
// => { loading: false, records: ['apple', 'orange', 'banana'] }

store.dispatch({ type: 'CLEAR_FRUITS' });

// => { loading: false, records: [] }

```

### Thunk Function Reducer

```es6
import { createStore } from 'rxdux';
import { Observable } from 'rx';
import fetchFruits from './fetchFruits';

const initialFruitsState = { records: [], loading: false };

// Reducer
function fruits(state = initialFruitsState, action) {
  switch (action.type) {
    case 'FETCH_FRUITS':
      // can return a thunk function which accepts three callbacks to tell the state changes
      return (next, error, complete) => {
        next({ ...state, loading: true });
        fetchFruits((err, records) => {
          if (err) { return error(err); }
          next({ records, loading: false });
          complete();
        });
      };
    case 'CLEAR_FRUITS':
      // can also return synchronous state change, of course.
      return initialFruitsState;
    default:
      return state;
  }
}

const store = createStore(fruits);

store.subscribe((state) => {
  console.log(state);
});

// => { loading: false, records: [] }

store.dispatch({ type: 'FETCH_FRUITS' });

// => { loading: true, records: [] }
// => { loading: false, records: ['apple', 'orange', 'banana'] }

store.dispatch({ type: 'CLEAR_FRUITS' });

// => { loading: false, records: [] }

```


### Generator Function Reducer

```es6
import { createStore } from 'rxdux';
import { Observable } from 'rx';
import fetchFruits from './fetchFruits';

const fetchFruitsPromise = () => {
  return new Promise((resolve, reject) => {
    fetchFruits((err, records) => {
      if (err) { return reject(err); }
      resolve(records);
    });
  });
};

const initialFruitsState = { records: [], loading: false };

// Reducer
function fruits(state = initialFruitsState, action) {
  switch (action.type) {
    case 'FETCH_FRUITS':
      // can return a generator function
      return function* () {
        yield { ...state, loading: true };
        // Nested generator function is ok but only top-level yield affects to the state changes.
        yield function* () {
          const records = yield fetchFruitsPromise();
          yield { records, loading: false };
        };
      };
    case 'CLEAR_FRUITS':
      // can also return synchronous state change, of course.
      return initialFruitsState;
    default:
      return state;
  }
}

const store = createStore(fruits);

store.subscribe((state) => {
  console.log(state);
});

// => { loading: false, records: [] }

store.dispatch({ type: 'FETCH_FRUITS' });

// => { loading: true, records: [] }
// => { loading: false, records: ['apple', 'orange', 'banana'] }

store.dispatch({ type: 'CLEAR_FRUITS' });

// => { loading: false, records: [] }

```
