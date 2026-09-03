import React from 'react';

export default function SEOContentSection({ formData, handleChange, handleCheckboxChange }) {
    
    // Map element names to the formData.contentElements keys
    const elementsMap = [
        { label: 'FAQ Section', key: 'faq' },
        { label: 'Call To Action', key: 'cta' },
        { label: 'Key Takeaways', key: 'keyTakeaways' }
    ];

    const toggleElement = (key, currentState) => {
        // Create a synthetic event object to match the expected format in handleCheckboxChange
        handleCheckboxChange({
            target: {
                name: key,
                checked: !currentState
            }
        });
    };

    return (
        <div className="step">
            <div className="step-head">
                <span className="step-num">03</span>
                <h2>SEO &amp; Content Elements</h2>
            </div>
            <p className="step-sub">Configure search optimization and interactive text elements.</p>
            
            <div className="field-grid">
                <div className="field full">
                    <label>SEO level</label>
                    <select
                        id="seoLevel"
                        name="seoLevel"
                        value={formData.seoLevel}
                        onChange={handleChange}
                    >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
                
                <div className="field full">
                    <label>Content elements</label>
                    <div className="chip-row">
                        {elementsMap.map((element) => {
                            const isActive = formData.contentElements[element.key];
                            return (
                                <div 
                                    key={element.key}
                                    className={`chip ${isActive ? 'active' : ''}`}
                                    onClick={() => toggleElement(element.key, isActive)}
                                >
                                    <span className="dot"></span>{element.label}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
