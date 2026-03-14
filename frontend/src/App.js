import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare, X, Download, FileText, Upload } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

function App() {
    // --- Generator State ---
    const [formData, setFormData] = useState({
        title: "",
        subject: "",
        difficulty: "Medium",
        totalMarks: "",
        rubric: "",
        questionType: "Mixed",
        pdf: null
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedAssignment, setGeneratedAssignment] = useState("");

    // --- Chat Widget State ---
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', content: 'Hello! I am your CAMEL AI examiner assistant. Let me know if you need help with the assignment!' }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);

    const messagesEndRef = useRef(null);

    // Auto-scroll chat
    useEffect(() => {
        if (isChatOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isChatLoading, isChatOpen]);

    // --- Form Handlers ---
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileUpload = (e) => {
        setFormData({ ...formData, pdf: e.target.files[0] });
    };

    const handleGenerate = async (e) => {
        e.preventDefault();

        if (!formData.pdf && !formData.title && !formData.subject) {
            alert("Please fill in the minimum required fields (Title, Subject) and attach a PDF.");
            return;
        }

        setIsGenerating(true);
        setGeneratedAssignment("");

        try {
            // Create FormData object to send file + data
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('subject', formData.subject);
            submitData.append('difficulty', formData.difficulty);
            submitData.append('totalMarks', formData.totalMarks);
            submitData.append('rubric', formData.rubric);
            submitData.append('questionType', formData.questionType);
            if (formData.pdf) {
                submitData.append('file', formData.pdf);
            }

            const response = await axios.post('http://localhost:8000/api/generate-assignment', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setGeneratedAssignment(response.data.assignment);
        } catch (error) {
            console.error("Generation Error:", error);
            alert(`Failed to generate assignment: ${error.response?.data?.detail || error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    // --- Chat Handlers ---
    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || isChatLoading) return;

        const userMsg = chatInput.trim();
        setChatInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsChatLoading(true);

        try {
            const response = await axios.post('http://localhost:8000/chat', { message: userMsg });
            setMessages(prev => [...prev, { role: 'bot', content: response.data.response }]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, {
                role: 'bot',
                content: `**Error:** Connection failed. (${error.message})`
            }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    // --- Clean PDF Download Handler ---
    const handlePrint = () => {
        if (!generatedAssignment) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>${formData.title || 'Assignment'}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                    body {
                        font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
                        padding: 40px 60px;
                        color: #1a1a1a;
                        background: white;
                        line-height: 1.7;
                        font-size: 14px;
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    h1 { font-size: 22px; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 20px; }
                    h2 { font-size: 18px; margin-top: 28px; color: #222; }
                    h3 { font-size: 16px; margin-top: 20px; color: #333; }
                    p { margin-bottom: 10px; }
                    ul, ol { margin-bottom: 12px; padding-left: 24px; }
                    li { margin-bottom: 6px; }
                    code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 13px; }
                    pre { background: #f5f5f5; padding: 16px; border-radius: 6px; overflow-x: auto; border: 1px solid #e0e0e0; }
                    pre code { background: none; padding: 0; }
                    hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
                    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
                    th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
                    th { background: #f5f5f5; font-weight: 600; }
                    strong { color: #111; }
                    .watermark {
                        position: fixed;
                        top: 0; left: 0; right: 0; bottom: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        pointer-events: none;
                        z-index: 0;
                        overflow: hidden;
                    }
                    .watermark span {
                        font-size: 80px;
                        font-weight: 700;
                        color: rgba(0,0,0,0.04);
                        transform: rotate(-35deg);
                        white-space: nowrap;
                        user-select: none;
                        letter-spacing: 8px;
                    }
                    .pdf-footer {
                        margin-top: 40px;
                        padding-top: 16px;
                        border-top: 1px solid #e0e0e0;
                        text-align: center;
                        font-size: 11px;
                        color: #999;
                    }
                    #content { position: relative; z-index: 1; }
                    @media print {
                        body { padding: 20px 40px; }
                    }
                </style>
            </head>
            <body>
                <div class="watermark"><span>@hribhusaha</span></div>
                <div id="content"></div>
                <div class="pdf-footer">Generated by Smart Assignment Engine &bull; @hribhusaha</div>
            </body>
            </html>
        `);
        printWindow.document.close();

        // Convert markdown to simple HTML
        const md = generatedAssignment
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/---/g, '<hr>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');

        printWindow.document.getElementById('content').innerHTML = '<p>' + md + '</p>';

        // Wait for fonts to load, then trigger print
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    return (
        <div className="app-container">
            {/* Animated Background Orbs */}
            <div className="bg-animation">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
                <div className="orb orb-4"></div>
            </div>

            {/* Watermark */}
            <div className="watermark-label">@hribhusaha</div>

            <div className="main-content">

                {/* Left Panel: Generator Form */}
                <div className="generator-panel">
                    <h2><Sparkles color="#6366f1" size={24} /> Assignment Engine</h2>
                    <p>Configure parameters and upload syllabus/document material.</p>

                    <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="form-group">
                            <label>Assignment Title</label>
                            <input type="text" name="title" className="form-control" placeholder="e.g. Midterm Physics Evaluation" value={formData.title} onChange={handleFormChange} required />
                        </div>

                        <div className="form-group">
                            <label>Subject</label>
                            <input type="text" name="subject" className="form-control" placeholder="e.g. Quantum Mechanics" value={formData.subject} onChange={handleFormChange} required />
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Difficulty Levels</label>
                                <select name="difficulty" className="form-control" value={formData.difficulty} onChange={handleFormChange}>
                                    <option>Easy</option>
                                    <option>Medium</option>
                                    <option>Hard</option>
                                    <option>University Level</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Total Marks</label>
                                <input type="number" name="totalMarks" className="form-control" placeholder="e.g. 100" value={formData.totalMarks} onChange={handleFormChange} required />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Marking Rubric / Criteria</label>
                            <input type="text" name="rubric" className="form-control" placeholder="e.g. Partial marks for formula, deduct for units..." value={formData.rubric} onChange={handleFormChange} />
                        </div>

                        <div className="form-group">
                            <label>Question Type</label>
                            <select name="questionType" className="form-control" value={formData.questionType} onChange={handleFormChange}>
                                <option>Multiple Choice (MCQ)</option>
                                <option>Short Answer</option>
                                <option>Long Essay / Derivation</option>
                                <option>Mixed</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Source Material (.pdf)</label>
                            <label className="file-upload-wrapper">
                                <Upload size={24} color="#6366f1" style={{ marginBottom: '10px' }} />
                                <div>{formData.pdf ? formData.pdf.name : "Click to upload reference PDF"}</div>
                                <input type="file" className="file-input" accept=".pdf" onChange={handleFileUpload} required />
                            </label>
                        </div>

                        <button type="submit" className="generate-btn" disabled={isGenerating}>
                            {isGenerating ? "Generating Assignment..." : "Generate Assignment"}
                        </button>
                    </form>
                </div>

                {/* Right Panel: Preview Area */}
                <div className="preview-panel">
                    <div className="actions-header">
                        <h2><FileText color="#94a3b8" size={24} /> Preview</h2>
                        <button className="download-btn" onClick={handlePrint} disabled={!generatedAssignment}>
                            <Download size={18} /> Save as PDF
                        </button>
                    </div>

                    <div className="preview-content">
                        {isGenerating ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '20px', color: '#64748b' }}>
                                <div className="loading-indicator" style={{ transform: 'scale(2)' }}>
                                    <div className="dot"></div><div className="dot"></div><div className="dot"></div>
                                </div>
                                <p>Analyzing document and crafting questions...</p>
                            </div>
                        ) : generatedAssignment ? (
                            <ReactMarkdown>{generatedAssignment}</ReactMarkdown>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>
                                <p>Your generated assignment will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Chat Widget */}
            <div className={`floating-chat-widget ${isChatOpen ? '' : 'collapsed'}`}>
                <div className="widget-header">
                    <h3><Sparkles size={18} color="#818cf8" /> CAMEL Copilot</h3>
                    <button className="close-btn" onClick={() => setIsChatOpen(false)}><X size={20} /></button>
                </div>

                <div className="messages-area">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message-wrapper ${msg.role}`}>
                            <div className="message-bubble">
                                {msg.role === 'user' ? (
                                    <p style={{ margin: 0 }}>{msg.content}</p>
                                ) : (
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                )}
                            </div>
                        </div>
                    ))}

                    {isChatLoading && (
                        <div className="message-wrapper bot">
                            <div className="message-bubble" style={{ padding: '0.75rem 1rem' }}>
                                <div className="loading-indicator">
                                    <div className="dot"></div><div className="dot"></div><div className="dot"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="input-area">
                    <form onSubmit={handleChatSubmit} className="input-form">
                        <input
                            type="text"
                            className="input-field"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Ask about the assignment..."
                            disabled={isChatLoading}
                        />
                        <button type="submit" className="submit-btn" disabled={!chatInput.trim() || isChatLoading}>
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            </div>

            {/* Toggle Button */}
            {!isChatOpen && (
                <button className="chat-toggle-btn" onClick={() => setIsChatOpen(true)}>
                    <MessageSquare size={24} />
                </button>
            )}
        </div>
    );
}

export default App;
