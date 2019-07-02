angular.module('CVGTool')

.controller('adminTasksCtrl', ['$scope', '$state', '$interval', '$mdDialog', 'adminTasksSrvc', 'navSrvc', function($scope, $state, $interval, $mdDialog, adminTasksSrvc, navSrvc) {
    $scope.listOfUsers = []; // List of existing users
    $scope.listOfDatasets = []; // List of existing datasets

    $scope.activeDataset = navSrvc.getActiveDataset().name; // Current dataset

    $scope.user = navSrvc.getUser(); // Get current user

    $scope.newTask = { // Skeleton of task creation
        name: "",
        dataset: "",
        user: ""
    };

    // Callback function for retrieving avaiable users
    var callbackSuccessGetAvaiableUsers = function(users) {
        $scope.listOfUsers = users;
    }

    // Function that retrieves all the users form the selected dataset
    $scope.getAvaiableUsers = function() {
        adminTasksSrvc.getUsersByDataset($scope.newTas.dateset, "user", callbackSuccessGetAvaiableUsers)
    }

    // Function to update the list of datasets (the variable)
    var callbackGetDatasets = function(datasets) {
        $scope.listOfDatasets = [];
        for (let i = 0; i < datasets.length; i++) {
            $scope.listOfDatasets.push({
                "name": datasets[i].name
            })
        }
    };

    $scope.getDatasets = function() {
        adminTasksSrvc.getDatasets(callbackGetDatasets);
    }

}]);