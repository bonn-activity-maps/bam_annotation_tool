angular.module('CVGTool')

    /*
     * Controller of admin page "Users"
     */
    .controller('adminUsersCtrl', ['$scope', '$state', 'adminUsersSrvc', 'navSrvc', '$mdDialog', function ($scope, $state, adminUsersSrvc, navSrvc, $mdDialog) {
        $scope.listOfUsers = [];
        $scope.avaiableRoles = [];
        $scope.userRole = "";

        $scope.activeDataset = "";


        $scope.username = "";
        $scope.email = "";
        $scope.role = "";

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

        var successCreation = function (response) {
            $mdDialog.show({
              templateUrl: '/static/views/dialogs/showPasswordDialog.html',
              locals: {
                username: response.name,
                password: response.password
              },
              controller: 'dialogShowPasswordCtrl',
              escapeToClose: false,
              onRemoving: function (event, removePromise) {
                $scope.username = "";
                $scope.email = "";
                $scope.getInfoOfUsers();
              }
            });
        };

        $scope.createUser = function() {
            adminUsersSrvc.createUser($scope.username, $scope.email, $scope.role, $scope.activeDataset, successCreation);
        };

        $scope.updateUser = function(user) {
            // adminUsersSrvc.updateUser(userName, userEmail, userRole, userDatasets); //TODO: define userData
            // This will be a reset password option, nothing more, maybe the root can change the dataset of the user, but thats all
        };

        $scope.removeUser = function(user) {
            console.log(user)

            $mdDialog.show({
              templateUrl: '/static/views/dialogs/deleteUserDialog.html',
              locals: {
                username: user.name
              },
              controller: 'dialogDeleteUserCtrl',
              escapeToClose: false,
              onRemoving: function (event, removePromise) {
                $scope.getInfoOfUsers();
              }
            });
        }

        $scope.getInfoOfUsers();
        $scope.getUserRole();
        $scope.getActiveDataset();

    }]);
