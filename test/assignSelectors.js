import assert from 'power-assert';
import { combineReducers, assignSelectors } from '../src';
import { numReducer, stringReducer, identityReducer, resultGeneratorReducer } from './utils/reducers';
import { simpleSelector, combinedSelector, simplePromiseSelector, combinedObservableSelector } from './utils/selectors';

/**
 *
 */
describe('assignSelectors', () => {

  /**
   *
   */
  it('should assign selectors to reducer', async () => {
    const reducer = assignSelectors(
      combineReducers({
        num: numReducer,
        string: stringReducer,
        result: identityReducer,
      }),
      {
        recs1: simpleSelector,
        recs2: combinedSelector,
      }
    );
    let state$, states, prevState;
    let currState = {
      num: 1,
      string: 'banana',
      result: { records: ['grape #1', 'grape #2'] },
    };
    state$ = reducer(currState, { type: 'ADD', value: 2 });
    states = await state$.toArray().toPromise();
    assert(states.length === 1);
    prevState = currState;
    currState = states.pop();
    assert(currState !== prevState);
    assert(currState.num === 3);
    assert(currState.string === prevState.string);
    assert.deepEqual(currState.recs1, ['banana #1', 'banana #2', 'banana #3']);
    assert.deepEqual(currState.recs2, ['banana #1', 'banana #2', 'banana #3', 'grape #1', 'grape #2']);
  });


  /**
   *
   */
  it('should assign async selectors to reducer', async () => {
    const reducer = assignSelectors(
      combineReducers({
        num: numReducer,
        string: stringReducer,
        result: resultGeneratorReducer
      }),
      {
        recs1: simplePromiseSelector,
        recs2: combinedObservableSelector,
      }
    );
    let state$, states, prevState;
    let currState = {
      num: 2,
      string: 'banana',
      result: { records: [] },
    };

    state$ = reducer(currState, { type: 'SEARCH', keyword: 'apple' });
    states = await state$.toArray().toPromise();
    assert(states.length === 6); // change its state for 6 times in total.
    prevState = currState;
    currState = states.pop();
    assert(currState !== prevState);
    assert(currState.num === prevState.num);
    assert(currState.string === prevState.string);
    assert.deepEqual(currState.recs1, ['banana #1', 'banana #2']);
    assert.deepEqual(currState.recs2, ['banana #1', 'banana #2', 'apple #1', 'apple #2', 'apple #3']);
  });

});
