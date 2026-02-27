// ===== Import Data Combiner =====
import { combineDataWithSqlScripts, validateQueryIds, validateTableOfContents, validateExternalFiles } from './data-combiner.js';

// ===== Global Variables =====
let currentData = null;
let currentSection = null;

// ===== DOM Elements =====
const elements = {
    customFileInput: document.getElementById('customFileInput'),
    navMenu: document.getElementById('navMenu'),
    navContent: document.getElementById('navContent'),
    reportInfo: document.getElementById('reportInfo'),
    contentTitle: document.getElementById('contentTitle'),
    contentBody: document.getElementById('contentBody'),
    contentPanel: document.querySelector('.content-panel'),
    searchInput: document.getElementById('searchInput'),
    searchClear: document.getElementById('searchClear'),
    navToggle: document.getElementById('navToggle'),
    navigationPanel: document.getElementById('navigationPanel'),
    footerStatus: document.getElementById('footerStatus'),
    errorModal: document.getElementById('errorModal'),
    modalBody: document.getElementById('modalBody'),
    modalClose: document.getElementById('modalClose'),
    modalOk: document.getElementById('modalOk'),
    testCaseModal: document.getElementById('testCaseModal'),
    testCaseModalTitle: document.getElementById('testCaseModalTitle'),
    testCaseModalBody: document.getElementById('testCaseModalBody'),
    testCaseModalClose: document.getElementById('testCaseModalClose'),
    testCaseModalCancel: document.getElementById('testCaseModalCancel'),
    testCaseModalSave: document.getElementById('testCaseModalSave'),
    screenshotModal: document.getElementById('screenshotModal'),
    screenshotModalClose: document.getElementById('screenshotModalClose'),
    screenshotPreviewImage: document.getElementById('screenshotPreviewImage')
};

// ===== Event Listeners =====
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize IndexedDB first
    try {
        await initDB();
        console.log('IndexedDB initialized successfully on page load');
    } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
    }

    // Custom file upload
    elements.customFileInput.addEventListener('change', handleCustomFileUpload);

    // FAB button functionality
    const fabButton = document.getElementById('fabButton');
    const fabContainer = document.querySelector('.fab-container');
    const exportHtmlBtn = document.getElementById('exportHtmlBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const fabClearDataBtn = document.getElementById('fabClearDataBtn');

    // Toggle FAB menu
    if (fabButton && fabContainer) {
        fabButton.addEventListener('click', (e) => {
            e.stopPropagation();
            fabButton.classList.toggle('active');
            fabContainer.classList.toggle('active');
        });

        // Close FAB menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!fabContainer.contains(e.target)) {
                fabButton.classList.remove('active');
                fabContainer.classList.remove('active');
            }
        });
    }

    // FAB action button event listeners
    if (exportHtmlBtn) {
        exportHtmlBtn.addEventListener('click', () => {
            exportToHTML();
            fabButton.classList.remove('active');
            fabContainer.classList.remove('active');
        });
    }

    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', () => {
            exportToPDF();
            fabButton.classList.remove('active');
            fabContainer.classList.remove('active');
        });
    }

    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', () => {
            exportToExcel();
            fabButton.classList.remove('active');
            fabContainer.classList.remove('active');
        });
    }

    if (fabClearDataBtn) {
        fabClearDataBtn.addEventListener('click', () => {
            clearAllData();
            fabButton.classList.remove('active');
            fabContainer.classList.remove('active');
        });
    }

    // Search functionality
    elements.searchInput.addEventListener('input', handleSearch);
    elements.searchClear.addEventListener('click', clearSearch);

    // Navigation toggle for mobile
    elements.navToggle.addEventListener('click', toggleNavigation);

    // Modal close
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalOk.addEventListener('click', closeModal);

    // Close modal on outside click
    elements.errorModal.addEventListener('click', (e) => {
        if (e.target === elements.errorModal) {
            closeModal();
        }
    });

    // Test Case Modal events
    elements.testCaseModalClose.addEventListener('click', closeTestCaseModal);
    elements.testCaseModalCancel.addEventListener('click', closeTestCaseModal);
    elements.testCaseModalSave.addEventListener('click', saveTestCaseModal);

    elements.testCaseModal.addEventListener('click', (e) => {
        if (e.target === elements.testCaseModal) {
            closeTestCaseModal();
        }
    });

    // Screenshot Modal events
    elements.screenshotModalClose.addEventListener('click', closeScreenshotModal);
    elements.screenshotModal.addEventListener('click', (e) => {
        if (e.target === elements.screenshotModal) {
            closeScreenshotModal();
        }
    });

    // Screenshot navigation buttons
    const prevBtn = document.getElementById('screenshotPrevBtn');
    const nextBtn = document.getElementById('screenshotNextBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => navigateScreenshot('prev'));
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => navigateScreenshot('next'));
    }

    // Handle URL hash on page load
    handleInitialHash();

    // Handle browser back/forward buttons
    window.addEventListener('popstate', handleHashChange);
});

// ===== Hash Navigation =====
function handleInitialHash() {
    const hash = window.location.hash;
    if (hash && currentData) {
        const sectionId = hash.substring(1);
        const navLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
        if (navLink) {
            navLink.click();
        }
    }
}

function handleHashChange() {
    const hash = window.location.hash;
    if (hash && currentData) {
        const sectionId = hash.substring(1);
        const navLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
        if (navLink) {
            // Update active state
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            navLink.classList.add('active');

            // Render section
            renderSection(sectionId);
        }
    }
}

// ===== File Handling Functions =====
function handleCustomFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = file.name;
    const fileExtension = fileName.split('.').pop().toLowerCase();

    if (fileExtension !== 'json') {
        showError('Please select a valid JSON file');
        return;
    }

    updateStatus('Loading...');

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const fileContent = e.target.result;

            // Parse JSON file
            const jsonData = JSON.parse(fileContent);

            // Validate table of contents
            const tocValidation = validateTableOfContents(jsonData);
            console.log(`📑 Table of Contents: ${tocValidation.itemCount} items from ${tocValidation.source}`);

            // Validate external files
            const externalFilesValidation = validateExternalFiles(jsonData);
            console.log(`📁 External Files - Test Cases: ${externalFilesValidation.testCasesFile}, Scenarios: ${externalFilesValidation.testScenariosFile}`);

            // Validate query IDs (now async!)
            const validation = await validateQueryIds(jsonData);
            if (!validation.isValid) {
                console.warn('Missing SQL scripts for query IDs:', validation.missingQueryIds);
                showToast(`Warning: ${validation.missingQueryIds.length} SQL queries not found`, 'warning');
            }

            // Combine JSON data with SQL scripts, table of contents, and external files (now async!)
            const combinedData = await combineDataWithSqlScripts(jsonData);

            // Load the combined data
            await loadReportData(combinedData);
            updateStatus('Ready');

            // Show enhanced success message with all loaded resources
            const tocSource = tocValidation.source === 'JSON file' ? 'from JSON' : 'auto-loaded';
            const testCasesCount = combinedData.testCases?.length || 0;
            const scenariosCount = combinedData.testScenarios?.length || 0;
            const testCasesSource = externalFilesValidation.hasTestCasesFile ? `from ${externalFilesValidation.testCasesFile}` : 'from JSON';
            const scenariosSource = externalFilesValidation.hasScenariosFile ? `from ${externalFilesValidation.testScenariosFile}` : 'from JSON';

            showToast(
                `Report loaded successfully! ` +
                `(${validation.foundQueryIds.length} SQL queries, ` +
                `${tocValidation.itemCount} navigation items ${tocSource}, ` +
                `${testCasesCount} test cases ${testCasesSource}, ` +
                `${scenariosCount} scenarios ${scenariosSource})`,
                'success'
            );
        } catch (error) {
            showError(`Error loading report: ${error.message}`);
            updateStatus('Error');
        }
    };

    reader.onerror = () => {
        showError('Error reading file');
        updateStatus('Error');
    };

    reader.readAsText(file);
}

// ===== Data Loading and Rendering =====
async function loadReportData(data) {
    currentData = data;

    // Save complete report data to IndexedDB for export
    try {
        await saveCompleteReportData(data);
        console.log('✅ Report data saved to IndexedDB for export');
    } catch (error) {
        console.error('❌ Failed to save report data to IndexedDB:', error);
    }

    renderReportInfo(data);
    renderNavigation(data);
    await renderDefaultContent(data);
}

function renderReportInfo(data) {
    const metadata = data.metaData || {};

    const html = `
        <h3>${metadata.module || 'Test Report'}</h3>
        <p><strong>Environment:</strong> ${metadata.environment || 'N/A'}</p>
        <p><strong>Version:</strong> ${metadata.reportVersion || 'N/A'}</p>
        <p><strong>Date:</strong> ${metadata.reportDate || 'N/A'}</p>
        <p><strong>Total Test Cases:</strong> ${metadata.totalTestCases || 0}</p>
    `;

    elements.reportInfo.innerHTML = html;

    // Make the report info card clickable to navigate to overview
    elements.reportInfo.style.cursor = 'pointer';
    elements.reportInfo.onclick = async () => {
        // Remove active state from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Render the overview content
        await renderDefaultContent(data);
    };
}

function renderNavigation(data) {
    const toc = data.tableOfContents || [];
    
    if (toc.length === 0) {
        elements.navMenu.innerHTML = '<p class="text-muted">No navigation items available</p>';
        return;
    }
    
    const navItems = toc.map(item => `
        <div class="nav-item">
            <a href="#${item.id}" class="nav-link" data-section="${item.id}">
                <span class="nav-link-icon">${item.icon || '📄'}</span>
                <span class="nav-link-text">${item.title}</span>
            </a>
        </div>
    `).join('');
    
    elements.navMenu.innerHTML = navItems;
    
    // Add click handlers to navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavClick);
    });
}

async function renderDefaultContent(data) {
    const metadata = data.metaData || {};
    currentSection = 'overview';

    const overviewContent = await renderOverviewSection(data);

    const html = `
        <div class="section">
            <h2 class="section-title">📊 Test Report Overview</h2>
            <div class="section-content">
                ${overviewContent}
            </div>
        </div>
    `;

    elements.contentTitle.textContent = metadata.moduleName || 'Test Report';
    elements.contentBody.innerHTML = html;

    // Add animations after content is rendered
    setTimeout(addLoadAnimations, 50);
}

// ===== Navigation Handler =====
function handleNavClick(event) {
    event.preventDefault();

    const sectionId = event.currentTarget.dataset.section;

    // Update active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Render section content with smooth transition
    renderSection(sectionId);

    // Close mobile navigation
    if (window.innerWidth <= 768) {
        elements.navigationPanel.classList.remove('active');
    }

    // Smooth scroll to top of content
    elements.contentPanel.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    // Update URL hash without jumping
    history.pushState(null, null, `#${sectionId}`);
}

// ===== Section Rendering =====
function renderSection(sectionId) {
    currentSection = sectionId;

    const sectionMap = {
        'section-1': renderTestObjective,
        'section-2': renderTestPrerequisites,
        'section-3': renderTestData,
        'section-4': renderTestCases,
        'section-5': renderDatabaseQueries,
        'section-6': renderExecutionChecklist,
        'section-7': renderKnownIssues,
        'section-8': renderTestSummary,
        'section-9': renderDefectLog,
        'section-10': renderSignOff
    };

    const renderFunction = sectionMap[sectionId];

    if (renderFunction) {
        // Add fade out effect
        elements.contentBody.style.opacity = '0';

        setTimeout(async () => {
            // Handle async rendering for test summary, defect log, and sign-off
            const content = (sectionId === 'section-8' || sectionId === 'section-9' || sectionId === 'section-10')
                ? await renderFunction(currentData)
                : renderFunction(currentData);

            elements.contentBody.innerHTML = content;

            // Update title
            const section = currentData.tableOfContents.find(s => s.id === sectionId);
            if (section) {
                elements.contentTitle.textContent = section.title;
            }

            // Add fade in effect
            elements.contentBody.style.opacity = '1';

            // Add animations
            setTimeout(addLoadAnimations, 50);

            // Load checklist states if rendering checklist section
            if (sectionId === 'section-6') {
                loadAllChecklistStates();
            }

            // Render pie chart for test summary section
            if (sectionId === 'section-8') {
                // Wait for DOM to be fully ready
                setTimeout(() => {
                    const canvas = document.getElementById('testSummaryPieChart');
                    if (canvas) {
                        // Chart will be rendered by the renderTestSummary function
                        console.log('Test summary section loaded, pie chart rendering scheduled');
                    }
                }, 200);
            }
        }, 150);
    }
}

