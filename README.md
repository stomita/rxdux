# Rxdux

[![Build Status](https://travis-ci.org/stomita/rxdux.svg?branch=master)](https://travis-ci.org/stomita/rxdux)

Yet another flux implementation based on redux with asynchronous reducer feature

## Abstract

[Redux](http://redux.js.org), one of the most popular flux implementation, only allows its state reducer with synchronous change.
As this restriction, a redux application tends to yield fat action creators and very thin in reducers.

The `Rxdux` is based on Redux, but allows reducers to return asynchronous state changes.
The reducer can return a promise of state change or a sequence of state changes.
The first one is done by returning Promise object, and the second one is done by returning `Observable` in Rx world.

## Examples

### Reducer returns Promise

```es6
import { createStore } from 'rxdux';

// `fetchFruits` will return an array fruits ('apple','orange','banana')
// in node.js style callback function.
import fetchFruits from './fetchFruits';

const initalFruitsState = [];

// Reducer
function fruits(state = initalFruitsState, action) {
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
    return initalFruitsState;
  default:
    return state;
  }
}

let store = createStore(fluits);

store.subscribe((records) => {
  console.log(records);
});

// => []

store.dispatch({ type: 'FETCH_FRUITS' });

// => ['apple', 'orange', 'banana']

store.dispatch({ type: 'CLEAR_FRUITS' });

// => []

```

### Reducer returns Observable

```es6
import { createStore } from 'rxdux';
import { BehaviorSubject } from 'rx';
import fetchFruits from './fetchFruits';

const initalFruitsState = { records: [], loading: false };

// Reducer
function fruits(state = initalFruitsState, action) {
  switch (action.type) {
  case 'FETCH_FRUITS':
    // can return a Observable object to future change of state
    const state$ = new BehaviorSubject({ ...state, loading: true });
    fetchFruits((err, records) => {
      if (err) { return state$.onError(err) }
      state$.onNext({ loading: false, records });
      state$.onCompleted();
    });
    return state$;
  case 'CLEAR_FRUITS':
    // can also return synchronous state change, of course.
    return initalFruitsState;
  default:
    return state;
  }
}

let store = createStore(fluits);

store.subscribe((records) => {
  console.log(records);
});

// => { loading: false, records: [] }

store.dispatch({ type: 'FETCH_FRUITS' });

// => { loading: true, records: [] }
// => { loading: false, records: ['apple', 'orange', 'banana'] }

store.dispatch({ type: 'CLEAR_FRUITS' });

// => { loading: false, records: [] }

```
