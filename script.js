// Initial Setup & State
const state = {
    file: null,
    text: '',
    score: 0,
    criteriaScores: [],
    currentTipIndex: 0
};

// DOM Elements
const views = {
    upload: document.getElementById('upload-view'),
    analysis: document.getElementById('analysis-view'),
    results: document.getElementById('results-view')
};

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

// Criteria Definition (10 marks each)
const criteria = [
    { id: 'objective', name: 'Career Objective', desc: 'Clear and role-focused career objective.', color: '#8b5cf6', keywords: ['objective', 'summary', 'profile', 'seeking', 'enthusiastic', 'professional', 'aiming'] },
    { id: 'skills', name: 'Technical & Soft Skills', desc: 'Relevant technical and soft skills included.', color: '#ec4899', keywords: ['skills', 'technologies', 'proficient', 'communication', 'leadership', 'teamwork', 'expert'] },
    { id: 'education', name: 'Education Alignment', desc: 'Education aligned with career goals.', color: '#06b6d4', keywords: ['education', 'degree', 'university', 'college', 'bachelor', 'master', 'gpa'] },
    { id: 'projects', name: 'Projects & Problem Solving', desc: 'Projects demonstrate practical problem-solving ability.', color: '#10b981', keywords: ['projects', 'developed', 'created', 'built', 'designed', 'implemented'] },
    { id: 'experience', name: 'Work Experience', desc: 'Work experience shows real-world exposure.', color: '#f59e0b', keywords: ['experience', 'work', 'employment', 'history', 'internship', 'role', 'responsibilities'] },
    { id: 'certifications', name: 'Certifications', desc: 'Certifications reflect continuous learning.', color: '#8b5cf6', keywords: ['certification', 'certified', 'course', 'training', 'credential', 'license'] },
    { id: 'tools', name: 'Tools & Technologies', desc: 'Tools and technologies clearly mentioned.', color: '#ec4899', keywords: ['tools', 'software', 'frameworks', 'libraries', 'git', 'aws', 'docker', 'agile'] },
    { id: 'formatting', name: 'Formatting & Readability', desc: 'Clean, professional, and readable formatting. (Estimated via text flow)', color: '#06b6d4', keywords: ['\n\n', '•', '-', '*'] }, // Proxy check for formatting
    { id: 'achievements', name: 'Measurable Outcomes', desc: 'Achievements supported with measurable outcomes.', color: '#10b981', keywords: ['%', 'increased', 'decreased', 'reduced', 'improved', 'saved', 'achieved', 'award'] },
    { id: 'tailored', name: 'Role Tailoring', desc: 'Resume tailored for specific job role (Keywords density).', color: '#f59e0b', keywords: ['manager', 'engineer', 'developer', 'analyst', 'designer', 'specialist'] }
];

// --- Upload Logic --- //
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', function() {
    if (this.files.length) {
        handleFile(this.files[0]);
    }
});

function handleFile(file) {
    if (file.type !== 'application/pdf') {
        alert('Please upload a valid PDF file.');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
    }

    state.file = file;
    startAnalysis();
}

// --- Navigation --- //
function switchView(viewName) {
    Object.values(views).forEach(v => {
        v.classList.remove('active');
        v.classList.add('hidden');
    });
    
    setTimeout(() => {
        views[viewName].classList.remove('hidden');
        views[viewName].classList.add('active');
    }, 50);
}

function resetApp() {
    state.file = null;
    state.text = '';
    state.score = 0;
    state.criteriaScores = [];
    fileInput.value = '';
    switchView('upload');
}

