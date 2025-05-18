/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/ts/index.ts":
/*!*************************!*\
  !*** ./src/ts/index.ts ***!
  \*************************/
/***/ (() => {

eval("\n// This file will be compiled to JS and included in the HTML directly\n// Global services will be available\ndocument.addEventListener('DOMContentLoaded', () => {\n    console.log('Index page loaded');\n    // Get services from global scope\n    const authService = window.authService;\n    console.log('AuthService available:', !!authService);\n    // Initialize auth service if available\n    if (authService && authService.init) {\n        console.log('Initializing auth service');\n        authService.init();\n    }\n    else {\n        console.warn('Auth service not available or missing init method');\n    }\n    // Update UI based on authentication status\n    updateUI();\n    function updateUI() {\n        const isAuthenticated = authService && authService.isAuthenticated && authService.isAuthenticated();\n        console.log('User is authenticated:', isAuthenticated);\n        // Elements that should only appear for authenticated users\n        const authElements = document.querySelectorAll('.auth-only');\n        // Elements that should only appear for non-authenticated users\n        const guestElements = document.querySelectorAll('.guest-only');\n        if (isAuthenticated) {\n            // Show auth elements, hide guest elements\n            authElements.forEach(el => el.classList.remove('hidden'));\n            guestElements.forEach(el => el.classList.add('hidden'));\n            // Update username if displayed\n            const usernameDisplay = document.getElementById('username-display');\n            if (usernameDisplay && authService.getUsername) {\n                usernameDisplay.textContent = `Bonjour, ${authService.getUsername() || 'Utilisateur'}`;\n            }\n            // Note: Logout functionality is now handled by header-loader.ts\n        }\n        else {\n            // Hide auth elements, show guest elements\n            authElements.forEach(el => el.classList.add('hidden'));\n            guestElements.forEach(el => el.classList.remove('hidden'));\n        }\n    }\n});\n\n\n//# sourceURL=webpack://ft-transcendence-frontend/./src/ts/index.ts?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/ts/index.ts"]();
/******/ 	
/******/ })()
;