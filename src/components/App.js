
import { startLoop, onShouldQuit, stopLoop } from 'libui-node';

const App = () => {
  const windows = [];

  startLoop();
  
  const quit = () => {
    windows.splice(0).forEach(w => w.close());
    stopLoop();
  }

  onShouldQuit(quit);

  const isWindow = child =>
    child.element && child.element.show && child.element.close;

  const appendChild = child => {
    if (!isWindow(child)) {
      throw new Error('Child is not a window');
    }
    windows.push(child.element);
    child.element.show();
  };

  const insertChild = (child, beforeChild) => {
    if (!isWindow(child)) {
      throw new Error('Child is not a window');
    }
    if (windows.includes(child.element)) {
      throw new Error(`Can't add the same window twice`);
    }
    if (!windows.includes(beforeChild.element)) {
      throw new Error(`Relative element does not exist`);
    }
    const i = windows.indexOf(beforeChild.element);
    windows.splice(0, i, child.element);
    child.element.show();
  };

  const removeChild = child => {
    if (!isWindow(child)) {
      throw new Error('Child is not a window');
    }
    if (!windows.includes(child.element)) {
      throw new Error(`Can't remove a child that's not added`);
    }
    const i = windows.indexOf(child.element);
    windows.splice(i, 1)[0].close();
  };

  return {
    appendChild,
    insertChild,
    removeChild,
    quit
  };
};

export default App;