angular.module('CVGTool')

    /*
     * Controller of the admin page "Actions"
     */
    .controller('adminUserActionsCtrl', ['$scope', '$rootScope', '$state', 'adminUserActionsSrvc', 'adminDatasetsSrvc', 'navSrvc', '$mdDialog',
        function ($scope, $rootScope, $state, adminUserActionsSrvc, adminDatasetsSrvc, navSrvc, $mdDialog) {
        $scope.listOfActions = [];
        $scope.listOfDatasets = [];
        $scope.selectedDataset = {
            name: 'none',
            type: 'none'
        };

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

        // Function to select a dataset and show its actions
        $scope.selectDataset = function(dataset) {
            $scope.selectedDataset = dataset;
            $scope.getInfoOfActions();
        };

        // Function to deselect a dataset and stop showing its actions
        $scope.deselectDataset = function() {
            $scope.selectedDataset = {
                name: 'none',
                type: 'none'
            };
            $scope.undrawCharts();
            $scope.getInfoOfActions();
        };

        // Function to retrieve from the server all information from the actions stored there
        $scope.getInfoOfActions = function() {
            if ($scope.selectedDataset.name.localeCompare('none') === 0){
                $scope.listOfActions = [];
            } else {
                adminUserActionsSrvc.getUserActions($scope.selectedDataset.name, $scope.selectedDataset.type, showListOfActions, sendMessage)
            }
        };

        // Function to update the list of actions
        var showListOfActions = function (list) {
            $scope.listOfActions = list;
            // $scope.drawCharts();
        };

        // Send message to toast
        var sendMessage = function(type, msg, finishType) {
            $rootScope.$broadcast('sendMsg', {'type': type, 'msg': msg, 'finishType': finishType});
        };

        /// CHART CODE ///
        $scope.drawCharts = function() {
            var ctx = document.getElementById("testChart").getContext('2d');
            if ($scope.listOfActions.length > 0) {
                var myChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                        datasets: [{
                            label: '# of Votes',
                            data: [12, 19, 3, 5, 2, 3],
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.2)',
                                'rgba(54, 162, 235, 0.2)',
                                'rgba(255, 206, 86, 0.2)',
                                'rgba(75, 192, 192, 0.2)',
                                'rgba(153, 102, 255, 0.2)',
                                'rgba(255, 159, 64, 0.2)'
                            ],
                            borderColor: [
                                'rgba(255, 99, 132, 1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(255, 206, 86, 1)',
                                'rgba(75, 192, 192, 1)',
                                'rgba(153, 102, 255, 1)',
                                'rgba(255, 159, 64, 1)'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero: true
                                }
                            }]
                        }
                    }
                });
            }
        };

        //TODO does not work
        $scope.undrawCharts = function() {
            var ctx = document.getElementById("testChart").getContext('2d');
            if ($scope.listOfActions.length > 0) {
                var myChart = new Chart(ctx, {});
            }
        };

        $scope.getListOfDatasets();
        $scope.getInfoOfActions();
    }]);
