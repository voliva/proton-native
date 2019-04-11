import React, { useState, useCallback } from 'react';

import { render, Window, App, TextInput, Dialog, VerticalBox } from './src/';

const Example = () => {
  const [value, setValue] = useState('Hello!');

  return (
    <Window>
      <VerticalBox>
        <TextInput value={value} onChange={setValue} />
      </VerticalBox>
    </Window>
  );
};

import { UiMenu } from 'libui-node';

const menu = new UiMenu('File');
menu.appendQuitItem();

const app = new App();

render(<Example />, app);
