angular.module('CVGTool')

    /*
     * Controller of the admin page "Videos"
     */
    .controller('adminDatasetsCtrl', ['$scope', '$rootScope', '$state', 'adminDatasetsSrvc', 'navSrvc', '$mdDialog', function ($scope, $rootScope, $state, adminDatasetsSrvc, navSrvc, $mdDialog) {
        $scope.listOfVideos = [];
        $scope.listOfDatasets = [];
        $scope.selectedDataset = {
            name: 'none',
            type: 'none'
        };

        $scope.datasetType = 'actionInKitchen';

        $scope.unwrapping = false;

        // Set watcher to control the selector
        $scope.$watch(function(){
            return $scope.datasetType;
        }, function(newVal, oldVal){
            // $scope.dzZipOptions.headers.type = $scope.datasetType;
        });

        // Retrieve list of datasets in the system
        $scope.getListOfDatasets = function() {
            adminDatasetsSrvc.getDatasets(updateListOfDatasets, sendMessage)
        };

        // Update list of datasets variable
        var updateListOfDatasets = function(datasets) {
            $scope.listOfDatasets = datasets;
        };

        var showLoadIgnoreRegionDialog = function(videos) {
            $mdDialog.show({
                templateUrl: '/static/views/dialogs/showLoadIgnoreRegions.html',
                locals: {
                    dataset: $scope.selectedDataset,
                    files: videos.length
                },
                controller: 'dialogShowLoadIgnoreRegionsCtrl',
                escapeToClose: false,
                onRemoving: function (event, removePromise) {
                    $scope.getListOfDatasets();
                    $scope.getInfoOfVideos();
                }
            });
        }

        $scope.loadIgnoreRegions = function(dataset) {
            $scope.selectedDataset = dataset;
            adminDatasetsSrvc.getInfoOfVideos(showLoadIgnoreRegionDialog, dataset.name, sendMessage)

        }

        // Function to select a dataset and show its videos
        $scope.selectDataset = function(dataset) {
            $scope.selectedDataset = dataset;
            $scope.getInfoOfVideos();
        };

        // Function to deselect a dataset and stop showing its videos
        $scope.deselectDataset = function() {
            $scope.selectedDataset = {
                name: 'none',
                type: 'none'
            };
            $scope.getInfoOfVideos();
        };

        // Function that opens the dialog that manages the dataset removal functionality
        $scope.removeDataset = function(dataset) {
            $mdDialog.show({
                templateUrl: '/static/views/dialogs/removeDatasetDialog.html',
                locals: {
                    name: dataset.name
                },
                controller: 'dialogRemoveDatasetCtrl',
                escapeToClose: false,
                onRemoving: function (event, removePromise) {
                    $scope.getListOfDatasets();
                    $scope.getInfoOfVideos();
                }
            });
        };

        // Function that opens the dialog that manages the dataset removal functionality
        $scope.exportDataset = function(dataset) {
            $mdDialog.show({
                templateUrl: '/static/views/dialogs/exportDatasetDialog.html',
                locals: {
                    name: dataset.name,
                    type: dataset.type
                },
                controller: 'dialogExportDatasetCtrl',
                escapeToClose: false,
                onRemoving: function (event, removePromise) {
                    $scope.getListOfDatasets();
                    $scope.getInfoOfVideos();
                }
            });
        };

        // // Function that opens the dialog that manages the upload annotations to a existing dataset functionality
        // $scope.uploadAnnotations = function(files) {
        //     $mdDialog.show({
        //         templateUrl: '/static/views/dialogs/showZipFilesDialog.html',
        //         locals: {
        //             files: files
        //         },
        //         controller: 'dialogUploadAnnotationsCtrl',
        //         escapeToClose: false,
        //         onRemoving: function (event, removePromise) {
        //             $scope.getListOfDatasets();
        //             $scope.getInfoOfVideos();
        //         }
        //     }).then(function (successData) {
        //         if (successData.success) {
        //             $scope.readData(successData.filename.split(".zip")[0], successData.type)
        //         }
        //     });
        // };

        // Function that opens the dialog that manages the upload annotation
        $scope.showFoldersDialog = function(dataset, files) {
            $mdDialog.show({
                templateUrl: '/static/views/dialogs/showZipFilesDialog.html',
                locals: {
                    dataset: dataset,
                    files: files
                },
                controller: 'dialogShowFoldersCtrl',
                escapeToClose: false,
                onRemoving: function (event, removePromise) {
                    $scope.getListOfDatasets();
                    $scope.getInfoOfVideos();
                }
            });
        };

        $scope.getAnnotationFolders = function(dataset) {
            adminDatasetsSrvc.getAnnotationFolders(dataset, $scope.showFoldersDialog, sendMessage)
        };

        // Function that opens the dialog that manages the activities
        $scope.editActivities = function(dataset) {

            $mdDialog.show({
                templateUrl: '/static/views/dialogs/activitiesDialog.html',
                locals: {
                    name: dataset.name,
                    type: dataset.type
                },
                controller: 'dialogActivitiesCtrl',
                escapeToClose: false,
                onRemoving: function (event, removePromise) {
                    $scope.getListOfDatasets();
                    $scope.getInfoOfVideos();
                }
            });
        };

        // Function that opens the dialog that manages the zip files in the system available to import
        $scope.showZipFilesDialog = function(files) {
            $mdDialog.show({
                templateUrl: '/static/views/dialogs/showZipFilesDialog.html',
                locals: {
                    files: files
                },
                controller: 'dialogShowZipFilesCtrl',
                escapeToClose: false,
                onRemoving: function (event, removePromise) {
                    $scope.getListOfDatasets();
                    $scope.getInfoOfVideos();
                }
            }).then(function (successData) {
                if (successData.success) {
                    $scope.readData(successData.filename.split(".zip")[0], successData.type)
                }
            });
        };

        $scope.getZipFiles = function() {
            adminDatasetsSrvc.getZipFiles($scope.showZipFilesDialog, sendMessage)
        };

        // Function to retrieve from the server all information from the videos stored there
        $scope.getInfoOfVideos = function() {
            if ($scope.selectedDataset.name.localeCompare('none') === 0){
                $scope.listOfVideos = [];
            } else {
                adminDatasetsSrvc.getInfoOfVideos(showListOfVideos, $scope.selectedDataset.name, sendMessage);
            }
        };

        // Function to retrieve data of dataset
        $scope.readData = function(file, type) {
            sendMessage('loading', 'Loading data, please wait');
            adminDatasetsSrvc.readData(file, type, sendMessage);  /*, navSrvc.getActiveDataset(), readDataCallback);*/
        };

        // Function to update the list of videos
        var showListOfVideos = function (list) {
            $scope.listOfVideos = list;
        };

        // Send message to toast
        var sendMessage = function(type, msg, finishType) {
            $rootScope.$broadcast('sendMsg', {'type': type, 'msg': msg, 'finishType': finishType});
        };

        $scope.getListOfDatasets();
        $scope.getInfoOfVideos();

    }]);
