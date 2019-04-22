angular.module('CVGTool')

    .controller('homeCtrl', ['$scope', '$state', '$mdDialog', 'homeSrvc', function ($scope, $state, $mdDialog, homeSrvc) {

      // Variables to control the for camera views
      $scope.cameraViewSelected = "";
      $scope.isCameraViewSelected = false;

      // Variables to control the loaded cameras array
      $scope.cameraSelected = "";
      $scope.isCameraSelected = true;
      $scope.loadedCameras = [];
      $scope.recommendedFrames = "";

      function fitCanvasToContainer(canvas){
        // Make it visually fill the positioned parent
        canvas.style.width ='100%';
        canvas.style.height='100%';
        // ...then set the internal size to match
        // canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        canvas.width = canvas.height * (canvas.clientWidth / canvas.clientHeight);
      }

      var canvas1 = document.getElementById('canvas1');
      var ctx1 = canvas1.getContext('2d');
      var canvas2 = document.getElementById('canvas2');
      var ctx2 = canvas2.getContext('2d');
      var canvas3 = document.getElementById('canvas3');
      var ctx3 = canvas3.getContext('2d');
      var canvas4 = document.getElementById('canvas4');
      var ctx4 = canvas4.getContext('2d');


      fitCanvasToContainer(canvas1);
      fitCanvasToContainer(canvas2);
      fitCanvasToContainer(canvas3);
      fitCanvasToContainer(canvas4);

      $scope.addCamera = function() {
          // TODO: Select name and interval of frames to load (recommended is the number of frames of the others) from a dialog
          $mdDialog.show({
            templateUrl: '/static/views/dialogs/addNewCameraDialog.html',
            controller: 'dialogAddNewCameraCtrl',
            escapeToClose: false
          });
      }


}]);
