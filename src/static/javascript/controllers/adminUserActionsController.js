angular.module('CVGTool')

    /*
     * Controller of the admin page "Actions"
     */
    .controller('adminUserActionsCtrl', ['$scope', '$rootScope', '$state', 'adminUserActionsSrvc', 'adminDatasetsSrvc', 'adminUsersSrvc', 'navSrvc', '$mdDialog',
        function ($scope, $rootScope, $state, adminUserActionsSrvc, adminDatasetsSrvc, adminUsersSrvc, navSrvc, $mdDialog) {
        $scope.listOfActions = [];
        $scope.listOfDatasets = [];
        $scope.listOfUsers = [];
        $scope.selectedItem = {
            name: 'none',
            type: 'none',
            assignedTo: 'none'
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
        var updateListOfDatasets = function(datasets) {
            $scope.listOfDatasets = datasets;
        };

        // Retrieve list of users in the system
        $scope.getListOfUsers = function() {
            adminUsersSrvc.getUsers(updateListOfUsers, sendMessage)
        };

        // Update list of users variable
        var updateListOfUsers = function(users) {
            $scope.listOfUsers = users;
        };

        // Function to select a dataset and show its actions
        $scope.selectDataset = function(item) {
            $scope.selectedItem = item;
            $scope.getInfoOfActions();
        };

        // Function to select a dataset and show its actions
        $scope.selectUser = function(item) {
            $scope.selectedItem = item;
            $scope.getInfoOfActionsByUser();
        };

        // Function to deselect a dataset and stop showing its actions
        $scope.deselectItem = function() {
            $scope.selectedItem = {
                name: 'none',
                type: 'none',
                assignedTo: 'none'
            };
            $scope.undrawCharts();
            $scope.getInfoOfActions();
        };

        // Function to retrieve from the server all information from the actions stored there
        $scope.getInfoOfActions = function() {
            if ($scope.selectedItem.name.localeCompare('none') === 0){
                $scope.listOfActions = [];
            } else {
                adminUserActionsSrvc.getUserActions($scope.selectedItem.name, $scope.selectedItem.type, showListOfActions, sendMessage)
            }
        };

        // Function to retrieve from the server all information from the actions by user
        $scope.getInfoOfActionsByUser = function() {
            if ($scope.selectedItem.name.localeCompare('none') === 0){
                $scope.listOfActions = [];
            } else {
                adminUserActionsSrvc.getUserActionsByLogin($scope.selectedItem.name, showListOfActions, sendMessage)
            }
        };

        // Function to update the list of actions
        var showListOfActions = function (msg) {
            // $scope.listOfActions = list;
            $scope.drawCharts(msg.labels, msg.data);
        };

        // Send message to toast
        var sendMessage = function(type, msg, finishType) {
            $rootScope.$broadcast('sendMsg', {'type': type, 'msg': msg, 'finishType': finishType});
        };

        /// CHART CODE ///
        // $scope.drawCharts = function(labels, data) {
        //     console.log(labels)
        //     console.log(data)
        //     var ctx = document.getElementById("testChart").getContext('2d');
        //     if ($scope.listOfActions.length > 0) {
        //         var myChart = new Chart(ctx, {
        //             type: 'bar',
        //             data: {
        //                 labels: labels,
        //                 datasets: [{
        //                     label: '# of Votes',
        //                     data: data,
        //                     // backgroundColor: [
        //                     //     'rgba(255, 99, 132, 0.2)',
        //                     //     'rgba(54, 162, 235, 0.2)',
        //                     //     'rgba(255, 206, 86, 0.2)',
        //                     //     'rgba(75, 192, 192, 0.2)',
        //                     //     'rgba(153, 102, 255, 0.2)',
        //                     //     'rgba(255, 159, 64, 0.2)'
        //                     // ],
        //                     // borderColor: [
        //                     //     'rgba(255, 99, 132, 1)',
        //                     //     'rgba(54, 162, 235, 1)',
        //                     //     'rgba(255, 206, 86, 1)',
        //                     //     'rgba(75, 192, 192, 1)',
        //                     //     'rgba(153, 102, 255, 1)',
        //                     //     'rgba(255, 159, 64, 1)'
        //                     // ],
        //                     borderWidth: 1
        //                 }]
        //             },
        //             options: {
        //                 scales: {
        //                     yAxes: [{
        //                         ticks: {
        //                             beginAtZero: true
        //                         }
        //                     }]
        //                 }
        //             }
        //         });
        //     }
        // };

        $scope.drawCharts = function(labels, data) {
            console.log(labels)
            $scope.labels = labels;
            $scope.data = data;
        };

        //TODO does not work
        // $scope.undrawCharts = function() {
        //     var ctx = document.getElementById("testChart").getContext('2d');
        //     if ($scope.listOfActions.length > 0) {
        //         var myChart = new Chart(ctx, {});
        //     }
        // };

        $scope.getListOfDatasets();
        $scope.getListOfUsers();
        $scope.getInfoOfActions();
        $scope.drawCharts($scope.labels, $scope.data);

    }]);
