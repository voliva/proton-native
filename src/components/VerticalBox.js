import libui from 'libui-node';

export default (props, layoutProps) => {
  const widget = new libui.UiVerticalBox();

  const children = [];
  let dirtyIndex = Number.POSITIVE_INFINITY;

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
    dirtyIndex = Math.min(dirtyIndex, i);
    finishUpdate(); // TODO is it necesary?
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
    dirtyIndex = Math.min(dirtyIndex, i);
  };
  const finishUpdate = () => {
    for (let i = dirtyIndex; i < children.length; i++) {
      widget.deleteAt(dirtyIndex);
    }

    for (let i = dirtyIndex; i < children.length; i++) {
      widget.append(children[i].widget, children[i].layoutProps.layoutStretchy);
    }

    dirtyIndex = Number.POSITIVE_INFINITY;
  };

  return {
    widget,
    layoutProps,
    appendChild,
    insertChild,
    removeChild,
    updateLayout,
    finishUpdate,
  };
};
