angular.module('CVGTool')

    /*
     * Controller of the admin page "Videos"
     */
    .controller('adminDatasetsCtrl', ['$scope', '$state', 'adminDatasetsSrvc', 'navSrvc', '$mdDialog', function ($scope, $state, adminDatasetsSrvc, navSrvc, $mdDialog) {
        $scope.listOfVideos = [];
        $scope.datasetType = 'actionInKitchen';

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
            'success' : function(file, xhr){
                console.log(file, xhr);
                adminDatasetsSrvc.createDataset(file.name, $scope.selectType, $scope.getInfoOfVideos);
                console.log("unwrapping videos if " + $scope.selectType + " === " + " actionInKitchen ");
                if($scope.selectType === "actionInKitchen"){
                    console.log("True, unwrapping videos of dataset: " + file.name);
                    $scope.unwrapVideos(file.name)
                }
                $scope.getInfoOfVideos();
            },
        };

        // Set watcher to control the selector
        $scope.$watch(function(){
            return $scope.datasetType;
        }, function(newVal, oldVal){
            $scope.dzZipOptions.headers.type = $scope.datasetType;
        })

        // Function to retrieve from the server all information from the videos stored there
        $scope.getInfoOfVideos = function() {
          adminDatasetsSrvc.getInfoOfVideos(showListOfVideos, navSrvc.getActiveDataset());
        };

        var unwrapFinishedCallback = function(name, dataset) {
            adminDatasetsSrvc.updateVideoFrames(name, dataset, $scope.getInfoOfVideos)
        };

        var unwrapFinishedCallback2 = function(dataset) {
            adminDatasetsSrvc.updateVideosFrames(dataset, $scope.getInfoOfVideos)
        };

        // Function to retrieve unwrap the video
        $scope.unwrapVideos = function(dataset) {
            console.log("Unwrapping...");
            adminDatasetsSrvc.unwrapVideos(dataset, unwrapFinishedCallback2); //TODO: añadir callback
        };

        // Function to retrieve unwrap the video
        $scope.unwrapVideo = function(file) {
          adminDatasetsSrvc.unwrapVideo(file, navSrvc.getActiveDataset(), unwrapFinishedCallback); //TODO: añadir callback
        };

        // Function to update the list of videos
        var showListOfVideos = function (list) {
            $scope.listOfVideos = [];
            for (i = 0; i < list.length; i++) {
              $scope.listOfVideos.push({"name": list[i].name, "dataset": list[i].dataset, "extension": list[i].extension,
                  "duration": list[i].duration, "frames": list[i].frames, "type": list[i].type});
            }
        };

        // Function that opens the dialog that manages the file rename functionality
        $scope.renameVideo = function(video) {
          $mdDialog.show({
            templateUrl: '/static/views/dialogs/renameVideoDialog.html',
            locals: {
              video: video
            },
            controller: 'dialogRenameVideoCtrl',
            escapeToClose: false,
            onRemoving: function(event, removePromise) {
              $scope.getInfoOfVideos();
            }
          });
        };

        // Function that opens the dialog that manages the file removal functionality
        $scope.removeVideo = function(video) {
          $mdDialog.show({
            templateUrl: '/static/views/dialogs/removeVideoDialog.html',
            locals: {
              video: video
            },
            controller: 'dialogRemoveVideoCtrl',
            escapeToClose: false,
            onRemoving: function (event, removePromise) {
              $scope.getInfoOfVideos();
            }
          });

        };

        $scope.getInfoOfVideos();
}]);
