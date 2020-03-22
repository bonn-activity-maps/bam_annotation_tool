angular.module('CVGTool')

/*
 * Controller of the dialog of the "rename stored video as administrator" action
 */
//.controller('dialogRenameVideoCtrl', ['$scope', 'adminDatasetsSrvc', 'navSrvc', '$mdDialog', 'video',
//    function ($scope, adminDatasetsSrvc, navSrvc, $mdDialog, video) {
//    $scope.mode = 'normal';
//    $scope.msg = '';
//    $scope.inputMsg = '';
//     $scope.inputError = false;
//
//    $scope.oldName = video.name;
//     $scope.newName = {};  // Odd way to manage variables with ng-model and dialogs, but it's an effective way to bypass the autism of AngularJS
//
// //Function to cancel all actions and close the dialog
//    $scope.cancel = function () {
//      $mdDialog.cancel();
//     }
//
// //Callback function if the rename worked
//    var showSuccess = function (response) {
//      $scope.mode = 'success';
//      $scope.msg = 'Video successfully renamed.'
//     }
//
// //Callback function if the rename didnt worked
//    var showError = function (response) {
//      $scope.mode = 'error';
//      $scope.msg = 'There was an error when renaming the video.'
//     }
//
// //Function to hide the error messages on click
//     $scope.hiddeError = function () {
//      $scope.inputError = false;
//      $scope.inputMsg = '';
//     }
//
//     // Function that generates the call to the server to rename the file
//     // It does some simple checking (not blank and different from the old name)
//     $scope.rename = function() {
//       if ($scope.newName.name === undefined) {
//         $scope.inputError = true;
//         $scope.inputMsg = "The new name can't be blank.";
//       } else if ($scope.newName.name.localeCompare($scope.oldName) === 0 ) {
//         $scope.inputError = true;
//         $scope.inputMsg = "The new name must be different from the old name.";
//       } else {
//         var newVideoName = $scope.newName.name + video.extension;
//         var oldVideoName = $scope.oldName + video.extension;
//         adminDatasetsSrvc.renameVideo(oldVideoName, newVideoName, navSrvc.getActiveDataset(), showSuccess, showError)
//       }
//     }
// }])

/*
 * Controller of the dialog of the "remove stored video as administrator" action
 */
//.controller('dialogRemoveVideoCtrl', ['$scope', 'adminDatasetsSrvc', 'navSrvc', '$mdDialog', 'video',
//    function ($scope, adminDatasetsSrvc, navSrvc, $mdDialog, video) {
//     var videoName = video.name + video.extension;
//
//    $scope.mode = 'normal';
//     $scope.msg = '';
//
// //Function to cancel all actions and close the dialog
//    $scope.cancel = function () {
//      $mdDialog.cancel();
//     }
//
// //Recall function if the rename worked
//    var showSuccess = function (response) {
//      $scope.mode = 'success';
//      $scope.msg = 'Video successfully removed.'
//     }
//
// //Recall function if the rename didnt worked
//    var showError = function (response) {
//      $scope.mode = 'error';
//      $scope.msg = 'There was an error when deleting the video.'
//     }
//
// //Function that generates the call to the server to remove the file
//    $scope.remove = function () {
//       adminDatasetsSrvc.removeVideo(videoName, navSrvc.getActiveDataset(), showSuccess, showError)
//    }
// }])

/*
 * Controller of the dialog of the "remove stored video as administrator" action
 */
.controller('dialogRemoveDatasetCtrl', ['$scope', 'adminDatasetsSrvc', 'navSrvc', '$mdDialog', 'name',
    function($scope, adminDatasetsSrvc, navSrvc, $mdDialog, name) {
        $scope.mode = 'normal';
        $scope.msg = '';

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        // Recall function if the rename worked
        var showSuccess = function(response) {
            $scope.mode = 'success';
            $scope.msg = 'Dataset successfully removed.'
        };

        // Recall function if the rename didnt worked
        var showError = function(response) {
            $scope.mode = 'error';
            $scope.msg = 'There was an error when deleting the dataset.'
        };

        // Function that generates the call to the server to remove the file
        $scope.remove = function() {
            adminDatasetsSrvc.removeDataset(name, showSuccess, showError)
        }
    }
])

