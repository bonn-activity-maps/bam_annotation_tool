angular.module('CVGTool')

    .controller('adminVideosCtrl', ['$scope', '$state', 'adminVideosSrvc', '$mdDialog', function ($scope, $state, adminVideosSrvc, $mdDialog) {
        $scope.listOfVideos = [];

        // $scope.getInfoOfVideos();

        // Dropzone options
        $scope.dzOptions = {
          paramName: 'file',
          chunking: true,
          forceChunking: true,
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
            $scope.getInfoOfVideos();
      		},
      	};

        // Function to retrieve from the server all information from the videos stored there
        $scope.getInfoOfVideos = function() {
          adminVideosSrvc.getInfoOfVideos(showListOfVideos);
        };

        var re = /(?:\.([^.]+))?$/;

        // Function to update the list of videos
        var showListOfVideos = function (list) {
            $scope.listOfVideos = [];
            for (i = 0; i < list.length; i++) {
              $scope.listOfVideos.push({"name": list[i].substr(0, list[i].lastIndexOf('.')), "extension": list[i].substr(list[i].lastIndexOf('.')+1, list[i].length) , "duration": 0});
            }
        };

        $scope.renameVideo = function(video) {
          // Open modal to rename video
        };

        $scope.deleteVideo = function(video) {
          var parentElement = angular.element(document.body);
          $mdDialog.show({
            parent: parentElement,
            templateUrl: '/static/views/modals/deleteVideoModal.html',
            locals: {
              video: video,
              service: adminVideosSrvc
            },
            controller: DeleteVideoModalController,
            escapeToClose: false,
            onRemoving: function (event, removePromise) {
              $scope.getInfoOfVideos();
            }
          });

        };

        // DELETE MODAL CONTROLLER
        function DeleteVideoModalController($scope, $mdDialog, video, service) {
          $scope.service = service;
          console.log(video);

          var videoName = video.name + '.' + video.extension;

          $scope.mode = 'normal';
          $scope.msg = '';

          $scope.cancel = function() {
            $mdDialog.hide();
          }

          var showSuccess = function(response) {
            $scope.mode = 'success';
            $scope.msg = 'Video successfully deleted.'
          }

          var showError = function(response) {
            $scope.mode = 'error';
            $scope.msg = 'There was an error deleting the video.'
          }

          $scope.delete = function() {
            $scope.service.deleteVideo(videoName, showSuccess, showError)
          }
        }

        $scope.getInfoOfVideos();
}]);
