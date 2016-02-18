import { createStore } from 'rxdux';
import { Observable } from 'rx';
import fetchFruits from '../utils/fetchFruits';
import wait from '../utils/wait';

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
