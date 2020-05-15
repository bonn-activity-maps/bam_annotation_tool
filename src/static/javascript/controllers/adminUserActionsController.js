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
        };

        // Send message to toast
        var sendMessage = function(type, msg, finishType) {
            $rootScope.$broadcast('sendMsg', {'type': type, 'msg': msg, 'finishType': finishType});
        };

        $scope.getListOfDatasets();
        $scope.getInfoOfActions();

    }]);
