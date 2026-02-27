# Software Requirements Specification (SRS)
## Regression Testing Report Viewer - Next.js Migration

**Document Version:** 1.0  
**Date:** February 26, 2026  
**Project:** Migration from HTML/JavaScript to Next.js Application  
**Status:** Draft for Review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Functional Requirements](#3-functional-requirements)
4. [Technical Architecture](#4-technical-architecture)
5. [UI/UX Specifications](#5-uiux-specifications)
6. [Data Models & Schema](#6-data-models--schema)
7. [API Specifications](#7-api-specifications)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Testing Requirements](#9-testing-requirements)
10. [Deployment Guidelines](#10-deployment-guidelines)
11. [Appendices](#11-appendices)

---

## 1. Executive Summary

### 1.1 Purpose
This document specifies the requirements for migrating the existing Regression Testing Report Viewer from a static HTML/JavaScript application to a modern Next.js application. The migration aims to improve maintainability, scalability, and developer experience while preserving all existing functionality.

### 1.2 Scope
The Next.js application will replicate 100% of the current functionality including:
- Interactive test report viewing and navigation
- JSON data file upload and parsing
- Test case execution tracking with status management
- Screenshot capture and management
- Defect logging and tracking
- Pre/post execution checklist management
- Multi-format export (HTML, PDF, Excel)
- Search and filter capabilities
- Sign-off workflow with data persistence

### 1.3 Stakeholders
- **QA Engineers**: Primary users who execute tests and generate reports
- **Test Managers**: Review test results and approve sign-offs
- **Development Team**: Maintain and enhance the application
- **Project Managers**: Track testing progress and metrics

### 1.4 Success Criteria
- ✅ All existing features migrated without loss of functionality
- ✅ Improved performance (< 2s initial load time)
- ✅ Modern, maintainable codebase with TypeScript
- ✅ Responsive design working on mobile, tablet, and desktop
- ✅ Backward compatibility with existing JSON data files
- ✅ Enhanced developer experience with hot reload and component isolation

---

## 2. System Overview

### 2.1 Current System Architecture
**Technology Stack:**
- Pure HTML5, CSS3, JavaScript (ES6 Modules)
- IndexedDB for client-side data persistence
- SheetJS (XLSX) for Excel export
- Browser Print API for PDF generation
- No backend server required

**Key Characteristics:**
- Fully client-side application
- No authentication/authorization
- Local file system access for JSON uploads
- Data stored in browser IndexedDB
- Standalone HTML export capability

### 2.2 Target System Architecture
**Technology Stack:**
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS + CSS Modules
- **State Management**: React Context API + Zustand
- **Data Persistence**: IndexedDB (via idb library)
- **Export Libraries**: 
  - SheetJS (XLSX) for Excel
  - jsPDF + html2canvas for PDF
- **UI Components**: Headless UI + Custom Components
- **Icons**: Lucide React
- **File Upload**: react-dropzone
- **Charts**: Recharts (for test summary visualization)

**Deployment Options:**
- Static export (next export) for client-side only deployment
- Vercel/Netlify for serverless deployment
- Self-hosted on any static file server

### 2.3 System Context Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                     User's Browser                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │          Next.js Application (Client-Side)            │  │
│  │                                                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │   UI     │  │  State   │  │  Export  │           │  │
│  │  │Components│◄─┤Management│─►│ Services │           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  │       │             │              │                 │  │
│  │       └─────────────┼──────────────┘                 │  │
│  │                     ▼                                │  │
│  │              ┌──────────────┐                        │  │
│  │              │  IndexedDB   │                        │  │
│  │              │  (idb lib)   │                        │  │
│  │              └──────────────┘                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│              ┌──────────────────────┐                       │
│              │  Local File System   │                       │
│              │  (JSON Upload/Export)│                       │
│              └──────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Functional Requirements

### 3.1 File Upload & Data Management

#### FR-1.1: JSON File Upload
**Priority**: Critical  
**User Story**: As a QA engineer, I want to upload a JSON test data file so that I can view and interact with test reports.

**Acceptance Criteria:**
- ✅ Support drag-and-drop file upload
- ✅ Support click-to-browse file selection
- ✅ Validate JSON file format before parsing
- ✅ Display upload progress indicator
- ✅ Show detailed error messages for invalid files
- ✅ Support files up to 50MB
- ✅ Parse and validate JSON schema
- ✅ Load external referenced files (test cases, scenarios, SQL scripts)
- ✅ Display success message with loaded resource summary

**Technical Details:**
- Use `react-dropzone` for file upload UI
- Implement JSON schema validation using Zod or Yup
- Store parsed data in Zustand store
- Persist to IndexedDB for offline access

#### FR-1.2: External File Loading
**Priority**: Critical
**User Story**: As a QA engineer, I want the system to automatically load referenced external files so that I can view complete test data.

**Acceptance Criteria:**
- ✅ Load test cases from external JSON file (referenced by `testCasesFile`)
- ✅ Load test scenarios from external JSON file (referenced by `testScenariosFile`)
- ✅ Load SQL scripts from module-specific JavaScript file
- ✅ Load table of contents from fallback file if not in main JSON
- ✅ Handle missing external files gracefully with warnings
- ✅ Display loading progress for each external resource
- ✅ Combine all data sources into unified data structure

**Technical Details:**
- Implement data combiner service
- Use Promise.all for parallel file loading
- Implement retry logic for failed loads
- Cache loaded files in memory

#### FR-1.3: Data Validation
**Priority**: High
**User Story**: As a QA engineer, I want the system to validate uploaded data so that I can identify data quality issues early.

**Acceptance Criteria:**
- ✅ Validate JSON schema structure
- ✅ Validate required fields presence
- ✅ Validate data types for all fields
- ✅ Validate SQL query ID references
- ✅ Validate test case ID uniqueness
- ✅ Display validation warnings and errors
- ✅ Allow proceeding with warnings but block on errors

---

### 3.2 Navigation & Content Display

#### FR-2.1: Sidebar Navigation
**Priority**: Critical
**User Story**: As a QA engineer, I want to navigate between different report sections so that I can view specific information.

**Acceptance Criteria:**
- ✅ Display table of contents in left sidebar
- ✅ Show section icons and titles
- ✅ Highlight active section
- ✅ Support keyboard navigation (arrow keys)
- ✅ Collapse/expand sidebar on mobile
- ✅ Persist sidebar state in localStorage
- ✅ Smooth scroll to section on click
- ✅ Update URL hash on section change
- ✅ Support browser back/forward navigation

**Sections:**
1. Test Report Overview
2. Test Objective
3. Test Prerequisites
4. Test Data
5. Regression Test Cases
6. Database Queries
7. Test Execution Checklist
8. Known Issues & Notes
9. Test Summary Template
10. Defect Log
11. Sign-Off

#### FR-2.2: Content Panel
**Priority**: Critical
**User Story**: As a QA engineer, I want to view section content in the main panel so that I can read test information.

**Acceptance Criteria:**
- ✅ Display section title with icon
- ✅ Render section-specific content
- ✅ Support rich formatting (lists, tables, code blocks)
- ✅ Implement fade transition between sections
- ✅ Maintain scroll position within section
- ✅ Support print-friendly layout
- ✅ Responsive design for all screen sizes

#### FR-2.3: Report Info Card
**Priority**: Medium
**User Story**: As a QA engineer, I want to see report metadata at a glance so that I can verify I'm viewing the correct report.

**Acceptance Criteria:**
- ✅ Display module name
- ✅ Display version
- ✅ Display test environment
- ✅ Display last updated date
- ✅ Make card clickable to navigate to overview
- ✅ Show "GLOBAL SEARCH" label
- ✅ Highlight on hover

---

### 3.3 Test Case Management

#### FR-3.1: Test Case Display
**Priority**: Critical
**User Story**: As a QA engineer, I want to view all test cases in a table so that I can see test coverage.

**Acceptance Criteria:**
- ✅ Display test cases in sortable table
- ✅ Show columns: ID, Name, Module, Location, Priority, Source, Status, Actions, Screenshots
- ✅ Support column sorting (ascending/descending)
- ✅ Support column filtering (Priority, Status)
- ✅ Display test case count
- ✅ Highlight rows based on status
- ✅ Support row selection
- ✅ Responsive table design with horizontal scroll

**Table Columns:**
| Column | Type | Sortable | Filterable |
|--------|------|----------|------------|
| Test Case ID | String | Yes | No |
| Test Case Name | String | Yes | No |
| Module | String | Yes | Yes |
| Location | String | Yes | No |
| Priority | Array | Yes | Yes |
| Source | Array | Yes | No |
| Status | Dropdown | No | Yes |
| Actions | Buttons | No | No |
| Screenshots | Preview | No | No |

#### FR-3.2: Test Case Execution
**Priority**: Critical
**User Story**: As a QA engineer, I want to update test case execution status so that I can track testing progress.

**Acceptance Criteria:**
- ✅ Provide status dropdown for each test case
- ✅ Support statuses: Not Executed, Passed, Failed, Blocked
- ✅ Save status changes to IndexedDB immediately
- ✅ Update test summary counts in real-time
- ✅ Show visual feedback on status change
- ✅ Support bulk status updates
- ✅ Persist status across browser sessions

#### FR-3.3: Test Case Details Modal
**Priority**: High
**User Story**: As a QA engineer, I want to view detailed test case information so that I can understand test steps and expected results.

**Acceptance Criteria:**
- ✅ Open modal on "View" button click
- ✅ Display all test case fields
- ✅ Show test steps in numbered list
- ✅ Show expected results
- ✅ Show preconditions
- ✅ Provide editable "Actual Result" text area
- ✅ Save actual results to IndexedDB
- ✅ Support modal keyboard shortcuts (Esc to close)
- ✅ Responsive modal design

**Modal Fields:**
- Test Case ID
- Test Case Name
- Module
- Location
- Priority
- Source
- Test Steps (numbered list)
- Expected Result
- Preconditions
- Actual Result (editable)
- Status (editable)
- Screenshots (gallery)

---

### 3.4 Screenshot Management

#### FR-4.1: Screenshot Capture
**Priority**: High
**User Story**: As a QA engineer, I want to paste screenshots from clipboard so that I can document test execution.

**Acceptance Criteria:**
- ✅ Support Ctrl+V paste from clipboard
- ✅ Support click-to-paste button
- ✅ Convert clipboard image to base64
- ✅ Store screenshot in IndexedDB
- ✅ Display thumbnail preview
- ✅ Show screenshot count badge
- ✅ Support multiple screenshots per test case
- ✅ Limit screenshot size (max 5MB per image)
- ✅ Compress images if needed

**Technical Details:**
- Use Clipboard API for paste detection
- Convert images to base64 data URLs
- Implement image compression using canvas API
- Store in IndexedDB with test case ID as key

#### FR-4.2: Screenshot Gallery
**Priority**: High
**User Story**: As a QA engineer, I want to view screenshots in a gallery so that I can review test evidence.

**Acceptance Criteria:**
- ✅ Display thumbnail previews in test case row
- ✅ Open full-size modal on thumbnail click
- ✅ Support navigation between screenshots (prev/next)
- ✅ Show screenshot index (e.g., "2 of 5")
- ✅ Support keyboard navigation (arrow keys)
- ✅ Support zoom in/out
- ✅ Support delete screenshot
- ✅ Confirm before deletion
- ✅ Update thumbnail gallery after deletion

#### FR-4.3: Screenshot Export
**Priority**: Medium
**User Story**: As a QA engineer, I want screenshots included in exports so that I can share test evidence.

**Acceptance Criteria:**
- ✅ Include screenshots in HTML export
- ✅ Include screenshots in PDF export
- ✅ Embed as base64 in exported files
- ✅ Maintain image quality
- ✅ Handle large screenshot collections gracefully

---

### 3.5 Defect Logging

#### FR-5.1: Defect Creation
**Priority**: High
**User Story**: As a QA engineer, I want to log defects so that I can track issues found during testing.

**Acceptance Criteria:**
- ✅ Open defect modal from FAB button
- ✅ Provide form with required fields
- ✅ Auto-generate defect ID if not provided
- ✅ Link defect to test case ID
- ✅ Set default date to today
- ✅ Validate required fields
- ✅ Save defect to IndexedDB
- ✅ Show success message
- ✅ Refresh defect log section

**Defect Fields:**
- Bug ID (required, unique)
- Test Case ID (required, dropdown)
- Title (required)
- Description (required, textarea)
- Severity (required, dropdown: Critical, High, Medium, Low)
- Status (required, dropdown: Open, In Progress, Resolved, Closed)
- Date Found (required, date picker)
- URL (optional)
- Actions Taken (optional, textarea)

#### FR-5.2: Defect Management
**Priority**: High
**User Story**: As a QA engineer, I want to view, edit, and delete defects so that I can maintain accurate defect records.

**Acceptance Criteria:**
- ✅ Display defects in table format
- ✅ Show all defect fields
- ✅ Support sorting by any column
- ✅ Support filtering by severity and status
- ✅ Provide "View" button to see full details
- ✅ Provide "Edit" button to modify defect
- ✅ Provide "Delete" button with confirmation
- ✅ Update defect log in real-time
- ✅ Persist changes to IndexedDB

#### FR-5.3: Defect Details Modal
**Priority**: Medium
**User Story**: As a QA engineer, I want to view complete defect information so that I can understand the issue.

**Acceptance Criteria:**
- ✅ Display all defect fields in read-only mode
- ✅ Show severity badge with color coding
- ✅ Show status badge with color coding
- ✅ Format date in readable format
- ✅ Make URL clickable
- ✅ Provide "Edit" and "Close" buttons
- ✅ Support keyboard shortcuts

---

### 3.6 Checklist Management

#### FR-6.1: Checklist Display
**Priority**: Medium
**User Story**: As a QA engineer, I want to view pre/post execution checklists so that I can ensure all steps are completed.

**Acceptance Criteria:**
- ✅ Display checklist items from JSON
- ✅ Show checkbox for each item
- ✅ Support checking/unchecking items
- ✅ Save checklist state to IndexedDB
- ✅ Persist state across sessions
- ✅ Show completion percentage
- ✅ Support keyboard navigation

#### FR-6.2: Checklist State Persistence
**Priority**: Medium
**User Story**: As a QA engineer, I want my checklist progress saved so that I don't lose my work.

**Acceptance Criteria:**
- ✅ Save state on every checkbox change
- ✅ Load saved state on section render
- ✅ Store in IndexedDB with report ID
- ✅ Handle multiple reports independently
- ✅ Provide "Reset All" option

---

### 3.7 Export Functionality

#### FR-7.1: HTML Export
**Priority**: Critical
**User Story**: As a QA engineer, I want to export a standalone HTML report so that I can share it without dependencies.

**Acceptance Criteria:**
- ✅ Generate complete standalone HTML file
- ✅ Embed all report data as JavaScript
- ✅ Embed all execution data (statuses, screenshots, actual results)
- ✅ Embed complete CSS styles
- ✅ Embed all JavaScript rendering logic
- ✅ Include working navigation
- ✅ Include all sections with data
- ✅ No external dependencies required
- ✅ Openable in any browser without server
- ✅ Sanitize filename for download

**Technical Details:**
- Fetch all data from IndexedDB
- Embed as JavaScript variables
- Include all CSS from stylesheet
- Include rendering functions
- Generate blob and trigger download

#### FR-7.2: PDF Export
**Priority**: High
**User Story**: As a QA engineer, I want to export a PDF report so that I can print or email it.

**Acceptance Criteria:**
- ✅ Generate print-optimized HTML
- ✅ Open browser print dialog
- ✅ Include all sections
- ✅ Include screenshots
- ✅ Apply print-specific CSS
- ✅ Hide interactive elements (buttons, inputs)
- ✅ Maintain proper page breaks
- ✅ Include header/footer on each page
- ✅ Support "Save as PDF" option

**Technical Details:**
- Use window.print() API
- Apply @media print CSS rules
- Generate temporary print window
- Include all data inline

#### FR-7.3: Excel Export
**Priority**: High
**User Story**: As a QA engineer, I want to export an Excel report so that I can analyze data in spreadsheet format.

**Acceptance Criteria:**
- ✅ Generate XLSX file with multiple sheets
- ✅ Include 6 sheets: Basic Info, Test Scenarios, Test Cases, Execution Results, Defect Log, Sign-Off
- ✅ Format headers with bold styling
- ✅ Auto-size columns
- ✅ Include all data fields
- ✅ Handle array fields (join with commas)
- ✅ Include execution data from IndexedDB
- ✅ Sanitize filename
- ✅ Trigger download automatically

**Sheet Structure:**
1. **Basic Info**: Metadata, environment setup, prerequisites
2. **Test Scenarios**: All test scenarios with descriptions
3. **Test Cases**: All test cases with full details
4. **Execution Results**: Test case statuses and actual results
5. **Defect Log**: All logged defects
6. **Sign-Off**: Approval information

**Technical Details:**
- Use SheetJS (XLSX) library
- Create workbook with multiple sheets
- Format as Array of Arrays (AOA)
- Apply cell styling
- Enable compression

---

### 3.8 Search & Filter

#### FR-8.1: Test Case Filtering
**Priority**: Medium
**User Story**: As a QA engineer, I want to filter test cases so that I can focus on specific subsets.

**Acceptance Criteria:**
- ✅ Provide filter dropdowns for Priority column
- ✅ Provide filter dropdowns for Status column
- ✅ Support multi-select filtering
- ✅ Update table in real-time
- ✅ Show filtered count
- ✅ Provide "Clear Filters" button
- ✅ Persist filter state in URL params

#### FR-8.2: Global Search
**Priority**: Low
**User Story**: As a QA engineer, I want to search across all content so that I can quickly find information.

**Acceptance Criteria:**
- ✅ Provide search input in header
- ✅ Search across all sections
- ✅ Highlight matching text
- ✅ Show search results count
- ✅ Support keyboard shortcuts (Ctrl+F)
- ✅ Clear search on Esc key

---

### 3.9 Sign-Off Workflow

#### FR-9.1: Sign-Off Display
**Priority**: Medium
**User Story**: As a test manager, I want to view sign-off information so that I can see approval status.

**Acceptance Criteria:**
- ✅ Display sign-off section
- ✅ Show fields: Prepared By, Reviewed By, Approved By, Date
- ✅ Load data from JSON
- ✅ Display in grid layout
- ✅ Show signature lines
- ✅ Support print-friendly format

#### FR-9.2: Sign-Off Data Management
**Priority**: Low
**User Story**: As a test manager, I want to update sign-off information so that I can record approvals.

**Acceptance Criteria:**
- ✅ Provide editable fields
- ✅ Save to IndexedDB
- ✅ Include in exports
- ✅ Validate required fields
- ✅ Show last updated timestamp

---

### 3.10 Data Persistence

#### FR-10.1: IndexedDB Storage
**Priority**: Critical
**User Story**: As a QA engineer, I want my work saved automatically so that I don't lose progress.

**Acceptance Criteria:**
- ✅ Initialize IndexedDB on app load
- ✅ Create object stores: testCaseData, reportData, defects, checklists
- ✅ Save data on every change
- ✅ Handle IndexedDB errors gracefully
- ✅ Provide data migration for version upgrades
- ✅ Support multiple reports (keyed by report ID)

**Object Stores:**
1. **testCaseData**: Test case execution data (status, actual results, screenshots)
2. **reportData**: Complete report JSON data
3. **defects**: Defect log entries
4. **checklists**: Checklist item states

#### FR-10.2: Data Clear/Reset
**Priority**: Medium
**User Story**: As a QA engineer, I want to clear all data so that I can start fresh.

**Acceptance Criteria:**
- ✅ Provide "Clear All Data" button in FAB menu
- ✅ Show confirmation dialog
- ✅ Clear all IndexedDB stores
- ✅ Reset application state
- ✅ Show success message
- ✅ Reload to initial state

---

## 4. Technical Architecture

### 4.1 Next.js Project Structure

```
regression-report-viewer/
├── app/
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Home page (report viewer)
│   ├── globals.css                # Global styles + Tailwind
│   └── api/                       # API routes (if needed)
│       └── export/
│           └── route.ts           # Server-side export generation
├── components/
│   ├── layout/
│   │   ├── Header.tsx             # Top header with upload
│   │   ├── Sidebar.tsx            # Navigation sidebar
│   │   ├── ContentPanel.tsx       # Main content area
│   │   └── Footer.tsx             # Footer (if needed)
│   ├── sections/
│   │   ├── Overview.tsx           # Overview section
│   │   ├── TestObjective.tsx      # Test objective section
│   │   ├── TestPrerequisites.tsx  # Prerequisites section
│   │   ├── TestData.tsx           # Test data section
│   │   ├── TestCases.tsx          # Test cases table
│   │   ├── DatabaseQueries.tsx    # SQL queries section
│   │   ├── ExecutionChecklist.tsx # Checklist section
│   │   ├── KnownIssues.tsx        # Known issues section
│   │   ├── TestSummary.tsx        # Test summary with charts
│   │   ├── DefectLog.tsx          # Defect log table
│   │   └── SignOff.tsx            # Sign-off section
│   ├── modals/
│   │   ├── TestCaseModal.tsx      # Test case details modal
│   │   ├── DefectModal.tsx        # Add/edit defect modal
│   │   ├── DefectViewModal.tsx    # View defect modal
│   │   └── ScreenshotModal.tsx    # Screenshot gallery modal
│   ├── ui/
│   │   ├── Button.tsx             # Reusable button component
│   │   ├── Input.tsx              # Reusable input component
│   │   ├── Select.tsx             # Reusable select component
│   │   ├── Modal.tsx              # Base modal component
│   │   ├── Table.tsx              # Reusable table component
│   │   ├── Badge.tsx              # Status badge component
│   │   ├── Card.tsx               # Card component
│   │   ├── Toast.tsx              # Toast notification
│   │   └── Spinner.tsx            # Loading spinner
│   ├── features/
│   │   ├── FileUpload.tsx         # Drag-drop file upload
│   │   ├── TestCaseRow.tsx        # Test case table row
│   │   ├── ScreenshotCapture.tsx  # Screenshot paste button
│   │   ├── StatusDropdown.tsx     # Status selection dropdown
│   │   ├── FilterDropdown.tsx     # Filter dropdown
│   │   └── FAB.tsx                # Floating action button
│   └── charts/
│       ├── PieChart.tsx           # Test summary pie chart
│       └── BarChart.tsx           # Status distribution bar chart
├── lib/
│   ├── db/
│   │   ├── indexeddb.ts           # IndexedDB wrapper using idb
│   │   ├── testCaseStore.ts       # Test case data operations
│   │   ├── reportStore.ts         # Report data operations
│   │   ├── defectStore.ts         # Defect data operations
│   │   └── checklistStore.ts      # Checklist data operations
│   ├── services/
│   │   ├── dataCombiner.ts        # Combine JSON + external files
│   │   ├── validator.ts           # JSON schema validation
│   │   ├── exportService.ts       # Export orchestration
│   │   ├── htmlExport.ts          # HTML export generation
│   │   ├── pdfExport.ts           # PDF export generation
│   │   └── excelExport.ts         # Excel export generation
│   ├── utils/
│   │   ├── fileUtils.ts           # File handling utilities
│   │   ├── dateUtils.ts           # Date formatting utilities
│   │   ├── stringUtils.ts         # String manipulation utilities
│   │   └── imageUtils.ts          # Image compression utilities
│   ├── hooks/
│   │   ├── useIndexedDB.ts        # IndexedDB hook
│   │   ├── useTestCases.ts        # Test case management hook
│   │   ├── useDefects.ts          # Defect management hook
│   │   ├── useScreenshots.ts      # Screenshot management hook
│   │   └── useExport.ts           # Export functionality hook
│   └── constants/
│       ├── sections.ts            # Section definitions
│       ├── statuses.ts            # Status options
│       └── colors.ts              # Color palette
├── store/
│   ├── reportStore.ts             # Zustand store for report data
│   ├── uiStore.ts                 # Zustand store for UI state
│   └── executionStore.ts          # Zustand store for execution data
├── types/
│   ├── report.ts                  # Report data types
│   ├── testCase.ts                # Test case types
│   ├── defect.ts                  # Defect types
│   └── index.ts                   # Type exports
├── public/
│   ├── sample-data/               # Sample JSON files
│   └── icons/                     # Static icons
├── styles/
│   └── print.css                  # Print-specific styles
├── .env.local                     # Environment variables
├── next.config.js                 # Next.js configuration
├── tailwind.config.ts             # Tailwind configuration
├── tsconfig.json                  # TypeScript configuration
└── package.json                   # Dependencies
```

### 4.2 Technology Stack Details

#### 4.2.1 Core Framework
```json
{
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.3"
  }
}
```

#### 4.2.2 State Management
```json
{
  "dependencies": {
    "zustand": "^4.5.0",
    "immer": "^10.0.3"
  }
}
```

**Rationale**: Zustand for global state (report data, UI state), React Context for theme/settings

#### 4.2.3 Styling
```json
{
  "dependencies": {
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1"
  }
}
```

**Rationale**: Tailwind for utility-first styling, CSS Modules for component-specific styles

#### 4.2.4 Data Persistence
```json
{
  "dependencies": {
    "idb": "^8.0.0"
  }
}
```

**Rationale**: idb library provides Promise-based IndexedDB API

#### 4.2.5 File Handling
```json
{
  "dependencies": {
    "react-dropzone": "^14.2.3",
    "file-saver": "^2.0.5"
  }
}
```

#### 4.2.6 Validation
```json
{
  "dependencies": {
    "zod": "^3.22.4"
  }
}
```

**Rationale**: Zod for runtime type validation and schema validation

#### 4.2.7 Export Libraries
```json
{
  "dependencies": {
    "xlsx": "^0.18.5",
    "jspdf": "^2.5.1",
    "html2canvas": "^1.4.1"
  }
}
```

#### 4.2.8 UI Components
```json
{
  "dependencies": {
    "@headlessui/react": "^1.7.18",
    "lucide-react": "^0.323.0",
    "recharts": "^2.12.0"
  }
}
```

#### 4.2.9 Development Tools
```json
{
  "devDependencies": {
    "@types/node": "^20.11.5",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.1.0",
    "prettier": "^3.2.4",
    "prettier-plugin-tailwindcss": "^0.5.11"
  }
}
```

### 4.3 State Management Architecture

#### 4.3.1 Report Store (Zustand)
```typescript
// store/reportStore.ts
interface ReportState {
  // Data
  reportData: ReportData | null;
  testCases: TestCase[];
  testScenarios: TestScenario[];
  databaseQueries: DatabaseQuery[];

  // Loading states
  isLoading: boolean;
  loadingProgress: number;

  // Actions
  loadReport: (file: File) => Promise<void>;
  clearReport: () => void;
  updateTestCase: (id: string, data: Partial<TestCase>) => void;
}
```

#### 4.3.2 Execution Store (Zustand)
```typescript
// store/executionStore.ts
interface ExecutionState {
  // Execution data
  testCaseStatuses: Record<string, TestCaseStatus>;
  screenshots: Record<string, Screenshot[]>;
  actualResults: Record<string, string>;

  // Actions
  updateStatus: (testCaseId: string, status: Status) => Promise<void>;
  addScreenshot: (testCaseId: string, image: string) => Promise<void>;
  deleteScreenshot: (testCaseId: string, index: number) => Promise<void>;
  updateActualResult: (testCaseId: string, result: string) => Promise<void>;

  // Sync with IndexedDB
  syncToIndexedDB: () => Promise<void>;
  loadFromIndexedDB: () => Promise<void>;
}
```

#### 4.3.3 UI Store (Zustand)
```typescript
// store/uiStore.ts
interface UIState {
  // Navigation
  activeSection: string;
  sidebarCollapsed: boolean;

  // Modals
  activeModal: string | null;
  modalData: any;

  // Filters
  filters: {
    priority: string[];
    status: string[];
    module: string[];
  };

  // Search
  searchQuery: string;

  // Actions
  setActiveSection: (section: string) => void;
  toggleSidebar: () => void;
  openModal: (modal: string, data?: any) => void;
  closeModal: () => void;
  setFilter: (type: string, values: string[]) => void;
  setSearchQuery: (query: string) => void;
}
```

### 4.4 IndexedDB Schema

#### 4.4.1 Database Configuration
```typescript
// lib/db/indexeddb.ts
const DB_NAME = 'RegressionTestDB';
const DB_VERSION = 1;

const STORES = {
  TEST_CASE_DATA: 'testCaseData',
  REPORT_DATA: 'reportData',
  DEFECTS: 'defects',
  CHECKLISTS: 'checklists',
  SIGN_OFF: 'signOff'
};
```

#### 4.4.2 Object Store Schemas

**testCaseData Store:**
```typescript
interface TestCaseData {
  testCaseId: string;           // Primary key
  status: Status;
  actualResult: string;
  screenshots: string[];        // Base64 encoded images
  executedBy: string;
  executedDate: string;
  notes: string;
}
```

**reportData Store:**
```typescript
interface StoredReport {
  id: string;                   // Primary key (e.g., 'currentReport')
  data: ReportData;             // Complete JSON data
  timestamp: string;
  version: string;
}
```

**defects Store:**
```typescript
interface Defect {
  bugId: string;                // Primary key
  testCaseId: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  dateFound: string;
  url?: string;
  actionsTaken?: string;
  createdAt: string;
  updatedAt: string;
}
```

**checklists Store:**
```typescript
interface ChecklistState {
  reportId: string;             // Composite key part 1
  itemId: string;               // Composite key part 2
  checked: boolean;
  checkedBy: string;
  checkedDate: string;
}
```

### 4.5 Component Architecture

#### 4.5.1 Component Hierarchy
```
App (layout.tsx)
├── Providers (Theme, Store)
└── Page (page.tsx)
    ├── Header
    │   ├── Logo
    │   ├── FileUpload
    │   └── StatusIndicator
    ├── MainLayout
    │   ├── Sidebar
    │   │   ├── ReportInfoCard
    │   │   └── NavigationMenu
    │   │       └── NavItem[]
    │   └── ContentPanel
    │       ├── SectionHeader
    │       └── SectionContent
    │           └── [Dynamic Section Component]
    ├── FAB
    │   └── FABMenu
    │       ├── ExportHTML
    │       ├── ExportPDF
    │       ├── ExportExcel
    │       └── ClearData
    └── Modals
        ├── TestCaseModal
        ├── DefectModal
        ├── DefectViewModal
        └── ScreenshotModal
```

#### 4.5.2 Component Patterns

**Container/Presenter Pattern:**
- Container components handle logic and state
- Presenter components handle UI rendering
- Example: `TestCasesContainer` → `TestCasesTable`

**Compound Components:**
- Modal components with sub-components
- Example: `Modal.Root`, `Modal.Header`, `Modal.Body`, `Modal.Footer`

**Render Props:**
- Table component with custom cell renderers
- Example: `<Table renderCell={(row, col) => ...} />`

### 4.6 Routing Strategy

#### 4.6.1 URL Structure
```
/                           # Home page (report viewer)
/#section-1                 # Deep link to Test Objective
/#section-2                 # Deep link to Test Prerequisites
...
/#section-10                # Deep link to Sign-Off
```

#### 4.6.2 Hash-based Navigation
- Use URL hash for section navigation
- Update hash on section change
- Support browser back/forward
- Restore section on page load

**Implementation:**
```typescript
// Use Next.js router for hash navigation
const router = useRouter();

const navigateToSection = (sectionId: string) => {
  router.push(`/#${sectionId}`, undefined, { shallow: true });
};

// Listen for hash changes
useEffect(() => {
  const handleHashChange = () => {
    const hash = window.location.hash.substring(1);
    if (hash) {
      setActiveSection(hash);
    }
  };

  window.addEventListener('hashchange', handleHashChange);
  return () => window.removeEventListener('hashchange', handleHashChange);
}, []);
```

---

## 5. UI/UX Specifications

### 5.1 Design System

#### 5.1.1 Color Palette
```css
/* Primary Colors - Teal Theme */
--primary-50: #e6f4f9;
--primary-100: #b3dce9;
--primary-500: #2596be;
--primary-600: #1a7a9e;
--primary-700: #15607a;

/* Secondary Colors - Orange Accent */
--secondary-50: #fff7ed;
--secondary-100: #ffedd5;
--secondary-500: #f97316;
--secondary-600: #ea580c;

/* Status Colors */
--success: #10b981;      /* Green - Passed */
--warning: #f97316;      /* Orange - Blocked */
--danger: #ef4444;       /* Red - Failed */
--info: #2596be;         /* Teal - Info */
--neutral: #64748b;      /* Gray - Not Executed */

/* Background Colors */
--bg-primary: #ffffff;
--bg-secondary: #f8fafc;
--bg-tertiary: #f1f5f9;

/* Text Colors */
--text-primary: #1e293b;
--text-secondary: #64748b;
--text-muted: #94a3b8;

/* Border Colors */
--border-light: #e2e8f0;
--border-medium: #cbd5e1;
--border-dark: #94a3b8;
```

#### 5.1.2 Typography
```css
/* Font Family */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

#### 5.1.3 Spacing Scale
```css
--spacing-1: 0.25rem;    /* 4px */
--spacing-2: 0.5rem;     /* 8px */
--spacing-3: 0.75rem;    /* 12px */
--spacing-4: 1rem;       /* 16px */
--spacing-5: 1.25rem;    /* 20px */
--spacing-6: 1.5rem;     /* 24px */
--spacing-8: 2rem;       /* 32px */
--spacing-10: 2.5rem;    /* 40px */
--spacing-12: 3rem;      /* 48px */
```

#### 5.1.4 Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

#### 5.1.5 Border Radius
```css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
--radius-full: 9999px;
```

### 5.2 Component Specifications

#### 5.2.1 Button Component
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}
```

**Variants:**
- **Primary**: Teal background, white text
- **Secondary**: White background, teal border
- **Danger**: Red background, white text
- **Ghost**: Transparent background, teal text

**Sizes:**
- **sm**: 32px height, 12px padding
- **md**: 40px height, 16px padding
- **lg**: 48px height, 20px padding

#### 5.2.2 Input Component
```typescript
interface InputProps {
  type: 'text' | 'email' | 'password' | 'number' | 'date';
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}
```

**States:**
- Default: Gray border
- Focus: Teal border, teal ring
- Error: Red border, red text
- Disabled: Gray background, gray text

#### 5.2.3 Select Component
```typescript
interface SelectProps {
  label?: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}
```

#### 5.2.4 Modal Component
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

**Sizes:**
- **sm**: 400px max-width
- **md**: 600px max-width
- **lg**: 800px max-width
- **xl**: 1000px max-width

**Features:**
- Backdrop overlay (semi-transparent black)
- Close on Esc key
- Close on backdrop click
- Trap focus within modal
- Prevent body scroll when open

#### 5.2.5 Table Component
```typescript
interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  sortable?: boolean;
  filterable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  onRowClick?: (row: T) => void;
}

interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}
```

**Features:**
- Sticky header
- Horizontal scroll on mobile
- Zebra striping
- Hover highlight
- Sort indicators
- Filter dropdowns

#### 5.2.6 Badge Component
```typescript
interface BadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size: 'sm' | 'md';
  children: React.ReactNode;
}
```

**Status Badge Mapping:**
- **Passed**: Green background
- **Failed**: Red background
- **Blocked**: Orange background
- **Not Executed**: Gray background

### 5.3 Responsive Design

#### 5.3.1 Breakpoints
```css
/* Mobile First Approach */
--breakpoint-sm: 640px;   /* Small devices */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large desktops */
```

#### 5.3.2 Layout Adaptations

**Mobile (< 768px):**
- Sidebar collapses to hamburger menu
- Table scrolls horizontally
- FAB buttons stack vertically
- Modals full-screen
- Single column layouts

**Tablet (768px - 1024px):**
- Sidebar toggleable
- Table with reduced columns
- FAB buttons in corner
- Modals centered with max-width
- Two column layouts

**Desktop (> 1024px):**
- Sidebar always visible
- Full table with all columns
- FAB buttons in corner
- Modals centered
- Multi-column layouts

#### 5.3.3 Touch Targets
- Minimum touch target size: 44x44px
- Adequate spacing between interactive elements
- Larger buttons on mobile
- Swipe gestures for modals and galleries

### 5.4 Accessibility (WCAG 2.1 AA)

#### 5.4.1 Keyboard Navigation
- ✅ All interactive elements keyboard accessible
- ✅ Logical tab order
- ✅ Visible focus indicators
- ✅ Keyboard shortcuts documented
- ✅ Skip to main content link
- ✅ Modal focus trapping

**Keyboard Shortcuts:**
- `Ctrl+F`: Open search
- `Esc`: Close modal/clear search
- `Arrow Keys`: Navigate sections
- `Enter`: Activate button/link
- `Space`: Toggle checkbox
- `Tab`: Next element
- `Shift+Tab`: Previous element

#### 5.4.2 Screen Reader Support
- ✅ Semantic HTML elements
- ✅ ARIA labels for icons
- ✅ ARIA live regions for dynamic content
- ✅ ARIA expanded/collapsed states
- ✅ Alt text for images
- ✅ Descriptive link text

#### 5.4.3 Color Contrast
- ✅ Text contrast ratio ≥ 4.5:1 (normal text)
- ✅ Text contrast ratio ≥ 3:1 (large text)
- ✅ UI component contrast ratio ≥ 3:1
- ✅ Don't rely on color alone for information

#### 5.4.4 Focus Management
- ✅ Visible focus indicators (2px teal outline)
- ✅ Focus returns to trigger after modal close
- ✅ Focus moves to first element in modal
- ✅ Skip navigation links

### 5.5 Animation & Transitions

#### 5.5.1 Transition Durations
```css
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
```

#### 5.5.2 Easing Functions
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

#### 5.5.3 Animations
- **Fade In**: Opacity 0 → 1 (300ms)
- **Slide In**: Transform translateY(20px) → 0 (300ms)
- **Scale In**: Transform scale(0.95) → 1 (150ms)
- **Skeleton Loading**: Shimmer effect for loading states

#### 5.5.4 Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 6. Data Models & Schema

### 6.1 TypeScript Type Definitions

#### 6.1.1 Report Data Types
```typescript
// types/report.ts

export interface ReportData {
  metaData: MetaData;
  environmentSetup: EnvironmentSetup;
  testObjective: TestObjective;
  testPrerequisite: TestPrerequisite;
  testData: TestData;
  testCases: TestCase[];
  testScenarios: TestScenario[];
  databaseQueries: DatabaseQuery[];
  executionChecklist: string[];
  knownIssues: KnownIssue[];
  signOff: SignOff;
  tableOfContents: TableOfContentsItem[];

  // Optional fields for external file references
  testCasesFile?: string;
  testScenariosFile?: string;
  moduleFolderPath?: string;
}

export interface MetaData {
  module: string;
  moduleName: string;
  version: string;
  testEnvironment: string;
  lastUpdated: string;
  preparedBy: string;
  reviewedBy?: string;
}

export interface EnvironmentSetup {
  application: string;
  environment: string;
  url: string;
  database: string;
  testDataSource: string;
}

export interface TestObjective {
  scope: string;
  objectives: string[];
  outOfScope: string[];
}

export interface TestPrerequisite {
  accessRequirement: AccessRequirement;
  businessRules: string[];
  testDataRequirements: string[];
}

export interface AccessRequirement {
  environmentAccess: string;
  userRole: string;
  vpnAccess: string;
  databaseAccess: string;
}

export interface TestData {
  members: Member[];
}

export interface Member {
  memberId: string;
  firstName: string;
  lastName: string;
  niNumber: string;
  dateOfBirth: string;
  status: string;
}

export interface KnownIssue {
  title: string;
  description: string;
  workaround: string;
  severity?: string;
}

export interface SignOff {
  preparedBy: string;
  reviewedBy: string;
  approvedBy: string;
  date: string;
}

export interface TableOfContentsItem {
  id: string;
  title: string;
  icon: string;
  description: string;
}
```

#### 6.1.2 Test Case Types
```typescript
// types/testCase.ts

export interface TestCase {
  testCaseId: string;
  testCaseName: string;
  module: string;
  location: string;
  priority: string[] | string;
  source: string[] | string;
  testSteps: string[] | string;
  expectedResult: string;
  preconditions?: string;
  testData?: string;
  category?: string;
}

export interface TestScenario {
  testCaseId: string;
  testCaseName: string;
  description: string;
  category: string;
  module?: string;
  priority?: string;
}

export interface DatabaseQuery {
  queryId: string;
  description: string;
  sqlScript: string;
  purpose?: string;
}

export type Status = 'Not Executed' | 'Passed' | 'Failed' | 'Blocked';

export interface TestCaseExecution {
  testCaseId: string;
  status: Status;
  actualResult: string;
  screenshots: string[];
  executedBy?: string;
  executedDate?: string;
  notes?: string;
}
```

#### 6.1.3 Defect Types
```typescript
// types/defect.ts

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type DefectStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface Defect {
  bugId: string;
  testCaseId: string;
  title: string;
  description: string;
  severity: Severity;
  status: DefectStatus;
  dateFound: string;
  url?: string;
  actionsTaken?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface DefectFormData {
  bugId: string;
  testCaseId: string;
  title: string;
  description: string;
  severity: Severity;
  status: DefectStatus;
  dateFound: string;
  url?: string;
  actionsTaken?: string;
}
```

### 6.2 JSON Schema Validation

#### 6.2.1 Zod Schema for Report Data
```typescript
// lib/schemas/reportSchema.ts
import { z } from 'zod';

export const MetaDataSchema = z.object({
  module: z.string(),
  moduleName: z.string(),
  version: z.string(),
  testEnvironment: z.string(),
  lastUpdated: z.string(),
  preparedBy: z.string(),
  reviewedBy: z.string().optional(),
});

export const TestObjectiveSchema = z.object({
  scope: z.string(),
  objectives: z.array(z.string()),
  outOfScope: z.array(z.string()),
});

export const TestCaseSchema = z.object({
  testCaseId: z.string(),
  testCaseName: z.string(),
  module: z.string(),
  location: z.string(),
  priority: z.union([z.array(z.string()), z.string()]),
  source: z.union([z.array(z.string()), z.string()]),
  testSteps: z.union([z.array(z.string()), z.string()]),
  expectedResult: z.string(),
  preconditions: z.string().optional(),
  testData: z.string().optional(),
  category: z.string().optional(),
});

export const ReportDataSchema = z.object({
  metaData: MetaDataSchema,
  environmentSetup: z.object({
    application: z.string(),
    environment: z.string(),
    url: z.string(),
    database: z.string(),
    testDataSource: z.string(),
  }),
  testObjective: TestObjectiveSchema,
  testPrerequisite: z.object({
    accessRequirement: z.object({
      environmentAccess: z.string(),
      userRole: z.string(),
      vpnAccess: z.string(),
      databaseAccess: z.string(),
    }),
    businessRules: z.array(z.string()),
    testDataRequirements: z.array(z.string()),
  }),
  testData: z.object({
    members: z.array(z.object({
      memberId: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      niNumber: z.string(),
      dateOfBirth: z.string(),
      status: z.string(),
    })),
  }),
  testCases: z.array(TestCaseSchema).optional(),
  testScenarios: z.array(z.object({
    testCaseId: z.string(),
    testCaseName: z.string(),
    description: z.string(),
    category: z.string(),
  })).optional(),
  databaseQueries: z.array(z.object({
    queryId: z.string(),
    description: z.string(),
    sqlScript: z.string(),
  })).optional(),
  executionChecklist: z.array(z.string()).optional(),
  knownIssues: z.array(z.object({
    title: z.string(),
    description: z.string(),
    workaround: z.string(),
  })).optional(),
  signOff: z.object({
    preparedBy: z.string(),
    reviewedBy: z.string(),
    approvedBy: z.string(),
    date: z.string(),
  }).optional(),
  tableOfContents: z.array(z.object({
    id: z.string(),
    title: z.string(),
    icon: z.string(),
    description: z.string(),
  })).optional(),
  testCasesFile: z.string().optional(),
  testScenariosFile: z.string().optional(),
  moduleFolderPath: z.string().optional(),
});

// Validation function
export function validateReportData(data: unknown): ReportData {
  return ReportDataSchema.parse(data);
}
```

### 6.3 Sample JSON Data Structure

#### 6.3.1 Main Report JSON
```json
{
  "metaData": {
    "module": "member-basic-details",
    "moduleName": "Member Basic Details",
    "version": "1.0",
    "testEnvironment": "QA",
    "lastUpdated": "2026-02-26",
    "preparedBy": "QA Team"
  },
  "environmentSetup": {
    "application": "PenScope",
    "environment": "QA Environment",
    "url": "https://qa.penscope.com",
    "database": "PenScope_QA",
    "testDataSource": "Test Data Repository"
  },
  "testObjective": {
    "scope": "Validate member basic details functionality",
    "objectives": [
      "Verify member creation",
      "Verify member search",
      "Verify member update"
    ],
    "outOfScope": [
      "Member deletion",
      "Bulk operations"
    ]
  },
  "testPrerequisite": {
    "accessRequirement": {
      "environmentAccess": "QA Environment",
      "userRole": "Test User",
      "vpnAccess": "Required",
      "databaseAccess": "Read-only"
    },
    "businessRules": [
      "Member ID must be unique",
      "NI Number must be valid format"
    ],
    "testDataRequirements": [
      "Valid member test data",
      "Invalid member test data"
    ]
  },
  "testData": {
    "members": [
      {
        "memberId": "M001",
        "firstName": "John",
        "lastName": "Doe",
        "niNumber": "AB123456C",
        "dateOfBirth": "1990-01-01",
        "status": "Active"
      }
    ]
  },
  "testCasesFile": "member-basic-details-test-cases-feb-26-2026-v1.0.json",
  "testScenariosFile": "member-basic-details-test-scenarios-feb-26-2026-v1.0.json",
  "moduleFolderPath": "member-basic-details",
  "executionChecklist": [
    "Verify test environment is accessible",
    "Verify test data is loaded",
    "Execute all test cases",
    "Log all defects",
    "Update test summary"
  ],
  "knownIssues": [
    {
      "title": "Search performance issue",
      "description": "Search takes longer than expected with large datasets",
      "workaround": "Use specific search criteria"
    }
  ],
  "signOff": {
    "preparedBy": "QA Engineer",
    "reviewedBy": "QA Lead",
    "approvedBy": "Test Manager",
    "date": "2026-02-26"
  }
}
```

---

## 7. API Specifications

### 7.1 Client-Side APIs

Since this is a fully client-side application, there are no traditional REST APIs. However, we define service interfaces for data operations.

#### 7.1.1 Report Service
```typescript
// lib/services/reportService.ts

export interface ReportService {
  loadReport(file: File): Promise<ReportData>;
  validateReport(data: unknown): ValidationResult;
  combineExternalData(report: ReportData): Promise<ReportData>;
  clearReport(): Promise<void>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error';
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'warning';
}
```

#### 7.1.2 Export Service
```typescript
// lib/services/exportService.ts

export interface ExportService {
  exportToHTML(): Promise<Blob>;
  exportToPDF(): Promise<void>;
  exportToExcel(): Promise<Blob>;
}

export interface ExportOptions {
  includeScreenshots: boolean;
  includeExecutionData: boolean;
  format: 'html' | 'pdf' | 'excel';
}
```

#### 7.1.3 IndexedDB Service
```typescript
// lib/db/indexeddb.ts

export interface IDBService {
  // Test Case Operations
  saveTestCaseData(testCaseId: string, data: TestCaseExecution): Promise<void>;
  getTestCaseData(testCaseId: string): Promise<TestCaseExecution | null>;
  getAllTestCaseData(): Promise<TestCaseExecution[]>;

  // Report Operations
  saveReport(report: ReportData): Promise<void>;
  getReport(): Promise<ReportData | null>;

  // Defect Operations
  saveDefect(defect: Defect): Promise<void>;
  getDefect(bugId: string): Promise<Defect | null>;
  getAllDefects(): Promise<Defect[]>;
  deleteDefect(bugId: string): Promise<void>;

  // Checklist Operations
  saveChecklistState(reportId: string, itemId: string, checked: boolean): Promise<void>;
  getChecklistState(reportId: string, itemId: string): Promise<boolean>;

  // Utility Operations
  clearAllData(): Promise<void>;
}
```

### 7.2 Future API Considerations

If backend integration is needed in the future:

#### 7.2.1 Report Management API
```typescript
// Future: Backend API endpoints

POST   /api/reports              // Upload and save report
GET    /api/reports/:id           // Get report by ID
GET    /api/reports               // List all reports
DELETE /api/reports/:id           // Delete report

POST   /api/reports/:id/execute   // Save execution data
GET    /api/reports/:id/execute   // Get execution data

POST   /api/reports/:id/defects   // Create defect
GET    /api/reports/:id/defects   // List defects
PUT    /api/reports/:id/defects/:bugId  // Update defect
DELETE /api/reports/:id/defects/:bugId  // Delete defect

GET    /api/reports/:id/export?format=html|pdf|excel  // Export report
```

---

## 8. Non-Functional Requirements

### 8.1 Performance Requirements

#### 8.1.1 Load Time
- **Initial Page Load**: < 2 seconds (on 3G connection)
- **JSON File Parse**: < 1 second (for 5MB file)
- **Section Navigation**: < 100ms transition
- **Search Results**: < 200ms response time
- **Export Generation**: < 5 seconds (for 100 test cases)

#### 8.1.2 Runtime Performance
- **Frame Rate**: 60 FPS for animations
- **Memory Usage**: < 200MB for typical report
- **IndexedDB Operations**: < 50ms for read/write
- **Image Compression**: < 500ms per screenshot

#### 8.1.3 Optimization Strategies
- ✅ Code splitting by route and component
- ✅ Lazy loading for modals and heavy components
- ✅ Image optimization and compression
- ✅ Virtual scrolling for large tables
- ✅ Debounced search and filter inputs
- ✅ Memoization of expensive computations
- ✅ Service worker for offline caching

### 8.2 Browser Compatibility

#### 8.2.1 Supported Browsers
| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 14+ | Full support |
| Edge | 90+ | Full support |
| Opera | 76+ | Full support |

#### 8.2.2 Unsupported Browsers
- Internet Explorer (all versions)
- Chrome < 90
- Firefox < 88
- Safari < 14

#### 8.2.3 Feature Detection
- IndexedDB support required
- Clipboard API for screenshot paste
- File API for file upload
- Canvas API for image compression

### 8.3 Security Requirements

#### 8.3.1 Data Security
- ✅ All data stored locally in browser (no server transmission)
- ✅ No sensitive data in URLs
- ✅ Sanitize user inputs to prevent XSS
- ✅ Validate file uploads (type, size, content)
- ✅ No external script loading (except CDN libraries)

#### 8.3.2 Content Security Policy
```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.sheetjs.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self';
  connect-src 'self';
```

#### 8.3.3 Input Validation
- ✅ Validate JSON schema before parsing
- ✅ Sanitize HTML in user inputs
- ✅ Limit file upload size (50MB max)
- ✅ Validate image formats (PNG, JPEG only)
- ✅ Escape SQL in query display

### 8.4 Scalability Requirements

#### 8.4.1 Data Limits
- **Maximum Test Cases**: 1000 per report
- **Maximum Screenshots**: 10 per test case
- **Maximum Screenshot Size**: 5MB per image
- **Maximum Report Size**: 50MB JSON file
- **Maximum Defects**: 500 per report

#### 8.4.2 IndexedDB Limits
- **Storage Quota**: Browser-dependent (typically 50% of available disk)
- **Object Store Size**: No hard limit
- **Transaction Size**: Batch operations for > 100 items

### 8.5 Usability Requirements

#### 8.5.1 Learnability
- ✅ Intuitive UI with clear labels
- ✅ Tooltips for all interactive elements
- ✅ Inline help text for complex features
- ✅ Sample data files provided
- ✅ User guide documentation

#### 8.5.2 Efficiency
- ✅ Keyboard shortcuts for common actions
- ✅ Bulk operations support
- ✅ Quick filters and search
- ✅ Auto-save functionality
- ✅ Recent reports list

#### 8.5.3 Error Handling
- ✅ Clear error messages
- ✅ Suggested actions for errors
- ✅ Graceful degradation
- ✅ Error logging to console
- ✅ Toast notifications for user feedback

### 8.6 Maintainability Requirements

#### 8.6.1 Code Quality
- ✅ TypeScript for type safety
- ✅ ESLint for code linting
- ✅ Prettier for code formatting
- ✅ Component documentation
- ✅ Unit test coverage > 80%

#### 8.6.2 Documentation
- ✅ README with setup instructions
- ✅ Component Storybook
- ✅ API documentation
- ✅ Architecture decision records
- ✅ Changelog

### 8.7 Reliability Requirements

#### 8.7.1 Availability
- **Uptime**: 99.9% (for static hosting)
- **Error Rate**: < 0.1% of user actions
- **Data Loss**: Zero tolerance (auto-save)

#### 8.7.2 Fault Tolerance
- ✅ Graceful handling of IndexedDB errors
- ✅ Retry logic for failed operations
- ✅ Fallback for missing external files
- ✅ Recovery from corrupted data

---

## 9. Testing Requirements

### 9.1 Unit Testing

#### 9.1.1 Testing Framework
- **Framework**: Jest + React Testing Library
- **Coverage Target**: > 80%
- **Test Files**: Co-located with components (`*.test.tsx`)

#### 9.1.2 Unit Test Scope
- ✅ All utility functions
- ✅ All service functions
- ✅ All custom hooks
- ✅ Component rendering
- ✅ Component interactions
- ✅ State management logic

#### 9.1.3 Sample Unit Tests
```typescript
// components/ui/Button.test.tsx
describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeDisabled();
  });
});
```

### 9.2 Integration Testing

#### 9.2.1 Integration Test Scope
- ✅ File upload flow
- ✅ Data loading and parsing
- ✅ IndexedDB operations
- ✅ Export generation
- ✅ Modal interactions
- ✅ Form submissions

#### 9.2.2 Sample Integration Tests
```typescript
// app/page.test.tsx
describe('Report Viewer Integration', () => {
  it('loads and displays report data', async () => {
    const file = new File([JSON.stringify(mockReportData)], 'report.json');
    render(<ReportViewer />);

    const input = screen.getByLabelText('Upload Report');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Member Basic Details')).toBeInTheDocument();
    });
  });
});
```

### 9.3 End-to-End Testing

#### 9.3.1 E2E Testing Framework
- **Framework**: Playwright or Cypress
- **Test Environment**: Local development server
- **Test Data**: Sample JSON files

#### 9.3.2 E2E Test Scenarios
1. **Complete Report Workflow**
   - Upload JSON file
   - Navigate through all sections
   - Update test case status
   - Add screenshot
   - Log defect
   - Export to HTML/PDF/Excel

2. **Test Case Execution**
   - Open test case modal
   - Update status
   - Add actual result
   - Paste screenshot
   - Verify data persistence

3. **Defect Management**
   - Create new defect
   - Edit defect
   - View defect details
   - Delete defect

4. **Export Functionality**
   - Export to HTML (verify standalone)
   - Export to PDF (verify content)
   - Export to Excel (verify sheets)

### 9.4 Accessibility Testing

#### 9.4.1 Automated Testing
- **Tool**: axe-core + jest-axe
- **Coverage**: All components and pages
- **WCAG Level**: AA compliance

#### 9.4.2 Manual Testing
- ✅ Keyboard navigation testing
- ✅ Screen reader testing (NVDA, JAWS)
- ✅ Color contrast verification
- ✅ Focus management verification

### 9.5 Performance Testing

#### 9.5.1 Performance Metrics
- **Tool**: Lighthouse CI
- **Metrics**:
  - Performance Score: > 90
  - Accessibility Score: > 95
  - Best Practices Score: > 90
  - SEO Score: > 90

#### 9.5.2 Load Testing
- Test with large datasets (1000 test cases)
- Test with multiple screenshots (10 per test case)
- Test export with large data
- Monitor memory usage

### 9.6 Browser Testing

#### 9.6.1 Cross-Browser Testing
- **Tool**: BrowserStack or Sauce Labs
- **Browsers**: Chrome, Firefox, Safari, Edge
- **Devices**: Desktop, Tablet, Mobile

---

## 10. Deployment Guidelines

### 10.1 Build Configuration

#### 10.1.1 Next.js Configuration
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Static export for client-side only
  images: {
    unoptimized: true,  // Required for static export
  },
  trailingSlash: true,
  // Disable server-side features
  experimental: {
    appDir: true,
  },
};

module.exports = nextConfig;
```

