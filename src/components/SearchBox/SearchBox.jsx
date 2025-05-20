import React from 'react';
import PropTypes from 'prop-types';
import { assets } from '../../assets/assets';
import './SearchBox.css';

const SearchBox = ({ value, onChange, onSend }) => {
    const handleKeyDown = e => {
        if (e.key === 'Enter') {
            onSend(value);
        }
    };

    const handleClick = () => {
        onSend(value);
    };

    return (
        <div className="search-box">
            <input
                type="text"
                placeholder="Input your project requirements here..."
                value={value}
                onChange={onChange}
                onKeyDown={handleKeyDown}
            />
            <div className="icon-group">
                <img src={assets.gallery_icon} alt="gallery" />
                <img src={assets.mic_icon} alt="mic" />
                <img
                    src={assets.send_icon}
                    alt="send"
                    onClick={handleClick}
                    style={{ cursor: 'pointer' }}
                />
            </div>
        </div>
    );
};

SearchBox.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onSend: PropTypes.func.isRequired,
};

export default SearchBox;
