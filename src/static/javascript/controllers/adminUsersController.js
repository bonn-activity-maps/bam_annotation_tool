angular.module('CVGTool')

    /*
     * Controller of admin page "Users"
     */
    .controller('adminUsersCtrl', ['$scope', '$state', 'adminUsersSrvc', 'navSrvc', function ($scope, $state, adminUsersSrvc, navSrvc) {
        $scope.listOfUsers = [];
        $scope.avaiableRoles = [];
        $scope.userRole = "";

        $scope.activeDataset = "";

        $scope.getInfoOfUsers = function() {
            adminUsersSrvc.getInfoOfUsers(showListOfUsers);
        };

        $scope.getUserRole = function() {
            $scope.userRole = navSrvc.getUserRole();

            if ($scope.userRole.localeCompare('admin') == 0) {
                $scope.avaiableRoles.push({name: "user"})
            } else if ($scope.userRole.localeCompare('root') == 0) {
                $scope.avaiableRoles.push({name: "user"});
                $scope.avaiableRoles.push({name: "admin"});
            }
        }

        $scope.getActiveDataset = function() {
            $scope.activeDataset = navSrvc.getActiveDataset();
        }

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

        // $scope.getInfoOfUsers();
        $scope.getUserRole();
        $scope.getActiveDataset();

    }]);
