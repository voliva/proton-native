import React, { useState, useCallback } from 'react';

import { render, Window, App, TextInput, Dialog, VerticalBox } from './src/';

import { UiMenu } from 'libui-node';

const menu = new UiMenu('File');
menu.appendQuitItem();

const app = new App();

const Example = () => {
  const [value, setValue] = useState('');

  return (
    <Window title="Test" width={parseInt(value) || 500} height={500} margined={true} onClose={app.quit}>
      <VerticalBox>
        <TextInput onChange={setValue} />
        {value.length > 0 && <TextInput />}
      </VerticalBox>
    </Window>
  );
};

render(<Example />, app);
