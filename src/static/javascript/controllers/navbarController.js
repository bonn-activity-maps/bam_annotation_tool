angular.module('CVGTool')

.controller('navbarCtrl', ['$scope', '$rootScope', '$state', 'navSrvc', 'adminDatasetsSrvc', 'loginSrvc', '$mdDialog',
    function($scope, $rootScope, $state, navSrvc, adminDatasetsSrvc, loginSrvc, $mdDialog) {
        $scope.user = {
            name: "",
            email: "",
            role: "",
            assignedTo: []
        };

        $scope.activeDataset = {
            name: "",
            type: ""
        };

        $scope.sessionData = {
            frameStart: 0, // Starting frame
            frameEnd: 0, // Ending frame
            frameRange: 0, // Range of frames
            loadedCameras: [], // Filenames of the cameras that have been loaded
            canvasCameras: ["", "", "", ""], // Filenames of the cameras that have been placed in the canvas. Each position of the array is one of the canvases
            selectedType: "",
            maxFrame: -1, // Max frame of the session to check frame range displacements
            minFrame: -1, // Min frame of the session to check frame range displacements
            options: null
        };

        $scope.activeState = $scope.user.assignedTo[0];

        window.addEventListener('beforeunload', function (e) {
            if (navSrvc.getSessionToken() !== null) {
                loginSrvc.logout($scope.user.name, navSrvc.logout);
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // Auxiliar function to check if the actual dataset is posetrack
        $scope.isPosetrack = function() {
            return navSrvc.isPosetrack();
        }


        // Set activeDataset to dataset
        $scope.setActiveDataset = function(dataset) {
            $scope.activeDataset = dataset;
            navSrvc.setActiveDataset(dataset);
        };

        $scope.getUserInfo = function() {
            $scope.user = navSrvc.getUser();
            $scope.activeDataset = navSrvc.getActiveDataset();
        };

        $scope.loggedIn = function() {
            return $state.current.name !== 'login';
        };

        $scope.logOut = function() {
            loginSrvc.logout($scope.user.name, navSrvc.logout);
            // navSrvc.logout();
        };

        // Activated when clicked on dropdown
        $scope.selectDataset = function(name) {
            adminDatasetsSrvc.getDataset(name, $scope.setActiveDataset);
        };

        // Function that opens the dialog that allow to change the pwd
        $scope.changePassword = function(user) {
            $mdDialog.show({
                templateUrl: '/static/views/dialogs/changePasswordDialog.html',
                locals: {
                    username: user.name
                },
                controller: 'dialogChangePasswordCtrl',
                escapeToClose: false
            });
        };

        // Watcher that detects changes in the state to get the info
        var watcher = $scope.$watch(function() {
            return $state.$current.name
        }, function(newVal, oldVal) {
            $scope.activeState = newVal;
            if (oldVal.localeCompare('login') === 0) {
                $scope.getUserInfo();
            }
        });

        $scope.goBackToTaskHome = function() {
            navSrvc.resetSessionData();
            $state.go('taskHome');
        };

        // Function to move the tool to the next range
        $scope.requestNextRange = function() {
            if ($scope.sessionData.frameEnd == $scope.sessionData.maxFrame) return; // Check if it is possible to advance

            if ($scope.sessionData.loadedCameras.length === 0) {
                $scope.sendMessage("danger", "To go to the next range at least one camera must be loaded!");
            } else {
                if ($scope.isPosetrack()) {
                    $scope.goNextRange();
                } else{                              // show table with missing annotations
                    $scope.checkAnnotations('next');
                }
            }            
        };

        // Function to move the tool to the previous range
        $scope.requestPreviousRange = function() {
            if ($scope.sessionData.frameStart == $scope.sessionData.minFrame) return; // Check if it is possible to go backwards

            if ($scope.sessionData.loadedCameras.length === 0) {
                $scope.sendMessage("danger", "To return to the previous range at least one camera must be loaded!");
            } else {
                if ($scope.isPosetrack()) {
                    $scope.goPreviousRange();
                } else{                              // show table with missing annotations
                    $scope.checkAnnotations('previous');
                }
            }              
        };

        // Send message to toolCtrl to check if all annotations are complete
        $scope.checkAnnotations = function(range) {
            $rootScope.$broadcast('checkAnnotations', {'range': range});
        };

        // Function to move the tool to the next range
        $scope.goNextRange = function() {
            if ($scope.sessionData.frameEnd + $scope.sessionData.frameRange > $scope.sessionData.maxFrame) {
                $state.go('tool', { obj: { from: $scope.sessionData.maxFrame - $scope.sessionData.frameRange, to: $scope.sessionData.maxFrame, originalRange: $scope.sessionData.frameRange, loadedCameras: $scope.sessionData.loadedCameras, canvasCameras: $scope.sessionData.canvasCameras, selectedType: $scope.sessionData.selectedType,options: $scope.sessionData.options ,fromTaskHome: false } });

            } else {
                $state.go('tool', { obj: { from: $scope.sessionData.frameStart + $scope.sessionData.frameRange, to: $scope.sessionData.frameEnd + $scope.sessionData.frameRange, originalRange: $scope.sessionData.frameRange, loadedCameras: $scope.sessionData.loadedCameras, canvasCameras: $scope.sessionData.canvasCameras,selectedType: $scope.sessionData.selectedType, options: $scope.sessionData.options  ,fromTaskHome: false } });
            }
        };

        // Function to move the tool to the previous range
        $scope.goPreviousRange = function() {
            // Check if we can go to the previous range
            if ($scope.sessionData.frameStart - $scope.sessionData.frameRange < $scope.sessionData.minFrame) {
                $state.go('tool', { obj: { from: $scope.sessionData.minFrame, to: $scope.sessionData.minFrame + $scope.sessionData.frameRange, originalRange: $scope.sessionData.frameRange, loadedCameras: $scope.sessionData.loadedCameras, canvasCameras: $scope.sessionData.canvasCameras, selectedType: $scope.sessionData.selectedType,options: $scope.sessionData.options, fromTaskHome: false } });
            } else {
                $state.go('tool', { obj: { from: $scope.sessionData.frameStart - $scope.sessionData.frameRange, to: $scope.sessionData.frameEnd - $scope.sessionData.frameRange, originalRange: $scope.sessionData.frameRange, loadedCameras: $scope.sessionData.loadedCameras, canvasCameras: $scope.sessionData.canvasCameras, selectedType: $scope.sessionData.selectedType,options: $scope.sessionData.options, fromTaskHome: false } });
            }
        };

        $scope.sendMessage = function(type, msg) {
            $rootScope.$broadcast('sendMsg', { 'type': type, 'msg': msg });
        };

        // Structure to store the notification
        $scope.notificationValues = {
            notificationMessage: "",
            showNotification: false
        }

        // Asks for the alert navbar updates
        $scope.obtainNotificationState = function() {
            var callbackSuccess = function(response) {
                $scope.notificationValues.notificationMessage = response.notificationMessage;
                $scope.notificationValues.showNotification = response.showNotification;
            }
    
            navSrvc.obtainNotificationState(callbackSuccess, $scope.sendMessage);
        }

    
        // Functions that are executed when a message is received.
        $scope.$on('advanceFrames', function(evt, data) {
            if (data.range === 'next') {
                $scope.goNextRange();
            }
            else if (data.range === 'previous'){
                $scope.goPreviousRange();
            }
        });

        // Then, it updates the info about the sessionData
        $scope.$on('sessionDataMsg', function(evt, data) {
            $scope.sessionData = navSrvc.getSessionData();
        });

        // Call to update the notification system
        setInterval(function() {
            $scope.obtainNotificationState();
        }, 60 * 5 * 1000); // Calls every 5 minutes
    }
]);