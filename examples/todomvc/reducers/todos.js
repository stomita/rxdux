import { Observable } from 'rx';
import { ADD_TODO, DELETE_TODO, EDIT_TODO, COMPLETE_TODO, COMPLETE_ALL, CLEAR_COMPLETED } from '../constants/ActionTypes'

const initialState = [
  {
    text: 'Use Redux',
    completed: false,
    id: 0
  }
]

function wait(msec) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), msec);
  });
}

let idseq = 1;

function addTodo(text) {
  return wait(1000).then(() => ({
    id: idseq++,
    completed: false,
    text,
  }));
}

function saveTodo(todo) {
  return wait(1000).then(() => ({ id: todo.id }));
}

function deleteTodo(id) {
  return wait(1000).then(() => ({ id }));
}

export default function todos(state = initialState, action) {
  switch (action.type) {
    case ADD_TODO:
      return Observable.create((o) => {
        o.onNext([{ id: -1, text: action.text, saving: true }, ...state ]);
        addTodo(action.text).then((todo) => {
          o.onNext([ todo, ...state ]);
          o.onCompleted();
        });
      });
    case DELETE_TODO:
      return (onNext, onError, onCompleted) => {
        onNext(
          state.map((todo) => (
            todo.id === action.id ?
            Object.assign({}, todo, { deleting: true }) :
            todo
          ))
        );
        deleteTodo(action.id).then(() => {
          onNext(state.filter((todo) => todo.id !== action.id));
          onCompleted();
        })
        .catch(onError);
      };
    case EDIT_TODO:
      return function* () {
        yield state.map((todo) => (
          todo.id === action.id ?
          Object.assign({}, todo, { text: action.text, saving: true }) :
          todo
        ));
        yield saveTodo({ id: action.id, text: action.text }).then(() => {
          return state.map((todo) => (
            todo.id === action.id ?
            Object.assign({}, todo, { text: action.text }) :
            todo
          ));
        });
      };
    case COMPLETE_TODO:
      return state.map(todo =>
        todo.id === action.id ?
          Object.assign({}, todo, { completed: !todo.completed }) :
          todo
      )

    case COMPLETE_ALL:
      const areAllMarked = state.every(todo => todo.completed)
      return state.map(todo => Object.assign({}, todo, {
        completed: !areAllMarked
      }))

    case CLEAR_COMPLETED:
      return state.filter(todo => todo.completed === false)

    default:
      return state
  }
}
