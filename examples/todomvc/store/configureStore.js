import { createStore } from 'rxdux'
import rootReducer from '../reducers'

export default function configureStore(initialState) {
  const store = createStore(rootReducer, initialState);
  return store;
}
