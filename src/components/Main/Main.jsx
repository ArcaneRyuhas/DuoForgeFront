import React, { useState, useRef, useEffect } from 'react';
import './Main.css';
import { assets } from '../../assets/assets';
import SearchBox from '../SearchBox/SearchBox';
import Nav from '../Nav/Nav';
import ChatContainer from '../ChatContainer/ChatContainer';

const Main = () => {

    const [buttonGraphvizIsActive, buttonGraphvizsetActive] = useState(false);
    const [buttonMermaidIsActive, buttonMermaidsetActive] = useState(false);
    const [buttonUMLIsActive, buttonUMLsetActive] = useState(false);
    const [buttonPythonIsActive, buttonPythonsetActive] = useState(false);
    const [buttonJavaScriptIsActive, buttonJavaScriptsetActive] = useState(false);
    const [buttonJavaIsActive, buttonJavasetActive] = useState(false);
    const [buttonCppIsActive, buttonCppsetActive] = useState(false);
    const [buttonCsharpIsActive, buttonCsharpsetActive] = useState(false);
    const [buttonPHPIsActive, buttonPHPsetActive] = useState(false);
    const [buttonRubyIsActive, buttonRubysetActive] = useState(false);
    const [buttonGoIsActive, buttonGosetActive] = useState(false);
    const [buttonSwiftIsActive, buttonSwiftsetActive] = useState(false);
    const [buttonKotlinIsActive, buttonKotlinsetActive] = useState(false);
    const [buttonSQLIsActive, buttonSQLsetActive] = useState(false);
    const [buttonHTMLIsActive, buttonHTMLsetActive] = useState(false);
    const [buttonCSSIsActive, buttonCSSsetActive] = useState(false);

    const [disabledModifyIndexes, setDisabledModifyIndexes] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isWaitingResponse, setIsWaitingResponse] = useState(false);
    const [messages, setMessages] = useState([]);


    const handleSend = text => {
        if (!text.trim()) return; 

        const lastBotIndex = [...messages].reverse().findIndex(m => m.sender === 'bot');
        if (lastBotIndex !== -1) {
            const actualIndex = messages.length - 1 - lastBotIndex;
            setDisabledModifyIndexes(prev => [...prev, actualIndex]);
        }
        setMessages(ms => [...ms, { sender: 'user', text }]);
        setInputValue('');
        setIsWaitingResponse(true);


        setTimeout(() => {
            setMessages(ms => [...ms, { sender: 'bot', text: "I'm the bot, responding after 5 seconds!" }]);
        }, 1000);
    };

    const handleModify = (index) => {
        setIsWaitingResponse(prev => !prev);
    };

    const handleContinue = (index) => {
        setDisabledModifyIndexes(prev => [...prev, index]);
        console.log('Continue clicked for message', index);
    };

    const mainContainerRef = useRef(null);
    const prevMessagesLength = useRef(0);

    useEffect(() => {
        if (messages.length > prevMessagesLength.current) {
            if (mainContainerRef.current) {
                mainContainerRef.current.scrollTo({
                    top: mainContainerRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }
        prevMessagesLength.current = messages.length;
    }, [messages]);


    return (
        <div className="main">
            <Nav />
            <div className="main-container" ref={mainContainerRef}>
                <div className="greet">
                    <p>
                        <span>Hello!</span>
                    </p>
                    <p>
                        <span>What are we developing today?</span>
                    </p>
                </div>
                <div className="cards">
                    <div className="card">
                        <p>Diagrams</p>
                        <div>
                            <button className={buttonUMLIsActive ? 'active' : null} onClick={() => buttonUMLsetActive(prev => !prev)} >UML</button>
                            <button className={buttonGraphvizIsActive ? 'active' : null} onClick={() => buttonGraphvizsetActive(prev => !prev)} >Graphviz</button>
                            <button className={buttonMermaidIsActive ? 'active' : null} onClick={() => buttonMermaidsetActive(prev => !prev)} >Mermaid</button>
                        </div>
                        <img src={assets.bulb_icon} />
                    </div>
                    <div className="card">
                        <p>Code</p>
                        <div>
                            <button className={buttonPythonIsActive ? 'active' : null} onClick={() => buttonPythonsetActive(prev => !prev)} >Python</button>
                            <button className={buttonJavaScriptIsActive ? 'active' : null} onClick={() => buttonJavaScriptsetActive(prev => !prev)} >JavaScript</button>
                            <button className={buttonJavaIsActive ? 'active' : null} onClick={() => buttonJavasetActive(prev => !prev)} >Java</button>
                            <button className={buttonCppIsActive ? 'active' : null} onClick={() => buttonCppsetActive(prev => !prev)} >C++</button>
                            <button className={buttonCsharpIsActive ? 'active' : null} onClick={() => buttonCsharpsetActive(prev => !prev)} >C#</button>
                            <button className={buttonPHPIsActive ? 'active' : null} onClick={() => buttonPHPsetActive(prev => !prev)} >PHP</button>
                            <button className={buttonRubyIsActive ? 'active' : null} onClick={() => buttonRubysetActive(prev => !prev)} >Ruby</button>
                            <button className={buttonGoIsActive ? 'active' : null} onClick={() => buttonGosetActive(prev => !prev)} >Go</button>
                            <button className={buttonSwiftIsActive ? 'active' : null} onClick={() => buttonSwiftsetActive(prev => !prev)} >Swift</button>
                            <button className={buttonKotlinIsActive ? 'active' : null} onClick={() => buttonKotlinsetActive(prev => !prev)} >Kotlin</button>
                            <button className={buttonSQLIsActive ? 'active' : null} onClick={() => buttonSQLsetActive(prev => !prev)} >SQL</button>
                            <button className={buttonHTMLIsActive ? 'active' : null} onClick={() => buttonHTMLsetActive(prev => !prev)} >HTML</button>
                            <button className={buttonCSSIsActive ? 'active' : null} onClick={() => buttonCSSsetActive(prev => !prev)} >CSS</button>
                        </div>
                        <img src={assets.code_icon} />
                    </div>
                </div>
                <ChatContainer
                    messages={messages}
                    onModify={handleModify}
                    onContinue={handleContinue}
                    disabledModifyIndexes={disabledModifyIndexes}
                />
            </div>
            <div className="main-bottom">
                <SearchBox
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onSend={handleSend}
                    disabled={isWaitingResponse}
                />
                <p className="bottom-info">
                    specify the outputs you require below!
                </p>
            </div>
        </div>
    );
};

export default Main;