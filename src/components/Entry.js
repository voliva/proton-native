import libui from 'libui-node';

/*
interface Component {
  element?: LibUIWidget;
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

export default (props) => {
  const element = new libui.UiEntry();

  element.onChanged(() => {
    if (props.value !== element.text) {
      if (props.onChange) {
        props.onChange(element.text);
      }
      if (props.value != undefined) {
        element.setText(props.value);
      }
    }
  });

  if (props.value) {
    element.setText(props.value);
  }

  return {
    element,
    updateProps: changes => {
      props = {
        ...props,
        ...changes,
      };

      if (changes.value) {
        element.setText(props.value);
      }
    },
  };
};