// ===== Overview Section =====
async function renderOverviewSection(data) {
    const metadata = data.metaData || {};
    const env = data.environmentSetup || {};

    // Calculate dynamic summary from database
    const dynamicSummary = await calculateDynamicTestSummary(data);
    const canvasId = 'overviewPieChart';

    const html = `
        <!-- Test Plan Metadata - Rearranged as per numbering -->
        <div class="info-grid">
            <div class="info-card">
                <div class="info-card-label">Test Plan ID</div>
                <div class="info-card-value">${metadata.testPlanId || 'N/A'}</div>
            </div>
            <div class="info-card">
                <div class="info-card-label">Module</div>
                <div class="info-card-value">${metadata.module || 'N/A'}</div>
            </div>
            <div class="info-card">
                <div class="info-card-label">Environment</div>
                <div class="info-card-value">${metadata.environment || 'N/A'}</div>
            </div>
            <div class="info-card">
                <div class="info-card-label">Created By</div>
                <div class="info-card-value">${metadata.createdBy || 'N/A'}</div>
            </div>
            <div class="info-card">
                <div class="info-card-label">Created Date</div>
                <div class="info-card-value">${metadata.createdDate || 'N/A'}</div>
            </div>
        </div>

        ${renderEnvironmentSetup(env)}

        <!-- Test Summary with Pie Chart -->
        <div class="section" style="margin-top: 2rem;">
            <h3 class="section-title">📊 Test Summary</h3>
            <div class="test-status-distribution">
                <div class="distribution-container">
                    <div class="pie-chart-wrapper">
                        <canvas id="${canvasId}" width="280" height="280"></canvas>
                    </div>
                    <div class="chart-legend">
                        <div class="legend-item">
                            <div class="legend-color" style="background-color: #10b981;"></div>
                            <div class="legend-label">Passed</div>
                            <div class="legend-value">${dynamicSummary.metrics.pass}</div>
                            <div class="legend-percentage">(${dynamicSummary.metrics.passPercentage}%)</div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color" style="background-color: #ef4444;"></div>
                            <div class="legend-label">Failed</div>
                            <div class="legend-value">${dynamicSummary.metrics.fail}</div>
                            <div class="legend-percentage">(${dynamicSummary.metrics.failPercentage}%)</div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color" style="background-color: #f97316;"></div>
                            <div class="legend-label">Blocked</div>
                            <div class="legend-value">${dynamicSummary.metrics.blocked}</div>
                            <div class="legend-percentage">(${dynamicSummary.metrics.blockedPercentage}%)</div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color" style="background-color: #94a3b8;"></div>
                            <div class="legend-label">Not Executed</div>
                            <div class="legend-value">${dynamicSummary.metrics.notExecuted}</div>
                            <div class="legend-percentage">(${dynamicSummary.metrics.notExecutedPercentage}%)</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Schedule pie chart rendering after DOM update
    setTimeout(() => {
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            console.log('Rendering overview pie chart...');
            renderPieChart(canvasId, dynamicSummary.metrics);
        } else {
            console.error('Canvas element not found after timeout. Retrying...');
            setTimeout(() => {
                renderPieChart(canvasId, dynamicSummary.metrics);
            }, 300);
        }
    }, 250);

    return html;
}

function renderEnvironmentSetup(env) {
    if (!env || Object.keys(env).length === 0) return '';

    const app = env.application || {};
    const db = env.database || {};
    const browser = env.browser || {};
    const execution = env.executionDetails || {};
    const testData = env.testData || {};
    const users = env.users || [];

    // Extract user information
    const adminUser = users.find(u => u.role === 'Main User' || u.role === 'Admin') || {};
    const secondaryUser = users.find(u => u.role === 'Secondary User') || {};

    return `
        <div class="section" style="margin-top: 2rem;">
            <h3 class="section-title">🔧 Environment Setup</h3>

            <!-- Detailed Environment Information -->
            <div style="margin-top: 2rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">

                <!-- Database Environment -->
                <div class="env-detail-section">
                    <h4 class="env-detail-title">Database Environment</h4>
                    <div class="env-detail-content">
                        <div class="env-detail-row">
                            <span class="env-detail-label">Database:</span>
                            <span class="env-detail-value">${db.name || 'N/A'}</span>
                        </div>
                        <div class="env-detail-row">
                            <span class="env-detail-label">Type:</span>
                            <span class="env-detail-value">${db.type || 'N/A'}</span>
                        </div>
                        <div class="env-detail-row">
                            <span class="env-detail-label">Version:</span>
                            <span class="env-detail-value">${db.version || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <!-- Application Details -->
                <div class="env-detail-section">
                    <h4 class="env-detail-title">Application Details</h4>
                    <div class="env-detail-content">
                        <div class="env-detail-row">
                            <span class="env-detail-label">Application:</span>
                            <span class="env-detail-value">${app.name || 'N/A'}</span>
                        </div>
                        <div class="env-detail-row">
                            <span class="env-detail-label">Module:</span>
                            <span class="env-detail-value">${app.module || 'N/A'}</span>
                        </div>
                        <div class="env-detail-row">
                            <span class="env-detail-label">Version:</span>
                            <span class="env-detail-value">${app.version || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <!-- Browser Details -->
                <div class="env-detail-section">
                    <h4 class="env-detail-title">Browser Details</h4>
                    <div class="env-detail-content">
                        <div class="env-detail-row">
                            <span class="env-detail-label">Browser:</span>
                            <span class="env-detail-value">${browser.name || 'N/A'}</span>
                        </div>
                        <div class="env-detail-row">
                            <span class="env-detail-label">Version:</span>
                            <span class="env-detail-value">${browser.version || 'Latest'}</span>
                        </div>
                    </div>
                </div>

                <!-- Test Data -->
                <div class="env-detail-section">
                    <h4 class="env-detail-title">Test Data</h4>
                    <div class="env-detail-content">
                        <div class="env-detail-row">
                            <span class="env-detail-label">Test Scheme:</span>
                            <span class="env-detail-value">${testData.scheme || 'Multiple Schemes (Top Level Access)'}</span>
                        </div>
                        <div class="env-detail-row">
                            <span class="env-detail-label">Member IDs:</span>
                            <span class="env-detail-value">${testData.memberIds || 'To be filled during test execution'}</span>
                        </div>
                    </div>
                </div>

                <!-- Test Users -->
                <div class="env-detail-section">
                    <h4 class="env-detail-title">Test Users</h4>
                    <div class="env-detail-content">
                        <div class="env-detail-row">
                            <span class="env-detail-label">Admin:</span>
                            <span class="env-detail-value">${adminUser.username || 'N/A'}</span>
                        </div>
                        <div class="env-detail-row">
                            <span class="env-detail-label">Secondary User:</span>
                            <span class="env-detail-value">${secondaryUser.username || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <!-- Execution Details -->
                <div class="env-detail-section">
                    <h4 class="env-detail-title">Execution Details</h4>
                    <div class="env-detail-content">
                        <div class="env-detail-row">
                            <span class="env-detail-label">Start Date:</span>
                            <span class="env-detail-value">${execution.startDate || 'N/A'}</span>
                        </div>
                        <div class="env-detail-row">
                            <span class="env-detail-label">End Date:</span>
                            <span class="env-detail-value">${execution.endDate || 'N/A'}</span>
                        </div>
                        <div class="env-detail-row">
                            <span class="env-detail-label">Tester Name:</span>
                            <span class="env-detail-value">${execution.testerName || 'N/A'}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `;
}

// ===== Test Objective Section =====
function renderTestObjective(data) {
    const objective = data.testObjective || {};

    return `
        <div class="section">
            <h2 class="section-title">📋 1. Test Objective</h2>
            <div class="section-content">
                <p class="objective-description">
                    ${objective.mainGoal || 'To verify that the Global Search functionality at Top Level in PenScope works correctly for searching members across multiple schemes. This regression test ensures that users can search for members using various criteria and that search results are accurate, complete, and properly formatted.'}
                </p>

                <div class="scope-section">
                    <h3>Scope</h3>
                    <ul class="scope-list">
                        <li><strong>Search Criteria:</strong> NI Number, Surname, First Name, Date of Birth, Member ID, ECON Number, Email Address, Postcode</li>
                        <li><strong>Search Modes:</strong> Exact Match and Partial Match (wildcard search)</li>
                        <li><strong>Cross-Scheme Search:</strong> Search across all schemes accessible to the user</li>
                        <li><strong>Search Results Display:</strong> Member details with Administration Team information</li>
                        <li><strong>Result Navigation:</strong> Click-through to member details page</li>
                        <li><strong>Performance:</strong> Search execution time and result pagination</li>
                        <li><strong>Security:</strong> Access control and permission validation</li>
                        <li><strong>Data Validation:</strong> Input validation and error handling</li>
                    </ul>
                </div>

                ${objective.note ? `
                    <div class="note-box">
                        <p><strong>Note:</strong> ${objective.note}</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// ===== Test Prerequisites Section =====
function renderTestPrerequisites(data) {
    const prereq = data.testPrerequisite || {};
    const accessReq = data.accessRequirements || {};
    const envConfig = data.environmentConfig || {};

    return `
        <div class="section">
            <h2 class="section-title">🎯 Test Prerequisites</h2>
            <div class="section-content">
                ${prereq.businessRules && prereq.businessRules.length > 0 ? `
                    <h3 class="mb-2">Business Rules</h3>
                    <ul class="styled-list mb-3">
                        ${prereq.businessRules.map(rule => `<li>${rule}</li>`).join('')}
                    </ul>
                ` : ''}

                ${accessReq.environmentAccess && accessReq.environmentAccess.length > 0 ? `
                    <h3 class="mb-2">Environment Access Requirements</h3>
                    <ul class="styled-list mb-3">
                        ${accessReq.environmentAccess.map(req => `<li>${req}</li>`).join('')}
                    </ul>
                ` : ''}

                ${accessReq.userRoles && accessReq.userRoles.length > 0 ? `
                    <h3 class="mb-2">User Roles Required</h3>
                    <ul class="styled-list mb-3">
                        ${accessReq.userRoles.map(role => `<li>${role}</li>`).join('')}
                    </ul>
                ` : ''}

                ${prereq.testEnvSetup ? `
                    <h3 class="mb-2">Test Environment Setup</h3>
                    <div class="info-grid">
                        ${Object.entries(prereq.testEnvSetup).map(([key, value]) => `
                            <div class="info-card">
                                <div class="info-card-label">${formatLabel(key)}</div>
                                <div class="info-card-value">${value}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// ===== Test Data Section =====
function renderTestData(data) {
    const testData = data.sampleTestData || [];

    return `
        <div class="section">
            <h2 class="section-title">📊 Test Data</h2>
            <div class="section-content">
                ${testData.length > 0 ? `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Field Name</th>
                                    <th>Test Value 1 (Exact Match)</th>
                                    <th>Test Value 2 (Partial Match)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${testData.map(item => `
                                    <tr>
                                        <td><strong>${item.testFieldName}</strong></td>
                                        <td>${item.testValue1}</td>
                                        <td>${item.testValue2}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p class="text-muted">No test data available</p>'}
            </div>
        </div>
    `;
}

// ===== Test Cases Section =====
function renderTestCases(data) {
    const testCases = data.testCases || [];
    const categories = data.testScenariosCategory || [];

    return `
        <div class="section">
            <h2 class="section-title">🧪 Regression Test Cases</h2>
            <div class="section-content">
                ${categories.length > 0 ? `
                    <h3 class="mb-2">Test Categories</h3>
                    <div class="info-grid mb-3">
                        ${categories.map(cat => `
                            <div class="info-card">
                                <div class="info-card-label">${cat.categoryId}</div>
                                <div class="info-card-value">${cat.categoryTitle}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <h3 class="mb-2">Test Cases (${testCases.length})</h3>
                ${testCases.length > 0 ? renderTestCasesTable(testCases) : '<p class="text-muted">No test cases available</p>'}
            </div>
        </div>
    `;
}

function renderTestCasesTable(testCases) {
    return `
        <div class="filter-controls">
            <div class="filter-group">
                <label for="priorityFilter">Filter by Priority:</label>
                <select id="priorityFilter" class="filter-dropdown" onchange="applyTestCaseFilters()">
                    <option value="all">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="statusFilter">Filter by Test Status:</label>
                <select id="statusFilter" class="filter-dropdown" onchange="applyTestCaseFilters()">
                    <option value="all">All Statuses</option>
                    <option value="not executed">Not Executed</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                    <option value="blocked">Blocked</option>
                </select>
            </div>
            <button class="reset-filters-btn" onclick="resetTestCaseFilters()">Reset Filters</button>
        </div>
        <div class="table-container">
            <table id="testCasesTable">
                <thead>
                    <tr>
                        <th style="width: 8%;">TC ID</th>
                        <th style="width: 25%;">Test Scenario</th>
                        <th style="width: 10%;">Priority</th>
                        <th style="width: 12%;">Module</th>
                        <th style="width: 12%;">Source</th>
                        <th style="width: 12%;">Test Status</th>
                        <th style="width: 8%;">View Details</th>
                        <th style="width: 13%;">Screenshots</th>
                    </tr>
                </thead>
                <tbody id="testCasesTableBody">
                    ${testCases.map(tc => renderTestCaseRow(tc)).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderTestCaseRow(tc) {
    // Determine source display
    let sourceDisplay = '';
    if (tc.source && Array.isArray(tc.source) && tc.source.length > 0) {
        // Existing test case - show source IDs
        sourceDisplay = tc.source.join(', ');
    } else {
        // Newly created test case
        sourceDisplay = '<span class="badge-new">Newly Created</span>';
    }

    // Render with default values, will be updated async
    const html = `
        <tr id="test-case-row-${tc.testCaseId}">
            <td><strong>${tc.testCaseId}</strong></td>
            <td>${tc.testCaseName}</td>
            <td><span class="status-badge priority-${(tc.priority[0] || 'medium').toLowerCase()}">${tc.priority[0] || 'Medium'}</span></td>
            <td>${tc.module}</td>
            <td>${sourceDisplay}</td>
            <td>
                <select class="status-dropdown status-not-executed"
                        id="status-${tc.testCaseId}"
                        onchange="updateTestCaseStatus('${tc.testCaseId}', this.value)">
                    <option value="Not Executed" selected>Not Executed</option>
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                    <option value="Blocked">Blocked</option>
                </select>
            </td>
            <td class="text-center">
                <button class="view-tc-btn" onclick="viewTestCaseDetails('${tc.testCaseId}')" title="View Details">
                    View
                </button>
            </td>
            <td>
                <div class="screenshot-cell">
                    <button class="camera-btn-icon"
                            onclick="pasteScreenshot('${tc.testCaseId}')"
                            title="Click to paste screenshot from clipboard (Ctrl+V)">
                        📷
                    </button>
                    <div class="screenshots-preview" id="screenshots-${tc.testCaseId}">
                    </div>
                </div>
            </td>
        </tr>
    `;

    // Load saved data asynchronously
    loadTestCaseRowData(tc.testCaseId);

    return html;
}

// Load saved data for a test case row
async function loadTestCaseRowData(testCaseId) {
    const savedData = await getTestCaseData(testCaseId);
    const currentStatus = savedData.status || 'Not Executed';
    const screenshots = savedData.screenshots || [];

    // Update status dropdown
    const dropdown = document.getElementById(`status-${testCaseId}`);
    if (dropdown) {
        dropdown.value = currentStatus;
        dropdown.classList.remove('status-pass', 'status-fail', 'status-blocked', 'status-not-executed');
        const statusClass = `status-${currentStatus.toLowerCase().replace(' ', '-')}`;
        dropdown.classList.add(statusClass);

        // Reapply filters after status is loaded
        if (typeof applyTestCaseFilters === 'function') {
            applyTestCaseFilters();
        }
    }

    // Update screenshots display
    await updateScreenshotsDisplay(testCaseId);
}

// ===== Test Case Filtering =====
window.applyTestCaseFilters = async function() {
    const priorityFilter = document.getElementById('priorityFilter')?.value || 'all';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const tableBody = document.getElementById('testCasesTableBody');

    if (!tableBody) return;

    const rows = tableBody.querySelectorAll('tr');

    for (const row of rows) {
        const testCaseId = row.id.replace('test-case-row-', '');
        const priorityBadge = row.querySelector('.status-badge[class*="priority-"]');
        const statusDropdown = document.getElementById(`status-${testCaseId}`);

        let showRow = true;

        // Filter by priority
        if (priorityFilter !== 'all' && priorityBadge) {
            const priority = priorityBadge.textContent.trim().toLowerCase();
            if (priority !== priorityFilter) {
                showRow = false;
            }
        }

        // Filter by status
        if (statusFilter !== 'all' && statusDropdown) {
            const status = statusDropdown.value.toLowerCase();
            if (status !== statusFilter) {
                showRow = false;
            }
        }

        // Show or hide the row
        row.style.display = showRow ? '' : 'none';
    }

    // Update the count display
    updateFilteredCount();
};

window.resetTestCaseFilters = function() {
    const priorityFilter = document.getElementById('priorityFilter');
    const statusFilter = document.getElementById('statusFilter');

    if (priorityFilter) priorityFilter.value = 'all';
    if (statusFilter) statusFilter.value = 'all';

    applyTestCaseFilters();
};

function updateFilteredCount() {
    const tableBody = document.getElementById('testCasesTableBody');
    if (!tableBody) return;

    const allRows = tableBody.querySelectorAll('tr');
    const visibleRows = tableBody.querySelectorAll('tr[style=""], tr:not([style*="display: none"])');

    // Find the test cases heading and update it
    const heading = document.querySelector('.section-content h3');
    if (heading && heading.textContent.includes('Test Cases')) {
        const totalCount = allRows.length;
        const visibleCount = visibleRows.length;

        if (visibleCount < totalCount) {
            heading.textContent = `Test Cases (${visibleCount} of ${totalCount})`;
        } else {
            heading.textContent = `Test Cases (${totalCount})`;
        }
    }
}

// ===== Test Case Details Modal =====
window.viewTestCaseDetails = async function(testCaseId) {
    const testCase = currentData.testCases.find(tc => tc.testCaseId === testCaseId);
    if (!testCase) return;

    const savedData = await getTestCaseData(testCaseId);
    const actualResult = savedData.actualResult || '';

    const detailsHtml = `
        <div class="test-case-meta">
            <div class="test-case-meta-item">
                <span class="test-case-meta-label">Test Case ID</span>
                <span class="test-case-meta-value">${testCase.testCaseId}</span>
            </div>
            <div class="test-case-meta-item">
                <span class="test-case-meta-label">Module</span>
                <span class="test-case-meta-value">${testCase.module}</span>
            </div>
            <div class="test-case-meta-item">
                <span class="test-case-meta-label">Location</span>
                <span class="test-case-meta-value">${testCase.location}</span>
            </div>
            <div class="test-case-meta-item">
                <span class="test-case-meta-label">Priority</span>
                <span class="test-case-meta-value">
                    <span class="status-badge priority-${(testCase.priority[0] || 'medium').toLowerCase()}">${testCase.priority[0]}</span>
                </span>
            </div>
        </div>

        <div class="test-case-detail-section">
            <h5>📝 Test Case Name</h5>
            <p>${testCase.testCaseName}</p>
        </div>

        <div class="test-case-detail-section">
            <h5>📋 Test Steps</h5>
            <ol>
                ${testCase.testSteps.map(step => `<li>${step}</li>`).join('')}
            </ol>
        </div>

        <div class="test-case-detail-section">
            <h5>✅ Expected Result</h5>
            <p>${testCase.expectedResult}</p>
        </div>

        <div class="test-case-detail-section">
            <h5>📊 Actual Result</h5>
            <textarea
                id="actual-result-input"
                class="actual-result-input"
                placeholder="Enter the actual result observed during test execution..."
            >${actualResult}</textarea>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">
                💡 Your input will be automatically saved when you close this dialog or click Save.
            </p>
        </div>
    `;

    showTestCaseModal(testCaseId, testCase.testCaseName, detailsHtml);
};

// ===== Database Queries Section =====
function renderDatabaseQueries(data) {
    const queries = data.sqlQueryScripts || [];

    return `
        <div class="section">
            <h2 class="section-title">🗄️ Database Queries</h2>
            <div class="section-content">
                ${queries.length > 0 ? queries.map((query, index) => `
                    <div class="sql-query-item">
                        <h3 class="sql-query-title">${index + 1}. ${query.queryTitle}</h3>
                        <div class="sql-code-container">
                            <button class="sql-copy-btn" onclick="copySqlQuery(${index}, this)" title="Copy SQL">
                                Copy
                            </button>
                            <pre class="sql-code" id="sql-code-${index}">${escapeHtml(query.queryText)}</pre>
                        </div>
                    </div>
                `).join('') : '<p class="text-muted">No database queries available</p>'}
            </div>
        </div>
    `;
}

// Copy SQL query to clipboard
window.copySqlQuery = async function(index, button) {
    const codeElement = document.getElementById(`sql-code-${index}`);
    if (!codeElement) return;

    const sqlText = codeElement.textContent;

    try {
        await navigator.clipboard.writeText(sqlText);

        // Show success feedback
        const originalText = button.textContent;
        button.textContent = '✓ Copied!';
        button.style.background = '#10b981';

        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);

        showToast('SQL query copied to clipboard!', 'success');
    } catch (err) {
        console.error('Failed to copy:', err);
        showToast('Failed to copy SQL query', 'error');
    }
};

// ===== Execution Checklist Section =====
function renderExecutionChecklist(data) {
    const checklist = data.executionChecklist || {};

    return `
        <div class="section">
            <h2 class="section-title">✅ Test Execution Checklist</h2>
            <div class="section-content">
                ${checklist.preExecutionSteps && checklist.preExecutionSteps.length > 0 ? `
                    <h3 class="checklist-section-title">Pre-Execution Steps</h3>
                    <ul class="checklist-items">
                        ${checklist.preExecutionSteps.map((step, index) => `
                            <li class="checklist-item" id="pre-${index}">
                                <label class="checklist-label">
                                    <input type="checkbox" class="checklist-checkbox"
                                           data-category="preExecutionSteps"
                                           data-index="${index}"
                                           onchange="toggleChecklistItem(this)">
                                    <span class="checklist-text">${step}</span>
                                </label>
                            </li>
                        `).join('')}
                    </ul>
                ` : ''}

                ${checklist.mandatoryChecks && checklist.mandatoryChecks.length > 0 ? `
                    <h3 class="checklist-section-title">Mandatory Checks During Execution</h3>
                    <ul class="checklist-items">
                        ${checklist.mandatoryChecks.map((check, index) => `
                            <li class="checklist-item" id="mandatory-${index}">
                                <label class="checklist-label">
                                    <input type="checkbox" class="checklist-checkbox"
                                           data-category="mandatoryChecks"
                                           data-index="${index}"
                                           onchange="toggleChecklistItem(this)">
                                    <span class="checklist-text">${check}</span>
                                </label>
                            </li>
                        `).join('')}
                    </ul>
                ` : ''}

                ${checklist.postExecutionActivities && checklist.postExecutionActivities.length > 0 ? `
                    <h3 class="checklist-section-title">Post-Execution Activities</h3>
                    <ul class="checklist-items">
                        ${checklist.postExecutionActivities.map((activity, index) => `
                            <li class="checklist-item" id="post-${index}">
                                <label class="checklist-label">
                                    <input type="checkbox" class="checklist-checkbox"
                                           data-category="postExecutionActivities"
                                           data-index="${index}"
                                           onchange="toggleChecklistItem(this)">
                                    <span class="checklist-text">${activity}</span>
                                </label>
                            </li>
                        `).join('')}
                    </ul>
                ` : ''}
            </div>
        </div>
    `;
}

// ===== Toggle Checklist Item =====
window.toggleChecklistItem = async function(checkbox) {
    const category = checkbox.dataset.category;
    const index = checkbox.dataset.index;
    const isChecked = checkbox.checked;
    const checklistItem = checkbox.closest('.checklist-item');

    // Update visual state
    if (isChecked) {
        checklistItem.classList.add('checked');
    } else {
        checklistItem.classList.remove('checked');
    }

    // Save state to IndexedDB
    await saveChecklistState(category, index, isChecked);
};

// ===== Save Checklist State =====
async function saveChecklistState(category, index, isChecked) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['checklist'], 'readwrite');
        const store = transaction.objectStore('checklist');
        const key = `${category}-${index}`;

        const request = store.put({ id: key, checked: isChecked });

        request.onsuccess = () => {
            console.log(`Saved checklist state: ${key} = ${isChecked}`);
            resolve();
        };
        request.onerror = () => {
            console.error(`Error saving checklist state: ${key}`, request.error);
            reject(request.error);
        };
    });
}

// ===== Load Checklist State =====
async function loadChecklistState(category, index) {
    if (!db) await initDB();

    return new Promise((resolve) => {
        const transaction = db.transaction(['checklist'], 'readonly');
        const store = transaction.objectStore('checklist');
        const key = `${category}-${index}`;

        const request = store.get(key);

        request.onsuccess = () => {
            const isChecked = request.result ? request.result.checked : false;
            console.log(`Loaded checklist state: ${key} = ${isChecked}`);
            resolve(isChecked);
        };
        request.onerror = () => {
            console.error(`Error loading checklist state: ${key}`, request.error);
            resolve(false);
        };
    });
}

// ===== Load All Checklist States =====
async function loadAllChecklistStates() {
    console.log('Loading all checklist states...');

    // Wait a bit for DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 100));

    const checkboxes = document.querySelectorAll('.checklist-checkbox');
    console.log(`Found ${checkboxes.length} checklist items`);

    for (const checkbox of checkboxes) {
        const category = checkbox.dataset.category;
        const index = checkbox.dataset.index;
        const isChecked = await loadChecklistState(category, index);

        if (isChecked) {
            checkbox.checked = true;
            checkbox.closest('.checklist-item').classList.add('checked');
        }
    }

    console.log('Finished loading checklist states');
}

// ===== Known Issues Section =====
function renderKnownIssues(data) {
    const issues = data.knownIssueNotes || {};

    return `
        <div class="section">
            <h2 class="section-title">⚠️ Known Issues & Notes</h2>
            <div class="section-content">
                ${issues.knownIssue && issues.knownIssue.length > 0 ? `
                    <h3 class="mb-2">Known Issues</h3>
                    ${issues.knownIssue.map(issue => `
                        <div class="info-card mb-2" style="border-left-color: var(--warning-color);">
                            <div class="info-card-label">${issue.issueId}</div>
                            <div class="info-card-value mb-1">${issue.description}</div>
                            ${issue.workaround ? `<p class="text-muted"><strong>Workaround:</strong> ${issue.workaround}</p>` : ''}
                        </div>
                    `).join('')}
                ` : ''}

                ${issues.knownLimitation && issues.knownLimitation.length > 0 ? `
                    <h3 class="mb-2 mt-3">Known Limitations</h3>
                    <ul class="styled-list">
                        ${issues.knownLimitation.map(limitation => `<li>${limitation}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>
        </div>
    `;
}

// ===== Test Summary Section =====
async function renderTestSummary(data) {
    // This will be populated with dynamic data
    const dynamicSummary = await calculateDynamicTestSummary(data);
    const defects = data.defectSummary || [];

    const canvasId = 'testSummaryPieChart';

    // Render the HTML first
    const html = `
        <div class="section">
            <h2 class="section-title">📊 Test Summary Report</h2>
            <div class="section-content">
                <h3 class="mb-3">Test Status Distribution</h3>
                <div class="test-status-distribution">
                    <div class="distribution-container">
                        <div class="pie-chart-wrapper">
                            <canvas id="${canvasId}" width="280" height="280"></canvas>
                        </div>
                        <div class="chart-legend">
                            <div class="legend-item">
                                <div class="legend-color" style="background-color: #10b981;"></div>
                                <div class="legend-label">Passed</div>
                                <div class="legend-value">${dynamicSummary.metrics.pass}</div>
                                <div class="legend-percentage">(${dynamicSummary.metrics.passPercentage}%)</div>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color" style="background-color: #ef4444;"></div>
                                <div class="legend-label">Failed</div>
                                <div class="legend-value">${dynamicSummary.metrics.fail}</div>
                                <div class="legend-percentage">(${dynamicSummary.metrics.failPercentage}%)</div>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color" style="background-color: #f97316;"></div>
                                <div class="legend-label">Blocked</div>
                                <div class="legend-value">${dynamicSummary.metrics.blocked}</div>
                                <div class="legend-percentage">(${dynamicSummary.metrics.blockedPercentage}%)</div>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color" style="background-color: #94a3b8;"></div>
                                <div class="legend-label">Not Executed</div>
                                <div class="legend-value">${dynamicSummary.metrics.notExecuted}</div>
                                <div class="legend-percentage">(${dynamicSummary.metrics.notExecutedPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                </div>

                <h3 class="mb-2 mt-3">Test Execution by Priority</h3>
                <div class="table-container mb-3">
                    <table>
                        <thead>
                            <tr>
                                <th>Priority</th>
                                <th>Total</th>
                                <th>Executed</th>
                                <th>Passed</th>
                                <th>Failed</th>
                                <th>Blocked</th>
                                <th>Not Executed</th>
                                <th>Pass Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(dynamicSummary.byPriority).map(([priority, stats]) => `
                                <tr>
                                    <td><span class="status-badge priority-${priority.toLowerCase()}">${priority}</span></td>
                                    <td>${stats.total}</td>
                                    <td>${stats.executed}</td>
                                    <td>${stats.passed}</td>
                                    <td>${stats.failed}</td>
                                    <td>${stats.blocked}</td>
                                    <td>${stats.notExecuted}</td>
                                    <td>${stats.passRate}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                ${Object.keys(dynamicSummary.byCategory).length > 0 ? `
                    <h3 class="mb-2 mt-3">Test Execution by Category</h3>
                    <div class="table-container mb-3">
                        <table>
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Total</th>
                                    <th>Executed</th>
                                    <th>Passed</th>
                                    <th>Failed</th>
                                    <th>Blocked</th>
                                    <th>Not Executed</th>
                                    <th>Pass Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.entries(dynamicSummary.byCategory).map(([categoryId, stats]) => `
                                    <tr>
                                        <td><strong>${categoryId}</strong> - ${stats.title}</td>
                                        <td>${stats.total}</td>
                                        <td>${stats.executed}</td>
                                        <td>${stats.passed}</td>
                                        <td>${stats.failed}</td>
                                        <td>${stats.blocked}</td>
                                        <td>${stats.notExecuted}</td>
                                        <td>${stats.passRate}%</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}

                ${defects.length > 0 && defects[0].bugId ? `
                    <h3 class="mb-2 mt-3">Defect Summary</h3>
                    <div class="table-container mb-3">
                        <table>
                            <thead>
                                <tr>
                                    <th>Bug ID</th>
                                    <th>Test Case ID</th>
                                    <th>Title</th>
                                    <th>Severity</th>
                                    <th>Status</th>
                                    <th>Date Found</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${defects.map(defect => `
                                    <tr>
                                        <td><strong>${defect.bugId}</strong></td>
                                        <td>${defect.testCaseId}</td>
                                        <td>${defect.title}</td>
                                        <td><span class="status-badge priority-${(defect.severity || 'medium').toLowerCase()}">${defect.severity}</span></td>
                                        <td>${defect.status}</td>
                                        <td>${defect.dateFound}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    // Schedule pie chart rendering after DOM update
    setTimeout(() => {
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            console.log('Rendering pie chart...');
            renderPieChart(canvasId, dynamicSummary.metrics);
        } else {
            console.error('Canvas element not found after timeout. Retrying...');
            // Retry after a longer delay
            setTimeout(() => {
                renderPieChart(canvasId, dynamicSummary.metrics);
            }, 300);
        }
    }, 250);

    return html;
}

// ===== Calculate Dynamic Test Summary from IndexedDB =====
async function calculateDynamicTestSummary(data) {
    const testCases = data.testCases || [];
    const categories = data.testScenariosCategory || [];

    // Get all test case statuses from IndexedDB
    const statusMap = {};
    for (const testCase of testCases) {
        const savedData = await getTestCaseData(testCase.testCaseId);
        statusMap[testCase.testCaseId] = savedData.status || 'Not Executed';
    }

    // Calculate overall metrics
    let pass = 0, fail = 0, blocked = 0, notExecuted = 0;
    testCases.forEach(tc => {
        const status = statusMap[tc.testCaseId];
        if (status === 'Pass') pass++;
        else if (status === 'Fail') fail++;
        else if (status === 'Blocked') blocked++;
        else notExecuted++;
    });

    const total = testCases.length;
    const metrics = {
        total,
        pass,
        fail,
        blocked,
        notExecuted,
        passPercentage: total > 0 ? ((pass / total) * 100).toFixed(1) : '0.0',
        failPercentage: total > 0 ? ((fail / total) * 100).toFixed(1) : '0.0',
        blockedPercentage: total > 0 ? ((blocked / total) * 100).toFixed(1) : '0.0',
        notExecutedPercentage: total > 0 ? ((notExecuted / total) * 100).toFixed(1) : '0.0'
    };

    // Calculate by priority
    const byPriority = {};
    ['High', 'Medium', 'Low'].forEach(priority => {
        const priorityTests = testCases.filter(tc =>
            tc.priority && tc.priority[0] && tc.priority[0].toLowerCase() === priority.toLowerCase()
        );

        let pPass = 0, pFail = 0, pBlocked = 0, pNotExecuted = 0;
        priorityTests.forEach(tc => {
            const status = statusMap[tc.testCaseId];
            if (status === 'Pass') pPass++;
            else if (status === 'Fail') pFail++;
            else if (status === 'Blocked') pBlocked++;
            else pNotExecuted++;
        });

        const pTotal = priorityTests.length;
        const pExecuted = pPass + pFail + pBlocked;

        byPriority[priority] = {
            total: pTotal,
            executed: pExecuted,
            passed: pPass,
            failed: pFail,
            blocked: pBlocked,
            notExecuted: pNotExecuted,
            passRate: pExecuted > 0 ? ((pPass / pExecuted) * 100).toFixed(1) : '0.0'
        };
    });

    // Calculate by category (based on source field mapping to category IDs)
    const byCategory = {};
    categories.forEach(category => {
        const categoryId = category.categoryId;
        const categoryTests = testCases.filter(tc =>
            tc.source && tc.source.some(s => s.startsWith(categoryId.replace('.', '')))
        );

        let cPass = 0, cFail = 0, cBlocked = 0, cNotExecuted = 0;
        categoryTests.forEach(tc => {
            const status = statusMap[tc.testCaseId];
            if (status === 'Pass') cPass++;
            else if (status === 'Fail') cFail++;
            else if (status === 'Blocked') cBlocked++;
            else cNotExecuted++;
        });

        const cTotal = categoryTests.length;
        const cExecuted = cPass + cFail + cBlocked;

        if (cTotal > 0) {
            byCategory[categoryId] = {
                title: category.categoryTitle,
                total: cTotal,
                executed: cExecuted,
                passed: cPass,
                failed: cFail,
                blocked: cBlocked,
                notExecuted: cNotExecuted,
                passRate: cExecuted > 0 ? ((cPass / cExecuted) * 100).toFixed(1) : '0.0'
            };
        }
    });

    return { metrics, byPriority, byCategory };
}

// ===== Render Pie Chart =====
function renderPieChart(canvasId, metrics) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error('Canvas not found:', canvasId);
        return;
    }

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = Math.min(centerX, centerY) - 20;
    const innerRadius = outerRadius * 0.6; // Donut chart with 60% inner radius

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Data for pie chart
    const data = [
        { label: 'Pass', value: metrics.pass, color: '#10b981', percentage: metrics.passPercentage },
        { label: 'Fail', value: metrics.fail, color: '#ef4444', percentage: metrics.failPercentage },
        { label: 'Blocked', value: metrics.blocked, color: '#f97316', percentage: metrics.blockedPercentage },
        { label: 'Not Executed', value: metrics.notExecuted, color: '#94a3b8', percentage: metrics.notExecutedPercentage }
    ];

    // Calculate total
    const total = metrics.total;

    if (total === 0) {
        // Draw "No Data" message
        ctx.fillStyle = '#6b7280';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No test data available', centerX, centerY);
        return;
    }

    // Draw donut chart slices
    let currentAngle = -Math.PI / 2; // Start from top

    data.forEach(item => {
        if (item.value > 0) {
            const sliceAngle = (item.value / total) * 2 * Math.PI;

            // Draw slice
            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
            ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
            ctx.closePath();
            ctx.fillStyle = item.color;
            ctx.fill();

            // Draw border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();

            currentAngle += sliceAngle;
        }
    });

    // Draw center circle (white background)
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw total number in center
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total.toString(), centerX, centerY - 10);

    // Draw "Total Tests" label
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Arial';
    ctx.fillText('Total Tests', centerX, centerY + 20);
}

// ===== Defect Log Section =====
async function renderDefectLog(data) {
    // Ensure database is initialized
    if (!db) {
        await initDB();
    }

    // Load saved defects from IndexedDB
    const savedDefects = await loadAllDefects();

    // Get test case IDs for dropdown
    const testCases = data.testCases || [];
    const testCaseIds = testCases.map(tc => tc.testCaseId);

    return `
        <div class="section">
            <h2 class="section-title">🐛 Defect Log</h2>
            <div class="section-content">
                <div class="defect-header mb-3">
                    <button class="btn-primary" onclick="openDefectModal()">
                        ➕ Add New Defect
                    </button>
                    <div class="defect-stats">
                        <span class="stat-item">
                            <strong>Total:</strong> ${savedDefects.length}
                        </span>
                        <span class="stat-item">
                            <strong>Open:</strong> ${savedDefects.filter(d => d.status === 'Open').length}
                        </span>
                        <span class="stat-item">
                            <strong>Fixed:</strong> ${savedDefects.filter(d => d.status === 'Fixed').length}
                        </span>
                        <span class="stat-item">
                            <strong>Closed:</strong> ${savedDefects.filter(d => d.status === 'Closed').length}
                        </span>
                    </div>
                </div>

                ${savedDefects.length > 0 ? `
                    <div class="defect-table-container">
                        <table class="defect-table">
                            <thead>
                                <tr>
                                    <th style="width: 10%;">Bug ID</th>
                                    <th style="width: 12%;">Test Case ID</th>
                                    <th style="width: 25%;">Title</th>
                                    <th style="width: 10%;">Severity</th>
                                    <th style="width: 10%;">Status</th>
                                    <th style="width: 12%;">Date Found</th>
                                    <th style="width: 11%;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${savedDefects.map(defect => `
                                    <tr>
                                        <td><strong>${defect.bugId}</strong></td>
                                        <td>${defect.testCaseId}</td>
                                        <td>${defect.title}</td>
                                        <td><span class="severity-badge severity-${(defect.severity || 'medium').toLowerCase()}">${defect.severity}</span></td>
                                        <td><span class="status-badge status-${(defect.status || 'open').toLowerCase()}">${defect.status}</span></td>
                                        <td>${defect.dateFound}</td>
                                        <td class="action-buttons">
                                            <button class="btn-icon" onclick="viewDefect('${defect.bugId}')" title="View Details">
                                                🔍
                                            </button>
                                            <button class="btn-icon" onclick="editDefect('${defect.bugId}')" title="Edit">
                                                ✏️
                                            </button>
                                            <button class="btn-icon btn-delete" onclick="deleteDefect('${defect.bugId}')" title="Delete">
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : `
                    <div class="empty-state">
                        <div class="empty-icon">🐛</div>
                        <h3>No Defects Logged</h3>
                        <p>Click "Add New Defect" to log your first defect</p>
                    </div>
                `}
            </div>
        </div>
    `;
}

// ===== Sign-Off Section =====
async function renderSignOff(data) {
    const criteria = data.signOffCriteria || {};

    // Load saved sign-offs from IndexedDB
    const savedSignOffs = await loadAllSignOffs();

    // Default roles if none exist
    const defaultRoles = [
        'Test Lead',
        'QA Manager',
        'Project Manager',
        'Business Analyst'
    ];

    return `
        <div class="section">
            <h2 class="section-title">✍️ Sign-Off</h2>
            <div class="section-content">
                ${criteria.criteriaDescription ? `
                    <h3 class="mb-2">Sign-Off Criteria</h3>
                    <div class="signoff-criteria-box mb-3">
                        <div class="criteria-content">
                            ${criteria.criteriaDescription.split(';').map(item =>
                                `<div class="criteria-item">
                                    <span class="criteria-icon">✓</span>
                                    <span class="criteria-text">${item.trim()}</span>
                                </div>`
                            ).join('')}
                        </div>
                        ${criteria.sourceReference ? `
                            <div class="criteria-source">
                                <strong>Source:</strong> ${criteria.sourceReference}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}

                <h3 class="mb-2">Approvals</h3>
                <div class="signoff-table-container">
                    <table class="signoff-table">
                        <thead>
                            <tr>
                                <th style="width: 20%;">Role</th>
                                <th style="width: 25%;">Name</th>
                                <th style="width: 25%;">Signature</th>
                                <th style="width: 20%;">Date</th>
                                <th style="width: 10%;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${defaultRoles.map((role, index) => {
                                const saved = savedSignOffs.find(s => s.role === role) || {};
                                return `
                                    <tr class="signoff-row" data-role="${role}">
                                        <td class="role-cell">
                                            <strong>${role}</strong>
                                        </td>
                                        <td>
                                            <input type="text"
                                                   class="signoff-input"
                                                   id="name-${index}"
                                                   placeholder="Enter name"
                                                   value="${saved.name || ''}"
                                                   data-field="name">
                                        </td>
                                        <td>
                                            <input type="text"
                                                   class="signoff-input"
                                                   id="signature-${index}"
                                                   placeholder="Enter signature"
                                                   value="${saved.signature || ''}"
                                                   data-field="signature">
                                        </td>
                                        <td>
                                            <input type="date"
                                                   class="signoff-input signoff-date"
                                                   id="date-${index}"
                                                   value="${saved.date || ''}"
                                                   data-field="date">
                                        </td>
                                        <td class="action-cell">
                                            <button class="save-signoff-btn"
                                                    onclick="saveSignOff('${role}', ${index})"
                                                    title="Save">
                                                💾
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="signoff-actions mt-3">
                    <button class="btn-primary" onclick="saveAllSignOffs()">
                        💾 Save All Sign-Offs
                    </button>
                    <button class="btn-secondary" onclick="clearAllSignOffs()">
                        🗑️ Clear All
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ===== Utility Functions =====
function calculateTestSummary(data) {
    const testCases = data.testCases || [];
    const summary = {
        total: testCases.length,
        passed: 0,
        failed: 0,
        blocked: 0,
        skipped: 0
    };

    testCases.forEach(tc => {
        const status = (tc.testStatus?.[0] || '').toLowerCase();
        if (status === 'pass' || status === 'passed') summary.passed++;
        else if (status === 'fail' || status === 'failed') summary.failed++;
        else if (status === 'blocked') summary.blocked++;
        else if (status === 'skip' || status === 'skipped') summary.skipped++;
    });

    return summary;
}

function formatLabel(str) {
    return str
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== Search Functionality =====
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();

    if (searchTerm.length > 0) {
        elements.searchClear.style.display = 'block';
        highlightSearchResults(searchTerm);
    } else {
        elements.searchClear.style.display = 'none';
        clearHighlights();
    }
}

function clearSearch() {
    elements.searchInput.value = '';
    elements.searchClear.style.display = 'none';
    clearHighlights();
}

function highlightSearchResults(searchTerm) {
    clearHighlights();

    const contentBody = elements.contentBody;
    const walker = document.createTreeWalker(
        contentBody,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    const nodesToReplace = [];
    let node;

    while (node = walker.nextNode()) {
        if (node.nodeValue.toLowerCase().includes(searchTerm)) {
            nodesToReplace.push(node);
        }
    }

    nodesToReplace.forEach(node => {
        const parent = node.parentNode;
        if (parent && !parent.classList.contains('highlight')) {
            const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
            const html = node.nodeValue.replace(regex, '<span class="highlight">$1</span>');
            const span = document.createElement('span');
            span.innerHTML = html;
            parent.replaceChild(span, node);
        }
    });
}

function clearHighlights() {
    const highlights = elements.contentBody.querySelectorAll('.highlight');
    highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize();
    });
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ===== Accordion Toggle =====
window.toggleAccordion = function(index) {
    const content = document.getElementById(`accordion-${index}`);
    const header = content.previousElementSibling;

    if (content.classList.contains('active')) {
        content.classList.remove('active');
        header.classList.remove('active');
    } else {
        content.classList.add('active');
        header.classList.add('active');
    }
};

// ===== SQL Accordion Toggle =====
window.toggleSqlAccordion = function(index) {
    const content = document.getElementById(`sql-accordion-${index}`);
    const header = content.previousElementSibling;

    if (content.classList.contains('active')) {
        content.classList.remove('active');
        header.classList.remove('active');
    } else {
        content.classList.add('active');
        header.classList.add('active');
    }
};

// ===== Navigation Toggle for Mobile =====
function toggleNavigation() {
    elements.navigationPanel.classList.toggle('active');
}

// ===== Modal Functions =====
function showError(message) {
    elements.modalBody.innerHTML = `<p>${message}</p>`;
    elements.errorModal.classList.add('active');
}

function closeModal() {
    elements.errorModal.classList.remove('active');
}

// ===== Status Update =====
function updateStatus(status) {
    elements.footerStatus.textContent = status;

    // Update color based on status
    if (status === 'Ready') {
        elements.footerStatus.style.color = 'var(--success-color)';
    } else if (status === 'Loading...') {
        elements.footerStatus.style.color = 'var(--teal-600)';
    } else if (status === 'Error') {
        elements.footerStatus.style.color = 'var(--danger-color)';
    }
}

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        elements.searchInput.focus();
    }

    // Escape to clear search or close modals
    if (e.key === 'Escape') {
        if (elements.testCaseModal.classList.contains('active')) {
            closeTestCaseModal();
        } else if (elements.screenshotModal.classList.contains('active')) {
            closeScreenshotModal();
        } else if (elements.errorModal.classList.contains('active')) {
            closeModal();
        } else if (elements.searchInput.value) {
            clearSearch();
        }
    }

    // Arrow keys for screenshot navigation
    if (elements.screenshotModal.classList.contains('active')) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            navigateScreenshot('prev');
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            navigateScreenshot('next');
        }
    }

    // Ctrl/Cmd + S to save test case modal
    if ((e.ctrlKey || e.metaKey) && e.key === 's' && elements.testCaseModal.classList.contains('active')) {
        e.preventDefault();
        saveTestCaseModal();
    }
});

// ===== Smooth Animations on Load =====
function addLoadAnimations() {
    const cards = document.querySelectorAll('.summary-card, .info-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.05}s`;
    });
}

// ===== IndexedDB Management =====
const DB_NAME = 'RegressionTestDB';
const DB_VERSION = 5;  // Incremented to force recreation of all stores
const STORE_NAME = 'testCaseData';

let db = null;
let dbInitialized = false;

// Initialize IndexedDB
function initDB() {
    // If already initialized and db exists, return it
    if (dbInitialized && db) {
        return Promise.resolve(db);
    }

    return new Promise((resolve, reject) => {
        console.log('Initializing IndexedDB...');
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            dbInitialized = false;
            reject(request.error);
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            dbInitialized = true;
            console.log('IndexedDB opened successfully. Version:', db.version);
            console.log('Available object stores:', Array.from(db.objectStoreNames));

            // Verify all required stores exist
            const requiredStores = [STORE_NAME, 'checklist', 'signoffs', 'defects'];
            const missingStores = requiredStores.filter(store => !db.objectStoreNames.contains(store));

            if (missingStores.length > 0) {
                console.error('Missing object stores:', missingStores);
                dbInitialized = false;
                reject(new Error('Missing required object stores: ' + missingStores.join(', ')));
                return;
            }

            console.log('✅ All required object stores verified');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const upgradeDb = event.target.result;
            const transaction = event.target.transaction;

            console.log('IndexedDB upgrade needed. Current version:', event.oldVersion, 'New version:', event.newVersion);

            // Create all required object stores
            if (!upgradeDb.objectStoreNames.contains(STORE_NAME)) {
                upgradeDb.createObjectStore(STORE_NAME, { keyPath: 'testCaseId' });
                console.log('✅ Created object store:', STORE_NAME);
            }
            if (!upgradeDb.objectStoreNames.contains('checklist')) {
                upgradeDb.createObjectStore('checklist', { keyPath: 'id' });
                console.log('✅ Created object store: checklist');
            }
            if (!upgradeDb.objectStoreNames.contains('signoffs')) {
                upgradeDb.createObjectStore('signoffs', { keyPath: 'role' });
                console.log('✅ Created object store: signoffs');
            }
            if (!upgradeDb.objectStoreNames.contains('defects')) {
                upgradeDb.createObjectStore('defects', { keyPath: 'bugId' });
                console.log('✅ Created object store: defects');
            }
            if (!upgradeDb.objectStoreNames.contains('reportData')) {
                upgradeDb.createObjectStore('reportData', { keyPath: 'id' });
                console.log('✅ Created object store: reportData');
            }

            // Wait for transaction to complete
            transaction.oncomplete = () => {
                console.log('✅ All object stores created - upgrade transaction complete');
            };

            transaction.onerror = () => {
                console.error('❌ Upgrade transaction error:', transaction.error);
                dbInitialized = false;
            };
        };

        request.onblocked = () => {
            console.warn('⚠️ IndexedDB upgrade blocked. Please close other tabs with this application.');
            dbInitialized = false;
            reject(new Error('Database upgrade blocked'));
        };
    });
}

// Get test case data from IndexedDB
async function getTestCaseData(testCaseId) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(testCaseId);

        request.onsuccess = () => {
            const data = request.result || {
                testCaseId,
                status: 'Not Executed',
                screenshots: [],
                actualResult: ''
            };
            resolve(data);
        };

        request.onerror = () => {
            console.error('Error getting data:', request.error);
            resolve({ testCaseId, status: 'Not Executed', screenshots: [], actualResult: '' });
        };
    });
}

// Save test case data to IndexedDB
async function saveTestCaseData(testCaseId, data) {
    if (!db) await initDB();

    return new Promise(async (resolve, reject) => {
        const existingData = await getTestCaseData(testCaseId);
        const mergedData = { ...existingData, ...data, testCaseId };

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(mergedData);

        request.onsuccess = () => {
            resolve(mergedData);
        };

        request.onerror = () => {
            console.error('Error saving data:', request.error);
            reject(request.error);
        };
    });
}

// Save complete report data to IndexedDB
async function saveCompleteReportData(reportData) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction(['reportData'], 'readwrite');
            const store = transaction.objectStore('reportData');

            // Store with a fixed ID so we always overwrite the previous report
            const dataToStore = {
                id: 'currentReport',
                data: reportData,
                timestamp: new Date().toISOString()
            };

            const request = store.put(dataToStore);

            request.onsuccess = () => {
                console.log('✅ Complete report data saved to IndexedDB');
                resolve(dataToStore);
            };

            request.onerror = () => {
                console.error('❌ Error saving complete report data:', request.error);
                reject(request.error);
            };
        } catch (error) {
            console.error('❌ Error in saveCompleteReportData:', error);
            reject(error);
        }
    });
}

// Get complete report data from IndexedDB
async function getCompleteReportData() {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction(['reportData'], 'readonly');
            const store = transaction.objectStore('reportData');
            const request = store.get('currentReport');

            request.onsuccess = () => {
                if (request.result) {
                    console.log('✅ Retrieved complete report data from IndexedDB');
                    resolve(request.result.data);
                } else {
                    console.log('ℹ️ No report data found in IndexedDB');
                    resolve(null);
                }
            };

            request.onerror = () => {
                console.error('❌ Error getting complete report data:', request.error);
                reject(request.error);
            };
        } catch (error) {
            console.error('❌ Error in getCompleteReportData:', error);
            reject(error);
        }
    });
}

// Initialize DB on page load
initDB().catch(err => {
    console.error('Failed to initialize IndexedDB:', err);
    showToast('Failed to initialize storage. Some features may not work.', 'error');
});

// ===== Test Case Status Management =====
window.updateTestCaseStatus = async function(testCaseId, status) {
    // Save to IndexedDB
    await saveTestCaseData(testCaseId, { status });

    // Update dropdown styling
    const dropdown = document.getElementById(`status-${testCaseId}`);
    if (dropdown) {
        // Remove all status classes
        dropdown.classList.remove('status-pass', 'status-fail', 'status-blocked', 'status-not-executed');

        // Add appropriate class based on status
        const statusClass = `status-${status.toLowerCase().replace(' ', '-')}`;
        dropdown.classList.add(statusClass);
    }

    // Reapply filters after status change
    if (typeof applyTestCaseFilters === 'function') {
        applyTestCaseFilters();
    }

    // Show feedback
    showToast(`Status updated to: ${status}`, 'success');
};

// ===== Screenshot Management =====
window.pasteScreenshot = async function(testCaseId) {
    try {
        // Try to read from clipboard
        const clipboardItems = await navigator.clipboard.read();

        for (const clipboardItem of clipboardItems) {
            for (const type of clipboardItem.types) {
                if (type.startsWith('image/')) {
                    const blob = await clipboardItem.getType(type);
                    const reader = new FileReader();

                    reader.onload = async function(e) {
                        // Store original image without compression
                        const imageData = e.target.result;

                        const savedData = await getTestCaseData(testCaseId);
                        const screenshots = savedData.screenshots || [];
                        screenshots.push(imageData);

                        try {
                            await saveTestCaseData(testCaseId, { screenshots });
                            await updateScreenshotsDisplay(testCaseId);
                            showToast('Screenshot pasted successfully!', 'success');
                        } catch (storageErr) {
                            console.error('Storage error:', storageErr);
                            showToast('Failed to save screenshot. Storage may be full.', 'error');
                            screenshots.pop();
                        }
                    };

                    reader.readAsDataURL(blob);
                    return;
                }
            }
        }

        // If no image found in clipboard
        showToast('No image found in clipboard. Please copy an image first.', 'warning');
    } catch (err) {
        console.error('Failed to read clipboard:', err);

        // Fallback: Show file picker if clipboard access fails
        showToast('Clipboard access denied. Opening file picker...', 'info');
        triggerFileUpload(testCaseId);
    }
};

// Fallback file upload method
function triggerFileUpload(testCaseId) {
    // Create a temporary file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = async function(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const savedData = await getTestCaseData(testCaseId);
        const screenshots = savedData.screenshots || [];

        // Convert files to base64 without compression
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = async function(event) {
                    const imageData = event.target.result;
                    screenshots.push(imageData);

                    try {
                        await saveTestCaseData(testCaseId, { screenshots });
                        await updateScreenshotsDisplay(testCaseId);
                        showToast('Screenshot uploaded successfully!', 'success');
                    } catch (storageErr) {
                        console.error('Storage error:', storageErr);
                        showToast('Failed to save screenshot. Storage may be full.', 'error');
                        screenshots.pop();
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    };

    input.click();
}

// Global paste event listener for screenshots
document.addEventListener('paste', async (e) => {
    // Check if we're in a test case row context
    const activeElement = document.activeElement;
    if (activeElement && activeElement.closest('tr[id^="test-case-row-"]')) {
        const row = activeElement.closest('tr[id^="test-case-row-"]');
        const testCaseId = row.id.replace('test-case-row-', '');

        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault();
                const blob = items[i].getAsFile();
                const reader = new FileReader();

                reader.onload = async function(event) {
                    const imageData = event.target.result;

                    const savedData = await getTestCaseData(testCaseId);
                    const screenshots = savedData.screenshots || [];
                    screenshots.push(imageData);

                    try {
                        await saveTestCaseData(testCaseId, { screenshots });
                        await updateScreenshotsDisplay(testCaseId);
                        showToast('Screenshot pasted successfully!', 'success');
                    } catch (storageErr) {
                        console.error('Storage error:', storageErr);
                        showToast('Failed to save screenshot. Storage may be full.', 'error');
                        screenshots.pop();
                    }
                };

                reader.readAsDataURL(blob);
                break;
            }
        }
    }
});

window.deleteScreenshot = async function(testCaseId, index) {
    const savedData = await getTestCaseData(testCaseId);
    const screenshots = savedData.screenshots || [];
    screenshots.splice(index, 1);
    await saveTestCaseData(testCaseId, { screenshots });
    await updateScreenshotsDisplay(testCaseId);
};

// Screenshot viewer state
let currentScreenshotView = {
    testCaseId: null,
    currentIndex: 0,
    totalCount: 0
};

window.viewScreenshot = async function(testCaseId, index) {
    const savedData = await getTestCaseData(testCaseId);
    const screenshots = savedData.screenshots || [];

    if (screenshots[index]) {
        currentScreenshotView.testCaseId = testCaseId;
        currentScreenshotView.currentIndex = index;
        currentScreenshotView.totalCount = screenshots.length;

        await updateScreenshotPreview();
        elements.screenshotModal.classList.add('active');
    }
};

async function updateScreenshotPreview() {
    const { testCaseId, currentIndex, totalCount } = currentScreenshotView;
    const savedData = await getTestCaseData(testCaseId);
    const screenshots = savedData.screenshots || [];

    if (screenshots[currentIndex]) {
        elements.screenshotPreviewImage.src = screenshots[currentIndex];

        // Update title with counter
        const titleElement = document.getElementById('screenshotModalTitle');
        if (titleElement) {
            titleElement.textContent = `Screenshot ${currentIndex + 1} of ${totalCount}`;
        }

        // Show/hide navigation buttons
        const prevBtn = document.getElementById('screenshotPrevBtn');
        const nextBtn = document.getElementById('screenshotNextBtn');

        if (prevBtn) {
            prevBtn.style.display = currentIndex > 0 ? 'flex' : 'none';
        }
        if (nextBtn) {
            nextBtn.style.display = currentIndex < totalCount - 1 ? 'flex' : 'none';
        }
    }
}

function navigateScreenshot(direction) {
    const { currentIndex, totalCount } = currentScreenshotView;

    if (direction === 'prev' && currentIndex > 0) {
        currentScreenshotView.currentIndex--;
        updateScreenshotPreview();
    } else if (direction === 'next' && currentIndex < totalCount - 1) {
        currentScreenshotView.currentIndex++;
        updateScreenshotPreview();
    }
}

async function updateScreenshotsDisplay(testCaseId) {
    const savedData = await getTestCaseData(testCaseId);
    const screenshots = savedData.screenshots || [];
    const container = document.getElementById(`screenshots-${testCaseId}`);

    if (container) {
        container.innerHTML = screenshots.map((img, idx) => `
            <div class="screenshot-mini-thumbnail" onclick="viewScreenshot('${testCaseId}', ${idx})" title="Click to view full size">
                <img src="${img}" alt="Screenshot ${idx + 1}">
                <button class="screenshot-delete-mini" onclick="event.stopPropagation(); deleteScreenshot('${testCaseId}', ${idx})" title="Delete">×</button>
            </div>
        `).join('');
    }
}

// ===== Toast Notification =====
function showToast(message, type = 'info') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// ===== Test Case Modal Management =====
let currentTestCaseId = null;

function showTestCaseModal(testCaseId, title, content) {
    currentTestCaseId = testCaseId;
    elements.testCaseModalTitle.textContent = title;
    elements.testCaseModalBody.innerHTML = content;
    elements.testCaseModal.classList.add('active');
}

async function closeTestCaseModal() {
    // Auto-save actual result before closing
    if (currentTestCaseId) {
        const actualResultInput = document.getElementById('actual-result-input');
        if (actualResultInput) {
            const actualResult = actualResultInput.value.trim();
            await saveTestCaseData(currentTestCaseId, { actualResult });
        }
    }

    elements.testCaseModal.classList.remove('active');
    currentTestCaseId = null;
}

async function saveTestCaseModal() {
    if (currentTestCaseId) {
        const actualResultInput = document.getElementById('actual-result-input');
        if (actualResultInput) {
            const actualResult = actualResultInput.value.trim();
            await saveTestCaseData(currentTestCaseId, { actualResult });

            // Show success feedback
            const saveBtn = elements.testCaseModalSave;
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '✓ Saved!';
            saveBtn.style.background = 'var(--success-color)';

            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.background = '';
            }, 1500);
        }
    }
}

function closeScreenshotModal() {
    elements.screenshotModal.classList.remove('active');
}

// ===== Sign-Off IndexedDB Functions =====
async function loadAllSignOffs() {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        try {
            // Check if object store exists
            if (!db.objectStoreNames.contains('signoffs')) {
                console.log('Signoffs object store does not exist yet');
                resolve([]);
                return;
            }

            const transaction = db.transaction(['signoffs'], 'readonly');
            const store = transaction.objectStore('signoffs');
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                console.error('Error loading sign-offs:', request.error);
                resolve([]);
            };
        } catch (error) {
            console.error('Error in loadAllSignOffs:', error);
            resolve([]);
        }
    });
}

