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
};

const getLayoutProps = props => ({
  layoutStretchy: props.layoutStretchy,
});

const Reconciler = require('react-reconciler');
const NewRenderer = Reconciler({
  createInstance(
    type,
    props,
    rootContainerInstance,
    hostContext,
    internalInstanceHandle
  ) {
    console.log(
      'createInstance',
      type,
      rootContainerInstance.type,
      hostContext
    );
    if (typeof Components[type] === 'undefined') {
      throw new Error(`Component ${type} doesn't exist`);
    }
    return Components[type](props, getLayoutProps(props));
  },

  createTextInstance(text, rootContainerInstance, internalInstanceHandle) {
    console.log(text, rootContainerInstance.type, internalInstanceHandle);
    throw 'createTextInstance';
  },

  finalizeInitialChildren(
    instance,
    type,
    props,
    rootContainerInstance,
    hostContext
  ) {
    console.log(
      'finalizeInitialChildren',
      instance.widget,
      type,
      rootContainerInstance.type,
      hostContext
    );

    return false; // TODO
  },

  getPublicInstance(instance) {
    console.log('getPublicInstance', instance.widget);

    if (!instance.widget) {
      throw new Error(`Component doesn't have any widget available`);
    }
    return instance.widget;
  },

  prepareForCommit(rootContainerInstance) {
    console.log('prepareForCommit', rootContainerInstance.type);
    // TODO
  },

  prepareUpdate(
    instance,
    type,
    oldProps,
    newProps,
    rootContainerInstance,
    hostContext
  ) {
    console.log(
      'prepareUpdate',
      instance.widget,
      type,
      rootContainerInstance.type,
      hostContext
    );
    const propKeys = new Set(
      Object.keys(newProps).concat(Object.keys(oldProps))
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

  resetAfterCommit(rootContainerInstance) {
    console.log('resetAfterCommit', rootContainerInstance.type);
    // TODO
  },

  resetTextContent(wordElement) {
    console.log(wordElement);
    throw 'resetTextContent';
  },

  getRootHostContext(rootContainerInstance) {
    // TODO
    console.log('getRootHostContext', rootContainerInstance.type);
    return {};
  },

  getChildHostContext(parentHostContext, type, rootContainerInstance) {
    console.log(
      'getChildHostContext',
      parentHostContext,
      type,
      rootContainerInstance.type
    );
    return parentHostContext;
    // TODO;
  },

  shouldSetTextContent(type, props) {
    console.log('shouldSetTextContext', type);
    const textTypes = {};
    return textTypes[type] || false;
  },

  now: () => new Date().getTime(),

  useSyncScheduling: true,

  // MUTATION
  appendInitialChild(container, child) {
    console.log('appendInitialChild', container.widget, child.widget);
    appendChild(container, child);
  },

  appendChild(container, child) {
    console.log('appendChild', container.widget, child.widget);
    appendChild(container, child);
  },

  appendChildToContainer(container, child) {
    console.log('appendChildToContainer', container.widget, child.widget);
    appendChild(container, child);
  },

  removeChild(container, child) {
    console.log('removeChild', container.widget, child.widget);
    container.removeChild(child);
  },

  removeChildFromContainer(container, child) {
    console.log(container, child);
    throw 'removeChildFromContainer';
  },

  insertBefore(container, child, beforeChild) {
    console.log(
      'insertBefore',
      container.widget,
      child.widget,
      beforeChild.widget
    );
    container.insertChild(child, beforeChild);
  },

  commitUpdate(
    instance,
    updatePayload,
    type,
    oldProps,
    newProps,
    internalInstanceHandle
  ) {
    console.log('commitUpdate', instance.widget, updatePayload, type);

    const layoutProps = ['layoutStretchy'];

    const [layoutChanges, propChanges] = Object.entries(updatePayload).reduce(
      ([layoutChanges, propChanges], [key, value]) => {
        if (layoutProps.includes(key)) {
          return [
            {
              ...layoutChanges,
              [key]: value,
            },
            propChanges,
          ];
        }

        return [
          layoutChanges,
          {
            ...propChanges,
            [key]: value,
          },
        ];
      },
      [{}, {}]
    );

    if (Object.keys(layoutChanges).length > 0 && instance.parent.updateLayout) {
      instance.layoutProps = {
        ...instance.layoutProps,
        ...layoutChanges,
      };
      instance.parent.updateLayout(instance);
    }

    if (instance.updateProps) {
      instance.updateProps(propChanges);
    }
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

import { startLoop, onShouldQuit, stopLoop } from 'libui-node';

export const App = () => {
  const windows = [];

  startLoop();
  
  const quit = () => {
    windows.splice(0).forEach(w => w.close());
    stopLoop();
  }

  onShouldQuit(quit);

  const isWindow = child =>
    child.widget && child.widget.show && child.widget.close;

  const appendChild = child => {
    if (!isWindow(child)) {
      throw new Error('Child is not a window');
    }
    windows.push(child.widget);
    child.widget.show();
  };

  const insertChild = (child, beforeChild) => {
    if (!isWindow(child)) {
      throw new Error('Child is not a window');
    }
    if (windows.includes(child.widget)) {
      throw new Error(`Can't add the same window twice`);
    }
    if (!windows.includes(beforeChild.widget)) {
      throw new Error(`Relative element does not exist`);
    }
    const i = windows.indexOf(beforeChild.widget);
    windows.splice(0, i, child.widget);
    child.widget.show();
  };

  const removeChild = child => {
    if (!isWindow(child)) {
      throw new Error('Child is not a window');
    }
    if (!windows.includes(child.widget)) {
      throw new Error(`Can't remove a child that's not added`);
    }
    const i = windows.indexOf(child.widget);
    windows.splice(i, 1)[0].close();
  };

  return {
    type: 'App',
    appendChild,
    insertChild,
    removeChild,
    quit
  };
};

function render(element, window) {
  const container = NewRenderer.createContainer(window);
  NewRenderer.updateContainer(element, container, null);
}

export default render;
