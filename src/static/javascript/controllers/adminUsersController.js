angular.module('CVGTool')

    /*
     * Controller of admin page "Users"
     */
    .controller('adminUsersCtrl', ['$scope', '$state', 'adminUsersSrvc', 'adminDatasetsSrvc', 'navSrvc', '$mdDialog',
                        function ($scope, $state, adminUsersSrvc, adminDatasetsSrvc, navSrvc, $mdDialog) {
        $scope.listOfUsers = []; // Contains the list of users to show, this varies depending on the user.
        $scope.availableRoles = []; // Contains the list of roles that the user is allowed to create.
        $scope.userRole = ""; // Role of the actual user.

        $scope.activeDataset = ""; // Dataset of the actual user, if root, then it's 'root'
        $scope.listOfDatasets = []; // Ironically, contains the list of datasets in the system.

        // User object to store data while editing
        $scope.editUser = {
            username: "",
            email: "",
            role: "",
            dataset: []
        };
        // Variable that stores the previous name for updating purposes
        $scope.oldName = "";

        // Switch between editing and creating user.
        $scope.mode = "creation";

        // Function that retrieves the list of users from the database.
        $scope.getUsers = function() {
            if ($scope.userRole.localeCompare('root') === 0){
                adminUsersSrvc.getUsers(showListOfUsers);
            } else {
                adminUsersSrvc.getUsersByDataset($scope.activeDataset, "user", showListOfUsers);
            }
        };

        // Function to retrieve the user role
        $scope.getUserRole = function() {
            $scope.userRole = navSrvc.getUserRole();

            if ($scope.userRole.localeCompare('admin') === 0) {
                $scope.availableRoles.push({name: "user"})
            } else if ($scope.userRole.localeCompare('root') === 0) {
                $scope.availableRoles.push({name: "user"});
                $scope.availableRoles.push({name: "admin"});
            }
        };

        // Function to retrieve the user dataset
        $scope.getActiveDataset = function() {
            $scope.activeDataset = navSrvc.getActiveDataset();
            $scope.editUser.dataset.push($scope.activeDataset);
        };

        // Function to retrieve the list of dataset
        $scope.getListOfDatasets = function() {
            adminDatasetsSrvc.getDatasets(updateListOfDatasets)
        };

        // Function to update the list of datasets (the variable)
        var updateListOfDatasets = function(datasets) {
            $scope.listOfDatasets = [];
            for (let i = 0; i < datasets.length; i++) {
                $scope.listOfDatasets.push({
                    "name": datasets[i].name
                })
            }
        };

        // Function to update the list of users (the variable)
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

        // Function that pops up the modal when the user is created succesfully
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

        // Function that sends the order to create a user in the backend.
        $scope.createUser = function() {
            // let datasets = [];
            // datasets.push($scope.editUser.dataset);

            console.log($scope.editUser);
            adminUsersSrvc.createUser($scope.editUser.username, $scope.editUser.email, $scope.editUser.role,
                $scope.editUser.dataset, successCreation);
        };

        // Function that pops up the dialog to confirm if the user *really* wants to delete a user.
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

        // Function that sends the order to update a user in the backend.
        $scope.updateUser = function() {
            // let datasets = [];
            // datasets.push($scope.editUser.dataset);
            adminUsersSrvc.updateUser($scope.oldName, $scope.editUser.username, $scope.editUser.email,
                $scope.editUser.role, $scope.editUser.dataset, $scope.getUsers);
            $scope.mode = "creation";
            $scope.oldName = "";
            $scope.editUser = {
                username: "",
                email: "",
                role: "",
                dataset: []
            };
        };

        // Function that switches the mode to editing, so it fills up the editUser variable with the selected user data.
        $scope.enableEdit = function(user) {
            $scope.oldName = user.name;
            $scope.editUser.username = user.name;
            $scope.editUser.email = user.email;
            $scope.editUser.role = user.role;
            $scope.editUser.dataset = user.dataset;
            $scope.mode = "edit";
        };

        // Function that switches back to creation mode, so it resets everything.
        $scope.cancelEdit = function(){
            $scope.oldName = "";
            $scope.editUser = {
                username: "",
                email: "",
                role: "",
                dataset: []
            };
            $scope.mode = "creation";
        };

        // Function that resets the password, TODO
        $scope.resetPassword = function() {
            // pf pf pf prrr tututuu pap pap paap
        };

        $scope.getUserRole();
        $scope.getActiveDataset();
        $scope.getUsers();
        $scope.getListOfDatasets();

    }]);
