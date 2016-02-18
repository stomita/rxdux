import 'babel-polyfill';

import React, { Component } from 'react';
import { render } from 'react-dom';
import { Provider, connect } from 'react-redux';
import { createStore } from 'rxdux';

import wait from '../utils/wait';

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