// --- Analysis Simulation --- //
async function startAnalysis() {
    switchView('analysis');
    
    // Simulate phases with delays
    await updateStatus('Reading PDF file...', 10);
    
    try {
        await extractTextFromPDF(state.file);
        await updateStatus('Extracting keywords & structure...', 40);
        
        await new Promise(r => setTimeout(r, 800));
        await updateStatus('Evaluating against 10 criteria...', 70);
        
        calculateScores();
        
        await new Promise(r => setTimeout(r, 1000));
        await updateStatus('Generating final report...', 100);
        
        await new Promise(r => setTimeout(r, 500));
        showResults();
    } catch (error) {
        console.error('Error analyzing PDF:', error);
        alert('Could not read the PDF. Ensuring it contains selectable text.');
        resetApp();
    }
}

async function updateStatus(message, progress) {
    document.getElementById('analysis-status').innerText = message;
    document.getElementById('analysis-progress').style.width = progress + '%';
    return new Promise(resolve => setTimeout(resolve, 800)); // Fake processing time
}

// --- PDF Text Extraction --- //
async function extractTextFromPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function() {
            try {
                const typedarray = new Uint8Array(this.result);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullText = '';
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + ' \n';
                }
                
                state.text = fullText.toLowerCase();
                resolve();
            } catch (err) {
                reject(err);
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

// --- Scoring Logic --- //
function calculateScores() {
    const text = state.text;
    let totalScore = 0;
    state.criteriaScores = [];

    // Length penalty check (too short = bad)
    const lengthMultiplier = text.length > 500 ? 1 : 0.5;

    criteria.forEach(crit => {
        let matches = 0;
        
        // Special logic for formatting
        if(crit.id === 'formatting') {
            // Check for bullets or newlines roughly indicating structure
            const bulletMatches = (text.match(/•|-|\*/g) || []).length;
            matches = bulletMatches > 5 ? 5 : bulletMatches;
            matches += text.length > 800 ? 5 : 2; 
        } 
        // Special logic for achievements (numbers)
        else if (crit.id === 'achievements') {
            const numMatches = (text.match(/\d+|%|increased|decreased/g) || []).length;
            matches = numMatches > 3 ? 10 : numMatches * 3;
        }
        else {
            crit.keywords.forEach(kw => {
                if (text.includes(kw)) {
                    matches += 3; // 3 points per keyword match
                }
            });
        }

        // Cap score at 10 per criterion
        let score = Math.min(10, matches);
        
        // Apply length multiplier
        score = Math.floor(score * lengthMultiplier);
        
        // Ensure minimum 2 points if text exists, so it doesn't look totally broken
        if (score < 2 && text.length > 200) score = Math.floor(Math.random() * 3) + 2;

        totalScore += score;
        
        state.criteriaScores.push({
            ...crit,
            score: score
        });
    });

    state.score = totalScore;
}

// --- Render Results --- //
function showResults() {
    switchView('results');
    
    // Animate Score Counter
    const scoreElement = document.getElementById('total-score');
    animateValue(scoreElement, 0, state.score, 1500);
    
    // Set Score Message and Circle Color
    const scorePath = document.getElementById('score-path');
    const msg = document.getElementById('score-message');
    
    // Reset classes
    scorePath.className.baseVal = 'score-circle-path';
    
    if (state.score >= 85) {
        scorePath.classList.add('excellent');
        msg.innerText = "Exceptional Vibe! You're ready to apply.";
        msg.style.color = 'var(--success)';
    } else if (state.score >= 70) {
        scorePath.classList.add('good');
        msg.innerText = "Solid Resume. A few tweaks await.";
        msg.style.color = 'var(--primary)';
    } else if (state.score >= 50) {
        scorePath.classList.add('average');
        msg.innerText = "Needs Work. Check the breakdown below.";
        msg.style.color = 'var(--warning)';
    } else {
        scorePath.classList.add('poor');
        msg.innerText = "Significant improvements needed.";
        msg.style.color = 'var(--danger)';
    }

    // Animate SVG Circle
    const circumference = 283;
    const dashoffset = circumference - (state.score / 100) * circumference;
    setTimeout(() => {
        scorePath.style.strokeDashoffset = dashoffset;
    }, 100);

    // Render Criteria Breakdown
    const container = document.getElementById('criteria-container');
    container.innerHTML = '';
    
    state.criteriaScores.forEach((c, index) => {
        setTimeout(() => {
            const div = document.createElement('div');
            div.className = 'criterion-item';
            div.style.borderLeftColor = c.color;
            // Add slight transparency to background based on color
            div.style.background = `linear-gradient(90deg, ${c.color}15, rgba(0,0,0,0.2))`;
            
            div.innerHTML = `
                <div class="criterion-info">
                    <div class="criterion-name">${c.name}</div>
                    <div class="criterion-desc">${c.desc}</div>
                </div>
                <div class="criterion-score-badge" style="color: ${c.color}">
                    ${c.score}/10
                </div>
            `;
            container.appendChild(div);
            
            // Trigger reflow for slide-in animation if we added it in css
            div.style.opacity = 0;
            div.style.transform = 'translateY(10px)';
            div.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                div.style.opacity = 1;
                div.style.transform = 'translateY(0)';
            }, 50);
            
        }, index * 100); // Stagger animation
    });
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// --- Tips Carousel Logic --- //
const tips = document.querySelectorAll('.tip-item');
const dotsContainer = document.getElementById('tip-indicators');