#### 10.1.2 Build Commands
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "export": "next build && next export",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "type-check": "tsc --noEmit"
  }
}
```

### 10.2 Deployment Options

#### 10.2.1 Static Hosting (Recommended)
**Platforms:**
- Vercel (recommended for Next.js)
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Azure Static Web Apps

**Steps:**
1. Run `npm run build`
2. Deploy `out/` directory
3. Configure custom domain (optional)
4. Enable HTTPS

#### 10.2.2 Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

**vercel.json:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "out",
  "framework": "nextjs"
}
```

#### 10.2.3 Netlify Deployment
**netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = "out"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 10.3 Environment Variables

#### 10.3.1 Environment Configuration
```bash
# .env.local (development)
NEXT_PUBLIC_APP_NAME=Regression Test Report Viewer
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_MAX_FILE_SIZE=52428800  # 50MB
NEXT_PUBLIC_MAX_SCREENSHOTS=10
```

### 10.4 CI/CD Pipeline

#### 10.4.1 GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run linter
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 10.5 Monitoring & Analytics

#### 10.5.1 Error Tracking
- **Tool**: Sentry
- **Configuration**: Client-side error tracking
- **Alerts**: Email notifications for errors

#### 10.5.2 Analytics
- **Tool**: Google Analytics 4 or Plausible
- **Metrics**: Page views, user interactions, export usage
- **Privacy**: No PII collection

