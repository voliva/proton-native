import libui from 'libui-node';

export default (props, layoutProps) => {
  const widget = new libui.UiVerticalBox();

  const children = [];

  const syncFrom = index => {
    for (let i = index; i < children.length; i++) {
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
  const insertChild = (child, i) => {
    if (!child.widget) {
      throw new Error(`Child doesnt have any widget`);
    }

    children.splice(i, 0, child);
    syncFrom(i);
  };
  const removeChild = child => {
    if (!children.includes(child)) {
      throw new Error(`Can't remove a child that's not added`);
    }
    const i = children.indexOf(child.widget);
    children.splice(i, 1);
    widget.deleteAt(i);
  };
  const updateLayout = child => {
    if (!children.includes(child)) {
      throw new Error(`Can't update layout of non-added child`);
    }

    const i = children.indexOf(child);
    syncFrom(i);
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