async function saveSignOff(role, index) {
    if (!db) await initDB();

    // Get values from input fields
    const nameInput = document.getElementById(`name-${index}`);
    const signatureInput = document.getElementById(`signature-${index}`);
    const dateInput = document.getElementById(`date-${index}`);

    const signOffData = {
        role: role,
        name: nameInput.value.trim(),
        signature: signatureInput.value.trim(),
        date: dateInput.value
    };

    return new Promise((resolve, reject) => {
        try {
            // Check if object store exists
            if (!db.objectStoreNames.contains('signoffs')) {
                console.error('Signoffs object store does not exist');
                showToast('✗ Error saving sign-off', 'error');
                reject(new Error('Signoffs object store not found'));
                return;
            }

            const transaction = db.transaction(['signoffs'], 'readwrite');
            const store = transaction.objectStore('signoffs');
            const request = store.put(signOffData);

            request.onsuccess = () => {
                console.log('Sign-off saved:', signOffData);
                showToast(`✓ ${role} sign-off saved successfully!`, 'success');
                resolve(signOffData);
            };

            request.onerror = () => {
                console.error('Error saving sign-off:', request.error);
                showToast('✗ Error saving sign-off', 'error');
                reject(request.error);
            };
        } catch (error) {
            console.error('Error in saveSignOff:', error);
            showToast('✗ Error saving sign-off', 'error');
            reject(error);
        }
    });
}

