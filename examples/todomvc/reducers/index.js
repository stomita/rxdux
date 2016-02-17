import { combineReducers } from 'rxdux'
import todos from './todos'

const rootReducer = combineReducers({
  todos
})

export default rootReducer
