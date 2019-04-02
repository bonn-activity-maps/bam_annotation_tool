angular.module('CVGTool')

    .controller('adminCtrl', ['$scope', '$state', function ($scope, $state) {

        // Dropzone options
        $scope.dzOptions = {
          paramName: 'file',
          chunking: true,
          forceChunking: true,
          url: '/uploadVideo',
          maxFilesize: 1025, // megabytes
          chunkSize: 1000000 // bytes
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
