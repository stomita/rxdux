import assert from 'power-assert';
import { combineReducers } from '../src';
import {
  numReducer, boolReducer, stringReducer,
  numPromiseReducer, stringObservableReducer, resultGeneratorReducer,
} from './utils/reducers';

/**
 *
 */
describe('combineReducers', () => {

  /**
   *
   */
  it('should combine reducers', async () => {
    const reducer = combineReducers({ num: numReducer, string: stringReducer, bool: boolReducer });
    let state$, states, prevState;
    let currState = {
      num: 4,
      string: 'hello',
      bool: false
    };

    state$ = reducer(currState, { type: 'ADD', value: 3 });
    states = await state$.toArray().toPromise();
    assert(states.length === 1);
    prevState = currState;
    currState = states.pop();
    assert(currState !== prevState);
    assert(currState.num === prevState.num + 3);
    assert(currState.string === prevState.string);
    assert(currState.bool === prevState.bool);

    state$ = reducer(currState, { type: 'APPEND', value: 'world' });
    states = await state$.toArray().toPromise();
    assert(states.length === 1);
    prevState = currState;
    currState = states.pop();
    assert(currState !== prevState);
    assert(currState.num === prevState.num);
    assert(currState.string === prevState.string + 'world');
    assert(currState.bool === prevState.bool);

    state$ = reducer(currState, { type: 'TOGGLE' });
    states = await state$.toArray().toPromise();
    assert(states.length === 1);
    prevState = currState;
    currState = states.pop();
    assert(currState !== prevState);
    assert(currState.num === prevState.num);
    assert(currState.string === prevState.string);
    assert(currState.bool === !prevState.bool);

    state$ = reducer(currState, { type: 'RESET' });
    states = await state$.toArray().toPromise();
    assert(states.length === 1);
    prevState = currState;
    currState = states.pop();
    assert(currState.num === 0);
    assert(currState.string === '');
    assert(currState.bool === false);

    state$ = reducer(currState, { type: 'OTHER' });
    states = await state$.toArray().toPromise();
    assert(states.length === 1);
    prevState = currState;
    currState = states.pop();
    assert(currState === prevState);
  });


  /**
   *
   */
  it('should combine async reducers', async () => {
    const reducer = combineReducers({
      num: numPromiseReducer,
      string: stringObservableReducer,
      result: resultGeneratorReducer,
    });
    let state$, states, prevState;
    let currState = {
      num: 2,
      string: 'hello',
      result: {}
    };

    state$ = reducer(currState, { type: 'ADD', value: 3 });
    states = await state$.toArray().toPromise();
    assert(states.length === 1);
    prevState = currState;
    currState = states.pop();
    assert(currState !== prevState);
    assert(currState.num === prevState.num + 3);
    assert(currState.string === prevState.string);
    assert(currState.result === prevState.result);

    state$ = reducer(currState, { type: 'APPEND', value: 'world' });
    states = await state$.toArray().toPromise();
    assert(states.length === 6);
    prevState = currState;
    for (var i = 0; i < 6; i++) {
      assert(states[i].num === prevState.num);
      assert(states[i].string === 'hello' + 'world'.substring(0, i));
      assert(states[i].result === prevState.result);
    }
    currState = states.pop();

    state$ = reducer(currState, { type: 'SEARCH', keyword: 'apple' });
    states = await state$.toArray().toPromise();
    assert(states.length === 2);
    prevState = currState;
    assert(states[0].num === prevState.num);
    assert(states[0].string === prevState.string);
    assert(states[0].result.loading === true);
    assert(states[1].num === prevState.num);
    assert(states[1].string === prevState.string);
    assert(states[1].result.loading === false);
    assert.deepEqual(states[1].result.records, ['apple #1', 'apple #2', 'apple #3']);
    currState = states.pop();

    state$ = reducer(currState, { type: 'RESET' });
    const state = await state$.last().toPromise();
    assert(state.num === 0);
    assert(state.string === '');
    assert(state.result.loading === false);
    assert(state.result.records.length === 0);
  });
});
