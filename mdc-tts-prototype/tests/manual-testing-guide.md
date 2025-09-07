# FAQ Accordion Manual Testing Guide

## Overview
This guide provides step-by-step manual testing procedures for the FAQ accordion functionality in the support.html page for Client users.

## Test Environment Setup

### Prerequisites
1. Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
2. Internet connection (for Bootstrap CDN resources)
3. Local web server (python -m http.server or similar)
4. Browser developer tools enabled

### Test Data
- **User Role**: Client
- **Page**: support.html
- **Accordion ID**: #faqAccordion
- **Expected Sections**: 4 (Account & Login, Transactions, Documents, Technical Issues)

## Manual Test Cases

### Test Case 1: Bootstrap Structure Validation
**Objective**: Verify proper Bootstrap accordion structure

**Steps**:
1. Open support.html in browser
2. Open Developer Tools (F12)
3. Inspect the FAQ accordion section
4. Verify the following elements exist:
   - `<div class="accordion" id="faqAccordion">`
   - 4 `<div class="accordion-item">` elements
   - 4 `<h2 class="accordion-header">` elements
   - 4 `<button class="accordion-button collapsed">` elements
   - 4 `<div class="accordion-collapse collapse">` elements
   - 4 `<div class="accordion-body">` elements

**Expected Result**: ✅ All required Bootstrap classes and structure present

**Common Issues**:
- Missing Bootstrap CSS/JS files
- Incorrect nesting of accordion elements
- Missing required CSS classes

### Test Case 2: Accordion Header Clickability
**Objective**: Verify all accordion headers are clickable and properly configured

**Steps**:
1. Navigate to FAQ section on support.html
2. Locate the 4 accordion headers:
   - الحساب وتسجيل الدخول (Account & Login)
   - المعاملات (Transactions)
   - المستندات (Documents)
   - المشاكل الفنية (Technical Issues)
3. For each header:
   - Hover over the header (cursor should change to pointer)
   - Check if header has proper Bootstrap data attributes
   - Verify aria-* attributes are present

**Expected Result**: ✅ All headers show pointer cursor and have proper attributes:
- `data-bs-toggle="collapse"`
- `data-bs-target="#[sectionId]Collapse"`
- `aria-expanded="false"`
- `aria-controls="[sectionId]Collapse"`

**Common Issues**:
- Missing data-bs-toggle attribute
- Incorrect data-bs-target values
- Missing or incorrect ARIA attributes

### Test Case 3: Expand/Collapse Functionality
**Objective**: Test accordion expand and collapse behavior

**Steps**:
1. Verify all accordion sections start in collapsed state
2. Click on "الحساب وتسجيل الدخول" header
   - Content should expand smoothly
   - Header icon should rotate/change
   - `aria-expanded` should become "true"
   - `accordion-button` class should lose "collapsed"
3. Click the same header again
   - Content should collapse smoothly
   - Header should return to collapsed state
4. Repeat for all 4 sections
5. Test multiple sections open simultaneously (should work independently)

**Expected Result**: ✅ Smooth expand/collapse animations, proper state changes, all sections work independently

**Common Issues**:
- Content doesn't expand when clicked
- No smooth animation
- Multiple sections interfering with each other
- JavaScript errors in console

### Test Case 4: Content Display Verification
**Objective**: Verify questions and answers are properly displayed

**Steps**:
1. Expand "الحساب وتسجيل الدخول" section
2. Verify it contains:
   - Question: "كيف يمكنني إعادة تعيين كلمة المرور؟"
   - Answer: "انقر على رابط 'نسيت كلمة المرور' في صفحة تسجيل الدخول واتبع التعليمات المرسلة إلى بريدك الإلكتروني."
   - Additional question about profile updates
3. Expand "المعاملات" section
   - Verify transaction-related Q&As
   - Check status color explanations
4. Continue for Documents and Technical Issues sections

**Expected Result**: ✅ All questions in bold, answers in muted text, proper Arabic text rendering

**Common Issues**:
- Missing or empty content
- Incorrect text styling
- Arabic text rendering issues
- Content not matching specifications

### Test Case 5: Language Translation Testing
**Objective**: Test accordion functionality in both Arabic and English

**Arabic Mode (Default)**:
1. Ensure page loads in Arabic (dir="rtl", lang="ar")
2. Verify headers show Arabic text:
   - "الحساب وتسجيل الدخول"
   - "المعاملات"
   - "المستندات"
   - "المشاكل الفنية"
