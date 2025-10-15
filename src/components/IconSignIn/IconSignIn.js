import React from 'react';
import classNames from 'classnames';

import css from './IconSignIn.module.css';

/**
 * Sign-in user icon.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @returns {JSX.Element} SVG icon
 */
const IconSignIn = props => {
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);
  return (
    <svg
      className={classes}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        strokeWidth="1.5"
        fill="none"
        fillRule="evenodd"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* User head */}
        <circle cx="10" cy="6" r="3" />
        {/* User body */}
        <path d="M4 18c0-4.418 2.686-8 6-8s6 3.582 6 8" />
      </g>
    </svg>
  );
};

export default IconSignIn;