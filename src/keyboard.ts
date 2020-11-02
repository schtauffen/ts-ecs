// TODO - better implementation that batches by Key with one up and one down listener on window;
type Fn = () => void;

export interface KeyInfo  {
  value: string;
  isDown: boolean,
  isUp: boolean,
  press: Fn,
  release: Fn,
}

// TODO - Key type / enumeration
export function keyboard(value: string): KeyInfo {
  const key = {
    value,
    isDown: false,
    isUp: true,
    press: () => {},
    release: () => {},
    unsubscribe: () => {},
  };

  const downHandler = (evt: KeyboardEvent) => {
    if (evt.key == key.value) {
      if (key.isUp) {
        key.press();
      }
      key.isDown = true;
      key.isUp = false;
      evt.preventDefault();
    }
  }

  const upHandler = (evt: KeyboardEvent) => {
    if (evt.key == key.value) {
      if (key.isDown) {
        key.release();
      }
      key.isDown = false;
      key.isUp = true;
      evt.preventDefault();
    }
  };

  window.addEventListener("keydown", downHandler, false);
  window.addEventListener("keyup", upHandler, false);

  key.unsubscribe = () => {
    window.removeEventListener("keydown", downHandler, false);
    window.removeEventListener("keyup", upHandler, false);
  };

  return key;
}
