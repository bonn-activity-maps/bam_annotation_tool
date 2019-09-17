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

        $scope.goBackToTaskHome = function() {
            $state.go('taskHome');
        }

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
    }
]);