// ==UserScript==
// @name         YouTube UI Enhancer
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Hides top bar (content slides up), makes video info full-width, and hides action buttons (like, share, etc.) for a cleaner UI.
// @author       ayushh
// @match        https://www.youtube.com/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURATION ---
    const TOP_BAR_TRIGGER_HEIGHT = 50; // The height (in pixels) of the trigger area at the top.
    const ELEMENT_WAIT_TIMEOUT = 10000; // Max time (in ms) to wait for elements to appear.

    // --- UTILITY FUNCTION ---
    /**
     * Waits for a specific element to appear in the DOM.
     * @param {string} selector - The CSS selector of the element to wait for.
     * @returns {Promise<Element>} A promise that resolves with the found element.
     */
    function waitForElement(selector) {
        return new Promise((resolve, reject) => {
            const intervalId = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    clearInterval(intervalId);
                    clearTimeout(timeoutId);
                    resolve(element);
                }
            }, 100);

            const timeoutId = setTimeout(() => {
                clearInterval(intervalId);
                console.error(`YouTube UI Enhancer: Timed out waiting for element: ${selector}`);
                reject(new Error(`Element not found: ${selector}`));
            }, ELEMENT_WAIT_TIMEOUT);
        });
    }


    // --- CORE LOGIC ---
    /**
     * Applies all the visual enhancements to the page.
     */
    async function applyYouTubeEnhancements() {
        if (window.location.pathname !== '/watch') {
            document.body.classList.remove('video-page-active', 'show-masthead');
            return;
        }

        try {
            await waitForElement('ytd-page-manager');
            document.body.classList.add('video-page-active');
            console.log("YouTube UI Enhancer: Video page detected. Applying enhancements.");
        } catch (error) {
            console.error("YouTube UI Enhancer: Could not apply enhancements.", error);
        }
    }

    // --- INITIALIZATION AND NAVIGATION HANDLING ---
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            applyYouTubeEnhancements();
        }
    }).observe(document, { subtree: true, childList: true });


    // --- STYLES ---
    const styles = `
        /* --- Top Bar Auto-Hide & Content Slide --- */
        .video-page-active #masthead-container {
            position: fixed;
            z-index: 1001;
            width: 100%;
            transform: translateY(-100%);
            transition: transform 0.3s ease-in-out;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }

        .video-page-active.show-masthead #masthead-container {
            transform: translateY(0);
        }

        .video-page-active ytd-page-manager {
            margin-top: 0 !important;
            transition: margin-top 0.3s ease-in-out !important;
        }

        .video-page-active.show-masthead ytd-page-manager {
            margin-top: 56px !important; /* Standard height of YouTube's top bar */
        }

        /* --- Full-Width Video Info Section --- */
        .video-page-active #primary.ytd-watch-flexy,
        .video-page-active #primary-inner.ytd-watch-flexy,
        .video-page-active #columns.ytd-watch-flexy {
            width: 100% !important;
            max-width: none !important;
        }

        .video-page-active #secondary.ytd-watch-flexy {
            display: none !important;
        }

        /* --- Declutter Action Bar (Updated & More Stable Selectors) --- */
        /* The buttons like/dislike, share, download, etc., are all contained within
           an element with the ID 'actions-inner'. By hiding this single container,
           we remove all of them in one go. */
        .video-page-active #actions-inner {
            display: none !important;
        }
        /* The three-dot menu is typically a sibling to '#actions-inner',
           so it remains unaffected by the rule above, giving us the desired clean look. */
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);


    // --- EVENT LISTENERS ---
    document.addEventListener('mousemove', (event) => {
        if (!document.body.classList.contains('video-page-active')) {
            return;
        }
        if (event.clientY < TOP_BAR_TRIGGER_HEIGHT) {
            document.body.classList.add('show-masthead');
        } else {
            document.body.classList.remove('show-masthead');
        }
    });

    // Initial run on page load
    applyYouTubeEnhancements();

})();
