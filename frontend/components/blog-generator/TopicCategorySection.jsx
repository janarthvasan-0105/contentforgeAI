import React from 'react';

export default function TopicCategorySection({
    formData,
    handleChange,
    groupedCategories,
    isBulkMode,
    setIsAddCategoryOpen,
    formatCategoryValue
}) {
    return (
        <div className="step">
            <div className="step-head">
                <span className="step-num">01</span>
                <h2>Topic &amp; Category</h2>
            </div>
            <p className="step-sub">Specify your main blog topic and target category.</p>
            
            <div className="field-grid">
                <div className="field">
                    <label>
                        Topic <span className="hint">— leave empty for auto-bulk</span>
                    </label>
                    <input
                        id="topic"
                        name="topic"
                        placeholder="e.g. Future of AI — or leave empty for bulk mode"
                        value={formData.topic}
                        onChange={handleChange}
                    />
                </div>
                
                <div className="field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label>Category</label>
                        <button
                            type="button"
                            onClick={() => setIsAddCategoryOpen(true)}
                            style={{ 
                                background: 'none', border: 'none', padding: 0, 
                                cursor: 'pointer', fontSize: '12px', fontWeight: 600, 
                                color: 'var(--grad-start)' 
                            }}
                        >
                            + Add Category
                        </button>
                    </div>
                    <select
                        id="category"
                        name="category"
                        required
                        value={formData.category}
                        onChange={handleChange}
                    >
                        <option value="" disabled>Select a Category...</option>
                        {Object.entries(groupedCategories).map(([group, cats]) => (
                            <optgroup key={group} label={group}>
                                {cats.map(cat => {
                                    const val = formatCategoryValue(cat);
                                    return (
                                        <option key={cat.id || cat.category_name} value={val}>
                                            {cat.icon ? `${cat.icon} ` : ''}{cat.category_name}
                                        </option>
                                    );
                                })}
                            </optgroup>
                        ))}
                    </select>
                </div>
                
                <div className="field">
                    <label>Number of Blogs</label>
                    <input
                        id="numBlogs"
                        name="numBlogs"
                        type="number"
                        min="1"
                        max="100"
                        required
                        value={formData.numBlogs}
                        onChange={handleChange}
                        placeholder="1"
                    />
                </div>
            </div>

            {isBulkMode && (
                <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(67, 97, 238, 0.1)', borderRadius: '8px', fontSize: '13px', color: 'var(--grad-start)' }}>
                    <strong>🚀 Bulk Mode Active:</strong> {formData.numBlogs} unique topic(s) will be auto-generated for <strong>{formData.category}</strong>.
                </div>
            )}
        </div>
    );
}
