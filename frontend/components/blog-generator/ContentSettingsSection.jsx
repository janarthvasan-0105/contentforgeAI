import React from 'react';

export default function ContentSettingsSection({ formData, handleChange }) {
    return (
        <div className="step">
            <div className="step-head">
                <span className="step-num">02</span>
                <h2>Content Settings</h2>
            </div>
            <p className="step-sub">Fine-tune the output style, size and targeted reader.</p>
            
            <div className="field-grid">
                <div className="field">
                    <label>Blog length</label>
                    <select
                        id="length"
                        name="length"
                        value={formData.length}
                        onChange={handleChange}
                    >
                        <option value="short">Short (~500 words)</option>
                        <option value="medium">Medium (~1000 words)</option>
                        <option value="long">Long (~1500+ words)</option>
                    </select>
                </div>
                
                <div className="field">
                    <label>Tone</label>
                    <select
                        id="tone"
                        name="tone"
                        value={formData.tone}
                        onChange={handleChange}
                    >
                        <option value="professional">Professional</option>
                        <option value="conversational">Conversational</option>
                        <option value="humorous">Humorous</option>
                        <option value="empathetic">Empathetic</option>
                        <option value="academic">Academic</option>
                    </select>
                </div>
                
                <div className="field full">
                    <label>Target audience</label>
                    <input
                        id="audience"
                        name="audience"
                        value={formData.audience}
                        onChange={handleChange}
                        placeholder="general"
                    />
                </div>
            </div>
        </div>
    );
}