---

## 11. Appendices

### 11.1 Glossary

| Term | Definition |
|------|------------|
| **SRS** | Software Requirements Specification |
| **QA** | Quality Assurance |
| **IndexedDB** | Browser-based NoSQL database |
| **FAB** | Floating Action Button |
| **WCAG** | Web Content Accessibility Guidelines |
| **CSP** | Content Security Policy |
| **E2E** | End-to-End (testing) |
| **CI/CD** | Continuous Integration/Continuous Deployment |

### 11.2 References

1. **Next.js Documentation**: https://nextjs.org/docs
2. **React Documentation**: https://react.dev
3. **TypeScript Handbook**: https://www.typescriptlang.org/docs/
4. **Tailwind CSS**: https://tailwindcss.com/docs
5. **IndexedDB API**: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
6. **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
7. **SheetJS Documentation**: https://docs.sheetjs.com/

### 11.3 Current Implementation Reference

**Repository Structure:**
```
current-implementation/
├── html-template/
│   ├── regression-report.html
│   ├── regression-report.css
│   ├── regression-report.js
│   ├── data-combiner.js
│   └── table-of-content.js
└── test-data-files/
    └── member-basic-details/
        ├── member-basic-details-test-data.json
        ├── member-basic-details-test-cases-feb-26-2026-v1.0.json
        ├── member-basic-details-test-scenarios-feb-26-2026-v1.0.json
        └── sql-scripts.js
```

