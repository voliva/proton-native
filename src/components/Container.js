
export const UnaryContainer =  (
  setChild
) => {
  let attachedChild = null;

  const appendChild = child => {
    if (!child.element) {
      throw new Error(`Child doesnt have any element`);
    }
    if (attachedChild) {
      throw new Error(`UnaryContainer can only have 1 child`);
    }

    attachedChild = child;
    setChild(child);
  };
  const removeChild = child => {
    if(child !== attachedChild) {
      throw new Error(`Can't remove child that was not added`);
    }

    child.element.parent = null;
    attachedChild = null;
  };
  const updateLayout = child => {
    if (child !== attachedChild) {
      throw new Error(`Can't update layout of non-added child`);
    }

    setChild(child);
  };

  return {
    appendChild,
    insertChild: appendChild,
    removeChild,
    updateLayout
  };
};

export const StackContainer = (
  append,
  deleteAt
) => {
  const children = [];

  const syncFrom = (index, prevLength) => {
    for (let i = index; i < prevLength; i++) {
      deleteAt(children[i], index);
    }

    for (let i = index; i < children.length; i++) {
      append(children[i]);
    }
  };

  const appendChild = child => {
    if (!child.element) {
      throw new Error(`Child doesnt have any element`);
    }

    children.push(child);
    append(child);
  };

  const insertChild = (child, beforeChild) => {
    if (!child.element) {
      throw new Error(`Child doesnt have any element`);
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
    deleteAt(child, i);
  };

  const updateLayout = child => {
    if (!children.includes(child)) {
      throw new Error(`Can't update layout of non-added child`);
    }

    const i = children.indexOf(child);
    syncFrom(i, children.length);
  };

  return {
    appendChild,
    insertChild,
    removeChild,
    updateLayout,
  };
}

export const ListContainer = (
  append,
  insertAt,
  deleteAt
) => {
  const children = [];

  const appendChild = child => {
    if (!child.element) {
      throw new Error(`Child doesnt have any element`);
    }

    children.push(child);
    append(child);
  };

  const insertChild = (child, beforeChild) => {
    if (!child.element) {
      throw new Error(`Child doesnt have any element`);
    }
    if (!children.includes(beforeChild)) {
      throw new Error(`Relative element does not exist`);
    }

    const i = children.indexOf(beforeChild);
    children.splice(i, 0, child);
    insertAt(child, i);
  };

  const removeChild = child => {
    if (!children.includes(child)) {
      throw new Error(`Can't remove a child that's not added`);
    }
    const i = children.indexOf(child);
    children.splice(i, 1);
    deleteAt(child, i);
  };

  const updateLayout = child => {
    if (!children.includes(child)) {
      throw new Error(`Can't update layout of non-added child`);
    }

    const i = children.indexOf(child);
    deleteAt(child, i);
    insertAt(child, i);
  };

  return {
    appendChild,
    insertChild,
    removeChild,
    updateLayout,
  };
}
