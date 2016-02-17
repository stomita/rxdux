const FRUITS = ['apple', 'orange', 'banana']
export default function fetchFruits(callback) {
  setTimeout(() => {
    callback(null, FRUITS);
  }, 200);
}
