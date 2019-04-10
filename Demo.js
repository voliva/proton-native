import React, { Component } from 'react';

import { render, Window, App, TextInput, Dialog, VerticalBox } from './src/';

class Example extends Component {
  render() {
    return <VerticalBox>
      <TextInput stretchy={true} />
      <TextInput />
    </VerticalBox>
  }
}

import {
	UiWindow,
	UiMenu,
	startLoop,
	stopLoop,
	onShouldQuit
} from 'libui-node';

const menu = new UiMenu('File');
menu.appendQuitItem();

const window = UiWindow('Initialization Example', 400, 300, true);

onShouldQuit(() => {
	window.close();
	stopLoop();
});

window.show();
startLoop();

render(<Example />, window);
