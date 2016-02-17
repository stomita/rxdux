import { createStore } from 'rxdux';
import { BehaviorSubject } from 'rx';
import fetchFruits from '../utils/fetchFruits';
import wait from '../utils/wait';

const initialFruitsState = { records: [], loading: false };

// Reducer
function fruits(state = initialFruitsState, action) {
  switch (action.type) {
    case 'FETCH_FRUITS':
      // can return a Observable object to future change of state
      const state$ = new BehaviorSubject({ ...state, loading: true });
      fetchFruits((err, records) => {
        if (err) { return state$.onError(err) }
        state$.onNext({ records, loading: false });
        state$.onCompleted();
      });
      return state$;
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

// => { records: [], loading: false }

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