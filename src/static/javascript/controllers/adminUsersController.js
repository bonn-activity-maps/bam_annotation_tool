angular.module('CVGTool')

    /*
     * Controller of admin page "Users"
     */
    .controller('adminVideosCtrl', ['$scope', '$state', 'adminUsersSrvc', '$mdDialog', function ($scope, $state, adminUsersSrvc, $mdDialog) {
        $scope.listOfUsers = [];

        $scope.getInfoOfUsers = function() {
            adminUsersSrvc.getInfoOfUsers(showListOfUsers);
        };

        var showListOfUsers = function (list) {
            $scope.listOfUsers = [];
            for (let i = 0; i < list.length; i++) {
                $scope.listOfUsers.push({
                    "name": list[i].name,
                    "email": list[i].email,
                    "role": list[i].role,
                    "assignedTo": list[i].assignedTo
                })
            }
        };

        var showPassword = function (response) {
            //TODO: whatever we will do with the password
        };

        $scope.createUser = function() {
            adminUsersSrvc.createUser(userName, userEmail, userRole, userDatasets, showPassword); //TODO: define userData
        };

        $scope.updateUser = function() {
            adminUsersSrvc.updateUser(userName, userEmail, userRole, userDatasets); //TODO: define userData
        };

        $scope.removeUser = function() {
            adminUsersSrvc.removeUser(userName); //TODO: define userData
        }

    }]);