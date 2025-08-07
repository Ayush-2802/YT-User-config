// ==UserScript==
// @name         YouTube UI Enhancer
// @namespace    http://tampermonkey.net/
// @version      2.3
// @description  Adds video page enhancements (full-width info, decluttered actions) and a minimalist, search-focused homepage.
// @author       ayushh
// @match        https://www.youtube.com/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURATION ---
    const ELEMENT_WAIT_TIMEOUT = 15000; // Max time (in ms) to wait for elements to appear.

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
     * This function acts as a router. It checks the current page URL
     * and applies the correct set of enhancements.
     */
    async function handlePageChange() {
        // Reset all custom classes to ensure a clean slate on page navigation.
        document.body.classList.remove('video-page-active', 'homepage-active');

        const pathname = window.location.pathname;

        if (pathname === '/watch') {
            // --- VIDEO PAGE LOGIC ---
            try {
                await waitForElement('ytd-page-manager');
                document.body.classList.add('video-page-active');
                console.log("YouTube UI Enhancer: Video page detected.");
            } catch (error) {
                console.error("YouTube UI Enhancer: Could not apply video page enhancements.", error);
            }
        } else if (pathname === '/' || pathname.startsWith('/feed/')) {
            // --- HOMEPAGE LOGIC ---
            try {
                await waitForElement('ytd-searchbox');
                document.body.classList.add('homepage-active');
                console.log("YouTube UI Enhancer: Homepage detected.");
            } catch (error) {
                console.error("YouTube UI Enhancer: Could not apply homepage enhancements.", error);
            }
        }
    }

    // --- INITIALIZATION AND NAVIGATION HANDLING ---
    // A MutationObserver detects page changes within YouTube (e.g., clicking a new video or the logo).
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            handlePageChange();
        }
    }).observe(document, { subtree: true, childList: true });


    // --- STYLES ---
    const styles = `
        /* --- Minimalist Homepage --- */

        /* Apply these styles only when the 'homepage-active' class is on the body */
        .homepage-active #guide, /* Hides the left sidebar */
        .homepage-active #chips-wrapper, /* Hides the topic filter chips */
        .homepage-active #contents, /* Hides the main video grid */
        .homepage-active ytd-message-renderer, /* Hides notices like 'Watch history is paused' */
        .homepage-active #masthead-container #start, /* Hides the logo and guide button */
        .homepage-active #masthead-container #end { /* Hides the account buttons */
            display: none !important;
        }

        /* Force the main content area to take up the full viewport height and center its contents */
        .homepage-active #content.ytd-app {
            display: flex;
            flex-direction: column;
            justify-content: center; /* Vertically center */
            align-items: center; /* Horizontally center */
            height: 80vh; /* Use viewport height for centering */
        }

        /* Add the 'YouTube' title above the search bar using a pseudo-element */
        .homepage-active #content.ytd-app::before {
            content: 'YouTube';
            font-family: "YouTube Sans","Roboto",sans-serif;
            font-size: 5rem;
            font-weight: 600;
            /* Use YouTube's primary text color variable for theme (light/dark) compatibility */
            color: var(--yt-spec-text-primary);
            margin-bottom: 24px;
            letter-spacing: -0.05em;
        }

        /* Make the search bar container larger and more prominent */
        .homepage-active ytd-searchbox {
            width: 60vw !important;
            max-width: 700px !important;
            min-width: 300px !important;
        }


        /* --- Video Page Enhancements --- */

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

        /* --- Declutter Action Bar (More Robust Selector) --- */
        /* Hides the container with the like/dislike, share, download, etc. buttons */
        .video-page-active #actions.ytd-watch-metadata .ytd-menu-renderer {
            display: none !important;
        }
        /* We must then re-show the three-dot menu, which is also a ytd-menu-renderer,
           but has a different parent structure we can use to identify it. */
        .video-page-active #actions.ytd-watch-metadata > ytd-menu-renderer {
            display: flex !important;
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // Initial run on page load
    handlePageChange();

})();