async function saveAllSignOffs() {
    const defaultRoles = [
        'Test Lead',
        'QA Manager',
        'Project Manager',
        'Business Analyst'
    ];

    let savedCount = 0;

    for (let i = 0; i < defaultRoles.length; i++) {
        try {
            await saveSignOff(defaultRoles[i], i);
            savedCount++;
        } catch (error) {
            console.error(`Error saving ${defaultRoles[i]}:`, error);
        }
    }

    showToast(`✓ ${savedCount} sign-offs saved successfully!`, 'success');
}

async function clearAllSignOffs() {
    if (!db) await initDB();

    if (!confirm('Are you sure you want to clear all sign-offs?')) {
        return;
    }

    return new Promise((resolve, reject) => {
        try {
            // Check if object store exists
            if (!db.objectStoreNames.contains('signoffs')) {
                console.error('Signoffs object store does not exist');
                showToast('✗ Error clearing sign-offs', 'error');
                resolve();
                return;
            }

            const transaction = db.transaction(['signoffs'], 'readwrite');
            const store = transaction.objectStore('signoffs');
            const request = store.clear();

            request.onsuccess = () => {
                console.log('All sign-offs cleared');
                showToast('✓ All sign-offs cleared', 'success');

                // Reload the section to show empty inputs
                setTimeout(() => {
                    handleNavClick({ target: { dataset: { section: 'section-10' } } });
                }, 500);

                resolve();
            };

            request.onerror = () => {
                console.error('Error clearing sign-offs:', request.error);
                showToast('✗ Error clearing sign-offs', 'error');
                reject(request.error);
            };
        } catch (error) {
            console.error('Error in clearAllSignOffs:', error);
            showToast('✗ Error clearing sign-offs', 'error');
            resolve();
        }
    });
}

