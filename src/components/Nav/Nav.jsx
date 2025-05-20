import React from 'react';
import { assets } from '../../assets/assets';
import './Nav.css';

const Nav = () => (
    <nav className="nav">
        <p>InfyCode</p>
        <img src={assets.user_icon} alt="User avatar" />
    </nav>
);

export default Nav;
