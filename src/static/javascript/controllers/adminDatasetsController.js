angular.module('CVGTool')

    /*
     * Controller of the admin page "Videos"
     */
    .controller('adminDatasetsCtrl', ['$scope', '$state', 'adminDatasetsSrvc', 'navSrvc', '$mdDialog', function ($scope, $state, adminDatasetsSrvc, navSrvc, $mdDialog) {
        $scope.listOfVideos = [];
        $scope.listOfDatasets = [];
        $scope.selectedDataset = {
            name: 'none',
            type: 'none'
        };

        $scope.datasetType = 'actionInKitchen';

        $scope.unwrapping = false;

        // Dropzone zip options
        $scope.dzZipOptions = {
            paramName: 'file',
            chunking: true,
            forceChunking: true,
            uploadMultiple: false,
            maxFilesize: 10240, // mb
            chunkSize: 20000000, // bytes (chunk: 20mb)
            headers: {
                "type": ""
            },
            acceptedFiles: ".zip",
            url: '/api/dataset/uploadZip',
            dictDefaultMessage: 'Drop zip file here to upload a dataset.'
        };

        // Dropzone zip event handler
        $scope.dzZipCallbacks = {
            'addedfile' : function(file){
                console.log(file);
                $scope.newFile = file;
            },
            'success' : function(file, xhr) {
                console.log('finish upload, datasettype: ', $scope.datasetType)
                console.log('dataset: ', file.name.split(".zip")[0])
                $scope.getListOfDatasets();
                $scope.getInfoOfVideos();
                // TODO: Check this --> doesn't work for big datasets
                // Request to read/store in db information of dataset
                $scope.readData(file.name.split(".zip")[0], $scope.datasetType);
            }
        };

        // Set watcher to control the selector
        $scope.$watch(function(){
            return $scope.datasetType;
        }, function(newVal, oldVal){
            $scope.dzZipOptions.headers.type = $scope.datasetType;
        });

        // Retrieve list of datasets in the system
        $scope.getListOfDatasets = function() {
            adminDatasetsSrvc.getDatasets(updateListOfDatasets)
        };

        // Update list of datasets variable
        var updateListOfDatasets = function(datasets) {
            $scope.listOfDatasets = datasets;
        };

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

        // Function to retrieve from the server all information from the videos stored there
        $scope.getInfoOfVideos = function() {
            if ($scope.selectedDataset.name.localeCompare('none') === 0){
                $scope.listOfVideos = [];
            } else {
                adminDatasetsSrvc.getInfoOfVideos(showListOfVideos, $scope.selectedDataset.name);
            }
        };

        // TODO: do we need this??
        var readDataCallback = function(dataset) {
            $scope.unwrapping = false;
            console.log("Finish reading AIK data");
            // adminDatasetsSrvc.updateVideoFrames(name, dataset, $scope.getInfoOfVideos)
        };

        // Function to retrieve data of dataset
        $scope.readData = function(file, type) {
            $scope.unwrapping = true;
            adminDatasetsSrvc.readData(file, type, /*, navSrvc.getActiveDataset(),*/ readDataCallback); //TODO: añadir callback
        };

        // var unwrapFinishedCallback2 = function(dataset) {
        //     adminDatasetsSrvc.updateVideosFrames(dataset, $scope.getInfoOfVideos)
        // };

        // // Function to retrieve unwrap the video
        // $scope.unwrapVideos = function(dataset) {
        //     console.log("Unwrapping...");
        //     adminDatasetsSrvc.unwrapVideos(dataset, unwrapFinishedCallback2); //TODO: añadir callback
        // };



        // Function to update the list of videos
        var showListOfVideos = function (list) {
            $scope.listOfVideos = list;
        };

        $scope.getListOfDatasets();
        $scope.getInfoOfVideos();

    }]);