// Make functions globally available
window.saveSignOff = saveSignOff;
window.saveAllSignOffs = saveAllSignOffs;
window.clearAllSignOffs = clearAllSignOffs;

// ===== Defect Management Functions =====
async function loadAllDefects() {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        try {
            // Check if object store exists
            if (!db.objectStoreNames.contains('defects')) {
                console.log('Defects object store does not exist yet');
                resolve([]);
                return;
            }

            const transaction = db.transaction(['defects'], 'readonly');
            const store = transaction.objectStore('defects');
            const request = store.getAll();

            request.onsuccess = () => {
                const defects = request.result || [];
                // Sort by date found (newest first)
                defects.sort((a, b) => new Date(b.dateFound) - new Date(a.dateFound));
                resolve(defects);
            };

            request.onerror = () => {
                console.error('Error loading defects:', request.error);
                resolve([]);
            };
        } catch (error) {
            console.error('Error in loadAllDefects:', error);
            resolve([]);
        }
    });
}

async function saveDefect(defectData) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        try {
            // Check if object store exists
            if (!db.objectStoreNames.contains('defects')) {
                console.error('Defects object store does not exist');
                reject(new Error('Defects object store not found'));
                return;
            }

            const transaction = db.transaction(['defects'], 'readwrite');
            const store = transaction.objectStore('defects');
            const request = store.put(defectData);

            request.onsuccess = () => {
                console.log('Defect saved:', defectData);
                resolve(defectData);
            };

            request.onerror = () => {
                console.error('Error saving defect:', request.error);
                reject(request.error);
            };
        } catch (error) {
            console.error('Error in saveDefect:', error);
            reject(error);
        }
    });
}

async function getDefect(bugId) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        try {
            // Check if object store exists
            if (!db.objectStoreNames.contains('defects')) {
                console.error('Defects object store does not exist');
                resolve(null);
                return;
            }

            const transaction = db.transaction(['defects'], 'readonly');
            const store = transaction.objectStore('defects');
            const request = store.get(bugId);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Error getting defect:', request.error);
                reject(request.error);
            };
        } catch (error) {
            console.error('Error in getDefect:', error);
            resolve(null);
        }
    });
}

async function deleteDefect(bugId) {
    if (!confirm(`Are you sure you want to delete defect ${bugId}?`)) {
        return;
    }

    if (!db) await initDB();

    try {
        // Check if object store exists
        if (!db.objectStoreNames.contains('defects')) {
            console.error('Defects object store does not exist');
            showToast('✗ Error deleting defect', 'error');
            return;
        }

        await new Promise((resolve, reject) => {
            const transaction = db.transaction(['defects'], 'readwrite');
            const store = transaction.objectStore('defects');
            const request = store.delete(bugId);

            request.onsuccess = () => {
                console.log('Defect deleted:', bugId);
                resolve();
            };

            request.onerror = () => {
                console.error('Error deleting defect:', request.error);
                reject(request.error);
            };
        });

        showToast(`✓ Defect ${bugId} deleted successfully`, 'success');

        // Reload the section immediately
        renderSection('section-9');

    } catch (error) {
        console.error('Error in deleteDefect:', error);
        showToast('✗ Error deleting defect', 'error');
    }
}

