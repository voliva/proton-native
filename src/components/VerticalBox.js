import libui from 'libui-node';

export default (props) => ({
  widget: new libui.UiVerticalBox(),
  props,
  appendChild: (self, child) => {
    self.widget.append(child.widget, child.props.stretchy)
  },
  updateLayout: (self, child, prop, value) => {
    if(prop !== 'stretchy') {
      return;
    }

    const index = self.widget.children.indexOf(child.widget);
    if(index < 0){
      throw new Error('No child found :(');
    }
    const nextWidgets = self.widget.children.slice(index + 1);

    while(self.widget.children.length > index) {
      self.widget.deleteAt(index);
    }

    self.widget.append(child.widget, value);
    nextWidgets.forEach(widget => self.widget.append(widget));
  },
  parent: null
});