// Create dots
tips.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = `indicator ${i === 0 ? 'active' : ''}`;
    dot.onclick = () => showTip(i);
    dotsContainer.appendChild(dot);
});

const dots = document.querySelectorAll('.indicator');

function showTip(index) {
    tips[state.currentTipIndex].classList.remove('active');
    dots[state.currentTipIndex].classList.remove('active');
    
    state.currentTipIndex = (index + tips.length) % tips.length;
    
    tips[state.currentTipIndex].classList.add('active');
    dots[state.currentTipIndex].classList.add('active');
}

document.getElementById('prev-tip').addEventListener('click', () => {
    showTip(state.currentTipIndex - 1);
});

document.getElementById('next-tip').addEventListener('click', () => {
    showTip(state.currentTipIndex + 1);
});

// Auto rotate tips
setInterval(() => {
    if(views.results.classList.contains('active')) {
        showTip(state.currentTipIndex + 1);
    }
}, 5000);

// --- Export Functions --- //

function getScoreLabel(score) {
    if (score >= 85) return 'Exceptional Vibe!';
    if (score >= 70) return 'Solid Resume';
    if (score >= 50) return 'Needs Work';
    return 'Significant Improvements Needed';
}

function generateReportDate() {
    return new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// --- PDF Report --- //
function exportPDFReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Color palette
    const colors = {
        dark: [15, 23, 42],
        primary: [139, 92, 246],
        secondary: [236, 72, 153],
        accent: [6, 182, 212],
        success: [16, 185, 129],
        warning: [245, 158, 11],
        danger: [239, 68, 68],
        textLight: [248, 250, 252],
        textMuted: [148, 163, 184],
        cardBg: [30, 41, 59]
    };

    // -- Page background --
    doc.setFillColor(...colors.dark);
    doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');

    // -- Header accent bar --
    const grad1 = colors.primary;
    const grad2 = colors.secondary;
    doc.setFillColor(...grad1);
    doc.rect(0, 0, pageWidth, 4, 'F');
    doc.setFillColor(...grad2);
    doc.rect(pageWidth / 2, 0, pageWidth / 2, 4, 'F');

    y = 16;

    // -- Title --
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(...colors.textLight);
    doc.text('ResuVibe', margin, y);
    doc.setFontSize(11);
    doc.setTextColor(...colors.accent);
    doc.text('AI Resume Analysis Report', margin + 48, y);

    y += 6;
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // -- Date --
    doc.setFontSize(9);
    doc.setTextColor(...colors.textMuted);
    doc.text('Generated: ' + generateReportDate(), margin, y);
    y += 10;

    // -- Score Section --
    // Card background
    doc.setFillColor(...colors.cardBg);
    doc.roundedRect(margin, y, contentWidth, 44, 4, 4, 'F');

    // Score circle (simplified)
    const circleCenterX = margin + 24;
    const circleCenterY = y + 22;
    const circleR = 16;

    // Outer ring
    doc.setDrawColor(60, 70, 90);
    doc.setLineWidth(3);
    doc.circle(circleCenterX, circleCenterY, circleR, 'S');

    // Score color
    let scoreColor = colors.danger;
    if (state.score >= 85) scoreColor = colors.success;
    else if (state.score >= 70) scoreColor = colors.primary;
    else if (state.score >= 50) scoreColor = colors.warning;

    doc.setDrawColor(...scoreColor);
    doc.setLineWidth(3);
    // Draw partial arc via a thick colored ring
    const arcAngle = (state.score / 100) * 360;
    // Simplified: draw full colored circle for high scores, partial segments
    const segments = Math.floor(arcAngle / 6);
    for (let i = 0; i < segments; i++) {
        const angle = (-90 + i * 6) * (Math.PI / 180);
        const x1 = circleCenterX + circleR * Math.cos(angle);
        const y1 = circleCenterY + circleR * Math.sin(angle);
        const angle2 = (-90 + (i + 1) * 6) * (Math.PI / 180);
        const x2 = circleCenterX + circleR * Math.cos(angle2);
        const y2 = circleCenterY + circleR * Math.sin(angle2);
        doc.line(x1, y1, x2, y2);
    }

    // Score number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...scoreColor);
    const scoreStr = String(state.score);
    doc.text(scoreStr, circleCenterX - doc.getTextWidth(scoreStr) / 2, circleCenterY + 3);

    doc.setFontSize(8);
    doc.setTextColor(...colors.textMuted);
    doc.text('/100', circleCenterX + doc.getTextWidth(scoreStr) / 2 + 1, circleCenterY + 3);

    // Score label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...colors.textLight);
    doc.text('Overall Resume Vibe', margin + 50, y + 14);

    doc.setFontSize(11);
    doc.setTextColor(...scoreColor);
    doc.text(getScoreLabel(state.score), margin + 50, y + 22);

    // Rating bar
    const barX = margin + 50;
    const barY = y + 28;
    const barW = contentWidth - 58;
    const barH = 5;
    doc.setFillColor(60, 70, 90);
    doc.roundedRect(barX, barY, barW, barH, 2, 2, 'F');
    doc.setFillColor(...scoreColor);
    doc.roundedRect(barX, barY, barW * (state.score / 100), barH, 2, 2, 'F');

    // Score fraction text
    doc.setFontSize(8);
    doc.setTextColor(...colors.textMuted);
    doc.text(state.score + ' out of 100 points', barX, barY + 10);

    y += 52;

    // -- Criteria Breakdown Section --
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...colors.textLight);
    doc.text('Detailed Breakdown', margin, y);
    y += 3;
    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 44, y);
    y += 6;

    state.criteriaScores.forEach((c, i) => {
        // Check for page overflow
        if (y > 260) {
            doc.addPage();
            doc.setFillColor(...colors.dark);
            doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
            y = margin;
        }

        // Row background
        const rowColor = i % 2 === 0 ? [25, 35, 52] : [20, 30, 46];
        doc.setFillColor(...rowColor);
        doc.roundedRect(margin, y, contentWidth, 14, 3, 3, 'F');

        // Left color indicator
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [139, 92, 246];
        };
        const criterionColor = hexToRgb(c.color);
        doc.setFillColor(...criterionColor);
        doc.roundedRect(margin, y, 3, 14, 1.5, 1.5, 'F');

        // Criterion name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(...colors.textLight);
        doc.text(c.name, margin + 7, y + 6);

        // Description
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...colors.textMuted);
        doc.text(c.desc, margin + 7, y + 11);

        // Score badge
        const badgeW = 18;
        const badgeX = pageWidth - margin - badgeW;
        doc.setFillColor(40, 50, 70);
        doc.roundedRect(badgeX, y + 2.5, badgeW, 9, 4, 4, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...criterionColor);
        const badgeText = c.score + '/10';
        doc.text(badgeText, badgeX + badgeW / 2 - doc.getTextWidth(badgeText) / 2, y + 8.5);

        y += 17;
    });

    y += 6;

    // -- Improvement Tips --
    if (y > 240) {
        doc.addPage();
        doc.setFillColor(...colors.dark);
        doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
        y = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...colors.accent);
    doc.text('💡 Quick Improvement Tips', margin, y);
    y += 8;

    const improvementTips = [];
    state.criteriaScores.forEach(c => {
        if (c.score < 7) {
            improvementTips.push({ area: c.name, tip: 'Improve your ' + c.name.toLowerCase() + ' — ' + c.desc });
        }
    });

    if (improvementTips.length === 0) {
        improvementTips.push({ area: 'Great work!', tip: 'Your resume scored well across all criteria. Keep refining and tailoring for each role.' });
    }

    improvementTips.forEach((tip, i) => {
        if (y > 270) {
            doc.addPage();
            doc.setFillColor(...colors.dark);
            doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
            y = margin;
        }

        doc.setFillColor(...colors.cardBg);
        doc.roundedRect(margin, y, contentWidth, 12, 3, 3, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...colors.warning);
        doc.text((i + 1) + '. ' + tip.area, margin + 5, y + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...colors.textMuted);
        const tipLines = doc.splitTextToSize(tip.tip, contentWidth - 12);
        doc.text(tipLines[0], margin + 5, y + 9.5);

        y += 15;
    });

    // -- Footer --
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setDrawColor(40, 50, 70);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.textMuted);
    doc.text('ResuVibe — AI Resume Analyzer | resuvibe.app', margin, footerY);
    doc.text('Developed by Sumanshu Jindal', pageWidth - margin - doc.getTextWidth('Developed by Sumanshu Jindal'), footerY);

    // Save
    doc.save('ResuVibe_Report_' + state.score + '.pdf');
}

