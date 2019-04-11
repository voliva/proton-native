import libui from 'libui-node';

export default (props, layoutProps) => {
  const widget = new libui.UiVerticalBox();

  const children = [];

  const syncFrom = (index, prevLength) => {
    for (let i = index; i < prevLength; i++) {
      widget.deleteAt(index);
    }

    for (let i = index; i < children.length; i++) {
      widget.append(children[i].widget, children[i].layoutProps.layoutStretchy);
    }
  };

  const appendChild = child => {
    if (!child.widget) {
      throw new Error(`Child doesnt have any widget`);
    }

    children.push(child);
    widget.append(child.widget, child.layoutProps.layoutStretchy);
  };
  const insertChild = (child, beforeChild) => {
    if (!child.widget) {
      throw new Error(`Child doesnt have any widget`);
    }
    if (!children.includes(beforeChild)) {
      throw new Error(`Relative element does not exist`);
    }

    const i = children.indexOf(beforeChild);
    children.splice(i, 0, child);
    syncFrom(i, children.length - 1);
  };
  const removeChild = child => {
    if (!children.includes(child)) {
      throw new Error(`Can't remove a child that's not added`);
    }
    const i = children.indexOf(child);
    children.splice(i, 1);
    widget.deleteAt(i);
  };
  const updateLayout = child => {
    if (!children.includes(child)) {
      throw new Error(`Can't update layout of non-added child`);
    }

    const i = children.indexOf(child);
    syncFrom(i, children.length);
  };

  return {
    widget,
    layoutProps,
    appendChild,
    insertChild,
    removeChild,
    updateLayout,
  };
};
