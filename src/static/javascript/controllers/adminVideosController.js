angular.module('CVGTool')

    .controller('adminVideosCtrl', ['$scope', '$state', function ($scope, $state) {

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

}]);