.controller('dialogActivitiesCtrl', ['$scope', 'adminDatasetsSrvc', 'navSrvc', '$mdDialog', 'name', 'type',
    function($scope, adminDatasetsSrvc, navSrvc, $mdDialog, name, type) {
        $scope.mode = 'normal';
        $scope.msg = '';
        $scope.newActivity = '';
        $scope.activitiesList = [];
        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        var updateActivitiesList = function(list) {
            $scope.activitiesList = list["activities"];
        };


        // Recall function if the rename worked
        var showSuccess = function(response) {
            $scope.mode = 'success';
            $scope.msg = response;
            adminDatasetsSrvc.getActivitiesList(name, updateActivitiesList);
        };

        // Recall function if the rename didnt worked
        var showError = function(response) {
            $scope.mode = 'error';
            $scope.msg = response;
        };

        // Function that generates the call to the server to remove the file
        $scope.createActivity = function(activity) {
            adminDatasetsSrvc.createActivity(name, activity, showSuccess, showError);
        };

        adminDatasetsSrvc.getActivitiesList(name, updateActivitiesList);
    }
])

.controller('dialogExportDatasetCtrl', ['$scope', 'adminDatasetsSrvc', 'navSrvc', '$mdDialog', 'name', 'type',
    function($scope, adminDatasetsSrvc, navSrvc, $mdDialog, name, type) {
        $scope.mode = 'normal';
        $scope.msg = '';

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        // Recall function if the rename worked
        var showSuccess = function(response) {
            $scope.mode = 'success';
            $scope.msg = 'Dataset successfully exported.'
        };

        // Recall function if the rename didnt worked
        var showError = function(response) {
            $scope.mode = 'error';
            $scope.msg = 'There was an error when exporting the dataset.'
        };

        // Function that generates the call to the server to remove the file
        $scope.export = function() {
            adminDatasetsSrvc.exportDataset(name, type, showSuccess, showError)
        }
    }
])

/*
 * Controller of the dialog of the "upload annotations to existing dataset" action
 */
.controller('dialogExportDatasetCtrl', ['$scope', 'adminDatasetsSrvc', 'navSrvc', '$mdDialog', 'name', 'type',
    function($scope, adminDatasetsSrvc, navSrvc, $mdDialog, name, type) {
        $scope.mode = 'normal';
        $scope.msg = '';

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        // Recall function if the rename worked
        var showSuccess = function(response) {
            $scope.mode = 'success';
            $scope.msg = 'Annotations successfully uploaded.'
        };

        // Recall function if the rename didnt worked
        var showError = function(response) {
            $scope.mode = 'error';
            $scope.msg = 'There was an error when upload the annotations.'
        };

        // Function that generates the call to the server to remove the file
        $scope.export = function() {
            adminDatasetsSrvc.exportDataset(name, type, showSuccess, showError)
        }
    }
])

/*
 * Controller of the dialog of the "remove stored user as administrator" action
 */
.controller('dialogRemoveUserCtrl', ['$scope', 'adminUsersSrvc', '$mdDialog', 'username', function($scope, adminUsersSrvc, $mdDialog, username) {
    var user = username;

    $scope.mode = 'normal';
    $scope.msg = '';

    // Function that generates the call to the server to remove the file
    $scope.remove = function() {
        adminUsersSrvc.removeUser(user, showSuccess, showError)
    };

    // Function to cancel all actions and close the dialog
    $scope.cancel = function() {
        $mdDialog.cancel();
    };

    // Recall function if the rename worked
    var showSuccess = function(response) {
        $scope.mode = 'success';
        $scope.msg = 'User successfully removed.'
    };

    // Recall function if the rename didnt worked
    var showError = function(response) {
        $scope.mode = 'error';
        $scope.msg = 'There was an error when deleting the user.'
    }

}])

/*
 * Controller of the dialog of show password
 */
.controller('dialogShowPasswordCtrl', ['$scope', '$mdDialog', 'username', 'password', function($scope, $mdDialog, username, password) {
    $scope.variables = {
        username: username,
        password: password
    };

    // Function to cancel all actions and close the dialog
    $scope.cancel = function() {
        $mdDialog.cancel();
    }
}])

/*
 * Controller of the dialog of show zip files
 */