function openDefectModal(bugId = null) {
    const modal = document.getElementById('defectModal');
    const modalTitle = document.getElementById('defectModalTitle');
    const form = document.getElementById('defectForm');

    if (bugId) {
        // Edit mode
        modalTitle.textContent = 'Edit Defect';
        getDefect(bugId).then(defect => {
            if (defect) {
                document.getElementById('defectBugId').value = defect.bugId;
                document.getElementById('defectBugId').readOnly = true;
                document.getElementById('defectTestCaseId').value = defect.testCaseId;
                document.getElementById('defectTitle').value = defect.title;
                document.getElementById('defectSeverity').value = defect.severity;
                document.getElementById('defectStatus').value = defect.status;
                document.getElementById('defectDateFound').value = defect.dateFound;
                document.getElementById('defectDescription').value = defect.description;
                document.getElementById('defectUrl').value = defect.url || '';
                document.getElementById('defectActionsTaken').value = defect.actionsTaken || '';
            }
        });
    } else {
        // Add mode
        modalTitle.textContent = 'Add New Defect';
        form.reset();
        document.getElementById('defectBugId').readOnly = false;
        // Set default date to today
        document.getElementById('defectDateFound').value = new Date().toISOString().split('T')[0];
    }

    modal.classList.add('active');
}

function closeDefectModal() {
    const modal = document.getElementById('defectModal');
    modal.classList.remove('active');
}

async function submitDefectForm(event) {
    event.preventDefault();

    const defectData = {
        bugId: document.getElementById('defectBugId').value.trim(),
        testCaseId: document.getElementById('defectTestCaseId').value.trim(),
        title: document.getElementById('defectTitle').value.trim(),
        severity: document.getElementById('defectSeverity').value,
        status: document.getElementById('defectStatus').value,
        dateFound: document.getElementById('defectDateFound').value,
        description: document.getElementById('defectDescription').value.trim(),
        url: document.getElementById('defectUrl').value.trim(),
        actionsTaken: document.getElementById('defectActionsTaken').value.trim()
    };

    try {
        await saveDefect(defectData);
        closeDefectModal();
        showToast(`✓ Defect ${defectData.bugId} saved successfully!`, 'success');

        // Reload the defect log section immediately
        renderSection('section-9');
    } catch (error) {
        showToast('✗ Error saving defect', 'error');
        console.error('Error:', error);
    }
}

function viewDefect(bugId) {
    getDefect(bugId).then(defect => {
        if (defect) {
            const modal = document.getElementById('defectViewModal');
            const content = document.getElementById('defectViewContent');

            content.innerHTML = `
                <div class="defect-view-grid">
                    <div class="defect-view-item">
                        <label>Bug ID:</label>
                        <strong>${defect.bugId}</strong>
                    </div>
                    <div class="defect-view-item">
                        <label>Test Case ID:</label>
                        <span>${defect.testCaseId}</span>
                    </div>
                    <div class="defect-view-item">
                        <label>Severity:</label>
                        <span class="severity-badge severity-${(defect.severity || 'medium').toLowerCase()}">${defect.severity}</span>
                    </div>
                    <div class="defect-view-item">
                        <label>Status:</label>
                        <span class="status-badge status-${(defect.status || 'open').toLowerCase()}">${defect.status}</span>
                    </div>
                    <div class="defect-view-item full-width">
                        <label>Title:</label>
                        <span>${defect.title}</span>
                    </div>
                    <div class="defect-view-item">
                        <label>Date Found:</label>
                        <span>${defect.dateFound}</span>
                    </div>
                    ${defect.url ? `
                        <div class="defect-view-item">
                            <label>URL:</label>
                            <a href="${defect.url}" target="_blank" class="defect-link">${defect.url}</a>
                        </div>
                    ` : ''}
                    <div class="defect-view-item full-width">
                        <label>Description:</label>
                        <p class="defect-description">${defect.description}</p>
                    </div>
                    ${defect.actionsTaken ? `
                        <div class="defect-view-item full-width">
                            <label>Actions Taken:</label>
                            <p class="defect-description">${defect.actionsTaken}</p>
                        </div>
                    ` : ''}
                </div>
            `;

            modal.classList.add('active');
        }
    });
}

function closeDefectViewModal() {
    const modal = document.getElementById('defectViewModal');
    modal.classList.remove('active');
}

function editDefect(bugId) {
    openDefectModal(bugId);
}

// ===== Clear All Data Function =====
async function clearAllData() {
    const confirmMessage = `⚠️ WARNING: This will permanently delete ALL stored data including:

• All test case results and statuses
• All screenshots
• All checklist states
• All sign-off data
• All defect logs

This action CANNOT be undone!

Are you sure you want to continue?`;

    if (!confirm(confirmMessage)) {
        return;
    }

    // Double confirmation for safety
    const doubleConfirm = confirm('Are you ABSOLUTELY sure? This will delete everything!');
    if (!doubleConfirm) {
        return;
    }

    try {
        // Clear localStorage
        localStorage.clear();
        console.log('✅ LocalStorage cleared');

        // Close database connection if open
        if (db) {
            db.close();
            db = null;
            dbInitialized = false;
            console.log('✅ Database connection closed');
        }

        // Delete IndexedDB database
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME);

        deleteRequest.onsuccess = () => {
            console.log('✅ IndexedDB deleted successfully');
            showToast('✓ All data cleared successfully!', 'success');

            // Reset UI
            currentData = null;
            elements.contentBody.innerHTML = `
                <div class="welcome-screen">
                    <div class="welcome-icon">🗑️</div>
                    <h3>All Data Cleared</h3>
                    <p>All stored data has been permanently deleted.</p>
                    <p>Upload a JSON file to start fresh.</p>
                </div>
            `;
            elements.contentTitle.textContent = 'Welcome to Regression Testing Report Viewer';
            elements.navMenu.innerHTML = '';
            elements.reportInfo.innerHTML = '<p class="loading-message">Please select a JSON file to load the report</p>';

            // Reinitialize database
            setTimeout(async () => {
                try {
                    await initDB();
                    console.log('✅ Database reinitialized');
                } catch (error) {
                    console.error('Error reinitializing database:', error);
                }
            }, 500);
        };

        deleteRequest.onerror = () => {
            console.error('❌ Error deleting IndexedDB:', deleteRequest.error);
            showToast('✗ Error clearing data', 'error');
        };

        deleteRequest.onblocked = () => {
            console.warn('⚠️ Database deletion blocked. Please close other tabs.');
            showToast('⚠️ Please close other tabs and try again', 'error');
        };

    } catch (error) {
        console.error('❌ Error clearing data:', error);
        showToast('✗ Error clearing data', 'error');
    }
}

// ===== Export Functions =====

/**
 * Export full report to HTML with embedded CSS, data, and JavaScript
 */
