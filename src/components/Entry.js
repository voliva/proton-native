import libui from 'libui-node';

/*
interface Component {
  widget?: LibUIWidget;
  layoutProps?: any;
  parent?: Component;
  appendChild?: (child) => void;
  insertChild?: (child, i) => void;
  removeChild?: (child, i) => void;
  updateLayout?: (child) => void;
  finishUpdate?: () => void;
}
*/

export default (props, layoutProps) => ({
  widget: new libui.UiEntry(),
  layoutProps,
});