.controller('dialogShowZipFilesCtrl', ['$scope', '$mdDialog', 'files', 'adminDatasetsSrvc',
    function($scope, $mdDialog, files, adminDatasetsSrvc) {
        $scope.variables = {
            files: files,
            datasetType: ''
        };

        $scope.filename = '';
        $scope.success = false;
        $scope.mode = 'normal';
        $scope.msg = '';

        // Select a zip to load
        $scope.selectZip = function(file) {
            $scope.filename = file.name;
            $scope.mode = 'progress';
            adminDatasetsSrvc.loadZip(file.name, $scope.variables.datasetType, showSuccess, showError);
        };

        // Recall function if the rename worked
        var showSuccess = function(response) {
            $scope.mode = 'success';
            $scope.msg = response;
            $scope.success = true;
        };

        // Recall function if the rename didnt worked
        var showError = function(response) {
            $scope.mode = 'error';
            $scope.msg = response;
            $scope.success = false;
        };

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
            $scope.successData = {
                success: $scope.success,
                filename: $scope.filename,
                type: $scope.variables.datasetType
            };
            $mdDialog.hide($scope.successData);
        }
    }
])

/*
* Controller of the dialog of show zip files
*/
.controller('dialogShowFoldersCtrl', ['$scope', '$mdDialog', 'dataset', 'files', 'adminDatasetsSrvc',
    function($scope, $mdDialog, dataset, files, adminDatasetsSrvc) {
        $scope.variables = {
            files: files,
            dataset: dataset.name,
            datasetType: dataset.type
        };

        $scope.filename = '';
        $scope.success = false;
        $scope.mode = 'normal';
        $scope.msg = '';

        // Select a folder to upload
        $scope.selectZip = function(file) {
            $scope.filename = file.name;
            $scope.mode = 'progress';
            adminDatasetsSrvc.uploadAnnotations($scope.variables.dataset, $scope.variables.datasetType, $scope.filename, showSuccess, showError);
        };

        // Recall function if the rename worked
        var showSuccess = function(response) {
            $scope.mode = 'success';
            $scope.msg = response;
            $scope.success = true;
        };

        // Recall function if the rename didnt worked
        var showError = function(response) {
            $scope.mode = 'error';
            $scope.msg = response;
            $scope.success = false;
        };

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
            $scope.successData = {
                success: $scope.success,
                filename: $scope.filename,
                type: $scope.variables.datasetType
            };
            $mdDialog.hide($scope.successData);
        }
    }
])

/*
 * Controller of the dialog of the "Add new camera to the camera array" action
 */
.controller('dialogAddNewCameraCtrl', ['$scope', '$timeout', 'toolSrvc', 'navSrvc', '$mdDialog', 'loadedCameras',
    function($scope, $timeout, toolSrvc, navSrvc, $mdDialog, loadedCameras) {
        $scope.isVideoSelected = false;
        $scope.listOfVideos = [];
        $scope.loadedCameras = loadedCameras;
        $scope.activeDataset = {};

        $scope.videosSelected = {
            videos: []
        };

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.isVideoSelected = function() {
            return $scope.videosSelected.videos.length > 0;

        };

        // Function to update the list of videos
        var showListOfVideos = function(list) {
            $scope.listOfVideos = [];
            for (i = 0; i < list.length; i++) {
                if (!$scope.loadedCameras.includes(list[i].name.toString())) { // If the camera is loaded, dont show it again
                    // Add train/test/val type to posetrack
                    if ($scope.isPosetrack()) {
                        $scope.videoType = list[i].type
                    } else {
                        $scope.videoType = ''
                    }

                    $scope.listOfVideos.push({
                        "name": list[i].name,
                        "extension": list[i].extension,
                        "duration": list[i].duration,
                        "frames": list[i].frames,
                        "type": $scope.videoType
                    });
                }
            }
            $scope.listOfVideosToShow = $scope.listOfVideos.slice();
        };

        // Recall function if the rename worked
        $scope.getListOfVideos = function() {
            $scope.activeDataset = navSrvc.getActiveDataset();
            toolSrvc.getInfoOfVideos(showListOfVideos, $scope.activeDataset.name);
        };

        // Function to go back from the dialog once the frames have been retrieved from the server
        $scope.end = function() {
            if ($scope.isPosetrack()) {
                $scope.videosSelected.videos = $scope.videosSelected.videos.split(' - ')[0]
            }
            $mdDialog.hide($scope.videosSelected);
        };

        $scope.getListOfVideos();

        // Auxiliary function that encapsulates navSrvc's isPosetrack which returns True iff the activeDataset's
        // type is posetrack.
        $scope.isPosetrack = function() {
            return navSrvc.isPosetrack();
        }

    }
])

/*
 * Controller of the dialog of change user password
 */
