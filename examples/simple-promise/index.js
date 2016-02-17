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
  console.log('state => ', state);
});

store.dispatch({ type: 'CLEAR_FRUITS' });

// => []

wait(1000)
.then(() => {
  store.dispatch({ type: 'FETCH_FRUITS' });
})
.then(() => wait(1000))

// => ['apple', 'orange', 'banana']

.then(() => {
  store.dispatch({ type: 'CLEAR_FRUITS' });
});

// => []
