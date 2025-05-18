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

/***/ "./src/ts/api.ts":
/*!***********************!*\
  !*** ./src/ts/api.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   api: () => (/* binding */ api)\n/* harmony export */ });\nvar __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\n    return new (P || (P = Promise))(function (resolve, reject) {\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n};\n// API URL configuration\nconst API_URL = 'http://localhost:3000';\n// Helper for API requests\nfunction request(endpoint_1) {\n    return __awaiter(this, arguments, void 0, function* (endpoint, options = {}) {\n        try {\n            const url = `${API_URL}${endpoint}`;\n            console.log(`[API] Making ${options.method || 'GET'} request to: ${url}`);\n            // Get token from localStorage\n            const token = localStorage.getItem('auth_token');\n            // Prepare headers\n            const headers = Object.assign(Object.assign({ 'Content-Type': 'application/json', 'Accept': 'application/json' }, (token && { 'Authorization': `Bearer ${token}` })), options.headers);\n            const response = yield fetch(url, Object.assign(Object.assign({}, options), { headers, mode: 'cors', credentials: 'include' }));\n            console.log(`[API] Response status: ${response.status}`);\n            // Handle authentication errors\n            if (response.status === 401) {\n                // Clear session data\n                localStorage.removeItem('auth_token');\n                localStorage.removeItem('user_id');\n                localStorage.removeItem('username');\n                localStorage.removeItem('avatar_url');\n                // Redirect to login page if not already there\n                if (window.location.pathname !== '/login.html') {\n                    window.location.href = '/login.html';\n                }\n                return {\n                    success: false,\n                    message: 'Authentication required'\n                };\n            }\n            // Handle 404 errors\n            if (response.status === 404) {\n                console.warn(`[API] Endpoint not found: ${endpoint}`);\n                return {\n                    success: false,\n                    message: `Endpoint not found: ${endpoint}`,\n                    data: [] // Renvoyer un tableau vide par défaut\n                };\n            }\n            // Handle no content response\n            if (response.status === 204) {\n                return { success: true };\n            }\n            let data;\n            try {\n                const text = yield response.text();\n                data = text ? JSON.parse(text) : {};\n            }\n            catch (error) {\n                console.error('Error parsing response:', error);\n                return {\n                    success: false,\n                    message: 'Failed to parse server response'\n                };\n            }\n            if (!response.ok) {\n                return {\n                    success: false,\n                    message: data.message || 'An error occurred'\n                };\n            }\n            return data;\n        }\n        catch (error) {\n            console.error('API request failed:', error);\n            return {\n                success: false,\n                message: error instanceof Error ? error.message : 'Unknown error',\n                data: [] // Renvoyer un tableau vide par défaut\n            };\n        }\n    });\n}\n// Create and export API object\nconst api = {\n    baseUrl: API_URL,\n    // Auth services\n    auth: {\n        login(email, password) {\n            return __awaiter(this, void 0, void 0, function* () {\n                return request('/auth/login', {\n                    method: 'POST',\n                    body: JSON.stringify({ email, password })\n                });\n            });\n        },\n        register(username, email, password) {\n            return __awaiter(this, void 0, void 0, function* () {\n                return request('/auth/register', {\n                    method: 'POST',\n                    body: JSON.stringify({ username, email, password })\n                });\n            });\n        },\n        logout() {\n            return __awaiter(this, void 0, void 0, function* () {\n                return request('/auth/logout', {\n                    method: 'POST'\n                });\n            });\n        }\n    },\n    // User services\n    user: {\n        getProfile(userId) {\n            return __awaiter(this, void 0, void 0, function* () {\n                const id = userId || localStorage.getItem('user_id');\n                return request(`/users/${id}`);\n            });\n        },\n        updateProfile(data) {\n            return __awaiter(this, void 0, void 0, function* () {\n                const userId = localStorage.getItem('user_id');\n                return request(`/users/${userId}`, {\n                    method: 'PATCH',\n                    body: JSON.stringify(data)\n                });\n            });\n        },\n        getMatches(userId) {\n            return __awaiter(this, void 0, void 0, function* () {\n                const id = userId || localStorage.getItem('user_id');\n                return request(`/users/${id}/matches`);\n            });\n        },\n        getAll() {\n            return __awaiter(this, void 0, void 0, function* () {\n                return request('/users');\n            });\n        },\n        searchUsers(username) {\n            return __awaiter(this, void 0, void 0, function* () {\n                return request(`/users/search?username=${encodeURIComponent(username)}`);\n            });\n        }\n    },\n    // Friendship services\n    friendship: {\n        getFriends() {\n            return __awaiter(this, void 0, void 0, function* () {\n                return request('/friendships');\n            });\n        },\n        getPendingRequests() {\n            return __awaiter(this, void 0, void 0, function* () {\n                return request('/friendships/requests');\n            });\n        },\n        sendFriendRequest(friendId) {\n            return __awaiter(this, void 0, void 0, function* () {\n                return request('/friendships/request', {\n                    method: 'POST',\n                    body: JSON.stringify({ friend_id: friendId })\n                });\n            });\n        },\n        acceptFriendRequest(requestId) {\n            return __awaiter(this, void 0, void 0, function* () {\n                return request(`/friendships/accept/${requestId}`, {\n                    method: 'POST'\n                });\n            });\n        },\n        rejectFriendRequest(requestId) {\n            return __awaiter(this, void 0, void 0, function* () {\n                return request(`/friendships/reject/${requestId}`, {\n                    method: 'POST'\n                });\n            });\n        },\n        removeFriend(friendId) {\n            return __awaiter(this, void 0, void 0, function* () {\n                return request(`/friendships/${friendId}`, {\n                    method: 'DELETE'\n                });\n            });\n        }\n    },\n    // Game services\n    game: {\n        getAllMatches() {\n            return __awaiter(this, void 0, void 0, function* () {\n                return request('/matches');\n            });\n        }\n    }\n};\n// Pour la rétrocompatibilité, on expose aussi API globalement\nif (typeof window !== 'undefined') {\n    window.api = api;\n}\n\n\n//# sourceURL=webpack://ft-transcendence-frontend/./src/ts/api.ts?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/ts/api.ts"](0, __webpack_exports__, __webpack_require__);
/******/ 	
/******/ })()
;