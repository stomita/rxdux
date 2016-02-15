import assert from 'power-assert';
import { combineReducers, toObservable } from '../src';
import {
  numReducer, boolReducer, numPromiseReducer, stringObservableReducer, resultGeneratorReducer,
} from './reducers';

/**
 *
 */
describe('combineReducers', () => {

  /**
   *
   */
  it('should combine reducers', async () => {
    const reducer = combineReducers({ num: numReducer, bool: boolReducer });
    let nextState, states;
    let prevState = { num: 4 };

    nextState = reducer(prevState, { type: 'ADD', value: 3 });
    states = await toObservable(nextState).toArray().toPromise();
    assert(states.length === 1);
    assert(states[0] !== prevState);
    assert(states[0].num === 7);
    assert(states[0].bool === false);
    prevState = states[0];

    nextState = reducer(prevState, { type: 'TOGGLE' });
    states = await toObservable(nextState).toArray().toPromise();
    assert(states.length === 1);
    assert(states[0] !== prevState);
    assert(states[0].num === 7);
    assert(states[0].bool === true);
    prevState = states[0];

    nextState = reducer(prevState, { type: 'RESET' });
    states = await toObservable(nextState).toArray().toPromise();
    assert(states.length === 1);
    assert(states[0] !== prevState);
    assert(states[0].num === 0);
    assert(states[0].bool === false);
    prevState = states[0];

    nextState = reducer(prevState, { type: 'OTHER' });
    states = await toObservable(nextState).toArray().toPromise();
    assert(states.length === 1);
    assert(states[0] === prevState);
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
    let nextState, states;
    let prevState = { num: 2, string: 'hello', result: {} };

    nextState = reducer(prevState, { type: 'ADD', value: 3 });
    states = await toObservable(nextState).toArray().toPromise();
    assert(states.length === 1);
    assert(states[0] !== prevState);
    assert(states[0].num === 5);
    assert(states[0].string === prevState.string);
    assert(states[0].result === prevState.result);
    prevState = states[0];

    nextState = reducer(prevState, { type: 'APPEND', value: 'world' });
    states = await toObservable(nextState).toArray().toPromise();
    assert(states.length === 6);
    for (var i = 0; i < 6; i++) {
      assert(states[i].num === prevState.num);
      assert(states[i].string === 'hello' + 'world'.substring(0, i));
      assert(states[i].result === prevState.result);
    }
    prevState = states[states.length - 1];

    nextState = reducer(prevState, { type: 'SEARCH', keyword: 'apple' });
    states = await toObservable(nextState).toArray().toPromise();
    assert(states.length === 2);
    assert(states[0].num === prevState.num);
    assert(states[0].string === prevState.string);
    assert(states[0].result.loading === true);
    assert(states[1].num === prevState.num);
    assert(states[1].string === prevState.string);
    assert(states[1].result.loading === false);
    assert.deepEqual(states[1].result.records, ['apple #1', 'apple #2', 'apple #3']);
    prevState = states[states.length - 1];

    nextState = reducer(prevState, { type: 'RESET' });
    const state = await toObservable(nextState).last().toPromise();
    assert(state.num === 0);
    assert(state.string === '');
    assert(state.result.loading === false);
    assert(state.result.records.length === 0);
  });
});
