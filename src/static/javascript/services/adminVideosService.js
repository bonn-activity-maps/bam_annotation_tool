angular.module('CVGTool')

    .factory('adminVideosSrvc', function ($state, $http, $httpParamSerializer) {

      return {
          getInfoOfVideos: function (callbackSuccess) {
              $http({
                  method: 'GET',
                  url: '/api/video/info'

              }).then(function successCallback(response) {
                  if (response.data.msg.length == 0) {
                    callbackSuccess([])
                  } else {
                    var parsedArray = []
                    for (i = 0; i < response.data.msg.length; i++) {
                      parsedArray.push(JSON.parse(response.data.msg[i]))
                    }
                    callbackSuccess(parsedArray)
                  }
                }, function errorCallback(response) {
                  console.log("ERROR when retrieving info from videos.")
              });
          },

          unwrapVideo: function (videoName) {
              $http({
                  method: 'POST',
                  url: '/api/video/unwrap',
                  data: {
                    'name': videoName
                  }
              }).then(function successCallback(response) {
                // TODO: add action when unwrap is finished
                  console.log(response.data.msg)
                }, function errorCallback(response) {
                  console.log(response.data.msg)
              });
          },

          deleteVideo: function (videoName, callbackSuccess, callbackError) {
              $http({
                method: 'POST',
                url: '/api/video/delete',
                data: {
                  'name': videoName
                }
              }).then(function successCallback(response) {
                callbackSuccess(response.data.msg)
              }, function errorCallback(response) {
                  callbackError(response.data.msg)
              });
          },

          renameVideo: function (oldVideoName, newVideoName, callbackSuccess, callbackError) {
              $http({
                method: 'POST',
                url: '/api/video/rename',
                data: {
                  'oldName': oldVideoName,
                  'newName': newVideoName
                }
              }).then(function successCallback(response) {
                callbackSuccess(response.data.msg)
              }, function errorCallback(response) {
                  callbackError(response.data.msg)
              });
          }
      }
});