### 11.4 Migration Checklist

#### Phase 1: Project Setup (Week 1)
- [ ] Initialize Next.js project with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Set up ESLint and Prettier
- [ ] Configure testing framework
- [ ] Set up Git repository and CI/CD

#### Phase 2: Core Components (Week 2-3)
- [ ] Create layout components (Header, Sidebar, Content Panel)
- [ ] Create UI components (Button, Input, Modal, Table, Badge)
- [ ] Implement responsive design
- [ ] Add accessibility features

#### Phase 3: Data Management (Week 4)
- [ ] Implement IndexedDB wrapper
- [ ] Create Zustand stores
- [ ] Implement file upload functionality
- [ ] Implement data validation
- [ ] Implement data combiner service

#### Phase 4: Section Components (Week 5-6)
- [ ] Implement all 11 section components
- [ ] Implement navigation logic
- [ ] Implement section rendering
- [ ] Add animations and transitions

#### Phase 5: Test Case Management (Week 7)
- [ ] Implement test case table
- [ ] Implement status dropdown
- [ ] Implement test case modal
- [ ] Implement actual result editing
- [ ] Implement data persistence

#### Phase 6: Screenshot Management (Week 8)
- [ ] Implement clipboard paste
- [ ] Implement screenshot gallery
- [ ] Implement image compression
- [ ] Implement screenshot deletion

