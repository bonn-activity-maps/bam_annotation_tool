angular.module('CVGTool')

    /*
     * Controller of the admin page "Videos"
     */
    .controller('adminVideosCtrl', ['$scope', '$state', 'adminVideosSrvc', '$mdDialog', function ($scope, $state, adminVideosSrvc, $mdDialog) {
        $scope.listOfVideos = [];

        // Dropzone options
        $scope.dzOptions = {
          paramName: 'file',
          chunking: true,
          forceChunking: true,
          acceptedFiles: '.mp4',
          url: '/api/video/upload',
          maxFilesize: 10240, // mb
          chunkSize: 20000000 // bytes (chunk: 20mb)
      	};

        // Dropzone event handler
        $scope.dzCallbacks = {
      		'addedfile' : function(file){
      			console.log(file);
      			$scope.newFile = file;
      		},
      		'success' : function(file, xhr){
      			console.log(file, xhr);
            $scope.unwrapVideo(file.name);
            $scope.getInfoOfVideos();
      		},
      	};

        // Function to retrieve from the server all information from the videos stored there
        $scope.getInfoOfVideos = function() {
          adminVideosSrvc.getInfoOfVideos(showListOfVideos);
        };

        // Function to retrieve unwrap the video
        $scope.unwrapVideo = function(file) {
          adminVideosSrvc.unwrapVideo(file);
        };

        var re = /(?:\.([^.]+))?$/; // Regular expression used to separate name from extension of a file

        // Function to update the list of videos
        var showListOfVideos = function (list) {
            $scope.listOfVideos = [];
            for (i = 0; i < list.length; i++) {
              $scope.listOfVideos.push({"name": list[i].name.substr(0, list[i].name.lastIndexOf('.')), "extension": list[i].name.substr(list[i].name.lastIndexOf('.')+1, list[i].length) , "duration": list[i].duration, "frames": list[i].frames});
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
        $scope.deleteVideo = function(video) {
          $mdDialog.show({
            templateUrl: '/static/views/dialogs/deleteVideoDialog.html',
            locals: {
              video: video
            },
            controller: 'dialogDeleteVideoCtrl',
            escapeToClose: false,
            onRemoving: function (event, removePromise) {
              $scope.getInfoOfVideos();
            }
          });

        };

        $scope.getInfoOfVideos();
}]);
