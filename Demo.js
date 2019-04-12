import React, { useState, useCallback } from 'react';

import {
  render,
  Window,
  App,
  Area,
  TextInput,
  Dialog,
  VerticalBox,
} from './src/';

import { UiMenu } from 'libui-node';

const menu = new UiMenu('File');
menu.appendQuitItem();

const app = new App();

const Example = () => {
  const [value, setValue] = useState('');

  return (
    <Window
      title="Test"
      width={parseInt(value) || 500}
      height={500}
      margined={true}
      onClose={app.quit}
    >
      <VerticalBox>
        <Area
          stroke="red"
          strokeWidth="10"
          layoutStretchy={true}
          transform="translate(-50, 30)"
        >
          <Area.Rectangle x="10" y="10" width="100" height="200" fill="blue" />
        </Area>
      </VerticalBox>
    </Window>
  );
};

render(<Example />, app);
