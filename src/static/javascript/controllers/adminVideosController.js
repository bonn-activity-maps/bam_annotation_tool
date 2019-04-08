angular.module('CVGTool')

    .controller('adminVideosCtrl', ['$scope', '$state', 'adminVideosSrvc', function ($scope, $state, adminVideosSrvc) {
        $scope.listOfVideos = [{"name": "testName", "duration": 0},
        {"name": "testName", "duration": 0},
        {"name": "testName", "duration": 0}];

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
      		},
      	};

        // Function to retrieve from the server all information from the videos stored there
        $scope.getInfoOfVideos = function(showListOfVideos) {
          adminVideosSrvc.getInfoOfVideos();
        };

        // Function to update the list of videos
        var showListOfVideos = function (reponse) {
            $scope.listOfVideos = [];

            // TODO: parse the msg field from response to get info from json siguiendo un formato de 'objetos': nombre, duracion, formato, etc etc
        };

}]);
