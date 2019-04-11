angular.module('CVGTool')

    /*
     * Controller of the dialog of the "rename stored video as administrator" action
     */
    .controller('dialogRenameVideoCtrl', ['$scope','adminVideosSrvc', '$mdDialog', 'video', function ($scope, adminVideosSrvc, $mdDialog, video) {
        $scope.mode = 'normal';
        $scope.msg = '';
        $scope.inputMsg = '';
        $scope.inputError = false;

        $scope.oldName = video.name;
        $scope.newName = {};  // Odd way to manage variables with ng-model and dialogs, but it's an effective way to bypass the autism of AngularJS

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
          $mdDialog.hide();
        }

        // Callback function if the rename worked
        var showSuccess = function(response) {
          $scope.mode = 'success';
          $scope.msg = 'Video successfully renamed.'
        }

        // Callback function if the rename didnt worked
        var showError = function(response) {
          $scope.mode = 'error';
          $scope.msg = 'There was an error when renaming the video.'
        }

        // Function to hide the error messages on click
        $scope.hiddeError = function() {
          $scope.inputError = false;
          $scope.inputMsg = '';
        }

        // Function that generates the call to the server to rename the file
        // It does some simple checking (not blank and different from the old name)
        $scope.rename = function() {
          if ($scope.newName.name === undefined) {
            $scope.inputError = true;
            $scope.inputMsg = "The new name can't be blank.";
          } else if ($scope.newName.name.localeCompare($scope.oldName) == 0 ) {
            $scope.inputError = true;
            $scope.inputMsg = "The new name must be different from the old name.";
          } else {
            var newVideoName = $scope.newName.name + '.' + video.extension;
            var oldVideoName = $scope.oldName + '.' + video.extension;
            adminVideosSrvc.renameVideo(oldVideoName, newVideoName, showSuccess, showError)
          }
        }
    }])

    /*
     * Controller of the dialog of the "remove stored video as administrator" action
     */
    .controller('dialogDeleteVideoCtrl', ['$scope','adminVideosSrvc', '$mdDialog', 'video', function ($scope, adminVideosSrvc, $mdDialog, video) {
        console.log(video)
        var videoName = video.name + '.' + video.extension;

        $scope.mode = 'normal';
        $scope.msg = '';

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
          $mdDialog.hide();
        }

        // Recall function if the rename worked
        var showSuccess = function(response) {
          $scope.mode = 'success';
          $scope.msg = 'Video successfully deleted.'
        }

        // Recall function if the rename didnt worked
        var showError = function(response) {
          $scope.mode = 'error';
          $scope.msg = 'There was an error when deleting the video.'
        }

        // Function that generates the call to the server to delete the file
        $scope.delete = function() {
          adminVideosSrvc.deleteVideo(videoName, showSuccess, showError)
        }
    }]);
