import libui from 'libui-node';

export default (props) => ({
  widget: new libui.UiVerticalBox(),
  props,
  appendChild: (self, child) => {
    self.widget.append(child.widget, child.props.stretchy)
  }
});