async function exportToHTML() {
    if (!currentData) {
        showToast('⚠️ No report loaded. Please upload a report first.', 'warning');
        return;
    }

    try {
        showToast('📦 Preparing standalone HTML export with embedded data...', 'info');

        const reportTitle = currentData.metaData?.module || 'Regression Test Report';

        // Get all test case execution data from IndexedDB
        const testCases = currentData.testCases || [];
        const executionData = {};

        for (const testCase of testCases) {
            const savedData = await getTestCaseData(testCase.testCaseId);
            if (savedData) {
                executionData[testCase.testCaseId] = savedData;
            }
        }

        // Fetch the CSS file content
        let cssContent = '';
        try {
            const cssResponse = await fetch('regression-report.css');
            cssContent = await cssResponse.text();
        } catch (error) {
            console.warn('Could not load CSS file, using default styles');
            cssContent = getDefaultExportCSS();
        }

        // Create complete standalone HTML document with embedded data
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reportTitle} - Full Report Export</title>
    <style>
${cssContent}

        /* Export-specific styles */
        .fab-container { display: none !important; }
        .header-actions { display: none !important; }
        .nav-toggle { display: none !important; }
        .navigation-panel {
            transform: translateX(0) !important;
            position: relative !important;
            width: 280px;
            flex-shrink: 0;
        }
        .main-container { display: flex; }
        .content-panel { margin-left: 0 !important; flex: 1; }

        /* Additional styles for embedded content */
        .styled-list {
            list-style: none;
            padding-left: 0;
        }
        .styled-list li {
            padding: 0.5rem 0;
            padding-left: 1.5rem;
            position: relative;
        }
        .styled-list li:before {
            content: '▸';
            position: absolute;
            left: 0;
            color: #2596be;
            font-weight: bold;
        }
        .mb-2 {
            margin-bottom: 1rem;
        }
        .mb-3 {
            margin-bottom: 1.5rem;
        }
        .text-muted {
            color: #64748b;
        }
        .query-card, .issue-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1.5rem;
            margin: 1rem 0;
        }
        .query-card h4, .issue-card h4 {
            margin-top: 0;
            margin-bottom: 1rem;
            color: #2596be;
        }
        .sql-code {
            background: #1e293b;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
        }
        .checklist-container {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .checklist-item {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            padding: 0.75rem;
            background: #f8fafc;
            border-radius: 6px;
        }
        .checklist-checkbox {
            width: 20px;
            height: 20px;
            margin-top: 2px;
        }
        .checklist-text {
            flex: 1;
            font-size: 0.9375rem;
            line-height: 1.6;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }
        .summary-card {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            padding: 1.5rem;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            text-align: center;
        }
        .summary-label {
            font-size: 0.875rem;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.5rem;
        }
        .summary-value {
            font-size: 2rem;
            font-weight: 700;
            color: #1e293b;
        }
        .summary-card.status-passed .summary-value {
            color: #10b981;
        }
        .summary-card.status-failed .summary-value {
            color: #ef4444;
        }
        .summary-card.status-blocked .summary-value {
            color: #f97316;
        }
        .summary-card.status-not-executed .summary-value {
            color: #64748b;
        }
        .signoff-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin: 2rem 0;
        }
        .signoff-item {
            padding: 1.5rem;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .signoff-label {
            font-size: 0.875rem;
            font-weight: 600;
            color: #64748b;
            margin-bottom: 0.5rem;
        }
        .signoff-value {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 1rem;
        }
        .signoff-signature {
            border-top: 2px solid #2596be;
            margin-top: 2rem;
            padding-top: 0.5rem;
            font-size: 0.75rem;
            color: #64748b;
        }

        @media print {
            .navigation-panel { page-break-after: always; }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="header-content">
            <h1 class="header-title">📊 ${reportTitle} - Full Report</h1>
            <p style="color: white; font-size: 0.9em; margin: 0;">Exported on: ${new Date().toLocaleString()}</p>
        </div>
    </header>

    <div id="app-container">
        <!-- Content will be rendered here by JavaScript -->
    </div>

    <script>
        // Embedded report data
        const EMBEDDED_REPORT_DATA = ${JSON.stringify(currentData, null, 2)};

        // Embedded execution data
        const EMBEDDED_EXECUTION_DATA = ${JSON.stringify(executionData, null, 2)};

        // Current data variable
        let currentData = EMBEDDED_REPORT_DATA;
        let currentSection = null;

        // Initialize the report when DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            console.log('📊 Standalone report loaded successfully');
            console.log('📦 Report data:', currentData);
            console.log('✅ Execution data loaded for', Object.keys(EMBEDDED_EXECUTION_DATA).length, 'test cases');

            renderStandaloneReport();
        });

        // Render the complete standalone report
        function renderStandaloneReport() {
            const appContainer = document.getElementById('app-container');

            const metadata = currentData.metaData || {};
            const testCases = currentData.testCases || [];
            const testScenarios = currentData.testScenarios || [];

            // Build navigation
            const navItems = currentData.tableOfContents || [];
            let navHTML = '';
            navItems.forEach(item => {
                navHTML += \`
                    <a href="#\${item.id}" class="nav-link" data-section="\${item.id}">
                        <span class="nav-icon">\${item.icon || '📄'}</span>
                        <span class="nav-text">\${item.title}</span>
                    </a>
                \`;
            });

            // Build main content
            const mainHTML = \`
                <div class="main-container">
                    <nav class="navigation-panel" id="navigationPanel">
                        <div class="report-info" id="reportInfo">
                            <h3>\${metadata.module || 'Test Report'}</h3>
                            <p><strong>Environment:</strong> \${metadata.environment || 'N/A'}</p>
                            <p><strong>Test Plan ID:</strong> \${metadata.testPlanId || 'N/A'}</p>
                        </div>
                        <div class="nav-menu" id="navMenu">
                            \${navHTML}
                        </div>
                    </nav>

                    <main class="content-panel" id="contentPanel">
                        <div class="content-header">
                            <h2 class="content-title" id="contentTitle">Test Report Overview</h2>
                        </div>
                        <div class="content-body" id="contentBody">
                            <div class="loading-message">Select a section from the navigation menu</div>
                        </div>
                    </main>
                </div>
            \`;

            appContainer.innerHTML = mainHTML;

            // Add navigation click handlers
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const sectionId = this.getAttribute('data-section');
                    renderSection(sectionId);

                    // Update active state
                    navLinks.forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                });
            });

            // Render default section
            if (navItems.length > 0) {
                renderSection(navItems[0].id);
                navLinks[0].classList.add('active');
            }
        }

        // Render a specific section
        function renderSection(sectionId) {
            const contentTitle = document.getElementById('contentTitle');
            const contentBody = document.getElementById('contentBody');

            const navItem = (currentData.tableOfContents || []).find(item => item.id === sectionId);
            if (navItem) {
                contentTitle.textContent = navItem.title;
            }

            let html = '';

            switch(sectionId) {
                case 'overview':
                case 'section-0':
                    html = renderOverview();
                    break;
                case 'test-objective':
                case 'section-1':
                    html = renderTestObjective();
                    break;
                case 'test-prerequisites':
                case 'section-2':
                    html = renderTestPrerequisites();
                    break;
                case 'test-data':
                case 'section-3':
                    html = renderTestData();
                    break;
                case 'test-cases':
                case 'section-4':
                    html = renderTestCases();
                    break;
                case 'database-queries':
                case 'section-5':
                    html = renderDatabaseQueries();
                    break;
                case 'test-execution-checklist':
                case 'section-6':
                    html = renderExecutionChecklist();
                    break;
                case 'known-issues':
                case 'section-7':
                    html = renderKnownIssues();
                    break;
                case 'test-summary':
                case 'section-8':
                    html = renderTestSummary();
                    break;
                case 'defect-log':
                case 'section-9':
                    html = renderDefectLog();
                    break;
                case 'sign-off':
                case 'section-10':
                    html = renderSignOff();
                    break;
                case 'test-scenarios':
                    html = renderTestScenarios();
                    break;
                default:
                    html = '<div class="section"><p>Section content not available</p></div>';
            }

            contentBody.innerHTML = html;
        }

        // Render overview section
        function renderOverview() {
            const metadata = currentData.metaData || {};
            return \`
                <div class="section">
                    <h3>Report Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Module:</span>
                            <span class="info-value">\${metadata.module || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Environment:</span>
                            <span class="info-value">\${metadata.environment || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Test Plan ID:</span>
                            <span class="info-value">\${metadata.testPlanId || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Total Test Cases:</span>
                            <span class="info-value">\${metadata.totalTestCases || 0}</span>
                        </div>
                    </div>
                </div>
            \`;
        }

        // Render test cases section
        function renderTestCases() {
            const testCases = currentData.testCases || [];

            let html = '<div class="section">';
            html += '<h2 class="section-title">🧪 Regression Test Cases</h2>';
            html += '<div class="section-content">';

            if (testCases.length === 0) {
                html += '<p class="text-muted">No test cases available</p>';
            } else {
                html += \`<h3 class="mb-2">Test Cases (\${testCases.length})</h3>\`;
                html += '<div class="table-container">';
                html += '<table><thead><tr>';
                html += '<th>Test Case ID</th><th>Test Case Name</th><th>Priority</th><th>Status</th></tr></thead><tbody>';

                testCases.forEach(tc => {
                    const tcId = tc.testCaseId || '';
                    const tcName = tc.testCaseName || tc.testCaseTitle || '';
                    const priority = Array.isArray(tc.priority) ? tc.priority.join(', ') : (tc.priority || '');
                    const executionData = EMBEDDED_EXECUTION_DATA[tcId] || {};
                    const status = executionData.status || 'Not Executed';

                    html += \`<tr>
                        <td>\${tcId}</td>
                        <td>\${tcName}</td>
                        <td>\${priority}</td>
                        <td><span class="status-badge status-\${status.toLowerCase().replace(' ', '-')}">\${status}</span></td>
                    </tr>\`;
                });

                html += '</tbody></table></div>';
            }

            html += '</div></div>';
            return html;
        }

        // Render test scenarios section
        function renderTestScenarios() {
            const scenarios = currentData.testScenarios || [];

            let html = '<div class="section">';
            html += '<h2 class="section-title">📝 Test Scenarios</h2>';
            html += '<div class="section-content">';

            if (scenarios.length === 0) {
                html += '<p class="text-muted">No test scenarios available</p>';
            } else {
                html += '<div class="table-container">';
                html += '<table><thead><tr>';
                html += '<th>ID</th><th>Name</th><th>Description</th><th>Category</th></tr></thead><tbody>';

                scenarios.forEach(sc => {
                    html += \`<tr>
                        <td>\${sc.testCaseId || sc.scenarioId || ''}</td>
                        <td>\${sc.testCaseName || sc.scenarioTitle || ''}</td>
                        <td>\${sc.description || ''}</td>
                        <td>\${sc.category || sc.module || ''}</td>
                    </tr>\`;
                });

                html += '</tbody></table></div>';
            }

            html += '</div></div>';
            return html;
        }

        // Render test objective section
        function renderTestObjective() {
            const objective = currentData.testObjective || {};
            const objectives = objective.objectives || [];
            const outOfScope = objective.outOfScope || [];

            let html = '<div class="section">';
            html += '<h2 class="section-title">📋 Test Objective</h2>';
            html += '<div class="section-content">';

            if (objective.scope) {
                html += \`<p class="objective-description">\${objective.scope}</p>\`;
            }

            if (objectives.length > 0) {
                html += '<div class="scope-section">';
                html += '<h3>Objectives</h3>';
                html += '<ul class="styled-list">';
                objectives.forEach(obj => {
                    html += \`<li>\${obj}</li>\`;
                });
                html += '</ul></div>';
            }

            if (outOfScope.length > 0) {
                html += '<div class="scope-section">';
                html += '<h3>Out of Scope</h3>';
                html += '<ul class="styled-list">';
                outOfScope.forEach(item => {
                    html += \`<li>\${item}</li>\`;
                });
                html += '</ul></div>';
            }

            html += '</div></div>';
            return html;
        }

        // Render test prerequisites section
        function renderTestPrerequisites() {
            const prereq = currentData.testPrerequisite || {};
            const accessReq = prereq.accessRequirement || {};
            const businessRules = prereq.businessRules || [];
            const testDataReq = prereq.testDataRequirements || [];

            let html = '<div class="section">';
            html += '<h2 class="section-title">🎯 Test Prerequisites</h2>';
            html += '<div class="section-content">';

            if (businessRules.length > 0) {
                html += '<h3 class="mb-2">Business Rules</h3>';
                html += '<ul class="styled-list mb-3">';
                businessRules.forEach(rule => {
                    html += \`<li>\${rule}</li>\`;
                });
                html += '</ul>';
            }

            if (Object.keys(accessReq).length > 0) {
                html += '<h3 class="mb-2">Access Requirements</h3>';
                html += '<div class="info-grid">';
                if (accessReq.environmentAccess) {
                    html += \`<div class="info-card">
                        <div class="info-card-label">Environment Access</div>
                        <div class="info-card-value">\${accessReq.environmentAccess}</div>
                    </div>\`;
                }
                if (accessReq.userRole) {
                    html += \`<div class="info-card">
                        <div class="info-card-label">User Role</div>
                        <div class="info-card-value">\${accessReq.userRole}</div>
                    </div>\`;
                }
                if (accessReq.vpnAccess) {
                    html += \`<div class="info-card">
                        <div class="info-card-label">VPN Access</div>
                        <div class="info-card-value">\${accessReq.vpnAccess}</div>
                    </div>\`;
                }
                if (accessReq.databaseAccess) {
                    html += \`<div class="info-card">
                        <div class="info-card-label">Database Access</div>
                        <div class="info-card-value">\${accessReq.databaseAccess}</div>
                    </div>\`;
                }
                html += '</div>';
            }

            if (testDataReq.length > 0) {
                html += '<h3 class="mb-2">Test Data Requirements</h3>';
                html += '<ul class="styled-list mb-3">';
                testDataReq.forEach(req => {
                    html += \`<li>\${req}</li>\`;
                });
                html += '</ul>';
            }

            html += '</div></div>';
            return html;
        }

        // Render test data section
        function renderTestData() {
            const testData = currentData.testData || {};
            const members = testData.members || [];

            let html = '<div class="section">';
            html += '<h2 class="section-title">📊 Test Data</h2>';
            html += '<div class="section-content">';

            if (members.length === 0) {
                html += '<p class="text-muted">No test data available</p>';
            } else {
                html += '<div class="table-container">';
                html += '<table><thead><tr>';
                html += '<th>Member ID</th><th>Name</th><th>NI Number</th><th>DOB</th><th>Status</th></tr></thead><tbody>';

                members.forEach(member => {
                    const fullName = \`\${member.firstName || ''} \${member.lastName || ''}\`.trim();
                    html += \`<tr>
                        <td>\${member.memberId || ''}</td>
                        <td>\${fullName}</td>
                        <td>\${member.niNumber || ''}</td>
                        <td>\${member.dateOfBirth || ''}</td>
                        <td>\${member.status || ''}</td>
                    </tr>\`;
                });

                html += '</tbody></table></div>';
            }

            html += '</div></div>';
            return html;
        }

        // Render database queries section
        function renderDatabaseQueries() {
            const queries = currentData.databaseQueries || [];

            let html = '<div class="section">';
            html += '<h2 class="section-title">🗄️ Database Queries</h2>';
            html += '<div class="section-content">';

            if (queries.length === 0) {
                html += '<p class="text-muted">No database queries available</p>';
            } else {
                queries.forEach(query => {
                    html += \`
                        <div class="query-card">
                            <h4>\${query.queryId || ''}: \${query.description || ''}</h4>
                            <pre class="sql-code">\${query.sqlScript || ''}</pre>
                        </div>
                    \`;
                });
            }

            html += '</div></div>';
            return html;
        }

        // Render execution checklist section
        function renderExecutionChecklist() {
            const checklist = currentData.executionChecklist || [];

            let html = '<div class="section">';
            html += '<h2 class="section-title">✅ Test Execution Checklist</h2>';
            html += '<div class="section-content">';

            if (checklist.length === 0) {
                html += '<p class="text-muted">No execution checklist available</p>';
            } else {
                html += '<div class="checklist-container">';
                checklist.forEach(item => {
                    html += \`<div class="checklist-item">
                        <input type="checkbox" class="checklist-checkbox" disabled>
                        <span class="checklist-text">\${item}</span>
                    </div>\`;
                });
                html += '</div>';
            }

            html += '</div></div>';
            return html;
        }

        // Render known issues section
        function renderKnownIssues() {
            const issues = currentData.knownIssues || [];

            let html = '<div class="section">';
            html += '<h2 class="section-title">⚠️ Known Issues & Notes</h2>';
            html += '<div class="section-content">';

            if (issues.length === 0) {
                html += '<p class="text-muted">No known issues</p>';
            } else {
                issues.forEach(issue => {
                    html += \`
                        <div class="issue-card">
                            <h4>\${issue.title || 'Issue'}</h4>
                            <p>\${issue.description || ''}</p>
                            <p><strong>Workaround:</strong> \${issue.workaround || 'None'}</p>
                        </div>
                    \`;
                });
            }

            html += '</div></div>';
            return html;
        }

        // Render test summary section
        function renderTestSummary() {
            const testCases = currentData.testCases || [];
            const summary = {
                total: testCases.length,
                passed: 0,
                failed: 0,
                blocked: 0,
                notExecuted: 0
            };

            testCases.forEach(tc => {
                const executionData = EMBEDDED_EXECUTION_DATA[tc.testCaseId] || {};
                const status = executionData.status || 'Not Executed';
                if (status === 'Passed') summary.passed++;
                else if (status === 'Failed') summary.failed++;
                else if (status === 'Blocked') summary.blocked++;
                else summary.notExecuted++;
            });

            let html = '<div class="section">';
            html += '<h2 class="section-title">📈 Test Summary</h2>';
            html += '<div class="section-content">';
            html += '<div class="summary-grid">';
            html += \`
                <div class="summary-card">
                    <div class="summary-label">Total Test Cases</div>
                    <div class="summary-value">\${summary.total}</div>
                </div>
                <div class="summary-card status-passed">
                    <div class="summary-label">Passed</div>
                    <div class="summary-value">\${summary.passed}</div>
                </div>
                <div class="summary-card status-failed">
                    <div class="summary-label">Failed</div>
                    <div class="summary-value">\${summary.failed}</div>
                </div>
                <div class="summary-card status-blocked">
                    <div class="summary-label">Blocked</div>
                    <div class="summary-value">\${summary.blocked}</div>
                </div>
                <div class="summary-card status-not-executed">
                    <div class="summary-label">Not Executed</div>
                    <div class="summary-value">\${summary.notExecuted}</div>
                </div>
            \`;
            html += '</div></div></div>';
            return html;
        }

        // Render defect log section
        function renderDefectLog() {
            const defects = [];
            Object.values(EMBEDDED_EXECUTION_DATA).forEach(data => {
                if (data.defects && data.defects.length > 0) {
                    defects.push(...data.defects);
                }
            });

            let html = '<div class="section">';
            html += '<h2 class="section-title">🐛 Defect Log</h2>';
            html += '<div class="section-content">';

            if (defects.length === 0) {
                html += '<p class="text-muted">No defects logged</p>';
            } else {
                html += '<div class="table-container">';
                html += '<table><thead><tr>';
                html += '<th>Defect ID</th><th>Description</th><th>Severity</th><th>Status</th></tr></thead><tbody>';

                defects.forEach(defect => {
                    html += \`<tr>
                        <td>\${defect.defectId || ''}</td>
                        <td>\${defect.description || ''}</td>
                        <td>\${defect.severity || ''}</td>
                        <td>\${defect.status || ''}</td>
                    </tr>\`;
                });

                html += '</tbody></table></div>';
            }

            html += '</div></div>';
            return html;
        }

        // Render sign-off section
        function renderSignOff() {
            const signOff = currentData.signOff || {};

            let html = '<div class="section">';
            html += '<h2 class="section-title">✍️ Sign-Off</h2>';
            html += '<div class="section-content">';
            html += '<div class="signoff-grid">';
            html += \`
                <div class="signoff-item">
                    <div class="signoff-label">Prepared By:</div>
                    <div class="signoff-value">\${signOff.preparedBy || ''}</div>
                    <div class="signoff-signature"></div>
                </div>
                <div class="signoff-item">
                    <div class="signoff-label">Reviewed By:</div>
                    <div class="signoff-value">\${signOff.reviewedBy || ''}</div>
                    <div class="signoff-signature"></div>
                </div>
                <div class="signoff-item">
                    <div class="signoff-label">Approved By:</div>
                    <div class="signoff-value">\${signOff.approvedBy || ''}</div>
                    <div class="signoff-signature"></div>
                </div>
                <div class="signoff-item">
                    <div class="signoff-label">Date:</div>
                    <div class="signoff-value">\${signOff.date || new Date().toLocaleDateString()}</div>
                </div>
            \`;
            html += '</div></div></div>';
            return html;
        }
    </script>
</body>
</html>`;

        // Create blob and download
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Clean filename
        const cleanTitle = reportTitle.replace(/\s+/g, '-').replace(/-+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `${cleanTitle}-Full-Report-${dateStr}.html`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('✓ Standalone HTML report exported successfully! Open it directly in any browser.', 'success');
        console.log('✅ Standalone HTML report exported with embedded data and CSS');
        console.log(`📦 Embedded ${testCases.length} test cases with execution data`);
    } catch (error) {
        console.error('❌ Error exporting to HTML:', error);
        showToast('✗ Error exporting to HTML: ' + error.message, 'error');
    }
}

/**
 * Get default CSS for export if CSS file cannot be loaded
 */
function getDefaultExportCSS() {
    return `
        :root {
            --primary-color: #2596be;
            --text-primary: #1e293b;
            --text-secondary: #64748b;
            --bg-secondary: #f8fafc;
            --border-color: #e2e8f0;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
               font-size: 16px; line-height: 1.6; color: var(--text-primary); background: #fff; }
        .header { background: linear-gradient(135deg, #2596be, #1a7a9e); color: white; padding: 1.5rem; }
        .header-title { font-size: 1.75rem; margin: 0; }
        .main-container { display: flex; gap: 2rem; padding: 2rem; }
        .navigation-panel { width: 320px; background: white; border-radius: 8px; padding: 1.5rem; }
        .content-panel { flex: 1; background: white; border-radius: 8px; padding: 2rem; }
        h1, h2, h3 { color: var(--primary-color); margin: 1.5rem 0 1rem; }
        table { border-collapse: collapse; width: 100%; margin: 1.5rem 0; }
        th, td { border: 1px solid var(--border-color); padding: 12px; text-align: left; }
        th { background-color: var(--primary-color); color: white; font-weight: 600; }
        tr:nth-child(even) { background-color: var(--bg-secondary); }
        .section { margin: 2rem 0; padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 8px; }
        .card { background: white; border-radius: 8px; padding: 1.5rem; margin: 1rem 0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    `;
}

/**
 * Export full report to PDF
 */
async function exportToPDF() {
    if (!currentData) {
        showToast('⚠️ No report loaded. Please upload a report first.', 'warning');
        return;
    }

    try {
        showToast('📄 Preparing PDF export...', 'info');

        const reportTitle = currentData.metaData?.module || 'Regression Test Report';
        const navigationPanel = document.getElementById('navigationPanel');
        const contentPanel = document.getElementById('contentPanel');

        // Fetch the CSS file content
        let cssContent = '';
        try {
            const cssResponse = await fetch('regression-report.css');
            cssContent = await cssResponse.text();
        } catch (error) {
            console.warn('Could not load CSS file, using inline styles');
        }

        // Create a temporary window for PDF generation
        const printWindow = window.open('', '_blank');

        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reportTitle} - PDF Export</title>
    <style>
${cssContent || getDefaultExportCSS()}

        /* PDF-specific styles */
        @page { size: A4; margin: 1cm; }
        .fab-container { display: none !important; }
        .header-actions { display: none !important; }
        .nav-toggle { display: none !important; }
        .navigation-panel {
            transform: translateX(0) !important;
            position: relative !important;
            page-break-after: always;
        }
        .main-container { display: block; }
        .content-panel { margin-left: 0 !important; }
        .section { page-break-inside: avoid; }
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        @media print {
            body { background: white; }
            .navigation-panel { page-break-after: always; }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="header-content">
            <h1 class="header-title">📊 ${reportTitle} - Full Report</h1>
            <p style="color: white; font-size: 0.9em; margin: 0;">Generated on: ${new Date().toLocaleString()}</p>
        </div>
    </header>

    <div class="main-container">
        ${navigationPanel.outerHTML}
        ${contentPanel.outerHTML}
    </div>

    <script>
        // Auto-print when loaded
        window.addEventListener('load', function() {
            // Expand all collapsible sections
            const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
            collapsibleHeaders.forEach(header => {
                const content = header.nextElementSibling;
                if (content && content.classList.contains('collapsible-content')) {
                    content.style.display = 'block';
                    header.classList.add('active');
                }
            });

            // Trigger print dialog
            setTimeout(function() {
                window.print();
            }, 500);
        });
    </script>
</body>
</html>`;

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        showToast('✓ PDF print dialog opened. Save as PDF from the print dialog.', 'success');
        console.log('✅ PDF export window opened');
    } catch (error) {
        console.error('❌ Error exporting to PDF:', error);
        showToast('✗ Error exporting to PDF', 'error');
    }
}

// ===== Excel Export Helper Functions =====

/**
 * Create Basic Info sheet data
 */
function createBasicInfoSheet() {
    const data = [];
    const metaData = currentData.metaData || {};
    const envSetup = currentData.environmentSetup || {};
    const prereq = currentData.testPrerequisite || {};
    const accessReq = currentData.accessRequirements || {};

    // Header
    data.push(['TEST REPORT - BASIC INFORMATION']);
    data.push([]);

    // Metadata section
    data.push(['REPORT METADATA', '']);
    data.push(['Module Name', metaData.module || 'N/A']);
    data.push(['Module Full Name', metaData.moduleName || 'N/A']);
    data.push(['Test Plan ID', metaData.testPlanId || 'N/A']);
    data.push(['Application Level', metaData.appLevelFullName || 'N/A']);
    data.push(['Environment', metaData.environment || 'N/A']);
    data.push(['User Guide Reference', metaData.userGuideReference || 'N/A']);
    data.push(['Report Date', metaData.reportDate || 'N/A']);
    data.push(['Report Version', metaData.reportVersion || 'N/A']);
    data.push(['Created By', metaData.createdBy || 'N/A']);
    data.push(['Created Date', metaData.createdDate || 'N/A']);
    data.push(['Total Test Cases', metaData.totalTestCases || 0]);
    data.push([]);

    // Environment Setup
    data.push(['ENVIRONMENT SETUP', '']);
    if (envSetup.database) {
        data.push(['Database Name', envSetup.database.name || 'N/A']);
        data.push(['Database Server', envSetup.database.server || 'N/A']);
        data.push(['Database Type', envSetup.database.type || 'N/A']);
    }
    if (envSetup.application) {
        data.push(['Application URL', envSetup.application.url || 'N/A']);
        data.push(['Application Version', envSetup.application.version || 'N/A']);
    }
    if (envSetup.tools && envSetup.tools.length > 0) {
        data.push(['Tools Used', envSetup.tools.join(', ')]);
    }
    data.push([]);

    // Test Prerequisites
    data.push(['TEST PREREQUISITES', '']);
    data.push(['Database Access', prereq.databaseAccess || 'N/A']);
    data.push(['Application Access', prereq.applicationAccess || 'N/A']);
    data.push(['Test Data', prereq.testData || 'N/A']);
    data.push([]);

    // Access Requirements
    data.push(['ACCESS REQUIREMENTS', '']);
    data.push(['User Role', accessReq.userRole || 'N/A']);
    data.push(['Permissions', accessReq.permissions || 'N/A']);
    data.push(['Special Access', accessReq.specialAccess || 'N/A']);
    data.push([]);

    data.push(['Export Date', new Date().toLocaleString()]);

    return data;
}

/**
 * Create Test Scenarios sheet
 */
async function createTestScenariosSheet() {
    const scenarios = currentData.testScenarios || [];

    if (scenarios.length === 0) {
        const data = [
            ['TEST SCENARIOS'],
            [],
            ['No test scenarios available in this report']
        ];
        return XLSX.utils.aoa_to_sheet(data);
    }

    const data = [];

    // Headers
    data.push([
        'Test Case ID',
        'Test Case Name',
        'Module',
        'Location',
        'Priority',
        'Source',
        'Test Steps',
        'Expected Result'
    ]);

    // Scenario data
    scenarios.forEach(scenario => {
        // Handle priority - could be array or string
        const priority = Array.isArray(scenario.priority)
            ? scenario.priority.join(', ')
            : (scenario.priority || '');

        // Handle source - could be array or string
        const source = Array.isArray(scenario.source)
            ? scenario.source.join(', ')
            : (scenario.source || '');

        // Handle test steps - could be array or string
        const testSteps = Array.isArray(scenario.testSteps)
            ? scenario.testSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')
            : (scenario.testSteps || '');

        data.push([
            scenario.testCaseId || '',
            scenario.testCaseName || scenario.scenarioTitle || '',
            scenario.module || '',
            scenario.location || '',
            priority,
            source,
            testSteps,
            scenario.expectedResult || ''
        ]);
    });

    const sheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    sheet['!cols'] = [
        { wch: 15 },
        { wch: 45 },
        { wch: 25 },
        { wch: 30 },
        { wch: 12 },
        { wch: 15 },
        { wch: 50 },
        { wch: 50 }
    ];

    return sheet;
}

/**
 * Create Test Cases sheet with current status
 */
async function createTestCasesSheet() {
    const testCases = currentData.testCases || [];

    if (testCases.length === 0) {
        const data = [
            ['TEST CASES'],
            [],
            ['No test cases available in this report']
        ];
        return XLSX.utils.aoa_to_sheet(data);
    }

    const data = [];

    // Headers
    data.push([
        'Test Case ID',
        'Test Case Name',
        'Module',
        'Location',
        'Priority',
        'Source',
        'Test Steps',
        'Expected Result',
        'Current Status',
        'Actual Result'
    ]);

    // Collect test case data with current status from IndexedDB
    for (const testCase of testCases) {
        const savedData = await getTestCaseData(testCase.testCaseId);
        const currentStatus = savedData?.status || 'Not Executed';
        const actualResult = savedData?.actualResult || '';

        // Handle priority - could be array or string
        const priority = Array.isArray(testCase.priority)
            ? testCase.priority.join(', ')
            : (testCase.priority || '');

        // Handle source - could be array or string
        const source = Array.isArray(testCase.source)
            ? testCase.source.join(', ')
            : (testCase.source || '');

        // Handle test steps - could be array or string
        const testSteps = Array.isArray(testCase.testSteps)
            ? testCase.testSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')
            : (testCase.testSteps || '');

        data.push([
            testCase.testCaseId || '',
            testCase.testCaseName || testCase.testCaseTitle || '',
            testCase.module || '',
            testCase.location || '',
            priority,
            source,
            testSteps,
            testCase.expectedResult || '',
            currentStatus,
            actualResult
        ]);
    }

    const sheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    sheet['!cols'] = [
        { wch: 15 },
        { wch: 45 },
        { wch: 25 },
        { wch: 30 },
        { wch: 12 },
        { wch: 15 },
        { wch: 50 },
        { wch: 50 },
        { wch: 15 },
        { wch: 50 }
    ];

    return sheet;
}

/**
 * Create Test Summary Report sheet
 */
async function createTestSummarySheet() {
    const testCases = currentData.testCases || [];
    const data = [];

    // Header
    data.push(['TEST SUMMARY REPORT']);
    data.push([]);

    // Status distribution
    data.push(['TEST STATUS DISTRIBUTION']);
    data.push(['Status', 'Count', 'Percentage']);

    const statusCounts = {
        'Not Executed': 0,
        'Pass': 0,
        'Fail': 0,
        'Blocked': 0,
        'Skip': 0
    };

    // Count statuses from IndexedDB
    for (const testCase of testCases) {
        const savedData = await getTestCaseData(testCase.testCaseId);
        const status = savedData?.status || 'Not Executed';
        if (statusCounts.hasOwnProperty(status)) {
            statusCounts[status]++;
        }
    }

    const total = testCases.length;
    Object.entries(statusCounts).forEach(([status, count]) => {
        const percentage = total > 0 ? ((count / total) * 100).toFixed(2) : 0;
        data.push([status, count, `${percentage}%`]);
    });

    data.push(['TOTAL', total, '100%']);
    data.push([]);

    // Priority distribution
    data.push(['TEST EXECUTION BY PRIORITY']);
    data.push(['Priority', 'Total', 'Executed', 'Pass', 'Fail', 'Blocked', 'Skip']);

    const priorityCounts = {
        'High': { total: 0, executed: 0, pass: 0, fail: 0, blocked: 0, skip: 0 },
        'Medium': { total: 0, executed: 0, pass: 0, fail: 0, blocked: 0, skip: 0 },
        'Low': { total: 0, executed: 0, pass: 0, fail: 0, blocked: 0, skip: 0 }
    };

    for (const testCase of testCases) {
        const priority = testCase.priority || 'Medium';
        if (priorityCounts[priority]) {
            priorityCounts[priority].total++;

            const savedData = await getTestCaseData(testCase.testCaseId);
            const status = savedData?.status || 'Not Executed';

            if (status !== 'Not Executed') {
                priorityCounts[priority].executed++;
            }
            if (status === 'Pass') priorityCounts[priority].pass++;
            if (status === 'Fail') priorityCounts[priority].fail++;
            if (status === 'Blocked') priorityCounts[priority].blocked++;
            if (status === 'Skip') priorityCounts[priority].skip++;
        }
    }

    Object.entries(priorityCounts).forEach(([priority, counts]) => {
        data.push([
            priority,
            counts.total,
            counts.executed,
            counts.pass,
            counts.fail,
            counts.blocked,
            counts.skip
        ]);
    });

    data.push([]);
    data.push(['Report Generated', new Date().toLocaleString()]);

    const sheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    sheet['!cols'] = [
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 }
    ];

    return sheet;
}

/**
 * Create Defects sheet
 */
async function createDefectsSheet() {
    const data = [];

    // Try to get defects from IndexedDB
    let defects = [];
    try {
        // Get all test cases and collect their defects
        const testCases = currentData.testCases || [];
        for (const testCase of testCases) {
            const savedData = await getTestCaseData(testCase.testCaseId);
            if (savedData?.defects && Array.isArray(savedData.defects)) {
                defects.push(...savedData.defects.map(d => ({
                    ...d,
                    testCaseId: testCase.testCaseId
                })));
            }
        }
    } catch (error) {
        console.warn('Could not retrieve defects:', error);
    }

    if (defects.length === 0) {
        data.push(['DEFECTS LOG']);
        data.push([]);
        data.push(['No defects logged in this test execution']);

        const sheet = XLSX.utils.aoa_to_sheet(data);
        return sheet;
    }

    // Headers
    data.push([
        'Defect ID',
        'Title',
        'Severity',
        'Status',
        'Description',
        'Test Case ID',
        'Reported Date',
        'Reported By'
    ]);

    // Defect data
    defects.forEach(defect => {
        data.push([
            defect.defectId || '',
            defect.title || '',
            defect.severity || '',
            defect.status || 'Open',
            defect.description || '',
            defect.testCaseId || '',
            defect.reportedDate || new Date().toLocaleDateString(),
            defect.reportedBy || currentData.metaData?.createdBy || ''
        ]);
    });

    const sheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    sheet['!cols'] = [
        { wch: 15 },
        { wch: 35 },
        { wch: 12 },
        { wch: 12 },
        { wch: 50 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 }
    ];

    return sheet;
}

/**
 * Create Sign Off sheet
 */
function createSignOffSheet() {
    const metaData = currentData.metaData || {};
    const data = [];

    // Header
    data.push(['TEST EXECUTION SIGN OFF SHEET']);
    data.push([]);

    // Report Information
    data.push(['REPORT INFORMATION']);
    data.push(['Module Name', metaData.module || 'N/A']);
    data.push(['Test Plan ID', metaData.testPlanId || 'N/A']);
    data.push(['Environment', metaData.environment || 'N/A']);
    data.push(['Report Prepared By', metaData.createdBy || 'N/A']);
    data.push(['Report Date', metaData.reportDate || 'N/A']);
    data.push(['Export Date', new Date().toLocaleString()]);
    data.push([]);

    // Tester Sign Off
    data.push(['TESTER SIGN OFF']);
    data.push(['Name', '']);
    data.push(['Signature', '']);
    data.push(['Date', '']);
    data.push([]);

    // Test Lead Sign Off
    data.push(['TEST LEAD SIGN OFF']);
    data.push(['Name', '']);
    data.push(['Signature', '']);
    data.push(['Date', '']);
    data.push([]);

    // Project Manager Sign Off
    data.push(['PROJECT MANAGER SIGN OFF']);
    data.push(['Name', '']);
    data.push(['Signature', '']);
    data.push(['Date', '']);
    data.push([]);

    // Notes
    data.push(['NOTES / COMMENTS']);
    data.push(['']);
    data.push(['']);
    data.push(['']);

    const sheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    sheet['!cols'] = [
        { wch: 30 },
        { wch: 50 }
    ];

    return sheet;
}

/**
 * Export comprehensive test report to Excel (XLSX format)
 */
async function exportToExcel() {
    if (!currentData) {
        showToast('⚠️ No report loaded. Please upload a report first.', 'warning');
        return;
    }

    // Check if XLSX library is loaded
    if (typeof XLSX === 'undefined') {
        showToast('✗ Excel library not loaded. Please refresh the page.', 'error');
        console.error('XLSX library not found');
        return;
    }

    try {
        showToast('📊 Preparing Excel export with multiple sheets...', 'info');

        const workbook = XLSX.utils.book_new();
        const reportTitle = currentData.metaData?.module || 'Test Report';

        // ===== SHEET 1: Basic Info =====
        const basicInfoData = createBasicInfoSheet();
        const basicInfoSheet = XLSX.utils.aoa_to_sheet(basicInfoData);

        // Set column widths for Basic Info
        basicInfoSheet['!cols'] = [
            { wch: 30 },
            { wch: 50 }
        ];

        XLSX.utils.book_append_sheet(workbook, basicInfoSheet, 'Basic Info');
        console.log('✅ Sheet 1: Basic Info created');

        // ===== SHEET 2: Test Scenarios =====
        const scenariosSheet = await createTestScenariosSheet();
        XLSX.utils.book_append_sheet(workbook, scenariosSheet, 'Test Scenarios');
        console.log('✅ Sheet 2: Test Scenarios created');

        // ===== SHEET 3: Test Cases =====
        const testCasesSheet = await createTestCasesSheet();
        XLSX.utils.book_append_sheet(workbook, testCasesSheet, 'Test Cases');
        console.log('✅ Sheet 3: Test Cases created');

        // ===== SHEET 4: Test Summary Report =====
        const summarySheet = await createTestSummarySheet();
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Test Summary Report');
        console.log('✅ Sheet 4: Test Summary Report created');

        // ===== SHEET 5: Defects =====
        const defectsSheet = await createDefectsSheet();
        XLSX.utils.book_append_sheet(workbook, defectsSheet, 'Defects');
        console.log('✅ Sheet 5: Defects created');

        // ===== SHEET 6: Sign Off =====
        const signOffSheet = createSignOffSheet();
        XLSX.utils.book_append_sheet(workbook, signOffSheet, 'Sign Off');
        console.log('✅ Sheet 6: Sign Off created');

        // Generate Excel file with clean filename
        const cleanTitle = reportTitle.replace(/\s+/g, '-').replace(/-+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `${cleanTitle}-Full-Report-${dateStr}.xlsx`;

        console.log(`📊 Generating Excel file: ${fileName}`);

        // Write the Excel file with proper options
        XLSX.writeFile(workbook, fileName, {
            bookType: 'xlsx',
            type: 'binary',
            compression: true
        });

        showToast('✓ Excel report exported successfully with 6 sheets!', 'success');
        console.log(`✅ Excel report exported: ${fileName}`);
    } catch (error) {
        console.error('❌ Error exporting to Excel:', error);
        showToast('✗ Error exporting to Excel: ' + error.message, 'error');
    }
}

// Make functions globally available
window.openDefectModal = openDefectModal;
window.closeDefectModal = closeDefectModal;
window.submitDefectForm = submitDefectForm;
window.viewDefect = viewDefect;
window.closeDefectViewModal = closeDefectViewModal;
window.editDefect = editDefect;
window.deleteDefect = deleteDefect;
window.clearAllData = clearAllData;
window.exportToHTML = exportToHTML;
window.exportToPDF = exportToPDF;
window.exportToExcel = exportToExcel;

