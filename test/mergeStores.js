import assert from 'power-assert';
import { createStore, combineReducers, mergeStores } from '../src';
import wait from './utils/wait';
import { numReducer, numPromiseReducer, stringReducer, stringObservableReducer } from './utils/reducers';

/**
 *
 */
describe('mergeStores', () => {

  /**
   *
   */
  it('should merge stores', async () => {
    const states = [];
    const numStore = createStore(combineReducers({ num: numReducer }));
    const stringStore = createStore(combineReducers({ string: stringReducer }), { string: 'abc' });
    const store = mergeStores(numStore, stringStore);
    store.subscribe((s) => states.push(s));
    await wait(100);
    store.dispatch({ type: 'ADD', value: 2 });
    await wait(100);
    store.dispatch({ type: 'APPEND', value: 'de' });
    await wait(100);
    assert.deepEqual(states, [
      { num: 0, string: 'abc' },
      { num: 2, string: 'abc' },
      { num: 2, string: 'abcde' },
    ]);
  });

  it('should combine async reducing stores', async () => {
    const states = [];
    const numStore = createStore(combineReducers({ num: numPromiseReducer }));
    const stringStore = createStore(combineReducers({ string: stringObservableReducer }), { string: 'abc' });
    const store = mergeStores(numStore, stringStore);
    store.subscribe((s) => states.push(s));
    store.dispatch({ type: 'ADD', value: 2 });
    store.dispatch({ type: 'ADD', value: 3 });
    await wait(10);
    store.dispatch({ type: 'APPEND', value: 'de' }); // it will be processed without waiting preceding ADD actions
    await wait(100);
    assert.deepEqual(states, [
      { num: 0, string: 'abc' },
      { num: 0, string: 'abcd' },
      { num: 0, string: 'abcde' },
      { num: 2, string: 'abcde' },
      { num: 5, string: 'abcde' },
    ]);
  });

});
