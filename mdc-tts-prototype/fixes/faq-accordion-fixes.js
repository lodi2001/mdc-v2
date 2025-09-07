/**
 * FAQ Accordion Critical Fixes
 * 
 * This file contains emergency fixes for the FAQ accordion functionality
 * in support.html. Apply these fixes to restore accordion functionality.
 * 
 * Issues Addressed:
 * 1. Bootstrap initialization conflicts
 * 2. Translation system interference  
 * 3. Error handling and debugging
 * 4. Accessibility improvements
 * 
 * Usage: Include this file after Bootstrap but before other custom scripts
 */

(function() {
    'use strict';

    console.log('FAQ Accordion Fixes: Initializing...');

    // Configuration
    const ACCORDION_ID = 'faqAccordion';
    const DEBUG_MODE = true; // Set to false in production

    // Utility functions
    function debugLog(message, ...args) {
        if (DEBUG_MODE) {
            console.log(`[FAQ Debug] ${message}`, ...args);
        }
    }

    function debugError(message, ...args) {
        console.error(`[FAQ Error] ${message}`, ...args);
    }

    // Store original Bootstrap instances to prevent conflicts
    const bootstrapInstances = new Map();

    /**
     * Critical Fix #1: Proper Bootstrap Accordion Initialization
     */
    function initializeBootstrapAccordion() {
        debugLog('Initializing Bootstrap accordion...');
        
        const accordionElement = document.getElementById(ACCORDION_ID);
        if (!accordionElement) {
            debugError('Accordion element not found!');
            return false;
        }

        // Check if Bootstrap is loaded
        if (typeof bootstrap === 'undefined' || typeof bootstrap.Collapse === 'undefined') {
            debugError('Bootstrap Collapse not available!');
            return false;
        }

        try {
            // Force initialize each collapse element
            const collapseElements = accordionElement.querySelectorAll('.accordion-collapse');
            let initCount = 0;

            collapseElements.forEach((collapse, index) => {
                const collapseId = collapse.id;
                
                // Remove existing instance if any
                const existingInstance = bootstrap.Collapse.getInstance(collapse);
                if (existingInstance) {
                    debugLog(`Disposing existing instance for ${collapseId}`);
                    existingInstance.dispose();
                }

                // Create new instance
                const newInstance = new bootstrap.Collapse(collapse, {
                    toggle: false, // Don't auto-toggle
                    parent: `#${ACCORDION_ID}` // Ensure proper parent
                });

                // Store instance for later reference
                bootstrapInstances.set(collapseId, newInstance);
                initCount++;

                debugLog(`Initialized collapse instance for ${collapseId}`);
            });

            debugLog(`Successfully initialized ${initCount} accordion sections`);
            return true;

        } catch (error) {
            debugError('Bootstrap initialization failed:', error);
            return false;
        }
    }

    /**
     * Critical Fix #2: Translation System Integration
     */
    function createTranslationSafeFunction() {
        // Store reference to original applyTranslations function
        const originalApplyTranslations = window.applyTranslations;
        
        if (typeof originalApplyTranslations === 'function') {
            debugLog('Wrapping applyTranslations to preserve accordion functionality');
            
            window.applyTranslations = function(lang = 'ar') {
                debugLog(`Applying translations for language: ${lang}`);
                
                // Store current accordion states before translation
                const accordionStates = new Map();
                const accordionElement = document.getElementById(ACCORDION_ID);
                
                if (accordionElement) {
                    const collapses = accordionElement.querySelectorAll('.accordion-collapse');
                    collapses.forEach(collapse => {
                        accordionStates.set(collapse.id, {
                            isExpanded: collapse.classList.contains('show'),
                            instance: bootstrap.Collapse.getInstance(collapse)
                        });
                    });
                }

                // Apply original translations
                originalApplyTranslations.call(this, lang);

                // Restore accordion functionality after DOM modifications
                setTimeout(() => {
                    debugLog('Restoring accordion functionality after translation...');
                    
                    // Re-initialize if needed
                    if (!testAccordionFunctionality()) {
                        debugLog('Accordion broken after translation, re-initializing...');
                        initializeBootstrapAccordion();
                    }
                    
                    // Restore previous states
                    accordionStates.forEach((state, collapseId) => {
                        const collapse = document.getElementById(collapseId);
                        if (collapse && state.isExpanded) {
                            const instance = bootstrap.Collapse.getInstance(collapse);
                            if (instance) {
                                instance.show();
                            }
                        }
                    });
                    
                    debugLog('Accordion functionality restored after translation');
                }, 100);
            };
        }
    }

    /**
     * Critical Fix #3: Comprehensive Error Handling
     */
    function testAccordionFunctionality() {
        debugLog('Testing accordion functionality...');
        
        const accordionElement = document.getElementById(ACCORDION_ID);
        if (!accordionElement) {
            debugError('Accordion element not found during test');
            return false;
        }

        const buttons = accordionElement.querySelectorAll('.accordion-button');
        const collapses = accordionElement.querySelectorAll('.accordion-collapse');

        // Test structure
        if (buttons.length !== 4 || collapses.length !== 4) {
            debugError(`Incorrect accordion structure: ${buttons.length} buttons, ${collapses.length} collapses`);
            return false;
        }

        // Test Bootstrap data attributes
        let attributeErrors = 0;
        buttons.forEach((button, index) => {
            const requiredAttrs = ['data-bs-toggle', 'data-bs-target', 'aria-expanded', 'aria-controls'];
            requiredAttrs.forEach(attr => {
                if (!button.hasAttribute(attr)) {
                    debugError(`Button ${index} missing attribute: ${attr}`);
                    attributeErrors++;
                }
            });
        });

        if (attributeErrors > 0) {
            debugError(`Found ${attributeErrors} attribute errors`);
            return false;
        }

        // Test Bootstrap instances
        let instanceErrors = 0;
        collapses.forEach((collapse, index) => {
            const instance = bootstrap.Collapse.getInstance(collapse);
            if (!instance) {
                debugError(`Collapse ${index} (${collapse.id}) missing Bootstrap instance`);
                instanceErrors++;
            }
        });

        if (instanceErrors > 0) {
            debugError(`Found ${instanceErrors} missing Bootstrap instances`);
            return false;
        }

        debugLog('Accordion functionality test passed');
        return true;
    }

    /**
     * Critical Fix #4: Enhanced Accessibility
     */
    function enhanceAccessibility() {
        debugLog('Enhancing accessibility...');
        
        const accordionElement = document.getElementById(ACCORDION_ID);
        if (!accordionElement) return;

        // Add keyboard navigation
        accordionElement.addEventListener('keydown', function(e) {
            if (!e.target.classList.contains('accordion-button')) return;

            let targetButton = null;
            
            switch(e.key) {
                case 'ArrowDown':
                    targetButton = findNextAccordionButton(e.target);
                    break;
                case 'ArrowUp':
                    targetButton = findPreviousAccordionButton(e.target);
                    break;
                case 'Home':
                    targetButton = accordionElement.querySelector('.accordion-button');
                    break;
                case 'End':
                    const buttons = accordionElement.querySelectorAll('.accordion-button');
                    targetButton = buttons[buttons.length - 1];
                    break;
                default:
                    return;
            }

            if (targetButton) {
                e.preventDefault();
                targetButton.focus();
            }
        });

        // Add ARIA live region for screen readers
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'accordion-status';
        accordionElement.appendChild(liveRegion);

        // Monitor accordion state changes
        accordionElement.addEventListener('shown.bs.collapse', function(e) {
            const button = accordionElement.querySelector(`[data-bs-target="#${e.target.id}"]`);
            const buttonText = button ? button.textContent.trim() : 'Section';
            liveRegion.textContent = `${buttonText} expanded`;
        });

        accordionElement.addEventListener('hidden.bs.collapse', function(e) {
            const button = accordionElement.querySelector(`[data-bs-target="#${e.target.id}"]`);
            const buttonText = button ? button.textContent.trim() : 'Section';
            liveRegion.textContent = `${buttonText} collapsed`;
        });

        debugLog('Accessibility enhancements applied');
    }

    function findNextAccordionButton(currentButton) {
        const currentItem = currentButton.closest('.accordion-item');
        const nextItem = currentItem.nextElementSibling;
        return nextItem ? nextItem.querySelector('.accordion-button') : null;
    }

    function findPreviousAccordionButton(currentButton) {
        const currentItem = currentButton.closest('.accordion-item');
        const prevItem = currentItem.previousElementSibling;
        return prevItem ? prevItem.querySelector('.accordion-button') : null;
    }

    /**
     * Main initialization function
     */
    function initialize() {
        debugLog('Starting FAQ accordion fixes...');

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initialize);
            return;
        }

        // Wait for Bootstrap to be available
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        function waitForBootstrap() {
            attempts++;
            
            if (typeof bootstrap !== 'undefined' && typeof bootstrap.Collapse !== 'undefined') {
                // Bootstrap is ready, proceed with fixes
                debugLog('Bootstrap detected, applying fixes...');
                
                // Apply all fixes
                const success = initializeBootstrapAccordion();
                if (success) {
                    createTranslationSafeFunction();
                    enhanceAccessibility();
                    
                    // Final test
                    setTimeout(() => {
                        const testResult = testAccordionFunctionality();
                        if (testResult) {
                            console.log('✅ FAQ Accordion Fixes: Successfully applied all fixes');
                        } else {
                            console.warn('⚠️ FAQ Accordion Fixes: Some issues may remain');
                        }
                    }, 500);
                } else {
                    debugError('Failed to initialize Bootstrap accordion');
                }
                
            } else if (attempts < maxAttempts) {
                // Bootstrap not ready yet, wait a bit more
                setTimeout(waitForBootstrap, 100);
            } else {
                debugError('Bootstrap not detected after maximum wait time');
                console.error('❌ FAQ Accordion Fixes: Bootstrap not available - accordion will not work');
            }
        }

        waitForBootstrap();
    }

    /**
     * Export test function for manual testing
     */
    window.testFAQAccordion = function() {
        console.log('=== FAQ Accordion Manual Test ===');
        const result = testAccordionFunctionality();
        
        if (result) {
            console.log('✅ All tests passed');
            
            // Perform live test
            const firstButton = document.querySelector('#faqAccordion .accordion-button');
            const firstCollapse = document.querySelector('#faqAccordion .accordion-collapse');
            
            if (firstButton && firstCollapse) {
                console.log('🔄 Testing expand/collapse...');
                
                firstButton.click();
                setTimeout(() => {
                    const isExpanded = firstCollapse.classList.contains('show');
                    console.log(`Expand test: ${isExpanded ? '✅ PASS' : '❌ FAIL'}`);
                    
                    if (isExpanded) {
                        firstButton.click(); // Collapse again
                        setTimeout(() => {
                            const isCollapsed = !firstCollapse.classList.contains('show');
                            console.log(`Collapse test: ${isCollapsed ? '✅ PASS' : '❌ FAIL'}`);
                        }, 300);
                    }
                }, 300);
            }
        } else {
            console.log('❌ Tests failed - check console for details');
        }
    };

    // Start initialization
    initialize();

})();

// Usage instructions for developers:
// 
// 1. Include this file in support.html after Bootstrap JS:
//    <script src="fixes/faq-accordion-fixes.js"></script>
//
// 2. Test the fixes by running in browser console:
//    testFAQAccordion()
//
// 3. Monitor console for debug messages (set DEBUG_MODE to false in production)
//
// 4. This file is safe to include even after the main issues are fixed