#### Phase 7: Defect Logging (Week 9)
- [ ] Implement defect modal
- [ ] Implement defect table
- [ ] Implement defect CRUD operations
- [ ] Implement defect filtering

#### Phase 8: Export Functionality (Week 10)
- [ ] Implement HTML export
- [ ] Implement PDF export
- [ ] Implement Excel export
- [ ] Test all export formats

#### Phase 9: Testing (Week 11)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Write E2E tests
- [ ] Perform accessibility testing
- [ ] Perform cross-browser testing

#### Phase 10: Deployment (Week 12)
- [ ] Configure build settings
- [ ] Set up deployment pipeline
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production

### 11.5 Success Metrics

**Technical Metrics:**
- ✅ 100% feature parity with current implementation
- ✅ > 80% unit test coverage
- ✅ Lighthouse score > 90 (all categories)
- ✅ Zero critical accessibility issues
- ✅ < 2s initial load time

**User Metrics:**
- ✅ User satisfaction score > 4.5/5
- ✅ Task completion rate > 95%
- ✅ Error rate < 1%
- ✅ Support tickets < 5 per month

### 11.6 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| IndexedDB browser compatibility | Low | High | Feature detection, fallback to localStorage |
| Large file performance | Medium | Medium | Implement file size limits, chunked processing |
| Screenshot memory issues | Medium | High | Image compression, size limits |
| Export generation failures | Low | Medium | Error handling, retry logic |
| Data migration issues | Medium | High | Comprehensive testing, backup strategy |

### 11.7 Contact Information

**Project Team:**
- **Project Manager**: [Name]
- **Lead Developer**: [Name]
- **QA Lead**: [Name]
- **UX Designer**: [Name]

**Support:**
- **Email**: support@example.com
- **Documentation**: https://docs.example.com
- **Issue Tracker**: https://github.com/org/repo/issues

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Manager | | | |
| Lead Developer | | | |
| QA Lead | | | |
| Stakeholder | | | |

---

**End of Document**

*This SRS document is a living document and will be updated as requirements evolve during the development process.*