3. Test expand/collapse functionality
4. Verify content is in Arabic

**English Mode**:
1. Click English language toggle button
2. Wait for translations to apply
3. Verify headers show English text:
   - "Account & Login"
   - "Transactions"
   - "Documents"
   - "Technical Issues"
4. Test expand/collapse functionality
5. Verify content translations

**Expected Result**: ✅ Accordion works in both languages, translations are accurate, functionality preserved

**Common Issues**:
- Translations not applying
- Accordion breaking after language switch
- Mixed language content
- RTL/LTR layout issues

### Test Case 6: Responsive Design Testing
**Objective**: Test accordion on different screen sizes

**Steps**:
1. Test on desktop (1200px+ width)
2. Test on tablet (768px-1199px width)
3. Test on mobile (< 768px width)
4. For each size:
   - Verify accordion headers are fully clickable
   - Content expands properly
   - No horizontal scrolling
   - Icons and text properly aligned

**Expected Result**: ✅ Accordion works correctly on all screen sizes

### Test Case 7: Accessibility Testing
**Objective**: Verify keyboard navigation and screen reader compatibility

**Steps**:
1. Navigate to FAQ section using Tab key
2. Each accordion header should be focusable
3. Press Enter/Space on focused header to expand
4. Use Tab to navigate through expanded content
5. Test with screen reader (if available)
6. Verify ARIA labels are read correctly

**Expected Result**: ✅ Full keyboard accessibility, proper ARIA announcements

### Test Case 8: Browser Compatibility
**Objective**: Test across different browsers

**Test in each browser**:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**For each browser**:
1. Load support.html
2. Test basic expand/collapse
3. Test language switching
4. Check for console errors
5. Verify visual consistency

**Expected Result**: ✅ Consistent behavior across all browsers

## Debugging Checklist

If accordion is not working, check:

1. **Bootstrap Resources**:
   - ✅ Bootstrap CSS loaded (check Network tab)
   - ✅ Bootstrap JS loaded (check Network tab)
   - ✅ No 404 errors for CDN resources

2. **HTML Structure**:
   - ✅ Correct accordion HTML structure
   - ✅ Proper nesting of elements
   - ✅ Unique IDs for each section

3. **Data Attributes**:
   - ✅ `data-bs-toggle="collapse"` on buttons
   - ✅ Correct `data-bs-target` values
   - ✅ Matching IDs and targets

4. **JavaScript**:
   - ✅ No JavaScript errors in console
   - ✅ Bootstrap JS initialization
   - ✅ Custom accordion initialization code

5. **CSS Conflicts**:
   - ✅ No CSS overriding Bootstrap accordion styles
   - ✅ Proper RTL support for Arabic

## Performance Considerations

1. **Loading Speed**: Page should load within 3 seconds
2. **Animation Smoothness**: Expand/collapse should be smooth (no lag)
3. **Memory Usage**: No memory leaks when interacting with accordion
4. **Accessibility Performance**: Screen reader response time < 1 second

## Common Fixes

### Issue: Accordion not expanding
**Solution**: Check data-bs-toggle and data-bs-target attributes

### Issue: Multiple sections opening
**Solution**: Verify data-bs-parent attribute is set correctly

### Issue: Translations not working
**Solution**: Check translation.js loading and initialization

### Issue: RTL layout broken
**Solution**: Verify CSS RTL support and dir attribute

## Test Report Template

```
# FAQ Accordion Test Report

**Date**: [Date]
**Browser**: [Browser Version]
**Screen Size**: [Resolution]
**Language Tested**: [Arabic/English]

## Test Results Summary
- Total Test Cases: 8
- Passed: [X]
- Failed: [X]
- Warnings: [X]

## Detailed Results
1. Bootstrap Structure: [PASS/FAIL]
2. Header Clickability: [PASS/FAIL]
3. Expand/Collapse: [PASS/FAIL]
4. Content Display: [PASS/FAIL]
5. Language Translation: [PASS/FAIL]
6. Responsive Design: [PASS/FAIL]
7. Accessibility: [PASS/FAIL]
8. Browser Compatibility: [PASS/FAIL]

## Issues Found
[List any issues discovered]

## Recommendations
[Provide specific recommendations for fixes]
```