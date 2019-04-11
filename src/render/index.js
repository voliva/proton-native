import { createElement } from '../utils/createElement';
import DesktopRenderer from '../reconciler/';
import { connectDevtools } from '../devtools';

export let ROOT_NODE = {};

// Renders the input component
function render_orig(element) {
  connectDevtools(DesktopRenderer);

  ROOT_NODE = createElement('ROOT');
  const container = ROOT_NODE;

  // Returns the current fiber (flushed fiber)
  const node = DesktopRenderer.createContainer(ROOT_NODE);

  // Schedules a top level update with current fiber and a priority level (depending upon the context)
  DesktopRenderer.updateContainer(element, node, null);
  //ROOT_NODE.render();
}


import * as Components from '../components';

const appendChild = (container, child) => {
  if (container.appendChild) {
    container.appendChild(child);
    child.parent = container;
  } else {
    throw new Error(`Can't append child to ${container.constructor.name}`);
  }
}

const getLayoutProps = props => ({
  stretchy: props.stretchy
});

const Reconciler = require('react-reconciler');
const NewRenderer = Reconciler({
  createInstance(
    type,
    props,
    rootContainerInstance,
    hostContext,
    internalInstanceHandle,
  ) {
    console.log('createInstance', type, rootContainerInstance, hostContext);
    if(typeof Components[type] === 'undefined') {
      throw new Error(`Component ${type} doesn't exist`);
    }
    return Components[type](getLayoutProps(props));
  },

  createTextInstance(text, rootContainerInstance, internalInstanceHandle) {
    console.log(text, rootContainerInstance, internalInstanceHandle);
    throw 'createTextInstance';
  },

  finalizeInitialChildren(
    instance,
    type,
    props,
    rootContainerInstance,
    hostContext
  ) {
    console.log('finalizeInitialChildren', instance, type, rootContainerInstance, hostContext);
    Object.entries(props).forEach(([key, value]) => {
      if(typeof instance.widget[key] !== 'undefined') {
        if (
          typeof value === 'function' &&
          typeof instance.widget[key] === 'function' &&
          key.indexOf('on') === 0
        ) {
          instance.widget[key](() => value(instance.widget));
        } else {
          instance.widget[key] = value;
        }
      } else {
        console.warn(`Element ${type} doesn't have prop ${key}`);
      }
    });
    return false; // TODO
  },

  getPublicInstance(inst) {
    console.log(inst);
    throw 'getPublicInstance';
  },

  prepareForCommit(hostContext) {
    console.log('prepareForCommit', hostContext);
    // TODO
  },

  prepareUpdate(instance, type, oldProps, newProps, rootContainerInstance, hostContext) {
    console.log('prepareUpdate', instance, type, rootContainerInstance, hostContext);
    const propKeys = new Set(
      Object.keys(newProps).concat(
        Object.keys(oldProps)
      )
    ).values();

    const diff = {};
    for (let key of propKeys) {
      if (
        key !== 'children' && // text children are already handled
        oldProps[key] !== newProps[key]
      ) {
        diff[key] = newProps[key];
      }
    }
    console.log('diffed', diff);
    return diff; // TODO
  },

  resetAfterCommit(hostContext) {
    console.log('resetAfterCommit', hostContext);
    // TODO
  },

  resetTextContent(wordElement) {
    console.log(wordElement);
    throw 'resetTextContent';
  },

  getRootHostContext(rootContainerInstance) {
    // TODO
    console.log('getRootHostContext', rootContainerInstance);
    return {};
  },

  getChildHostContext(
    parentHostContext,
    type,
    rootContainerInstance
  ) {
    console.log('getChildHostContext', parentHostContext, type, rootContainerInstance);
    return parentHostContext;
    // TODO;
  },

  shouldSetTextContent(type, props) {
    console.log('shouldSetTextContext', type);
    const textTypes = {
    };
    return textTypes[type] || false;
  },

  now: () => new Date().getTime(),

  useSyncScheduling: true,

  // MUTATION
  appendInitialChild(container, child) {
    console.log('appendInitialChild', container, child);
    appendChild(container, child);
  },

  appendChild(container, child) {
    console.log(container, child);
    appendChild(container, child);
  },

  appendChildToContainer(container, child) {
    console.log('appendChildToContainer', container, child);
    appendChild(container, child);
  },

  removeChild(parentInstance, child) {
    console.log(parentInstance, child);
    throw 'removeChild';
  },

  removeChildFromContainer(parentInstance, child) {
    console.log(parentInstance, child);
    throw 'removeChildFromContainer';
  },

  insertBefore(parentInstance, child, beforeChild) {
    console.log(parentInstance, child, beforeChild);
    throw 'insertBefore';
  },

  commitUpdate(instance, updatePayload, type, oldProps, newProps, internalInstanceHandle) {
    console.log('commitUpdate', instance, updatePayload, type);
    const layoutProps = ['stretchy'];
    Object.entries(updatePayload).forEach(([key, value]) => {
      if(layoutProps.includes(key)) {
        const { parent } = instance;
        parent.updateLayout(parent, instance, key, value);
      } else {
        throw 'commitUpdate';
      }
    });
  },

  commitMount(instance, updatePayload, type, oldProps, newProps) {
    console.log(instance, updatePayload, type, oldProps, newProps);
    throw 'commitMount';
  },

  commitTextUpdate(textInstance, oldText, newText) {
    console.log(textInstance, oldText, newText);
    throw 'commitTextUpdate';
  },

  supportsMutation: true,
  supportsPersistence: false,
});

/*
interface Component {
  widget?: LibUIWidget;
  layoutProps?: any;
  parent?: Component;
  appendChild: (child) => void;
  insertChild: (child, i) => void;
  removeChild: (child, i) => void;
  updateLayout?: (child) => void;
}
*/

import {
  startLoop,
  onShouldQuit,
  stopLoop
} from 'libui-node';

export const App = () => {
  const windows = [];

  startLoop();
  onShouldQuit(() => {
    windows.splice(0).forEach(w => w.close());
    stopLoop();
  });

  const isWindow = child => child.widget && child.widget.show && child.widget.close;

  const appendChild = child => {
    if(!isWindow(child)) {
      throw new Error('Child is not a window');
    }
    windows.push(child.widget);
    child.widget.show();
  }

  const insertChild = (child, i) => {
    if(!isWindow(child)) {
      throw new Error('Child is not a window');
    }
    if(windows.includes(child.widget)) {
      throw new Error(`Can't add the same window twice`);
    }
    windows.splice(0, i, child.widget);
    child.widget.show();
  }

  const removeChild = child => {
    if(!isWindow(child)) {
      throw new Error('Child is not a window');
    }
    if(!windows.includes(child.widget)) {
      throw new Error(`Can't remove a child that's not added`);
    }
    const i = windows.indexOf(child.widget);
    windows.splice(i, 1)[0].close();
  }

  return {
    type: 'App',
    appendChild,
    insertChild,
    removeChild
  }
}

function render(element, window) {
  const container = NewRenderer.createContainer(window);
  NewRenderer.updateContainer(element, container, null);
}

export default render;
