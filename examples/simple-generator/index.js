import { createStore } from 'rxdux';
import fetchFruits from '../utils/fetchFruits';
import wait from '../utils/wait';

function fetchFruitsPromise() {
  return new Promise((resolve, reject) => {
    fetchFruits((err, records) => {
      if (err) { return reject(err); }
      resolve(records);
    });
  });
}

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
  console.log('state =>', state);
});

// => { loading: false, records: [] }

wait(1000)
.then(() => {
  store.dispatch({ type: 'FETCH_FRUITS' });
})
.then(() => wait(1000))

// => { records: [], loading: true }
// => { records: ['apple', 'orange', 'banana'], loading: false }

.then(() => {
  store.dispatch({ type: 'CLEAR_FRUITS' });
});

// => { records: [], loading: false }
