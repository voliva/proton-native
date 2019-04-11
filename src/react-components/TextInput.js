import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Entry, PasswordEntry, MultilineEntry } from '../';

const ref = value => console.log('ref value', value);
class TextInput extends Component {
  render() {
    const { secure, multiline, children, ...otherProps } = this.props;

    if (secure) {
      return React.createElement(PasswordEntry, otherProps, children);
    }

    if (multiline) {
      return React.createElement(MultilineEntry, otherProps, children);
    }

    return React.createElement(
      Entry,
      {
        ...otherProps,
        ref,
      },
      children
    );
  }
}

TextInput.propTypes = {
  secure: PropTypes.bool,
  multiline: PropTypes.bool,
};

TextInput.defaultProps = {
  secure: false,
  multiline: false,
};

export default TextInput;
