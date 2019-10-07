angular.module('CVGTool')

.controller('navbarCtrl', ['$scope', '$state', 'navSrvc', 'adminDatasetsSrvc', '$mdDialog',
    function($scope, $state, navSrvc, adminDatasetsSrvc, $mdDialog) {
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
            loadedCameras: [], // Filenames of the cameras that have been loaded
            canvasCameras: ["", "", "", ""] // Filenames of the cameras that have been placed in the canvas. Each position of the array is one of the canvases
        };

        $scope.activeState = $scope.user.assignedTo[0];

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
            navSrvc.logout();
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
            $state.go('taskHome');
        }

        // Function to move the tool to the next range
        $scope.goNextRange = function() {
            // Check if its possible. Notify if its not possible.
        }

        // Function to move the tool to the previous range
        $scope.goPreviousRange = function() {

        }

        // Function that is executed when a message is received. Then, it updates the info about the sessionData
        $scope.$on('sessionDataMsg', function(evt, data) {
            $scope.sessionData = navSrvc.getSessionData();
        });
    }
]);