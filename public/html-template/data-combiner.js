/**
 * Data Combiner Module
 * Combines JSON test data with SQL scripts, table of contents, and external test files
 * Now supports dynamic SQL script loading from module-specific folders
 */

// Import table of contents (SQL scripts are now loaded dynamically)
import { tableOfContents } from './table-of-content.js';

/**
 * Helper function to load external JSON files
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<Object>} Parsed JSON data
 */
async function loadExternalJsonFile(filePath) {
    const response = await fetch(filePath);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

/**
 * Helper function to dynamically load SQL scripts from a module folder
 * @param {string} moduleFolderPath - Path to the module folder (e.g., 'global-search', 'member-basic-details')
 * @returns {Promise<Object>} SQL scripts object
 */
async function loadSqlScripts(moduleFolderPath) {
    try {
        console.log(`📥 Loading SQL scripts from ${moduleFolderPath}/sql-scripts.js...`);
        const module = await import(`../test-data-files/${moduleFolderPath}/sql-scripts.js`);
        console.log(`✅ SQL scripts loaded from ${moduleFolderPath}/sql-scripts.js`);
        return module.sqlScripts || {};
    } catch (error) {
        console.error(`❌ Failed to load SQL scripts from ${moduleFolderPath}/sql-scripts.js:`, error);
        return {};
    }
}

/**
 * Combines JSON data with SQL scripts, table of contents, and external test files
 * @param {Object} jsonData - The test data from JSON file
 * @returns {Promise<Object>} Combined data with all external resources merged
 */
export async function combineDataWithSqlScripts(jsonData) {
    // Create a deep copy of the JSON data to avoid mutation
    const combinedData = JSON.parse(JSON.stringify(jsonData));

    // Get module folder path from JSON (e.g., 'global-search', 'member-basic-details')
    const moduleFolderPath = combinedData.moduleFolderPath || '';

    if (!moduleFolderPath) {
        console.warn('⚠️ No moduleFolderPath specified in JSON. SQL scripts may not load correctly.');
    }

    // 1. Add table of contents if not present in JSON
    if (!combinedData.tableOfContents || !Array.isArray(combinedData.tableOfContents) || combinedData.tableOfContents.length === 0) {
        console.log('📑 Adding table of contents from table-of-content.js');
        combinedData.tableOfContents = tableOfContents;
    } else {
        console.log('📑 Using table of contents from JSON file');
    }

    // 2. Load SQL scripts dynamically from module folder
    let sqlScripts = {};
    if (moduleFolderPath) {
        sqlScripts = await loadSqlScripts(moduleFolderPath);
    }

    // 3. Load test cases from external file if referenced
    if (combinedData.testCasesFile &&
        (!combinedData.testCases || combinedData.testCases.length === 0)) {

        try {
            console.log(`📥 Loading test cases from ${combinedData.testCasesFile}...`);
            const testCasesFilePath = moduleFolderPath
                ? `../test-data-files/${moduleFolderPath}/${combinedData.testCasesFile}`
                : `../test-data-files/${combinedData.testCasesFile}`;
            const testCasesData = await loadExternalJsonFile(testCasesFilePath);
            combinedData.testCases = testCasesData.testCases || [];
            console.log(`✅ Loaded ${combinedData.testCases.length} test cases from ${combinedData.testCasesFile}`);
        } catch (error) {
            console.error(`❌ Failed to load test cases from ${combinedData.testCasesFile}:`, error);
            combinedData.testCases = [];
        }
    } else if (combinedData.testCases && combinedData.testCases.length > 0) {
        console.log(`📋 Using ${combinedData.testCases.length} test cases from JSON file`);
    }

    // 4. Load test scenarios from external file if referenced
    if (combinedData.testScenariosFile &&
        (!combinedData.testScenarios || combinedData.testScenarios.length === 0)) {

        try {
            console.log(`📥 Loading test scenarios from ${combinedData.testScenariosFile}...`);
            const testScenariosFilePath = moduleFolderPath
                ? `../test-data-files/${moduleFolderPath}/${combinedData.testScenariosFile}`
                : `../test-data-files/${combinedData.testScenariosFile}`;
            const testScenariosData = await loadExternalJsonFile(testScenariosFilePath);
            combinedData.testScenarios = testScenariosData.testScenarios || [];
            console.log(`✅ Loaded ${combinedData.testScenarios.length} test scenarios from ${combinedData.testScenariosFile}`);
        } catch (error) {
            console.error(`❌ Failed to load test scenarios from ${combinedData.testScenariosFile}:`, error);
            combinedData.testScenarios = [];
        }
    } else if (combinedData.testScenarios && combinedData.testScenarios.length > 0) {
        console.log(`📋 Using ${combinedData.testScenarios.length} test scenarios from JSON file`);
    }

    // 5. Combine SQL scripts with query definitions
    if (combinedData.sqlQueryScripts && Array.isArray(combinedData.sqlQueryScripts)) {
        // Iterate through each query script and add the actual SQL query text
        combinedData.sqlQueryScripts = combinedData.sqlQueryScripts.map((queryItem, index) => {
            const queryId = queryItem.queryId;

            // Check if queryId is missing
            if (!queryId || queryId === undefined || queryId === null || queryId === '') {
                console.error(`Missing queryId for query at index ${index}:`, queryItem);
                return {
                    ...queryItem,
                    queryText: `-- ERROR: Missing queryId for "${queryItem.queryTitle || 'Unknown Query'}"`
                };
            }

            // Get the SQL query text from dynamically loaded sql-scripts using the queryId
            const queryText = sqlScripts[queryId];

            if (queryText) {
                // Add the queryText to the query item
                return {
                    ...queryItem,
                    queryText: queryText.trim()
                };
            } else {
                // If queryId not found, add a placeholder
                console.warn(`SQL query not found for queryId: ${queryId}`);
                return {
                    ...queryItem,
                    queryText: `-- Query not found for ID: ${queryId}\n-- Available IDs: ${Object.keys(sqlScripts).join(', ')}`
                };
            }
        });
    }

    return combinedData;
}

/**
 * Validates that all queryIds in JSON have corresponding SQL scripts
 * @param {Object} jsonData - The test data from JSON file
 * @returns {Promise<Object>} Validation result with missing queryIds
 */
export async function validateQueryIds(jsonData) {
    const missingQueryIds = [];
    const foundQueryIds = [];

    // Load SQL scripts from module folder
    const moduleFolderPath = jsonData.moduleFolderPath || '';
    let sqlScripts = {};

    if (moduleFolderPath) {
        sqlScripts = await loadSqlScripts(moduleFolderPath);
    }

    if (jsonData.sqlQueryScripts && Array.isArray(jsonData.sqlQueryScripts)) {
        jsonData.sqlQueryScripts.forEach(queryItem => {
            const queryId = queryItem.queryId;

            if (sqlScripts[queryId]) {
                foundQueryIds.push(queryId);
            } else {
                missingQueryIds.push(queryId);
            }
        });
    }

    return {
        isValid: missingQueryIds.length === 0,
        missingQueryIds,
        foundQueryIds,
        totalQueries: foundQueryIds.length + missingQueryIds.length
    };
}

/**
 * Gets available SQL script IDs from a module folder
 * @param {string} moduleFolderPath - Path to the module folder
 * @returns {Promise<Array>} Array of available query IDs
 */
export async function getAvailableSqlScriptIds(moduleFolderPath) {
    const sqlScripts = await loadSqlScripts(moduleFolderPath);
    return Object.keys(sqlScripts);
}

/**
 * Gets the table of contents
 * @returns {Array} Table of contents array
 */
export function getTableOfContents() {
    return tableOfContents;
}

/**
 * Validates table of contents structure
 * @param {Object} jsonData - The test data from JSON file
 * @returns {Object} Validation result
 */
export function validateTableOfContents(jsonData) {
    const hasTableOfContents = jsonData.tableOfContents &&
                                Array.isArray(jsonData.tableOfContents) &&
                                jsonData.tableOfContents.length > 0;

    return {
        hasTableOfContents,
        source: hasTableOfContents ? 'JSON file' : 'table-of-content.js',
        itemCount: hasTableOfContents ? jsonData.tableOfContents.length : tableOfContents.length
    };
}

/**
 * Validates external file references
 * @param {Object} jsonData - The test data from JSON file
 * @returns {Object} Validation result
 */
export function validateExternalFiles(jsonData) {
    return {
        hasTestCasesFile: !!jsonData.testCasesFile,
        hasScenariosFile: !!jsonData.testScenariosFile,
        testCasesFile: jsonData.testCasesFile || 'inline',
        testScenariosFile: jsonData.testScenariosFile || 'inline',
        testCasesCount: jsonData.testCases?.length || 0,
        testScenariosCount: jsonData.testScenarios?.length || 0
    };
}

