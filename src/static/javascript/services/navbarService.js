angular.module('CVGTool')
    .factory('navSrvc', ['loginSrvc', '$state', '$rootScope', '$http', '$httpParamSerializer', function(loginSrvc, $state, $rootScope, $http, $httpParamSerializer) {

        // Actual version of the tool, THIS IS THE MAIN VARIABLE
        var toolVersion = "3.3.5";

        // Function to send message to tell the controller to update
        var updateSessionData = function() {
            $rootScope.$broadcast('sessionDataMsg', {});
        };

        /* Structs to store information */
        var user = {
            name: "",
            role: "",
            email: "",
            assignedTo: [],
            sessionToken: null
        };

        var activeDataset = { // Active dataset selected
            name: "",
            type: ""
        };

        var sessionData = {
            frameStart: 0, // Starting frame
            frameEnd: 0, // Ending frame
            frameRange: 0, // Range
            loadedCameras: [], // Filenames of the cameras that have been loaded
            canvasCameras: ["", "", "", ""], // Filenames of the cameras that have been placed in the canvas. Each position of the array is one of the canvases
            selectedType: "",
            maxFrame: -1, // Max frame of the session to check frame range displacements
            minFrame: -1, // Min frame of the session to check frame range displacements
            options: null // Options selected from the user
        };

        // Catch inactive user and log him out
        function IdleTimerManager() {
            let t;
            //window.onload = resetTimer;
            let _this = this;

            _this.eventCatchStart = function () {
                window.onmousemove = resetTimer; // catches mouse movements
                window.onmousedown = resetTimer; // catches mouse movements
                window.onclick = resetTimer;     // catches mouse clicks
                window.onscroll = resetTimer;    // catches scrolling
                window.onkeypress = resetTimer;  //catches keyboard actions
            }

            _this.eventCatchStop = function() {
                window.onmousemove = ""; // stop catching mouse movements
                window.onmousedown = ""; // stop catching mouse movements
                window.onclick = "";     // stop catching mouse clicks
                window.onscroll = "";    // stop catching scrolling
                window.onkeypress = "";  //stop catching keyboard actions
            }

            let callbackDoLogout = function () {
                // Logout
                user.name = "";
                user.role = "";
                user.email = "";
                user.assignedTo = [];
                activeDataset = "";
                $state.go('login');
                // Stop catching events
                _this.eventCatchStop();
                // Show alert with info
                window.alert("You have been logged out for inactivity.");
            }

            function doLogout() {
                loginSrvc.logout(user.name, callbackDoLogout);
            }

            function resetTimer() {
                clearTimeout(t);
                t = setTimeout(doLogout,
                    // 5000);  // testing time
                    600000);  // time is in milliseconds (1000 is 1 second) set to 10 minutes
            }
        }

        let idleTimerManager = new IdleTimerManager();

        return {

            // Returns the version of the tool
            getToolVersion: function() {
                return toolVersion;
            },

            /* Session data storage */
            // Gets the sessionData struct
            getSessionData: function() {
                return sessionData;
            },

            // Sets the starting frame in the sessionData struct
            setFrameStart: function(frame) {
                sessionData.frameStart = frame;
                updateSessionData();
            },

            // Sets the end frame in the sessionData struct
            setFrameEnd: function(frame) {
                sessionData.frameEnd = frame;
                updateSessionData();
            },

            // Sets the frame range in the sessionData struct
            setFrameRange: function(range) {
                sessionData.frameRange = range;
                updateSessionData();
            },

            // Checks if the maxFrame is already placed
            isMaxFramePlaced: function() {
                if (sessionData.maxFrame == -1) return false;
                else return true;
            },

            // Checks if the minFrame is already placed
            isMinFramePlaced: function() {
                if (sessionData.minFrame == -1) return false;
                else return true;
            },

            // Adds the camera filename to the sessionData struct
            addLoadedCamera: function(camera) {
                sessionData.loadedCameras.push(camera);
                updateSessionData();
            },

            setOptions: function(options) {
                sessionData.options = options;
                updateSessionData();
            },

            // Reset sessionData
            resetSessionData: function() {
                sessionData = {
                    frameStart: 0, // Starting frame
                    frameEnd: 0, // Ending frame
                    frameRange: 0, // Range
                    loadedCameras: [], // Filenames of the cameras that have been loaded
                    canvasCameras: ["", "", "", ""], // Filenames of the cameras that have been placed in the canvas. Each position of the array is one of the canvases
                    selectedType: "",
                    maxFrame: -1,
                    minFrame: -1,
                    options: null
                };
            },

            // Set camera to a specific canvas in the sessionData struct
            setCanvasCamera: function(camera, canvasID) {
                // If the canvas has a camera, move it to the loaded cameras
                var cameraTemp = sessionData.canvasCameras[canvasID - 1];
                sessionData.loadedCameras.push(cameraTemp);

                // Set the new camera in the canvas
                sessionData.canvasCameras[canvasID - 1] = camera;

                // Remove the new camera from the loadedCameras
                for (var i = 0; i < sessionData.loadedCameras.length; i++) {
                    if (sessionData.loadedCameras[i].localeCompare(camera) == 0) {
                        sessionData.loadedCameras.splice(i, 1);
                    }
                }
                updateSessionData();
            },

            // Set the object type that wants to be kept when jumping frames
            setSelectedType: function(type) {
                sessionData.selectedType = type;
                updateSessionData();
            },

            // Check the max number of frames for the video
            setMaxFrame: function(dataset, datasetType, video) {
                $http({
                    method: 'GET',
                    url: '/api/video/getMaxFrame',
                    headers: {
                        'dataset': dataset,
                        'datasetType': datasetType,
                        'video': video,
                        'Authorization': 'Bearer ' + this.getSessionToken()
                    }
                }).then(function successCallback(response) {
                    sessionData.maxFrame = response.data.msg.frames; // Directly set the maxFrame
                }, function errorCallback(response) {
                    console.log(response.data.msg)
                });
            },

            getMaxFrame: function() {
                return sessionData.maxFrame;
            },

            // Check the min number of frames for the video
            setMinFrame: function(dataset, datasetType, video) {
                $http({
                    method: 'GET',
                    url: '/api/video/getMinFrame',
                    headers: {
                        'dataset': dataset,
                        'datasetType': datasetType,
                        'video': video,
                        'Authorization': 'Bearer ' + this.getSessionToken()
                    }
                }).then(function successCallback(response) {
                    sessionData.minFrame = response.data.msg.frames; // Directly set the minFrame
                }, function errorCallback(response) {
                    console.log(response.data.msg)
                });
            },

            /* User login functions */
            // Logout function
            logout: function() {
                user.name = "";
                user.role = "";
                user.email = "";
                user.assignedTo = [];
                activeDataset = "";
                $state.go('login');
                idleTimerManager.eventCatchStop();
            },

            // Returns info of stored user
            getUser: function() {
                return user;
            },

            // Return role of the stored user
            getUserRole: function() {
                return user.role;
            },

            // Return session token
            getSessionToken: function() {
                return user.sessionToken;
            },

            // Set user to u
            setUser: function(u) {
                user.name = u.name;
                user.role = u.role;
                user.email = u.email;
                user.assignedTo = u.assignedTo;
                user.sessionToken = u.sessionToken;
                // If root role or admin users don't start
                if (user.role.localeCompare("root") !== 0 && user.name.localeCompare("s6bepere") !== 0
                    && user.name.localeCompare("alberto") !== 0 && user.name.localeCompare("admin") !== 0
                    && user.name.localeCompare("dario") !== 0){
                    idleTimerManager.eventCatchStart();
                }
            },

            // Set active dataset to dataset
            setActiveDataset: function(dataset) {
                activeDataset = {
                    name: dataset.name,
                    type: dataset.type,
                    dim: dataset.keypointDim
                };
            },

            // Function that requests a password change
            changePassword: function(user, pwd, callbackSuccess, callbackError) {
                $http({
                    method: 'POST',
                    url: '/api/user/updateUserPassword',
                    headers: {
                        'Authorization': 'Bearer ' + this.getSessionToken()
                    },
                    data: {
                        'username': user,
                        'password': pwd
                    }
                }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg)
                }, function errorCallback(response) {
                    callbackError(response.data.msg)
                });
            },

            /* Dataset functions */
            // Return current active dataset
            getActiveDataset: function() {
                if (user.role === "root") {
                    return {
                        name: "root",
                        type: "root"
                    }
                } else return activeDataset;
            },

            // Return true iff the type of the active dataset is posetrack
            isPosetrack: function() {
                return activeDataset.type.localeCompare("poseTrack") === 0;
            },

            obtainNotificationState: function(callbackSucces, callbackError) {
                $http({
                    method: 'GET',
                    url: '/api/notification/obtain',
                    headers: {}
                }).then(function successCallback(response) {
                    callbackSucces(response.data.msg)
                }, function errorCallBack(response) {
                    callbackError("danger", "An error ocurred when requesting the notification state!")
                });
            }


        }
    }]);