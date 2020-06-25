angular.module('CVGTool')

    /*
     * Controller of the admin page "Actions"
     */
    .controller('adminUserActionsCtrl', ['$scope', '$rootScope', '$state', 'adminUserActionsSrvc', 'adminDatasetsSrvc', 'adminUsersSrvc', 'navSrvc', '$mdDialog',
        function ($scope, $rootScope, $state, adminUserActionsSrvc, adminDatasetsSrvc, adminUsersSrvc, navSrvc, $mdDialog) {
        $scope.listOfActions = [];
        $scope.listOfDatasets = [];
        $scope.filteredListOfDatasets = [];
        $scope.listOfUsers = [];
        $scope.filteredListOfUsers = [];

        $scope.listOfStats = [
            {
                display: "Time worked per week",
                name: "actionsWeek",
                requires: ["user"]
            },
            {
                display: "Actions per day",
                name: "actionsDay",
                requires: ["user"]
            }];

        $scope.selectedItem = {
            name: 'none',
            type: 'none',
            assignedTo: 'none'
        };

        // Form variables to store selected dataset and user
        $scope.selectedDataset = {
            name: "None",
            type: "None"
        }
        $scope.selectedUser = {
            name: "None",
            assignedTo: []
        }
        $scope.selectedStat = {
            display: "None",
            name: "None"
};

        $scope.labels = ["Download Sales", "In-Store Sales", "Mail-Order Sales"];
        $scope.data = [300, 500, 100];

        $scope.datasetType = 'actionInKitchen';

        $scope.unwrapping = false;

        // Retrieve list of datasets in the system
        $scope.getListOfDatasets = function() {
            adminDatasetsSrvc.getDatasets(updateListOfDatasets, sendMessage)
        };

        // Update list of datasets variable
        let updateListOfDatasets = function(datasets) {
            $scope.listOfDatasets = datasets.sort(function(a, b) {
                if(a.name < b.name) { return -1; }
                if(a.name > b.name) { return 1; }
                return 0;
            });
            $scope.listOfDatasets.push({
                name: "None",
                type: "None"
            })
            $scope.filteredListOfDatasets = $scope.listOfDatasets;
        };

        // Retrieve list of users in the system
        $scope.getListOfUsers = function() {
            adminUsersSrvc.getUsers(updateListOfUsers, sendMessage)
        };

        // Update list of users variable
        let updateListOfUsers = function(users) {
            $scope.listOfUsers = users.sort(function(a, b) {
                if(a.name < b.name) { return -1; }
                if(a.name > b.name) { return 1; }
                return 0;
            });
            $scope.listOfUsers.push({
                name: "None",
                assignedTo: []
            })
            $scope.filteredListOfUsers = $scope.listOfUsers;
        };

        // Function to select a dataset
        $scope.selectDataset = function(item) {
            // Reset list
            $scope.filteredListOfUsers = [];
            let j = 0;
            // Filter list of users by dataset
            // If "None" selected, admin wants to see all users
            if ($scope.selectedDataset !== null && $scope.selectedDataset.name !== "None"){
                // For every user, check its datasets
                for(let i = 0; i < $scope.listOfUsers.length; i++) {
                    // Check if user is assigned to selected dataset
                    for (let k = 0; k < $scope.listOfUsers[i].assignedTo.length; k++) {
                        // If selected dataset is in list of datasets assigned to user, add to filtered list and go on
                        if ($scope.listOfUsers[i].assignedTo[k] === $scope.selectedDataset.name){
                            $scope.filteredListOfUsers[j] = $scope.listOfUsers[i];
                            j++;
                            break;
                        }
                    }
                }
            } else {
                $scope.filteredListOfUsers = $scope.listOfUsers;
            }
            // $scope.selectedItem = item;
            // $scope.getInfoOfActions();
        };

        // Function to select a user
        $scope.selectUser = function(item) {
            // Reset list
            $scope.filteredListOfDatasets = [];
            let j = 0;
            // Filter list of users by dataset
            // If "None" selected, admin wants to see all datasets
            if ($scope.selectedUser !== null && $scope.selectedUser.name !== "None"){
                // Add only datasets assigned to user
                for(let i = 0; i < $scope.selectedUser.assignedTo.length; i++) {
                    // If dataset is in list of datasets assigned to user, add to filtered list and go on
                        for (let k = 0; k < $scope.listOfDatasets.length; k++) {
                            if ($scope.listOfDatasets[k].name === $scope.selectedUser.assignedTo[i]) {
                                $scope.filteredListOfDatasets[j] = $scope.listOfDatasets[k];
                                j++;
                                break;
                            }
                        }
                }
            } else {
                $scope.filteredListOfDatasets = $scope.listOfDatasets;
            }
        };

        // Legacy chart code, left here because it pulls everything from DB and it can be useful
        // // Function to retrieve from the server all information from the actions stored there
        // $scope.getInfoOfActions = function() {
        //     if ($scope.selectedItem.name.localeCompare('none') === 0){
        //         $scope.listOfActions = [];
        //     } else {
        //         adminUserActionsSrvc.getUserActions($scope.selectedItem.name, $scope.selectedItem.type, showListOfActions, sendMessage)
        //     }
        // };
        //
        // // Function to update the list of actions
        // var showListOfActions = function (msg) {
        //     // $scope.listOfActions = list;
        //     $scope.drawCharts(msg.labels, msg.data);
        // };

        // Send message to toast
        var sendMessage = function(type, msg, finishType) {
            $rootScope.$broadcast('sendMsg', {'type': type, 'msg': msg, 'finishType': finishType});
        };

        let drawStatistics = function() {
            switch ($scope.selectedStat.name) {
                case "actionsDay":
                    console.log("ACTIONS PER DAY");
                    resetCharts();
                    adminUserActionsSrvc.getUserActionsByLogin($scope.selectedUser.name, getActionsCallback, sendMessage);
                    break;
                case "actionsWeek":
                    console.log("HOURS PER WEEK");
                    resetCharts();
                    adminUserActionsSrvc.getUserActionsTimeByWeek($scope.selectedUser.name, getActionsCallback, sendMessage);
                    break;
                case "None":
                    sendMessage("loading", "Please select some data to visualize.")
            }
        }

        $scope.loadStatistics = function() {
            // Lookup data depending on selection
            // Both user and dataset selected
            if ($scope.selectedUser.name !== "None" && $scope.selectedDataset.name !== "None") {
                console.log("User and dataset selected");
                drawStatistics();
            }
            // Only dataset selected
            else if($scope.selectedUser.name === "None" && $scope.selectedDataset.name !== "None") {
                console.log("Only dataset selected");
                drawStatistics();
            }
            // Only user selected
            else if($scope.selectedUser.name !== "None" && $scope.selectedDataset.name === "None") {
                console.log("Only user selected");
                drawStatistics();
            }
            // None selected
            else if($scope.selectedUser.name === "None" && $scope.selectedDataset.name === "None") {
                console.log("Nothing selected");
                sendMessage("loading", "Please select some data to visualize.")
            }
        }

        let getActionsCallback = function(response) {
            $scope.drawCharts(response.labels, response.data);
        }

        $scope.resetSelections = function() {
            $scope.selectedDataset = {
                name: "None",
                type: "None"
            }
            $scope.selectedUser = {
                name: "None",
                assignedTo: []
            }
            $scope.filteredListOfDatasets = $scope.listOfDatasets;
            $scope.filteredListOfUsers = $scope.listOfUsers;
            resetCharts();
        }

        $scope.drawCharts = function(labels, data) {
            console.log(labels)
            console.log(data)
            $scope.labels = labels;
            $scope.data = data;
        };

        let resetCharts = function() {
            $scope.labels = [];
            $scope.data = [];
        }

        $scope.getListOfDatasets();
        $scope.getListOfUsers();

    }]);
