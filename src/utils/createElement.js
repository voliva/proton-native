import {
  App,
  Text,
  Root,
  Window,
  Button,
  VerticalBox,
  HorizontalBox,
  Entry,
  PasswordEntry,
  MultilineEntry,
  ColorButton,
  Form,
  Tab,
  Group,
  Grid,
  Checkbox,
  Spinbox,
  Slider,
  Combobox,
  RadioButton,
  EditableCombobox,
  HorizontalSeparator,
  VerticalSeparator,
  ProgressBar,
  MenuBar,
  FontButton,
  Area,
} from '../components/';
import { ROOT_NODE } from '../render/';

function getHostContextNode(rootNode) {
  return ROOT_NODE;
}

// Creates an element with an element type, props and a root instance
function createElement(type, props) {
  const COMPONENTS = {
    ROOT: () => new Root(),
    TEXT: () => new Text(ROOT_NODE, props),
    APP: () => new App(ROOT_NODE, props),
    WINDOW: () => Window(props),
    BUTTON: () => new Button(ROOT_NODE, props),
    VERTICALBOX: () => VerticalBox(props),
    HORIZONTALBOX: () => new HorizontalBox(ROOT_NODE, props),
    ENTRY: () => Entry(props),
    PASSWORDENTRY: () => new PasswordEntry(ROOT_NODE, props),
    MULTILINEENTRY: () => new MultilineEntry(ROOT_NODE, props),
    COLORBUTTON: () => new ColorButton(ROOT_NODE, props),
    FORM: () => new Form(ROOT_NODE, props),
    TAB: () => new Tab(ROOT_NODE, props),
    GROUP: () => new Group(ROOT_NODE, props),
    GRID: () => new Grid(ROOT_NODE, props),
    CHECKBOX: () => new Checkbox(ROOT_NODE, props),
    SPINBOX: () => new Spinbox(ROOT_NODE, props),
    SLIDER: () => new Slider(ROOT_NODE, props),
    COMBOBOX: () => new Combobox(ROOT_NODE, props),
    COMBOBOXITEM: () => new Combobox.Item(ROOT_NODE, props),
    RADIOBUTTON: () => new RadioButton(ROOT_NODE, props),
    RADIOBUTTONITEM: () => new RadioButton.Item(ROOT_NODE, props),
    EDITABLECOMBOBOX: () => new EditableCombobox(ROOT_NODE, props),
    HORIZONTALSEPARATOR: () => new HorizontalSeparator(ROOT_NODE, props),
    VERTICALSEPARATOR: () => new VerticalSeparator(ROOT_NODE, props),
    PROGRESSBAR: () => new ProgressBar(ROOT_NODE, props),
    MENUBAR: () => new MenuBar(ROOT_NODE, props),
    MENUBARITEM: () => new MenuBar.Item(ROOT_NODE, props),
    FONTBUTTON: () => new FontButton(ROOT_NODE, props),
    AREA: () => Area(props),
    AREARECTANGLE: () => Area.Rectangle(props),
    AREALINE: () => new Area.Line(ROOT_NODE, props),
    AREAARC: () => new Area.Arc(ROOT_NODE, props),
    AREABEZIER: () => Area.Bezier(props),
    AREAPATH: () => new Area.Path(ROOT_NODE, props),
    AREAGROUP: () => Area.Group(props),
    AREACIRCLE: () => new Area.Circle(ROOT_NODE, props),
    AREATEXT: () => new Area.Text(ROOT_NODE, props),
    default: () => {
      throw new Error(`Component ${type} doesn't exist`);
    },
  };

  return COMPONENTS[type]() || COMPONENTS.default;
}

export { createElement, getHostContextNode };
