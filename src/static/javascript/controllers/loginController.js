angular.module('CVGTool')

/*
 * Controller of the "Login" view
 */
    .controller('loginCtrl', ['$scope', '$state', 'loginSrvc', 'navSrvc', 'adminDatasetsSrvc',
        function ($scope, $state, loginSrvc, navSrvc, adminDatasetsSrvc) {

        // Feedback handling variables
        $scope.errorMsg = "";
        $scope.successMsg = "";
        $scope.error = false;

        // Login variables
        $scope.userName = "";
        $scope.password = "";

        // Hide the error login message
        $scope.hideError = function () {
            $scope.errorMsg = "";
            $scope.error = false;
            $scope.password = "";
        };

        // var setActiveDataset = function (dataset) {
        //     navSrvc.setActiveDataset(dataset);
        // };

        // Callback function to show the error message
        var showError = function (error) {
            $scope.errorMsg = error;
            $scope.error = true;
        };

        // Callback function to redirect the user if the login worked
        var successRedirect = function (user) {
            navSrvc.setUser(user);
            if (user.role.localeCompare('user') === 0) { // NOT assign dataset automatically, select in task page
                // adminDatasetsSrvc.get_dataset(user.assignedTo[0], setActiveDataset);
                $state.go('taskHome');
            } else {
                // adminDatasetsSrvc.get_dataset(user.assignedTo[0], setActiveDataset);
                $state.go('adminStatistics');
            }
        };

        // Function to login
        $scope.login = function () {
            loginSrvc.login($scope.userName, $scope.password, successRedirect, showError);
        };
    }]);
