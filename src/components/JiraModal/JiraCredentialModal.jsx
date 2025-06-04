import React, { useState } from 'react';
import './JiraCredentialModal.css';

const JiraCredentialModal = ({ isOpen, onClose, onSubmit }) => {
    const [form, setForm] = useState({
        email: '',
        api_token: '',
        domain: '',
        project_key: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await onSubmit(form);
            onClose();
        } catch (err) {
            console.error("Error during Jira submission:", err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="jira-modal-overlay">
            <div className="jira-modal">
                <h2>Connect to Jira</h2>
                <form onSubmit={handleSubmit} className="jira-form">
                    <label>Email:
                        <input name="email" type="email" value={form.email} onChange={handleChange} required />
                    </label>
                    <label>API Token:
                        <input name="api_token" type="password" value={form.api_token} onChange={handleChange} required />
                    </label>
                    <label>Domain (e.g. yourdomain.atlassian.net):
                        <input name="domain" type="text" value={form.domain} onChange={handleChange} required />
                    </label>
                    <label>Project Key:
                        <input name="project_key" type="text" value={form.project_key} onChange={handleChange} required />
                    </label>
                    <div className="jira-modal-actions">
                        <button type="submit">Submit</button>
                        <button type="button" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JiraCredentialModal;
