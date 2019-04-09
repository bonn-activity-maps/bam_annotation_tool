angular.module('CVGTool')

    .controller('adminVideosCtrl', ['$scope', '$state', 'adminVideosSrvc', function ($scope, $state, adminVideosSrvc) {
    
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
      		},
      	};

        // Function to retrieve from the server all information from the videos stored there
        $scope.getInfoOfVideos = function() {
          adminVideosSrvc.getInfoOfVideos(showListOfVideos);
        };

        // Function to update the list of videos
        var showListOfVideos = function (list) {
            $scope.listOfVideos = [];
            for (i = 0; i < list.length; i++) {
              $scope.listOfVideos.push({"name": list[i], "duration": 0});
            }
        };

        $scope.getInfoOfVideos();



}]);