.controller('dialogChangePasswordCtrl', ['$scope', '$mdDialog', 'navSrvc', 'username',
    function($scope, $mdDialog, navSrvc, username) {
        var user = username;

        $scope.mode = 'normal';
        $scope.warning = false;
        $scope.msg = '';
        $scope.pwd = {};

        // Function that generates the call to the server to change the pwd
        $scope.updatePwd = function() {
            if ($scope.pwd.newPwd === undefined || $scope.pwd.repeatPwd === undefined || $scope.pwd.newPwd.localeCompare($scope.pwd.repeatPwd) !== 0) {
                $scope.msg = "Passwords don't match.";
                $scope.warning = true;
            } else {
                navSrvc.changePassword(user, $scope.pwd.newPwd, showSuccess, showError)
            }
        };

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        // Hide warnings
        $scope.hideError = function(response) {
            $scope.warning = false;
        };

        // Recall function if the update worked
        var showSuccess = function(response) {
            $scope.mode = 'success';
            $scope.msg = response
        };

        // Recall function if the update didnt worked
        var showError = function(response) {
            $scope.mode = 'error';
            $scope.msg = response
        }

    }
])

/*
 * Controller of the dialog of loading
 */
// .controller('loadingDialogCtrl', ['$scope', '$mdDialog',
//     function($scope, $mdDialog) {
//         // // Event handler
//         $scope.mdDialog = $mdDialog;
//         $scope.$on('sendMsg', function(evt, data)  {
//             if (data.type == "closeLoadingDialog") {
//                 console.log("chapo")
//                 $scope.mdDialog.cancel();
//             }
//         });
//     }
// ])

/*
 * Controller of the dialog of batch delete
 */
.controller('batchDeleteCtrl', ['$scope', '$mdDialog', 'toolSrvc', 'object', 'minFrame', 'maxFrame', 'dataset', 'scene', 'username',
    function($scope, $mdDialog, toolSrvc, object, minFrame, maxFrame, dataset, scene, username) {
        $scope.object = object;
        $scope.dataset = dataset;
        $scope.scene = scene;
        $scope.username = username;
        $scope.mode = "normal";

        $scope.values = {
            deleteFrom: minFrame,
            deleteTo: minFrame + 1
        }

        $scope.minFrame = minFrame;
        $scope.maxFrame = maxFrame;

        $scope.close = function() {
            $mdDialog.cancel();
        }

        $scope.checkSlider = function() {
            // Check that values are between range
            if ($scope.values.deleteFrom < $scope.minFrame) $scope.values.deleteFrom = $scope.minFrame;
            if ($scope.values.deleteFrom > $scope.maxFrame) $scope.values.deleteFrom = $scope.maxFrame;
            if ($scope.values.deleteTo < $scope.minFrame) $scope.values.deleteTo = $scope.minFrame;
            if ($scope.values.deleteTo > $scope.maxFrame) $scope.values.deleteTo = $scope.maxFrame;
        }

        $scope.delete = function() {
            $scope.mode = "check";
        }

        $scope.cancel = function() {
            $scope.mode = "normal";
        }
        var successFunction = function() {
            var successData = {
                msg: "success",
                deleteFrom: $scope.values.deleteFrom,
                deleteTo: $scope.values.deleteTo,
                object: $scope.object
            }
            $mdDialog.hide(successData);
        }

        var errorFunction = function() {
            var successData = {
                msg: "error",
                deleteFrom: $scope.values.deleteFrom,
                deleteTo: $scope.values.deleteTo,
                object: $scope.object
            }
            $mdDialog.hide(successData)
        }

        $scope.confirm = function() {
            $scope.checkSlider();
            // Check and fix the order
            if ($scope.values.deleteFrom > $scope.values.deleteTo) {
                var aux = $scope.values.deleteFrom;
                $scope.values.deleteFrom = $scope.values.deleteTo;
                $scope.values.deleteTo = aux;
            }
            toolSrvc.batchDeleteAnnotations($scope.dataset.name, $scope.dataset.type, $scope.scene,
                $scope.values.deleteFrom, $scope.values.deleteTo, $scope.username, $scope.object.uid,
                $scope.object.type, successFunction, errorFunction);
        }
    }
])

.controller('nextFrameRangeCtrl', ['$scope', '$rootScope', '$mdDialog', 'objects', 'range',
    function($scope, $rootScope, $mdDialog, objects, range) {
        $scope.objects = objects;

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        // Function that continues to next frmae range
        $scope.continue = function() {
            $rootScope.$broadcast('advanceFrames', {'range': range});
            $mdDialog.hide();
        }
    }
]);