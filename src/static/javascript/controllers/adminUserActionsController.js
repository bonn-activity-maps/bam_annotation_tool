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

        $scope.statType = "";

        $scope.loadingScreenManager = new LoadingScreenManager();

        let drawTable = function(response) {
            $scope.statType = "table";
            $scope.labels = response.labels;
            $scope.data = response.data;
            $scope.loadingScreenManager.closeLoadingScreen();
        }

        let drawCharts = function(response) {
            $scope.statType = "chart";
            $scope.labels = response.labels;
            $scope.data = response.data;
            $scope.loadingScreenManager.closeLoadingScreen();
        };

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

        let resetCharts = function() {
            $scope.statType = "";
            $scope.labels = [];
            $scope.data = [];
        }

        $scope.listOfStats = [
        {
            display: "Actions per session",
            name: "actionsSession",
            requires: ["user"],
            info: "Select a user to see the total amount of actions made per session",
            method: adminUserActionsSrvc.getUserActionsBySession,
            callbackFunction: drawCharts
        },
        {
            display: "Hours worked per week",
            name: "actionsWeek",
            requires: ["user"],
            info: "Select a user and dataset to see the total amount of hours they worked last week.",
            method: adminUserActionsSrvc.getUserActionsTimeByWeek,
            callbackFunction: drawCharts
        },
        {
            display: "Actions per day",
            name: "actionsDay",
            requires: ["user", "dataset"],
            info: "Select a user and a dataset to see the total number of actions they did every day.",
            method: adminUserActionsSrvc.getUserActionsByDay,
            callbackFunction: drawCharts
        },
        {
            display: "Time spent per sequence",
            name: "timePerSequence",
            requires: ["dataset"],
            info: "Select a dataset to see how much time users have spent on each sequence.",
            method: adminUserActionsSrvc.getUserActionsTimeSpentPerSequence,
            callbackFunction: drawTable
        },
        {
            display: "Time stats per sequence",
            name: "timeStatsPerSequence",
            requires: ["dataset"],
            info: "Select a dataset to see the average, minimum and maximum time users have spent annotating each sequence.",
            method: adminUserActionsSrvc.getUserActionsSequenceTimeStats,
            callbackFunction: drawTable
        },
        {
            display: "Time stats per sequence div. by persons",
            name: "timeStatsPerSequenceByPersons",
            requires: ["dataset"],
            info: "Select a dataset to see the average, minimum and maximum time users have spent annotating each sequence, " +
                "divided by the number of persons in the sequence.",
            method: adminUserActionsSrvc.getUserActionsSequenceTimeStatsByPersons,
            callbackFunction: drawTable                
        },
        {
            display: "Average actions per minute",
            name: "avgUserActionsPerMinute",
            requires: ["dataset", "user"],
            info: "Select a user or dataset to see its average actions per minute. Select both to see the average" +
                "actions per minute of the user in that dataset.",
            method: adminUserActionsSrvc.getUserActionsPerMinute,
            callbackFunction: drawCharts
        }
        ];

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
            name: "None",
            requires: [],
            info: ""
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
            // Check if there is a stat selected
            if ($scope.selectedStat.name.localeCompare("None") === 0) {
                sendMessage("warning", "Please select some data to visualize.");
                return;
            }

            // Reset previous charts
            resetCharts();

            $scope.loadingScreenManager.setLoadingScreen();

            // Call the asigned method with the correct number of parameters
            if ($scope.selectedStat.requires.includes("user") && $scope.selectedStat.requires.includes("dataset")) {
                $scope.selectedStat.method($scope.selectedUser, $scope.selectedDataset, $scope.selectedStat.callbackFunction, sendMessage);
            } else if ($scope.selectedStat.requires.includes("user")) {
                $scope.selectedStat.method($scope.selectedUser, $scope.selectedStat.callbackFunction, sendMessage);
            } else if ($scope.selectedStat.requires.includes("dataset")) {
                $scope.selectedStat.method($scope.selectedDataset, $scope.selectedStat.callbackFunction, sendMessage);
            }
        }

        $scope.loadStatistics = function() {
            // Lookup data depending on selection
            // Both user and dataset selected
            if ($scope.selectedUser.name !== "None" && $scope.selectedDataset.name !== "None") {
                drawStatistics();
            }
            // Only dataset selected
            else if($scope.selectedUser.name === "None" && $scope.selectedDataset.name !== "None") {
                drawStatistics();
            }
            // Only user selected
            else if($scope.selectedUser.name !== "None" && $scope.selectedDataset.name === "None") {
                drawStatistics();
            }
            // None selected
            else if($scope.selectedUser.name === "None" && $scope.selectedDataset.name === "None") {
                sendMessage("warning", "Please select some data to visualize.")
            }
        }

        

        $scope.getListOfDatasets();
        $scope.getListOfUsers();


        function LoadingScreenManager() {
            var _this = this;
            // VARIABLES //
            _this.loading = false;
            _this.loadingCounter = 0;

            // FUNCTIONS //
            // Sets the loading screen
            _this.setLoadingScreen = function() {
                _this.loading = true;
                _this.loadingCounter++;
            }

            // Unsets the loading screen
            _this.closeLoadingScreen = function() {
                _this.loadingCounter--;
                if (_this.loadingCounter <= 0) _this.loading = false;
            }
        }

    }]);
