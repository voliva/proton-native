import * as Components from '../components';
const Reconciler = require('react-reconciler');

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

const NewRenderer = Reconciler({
  schedulePassiveEffects: fn => {
    console.log('schedulePassiveEffects');
    fn(); // TODO
  },
  cancelPassiveEffects: () => {
    console.log('cancelPassiveEffects');
    // TODO
  },

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
    const instance = Components[type](props);
    instance.layoutProps = getLayoutProps(props);
    return instance;
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
      instance.element,
      type,
      rootContainerInstance.type,
      hostContext
    );

    return false; // TODO
  },

  getPublicInstance(instance) {
    console.log('getPublicInstance', instance.element);

    if (!instance.element) {
      throw new Error(`Component doesn't have any element available`);
    }
    return instance.element;
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
      instance.element,
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
    console.log('appendInitialChild', container.element, child.element);
    appendChild(container, child);
  },

  appendChild(container, child) {
    console.log('appendChild', container.element, child.element);
    appendChild(container, child);
  },

  appendChildToContainer(container, child) {
    console.log('appendChildToContainer', container.element, child.element);
    appendChild(container, child);
  },

  removeChild(container, child) {
    console.log('removeChild', container.element, child.element);
    if (container.removeChild) {
      container.removeChild(child);
    } else {
      throw new Error(`Can't remove child from ${container.constructor.name}`);
    }
  },

  removeChildFromContainer(container, child) {
    console.log(container, child);
    throw 'removeChildFromContainer';
  },

  insertBefore(container, child, beforeChild) {
    console.log(
      'insertBefore',
      container.element,
      child.element,
      beforeChild.element
    );

    if (container.insertChild) {
      container.insertChild(child, beforeChild);
      child.parent = container;
    } else {
      throw new Error(`Can't insert child to ${container.constructor.name}`);
    }
  },

  commitUpdate(
    instance,
    updatePayload,
    type,
    oldProps,
    newProps,
    internalInstanceHandle
  ) {
    console.log('commitUpdate', instance.element, updatePayload, type);

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

export default NewRenderer;
