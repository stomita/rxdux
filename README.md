# Rxdux

[![Build Status](https://travis-ci.org/stomita/rxdux.svg?branch=master)](https://travis-ci.org/stomita/rxdux)

Yet another flux implementation based on redux, extending reducer to allow asynchronous state change.

## Abstract

[Redux](http://redux.js.org), one of the most popular flux implementation, only allows its state reducer with synchronous change.
As this restriction, a redux application tends to yield fat action creators and very thin in reducers.

The `Rxdux` is based on Redux, but allows reducers to return asynchronous state changes.
The reducer can return a promise of state change or a sequence of state changes.
The first is done by `Promise` object, and the second is done by `Observable` in Rx world.
Thunk function or generator function can also be used to yield the state changes.


## Guide

### Reducers

The reducer is a pure function, which accepts state and action and returns next state as in original Redux,
except that it can return a wrapping type to represent the future states.

```typescript
type Reducer<S> = (S, Action) => S | Promise<S> | Observable<S> | Thunk<S> | Generator<S>;
```

#### Promise Reducer

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


#### Observable Reducer

```es6
import { createStore } from 'rxdux';
import { Observable } from 'rx';
import fetchFruits from './fetchFruits';

const initialFruitsState = { records: [], loading: false };

// Reducer
function fruits(state = initialFruitsState, action) {
  switch (action.type) {
    case 'FETCH_FRUITS':
      // can return a Observable object to notify future change of state
      return Observable.create((o) => {
        o.onNext({ ...state, loading: true });
        fetchFruits((err, records) => {
          if (err) { return o.onError(err) }
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

#### Thunk Function Reducer

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


#### Generator Function Reducer

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


### Combining Reducers

The idea of combining reducers is also the same with Redux, but Redux's `combineReducers` cannot be used
because it is not assuming that the reducers will yield asynchronous state changes.

The `Rxdux` has its own `combineReducers` function to create a combined reducers.
It can accept both simple synchronous and asynchronous reducers.

```es6
import { combineReducers, createStore } from 'rxdux';
import wait from './wait';

function num1(state = 0, action) {
  switch (action.type) {
    case 'APPLY':
      return wait(100).then(() => state + action.value);
    default:
      return state;
  }
}

function num2(state = 1, action) {
  switch (action.type) {
    case 'APPLY':
      return wait(200).then(() => state * action.value);
    default:
      return state;
  }
}

const reducer = combineReducers({ num1, num2 });

const store = createStore(reducer);

store.subscribe((state) => {
  console.log(state);
});

// => { num1: 0, num2: 1 }

store.dispatch({ type: 'APPLY', value: 2 });

// => { num1: 2, num2: 1 }
// => { num1: 2, num2: 2 }

store.dispatch({ type: 'APPLY', value: 4 });

// => { num1: 6, num2: 2 }
// => { num1: 6, num2: 8 }

```

### Binding to React Components

Because the interface of dispatching action / notifying state change is same as the original Redux,
you can utilize the works related to Redux even in Rxdux.

To binding the store information to React components, the `react-redux` package is the one and you can use it in Rxdux, too.

```es6
import 'babel-polyfill';

import React, { Component } from 'react';
import { render } from 'react-dom';
import { Provider, connect } from 'react-redux';
import { createStore } from 'rxdux';

import wait from './wait';

// simple reducer to count up gracefully
function counter(state = 0, action) {
  switch (action.type) {
    case 'ADD':
      return function* () {
        for (let i = 0; i < action.value; i++) {
          state = yield wait(100).then(() => state + 1);
        }
      };
    case 'RESET':
      return function* () {
        while (state > 0) {
          state = yield wait(100).then(() => state - 1);
        }
      };
    default:
      return state;
  }
}

const store = createStore(counter);

@connect(
  (state) => ({ counter: state })
)
class Root extends Component {
  render() {
    return (
      <div>
        <div>{ this.props.counter }</div>
        <button onClick={ () => this.props.dispatch({ type: 'ADD', value: 1 }) }>+1</button>
        <button onClick={ () => this.props.dispatch({ type: 'ADD', value: 5 }) }>+5</button>
        <button onClick={ () => this.props.dispatch({ type: 'RESET' }) }>Reset</button>
      </div>
    );
  }
}

class App extends Component {
  render() {
    return (
      <Provider store={ store }>
        <Root />
      </Provider>
    );
  }
}

render(<App />, document.getElementById('root'));

```

### Avoid Blocking of State Changes by Preceding Actions

As the store's state changes will be serialized by the order of incoming actions,
an application which accepts user's input simultaneously will not be responsive
if the application's root store is built by one combined reducer function.

In Rxdux, instead of using one store and combined reducers, it is recommended to create multiple stores for each action serialization scope.
Combining/merging stores is done by `combineStores`/`mergeStores`.

```es6
import { createStore, combineStores, mergeStores } from 'rxdux';
import wait from './wait';

function num(state = 0, action) {
  switch (action.type) {
    case 'ADD':
      return wait(150).then(() => state + action.value);
    default:
      return state;
  }
}

function string(state = 'abc', action) {
  switch (action.type) {
    case 'APPEND':
      return wait(50).then(() => state + action.value);
    default:
      return state;
  }
}

function obj(state = { checked: false }, action) {
  switch (action.type) {
    case 'FLICK':
      return function*() {
        yield { checked: true };
        yield wait(100).then(() => { checked: false });
      }
    default:
      return state;
  }
}

const numStore = createStore(num);
const stringStore = createStore(string);
const objStore = createStore(obj);
const store = mergeStores(
  combineStores({ num: numStore, string: stringStore }),
  objStore
);

store.subscribe((state) => {
  console.log(state);
});

// => { num: 0, string: 'abc', checked: false }

store.dispatch({ type: 'ADD', value: 1 });
store.dispatch({ type: 'APPEND', value: 'def' });
store.dispatch({ type: 'FLICK' });

// => { num: 0, string: 'abc', checked: true }
// => { num: 0, string: 'abcdef', checked: true }
// => { num: 0, string: 'abcdef', checked: false }
// => { num: 1, string: 'abcdef', checked: false }

```

### Error Handling

TODO


### Middlewares

Middleware support is not yet done in Rxdux.
In fact, some middlewares in Redux might be safely used because its store interface is almost same,
but some middlewares which require the changed state information after the action (e.g. `redux-logger`) will not work
because the state change will not always come right after the reducer call.


## License

MIT
