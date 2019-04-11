import libui from 'libui-node';

/*
interface Component {
  widget?: LibUIWidget;
  layoutProps?: any;
  parent?: Component;
  appendChild?: (child) => void;
  insertChild?: (child, i) => void;
  removeChild?: (child, i) => void;
  updateProps?: changes => void;
  updateLayout?: (child) => void;
  finishUpdate?: () => void;
}
*/

export default (props, layoutProps) => {
  const widget = new libui.UiEntry();

  widget.onChanged(() => {
    if (props.value !== widget.text) {
      if (props.onChange) {
        props.onChange(widget.text);
      }
      if (props.value != undefined) {
        widget.setText(props.value);
      }
    }
  });

  if (props.value) {
    widget.setText(props.value);
  }

  return {
    widget,
    layoutProps,
    updateProps: changes => {
      const oldProps = props;
      props = {
        ...props,
        ...changes,
      };

      if (props.value !== oldProps.value) {
        widget.setText(props.value);
      }
    },
  };
};
