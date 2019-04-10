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
    container.appendChild(container, child);
  }else if(container.setChild) {
    container.setChild(child.widget); // TODO
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

  prepareUpdate(wordElement, type, oldProps, newProps) {
    console.log(wordElement, type, oldProps, newProps);
    throw 'prepareUpdate';
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

  commitUpdate(instance, updatePayload, type, oldProps, newProps) {
    console.log(instance, updatePayload, type, oldProps, newProps);
    throw 'commitUpdate';
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

function render(element, window) {
  const container = NewRenderer.createContainer(window);
  NewRenderer.updateContainer(element, container, null);
}

export default render;
