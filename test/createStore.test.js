import assert from 'power-assert';
import { createStore } from '../src';
import wait from './utils/wait';
import { numReducer, numPromiseReducer, numObservableReducer, numThunkReducer, numGeneratorReducer } from './utils/reducers';

/**
 *
 */
describe('createStore', () => {

  /**
   *
   */
  it('should create store for simple sync reducer', async () => {
    const states = [];
    const numStore = createStore(numReducer);
    numStore.subscribe((n) => states.push(n));
    await wait(200);
    numStore.dispatch({ type: 'ADD', value: 2 });
    await wait(200);
    numStore.dispatch({ type: 'ADD', value: 4 });
    await wait(200);
    numStore.dispatch({ type: 'ADD', value: 2 });
    numStore.dispatch({ type: 'ADD', value: 1 }); // sequential action will be comacted
    await wait(200);
    numStore.dispatch({ type: 'RESET' });
    await wait(200);
    assert.deepEqual(states, [0, 2, 6, 9, 0]);
  });

  /**
   *
   */
  it('should create store for promised reducer', async () => {
    const states = [];
    const numStore = createStore(numPromiseReducer);
    numStore.subscribe((n) => states.push(n));
    await wait(200);
    numStore.dispatch({ type: 'ADD', value: 2 });
    await wait(200);
    numStore.dispatch({ type: 'ADD', value: 4 });
    await wait(200);
    numStore.dispatch({ type: 'ADD', value: 2 });
    numStore.dispatch({ type: 'ADD', value: 1 }); // called before the prev promise return
    await wait(200);
    numStore.dispatch({ type: 'RESET' });
    await wait(200);
    assert.deepEqual(states, [0, 2, 6, 8, 9, 0]);
  });

  /**
   *
   */
  it('should create store for observable reducer', async () => {
    const states = [];
    const numStore = createStore(numObservableReducer);
    numStore.subscribe((n) => states.push(n));
    await wait(200);
    numStore.dispatch({ type: 'ADD', value: 2 });
    await wait(200);
    numStore.dispatch({ type: 'ADD', value: 4 });
    await wait(200);
    numStore.dispatch({ type: 'ADD', value: 2 });
    numStore.dispatch({ type: 'ADD', value: 1 }); // called before the prev promise return
    await wait(200);
    numStore.dispatch({ type: 'RESET' });
    await wait(200);
    assert.deepEqual(states, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
  });

  /**
   *
   */
  it('should create store for thunk reducer', async () => {
    const states = [];
    const numStore = createStore(numThunkReducer);
    numStore.subscribe((n) => states.push(n));
    await wait(200);
    numStore.dispatch({ type: 'ADD', value: 2 });
    await wait(200);
    numStore.dispatch({ type: 'ADD', value: 4 });
    await wait(200);
    numStore.dispatch({ type: 'ADD', value: 2 });
    numStore.dispatch({ type: 'ADD', value: 1 }); // called before the prev promise return
    await wait(200);
    numStore.dispatch({ type: 'RESET' });
    await wait(200);
    assert.deepEqual(states, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
  });

  /**
   *
   */
  it('should create store for generator function / generator reducer', async () => {
    const states = [];
    const numStore = createStore(numGeneratorReducer);
    numStore.subscribe((n) => states.push(n));
    await wait(200);
    numStore.dispatch({ type: 'ADD', value: 2 });
    await wait(200);
    numStore.dispatch({ type: 'ADD', value: 4 });
    await wait(200);
    numStore.dispatch({ type: 'ADD', value: 2 });
    numStore.dispatch({ type: 'ADD', value: 1 }); // called before the prev promise return
    await wait(200);
    numStore.dispatch({ type: 'RESET' });
    await wait(200);
    assert.deepEqual(states, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
  });


});
