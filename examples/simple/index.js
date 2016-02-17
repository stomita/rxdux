import { createStore } from 'rxdux';
import { BehaviorSubject } from 'rx';
import fetchFruits from '../utils/fetchFruits';
import wait from '../utils/wait';

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

const store = createStore(fruits);

store.subscribe((records) => {
  console.log(records);
});

// => { loading: false, records: [] }

wait(1000)
.then(() => {
  store.dispatch({ type: 'FETCH_FRUITS' });
})
.then(() => wait(1000))

// => { loading: true, records: [] }
// => { loading: false, records: ['apple', 'orange', 'banana'] }

.then(() => {
  store.dispatch({ type: 'CLEAR_FRUITS' });
});

// => { loading: false, records: [] }
