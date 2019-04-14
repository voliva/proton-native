import * as Components from '../components';
const Reconciler = require('react-reconciler');

const DesktopRenderer = Reconciler({
  appendInitialChild(container, child) {
    appendChild(container, child);
  },

  createInstance(type, props) {
    if (typeof Components[type] === 'undefined') {
      throw new Error(`Component ${type} doesn't exist`);
    }
    const instance = Components[type](props);
    instance.layoutProps = getLayoutProps(props);
    return instance;
  },

  createTextInstance(text, rootContainerInstance, internalInstanceHandle) {
    return text;
  },

  finalizeInitialChildren(instance, type, props) {
    return false;
  },

  getPublicInstance(inst) {
    return inst;
  },

  prepareForCommit(rootContainerInstance) {
    // noop
  },

  prepareUpdate(instance, type, oldProps, newProps) {
    const propKeys = new Set(
      Object.keys(newProps).concat(Object.keys(oldProps))
    ).values();

    const diff = {};
    for (let key of propKeys) {
      if (
        key !== 'children' && // children are already handled by react-reconciler
        oldProps[key] !== newProps[key]
      ) {
        diff[key] = newProps[key];
      }
    }

    return diff;
  },

  resetAfterCommit(rootContainerInstance) {
    // noop
  },

  resetTextContent(wordElement) {
    // noop
  },

  getRootHostContext(rootContainerInstance) {
    return {};
  },

  getChildHostContext(parentHostContext, type, rootContainerInstance) {
    return parentHostContext;
  },

  shouldSetTextContent(type, props) {
    return false;
  },

  now: () => new Date().getTime(),

  useSyncScheduling: true,

  schedulePassiveEffects: fn => {
    fn(); // TODO
  },

  cancelPassiveEffects: () => {
    // TODO
  },

  // MUTATION

  appendChild(container, child) {
    appendChild(container, child);
  },

  appendChildToContainer(container, child) {
    appendChild(container, child);
  },

  removeChild(container, child) {
    removeChild(container, child);
  },

  removeChildFromContainer(container, child) {
    removeChild(container, child);
  },

  insertBefore(container, child, beforeChild) {
    if (container.insertChild) {
      container.insertChild(child, beforeChild);
      child.parent = container;
    } else {
      throw new Error(`Can't insert child to ${container.constructor.name}`);
    }
  },

  commitUpdate(instance, updatePayload, type) {
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
    // noop
  },

  commitTextUpdate(textInstance, oldText, newText) {
    // noop
  },

  supportsMutation: true,
  supportsPersistence: false,
});

const appendChild = (container, child) => {
  if (container.appendChild) {
    container.appendChild(child);
    child.parent = container;
  } else {
    throw new Error(`Can't append child to ${container.constructor.name}`);
  }
};

const removeChild = (container, child) => {
  if (container.removeChild) {
    container.removeChild(child);
  } else {
    throw new Error(`Can't remove child from ${container.constructor.name}`);
  }
};

const getLayoutProps = props => ({
  layoutStretchy: props.layoutStretchy,
});

export default DesktopRenderer;
