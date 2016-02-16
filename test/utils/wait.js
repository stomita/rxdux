export default function wait(msec) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), msec);
  });
}