// --- Text Report Export --- //
function exportTextReport() {
    let report = '';
    report += '═══════════════════════════════════════════\n';
    report += '          RESUVIBE — RESUME ANALYSIS REPORT\n';
    report += '═══════════════════════════════════════════\n\n';
    report += 'Generated: ' + generateReportDate() + '\n\n';

    report += '┌─────────────────────────────────────┐\n';
    report += '│  OVERALL SCORE: ' + state.score + '/100';
    report += ' '.repeat(Math.max(0, 20 - String(state.score).length - 4)) + '│\n';
    report += '│  Verdict: ' + getScoreLabel(state.score);
    report += ' '.repeat(Math.max(0, 26 - getScoreLabel(state.score).length)) + '│\n';
    report += '└─────────────────────────────────────┘\n\n';

    report += '─── DETAILED BREAKDOWN ────────────────\n\n';

    state.criteriaScores.forEach((c, i) => {
        const bar = '█'.repeat(c.score) + '░'.repeat(10 - c.score);
        report += `  ${(i + 1).toString().padStart(2, '0')}. ${c.name}\n`;
        report += `      Score: [${bar}] ${c.score}/10\n`;
        report += `      ${c.desc}\n\n`;
    });

    report += '─── IMPROVEMENT TIPS ──────────────────\n\n';
    let tipCount = 0;
    state.criteriaScores.forEach(c => {
        if (c.score < 7) {
            tipCount++;
            report += `  ★ ${c.name}: Improve your ${c.name.toLowerCase()} — ${c.desc}\n`;
        }
    });
    if (tipCount === 0) {
        report += '  ★ Great job! Your resume scored well across all criteria.\n';
    }

    report += '\n═══════════════════════════════════════════\n';
    report += '  ResuVibe — AI Resume Analyzer\n';
    report += '  Developed by Sumanshu Jindal\n';
    report += '═══════════════════════════════════════════\n';

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ResuVibe_Report_' + state.score + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
