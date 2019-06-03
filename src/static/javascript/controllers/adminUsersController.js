angular.module('CVGTool')

    /*
     * Controller of admin page "Users"
     */
    .controller('adminUsersCtrl', ['$scope', '$state', 'adminUsersSrvc', 'adminDatasetsSrvc', 'navSrvc', '$mdDialog',
                        function ($scope, $state, adminUsersSrvc, adminDatasetsSrvc, navSrvc, $mdDialog) {
        $scope.listOfUsers = [];
        $scope.availableRoles = [];
        $scope.userRole = "";

        $scope.activeDataset = "";
        $scope.listOfDatasets = [];

        $scope.editUser = {
            username: "",
            email: "",
            role: "",
            dataset: ""
        };
        $scope.oldName = "";

        $scope.mode = "creation";

        $scope.getUsers = function() {
            if ($scope.userRole.localeCompare('root') === 0){
                adminUsersSrvc.getUsers(showListOfUsers);
            } else {
                adminUsersSrvc.getUsersByDataset($scope.activeDataset, "user", showListOfUsers);
            }
        };

        $scope.getUserRole = function() {
            $scope.userRole = navSrvc.getUserRole();

            if ($scope.userRole.localeCompare('admin') === 0) {
                $scope.availableRoles.push({name: "user"})
            } else if ($scope.userRole.localeCompare('root') === 0) {
                $scope.availableRoles.push({name: "user"});
                $scope.availableRoles.push({name: "admin"});
            }
        };

        $scope.getActiveDataset = function() {
            $scope.activeDataset = navSrvc.getActiveDataset();
            $scope.editUser.dataset = $scope.activeDataset;
        };

        $scope.getListOfDatasets = function() {
            adminDatasetsSrvc.getDatasets(updateListOfDatasets)
        };

        var updateListOfDatasets = function(datasets) {
            $scope.listOfDatasets = [];
            for (let i = 0; i < datasets.length; i++) {
                $scope.listOfDatasets.push({
                    "name": datasets[i].name
                })
            }
        };

        var showListOfUsers = function (list) {
            $scope.listOfUsers = [];
            for (let i = 0; i < list.length; i++) {
                $scope.listOfUsers.push({
                    "name": list[i].name,
                    "email": list[i].email,
                    "role": list[i].role,
                    "dataset": list[i].assignedTo
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
                $scope.getUsers();
              }
            });
        };

        $scope.createUser = function() {
            let datasets = [];
            datasets.push($scope.editUser.dataset);
            adminUsersSrvc.createUser($scope.editUser.username, $scope.editUser.email, $scope.editUser.role, datasets, successCreation);
        };

        $scope.removeUser = function(user) {
            $mdDialog.show({
              templateUrl: '/static/views/dialogs/removeUserDialog.html',
              locals: {
                username: user.name
              },
              controller: 'dialogRemoveUserCtrl',
              escapeToClose: false,
              onRemoving: function (event, removePromise) {
                $scope.getUsers();
              }
            });
        };

        $scope.updateUser = function() {
            let datasets = [];
            datasets.push($scope.editUser.dataset);
            adminUsersSrvc.updateUser($scope.oldName, $scope.editUser.username, $scope.editUser.email, $scope.editUser.role, datasets, $scope.getUsers);
            $scope.mode = "creation";
            $scope.oldName = "";
            $scope.editUser = {
                username: "",
                email: "",
                role: "",
                dataset: ""
            };
        };

        $scope.enableEdit = function(user) {
            $scope.oldName = user.name;
            $scope.editUser.username = user.name;
            $scope.editUser.email = user.email;
            $scope.editUser.role = user.role;
            $scope.editUser.dataset = user.dataset[0];
            $scope.mode = "edit";
        };

        $scope.cancelEdit = function(){
            $scope.oldName = "";
            $scope.editUser = {
                username: "",
                email: "",
                role: "",
                dataset: ""
            };
            $scope.mode = "creation";
        };

        $scope.resetPassword = function() {
            // TODO
        };

        $scope.getUserRole();
        $scope.getActiveDataset();
        $scope.getUsers();
        $scope.getListOfDatasets();

    }]);
